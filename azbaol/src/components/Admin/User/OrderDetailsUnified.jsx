// components/Admin/User/OrderDetailsUnified.jsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft, Package, Activity, Navigation, FileText,
    MapPin, User, CreditCard, Clock, AlertCircle,
    CheckCircle2, Truck, Calendar, DollarSign, Phone,
    Mail, Home, Building, Info, Image as ImageIcon,
    Video, Weight, Ruler, Shield, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Utility Functions
function formatCurrency(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Order Details Tab Component
function OrderDetailsTab({ order }) {
    return (
        <div className="space-y-6">
            {/* Package Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Package Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <p className="text-foreground mt-1">{order.package?.description || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Category</label>
                            <p className="text-foreground mt-1 capitalize">{order.package?.category || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Weight</label>
                            <p className="text-foreground mt-1 flex items-center gap-1">
                                <Weight className="w-4 h-4" />
                                {order.package?.weight?.value} {order.package?.weight?.unit}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                            <p className="text-foreground mt-1 flex items-center gap-1">
                                <Ruler className="w-4 h-4" />
                                {order.package?.dimensions?.length} x {order.package?.dimensions?.width} x {order.package?.dimensions?.height} {order.package?.dimensions?.unit}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {order.package?.isFragile && (
                            <Badge variant="outline" className="text-amber-600">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Fragile
                            </Badge>
                        )}
                        {order.package?.requiresSpecialHandling && (
                            <Badge variant="outline" className="text-blue-600">
                                Special Handling Required
                            </Badge>
                        )}
                    </div>

                    {order.package?.specialInstructions && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Special Instructions</label>
                            <p className="text-foreground mt-1 p-3 bg-muted rounded-lg">
                                {order.package.specialInstructions}
                            </p>
                        </div>
                    )}

                    {/* Package Images */}
                    {order.package?.images && order.package.images.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Package Images</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {order.package.images.map((img, idx) => (
                                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border">
                                        <img
                                            src={img.url}
                                            alt={`Package ${idx + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                            onClick={() => window.open(img.url, '_blank')}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Delivery Route
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Pickup Location */}
                    <div className="relative pl-8 pb-6 border-l-2 border-green-500">
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-2">Pickup Location</h4>
                            <p className="text-sm text-muted-foreground">{order.location?.pickUp?.address}</p>
                            {order.location?.pickUp?.landmark && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Landmark:</strong> {order.location.pickUp.landmark}
                                </p>
                            )}
                            {order.location?.pickUp?.building && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    <Building className="w-3 h-3 inline mr-1" />
                                    {order.location.pickUp.building.name}, Floor {order.location.pickUp.building.floor}, Unit {order.location.pickUp.building.unit}
                                </p>
                            )}
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium">{order.location?.pickUp?.contactPerson?.name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {order.location?.pickUp?.contactPerson?.phone}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dropoff Location */}
                    <div className="relative pl-8">
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-2">Delivery Location</h4>
                            <p className="text-sm text-muted-foreground">{order.location?.dropOff?.address}</p>
                            {order.location?.dropOff?.landmark && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Landmark:</strong> {order.location.dropOff.landmark}
                                </p>
                            )}
                            {order.location?.dropOff?.building && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    <Building className="w-3 h-3 inline mr-1" />
                                    {order.location.dropOff.building.name}, Floor {order.location.dropOff.building.floor}, Unit {order.location.dropOff.building.unit}
                                </p>
                            )}
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium">{order.location?.dropOff?.contactPerson?.name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />
                                    {order.location?.dropOff?.contactPerson?.phone}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Pricing Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Fare</span>
                            <span className="font-medium">{formatCurrency(order.pricing?.baseFare || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Distance Fare</span>
                            <span className="font-medium">{formatCurrency(order.pricing?.distanceFare || 0)}</span>
                        </div>
                        {order.pricing?.surcharges && order.pricing.surcharges.length > 0 && (
                            <>
                                <Separator />
                                <div className="text-sm font-medium">Surcharges</div>
                                {order.pricing.surcharges.map((surcharge, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{surcharge.reason}</span>
                                        <span className="font-medium">{formatCurrency(surcharge.amount)}</span>
                                    </div>
                                ))}
                            </>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="text-green-600">{formatCurrency(order.pricing?.totalAmount || 0)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                            <p className="text-foreground mt-1 capitalize">{order.payment?.method || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                            <div className="mt-1">
                                <Badge className={
                                    order.payment?.status === 'paid' ? 'bg-green-500' :
                                        order.payment?.status === 'failed' ? 'bg-red-500' :
                                            'bg-yellow-500'
                                }>
                                    {order.payment?.status || 'pending'}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Reference</label>
                            <p className="text-foreground mt-1 text-sm font-mono">{order.payment?.reference || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Amount</label>
                            <p className="text-foreground mt-1 font-semibold">{formatCurrency(order.payment?.amount || 0)}</p>
                        </div>
                        {order.payment?.paidAt && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Paid At</label>
                                <p className="text-foreground mt-1 text-sm">{formatDateTime(order.payment.paidAt)}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Insurance Information */}
            {order.insurance?.isInsured && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Insurance Coverage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Declared Value</label>
                                <p className="text-foreground mt-1 font-semibold">{formatCurrency(order.insurance.declaredValue || 0)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Coverage</label>
                                <p className="text-foreground mt-1 font-semibold">{formatCurrency(order.insurance.coverage || 0)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Provider</label>
                                <p className="text-foreground mt-1">{order.insurance.provider || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
                                <p className="text-foreground mt-1 font-mono text-sm">{order.insurance.policyNumber || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Order History Tab Component
function OrderHistoryTab({ order }) {
    const history = order.orderInstantHistory || [];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Order Status History
                    </CardTitle>
                    <CardDescription>
                        Complete timeline of all status changes and updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative space-y-4">
                        {history.map((event, idx) => (
                            <div key={event._id} className="relative pl-8 pb-4 border-l-2 border-muted last:border-0">
                                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-background"></div>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <Badge variant="outline" className="capitalize">
                                            {event.status.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDateTime(event.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground">{event.notes}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <User className="w-3 h-3" />
                                        <span>Updated by: {event.updatedBy?.role || 'system'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Real-Time Tracking Tab Component
function TrackingTab({ order }) {
    const trackingHistory = order.orderTrackingHistory || [];
    const currentStatus = trackingHistory.find(t => t.isCurrent);

    return (
        <div className="space-y-6">
            {/* Current Status Card */}
            {currentStatus && (
                <Card className="border-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-blue-500" />
                            Current Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">{currentStatus.icon}</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-1">{currentStatus.title}</h3>
                                <p className="text-muted-foreground">{currentStatus.description}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Last updated: {formatDateTime(currentStatus.timestamp)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tracking Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Tracking Timeline
                    </CardTitle>
                    <CardDescription>
                        Real-time tracking updates for your order
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative space-y-4">
                        {trackingHistory.map((event, idx) => (
                            <div
                                key={event._id}
                                className={`relative pl-12 pb-4 ${idx !== trackingHistory.length - 1 ? 'border-l-2' : ''} ${
                                    event.isCompleted ? 'border-green-500' :
                                        event.isCurrent ? 'border-blue-500' :
                                            'border-muted'
                                }`}
                            >
                                <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                    event.isCompleted ? 'bg-green-500' :
                                        event.isCurrent ? 'bg-blue-500 animate-pulse' :
                                            'bg-muted'
                                } border-4 border-background`}>
                                    {event.isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    {event.isCurrent && !event.isCompleted && <Clock className="w-4 h-4 text-white" />}
                                </div>
                                <div className={`p-4 rounded-lg ${
                                    event.isCurrent ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' :
                                        event.isCompleted ? 'bg-muted/50' :
                                            'bg-muted/30'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{event.icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-semibold text-foreground">{event.title}</h4>
                                                {event.isCurrent && (
                                                    <Badge className="bg-blue-500">Current</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{event.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDateTime(event.timestamp)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {event.updatedBy?.name || event.updatedBy?.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Invoice Tab Component
function InvoiceTab({ order, client }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Order Invoice
                    </CardTitle>
                    <CardDescription>
                        Invoice for order {order.orderRef}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start pb-6 border-b">
                        <div>
                            <h2 className="text-2xl font-bold">AAngLogistics</h2>
                            <p className="text-sm text-muted-foreground mt-1">Logistics & Delivery Services</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Invoice</p>
                            <p className="font-mono font-bold">{order.orderRef}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {formatDateTime(order.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Client Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Billed To:</h3>
                            <p className="text-sm">{client?.fullName}</p>
                            <p className="text-sm text-muted-foreground">{client?.email}</p>
                            <p className="text-sm text-muted-foreground">{client?.phoneNumber}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Order Details:</h3>
                            <p className="text-sm"><strong>Type:</strong> {order.orderType}</p>
                            <p className="text-sm"><strong>Priority:</strong> {order.priority}</p>
                            <p className="text-sm"><strong>Status:</strong> {order.status}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h3 className="font-semibold mb-3">Services</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-3 text-sm font-medium">Description</th>
                                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr className="border-t">
                                    <td className="p-3 text-sm">Base Fare</td>
                                    <td className="p-3 text-sm text-right">{formatCurrency(order.pricing?.baseFare || 0)}</td>
                                </tr>
                                <tr className="border-t">
                                    <td className="p-3 text-sm">Distance Fare</td>
                                    <td className="p-3 text-sm text-right">{formatCurrency(order.pricing?.distanceFare || 0)}</td>
                                </tr>
                                {order.pricing?.surcharges?.map((surcharge, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="p-3 text-sm">{surcharge.reason}</td>
                                        <td className="p-3 text-sm text-right">{formatCurrency(surcharge.amount)}</td>
                                    </tr>
                                ))}
                                <tr className="border-t bg-muted font-bold">
                                    <td className="p-3">Total</td>
                                    <td className="p-3 text-right text-green-600">{formatCurrency(order.pricing?.totalAmount || 0)}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Payment Status:</span>
                            <Badge className={
                                order.payment?.status === 'paid' ? 'bg-green-500' :
                                    order.payment?.status === 'failed' ? 'bg-red-500' :
                                        'bg-yellow-500'
                            }>
                                {order.payment?.status || 'pending'}
                            </Badge>
                        </div>
                        {order.payment?.paidAt && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Paid on: {formatDateTime(order.payment.paidAt)}
                            </p>
                        )}
                    </div>

                    {/* Print Button */}
                    <div className="flex justify-end pt-4">
                        <Button onClick={() => window.print()}>
                            <FileText className="w-4 h-4 mr-2" />
                            Print Invoice
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Main Unified Component
export default function OrderDetailsUnified({ order, client, clientId, orderId, defaultTab = 'details' }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Update URL when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/admin/users/view/orders/${clientId}/order-details/${orderId}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/*<Button*/}
                    {/*    variant="outline"*/}
                    {/*    size="icon"*/}
                    {/*    onClick={() => router.push(`/admin/users/view/orders/${clientId}`)}*/}
                    {/*>*/}
                    {/*    <ArrowLeft className="w-4 h-4" />*/}
                    {/*</Button>*/}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
                        <p className="text-muted-foreground mt-1">
                            {order.orderRef} • {client?.fullName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm capitalize">
                        {order.orderType}
                    </Badge>
                    <Badge variant="outline" className="text-sm capitalize">
                        {order.priority}
                    </Badge>
                    <Badge className={`text-sm ${
                        order.status === 'delivered' ? 'bg-green-500' :
                            order.status === 'cancelled' ? 'bg-red-500' :
                                order.status === 'in_transit' ? 'bg-blue-500' :
                                    'bg-gray-500'
                    }`}>
                        {order.status.replace(/_/g, ' ')}
                    </Badge>
                </div>
            </div>

            {/* Order Summary Card */}
            <Card className="border-2">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-blue-500/10">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Order Ref</p>
                                <p className="font-semibold">{order.orderRef}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-green-500/10">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="font-semibold">{formatCurrency(order.pricing?.totalAmount || 0)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-purple-500/10">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Created</p>
                                <p className="font-semibold text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-amber-500/10">
                                <CreditCard className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Payment</p>
                                <Badge className={
                                    order.payment?.status === 'paid' ? 'bg-green-500' :
                                        order.payment?.status === 'failed' ? 'bg-red-500' :
                                            'bg-yellow-500'
                                }>
                                    {order.payment?.status || 'pending'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="details" className="gap-2">
                        <Package className="w-4 h-4" />
                        <span className="hidden sm:inline">Order Details</span>
                        <span className="sm:hidden">Details</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="hidden sm:inline">Order History</span>
                        <span className="sm:hidden">History</span>
                    </TabsTrigger>
                    <TabsTrigger value="tracking" className="gap-2">
                        <Navigation className="w-4 h-4" />
                        <span className="hidden sm:inline">Real-Time Tracking</span>
                        <span className="sm:hidden">Tracking</span>
                    </TabsTrigger>
                    <TabsTrigger value="invoice" className="gap-2" disabled={order.payment?.status !== 'paid'}>
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Invoice</span>
                        <span className="sm:hidden">Invoice</span>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="details" className="mt-0">
                        <OrderDetailsTab order={order} />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <OrderHistoryTab order={order} />
                    </TabsContent>

                    <TabsContent value="tracking" className="mt-0">
                        <TrackingTab order={order} />
                    </TabsContent>

                    <TabsContent value="invoice" className="mt-0">
                        <InvoiceTab order={order} client={client} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}