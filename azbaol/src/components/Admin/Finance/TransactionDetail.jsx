'use client';
import React, { useState } from 'react';
import {
    ArrowLeft, Download, RefreshCw, CheckCircle2, XCircle, Clock,
    AlertCircle, CreditCard, Users, TrendingUp, Wallet, Package,
    Building2, User, Calendar, DollarSign, Shield, FileText,
    ExternalLink, Copy, Check, AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const transactionTypeMeta = {
    client_payment: {
        label: 'Client Payment',
        icon: CreditCard,
        color: 'text-blue-600',
        bg: 'bg-blue-100 dark:bg-blue-500/20'
    },
    driver_earning: {
        label: 'Driver Earning',
        icon: Users,
        color: 'text-emerald-600',
        bg: 'bg-emerald-100 dark:bg-emerald-500/20'
    },
    driver_payout: {
        label: 'Driver Payout',
        icon: TrendingUp,
        color: 'text-amber-600',
        bg: 'bg-amber-100 dark:bg-amber-500/20'
    },
    platform_revenue: {
        label: 'Platform Revenue',
        icon: TrendingUp,
        color: 'text-green-600',
        bg: 'bg-green-100 dark:bg-green-500/20'
    },
    wallet_deposit: {
        label: 'Wallet Deposit',
        icon: Wallet,
        color: 'text-purple-600',
        bg: 'bg-purple-100 dark:bg-purple-500/20'
    },
    refund: {
        label: 'Refund',
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-100 dark:bg-red-500/20'
    }
};

const statusMeta = {
    completed: {
        label: 'Completed',
        icon: CheckCircle2,
        chip: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    },
    pending: {
        label: 'Pending',
        icon: Clock,
        chip: 'bg-blue-500/10 text-blue-600 border-blue-200'
    },
    processing: {
        label: 'Processing',
        icon: RefreshCw,
        chip: 'bg-purple-500/10 text-purple-600 border-purple-200'
    },
    failed: {
        label: 'Failed',
        icon: XCircle,
        chip: 'bg-red-500/10 text-red-600 border-red-200'
    },
    reversed: {
        label: 'Reversed',
        icon: AlertCircle,
        chip: 'bg-amber-500/10 text-amber-600 border-amber-200'
    }
};

function formatCurrency(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function CopyButton({ text, label = "Copy" }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
        >
            {copied ? (
                <Check className="h-4 w-4 text-green-600" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
        </Button>
    );
}

function InfoRow({ label, value, copyable = false }) {
    return (
        <div className="flex justify-between items-start py-3 border-b last:border-b-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-right">{value}</span>
                {copyable && value && <CopyButton text={value} />}
            </div>
        </div>
    );
}

function VerificationPanel({ transaction, onVerify }) {
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            const result = await onVerify(transaction._id, transaction.gateway.reference);
            if (result.success) {
                toast.success('Transaction verified successfully');
            } else {
                toast.error(result.message || 'Verification failed');
            }
        } catch (error) {
            toast.error('Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const canVerify = ['pending', 'processing'].includes(transaction.status);

    if (!canVerify) return null;

    const age = Date.now() - new Date(transaction.createdAt).getTime();
    const ageMinutes = Math.floor(age / 60000);
    const shouldVerify = ageMinutes > 5;

    return (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    Manual Verification Required
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    <p>This transaction has been pending for <strong>{ageMinutes} minutes</strong>.</p>
                    {shouldVerify ? (
                        <p className="mt-2">You can manually verify the status with Paystack.</p>
                    ) : (
                        <p className="mt-2 text-amber-600">
                            Wait at least 5 minutes before verifying.
                        </p>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
                    <InfoRow
                        label="Reference"
                        value={transaction.gateway.reference}
                        copyable
                    />
                    <InfoRow
                        label="Created"
                        value={formatDate(transaction.createdAt)}
                    />
                    {transaction.payout?.paystackTransferCode && (
                        <InfoRow
                            label="Transfer Code"
                            value={transaction.payout.paystackTransferCode}
                            copyable
                        />
                    )}
                </div>

                <Button
                    onClick={handleVerify}
                    disabled={!shouldVerify || isVerifying}
                    className="w-full"
                >
                    {isVerifying ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Verifying with Paystack...
                        </>
                    ) : (
                        <>
                            <Shield className="mr-2 h-4 w-4" />
                            Verify Transaction Status
                        </>
                    )}
                </Button>

                {!shouldVerify && (
                    <p className="text-xs text-center text-muted-foreground">
                        Available in {5 - ageMinutes} minute(s)
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function TransactionDetail({ transactionData }) {
    const router = useRouter();
    const meta = transactionTypeMeta[transactionData.transactionType] || {};
    const statusInfo = statusMeta[transactionData.status] || statusMeta.pending;
    const Icon = meta.icon || FileText;
    const StatusIcon = statusInfo.icon;

    const handleVerifyTransaction = async (txId, reference) => {
        try {
            const response = await fetch('/api/admin/finance/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId: txId, reference })
            });

            const result = await response.json();

            if (result.success) {
                // Refresh the page to show updated data
                router.refresh();
            }

            return result;
        } catch (error) {
            console.error('Verification error:', error);
            return { success: false, message: 'Network error' };
        }
    };

    const handleExport = () => {
        const data = JSON.stringify(transactionData, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transaction-${transactionData._id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Transaction exported');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Transaction Details</h1>
                        <p className="text-muted-foreground">
                            {transactionData._id}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Status Banner */}
            <Card className={`border-2 ${meta.bg}`}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-xl ${meta.bg}`}>
                                <Icon className={`h-8 w-8 ${meta.color}`} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{meta.label}</h2>
                                <p className="text-muted-foreground">
                                    {formatDate(transactionData.createdAt)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge className={`${statusInfo.chip} text-lg px-4 py-2`}>
                                <StatusIcon className="h-5 w-5 mr-2" />
                                {statusInfo.label}
                            </Badge>
                            <div className="mt-2 text-3xl font-bold">
                                {formatCurrency(transactionData.amount.gross, transactionData.amount.currency)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Verification Panel (if pending) */}
                    {['pending', 'processing'].includes(transactionData.status) && (
                        <VerificationPanel
                            transaction={transactionData}
                            onVerify={handleVerifyTransaction}
                        />
                    )}

                    {/* Financial Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Financial Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <InfoRow
                                    label="Gross Amount"
                                    value={formatCurrency(transactionData.amount.gross)}
                                />
                                <InfoRow
                                    label="Fees"
                                    value={formatCurrency(transactionData.amount.fees)}
                                />
                                <Separator />
                                <InfoRow
                                    label="Net Amount"
                                    value={<span className="text-lg font-bold">
                                        {formatCurrency(transactionData.amount.net)}
                                    </span>}
                                />
                                <InfoRow
                                    label="Currency"
                                    value={transactionData.amount.currency}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gateway Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Gateway Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <InfoRow
                                    label="Provider"
                                    value={<Badge variant="outline" className="capitalize">
                                        {transactionData.gateway.provider}
                                    </Badge>}
                                />
                                <InfoRow
                                    label="Reference"
                                    value={transactionData.gateway.reference || 'N/A'}
                                    copyable
                                />
                                {transactionData.gateway.authorizationCode && (
                                    <InfoRow
                                        label="Authorization Code"
                                        value={transactionData.gateway.authorizationCode}
                                        copyable
                                    />
                                )}
                                {transactionData.gateway.channel && (
                                    <InfoRow
                                        label="Channel"
                                        value={<Badge variant="outline" className="capitalize">
                                            {transactionData.gateway.channel}
                                        </Badge>}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payout Details (for driver_payout) */}
                    {transactionData.transactionType === 'driver_payout' && transactionData.payout && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Payout Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <InfoRow
                                            label="Requested Amount"
                                            value={formatCurrency(transactionData.payout.requestedAmount)}
                                        />
                                        <InfoRow
                                            label="Transfer Fee"
                                            value={formatCurrency(transactionData.payout.transferFee)}
                                        />
                                        <InfoRow
                                            label="Net Amount"
                                            value={formatCurrency(transactionData.payout.netAmount)}
                                        />
                                        <InfoRow
                                            label="Transfer Status"
                                            value={<Badge variant="outline" className="capitalize">
                                                {transactionData.payout.transferStatus}
                                            </Badge>}
                                        />
                                        {transactionData.payout.paystackTransferRef && (
                                            <InfoRow
                                                label="Paystack Reference"
                                                value={transactionData.payout.paystackTransferRef}
                                                copyable
                                            />
                                        )}
                                    </div>

                                    {transactionData.payout.bankDetails && (
                                        <>
                                            <Separator />
                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-sm">Bank Details</h4>
                                                <InfoRow
                                                    label="Account Name"
                                                    value={transactionData.payout.bankDetails.accountName}
                                                />
                                                <InfoRow
                                                    label="Bank Name"
                                                    value={transactionData.payout.bankDetails.bankName}
                                                />
                                                <InfoRow
                                                    label="Account Number"
                                                    value={transactionData.payout.bankDetails.accountNumber}
                                                    copyable
                                                />
                                                <InfoRow
                                                    label="Bank Code"
                                                    value={transactionData.payout.bankDetails.bankCode}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Distribution (for revenue transactions) */}
                    {transactionData.distribution?.calculated && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Revenue Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <InfoRow
                                        label="Driver Share (70%)"
                                        value={formatCurrency(transactionData.distribution.driverShare)}
                                    />
                                    <InfoRow
                                        label="Platform Share (30%)"
                                        value={formatCurrency(transactionData.distribution.platformShare)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metadata */}
                    {transactionData.metadata && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Additional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {transactionData.metadata.description && (
                                        <InfoRow
                                            label="Description"
                                            value={transactionData.metadata.description}
                                        />
                                    )}
                                    {transactionData.metadata.channel && (
                                        <InfoRow
                                            label="Channel"
                                            value={<Badge variant="outline">
                                                {transactionData.metadata.channel}
                                            </Badge>}
                                        />
                                    )}
                                    {transactionData.metadata.notes && (
                                        <InfoRow
                                            label="Notes"
                                            value={transactionData.metadata.notes}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Related Parties */}
                    {(transactionData.clientInfo || transactionData.driverInfo) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Related Parties
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {transactionData.clientInfo && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs">Client</Badge>
                                        </div>
                                        <p className="font-medium">{transactionData.clientInfo.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {transactionData.clientInfo.email}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {transactionData.clientInfo.phone}
                                        </p>
                                    </div>
                                )}

                                {transactionData.driverInfo && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs">Driver</Badge>
                                        </div>
                                        <p className="font-medium">{transactionData.driverInfo.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {transactionData.driverInfo.email}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {transactionData.driverInfo.phone}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Related Order */}
                    {transactionData.orderInfo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Related Order
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <InfoRow
                                        label="Order Reference"
                                        value={transactionData.orderInfo.orderRef}
                                        copyable
                                    />
                                    <InfoRow
                                        label="Order Status"
                                        value={<Badge variant="outline" className="capitalize">
                                            {transactionData.orderInfo.status}
                                        </Badge>}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => router.push(`/admin/orders/view/${transactionData.orderId}`)}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Order
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <InfoRow
                                    label="Created"
                                    value={formatDate(transactionData.createdAt)}
                                />
                                {transactionData.processedAt && (
                                    <InfoRow
                                        label="Processed"
                                        value={formatDate(transactionData.processedAt)}
                                    />
                                )}
                                <InfoRow
                                    label="Last Updated"
                                    value={formatDate(transactionData.updatedAt)}
                                />
                                <InfoRow
                                    label="Processed By"
                                    value={<Badge variant="outline" className="capitalize">
                                        {transactionData.processedBy}
                                    </Badge>}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}