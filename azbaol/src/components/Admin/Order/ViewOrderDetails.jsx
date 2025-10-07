'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package, MapPin, Clock, Truck, CheckCircle2, XCircle, AlertTriangle,
    ArrowLeft, Eye, Phone, Mail, Shield, Calendar, CreditCard,
    Wallet, Smartphone, User, Building2, Navigation, Star,
    FileText, Image, Play, Download, Copy, ExternalLink,
    AlertCircle, Info, DollarSign, Weight, Ruler, Tag, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {toast} from "sonner";
import AdminUtils from "@/utils/AdminUtils";
import {useMutation} from "@tanstack/react-query";
import {queryClient} from "@/lib/queryClient";
import {statusMeta, paymentMethods, formatDate, formatCurrency } from "@/lib/data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Rejection reasons configuration
const REJECTION_REASONS = [
    {
        key: 'dataIntegrity',
        label: 'Data Integrity Issues',
        description: 'Incomplete or inconsistent information in the order'
    },
    {
        key: 'contraBandItems',
        label: 'Contraband Items',
        description: 'Suspected prohibited or illegal items'
    }
];


async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard')
}

export default function ViewOrderDetails({orderData}) {
    const router = useRouter();

    const [order, setOrder] = useState(orderData);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReasons, setRejectionReasons] = useState({
        dataIntegrity: false,
        contraBandItems: false
    });
    const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
    const [showReverseDialog, setShowReverseDialog] = useState(false);
    const [reversalReason, setReversalReason] = useState('');
    const [isSubmittingReversal, setIsSubmittingReversal] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setOrder(orderData);
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [orderData]);

    if (isLoading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-muted/40 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-96 bg-muted/30 rounded-xl"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-32 bg-muted/30 rounded-xl"></div>
                            <div className="h-48 bg-muted/30 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
                    <p className="text-muted-foreground mb-4">The requested order could not be found.</p>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    const statusInfo = statusMeta[order.status] || statusMeta.draft;
    const StatusIcon = statusInfo.icon;
    const paymentMethod = paymentMethods[order.payment?.method?.toLowerCase()] || paymentMethods.paystack;

    async function handleAdminReview(_id, status, reasons = null) {
        if (!_id || !status) {
            toast.error("Invalid order ID or status");
            return;
        }

        try {
            setIsSubmittingRejection(true);
            const payload = { _id, status };

            if (status === 'rejected' && reasons) {
                payload.reason = reasons;
            }
            console.log({
                payload,
            })

            await AdminUtils.adminReviewOrder(payload);
            toast.success(status === 'approved' ? 'Order approved successfully' : 'Order rejected successfully');

            // Reset states
            setShowRejectDialog(false);
            setRejectionReasons({ dataIntegrity: false, contraBandItems: false });

            router.refresh();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setIsSubmittingRejection(false);
        }
    }

    const handleRejectClick = () => {
        setShowRejectDialog(true);
    };

    const handleRejectSubmit = async () => {
        const selectedReasons = Object.keys(rejectionReasons).filter(key => rejectionReasons[key]);

        if (selectedReasons.length === 0) {
            toast.error("Please select at least one rejection reason");
            return;
        }

        await handleAdminReview(order._id, 'rejected', rejectionReasons);
    };

    const handleReasonChange = (key) => {
        setRejectionReasons(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleReversalSubmit = async () => {
        if (!reversalReason.trim()) {
            toast.error("Please provide a reason for reversing this decision");
            return;
        }

        try {
            setIsSubmittingReversal(true);
            await AdminUtils.reverseAdminDecision({
                _id: order._id,
                reversalReason: reversalReason.trim()
            });

            toast.success('Decision reversed successfully');
            setShowReverseDialog(false);
            setReversalReason('');
            router.refresh();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setIsSubmittingReversal(false);
        }
    };

    const canReverseDecision = () => {
        // Can only reverse if:
        // 1. Status is admin_approved or admin_rejected
        // 2. No driver has been assigned yet
        // 3. Decision was made within last 30 minutes (optional)

        // const reversibleStatuses = ['admin_approved', 'admin_rejected'];
        // if (!reversibleStatuses.includes(order.status)) return false;

        // Can't reverse if driver already assigned
        if (order.driverAssignment?.driverId) return false;

        // Optional: Check time window (30 minutes)
        const lastTrackingUpdate = order.orderTrackingHistory[order.orderTrackingHistory.length - 1];
        const timeSinceDecision = Date.now() - new Date(lastTrackingUpdate.timestamp).getTime();
        const thirtyMinutes = 30 * 60 * 1000;

        return timeSinceDecision < thirtyMinutes;
    };

    return (
        <>
            <div
                className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/*<div className="w-full max-w-6xl mx-auto p-6 space-y-6 transition bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white">*/}

                <div className="p-6 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.back()}
                                className="gap-2"
                            >
                                <ArrowLeft className="w-4 h-4"/>
                                Back
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${statusInfo.color}/20`}>
                                    <StatusIcon className={`w-5 h-5 ${statusInfo.textColor}`}/>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Order Details</h1>
                                    <p className="text-muted-foreground">{order.orderRef}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${statusInfo.color} text-white`}>
                                {statusInfo.label}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                                {order.orderType}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                                Priority: {order.priority}
                            </Badge>
                            {order.insurance?.isInsured && (
                                <Badge variant="outline" className="text-blue-600">
                                    <Shield className="w-3 h-3 mr-1"/>
                                    Insured
                                </Badge>
                            )}
                            {order.flags?.isHighValue && (
                                <Badge variant="outline" className="text-amber-600">
                                    <DollarSign className="w-3 h-3 mr-1"/>
                                    High Value
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="package">Package</TabsTrigger>
                            <TabsTrigger value="payment">Payment</TabsTrigger>
                            <TabsTrigger value="logistics">Logistics</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Location Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Navigation className="w-5 h-5"/>
                                                Route Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Pickup */}
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                    <div className="w-0.5 h-16 bg-border"></div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-green-600">Pickup
                                                            Location</h4>
                                                        <Badge variant="outline" className="text-xs">
                                                            {order.location.pickUp.locationType}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.location.pickUp.landmark || order.location.pickUp.address}
                                                    </p>
                                                    <div className="text-sm text-muted-foreground">
                                                        <p>{order.location.pickUp.address}</p>
                                                        {order.location.pickUp.building && (
                                                            <p>{order.location.pickUp.building.name},
                                                                Floor {order.location.pickUp.building.floor},
                                                                Unit {order.location.pickUp.building.unit}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4"/>
                                                            {order.location.pickUp.contactPerson?.name}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-4 h-4"/>
                                                            {order.location.pickUp.contactPerson?.phone}
                                                        </div>
                                                    </div>
                                                    {order.location.pickUp.extraInformation && (
                                                        <div
                                                            className="flex items-start gap-1 text-sm text-muted-foreground">
                                                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                                                            {order.location.pickUp.extraInformation}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Dropoff */}
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-red-600">Dropoff Location</h4>
                                                        <Badge variant="outline" className="text-xs">
                                                            {order.location.dropOff.locationType}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.location.dropOff.landmark || order.location.dropOff.address}
                                                    </p>
                                                    <div className="text-sm text-muted-foreground">
                                                        <p>{order.location.dropOff.address}</p>
                                                        {order.location.dropOff.building && (
                                                            <p>{order.location.dropOff.building.name},
                                                                Floor {order.location.dropOff.building.floor},
                                                                Unit {order.location.dropOff.building.unit}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4"/>
                                                            {order.location.dropOff.contactPerson?.name}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-4 h-4"/>
                                                            {order.location.dropOff.contactPerson?.phone}
                                                        </div>
                                                    </div>
                                                    {order.location.dropOff.extraInformation && (
                                                        <div
                                                            className="flex items-start gap-1 text-sm text-muted-foreground">
                                                            <Info className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                                                            {order.location.dropOff.extraInformation}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Order Timeline */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Clock className="w-5 h-5"/>
                                                Order Timeline
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">Order Created</p>
                                                        <p className="text-muted-foreground">
                                                            {formatDate(order.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {order.payment?.paidAt && (
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">Payment Completed</p>
                                                            <p className="text-muted-foreground">
                                                                {formatDate(order.payment.paidAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className={`w-2 h-2 ${statusInfo.color} rounded-full`}></div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">Current
                                                            Status: {statusInfo.label}</p>
                                                        <p className="text-muted-foreground">
                                                            {formatDate(order.updatedAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Order Summary */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>Order Summary</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(order.orderRef)}
                                                >
                                                    <Copy className="w-4 h-4"/>
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Order Ref</span>
                                                <span className="text-sm font-mono">{order.orderRef}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Created</span>
                                                <span className="text-sm">{formatDate(order.createdAt)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Total Amount</span>
                                                <span className="text-lg font-bold">
                                                {formatCurrency(order.pricing.totalAmount, order.pricing.currency)}
                                            </span>
                                            </div>
                                            <Separator/>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Payment Status</span>
                                                <Badge className={
                                                    order.payment.status === 'paid' ? 'bg-green-600' :
                                                        order.payment.status === 'failed' ? 'bg-red-600' : 'bg-amber-600'
                                                }>
                                                    {order.payment.status}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Delivery Token</span>
                                                <Badge variant="outline" className="font-mono">
                                                    {order.deliveryToken}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Quick Actions */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Quick Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button className="w-full justify-start gap-2" variant="outline">
                                                <Navigation className="w-4 h-4"/>
                                                Real-time Tracking
                                            </Button>
                                            <Button className="w-full justify-start gap-2" variant="outline">
                                                <FileText className="w-4 h-4"/>
                                                View History
                                            </Button>
                                            <Button className="w-full justify-start gap-2" variant="outline">
                                                <Phone className="w-4 h-4"/>
                                                Contact Client
                                            </Button>
                                            {canReverseDecision() && (
                                                <>
                                                    <Separator />
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200">
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                                                            <div className="text-xs text-amber-800 dark:text-amber-200">
                                                                You can reverse this decision within 30 minutes or before driver assignment.
                                                            </div>
                                                        </div>
                                                        <Button
                                                            className="w-full bg-amber-600 hover:bg-amber-700"
                                                            onClick={() => setShowReverseDialog(true)}
                                                        >
                                                            Reverse Decision
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                            {order.status === 'admin_review' && (
                                                <>
                                                    <Separator/>
                                                    <Button
                                                        className="w-full bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleAdminReview(order._id, 'approved')}
                                                    >
                                                        Approve Order
                                                    </Button>
                                                    <Button
                                                        className="w-full"
                                                        variant="destructive"
                                                        onClick={handleRejectClick}
                                                    >
                                                        Reject Order
                                                    </Button>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Package Tab */}
                        <TabsContent value="package" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="w-5 h-5"/>
                                        Package Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Package Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Tag className="w-4 h-4"/>
                                                Category
                                            </div>
                                            <Badge variant="outline" className="capitalize">
                                                {order.package.category}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Weight className="w-4 h-4"/>
                                                Weight
                                            </div>
                                            <p className="text-sm">
                                                {order.package.weight?.value} {order.package.weight?.unit}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Ruler className="w-4 h-4"/>
                                                Dimensions
                                            </div>
                                            <p className="text-sm">
                                                {order.package.dimensions?.length} × {order.package.dimensions?.width} × {order.package.dimensions?.height} {order.package.dimensions?.unit}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator/>

                                    {/* Package Description */}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Description</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {order.package.description || 'No description provided'}
                                        </p>
                                    </div>

                                    {/* Special Instructions */}
                                    {order.package.specialInstructions && (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Special Instructions</h4>
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-sm text-amber-800">
                                                    {order.package.specialInstructions}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Package Flags */}
                                    <div className="flex gap-2 flex-wrap">
                                        {order.package.isFragile && (
                                            <Badge variant="destructive" className="gap-1">
                                                <AlertTriangle className="w-3 h-3"/>
                                                Fragile
                                            </Badge>
                                        )}
                                        {order.package.requiresSpecialHandling && (
                                            <Badge variant="secondary" className="gap-1">
                                                <AlertCircle className="w-3 h-3"/>
                                                Special Handling
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Package Images */}
                                    {order.package.images && order.package.images.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="font-semibold">Package Images</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {order.package.images.map((image, index) => (
                                                        <div key={image.id || index} className="relative group">
                                                            <img
                                                                src={image.url}
                                                                alt={`Package ${index + 1}`}
                                                                className="w-full h-24 object-cover rounded-lg border"
                                                            />
                                                            <div
                                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                                <Button size="sm" variant="secondary" className="gap-1">
                                                                    <Eye className="w-3 h-3"/>
                                                                    View
                                                                </Button>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                                {image.fileName}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Payment Tab */}
                        <TabsContent value="payment" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5"/>
                                        Payment Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Payment Overview */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold">Payment Details</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Method</span>
                                                    <div className="flex items-center gap-2">
                                                        <paymentMethod.icon
                                                            className={`w-4 h-4 ${paymentMethod.color}`}/>
                                                        <span className="font-medium">{paymentMethod.label}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Status</span>
                                                    <Badge className={
                                                        order.payment.status === 'paid' ? 'bg-green-600 text-white' :
                                                            order.payment.status === 'failed' ? 'bg-red-600 text-white' :
                                                                'bg-amber-600 text-white'
                                                    }>
                                                        {order.payment.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Reference</span>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="font-mono text-sm">{order.payment.reference}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(order.payment.reference)}
                                                        >
                                                            <Copy className="w-3 h-3"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                                {order.payment.paidAt && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">Paid On</span>
                                                        <span className="text-sm font-medium">
                                                        {formatDate(order.payment.paidAt)}
                                                    </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-semibold">Amount Breakdown</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Base Fare</span>
                                                    <span className="text-sm">
                                                    {formatCurrency(order.pricing.baseFare, order.pricing.currency)}
                                                </span>
                                                </div>
                                                {order.pricing.distanceFare > 0 && (
                                                    <div className="flex justify-between">
                                                        <span
                                                            className="text-sm text-muted-foreground">Distance Fare</span>
                                                        <span className="text-sm">
                                                        {formatCurrency(order.pricing.distanceFare, order.pricing.currency)}
                                                    </span>
                                                    </div>
                                                )}
                                                {order.pricing.surcharges && order.pricing.surcharges.length > 0 && (
                                                    <div className="space-y-1">
                                                        <span
                                                            className="text-sm text-muted-foreground">Surcharges:</span>
                                                        {order.pricing.surcharges.map((surcharge, index) => (
                                                            <div key={index} className="flex justify-between pl-4">
                                                            <span className="text-xs text-muted-foreground">
                                                                {surcharge.reason}
                                                            </span>
                                                                <span className="text-xs">
                                                                {formatCurrency(surcharge.amount, order.pricing.currency)}
                                                            </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <Separator/>
                                                <div className="flex justify-between font-semibold">
                                                    <span>Total Amount</span>
                                                    <span className="text-lg">
                                                    {formatCurrency(order.pricing.totalAmount, order.pricing.currency)}
                                                </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Insurance Information */}
                                    {order.insurance?.isInsured && (
                                        <>
                                            <Separator/>
                                            <div className="space-y-4">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-blue-600"/>
                                                    Insurance Coverage
                                                </h4>
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="text-sm text-muted-foreground">Provider</span>
                                                            <span className="text-sm font-medium">
                                                            {order.insurance.provider}
                                                        </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-muted-foreground">Policy Number</span>
                                                            <span className="text-sm font-mono">
                                                            {order.insurance.policyNumber}
                                                        </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-muted-foreground">Declared Value</span>
                                                            <span className="text-sm font-medium">
                                                            {formatCurrency(order.insurance.declaredValue)}
                                                        </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="text-sm text-muted-foreground">Coverage</span>
                                                            <span className="text-sm font-medium">
                                                            {formatCurrency(order.insurance.coverage)}
                                                        </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Logistics Tab */}
                        <TabsContent value="logistics" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Vehicle Requirements */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Truck className="w-5 h-5"/>
                                            Vehicle Requirements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {order.vehicleRequirements?.map((vehicle) => (
                                                <Badge key={vehicle} variant="outline" className="capitalize">
                                                    {vehicle}
                                                </Badge>
                                            )) || <p className="text-sm text-muted-foreground">No specific
                                                requirements</p>}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Delivery Token */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="w-5 h-5"/>
                                            Delivery Security
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Delivery Token</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                                                        {order.deliveryToken}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(order.deliveryToken)}
                                                    >
                                                        <Copy className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Token Status</span>
                                                <Badge className={
                                                    order.tokenVerified?.verified ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'
                                                }>
                                                    {order.tokenVerified?.verified ? 'Verified' : 'Pending'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Order Flags */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="w-5 h-5"/>
                                            Order Flags & Settings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Urgent</span>
                                                <Badge className={order.flags?.isUrgent ? 'bg-red-600' : 'bg-gray-500'}>
                                                    {order.flags?.isUrgent ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">High Value</span>
                                                <Badge
                                                    className={order.flags?.isHighValue ? 'bg-amber-600' : 'bg-gray-500'}>
                                                    {order.flags?.isHighValue ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Proof Required</span>
                                                <Badge
                                                    className={order.flags?.requiresProofOfDelivery ? 'bg-blue-600' : 'bg-gray-500'}>
                                                    {order.flags?.requiresProofOfDelivery ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Driver Substitution</span>
                                                <Badge
                                                    className={order.flags?.allowDriverSubstitution ? 'bg-green-600' : 'bg-gray-500'}>
                                                    {order.flags?.allowDriverSubstitution ? 'Allowed' : 'Not Allowed'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Contact Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Phone className="w-5 h-5"/>
                                            Contact Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Pickup Contact</h5>
                                                <div className="space-y-1 text-sm">
                                                    <p>{order.location.pickUp.contactPerson?.name}</p>
                                                    <p className="text-muted-foreground">{order.location.pickUp.contactPerson?.phone}</p>
                                                    {order.location.pickUp.contactPerson?.alternatePhone && (
                                                        <p className="text-muted-foreground">
                                                            Alt: {order.location.pickUp.contactPerson.alternatePhone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Separator/>
                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Dropoff Contact</h5>
                                                <div className="space-y-1 text-sm">
                                                    <p>{order.location.dropOff.contactPerson?.name}</p>
                                                    <p className="text-muted-foreground">{order.location.dropOff.contactPerson?.phone}</p>
                                                    {order.location.dropOff.contactPerson?.alternatePhone && (
                                                        <p className="text-muted-foreground">
                                                            Alt: {order.location.dropOff.contactPerson.alternatePhone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                {/* Rejection Dialog */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                Reject Order
                            </DialogTitle>
                            <DialogDescription>
                                Please select the reason(s) for rejecting order {order.orderRef}.
                                You must select at least one reason.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {REJECTION_REASONS.map((reason) => (
                                <div key={reason.key} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        id={reason.key}
                                        checked={rejectionReasons[reason.key]}
                                        onCheckedChange={() => handleReasonChange(reason.key)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <Label
                                            htmlFor={reason.key}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {reason.label}
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {reason.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectDialog(false)}
                                disabled={isSubmittingRejection}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleRejectSubmit}
                                disabled={isSubmittingRejection}
                            >
                                {isSubmittingRejection ? 'Rejecting...' : 'Confirm Rejection'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Reversal Dialog */}
                <Dialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                Reverse Admin Decision
                            </DialogTitle>
                            <DialogDescription>
                                You are about to reverse your {order.status === 'admin_approved' ? 'approval' : 'rejection'} decision for order {order.orderRef}.
                                The order will return to admin review status.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="reversalReason">
                                    Reason for Reversal <span className="text-red-600">*</span>
                                </Label>
                                <textarea
                                    id="reversalReason"
                                    value={reversalReason}
                                    onChange={(e) => setReversalReason(e.target.value)}
                                    placeholder="Explain why you're reversing this decision..."
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                    disabled={isSubmittingReversal}
                                />
                                <p className="text-xs text-muted-foreground">
                                    This reason will be recorded in the order history for audit purposes.
                                </p>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                    <strong>Important:</strong> This action can only be performed within 30 minutes
                                    and before a driver is assigned. The order will return to admin review status.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowReverseDialog(false);
                                    setReversalReason('');
                                }}
                                disabled={isSubmittingReversal}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                className="bg-amber-600 hover:bg-amber-700"
                                onClick={handleReversalSubmit}
                                disabled={isSubmittingReversal || !reversalReason.trim()}
                            >
                                {isSubmittingReversal ? 'Reversing...' : 'Confirm Reversal'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}