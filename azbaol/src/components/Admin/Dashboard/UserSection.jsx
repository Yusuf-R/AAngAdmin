import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {MoreVertical, Eye, Plus, ChevronLeft, ChevronRight} from "lucide-react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

const UserSection = () => {
    const users = [
        {
            id: "01",
            fullName: "Darrell Steward",
            email: "darrell@hostteam.com",
            phone: "(406) 555-0120",
            status: "Active",
            role: "Client"
        },
        {
            id: "02",
            fullName: "Jenny Wilson",
            email: "Jenny@racks.com",
            phone: "(225) 555-0118",
            status: "suspended",
            role: "Client"
        },
        {
            id: "03",
            fullName: "Kathryn Murphy",
            email: "Kathryn@hostdev.com",
            phone: "(303) 555-0105",
            status: "New",
            role: "Client"
        },
        {
            id: "04",
            fullName: "Robert Fox",
            email: "Robert@gmail.com",
            phone: "(219) 555-0114",
            status: "Active",
            role: "Client"
        }
    ];

    const getStatusVariant = (status) => {
        switch (status) {
            case "Active":
                return "default";
            case "suspended":
                return "destructive";
            case "New":
                return "outline";
            default:
                return "secondary";
        }
    };

    return (
        <>
                <div className="max-w-7xl mx-auto space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">User Summary</h2>
                        <p className="text-muted-foreground">Real-time User Management</p>
                    </div>
                    <Card className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Add Clients</CardTitle>
                                <CardDescription>Client Management</CardDescription>
                            </div>
                            <Button>
                                <Plus className="h-4 w-4 mr-2"/>
                                Add Client
                            </Button>
                        </CardHeader>

                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Client Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Servers</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.id}</TableCell>
                                            <TableCell className="font-medium">{user.fullName}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(user.status)}>
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4 mr-1"/>
                                                        View
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        <Plus className="h-4 w-4 mr-1"/>
                                                        Add
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <span className="text-lg">💶</span>
                                                    <span className="text-lg">💷</span>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4"/>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                                            <DropdownMenuItem>Suspend</DropdownMenuItem>
                                                            <DropdownMenuItem>Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                <div>Showing 04 of 100 Results</div>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                        <ChevronLeft className="h-4 w-4"/>
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <ChevronRight className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
        </>
    );
};

export default UserSection;