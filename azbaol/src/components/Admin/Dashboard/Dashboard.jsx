import DashboardAnalytics from "./DashboardAnalytics";
import OrderTracking from "@/components/Admin/Dashboard/OrderTracking";
import UserSection from "@/components/Admin/Dashboard/UserSection";

function AdminDashboard() {

    return (
        <>
            <div className=" bg-background p-8 space-y-8 transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <DashboardAnalytics/>
                <OrderTracking/>
                <UserSection/>
            </div>
        </>
    )
}

export default AdminDashboard;