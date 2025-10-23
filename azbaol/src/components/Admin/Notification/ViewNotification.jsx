'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Calendar, Clock, User, AlertTriangle, CheckCircle2,
    XCircle, AlertCircle, Timer, TrendingUp, Eye, MousePointerClick,
    ExternalLink, MessageSquare, Shield, Package, CreditCard, Users,
    Settings, MessageCircle, TrendingDown, Trash2, RefreshCw, PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import AdminUtils from '@/utils/AdminUtils';

const categoryIcons = {
    ORDER: Package,
    DELIVERY: Users,
    SECURITY: Shield,
    IDENTITY: User,
    SYSTEM: Settings,
    PAYMENT: CreditCard,
    SOCIAL: MessageCircle,
    PROMOTION: TrendingUp
};

const priorityConfig = {
    CRITICAL: { color: 'bg-red-600 text-white', icon: AlertTriangle, label: 'Critical' },
    URGENT: { color: 'bg-orange-600 text-white', icon: AlertCircle, label: 'Urgent' },
    HIGH: { color: 'bg-yellow-600 text-white', icon: TrendingUp, label: 'High' },
    NORMAL: { color: 'bg-blue-600 text-white', icon: CheckCircle2, label: 'Normal' },
    LOW: { color: 'bg-gray-600 text-white', icon: TrendingDown, label: 'Low' }
};

const statusConfig = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
    IN_PROGRESS: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: PlayCircle, label: 'In Progress' },
    COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, label: 'Completed' },
    REJECTED: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Rejected' },
    ESCALATED: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: AlertTriangle, label: 'Escalated' }
};

const urgencyConfig = {
    IMMEDIATE: { color: 'bg-red-500', label: 'Immediate', pulse: true },
    TODAY: { color: 'bg-orange-500', label: 'Today', pulse: false },
    THIS_WEEK: { color: 'bg-yellow-500', label: 'This Week', pulse: false },
    WHENEVER: { color: 'bg-gray-500', label: 'Whenever', pulse: false }
};

function ViewNotification({ notificationData }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const { notification, relatedEntity, timeMetrics, interactionSummary, metadata } = notificationData;

    const CategoryIcon = categoryIcons[notification.category] || Package;
    const priorityInfo = priorityConfig[notification.priority] || priorityConfig.NORMAL;
    const PriorityIcon = priorityInfo.icon;

    // Format time helper
    const formatTime = (minutes) => {
        if (!minutes && minutes !== 0) return 'N/A';
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
        return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle delete
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this notification?')) return;

        setIsDeleting(true);
        try {
            const result = await AdminUtils.deleteNotification(notification._id);
            if (result.success) {
                toast.success('Notification deleted');
                router.push('/admin/notifications');
            } else {
                toast.error('Failed to delete notification');
            }
        } catch (error) {
            toast.error('Error deleting notification');
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle restore
    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            const result = await AdminUtils.restoreNotification(notification._id);
            if (result.success) {
                toast.success('Notification restored');
                router.refresh();
            } else {
                toast.error('Failed to restore notification');
            }
        } catch (error) {
            toast.error('Error restoring notification');
        } finally {
            setIsRestoring(false);
        }
    };

    // Navigate to action page
    const handleTakeAction = () => {
        if (metadata.actionUrl) {
            router.push(metadata.actionUrl);
        } else {
            toast.error('No action URL available');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>

                    <div className="flex items-center gap-3">
                        {notification.deleted?.status ? (
                            <Button
                                variant="outline"
                                onClick={handleRestore}
                                disabled={isRestoring}
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                                Restore
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="gap-2 text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="shadow-xl border-2">
                    <CardHeader className="space-y-4 pb-8">
                        {/* Title Section */}
                        <div className="flex items-start gap-4">
                            <div className={`p-4 rounded-xl bg-gradient-to-br ${
                                notification.category === 'ORDER' ? 'from-blue-500 to-blue-600' :
                                    notification.category === 'SECURITY' ? 'from-red-500 to-red-600' :
                                        notification.category === 'PAYMENT' ? 'from-green-500 to-green-600' :
                                            'from-purple-500 to-purple-600'
                            } shadow-lg`}>
                                <CategoryIcon className="w-8 h-8 text-white" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-foreground">
                                        {notification.content.title}
                                    </h1>
                                    <Badge className={priorityInfo.color}>
                                        <PriorityIcon className="w-3 h-3 mr-1" />
                                        {priorityInfo.label}
                                    </Badge>
                                </div>

                                <p className="text-lg text-muted-foreground">
                                    {notification.content.body}
                                </p>

                                {notification.content.orderRef && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Order Reference: <span className="font-mono font-semibold">{notification.content.orderRef}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="gap-2">
                                <CategoryIcon className="w-3 h-3" />
                                {notification.category}
                            </Badge>

                            <Badge variant="outline" className="gap-2 font-mono text-xs">
                                {notification.type}
                            </Badge>

                            {notification.read?.status ? (
                                <Badge className="gap-2 bg-green-100 text-green-800 border-green-200">
                                    <Eye className="w-3 h-3" />
                                    Read
                                </Badge>
                            ) : (
                                <Badge className="gap-2 bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
                                    <AlertCircle className="w-3 h-3" />
                                    Unread
                                </Badge>
                            )}

                            {notification.deleted?.status && (
                                <Badge variant="destructive" className="gap-2">
                                    <Trash2 className="w-3 h-3" />
                                    Deleted
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">

                        {/* Admin Action Section */}
                        {notification.adminAction?.required && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-lg bg-blue-600 text-white">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">Admin Action Required</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Action Type: <span className="font-semibold">{notification.adminAction.actionType}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {metadata.canTakeAction && metadata.actionUrl && (
                                        <Button
                                            onClick={handleTakeAction}
                                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Take Action
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Status */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                                        <p className="text-sm text-muted-foreground mb-2">Status</p>
                                        <Badge className={statusConfig[notification.adminAction.status]?.color || 'bg-gray-100'}>
                                            {React.createElement(statusConfig[notification.adminAction.status]?.icon || Clock, { className: 'w-3 h-3 mr-1' })}
                                            {statusConfig[notification.adminAction.status]?.label || notification.adminAction.status}
                                        </Badge>
                                    </div>

                                    {/* Urgency */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                                        <p className="text-sm text-muted-foreground mb-2">Urgency</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${urgencyConfig[notification.adminAction.urgency]?.color} ${
                                                urgencyConfig[notification.adminAction.urgency]?.pulse ? 'animate-pulse' : ''
                                            }`}></div>
                                            <span className="font-semibold">
                                                {urgencyConfig[notification.adminAction.urgency]?.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Target Role */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                                        <p className="text-sm text-muted-foreground mb-2">Target Role</p>
                                        <p className="font-semibold capitalize">
                                            {notification.adminAction.targetRole?.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>

                                {/* SLA Information */}
                                {notification.adminAction.sla?.dueAt && (
                                    <div className={`mt-4 p-4 rounded-lg border-2 ${
                                        timeMetrics.isOverdue
                                            ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-800'
                                            : 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-800'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Timer className={`w-5 h-5 ${timeMetrics.isOverdue ? 'text-red-600' : 'text-green-600'}`} />
                                                <span className="font-semibold">
                                                    {timeMetrics.isOverdue ? 'OVERDUE' : 'Due'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatDate(notification.adminAction.sla.dueAt)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {timeMetrics.isOverdue
                                                        ? `Overdue by ${formatTime(Math.abs(timeMetrics.timeUntilDue))}`
                                                        : `${formatTime(timeMetrics.timeUntilDue)} remaining`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Handled By */}
                                {notification.adminAction.handledBy?.adminId && (
                                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                        <p className="text-sm text-muted-foreground mb-2">Handled By</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                                {notification.adminAction.handledBy.adminName?.charAt(0) || 'A'}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{notification.adminAction.handledBy.adminName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(notification.adminAction.handledBy.handledAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Outcome */}
                                {notification.adminAction.outcome?.decision && (
                                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                        <p className="text-sm text-muted-foreground mb-2">Outcome</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Decision:</span>
                                                <Badge className={
                                                    notification.adminAction.outcome.decision === 'approved' ? 'bg-green-100 text-green-800' :
                                                        notification.adminAction.outcome.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }>
                                                    {notification.adminAction.outcome.decision}
                                                </Badge>
                                            </div>
                                            {notification.adminAction.outcome.notes && (
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Notes:</span>
                                                    <p className="text-sm mt-1">{notification.adminAction.outcome.notes}</p>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Completed: {formatDate(notification.adminAction.outcome.completedAt)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Related Entity Link */}
                                {notification.adminAction.relatedEntity?.type && (
                                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                        <p className="text-sm text-muted-foreground mb-2">Related Entity</p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold capitalize">
                                                    {notification.adminAction.relatedEntity.type.replace('_', ' ')}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Status: {notification.adminAction.relatedEntity.status}
                                                </p>
                                            </div>
                                            {metadata.actionUrl && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleTakeAction}
                                                    className="gap-2"
                                                >
                                                    View Details
                                                    <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />

                        {/* Time Metrics */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Time Metrics
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-muted-foreground mb-1">Age</p>
                                        <p className="text-2xl font-bold">{formatTime(timeMetrics.age)}</p>
                                    </CardContent>
                                </Card>

                                {timeMetrics.timeToRead !== null && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-muted-foreground mb-1">Time to Read</p>
                                            <p className="text-2xl font-bold">{formatTime(timeMetrics.timeToRead)}</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {timeMetrics.timeToHandle !== null && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-muted-foreground mb-1">Response Time</p>
                                            <p className="text-2xl font-bold">{formatTime(timeMetrics.timeToHandle)}</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {timeMetrics.timeToComplete !== null && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="text-sm text-muted-foreground mb-1">Resolution Time</p>
                                            <p className="text-2xl font-bold">{formatTime(timeMetrics.timeToComplete)}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Interaction History */}
                        {interactionSummary.total > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <MousePointerClick className="w-5 h-5" />
                                    Interaction History ({interactionSummary.total})
                                </h3>
                                <div className="space-y-3">
                                    {notification.metadata?.interactions?.map((interaction, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <MousePointerClick className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold capitalize">{interaction.action}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(interaction.timestamp)} · {interaction.channel}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Additional Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Timestamps */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Timestamps
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                        <span className="text-sm text-muted-foreground">Created</span>
                                        <span className="font-semibold text-sm">{formatDate(notification.createdAt)}</span>
                                    </div>
                                    {notification.sentAt && (
                                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                            <span className="text-sm text-muted-foreground">Sent</span>
                                            <span className="font-semibold text-sm">{formatDate(notification.sentAt)}</span>
                                        </div>
                                    )}
                                    {notification.deliveredAt && (
                                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                            <span className="text-sm text-muted-foreground">Delivered</span>
                                            <span className="font-semibold text-sm">{formatDate(notification.deliveredAt)}</span>
                                        </div>
                                    )}
                                    {notification.read?.readAt && (
                                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                            <span className="text-sm text-muted-foreground">Read</span>
                                            <span className="font-semibold text-sm">{formatDate(notification.read.readAt)}</span>
                                        </div>
                                    )}
                                    {notification.deleted?.deletedAt && (
                                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                                            <span className="text-sm text-red-600">Deleted</span>
                                            <span className="font-semibold text-sm text-red-600">{formatDate(notification.deleted.deletedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Channels */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Delivery Channels
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(notification.metadata?.channels || {}).map(([channel, enabled]) => (
                                        <div key={channel} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                            <span className="text-sm capitalize">{channel}</span>
                                            <Badge className={enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                {enabled ? (
                                                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Enabled</>
                                                ) : (
                                                    <><XCircle className="w-3 h-3 mr-1" /> Disabled</>
                                                )}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        {notification.metadata && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Additional Metadata</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {notification.metadata.source && (
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-sm text-muted-foreground">Source</p>
                                                <p className="font-semibold capitalize">{notification.metadata.source}</p>
                                            </div>
                                        )}
                                        {notification.metadata.orderRef && (
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-sm text-muted-foreground">Order Reference</p>
                                                <p className="font-semibold font-mono">{notification.metadata.orderRef}</p>
                                            </div>
                                        )}
                                        {notification.metadata.totalAmount && (
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-sm text-muted-foreground">Amount</p>
                                                <p className="font-semibold">₦{notification.metadata.totalAmount.toLocaleString()}</p>
                                            </div>
                                        )}
                                        {notification.metadata.gateway && (
                                            <div className="p-3 bg-muted rounded-lg">
                                                <p className="text-sm text-muted-foreground">Payment Gateway</p>
                                                <p className="font-semibold capitalize">{notification.metadata.gateway}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Related Entity Data */}
                        {relatedEntity && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Related Entity Details</h3>
                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                                        <pre className="text-sm overflow-auto max-h-96">
                                            {JSON.stringify(relatedEntity, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Action Buttons */}
                        {notification.content?.richContent?.actionButtons && notification.content.richContent.actionButtons.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Available Actions</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {notification.content.richContent.actionButtons.map((button, index) => (
                                            <Button
                                                key={index}
                                                onClick={() => button.deepLink && router.push(button.deepLink)}
                                                className="gap-2"
                                            >
                                                {button.label}
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Technical Details */}
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">ID</p>
                                    <p className="font-mono text-xs break-all">{notification._id}</p>
                                </div>
                                {notification.userId && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm text-muted-foreground">User ID</p>
                                        <p className="font-mono text-xs break-all">{notification.userId}</p>
                                    </div>
                                )}
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <p className="font-semibold">{notification.status}</p>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Quick Actions Panel */}
                {metadata.canTakeAction && (
                    <Card className="border-2 border-blue-500 shadow-xl">
                        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-6 h-6" />
                                Action Required
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-semibold mb-1">
                                        This notification requires your attention
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Action Type: <span className="font-semibold">{notification.adminAction?.actionType}</span>
                                    </p>
                                </div>
                                {metadata.actionUrl && (
                                    <Button
                                        onClick={handleTakeAction}
                                        size="lg"
                                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Take Action Now
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}

export default ViewNotification;