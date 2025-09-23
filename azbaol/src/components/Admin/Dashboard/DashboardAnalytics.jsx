'use client';
import {
    Users,
    UserPlus,
    Truck,
    Building,
    Shield,
    Package,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    Star,
    Gauge,
    Ship,
    PackageCheck,
    PackageX,
    PackageSearch
} from "lucide-react";
import {useState, useEffect} from "react";

// Mock data organized by category
const mockAnalytics = {
    userMetrics: {
        newUsers: {value: 87, change: 23, trend: 'up'},
        totalUsers: {value: 12450, change: 12, trend: 'up'},
        drivers: {value: 1450, change: 5, trend: 'up'},
        clients: {value: 9870, change: 3, trend: 'up'},
        staff: {value: 1130, change: 2, trend: 'up'}
    },
    orderMetrics: {
        newOrders: {value: 210, change: 18, trend: 'up'},
        totalOrders: {value: 23100, change: 8, trend: 'up'},
        inProgress: {value: 1234, change: 15, trend: 'up'},
        completed: {value: 21890, change: 10, trend: 'up'},
        cancelled: {value: 176, change: -5, trend: 'down'}
    },
    financialMetrics: {
        revenue: {value: 42890, change: 15, trend: 'up', chartData: [65, 78, 66, 89, 92, 85, 94]},
        avgOrderValue: {value: 89, change: 8, trend: 'up', chartData: [45, 52, 49, 61, 55, 67, 89]},
        onTimeRate: {value: 94, change: 2, trend: 'up'},
        satisfaction: {value: 4.7, change: 0.2, trend: 'up'},
        refundRate: {value: 2.1, change: -0.3, trend: 'up', chartData: [3.2, 2.8, 3.1, 2.5, 2.3, 2.0, 2.1]}
    },
    shipmentMetrics: {
        totalShipments: {value: 26666, change: 21.01, trend: 'up'},
        outForDelivery: {value: 6500, change: 21.01, trend: 'up'},
        inTransit: {value: 5000, change: 21.01, trend: 'up'},
        pending: {value: 26666, change: 21.01, trend: 'up'},
        delivered: {value: 18000, change: 18.5, trend: 'up'},
        failed: {value: 1166, change: -3.2, trend: 'down'}
    }
};

function DashboardAnalytics() {
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState(mockAnalytics);

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    const formatCurrency = (num) => {
        return `₦${formatNumber(num)}`;
    };

    // Enhanced Analytics Card with proper theme colors
    const AnalyticsCard = ({
                               title,
                               value,
                               change,
                               trend,
                               icon: Icon,
                               isLoading,
                               isCurrency = false,
                               chartData = [],
                               color = "blue" // blue, green, orange, purple, red
                           }) => {
        const colorConfig = {
            blue: {
                bg: 'bg-blue-100 dark:bg-blue-900/20',
                icon: 'text-blue-600 dark:text-blue-400',
                trend: 'text-blue-600 dark:text-blue-400',
                chart: 'text-blue-500'
            },
            green: {
                bg: 'bg-green-100 dark:bg-green-900/20',
                icon: 'text-green-600 dark:text-green-400',
                trend: 'text-green-600 dark:text-green-400',
                chart: 'text-green-500'
            },
            orange: {
                bg: 'bg-orange-100 dark:bg-orange-900/20',
                icon: 'text-orange-600 dark:text-orange-400',
                trend: 'text-orange-600 dark:text-orange-400',
                chart: 'text-orange-500'
            },
            purple: {
                bg: 'bg-purple-100 dark:bg-purple-900/20',
                icon: 'text-purple-600 dark:text-purple-400',
                trend: 'text-purple-600 dark:text-purple-400',
                chart: 'text-purple-500'
            },
            red: {
                bg: 'bg-red-100 dark:bg-red-900/20',
                icon: 'text-red-600 dark:text-red-400',
                trend: 'text-red-600 dark:text-red-400',
                chart: 'text-red-500'
            }
        };

        const colors = colorConfig[color];

        return (
            <div
                className="group relative bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <Icon className={`w-5 h-5 ${colors.icon}`}/>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                {title}
                            </p>
                        </div>
                    </div>

                    {chartData.length > 0 && !isLoading && (
                        <MiniChart data={chartData} color={colors.chart}/>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        <div className="h-8 bg-muted rounded-lg animate-pulse"></div>
                        <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-2xl font-bold text-card-foreground mb-2">
                            {isCurrency ? formatCurrency(value) : formatNumber(value)}
                        </h3>
                        <div className="flex items-center gap-2">
                            {trend === 'up' ? (
                                <TrendingUp className={`w-4 h-4 ${colors.trend}`}/>
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400"/>
                            )}
                            <span className={`text-sm font-semibold ${
                                trend === 'up' ? colors.trend : 'text-red-600 dark:text-red-400'
                            }`}>
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Mini Chart Component
    const MiniChart = ({data, color = "text-blue-500", type = 'line'}) => {
        if (!data || data.length === 0) return null;

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        if (type === 'bar') {
            return (
                <div className="flex items-end gap-0.5 h-8 w-12">
                    {data.slice(-5).map((value, i) => (
                        <div
                            key={i}
                            className={`${color} opacity-80 rounded-sm w-2`}
                            style={{height: `${((value - min) / range) * 100}%`}}
                        />
                    ))}
                </div>
            );
        }

        return (
            <div className="relative h-6 w-12">
                <svg className="w-full h-full" viewBox="0 0 48 24">
                    <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        points={data.map((value, i) =>
                            `${(i / (data.length - 1)) * 48},${24 - ((value - min) / range) * 20}`
                        ).join(' ')}
                        className={color}
                    />
                </svg>
            </div>
        );
    };

    // Section Header Component
    const SectionHeader = ({title, description, icon: Icon, color = "blue"}) => {
        const colorConfig = {
            blue: 'text-blue-600 dark:text-blue-400',
            green: 'text-green-600 dark:text-green-400',
            orange: 'text-orange-600 dark:text-orange-400',
            purple: 'text-purple-600 dark:text-purple-400'
        };

        return (
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
                    <Icon className={`w-5 h-5 ${colorConfig[color]}`}/>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        );
    };

    return (
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Main Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Overview
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Real-time insights
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Live Updates
                        </span>
                    </div>
                </div>

                {/* SHIPMENT METRICS - Primary Focus */}
                <div className="space-y-6">
                    <SectionHeader
                        title="Shipment Analytics"
                        description="Current delivery performance and status"
                        icon={Ship}
                        color="blue"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnalyticsCard
                            title="Total Shipments"
                            value={analytics.shipmentMetrics.totalShipments.value}
                            change={analytics.shipmentMetrics.totalShipments.change}
                            trend={analytics.shipmentMetrics.totalShipments.trend}
                            icon={Package}
                            isLoading={isLoading}
                            color="blue"
                            chartData={[22000, 23000, 24500, 25500, 26000, 26300, 26666]}
                        />
                        <AnalyticsCard
                            title="Out for Delivery"
                            value={analytics.shipmentMetrics.outForDelivery.value}
                            change={analytics.shipmentMetrics.outForDelivery.change}
                            trend={analytics.shipmentMetrics.outForDelivery.trend}
                            icon={PackageCheck}
                            isLoading={isLoading}
                            color="green"
                            chartData={[5200, 5600, 5800, 6100, 6300, 6400, 6500]}
                        />
                        <AnalyticsCard
                            title="In Transit"
                            value={analytics.shipmentMetrics.inTransit.value}
                            change={analytics.shipmentMetrics.inTransit.change}
                            trend={analytics.shipmentMetrics.inTransit.trend}
                            icon={PackageSearch}
                            isLoading={isLoading}
                            color="orange"
                            chartData={[4200, 4500, 4700, 4800, 4900, 4950, 5000]}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnalyticsCard
                            title="Pending"
                            value={analytics.shipmentMetrics.pending.value}
                            change={analytics.shipmentMetrics.pending.change}
                            trend={analytics.shipmentMetrics.pending.trend}
                            icon={Clock}
                            isLoading={isLoading}
                            color="purple"
                            chartData={[24000, 25000, 25500, 26000, 26300, 26500, 26666]}
                        />
                        <AnalyticsCard
                            title="Delivered"
                            value={analytics.shipmentMetrics.delivered.value}
                            change={analytics.shipmentMetrics.delivered.change}
                            trend={analytics.shipmentMetrics.delivered.trend}
                            icon={CheckCircle}
                            isLoading={isLoading}
                            color="green"
                            chartData={[15000, 16000, 16500, 17000, 17500, 17800, 18000]}
                        />
                        <AnalyticsCard
                            title="Failed"
                            value={analytics.shipmentMetrics.failed.value}
                            change={analytics.shipmentMetrics.failed.change}
                            trend={analytics.shipmentMetrics.failed.trend}
                            icon={PackageX}
                            isLoading={isLoading}
                            color="red"
                            chartData={[1300, 1250, 1200, 1180, 1170, 1168, 1166]}
                        />
                    </div>
                </div>

                {/* USER METRICS */}
                <div className="space-y-6">
                    <SectionHeader
                        title="User Analytics"
                        description="Platform user growth and distribution"
                        icon={Users}
                        color="green"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <AnalyticsCard
                            title="New Users"
                            value={analytics.userMetrics.newUsers.value}
                            change={analytics.userMetrics.newUsers.change}
                            trend={analytics.userMetrics.newUsers.trend}
                            icon={UserPlus}
                            isLoading={isLoading}
                            color="green"
                            chartData={[45, 52, 49, 61, 55, 67, 87]}
                        />
                        <AnalyticsCard
                            title="Total Users"
                            value={analytics.userMetrics.totalUsers.value}
                            change={analytics.userMetrics.totalUsers.change}
                            trend={analytics.userMetrics.totalUsers.trend}
                            icon={Users}
                            isLoading={isLoading}
                            color="blue"
                            chartData={[8200, 9100, 9800, 10400, 11200, 11800, 12450]}
                        />
                        <AnalyticsCard
                            title="Drivers"
                            value={analytics.userMetrics.drivers.value}
                            change={analytics.userMetrics.drivers.change}
                            trend={analytics.userMetrics.drivers.trend}
                            icon={Truck}
                            isLoading={isLoading}
                            color="orange"
                            chartData={[1200, 1280, 1350, 1380, 1420, 1435, 1450]}
                        />
                        <AnalyticsCard
                            title="Clients"
                            value={analytics.userMetrics.clients.value}
                            change={analytics.userMetrics.clients.change}
                            trend={analytics.userMetrics.clients.trend}
                            icon={Building}
                            isLoading={isLoading}
                            color="purple"
                            chartData={[8500, 8900, 9200, 9450, 9600, 9750, 9870]}
                        />
                        <AnalyticsCard
                            title="Staff"
                            value={analytics.userMetrics.staff.value}
                            change={analytics.userMetrics.staff.change}
                            trend={analytics.userMetrics.staff.trend}
                            icon={Shield}
                            isLoading={isLoading}
                            color="blue"
                            chartData={[980, 1020, 1050, 1080, 1100, 1115, 1130]}
                        />
                    </div>
                </div>

                {/* ORDER METRICS */}
                <div className="space-y-6">
                    <SectionHeader
                        title="Order Metrics"
                        description="Order processing and completion rates"
                        icon={Package}
                        color="orange"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <AnalyticsCard
                            title="New Orders"
                            value={analytics.orderMetrics.newOrders.value}
                            change={analytics.orderMetrics.newOrders.change}
                            trend={analytics.orderMetrics.newOrders.trend}
                            icon={Plus}
                            isLoading={isLoading}
                            color="green"
                            chartData={[150, 170, 160, 185, 195, 205, 210]}
                        />
                        <AnalyticsCard
                            title="Total Orders"
                            value={analytics.orderMetrics.totalOrders.value}
                            change={analytics.orderMetrics.totalOrders.change}
                            trend={analytics.orderMetrics.totalOrders.trend}
                            icon={Package}
                            isLoading={isLoading}
                            color="blue"
                            chartData={[19500, 20200, 21000, 21800, 22400, 22750, 23100]}
                        />
                        <AnalyticsCard
                            title="In Progress"
                            value={analytics.orderMetrics.inProgress.value}
                            change={analytics.orderMetrics.inProgress.change}
                            trend={analytics.orderMetrics.inProgress.trend}
                            icon={Clock}
                            isLoading={isLoading}
                            color="orange"
                            chartData={[980, 1050, 1120, 1180, 1200, 1215, 1234]}
                        />
                        <AnalyticsCard
                            title="Completed"
                            value={analytics.orderMetrics.completed.value}
                            change={analytics.orderMetrics.completed.change}
                            trend={analytics.orderMetrics.completed.trend}
                            icon={CheckCircle}
                            isLoading={isLoading}
                            color="green"
                            chartData={[18200, 18900, 19600, 20100, 20800, 21350, 21890]}
                        />
                        <AnalyticsCard
                            title="Cancelled"
                            value={analytics.orderMetrics.cancelled.value}
                            change={analytics.orderMetrics.cancelled.change}
                            trend={analytics.orderMetrics.cancelled.trend}
                            icon={XCircle}
                            isLoading={isLoading}
                            color="red"
                            chartData={[220, 210, 195, 185, 180, 178, 176]}
                        />
                    </div>
                </div>
        </div>
    );
}

export default DashboardAnalytics;