import { requireRole } from "@/server/auth/guard";
import ChatManagement from "@/components/Admin/Support/ChatManagementSystem";
import ChatController from "@/server/controllers/ChatController";
import AuthController from "@/server/controllers/AuthController";

export default async function ChatPage() {
    await requireRole(["admin"]);

    const user = await AuthController.apiGuardWithPermission("admin", "chat", "manage");
    const adminUserId = user.id;

    const { success, data, error } = await ChatController.getInitialChatData({
        adminUserId,
        page: 1,
        limit: 600
    });

    if (!success) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Error Loading Chat</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <ChatManagement
            initialData={data}
            adminUserId={adminUserId}
        />
    );
}