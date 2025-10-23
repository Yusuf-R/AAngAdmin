import getModels from "@/server/models/AAng/AAngLogistics";
import getConversationModel from "@/server/models/Conversation"
import getMessageModel from "@/server/models/Message"

const Conversation = await getConversationModel();
const Message = await getMessageModel();
const {AAngBase, Client, Driver, Admin} = await getModels();

// Helper function to serialize MongoDB documents
const serializeDoc = (doc) => {
    if (!doc) return null;
    if (Array.isArray(doc)) return doc.map(serializeDoc);

    const plain = doc.toObject ? doc.toObject() : doc;
    return JSON.parse(JSON.stringify(plain));
};

const standardRole = (r) => {
    return r.charAt(0).toUpperCase() + r.slice(1)
}

class ChatController {

    /**
     * Get initial data for SSR - includes both users and recent conversations
     */
    static async getInitialChatData({adminUserId, page = 1, limit = 600}) {
        try {
            // Fetch users from all roles
            const [admins, clients, drivers] = await Promise.all([
                Admin.find({status: 'Active'})
                    .select('fullName avatar phoneNumber email role')
                    .limit(50)
                    .lean(),

                Client.find({status: 'Active'})
                    .select('fullName avatar phoneNumber email role')
                    .limit(275)
                    .lean(),

                Driver.find({
                    status: 'Active',
                    'verification.overallStatus': {$in: ['approved', 'submitted']}
                })
                    .select('fullName avatar phoneNumber email role vehicleDetails.type availabilityStatus')
                    .limit(275)
                    .lean()
            ]);

            // Get recent/active conversations
            const recentConversations = await Conversation.find({
                'participants.userId': adminUserId,
                status: 'open'
            })
                .sort({pinned: -1, lastMessageAt: -1})
                .limit(50)
                .lean();

            // Enrich conversations with participant info
            const enrichedConversations = await Promise.all(
                recentConversations.map(async (conv) => {
                    const otherParticipant = conv.participants.find(
                        p => p.userId.toString() !== adminUserId.toString()
                    );

                    if (!otherParticipant) return null;

                    const user = await AAngBase.findById(otherParticipant.userId)
                        .select('fullName avatar phoneNumber role status')
                        .lean();

                    const lastMessage = await Message.findOne({conversationId: conv._id})
                        .sort({createdAt: -1})
                        .select('body senderId senderRole createdAt kind')
                        .lean();

                    const adminParticipant = conv.participants.find(
                        p => p.userId.toString() === adminUserId.toString()
                    );
                    const unreadCount = Math.max(0, conv.messageCount - (adminParticipant?.lastReadSeq || 0));

                    return {
                        ...conv,
                        userInfo: user,
                        lastMessage,
                        unreadCount
                    };
                })
            );

            const validConversations = enrichedConversations.filter(conv => conv !== null);

            // Calculate statistics
            const stats = {
                totalUsers: admins.length + clients.length + drivers.length,
                admins: admins.length,
                clients: clients.length,
                drivers: drivers.length,
                activeChats: validConversations.length,
                unreadChats: validConversations.filter(c => c.unreadCount > 0).length,
                pinnedChats: validConversations.filter(c => c.pinned).length
            };

            return {
                success: true,
                data: serializeDoc({
                    users: {
                        admins,
                        clients,
                        drivers,
                        all: [...admins, ...clients, ...drivers]
                    },
                    conversations: validConversations,
                    stats,
                    pagination: {
                        page,
                        limit,
                        totalUsers: stats.totalUsers
                    }
                })
            };
        } catch (error) {
            console.error('Error fetching initial chat data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search users across all roles
     */
    static async searchUsers({query, role = 'all', page = 1, limit = 20}) {
        try {
            const searchRegex = new RegExp(query, 'i');
            const searchFilter = {
                $or: [
                    {fullName: searchRegex},
                    {email: searchRegex},
                    {phoneNumber: searchRegex}
                ],
                status: 'Active'
            };

            let users = [];

            if (role === 'all') {
                const [adminResults, clientResults, driverResults] = await Promise.all([
                    Admin.find(searchFilter)
                        .select('fullName avatar phoneNumber email role')
                        .limit(Math.floor(limit / 3))
                        .lean(),
                    Client.find(searchFilter)
                        .select('fullName avatar phoneNumber email role')
                        .limit(Math.floor(limit / 3))
                        .lean(),
                    Driver.find({
                        ...searchFilter,
                        'verification.overallStatus': {$in: ['approved', 'submitted']}
                    })
                        .select('fullName avatar phoneNumber email role vehicleDetails.type')
                        .limit(Math.floor(limit / 3))
                        .lean()
                ]);

                users = [...adminResults, ...clientResults, ...driverResults];
            } else if (role === 'admin') {
                users = await Admin.find(searchFilter)
                    .select('fullName avatar phoneNumber email role')
                    .limit(limit)
                    .lean();
            } else if (role === 'client') {
                users = await Client.find(searchFilter)
                    .select('fullName avatar phoneNumber email role')
                    .limit(limit)
                    .lean();
            } else if (role === 'driver') {
                users = await Driver.find({
                    ...searchFilter,
                    'verification.overallStatus': {$in: ['approved', 'submitted']}
                })
                    .select('fullName avatar phoneNumber email role vehicleDetails.type availabilityStatus')
                    .limit(limit)
                    .lean();
            }

            return {
                success: true,
                data: serializeDoc({
                    users,
                    query,
                    resultCount: users.length
                })
            };
        } catch (error) {
            console.error('Error searching users:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get or create conversation when user clicks on a user
     */
    static async getOrCreateConversation({adminId, targetUserId, orderId = null}) {
        try {
            const targetUser = await AAngBase.findById(targetUserId)
                .select('role')
                .lean();

            if (!targetUser) {
                return {
                    success: false,
                    error: 'Target user not found'
                };
            }

            if (adminId === targetUser._id || adminId === targetUserId) {
                return {
                    success: false,
                    error: 'Cyclic Error'
                }
            }

            // Determine conversation type
            let type;
            const targetRole = targetUser.role.toLowerCase();

            if (targetRole === 'admin') type = 'ADMIN_ADMIN';
            else if (targetRole === 'client') type = 'ADMIN_CLIENT';
            else if (targetRole === 'driver') type = 'ADMIN_DRIVER';

            // Check if conversation already exists
            const existingConv = await Conversation.findOne({
                type,
                orderId: orderId || null,
                'participants.userId': {$all: [adminId, targetUserId]}
            });

            if (existingConv) {
                const enrichedConv = await this._enrichConversation(existingConv, adminId);
                return {
                    success: true,
                    data: serializeDoc(enrichedConv),
                    isNew: false
                };
            }

            // Create new conversation
            const deleteControl = type === 'DRIVER_CLIENT' ? 'ADMIN_OR_AUTO' : 'ADMIN_ONLY';

            const newConversation = await Conversation.create({
                type,
                orderId,
                participants: [
                    {userId: adminId, role: 'Admin', lastReadSeq: 0},
                    {userId: targetUserId, role: standardRole(targetRole), lastReadSeq: 0}
                ],
                status: 'open',
                deleteControl,
                createdBy: adminId,
                lastActivityBy: adminId
            });

            const enrichedConv = await this._enrichConversation(newConversation, adminId);

            return {
                success: true,
                data: serializeDoc(enrichedConv),
                isNew: true
            };
        } catch (error) {
            console.error('Error creating conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper: Enrich conversation with user info and last message
     */
    static async _enrichConversation(conversation, currentUserId) {
        const otherParticipant = conversation.participants.find(
            p => p.userId.toString() !== currentUserId.toString()
        );

        const user = await AAngBase.findById(otherParticipant.userId)
            .select('fullName avatar phoneNumber role status')
            .lean();

        const lastMessage = await Message.findOne({conversationId: conversation._id})
            .sort({createdAt: -1})
            .select('body senderId senderRole createdAt kind')
            .lean();

        const currentParticipant = conversation.participants.find(
            p => p.userId.toString() === currentUserId.toString()
        );
        const unreadCount = Math.max(0, conversation.messageCount - (currentParticipant?.lastReadSeq || 0));

        return {
            ...(conversation.toObject ? conversation.toObject() : conversation),
            userInfo: user,
            lastMessage,
            unreadCount
        };
    }

    /**
     * Get messages for a conversation
     */
    static async getConversationMessages({conversationId, userId, page = 1, limit = 50}) {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                'participants.userId': userId
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Conversation not found or access denied'
                };
            }

            const totalMessages = conversation.messageCount;

            const messages = await Message.find({
                conversationId,
                deletedAt: null
            })
                .sort({createdAt: -1})
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            messages.reverse();

            return {
                success: true,
                data: serializeDoc({
                    messages,
                    pagination: {
                        page,
                        limit,
                        totalPages: Math.ceil(totalMessages / limit),
                        totalResults: totalMessages,
                        hasNextPage: page * limit < totalMessages,
                        hasPrevPage: page > 1
                    }
                })
            };
        } catch (error) {
            console.error('Error fetching messages:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete conversation from chat history
     */
    static async removeFromChatHistory({conversationId}) {
        try {

            await Message.deleteMany({conversationId});
            await Conversation.deleteOne({_id: conversationId});

            return {success: true};
        } catch (error) {
            console.error('Error deleting conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send a new message
     */
    static async sendMessage({conversationId, userId, userRole, messageData}) {
        try {
            const conversation = await Conversation.findOneAndUpdate(
                {
                    _id: conversationId,
                    'participants.userId': userId
                },
                {
                    $inc: {nextSeq: 1, messageCount: 1},
                    $set: {
                        lastMessageAt: new Date(),
                        lastActivityBy: userId
                    }
                },
                {new: true}
            );

            if (!conversation) {
                return {
                    success: false,
                    error: 'Conversation not found or access denied'
                };
            }

            const newMessage = await Message.create({
                conversationId,
                seq: conversation.nextSeq - 1,
                senderId: userId,
                senderRole: standardRole(userRole),
                kind: messageData.kind || 'text',
                body: messageData.body,
                mediaRef: messageData.mediaRef,
                createdAt: new Date()
            });

            return {
                success: true,
                data: serializeDoc(newMessage)
            };
        } catch (error) {
            console.error('Error sending message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark messages as read
     */
    static async markChatAsRead({conversationId, userId, lastReadSeq}) {
        try {
            await Conversation.updateOne(
                {
                    _id: conversationId,
                    'participants.userId': userId
                },
                {
                    $set: {'participants.$.lastReadSeq': lastReadSeq}
                }
            );

            return {success: true};
        } catch (error) {
            console.error('Error marking as read:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new conversation
     */
    static async createConversation({initiatorId, initiatorRole, targetUserId, targetRole, orderId = null}) {
        try {
            // Determine conversation type
            let type;
            const roles = [initiatorRole, targetRole].sort().join('_');

            if (roles === 'admin_admin') type = 'ADMIN_ADMIN';
            else if (roles === 'admin_client') type = 'ADMIN_CLIENT';
            else if (roles === 'admin_driver') type = 'ADMIN_DRIVER';
            else if (roles === 'client_driver') type = 'DRIVER_CLIENT';

            // Check if conversation already exists
            const existingConv = await Conversation.findOne({
                type,
                orderId: orderId || null,
                'participants.userId': {$all: [initiatorId, targetUserId]}
            });

            if (existingConv) {
                return {
                    success: true,
                    data: serializeDoc(existingConv),
                    isNew: false
                };
            }

            const deleteControl = type === 'DRIVER_CLIENT' ? 'ADMIN_OR_AUTO' : 'ADMIN_ONLY';

            const newConversation = await Conversation.create({
                type,
                orderId,
                participants: [
                    {userId: initiatorId, role: initiatorRole, lastReadSeq: 0},
                    {userId: targetUserId, role: targetRole, lastReadSeq: 0}
                ],
                status: 'open',
                deleteControl,
                createdBy: initiatorId,
                lastActivityBy: initiatorId
            });

            return {
                success: true,
                data: serializeDoc(newConversation),
                isNew: true
            };
        } catch (error) {
            console.error('Error creating conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pin/Unpin conversation
     */
    static async togglePin({conversationId, userId}) {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                'participants.userId': userId
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Conversation not found'
                };
            }

            conversation.pinned = !conversation.pinned;
            await conversation.save();

            return {
                success: true,
                data: {pinned: conversation.pinned}
            };
        } catch (error) {
            console.error('Error toggling pin:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete conversation (Admin only)
     */
    static async deleteConversation({conversationId, userId, userRole}) {
        try {
            if (userRole !== 'admin') {
                return {
                    success: false,
                    error: 'Only admins can delete conversations'
                };
            }

            await Message.deleteMany({conversationId});
            await Conversation.deleteOne({_id: conversationId});

            return {success: true};
        } catch (error) {
            console.error('Error deleting conversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup expired DRIVER_CLIENT conversations
     */
    static async cleanupExpiredConversations() {
        try {
            const now = new Date();

            const expiredConvos = await Conversation.find({
                deleteControl: 'ADMIN_OR_AUTO',
                eligibleForCleanupAt: {$lte: now},
                pinned: false
            }).select('_id');

            const conversationIds = expiredConvos.map(c => c._id);

            if (conversationIds.length === 0) {
                return {
                    success: true,
                    deleted: 0
                };
            }

            await Message.deleteMany({
                conversationId: {$in: conversationIds}
            });

            const result = await Conversation.deleteMany({
                _id: {$in: conversationIds}
            });

            console.log(`Cleaned up ${result.deletedCount} expired conversations`);

            return {
                success: true,
                deleted: result.deletedCount
            };
        } catch (error) {
            console.error('Error in cleanup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default ChatController;