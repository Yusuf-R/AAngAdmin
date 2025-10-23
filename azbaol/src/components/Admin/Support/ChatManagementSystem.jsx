'use client';

import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {
    MessageCircle, Search, Truck, Shield, Send, Paperclip,
    MoreVertical, Clock, Check, CheckCheck, AlertCircle,
    Pin, Trash2, Archive, RefreshCw, Phone, Info,
    Circle, File, User as UserIcon, Package, ArrowLeft, X, Mail
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import {queryClient} from "@/lib/queryClient"
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useRouter} from "next/navigation";
import AdminUtils from '@/utils/AdminUtils';
import {toast} from 'sonner';

function timeAgo(dateInput) {
    let date;
    if (dateInput && typeof dateInput === 'object' && dateInput.$date) {
        date = new Date(dateInput.$date);
    } else {
        date = new Date(dateInput);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Just now';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    // For older dates, show actual date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(date) {
    const now = new Date();
    const msgDate = new Date(date);
    const isToday = now.toDateString() === msgDate.toDateString();

    if (isToday) {
        return msgDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
    }
    return msgDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

// User List Item Component
const UserListItem = ({user, onClick}) => {
    const isOnline = user.availabilityStatus === 'online' || user.status === 'Active';

    return (
        <div
            onClick={() => onClick(user)}
            className="p-4 cursor-pointer border-b transition-all hover:bg-muted/50 hover:border-l-4 hover:border-l-blue-600"
        >
            <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar}/>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"/>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">
                            {user.fullName || 'Unknown User'}
                        </h4>
                        <Badge variant="secondary" className="text-xs capitalize ml-2 flex-shrink-0">
                            {user.role}
                        </Badge>
                    </div>

                    <div className="space-y-1">
                        {user.phoneNumber && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3"/>
                                {user.phoneNumber}
                            </p>
                        )}
                        {user.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0"/>
                                <span className="truncate">{user.email}</span>
                            </p>
                        )}
                        {user.vehicleDetails?.type && (
                            <div className="flex items-center gap-1">
                                <Truck className="w-3 h-3 text-muted-foreground"/>
                                <Badge variant="outline" className="text-xs capitalize">
                                    {user.vehicleDetails.type}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Conversation List Item
const ConversationListItem = ({conversation, isActive, onClick, onDelete}) => {
    const hasUnread = conversation.unreadCount > 0;
    const isOnline = conversation.userInfo?.status === 'Active';

    return (
        <div
            onClick={onClick}
            className={`p-4 cursor-pointer border-b transition-all hover:bg-muted/50 ${
                isActive ? 'bg-muted border-l-4 border-l-blue-600' : ''
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.userInfo?.avatar}/>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {conversation.userInfo?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                        <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"/>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">
                                {conversation.userInfo?.fullName || 'Unknown User'}
                            </h4>
                            {conversation.pinned && (
                                <Pin className="w-3 h-3 text-blue-600 flex-shrink-0"/>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                                {timeAgo(conversation.lastMessageAt)}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(conversation._id);
                                }}
                            >
                                <X className="w-3 h-3"/>
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs capitalize">
                            {conversation.userInfo?.role}
                        </Badge>
                        {conversation.type === 'DRIVER_CLIENT' && (
                            <Badge variant="outline" className="text-xs">
                                Order Chat
                            </Badge>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage?.body
                            ? conversation.lastMessage.body.length > 56
                                ? `${conversation.lastMessage.body.substring(0, 55).trim()}...`
                                : conversation.lastMessage.body
                            : 'No messages yet'
                        }
                    </p>

                </div>

                {hasUnread && (
                    <div className="flex-shrink-0">
                        <Badge
                            className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
};

// Message Bubble
const MessageBubble = ({message, isCurrentUser}) => {
    if (message.isOptimistic) {
        return (
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 opacity-60`}>
                <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {!isCurrentUser && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                                {message.senderRole?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    )}

                    <div>
                        {!isCurrentUser && (
                            <p className="text-xs text-muted-foreground mb-1 capitalize">{message.senderRole}</p>
                        )}

                        <div
                            className={`rounded-2xl px-4 py-2 ${
                                isCurrentUser
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-muted text-foreground rounded-tl-sm'
                            }`}
                        >
                            {message.body && (
                                <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                            )}
                        </div>

                        <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                            <span className="text-xs text-muted-foreground">Sending...</span>
                            {isCurrentUser && <Clock className="w-3 h-3 text-muted-foreground" />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (message.kind === 'system') {
        return (
            <div className="flex justify-center my-4">
                <div className="bg-muted px-4 py-2 rounded-full text-xs text-muted-foreground">
                    {message.body}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                {!isCurrentUser && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                            {message.senderRole?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div>
                    {!isCurrentUser && (
                        <p className="text-xs text-muted-foreground mb-1 capitalize">{message.senderRole}</p>
                    )}

                    <div
                        className={`rounded-2xl px-4 py-2 ${
                            isCurrentUser
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-muted text-foreground rounded-tl-sm'
                        }`}
                    >
                        {message.body && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                        )}
                    </div>

                    <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : ''}`}>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.createdAt)}
            </span>
                        {isCurrentUser && <CheckCheck className="w-4 h-4 text-blue-500" />}
                    </div>
                </div>
            </div>
        </div>
    );

};

// Chat Header
const ChatHeader = ({conversation, onClose, onTogglePin, onDelete}) => {
    const isOnline = conversation?.userInfo?.status === 'Active';

    if (!conversation) return null;

    return (
        <div className="border-b bg-card p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden"
                    >
                        <ArrowLeft className="w-4 h-4"/>
                    </Button>

                    <div className="relative flex-shrink-0">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.userInfo?.avatar}/>
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {conversation.userInfo?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <div
                                className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"/>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                            {conversation.userInfo?.fullName || 'Unknown User'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{conversation.userInfo?.role}</span>
                            {isOnline ? (
                                <>
                                    <Circle className="w-2 h-2 fill-green-500 text-green-500"/>
                                    <span className="text-green-600">Online</span>
                                </>
                            ) : (
                                <>
                                    <Circle className="w-2 h-2 fill-gray-400 text-gray-400"/>
                                    <span>Offline</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="w-4 h-4"/>
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Info className="w-4 h-4"/>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onTogglePin}>
                                <Pin className="w-4 h-4 mr-2"/>
                                {conversation.pinned ? 'Unpin' : 'Pin'} Chat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                                <Trash2 className="w-4 h-4 mr-2"/>
                                Delete Chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {conversation.deleteControl === 'ADMIN_OR_AUTO' && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg text-amber-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                    <span>This chat will auto-delete 3 days after delivery</span>
                </div>
            )}
        </div>
    );
};

// Message Input
const MessageInput = ({onSend, disabled}) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend({body: message, kind: 'text'});
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t bg-card p-4">
            <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="flex-shrink-0" disabled={disabled}>
                    <Paperclip className="w-5 h-5"/>
                </Button>

                <div className="flex-1 relative">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="min-h-[44px] max-h-32 resize-none"
                        rows={1}
                        disabled={disabled}
                    />
                </div>

                <Button
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
                >
                    <Send className="w-4 h-4"/>
                </Button>
            </div>
        </div>
    );
};

// Main Component
export default function ChatManagement({initialData, adminUserId}) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeConversation, setActiveConversation] = useState(null);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const messagesEndRef = useRef(null);

    // Initialize state from SSR data
    const [conversations, setConversations] = useState(initialData?.conversations || []);
    const [users] = useState(initialData?.users || {admins: [], clients: [], drivers: [], all: []});
    const stats = initialData?.stats || {};

    // Query for messages
    const {data: messagesData, isLoading: isLoadingMessages} = useQuery({
        queryKey: ['messages', activeConversation?._id],
        queryFn: async () => {
            if (!activeConversation) return {success: true, data: {messages: []}};
            return await AdminUtils.getMessages(activeConversation._id);
        },
        enabled: !!activeConversation,
    });

    // Mutation for sending messages
    // Mutation for sending messages - FIXED VERSION
    const sendMessageMutation = useMutation({
        mutationFn: async (messageData) => {
            return await AdminUtils.sendMessage(activeConversation._id, messageData);
        },
        onMutate: async (messageData) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries(['messages', activeConversation._id]);

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData(['messages', activeConversation._id]);

            // Create optimistic message
            const optimisticMessage = {
                _id: `optimistic-${Date.now()}`,
                conversationId: activeConversation._id,
                senderId: adminUserId,
                senderRole: 'admin',
                kind: messageData.kind || 'text',
                body: messageData.body,
                createdAt: new Date().toISOString(),
                isOptimistic: true,
                seq: (previousMessages?.data?.messages?.length || 0) + 1
            };

            // Optimistically update messages
            queryClient.setQueryData(['messages', activeConversation._id], (old) => ({
                ...old,
                data: {
                    ...old?.data,
                    messages: [...(old?.data?.messages || []), optimisticMessage]
                }
            }));

            // Optimistically update conversations list
            setConversations(prev => prev.map(conv =>
                conv._id === activeConversation._id
                    ? {
                        ...conv,
                        lastMessage: {
                            body: messageData.body,
                            createdAt: new Date(),
                            kind: messageData.kind || 'text'
                        },
                        lastMessageAt: new Date(),
                        messageCount: (conv.messageCount || 0) + 1
                    }
                    : conv
            ));

            return { previousMessages, optimisticMessage };
        },
        onSuccess: (result, messageData, context) => {
            if (result.success) {
                // Replace optimistic message with real message from server
                queryClient.setQueryData(['messages', activeConversation._id], (old) => {
                    if (!old?.data?.messages) return old;

                    // Remove optimistic message and add real one
                    const filteredMessages = old.data.messages.filter(
                        msg => !msg.isOptimistic
                    );

                    return {
                        ...old,
                        data: {
                            ...old.data,
                            messages: [...filteredMessages, result.data]
                        }
                    };
                });

                // Update conversation with real last message
                setConversations(prev => prev.map(conv =>
                    conv._id === activeConversation._id
                        ? {
                            ...conv,
                            lastMessage: result.data,
                            lastMessageAt: new Date(result.data.createdAt),
                            messageCount: (conv.messageCount || 0) + 1
                        }
                        : conv
                ));
            }
        },
        onError: (error, messageData, context) => {
            // Rollback on error
            if (context?.previousMessages) {
                queryClient.setQueryData(
                    ['messages', activeConversation._id],
                    context.previousMessages
                );
            }

            // Rollback conversations list
            setConversations(prev => prev.map(conv =>
                conv._id === activeConversation._id
                    ? {
                        ...conv,
                        messageCount: Math.max(0, (conv.messageCount || 0) - 1)
                    }
                    : conv
            ));

            toast.error(error.message || 'Failed to send message');
        }
    });

    // Mutation for creating/getting conversation
    const getOrCreateConvMutation = useMutation({
        mutationFn: async ({targetUserId, orderId}) => {
            if (targetUserId === adminUserId ) {
                throw new Error('Cyclic Error: Talking to yourself? 😊')
            }

            return await AdminUtils.getOrCreateConversation(targetUserId, orderId);
        },
        onSuccess: (result) => {
            if (result.success) {
                if (result.isNew) {
                    // Add to conversations list
                    setConversations(prev => [result.data, ...prev]);
                }

                setActiveConversation(result.data);
                setIsMobileChatOpen(true);
                setActiveTab('all'); // Switch to ALL tab
                handleClearSearch();
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to start conversation');
        }
    });

    // Mutation for toggling pin
    const togglePinMutation = useMutation({
        mutationFn: async (conversationId) => {
            return await AdminUtils.togglePin(conversationId);
        },
        onSuccess: () => {
            if (activeConversation) {
                const updatedPinned = !activeConversation.pinned;
                setConversations(prev => prev.map(conv =>
                    conv._id === activeConversation._id
                        ? {...conv, pinned: updatedPinned}
                        : conv
                ));
                setActiveConversation(prev => ({...prev, pinned: updatedPinned}));
                toast.success(updatedPinned ? 'Chat pinned' : 'Chat unpinned');
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update pin status');
        }
    });

    // Mutation for deleting conversation
    const deleteConvMutation = useMutation({
        mutationFn: async (conversationId) => {
            return await AdminUtils.deleteFromHistory(conversationId);
        },
        onSuccess: (result, conversationId) => {
            if (result.success) {
                setConversations(prev => prev.filter(c => c._id !== conversationId));
                if (activeConversation?._id === conversationId) {
                    setActiveConversation(null);
                    setIsMobileChatOpen(false);
                }
                toast.success('Chat removed from history');
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to delete chat');
        }
    });

    const messages = messagesData?.data?.messages || [];

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        try {
            const result = await AdminUtils.searchUsers(searchQuery, activeTab === 'all' ? 'all' : activeTab);

            if (result.success) {
                setSearchResults(result.data.users);
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults(null);
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleUserClick = (user) => {
        getOrCreateConvMutation.mutate({targetUserId: user._id, orderId: null});
    };

    const handleConversationClick = async (conversation) => {
        setActiveConversation(conversation);
        setIsMobileChatOpen(true);

        // Mark as read
        if (conversation.unreadCount > 0) {
            await AdminUtils.markChatAsRead(conversation._id, conversation.messageCount);
            setConversations(prev => prev.map(conv =>
                conv._id === conversation._id
                    ? {...conv, unreadCount: 0}
                    : conv
            ));
        }
    };

    const handleSendMessage = (messageData) => {
        sendMessageMutation.mutate(messageData);
    };

    const handleDeleteConversation = (conversationId) => {
        if (confirm('Remove this chat from history?')) {
            deleteConvMutation.mutate(conversationId);
        }
    };

    const handleTogglePin = () => {
        if (activeConversation) {
            togglePinMutation.mutate(activeConversation._id);
        }
    };

    const handleCloseChat = () => {
        setIsMobileChatOpen(false);
    };

    // Get data to display
    const displayData = useMemo(() => {
        if (searchResults) return {type: 'search', data: searchResults};

        if (activeTab === 'all') return {type: 'conversations', data: conversations};
        if (activeTab === 'client') return {type: 'users', data: users.clients};
        if (activeTab === 'driver') return {type: 'users', data: users.drivers};
        if (activeTab === 'admin') return {type: 'users', data: users.admins};

        return {type: 'users', data: []};
    }, [activeTab, searchResults, conversations, users]);

    // Auto-scroll
    useEffect(() => {
        if (messagesEndRef.current && messages.length > 0) {
            const scrollContainer = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                const isNearBottom =
                    scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;

                if (isNearBottom) {
                    messagesEndRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end'
                    });
                }
            }
        }
    }, [messages, sendMessageMutation.isPending]);

    return (
        <div className="flex flex-col h-screen p-2 gap-6">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4"/>
                Back
            </Button>
            {/* Header */}
            <div className="bg-card rounded-2xl border p-6">

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                            <MessageCircle className="w-8 h-8"/>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Communication Hub</h1>
                            <p className="text-muted-foreground">Start conversations and manage chats</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">{stats.totalUsers || 0}</p>
                            <p className="text-xs text-muted-foreground">Total Users</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{stats.admins || 0}</p>
                            <p className="text-xs text-muted-foreground">Admins</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.clients || 0}</p>
                            <p className="text-xs text-muted-foreground">Clients</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{stats.drivers || 0}</p>
                            <p className="text-xs text-muted-foreground">Drivers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Interface */}
            <div className="bg-card rounded-2xl border overflow-hidden flex-1">
                <div className="grid lg:grid-cols-[550px_1fr] h-full">
                    {/* Left Panel */}
                    <div className={`border-r flex flex-col ${isMobileChatOpen ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-4 border-b space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                    <Input
                                        placeholder="Search users or conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleSearchKeyPress}
                                        className="pl-10 pr-4"
                                    />
                                </div>

                                <Button
                                    onClick={handleSearch}
                                    disabled={isSearching || !searchQuery.trim()}
                                    className="px-4"
                                >
                                    {isSearching ? (
                                        <RefreshCw className="h-4 w-4 animate-spin"/>
                                    ) : (
                                        <Search className="h-4 w-4"/>
                                    )}
                                </Button>

                                {searchResults && (
                                    <Button
                                        onClick={handleClearSearch}
                                        variant="outline"
                                        size="icon"
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                )}
                            </div>

                            {searchResults && (
                                <div className="text-sm text-muted-foreground">
                                    Found {searchResults.length} result(s)
                                </div>
                            )}

                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="w-full grid grid-cols-4">
                                    <TabsTrigger value="all" className="text-xs">
                                        All
                                        {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                                            <Badge
                                                className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 text-white text-[10px]">
                                                {conversations.filter(c => c.unreadCount > 0).length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="client" className="text-xs">Client</TabsTrigger>
                                    <TabsTrigger value="driver" className="text-xs">Driver</TabsTrigger>
                                    <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <ScrollArea className="flex-1">
                            {displayData.data.length > 0 ? (
                                displayData.type === 'conversations' ? (
                                    displayData.data.map(conversation => (
                                        <ConversationListItem
                                            key={conversation._id}
                                            conversation={conversation}
                                            isActive={activeConversation?._id === conversation._id}
                                            onClick={() => handleConversationClick(conversation)}
                                            onDelete={handleDeleteConversation}
                                        />
                                    ))
                                ) : (
                                    displayData.data.map(user => (
                                        <UserListItem
                                            key={user._id}
                                            user={user}
                                            onClick={handleUserClick}
                                        />
                                    ))
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                    <div
                                        className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                                        {activeTab === 'all' ? (
                                            <MessageCircle className="w-10 h-10 text-purple-600"/>
                                        ) : (
                                            <UserIcon className="w-10 h-10 text-purple-600"/>
                                        )}
                                    </div>
                                    <h3 className="font-semibold mb-2">
                                        {activeTab === 'all' ? 'No conversations yet' : 'No users found'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        {activeTab === 'all'
                                            ? 'Click on any user from Client, Driver, or Admin tabs to start chatting'
                                            : searchResults
                                                ? 'Try a different search term'
                                                : 'Users will appear here'}
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Right Panel */}
                    <div className={`flex flex-col ${!isMobileChatOpen ? 'hidden lg:flex' : 'flex'}`}>
                        {activeConversation ? (
                            <>
                                <ChatHeader
                                    conversation={activeConversation}
                                    onClose={handleCloseChat}
                                    onTogglePin={handleTogglePin}
                                    onDelete={() => handleDeleteConversation(activeConversation._id)}
                                />
                                <ScrollArea className="flex-1 p-4">
                                    {isLoadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground"/>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map(message => (
                                                <MessageBubble
                                                    key={message._id}
                                                    message={message}
                                                    isCurrentUser={message.senderId === adminUserId}
                                                />
                                            ))}
                                            <div ref={messagesEndRef}/>
                                        </>
                                    )}
                                </ScrollArea>

                                <MessageInput
                                    onSend={handleSendMessage}
                                    disabled={sendMessageMutation.isPending}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div
                                    className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                                    <MessageCircle className="w-10 h-10 text-purple-600"/>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Select a user to chat</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Choose a user from the list or search for someone to start a conversation
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}