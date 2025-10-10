import { requireRole } from "@/server/auth/guard";
import Wallet from "@/components/Admin/User/Wallet"
export default async function ViewUserDataPage({ params }) {
    const { userId } = await params; // No need for await on params
    await requireRole(["admin"]);
    console.log({ userId });

    return (
        <>
            <Wallet/>
        </>
    );
}