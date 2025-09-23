// components/Admin/Dashboard/OrderTracking.jsx
'use client';
import {useState, useEffect} from "react";
import {
    Truck,
    Clock,
    CheckCircle,
    MapPin,
    Calendar,
    Phone,
    Mail,
    ArrowRight,
    Package,
    User,
    Navigation
} from "lucide-react";

// Mock data based on your order schema
const mockOrders = [
    {
        _id: "3752584",
        orderRef: "ORD-3752584",
        status: "in_transit",
        clientId: {
            name: "Sarah Johnson",
            email: "sarah.j@email.com",
            phone: "+1-416-555-0123"
        },
        package: {
            category: "electronics",
            description: "MacBook Pro 16-inch",
            weight: {value: 2.1, unit: "kg"},
            dimensions: {length: 35, width: 25, height: 2, unit: "cm"}
        },
        location: {
            pickUp: {
                address: "123 Commerce Street, Toronto",
                contactPerson: {name: "Tech Store", phone: "+1-416-555-0124"}
            },
            dropOff: {
                address: "789 Front Street West, Toronto",
                contactPerson: {name: "Sarah Johnson", phone: "+1-416-555-0123"}
            }
        },
        deliveryWindow: {
            start: new Date("2025-01-27T10:00:00"),
            end: new Date("2025-02-01T18:00:00")
        },
        driverAssignment: {
            driverInfo: {
                name: "Michael Anderson",
                phone: "+1-416-555-0125",
                vehicleType: "car",
                vehicleNumber: "TOR-AB-123",
                rating: 4.8
            },
            currentLocation: {
                lat: 43.6481,
                lng: -79.4042,
                timestamp: new Date()
            },
            estimatedArrival: {
                dropoff: new Date("2025-01-28T15:30:00")
            },
            distance: {
                total: 8.2,
                remaining: 2.1,
                unit: "km"
            }
        },
        orderTrackingHistory: [
            {
                status: "order_created",
                timestamp: new Date("2025-01-25T09:30:00"),
                title: "Order Created",
                description: "Order was placed successfully",
                icon: "📦",
                isCompleted: true
            },
            {
                status: "payment_confirmed",
                timestamp: new Date("2025-01-25T09:32:00"),
                title: "Payment Confirmed",
                description: "Payment processed successfully",
                icon: "💳",
                isCompleted: true
            },
            {
                status: "driver_assigned",
                timestamp: new Date("2025-01-27T14:20:00"),
                title: "Driver Assigned",
                description: "Michael A. accepted your order",
                icon: "👤",
                isCompleted: true
            },
            {
                status: "in_transit",
                timestamp: new Date("2025-01-28T14:45:00"),
                title: "In Transit",
                description: "Package is on the way to destination",
                icon: "🚗",
                isCurrent: true,
                isCompleted: false
            },
            {
                status: "arrived_at_destination",
                title: "Arrived at Destination",
                icon: "📍",
                isCompleted: false
            },
            {
                status: "delivery_completed",
                title: "Delivery Completed",
                icon: "✅",
                isCompleted: false
            }
        ]
    },
    {
        _id: "3752585",
        orderRef: "ORD-3752585",
        status: "out_for_delivery",
        clientId: {
            name: "David Chen",
            email: "david.chen@email.com",
            phone: "+1-416-555-0126"
        },
        package: {
            category: "documents",
            description: "Legal Contracts",
            weight: {value: 0.5, unit: "kg"},
            dimensions: {length: 30, width: 21, height: 2, unit: "cm"}
        },
        location: {
            pickUp: {
                address: "456 Bay Street, Toronto",
                contactPerson: {name: "Law Firm LLC", phone: "+1-416-555-0127"}
            },
            dropOff: {
                address: "789 Front Street West, Toronto",
                contactPerson: {name: "David Chen", phone: "+1-416-555-0126"}
            }
        },
        deliveryWindow: {
            start: new Date("2025-01-27T09:00:00"),
            end: new Date("2025-01-27T17:00:00")
        },
        driverAssignment: {
            driverInfo: {
                name: "Jessica Martinez",
                phone: "+1-416-555-0128",
                vehicleType: "motorcycle",
                vehicleNumber: "TOR-CD-456",
                rating: 4.9
            },
            currentLocation: {
                lat: 43.6492,
                lng: -79.3855,
                timestamp: new Date()
            },
            estimatedArrival: {
                dropoff: new Date("2025-01-27T15:15:00")
            },
            distance: {
                total: 5.7,
                remaining: 0.8,
                unit: "km"
            }
        },
        orderTrackingHistory: [
            {
                status: "order_created",
                timestamp: new Date("2025-01-26T14:15:00"),
                title: "Order Created",
                description: "Order was placed successfully",
                icon: "📦",
                isCompleted: true
            },
            {
                status: "driver_assigned",
                timestamp: new Date("2025-01-27T08:30:00"),
                title: "Driver Assigned",
                description: "Jessica M. accepted your order",
                icon: "👤",
                isCompleted: true
            },
            {
                status: "out_for_delivery",
                timestamp: new Date("2025-01-27T14:30:00"),
                title: "Out for Delivery",
                description: "Package is out for delivery",
                icon: "🚚",
                isCurrent: true,
                isCompleted: false
            },
            {
                status: "delivery_completed",
                title: "Delivery Completed",
                icon: "✅",
                isCompleted: false
            }
        ]
    },
    {
        _id: "3752586",
        orderRef: "ORD-3752586",
        status: "processing",
        clientId: {
            name: "Emma Wilson",
            email: "emma.wilson@email.com",
            phone: "+1-416-555-0129"
        },
        package: {
            category: "fragile",
            description: "Art Collection",
            weight: {value: 15.5, unit: "kg"},
            dimensions: {length: 120, width: 80, height: 10, unit: "cm"},
            isFragile: true,
            requiresSpecialHandling: true
        },
        location: {
            pickUp: {
                address: "789 Art Gallery Road, Toronto",
                contactPerson: {name: "Gallery Manager", phone: "+1-416-555-0130"}
            },
            dropOff: {
                address: "789 Front Street West, Toronto",
                contactPerson: {name: "Emma Wilson", phone: "+1-416-555-0129"}
            }
        },
        deliveryWindow: {
            start: new Date("2025-01-28T10:00:00"),
            end: new Date("2025-01-29T18:00:00")
        },
        orderTrackingHistory: [
            {
                status: "order_created",
                timestamp: new Date("2025-01-27T16:45:00"),
                title: "Order Created",
                description: "Order was placed successfully",
                icon: "📦",
                isCompleted: true
            },
            {
                status: "processing",
                timestamp: new Date("2025-01-27T17:00:00"),
                title: "Processing",
                description: "Order is being processed",
                icon: "⚙️",
                isCurrent: true,
                isCompleted: false
            },
            {
                status: "driver_assignment_started",
                title: "Driver Assignment",
                icon: "👤",
                isCompleted: false
            },
            {
                status: "in_transit",
                title: "In Transit",
                icon: "🚗",
                isCompleted: false
            },
            {
                status: "delivery_completed",
                title: "Delivery Completed",
                icon: "✅",
                isCompleted: false
            }
        ]
    }
];

function OrderTracking() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        // Simulate API call
        const timer = setTimeout(() => {
            setOrders(mockOrders);
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const getStatusConfig = (status) => {
        const configs = {
            processing: {
                color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
                label: "Processing"
            },
            in_transit: {
                color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
                label: "In Transit"
            },
            out_for_delivery: {
                color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
                label: "Out for Delivery"
            },
            delivered: {
                color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                label: "Delivered"
            }
        };
        return configs[status] || configs.processing;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const OrderCard = ({order}) => {
        const statusConfig = getStatusConfig(order.status);

        return (
            <div
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedOrder(order)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="w-5 h-5 text-primary"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                #{order.orderRef}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"/>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4"/>
                        <span className="line-clamp-1">{order.location.dropOff.address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4"/>
                        <span>ETA: {formatDate(order.deliveryWindow.start)} - {formatDate(order.deliveryWindow.end)}</span>
                    </div>

                    {order.driverAssignment && (
                        <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-muted-foreground"/>
                            <span className="text-foreground">{order.driverAssignment.driverInfo.name}</span>
                            <span
                                className="text-muted-foreground">• {order.driverAssignment.driverInfo.vehicleType}</span>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            {order.driverAssignment && (
                                <span>{order.driverAssignment.distance.remaining}km remaining</span>
                            )}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-500"
                                style={{
                                    width: order.driverAssignment
                                        ? `${((order.driverAssignment.distance.total - order.driverAssignment.distance.remaining) / order.driverAssignment.distance.total) * 100}%`
                                        : '0%'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const OrderDetailModal = ({order, onClose}) => {
        if (!order) return null;

        const statusConfig = getStatusConfig(order.status);

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Package className="w-6 h-6 text-primary"/>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Order #{order.orderRef}</h2>
                                    <span
                                        className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Package Details */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-3">Package Details</h3>
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-foreground">{order.package.description}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{order.package.category}</p>
                                    </div>
                                    <div className="text-right text-sm text-muted-foreground">
                                        <p>{order.package.weight.value} {order.package.weight.unit}</p>
                                        <p>{order.package.dimensions.length}x{order.package.dimensions.width}x{order.package.dimensions.height}cm</p>
                                    </div>
                                </div>
                                {order.package.isFragile && (
                                    <div
                                        className="mt-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-400 inline-block">
                                        🚨 Fragile Item
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delivery Timeline */}
                        <div>
                            <h3 className="font-semibold text-foreground mb-3">Delivery Progress</h3>
                            <div className="space-y-4">
                                {order.orderTrackingHistory.map((step, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                step.isCompleted
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                    : step.isCurrent
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {step.icon}
                                            </div>
                                            {index < order.orderTrackingHistory.length - 1 && (
                                                <div className={`w-0.5 h-8 ${
                                                    step.isCompleted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'
                                                }`}/>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className={`font-medium ${
                                                        step.isCurrent ? 'text-primary' : 'text-foreground'
                                                    }`}>
                                                        {step.title}
                                                    </p>
                                                    {step.description && (
                                                        <p className="text-sm text-muted-foreground">{step.description}</p>
                                                    )}
                                                </div>
                                                {step.timestamp && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTime(step.timestamp)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Client</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground"/>
                                        <span>{order.clientId.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground"/>
                                        <span>{order.clientId.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground"/>
                                        <span>{order.clientId.email}</span>
                                    </div>
                                </div>
                            </div>

                            {order.driverAssignment && (
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">Driver</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground"/>
                                            <span>{order.driverAssignment.driverInfo.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-muted-foreground"/>
                                            <span>{order.driverAssignment.driverInfo.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Truck className="w-4 h-4 text-muted-foreground"/>
                                            <span>{order.driverAssignment.driverInfo.vehicleNumber}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                        <div className="space-y-3">
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                            <div className="h-2 bg-muted rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Active Deliveries</h2>
                        <p className="text-muted-foreground">Real-time tracking of current orders</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                        <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {orders.length} Active
                    </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <OrderCard key={order._id} order={order}/>
                    ))}
                </div>

                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
        </div>
    );
}

export default OrderTracking;