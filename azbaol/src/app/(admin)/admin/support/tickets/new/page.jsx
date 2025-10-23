import {requireRole} from "@/server/auth/guard";
import AuthController from "@/server/controllers/AuthController";
import UnderConstruction from "@/components/UnderConstruction";

export default async function NewTicketPage() {
    await requireRole(["admin"]);

    await AuthController.apiGuardWithPermission("admin", "chat", "manage");


    return (
        <UnderConstruction/>
    );
}