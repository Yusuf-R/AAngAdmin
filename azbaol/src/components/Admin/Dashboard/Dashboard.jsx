import DashboardAnalytics from "./DashboardAnalytics";
import OrderTracking from "@/components/Admin/Dashboard/OrderTracking";
import UserSection from "@/components/Admin/Dashboard/UserSection";

function AdminDashboard() {

    return (
        <>
            <div className="min-h-screen bg-background p-8 space-y-8">
                <DashboardAnalytics/>
                <OrderTracking/>
                <UserSection/>
            </div>
        </>
    )
}

export default AdminDashboard;