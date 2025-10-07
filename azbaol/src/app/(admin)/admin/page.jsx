// src/app/(admin)/admin/page.jsx
import { auth } from "@/server/auth/auth";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AdminPage() {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="flex flex-col items-center">
                    <Avatar className="h-20 w-20 mb-4">
                        <AvatarImage src={user?.image} alt={user?.name} />
                        <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.role || "Admin"}!</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                </CardHeader>
                <CardContent>
                    <div className="mt-4 text-center">
                        <p className="text-gray-700">
                            You have access to the admin dashboard. Use the sidebar to manage users, settings, and more.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
