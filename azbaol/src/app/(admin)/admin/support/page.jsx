// src/app/admin/support/page.jsx
import { requireRole } from "@/server/auth/guard";
import SupportSystem from "@/components/Admin/Support/SupportSystem";

export default async function SupportDashboardPage() {
    await requireRole(["admin"]);

    return <SupportSystem />;
}
