import {
    Package, MapPin, Clock, Truck, CheckCircle2, XCircle, AlertTriangle,
    ArrowLeft, Eye, Phone, Mail, Shield, Calendar, CreditCard,
    Wallet, Smartphone, User, Building2, Navigation, Star,
    FileText, Image, Play, Download, Copy, ExternalLink,
    AlertCircle, Info, DollarSign, Weight, Ruler, Tag, Settings
} from 'lucide-react';

export const mockUsers = [
    {
        _id: "68d12335e6fe2e33bbbb7d75",
        email: "naviroq.tech@gmail.com",
        fullName: "Naviroq",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocJ21Thdozkaw5HF5vm1Wsie5RF2CbEp0c8bR_3zljliJKkIU5Y=s96-c",
        status: "Active",
        role: "Admin",
        adminRole: "super_admin",
        phoneNumber: "+234 801 234 5678",
        emailVerified: true,
        createdAt: "2025-09-22T10:21:41.988Z",
        lastActive: "2025-09-22T13:41:04.576Z",
        stats: { totalActions: 1250, resolutionTime: 15 }
    },
    {
        _id: "68d12335e6fe2e33bbbb7d76",
        email: "sarah.johnson@client.com",
        fullName: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e0?w=150&h=150&fit=crop&crop=face",
        status: "Active",
        role: "Client",
        phoneNumber: "+234 802 345 6789",
        emailVerified: true,
        createdAt: "2025-09-20T08:15:30.123Z",
        lastActive: "2025-09-23T09:20:15.400Z",
        stats: { totalOrders: 45, totalSpent: 125000, trustScore: 92 }
    },
    {
        _id: "68d12335e6fe2e33bbbb7d77",
        email: "mike.driver@logistics.com",
        fullName: "Mike Okafor",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        status: "Active",
        role: "Driver",
        phoneNumber: "+234 803 456 7890",
        emailVerified: true,
        availabilityStatus: "online",
        vehicleType: "motorcycle",
        createdAt: "2025-09-18T14:30:45.678Z",
        lastActive: "2025-09-23T12:45:30.200Z",
        stats: { totalDeliveries: 234, averageRating: 4.8, completionRate: 96.5 }
    },
    {
        _id: "68d12335e6fe2e33bbbb7d78",
        email: "admin.ops@naviroq.com",
        fullName: "Operations Manager",
        avatar: null,
        status: "Active",
        role: "Admin",
        adminRole: "operations_manager",
        phoneNumber: "+234 804 567 8901",
        emailVerified: true,
        createdAt: "2025-09-15T11:20:10.456Z",
        lastActive: "2025-09-23T08:15:45.300Z",
        stats: { totalActions: 890, resolutionTime: 22 }
    },
    {
        _id: "68d12335e6fe2e33bbbb7d79",
        email: "jennifer.client@email.com",
        fullName: "Jennifer Adaora",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        status: "Suspended",
        role: "Client",
        phoneNumber: "+234 805 678 9012",
        emailVerified: false,
        createdAt: "2025-09-10T16:45:20.789Z",
        lastActive: "2025-09-22T14:30:25.100Z",
        stats: { totalOrders: 12, totalSpent: 34500, trustScore: 45 }
    },
    {
        _id: "68d12335e6fe2e33bbbb7d80",
        email: "david.driver@delivery.com",
        fullName: "David Emeka",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        status: "Inactive",
        role: "Driver",
        phoneNumber: "+234 806 789 0123",
        emailVerified: true,
        availabilityStatus: "offline",
        vehicleType: "van",
        createdAt: "2025-09-05T09:10:35.234Z",
        lastActive: "2025-09-21T18:20:40.500Z",
        stats: { totalDeliveries: 67, averageRating: 4.2, completionRate: 89.5 }
    }
];

// Status metadata for consistent styling
export const statusMeta = {
    draft: { label: "Draft", icon: Package, color: "bg-gray-500", textColor: "text-gray-600" },
    submitted: { label: "Submitted", icon: Package, color: "bg-blue-500", textColor: "text-blue-600" },
    admin_review: { label: "Admin Review", icon: AlertTriangle, color: "bg-amber-500", textColor: "text-amber-600" },
    admin_approved: { label: "Approved", icon: CheckCircle2, color: "bg-emerald-500", textColor: "text-emerald-600" },
    pending: { label: "Pending", icon: Clock, color: "bg-blue-500", textColor: "text-blue-600" },
    broadcast: { label: "Broadcasting", icon: Truck, color: "bg-purple-500", textColor: "text-purple-600" },
    assigned: { label: "Assigned", icon: User, color: "bg-purple-500", textColor: "text-purple-600" },
    confirmed: { label: "Confirmed", icon: CheckCircle2, color: "bg-emerald-500", textColor: "text-emerald-600" },
    en_route_pickup: { label: "En Route Pickup", icon: Navigation, color: "bg-indigo-500", textColor: "text-indigo-600" },
    arrived_pickup: { label: "Arrived Pickup", icon: MapPin, color: "bg-indigo-500", textColor: "text-indigo-600" },
    picked_up: { label: "Picked Up", icon: Package, color: "bg-emerald-500", textColor: "text-emerald-600" },
    in_transit: { label: "In Transit", icon: Truck, color: "bg-sky-500", textColor: "text-sky-600" },
    arrived_dropoff: { label: "Arrived Dropoff", icon: MapPin, color: "bg-indigo-500", textColor: "text-indigo-600" },
    delivered: { label: "Delivered", icon: CheckCircle2, color: "bg-emerald-500", textColor: "text-emerald-600" },
    failed: { label: "Failed", icon: XCircle, color: "bg-red-500", textColor: "text-red-600" },
    cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-500", textColor: "text-red-600" },
    returned: { label: "Returned", icon: AlertTriangle, color: "bg-amber-500", textColor: "text-amber-600" }
};

export const paymentMethods = {
    wallet: { label: "Wallet", icon: Wallet, color: "text-purple-600" },
    paystack: { label: "PayStack", icon: Smartphone, color: "text-blue-600" },
    banktransfer: { label: "Bank Transfer", icon: CreditCard, color: "text-green-600" }
};
export const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount);
}

export const  formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}