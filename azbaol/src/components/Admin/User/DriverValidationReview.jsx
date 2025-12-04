// src/components/Admin/User/DriverValidationReview.jsx
'use client';
import React, {useState} from 'react';

import {
    CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown,
    ChevronUp, MapPin, Phone, Mail, Calendar, Shield,
    Truck, FileText, Image as ImageIcon, X, Check, Ban, Loader2, ArrowLeft,
    AlertTriangle, Info, History, Eye
} from 'lucide-react';
import {useRouter} from "next/navigation";
import AdminUtils from "@/utils/AdminUtils";
import {toast} from "sonner";

function DriverValidationReview({driver}) {
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        specific: true,
        submissions: false,
        pendingUpdate: false,
        activeData: false
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [actionModal, setActionModal] = useState({open: false, action: null});
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const verification = driver?.verification;

    // Determine which data to show based on status
    const isApproved = verification?.overallStatus === 'approved';
    const hasPendingUpdate = verification?.pendingUpdate?.exists;

    // Use activeData if approved, otherwise use current verification data
    const displayData = isApproved && verification?.activeData
        ? verification.activeData
        : verification;

    const basicInfo = displayData?.basicVerification;
    const specificInfo = displayData?.specificVerification;
    const vehicleType = specificInfo?.activeVerificationType;
    const vehicleData = specificInfo?.[vehicleType];
    const vehicleDetails = displayData?.vehicleDetails || driver?.vehicleDetails;

    const toggleSection = (section) => {
        setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
    };

    const handleImageClick = (imageUrl, title) => {
        if (imageUrl) setSelectedImages([{url: imageUrl, title}]);
    };

    const handleAction = async (action) => {
        const payload = {
            action,
            id: driver._id,
            feedback
        }
        setLoading(true);
        try {
            await AdminUtils.adminReviewDriverVerification(payload)
            setActionModal({open: false, action: null});
            setFeedback('');
            toast.success(`Validation updated successfully: ${action}`)
            router.refresh();
        } catch (error) {
            console.error('Action failed:', error);
            toast.error(`Error: ${error.message}`)
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: {
                bg: 'bg-gray-100 dark:bg-gray-500/20',
                text: 'text-gray-600 dark:text-gray-400',
                label: 'Pending'
            },
            submitted: {
                bg: 'bg-amber-100 dark:bg-amber-500/20',
                text: 'text-amber-600 dark:text-amber-400',
                label: 'Submitted'
            },
            approved: {
                bg: 'bg-emerald-100 dark:bg-emerald-500/20',
                text: 'text-emerald-600 dark:text-emerald-400',
                label: 'Approved'
            },
            rejected: {
                bg: 'bg-red-100 dark:bg-red-500/20',
                text: 'text-red-600 dark:text-red-400',
                label: 'Rejected'
            },
            suspended: {
                bg: 'bg-orange-100 dark:bg-orange-500/20',
                text: 'text-orange-600 dark:text-orange-400',
                label: 'Suspended'
            },
            expired: {
                bg: 'bg-purple-100 dark:bg-purple-500/20',
                text: 'text-purple-600 dark:text-purple-400',
                label: 'Expired'
            }
        };
        const s = config[status] || config.pending;
        return <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});
    };

    const getButtonStates = () => {
        const currentStatus = verification?.overallStatus;

        switch (currentStatus) {
            case 'approved':
                return {
                    approve: {disabled: true, variant: 'disabled'},
                    reject: {disabled: false, variant: 'danger'},
                    suspend: {disabled: false, variant: 'warning'}
                };
            case 'rejected':
                return {
                    approve: {disabled: false, variant: 'success'},
                    reject: {disabled: true, variant: 'disabled'},
                    suspend: {disabled: false, variant: 'warning'}
                };
            case 'suspended':
                return {
                    approve: {disabled: false, variant: 'success'},
                    reject: {disabled: false, variant: 'danger'},
                    suspend: {disabled: true, variant: 'disabled'}
                };
            case 'pending':
                return {
                    approve: { disabled: true, variant: 'disabled' },
                    reject: { disabled: true, variant: 'disabled' },
                    suspend: { disabled: true, variant: 'disabled' }
                };
            case 'submitted':
            default:
                return {
                    approve: {disabled: false, variant: 'success'},
                    reject: {disabled: false, variant: 'danger'},
                    suspend: {disabled: false, variant: 'warning'}
                };
        }
    };

    const buttonStates = getButtonStates();

    const getButtonClass = (variant) => {
        const baseClass = "flex items-center gap-2 px-6 py-3 rounded-lg transition-colors";

        switch (variant) {
            case 'success':
                return `${baseClass} bg-emerald-600 hover:bg-emerald-700 text-white`;
            case 'danger':
                return `${baseClass} bg-red-600 hover:bg-red-700 text-white`;
            case 'warning':
                return `${baseClass} bg-orange-600 hover:bg-orange-700 text-white`;
            case 'disabled':
                return `${baseClass} bg-gray-400 cursor-not-allowed text-white`;
            default:
                return `${baseClass} bg-gray-600 hover:bg-gray-700 text-white`;
        }
    };

    // Replace the existing ImagePreview component
    const ImagePreview = ({url, title, onClose}) => {
        const [isLoading, setIsLoading] = useState(true);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
                <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onClose}
                            className="absolute -top-4 -right-4 p-2 rounded-full bg-white dark:bg-slate-800 shadow-lg z-10">
                        <X className="w-5 h-5"/>
                    </button>

                    {/* Loading overlay for preview */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="w-12 h-12 animate-spin text-white" />
                        </div>
                    )}

                    <img
                        src={url}
                        alt={title}
                        className={`rounded-lg object-contain max-h-[85vh] w-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                    <p className="mt-4 text-center text-white font-medium">{title}</p>
                </div>
            </div>
        );
    };

    // Update the DocumentItem component's image rendering part
    const DocumentItem = ({label, value, status, imageUrl, imageTitle, expiryDate}) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                {status && getStatusBadge(status)}
            </div>
            {value && <p className="font-medium text-foreground">{value}</p>}
            {expiryDate && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3"/>
                    Expires: {formatDate(expiryDate)}
                </p>
            )}
            {imageUrl && (
                <div
                    onClick={() => handleImageClick(imageUrl, imageTitle || label)}
                    className="h-32 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <IntelligentImage
                        src={imageUrl}
                        alt={imageTitle || label}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
        </div>
    );

    // Update the renderVehiclePictures function
    const renderVehiclePictures = (pictures, type = 'vehicle') => {
        if (!pictures) return null;

        const views = type === 'bicycle'
            ? ['front', 'rear', 'side']
            : ['front', 'rear', 'side', 'inside'];

        return (
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 capitalize">{type} Pictures</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {views.map((view) => (
                        pictures[view]?.imageUrl && (
                            <div key={view}>
                                <p className="text-sm text-muted-foreground mb-2 capitalize">{view}</p>
                                <div
                                    onClick={() => handleImageClick(pictures[view].imageUrl, `${type} ${view}`)}
                                    className="h-40 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    <IntelligentImage
                                        src={pictures[view].imageUrl}
                                        alt={view}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {pictures[view].uploadedAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDate(pictures[view].uploadedAt)}
                                    </p>
                                )}
                            </div>
                        )
                    ))}
                </div>
            </div>
        );
    };

    const IntelligentImage = ({ src, alt, className, onClick, sizes }) => {
        const [isLoading, setIsLoading] = useState(true);
        const [hasError, setHasError] = useState(false);
        const [retryCount, setRetryCount] = useState(0);

        const handleLoad = () => {
            setIsLoading(false);
            setHasError(false);
        };

        const handleError = () => {
            setIsLoading(false);
            setHasError(true);
        };

        const handleRetry = (e) => {
            e.stopPropagation();
            setRetryCount(prev => prev + 1);
            setIsLoading(true);
            setHasError(false);
        };

        const getImageUrl = () => {
            if (!src) return '';
            // Add timestamp to bust cache on retry
            const separator = src.includes('?') ? '&' : '?';
            return `${src}${retryCount > 0 ? `${separator}_retry=${retryCount}` : ''}`;
        };

        return (
            <div className="relative">
                {/* Loading spinner */}
                {isLoading && (
                    <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-700 ${className}`}>
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-slate-400" />
                    </div>
                )}

                {/* Broken image placeholder */}
                {hasError ? (
                    <div
                        className={`flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 cursor-pointer ${className}`}
                        onClick={handleRetry}
                    >
                        <ImageIcon className="w-8 h-8 text-red-400 dark:text-red-500 mb-2" />
                        <span className="text-xs text-red-500 dark:text-red-400">Failed to load</span>
                        <span className="text-xs text-red-400 dark:text-red-500 mt-1">Click to retry</span>
                    </div>
                ) : (
                    /* Actual image */
                    <img
                        src={getImageUrl()}
                        alt={alt}
                        loading="lazy"
                        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                        onLoad={handleLoad}
                        onError={handleError}
                        onClick={onClick}
                        sizes={sizes}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-500">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.back()}
                                    className="p-2 rounded-xl backdrop-blur-sm transition bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white dark:hover:bg-slate-700/50">
                                <ArrowLeft className="h-5 w-5"/>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Validation Review</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {isApproved ? 'Currently Approved - Reviewing Active Data' : 'Pending Verification Review'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Update Alert */}
                {hasPendingUpdate && verification.pendingUpdate.status === 'pending_review' && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 p-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"/>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                    Pending Update Request
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Driver has submitted an update request ({verification.pendingUpdate.updateType?.replace('_', ' ')})
                                    on {formatDate(verification.pendingUpdate.submittedAt)}
                                </p>
                                <button
                                    onClick={() => toggleSection('pendingUpdate')}
                                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <Eye className="w-4 h-4"/>
                                    View Pending Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Summary Banner */}
                {verification?.overallStatus && verification.overallStatus !== 'submitted' && (
                    <div className={`rounded-2xl border p-6 ${
                        verification.overallStatus === 'approved'
                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                            : verification.overallStatus === 'rejected'
                                ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                                : verification.overallStatus === 'suspended'
                                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-500/10 dark:border-gray-500/20'
                    }`}>
                        <div className="flex items-center gap-3">
                            {verification.overallStatus === 'approved' ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            ) : verification.overallStatus === 'rejected' ? (
                                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            ) : verification.overallStatus === 'suspended' ? (
                                <Ban className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            ) : (
                                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            )}
                            <div>
                                <h3 className="font-semibold text-foreground capitalize">
                                    {verification.overallStatus} {verification.verificationDate && `- ${formatDate(verification.verificationDate)}`}
                                </h3>
                                {verification.rejectionReason && verification.overallStatus !== 'approved' && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        <strong>Reason:</strong> {verification.rejectionReason}
                                    </p>
                                )}
                                {isApproved && verification.activeData?.approvedAt && (
                                    <p className="text-sm text-muted-foreground">
                                        Approved on {formatDate(verification.activeData.approvedAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Driver Info Header */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                                {driver.avatar ? (
                                    <IntelligentImage
                                        src={driver.avatar}
                                        alt={driver.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                        {driver.fullName?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{driver.fullName}</h1>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Mail className="w-4 h-4"/>{driver.email}</span>
                                    <span className="flex items-center gap-1"><Phone className="w-4 h-4"/>{driver.phoneNumber}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    {getStatusBadge(verification?.overallStatus)}
                                    {vehicleDetails && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 capitalize">
                                            {vehicleDetails.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => !buttonStates.approve.disabled && setActionModal({open: true, action: 'approve'})}
                                className={getButtonClass(buttonStates.approve.variant)}
                                disabled={buttonStates.approve.disabled}
                            >
                                <CheckCircle2 className="w-5 h-5"/>
                                {verification?.overallStatus === 'approved' ? 'Approved' : 'Approve'}
                            </button>
                            <button
                                onClick={() => !buttonStates.reject.disabled && setActionModal({open: true, action: 'reject'})}
                                className={getButtonClass(buttonStates.reject.variant)}
                                disabled={buttonStates.reject.disabled}
                            >
                                <XCircle className="w-5 h-5"/>
                                {verification?.overallStatus === 'rejected' ? 'Rejected' : 'Reject'}
                            </button>
                            <button
                                onClick={() => !buttonStates.suspend.disabled && setActionModal({open: true, action: 'suspend'})}
                                className={getButtonClass(buttonStates.suspend.variant)}
                                disabled={buttonStates.suspend.disabled}
                            >
                                <Ban className="w-5 h-5"/>
                                {verification?.overallStatus === 'suspended' ? 'Suspended' : 'Suspend'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Submission History */}
                {verification?.submissions?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <button
                            onClick={() => toggleSection('submissions')}
                            className="w-full flex items-center justify-between p-6 hover:bg-muted/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <History className="w-6 h-6 text-purple-600 dark:text-purple-400"/>
                                <h2 className="text-xl font-bold text-foreground">
                                    Submission History ({verification.submissions.length})
                                </h2>
                            </div>
                            {expandedSections.submissions ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </button>

                        {expandedSections.submissions && (
                            <div className="p-6 border-t border-border">
                                <div className="space-y-3">
                                    {verification.submissions.slice().reverse().map((submission, idx) => (
                                        <div key={submission._id || idx} className="p-4 rounded-lg border border-border bg-muted/20">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getStatusBadge(submission.status)}
                                                        <span className="text-xs text-muted-foreground capitalize">
                                                            {submission.submissionType}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Submitted: {formatDate(submission.submittedAt)}
                                                    </p>
                                                    {submission.reviewedAt && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Reviewed: {formatDate(submission.reviewedAt)}
                                                        </p>
                                                    )}
                                                    {submission.feedback && (
                                                        <p className="text-sm text-foreground mt-2">
                                                            <strong>Feedback:</strong> {submission.feedback}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Basic Verification */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <button
                        onClick={() => toggleSection('basic')}
                        className="w-full flex items-center justify-between p-6 hover:bg-muted/40 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/>
                            <h2 className="text-xl font-bold text-foreground">Basic Verification</h2>
                            {isApproved && <span className="text-xs text-emerald-600 dark:text-emerald-400">(Active Data)</span>}
                        </div>
                        {expandedSections.basic ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                    </button>

                    {expandedSections.basic && (
                        <div className="p-6 space-y-6 border-t border-border">
                            {/* Identification */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-4">Identification Document</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <DocumentItem
                                        label="Type"
                                        value={basicInfo?.identification?.type?.replace('_', ' ').toUpperCase()}
                                    />
                                    <DocumentItem
                                        label="Number"
                                        value={basicInfo?.identification?.number}
                                    />
                                    {basicInfo?.identification?.expiryDate && (
                                        <DocumentItem
                                            label="Expiry Date"
                                            value={formatDate(basicInfo.identification.expiryDate)}
                                        />
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Status</p>
                                        {getStatusBadge(basicInfo?.identification?.status)}
                                    </div>
                                </div>

                                {basicInfo?.identification?.rejectionReason && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-4">
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            <strong>Rejection Reason:</strong> {basicInfo.identification.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {basicInfo?.identification?.frontImageUrl && (
                                        <DocumentItem
                                            label="Front Image"
                                            imageUrl={basicInfo.identification.frontImageUrl}
                                            imageTitle="ID Front"
                                        />
                                    )}
                                    {basicInfo?.identification?.backImageUrl && (
                                        <DocumentItem
                                            label="Back Image"
                                            imageUrl={basicInfo.identification.backImageUrl}
                                            imageTitle="ID Back"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Passport Photo */}
                            {basicInfo?.passportPhoto?.imageUrl && (
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Passport Photograph</h3>
                                    <div className="w-48">
                                        <DocumentItem
                                            imageUrl={basicInfo.passportPhoto.imageUrl}
                                            imageTitle="Passport Photo"
                                            status={basicInfo.passportPhoto.status}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Operational Area */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-4">Operational Area</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <DocumentItem label="State" value={basicInfo?.operationalArea?.state} />
                                    <DocumentItem label="LGA" value={basicInfo?.operationalArea?.lga} />
                                </div>
                            </div>

                            {/* Bank Accounts */}
                            {basicInfo?.bankAccounts?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Bank Accounts</h3>
                                    <div className="space-y-3">
                                        {basicInfo.bankAccounts.map((account, idx) => (
                                            <div key={idx} className="p-4 rounded-lg border border-border bg-muted/20">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <DocumentItem label="Account Name" value={account.accountName} />
                                                    <DocumentItem label="Account Number" value={account.accountNumber} />
                                                    <DocumentItem label="Bank" value={account.bankName} />
                                                </div>
                                                {account.isPrimary && (
                                                    <span className="inline-block mt-2 px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                                        Primary Account
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Vehicle-Specific Verification */}
                {vehicleType && vehicleData && (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <button
                            onClick={() => toggleSection('specific')}
                            className="w-full flex items-center justify-between p-6 hover:bg-muted/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400"/>
                                <h2 className="text-xl font-bold text-foreground capitalize">
                                    {vehicleType} Documentation
                                </h2>
                                {isApproved && <span className="text-xs text-emerald-600 dark:text-emerald-400">(Active Data)</span>}
                            </div>
                            {expandedSections.specific ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </button>

                        {expandedSections.specific && (
                            <div className="p-6 space-y-6 border-t border-border">
                                {/* Vehicle Details */}
                                {vehicleDetails && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-4">Vehicle Information</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/20 border border-border">
                                            <DocumentItem label="Plate Number" value={vehicleDetails.plateNumber} />
                                            <DocumentItem label="Model" value={vehicleDetails.model} />
                                            <DocumentItem label="Year" value={vehicleDetails.year} />
                                            <DocumentItem label="Color" value={vehicleDetails.color} />
                                        </div>
                                    </div>
                                )}

                                {/* BICYCLE */}
                                {vehicleType === 'bicycle' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <DocumentItem
                                                label="Has Helmet"
                                                value={vehicleData.hasHelmet ? 'Yes' : 'No'}
                                            />
                                        </div>

                                        {vehicleData.backpackEvidence?.imageUrl && (
                                            <DocumentItem
                                                label="Backpack Evidence"
                                                imageUrl={vehicleData.backpackEvidence.imageUrl}
                                                imageTitle="Backpack Evidence"
                                                status={vehicleData.backpackEvidence.status}
                                            />
                                        )}

                                        {vehicleData.bicyclePictures && renderVehiclePictures(vehicleData.bicyclePictures, 'bicycle')}
                                    </>
                                )}

                                {/* TRICYCLE */}
                                {vehicleType === 'tricycle' && (
                                    <>
                                        {vehicleData.pictures && renderVehiclePictures(vehicleData.pictures, 'tricycle')}

                                        {vehicleData.driversLicense && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Driver's License</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="License Number"
                                                        value={vehicleData.driversLicense.number}
                                                        status={vehicleData.driversLicense.status}
                                                    />
                                                    {vehicleData.driversLicense.expiryDate && (
                                                        <DocumentItem
                                                            label="Expiry Date"
                                                            value={formatDate(vehicleData.driversLicense.expiryDate)}
                                                        />
                                                    )}
                                                </div>
                                                {vehicleData.driversLicense.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            label="License Image"
                                                            imageUrl={vehicleData.driversLicense.imageUrl}
                                                            imageTitle="Driver's License"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.hackneyPermit?.required && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Hackney Permit (Lagos)</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Permit Number"
                                                        value={vehicleData.hackneyPermit.number}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.hackneyPermit.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.hackneyPermit.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.hackneyPermit.imageUrl}
                                                            imageTitle="Hackney Permit"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.lasdriCard?.required && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">LASDRI Card (Lagos)</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Card Number"
                                                        value={vehicleData.lasdriCard.number}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.lasdriCard.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.lasdriCard.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.lasdriCard.imageUrl}
                                                            imageTitle="LASDRI Card"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* MOTORCYCLE */}
                                {vehicleType === 'motorcycle' && (
                                    <>
                                        {vehicleData.pictures && renderVehiclePictures(vehicleData.pictures, 'motorcycle')}

                                        {vehicleData.ridersPermit && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Rider's Permit</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Card Number"
                                                        value={vehicleData.ridersPermit.cardNumber}
                                                        status={vehicleData.ridersPermit.status}
                                                    />
                                                    <DocumentItem
                                                        label="Issuing Office"
                                                        value={vehicleData.ridersPermit.issuingOffice}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.ridersPermit.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.ridersPermit.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.ridersPermit.imageUrl}
                                                            imageTitle="Rider's Permit"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.commercialLicense && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Commercial License</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="License Number"
                                                        value={vehicleData.commercialLicense.licenseNumber}
                                                        status={vehicleData.commercialLicense.status}
                                                    />
                                                    <DocumentItem
                                                        label="Class"
                                                        value={vehicleData.commercialLicense.class}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.commercialLicense.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.commercialLicense.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.commercialLicense.imageUrl}
                                                            imageTitle="Commercial License"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.proofOfAddress?.imageUrl && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Proof of Address</h3>
                                                <DocumentItem
                                                    label="Document Type"
                                                    value={vehicleData.proofOfAddress.documentType?.replace('_', ' ').toUpperCase()}
                                                    imageUrl={vehicleData.proofOfAddress.imageUrl}
                                                    imageTitle="Proof of Address"
                                                />
                                            </div>
                                        )}

                                        {vehicleData.proofOfOwnership?.imageUrl && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Proof of Ownership</h3>
                                                <DocumentItem
                                                    label="Document Type"
                                                    value={vehicleData.proofOfOwnership.documentType?.replace('_', ' ').toUpperCase()}
                                                    imageUrl={vehicleData.proofOfOwnership.imageUrl}
                                                    imageTitle="Proof of Ownership"
                                                />
                                            </div>
                                        )}

                                        {vehicleData.roadWorthiness?.certificateNumber && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Road Worthiness</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Certificate Number"
                                                        value={vehicleData.roadWorthiness.certificateNumber}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.roadWorthiness.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.roadWorthiness.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.roadWorthiness.imageUrl}
                                                            imageTitle="Road Worthiness Certificate"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.bvnNumber?.number && !vehicleData.bvnNumber.optional && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">BVN Number</h3>
                                                <DocumentItem
                                                    label="BVN"
                                                    value={vehicleData.bvnNumber.number}
                                                />
                                            </div>
                                        )}

                                        {vehicleData.hackneyPermit?.required && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Hackney Permit (Lagos)</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Permit Number"
                                                        value={vehicleData.hackneyPermit.number}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.hackneyPermit.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.hackneyPermit.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.hackneyPermit.imageUrl}
                                                            imageTitle="Hackney Permit"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.lasdriCard?.required && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">LASDRI Card (Lagos)</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Card Number"
                                                        value={vehicleData.lasdriCard.number}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.lasdriCard.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.lasdriCard.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.lasdriCard.imageUrl}
                                                            imageTitle="LASDRI Card"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* VEHICLE (Car, Van, Truck) */}
                                {vehicleType === 'vehicle' && (
                                    <>
                                        {vehicleData.pictures && renderVehiclePictures(vehicleData.pictures, 'vehicle')}

                                        {vehicleData.driversLicense && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Driver's License</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="License Number"
                                                        value={vehicleData.driversLicense.number}
                                                        status={vehicleData.driversLicense.status}
                                                    />
                                                    <DocumentItem
                                                        label="Class"
                                                        value={vehicleData.driversLicense.class}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.driversLicense.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.driversLicense.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.driversLicense.imageUrl}
                                                            imageTitle="Driver's License"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.vehicleRegistration && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Vehicle Registration</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Registration Number"
                                                        value={vehicleData.vehicleRegistration.registrationNumber}
                                                        status={vehicleData.vehicleRegistration.status}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.vehicleRegistration.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.vehicleRegistration.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.vehicleRegistration.imageUrl}
                                                            imageTitle="Vehicle Registration"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.insurance && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Insurance</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Policy Number"
                                                        value={vehicleData.insurance.policyNumber}
                                                        status={vehicleData.insurance.status}
                                                    />
                                                    <DocumentItem
                                                        label="Provider"
                                                        value={vehicleData.insurance.provider}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.insurance.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.insurance.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.insurance.imageUrl}
                                                            imageTitle="Insurance Certificate"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.roadWorthiness && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Road Worthiness</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Certificate Number"
                                                        value={vehicleData.roadWorthiness.certificateNumber}
                                                        status={vehicleData.roadWorthiness.status}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.roadWorthiness.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.roadWorthiness.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.roadWorthiness.imageUrl}
                                                            imageTitle="Road Worthiness Certificate"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.hackneyPermit?.required && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Hackney Permit (Lagos)</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Permit Number"
                                                        value={vehicleData.hackneyPermit.number}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.hackneyPermit.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.hackneyPermit.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.hackneyPermit.imageUrl}
                                                            imageTitle="Hackney Permit"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {vehicleData.lasdriCard?.required && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">LASDRI Card (Lagos)</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DocumentItem
                                                        label="Card Number"
                                                        value={vehicleData.lasdriCard.number}
                                                    />
                                                    <DocumentItem
                                                        label="Expiry Date"
                                                        value={formatDate(vehicleData.lasdriCard.expiryDate)}
                                                    />
                                                </div>
                                                {vehicleData.lasdriCard.imageUrl && (
                                                    <div className="mt-4">
                                                        <DocumentItem
                                                            imageUrl={vehicleData.lasdriCard.imageUrl}
                                                            imageTitle="LASDRI Card"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pending Update Details */}
                {hasPendingUpdate && expandedSections.pendingUpdate && verification.pendingUpdate.proposedChanges && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 dark:bg-blue-500/5 dark:border-blue-500/20 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                                <h2 className="text-xl font-bold text-foreground">Proposed Changes</h2>
                            </div>

                            {verification.pendingUpdate.changesSummary && (
                                <div className="mb-4 p-4 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-500/20">
                                    <h3 className="font-semibold text-foreground mb-2">Summary of Changes</h3>
                                    {verification.pendingUpdate.changesSummary.vehicleTypeChange && (
                                        <p className="text-sm text-muted-foreground">
                                            • Vehicle Type: {verification.pendingUpdate.changesSummary.vehicleTypeChange.from} → {verification.pendingUpdate.changesSummary.vehicleTypeChange.to}
                                        </p>
                                    )}
                                    {verification.pendingUpdate.changesSummary.locationChange && (
                                        <p className="text-sm text-muted-foreground">
                                            • Location: {verification.pendingUpdate.changesSummary.locationChange.from?.state} → {verification.pendingUpdate.changesSummary.locationChange.to?.state}
                                        </p>
                                    )}
                                    {verification.pendingUpdate.changesSummary.documentsUpdated?.length > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            • Documents Updated: {verification.pendingUpdate.changesSummary.documentsUpdated.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground italic">
                                Review the proposed changes above and compare with current data before approving or rejecting.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {selectedImages.length > 0 && (
                <ImagePreview
                    url={selectedImages[0].url}
                    title={selectedImages[0].title}
                    onClose={() => setSelectedImages([])}
                />
            )}

            {/* Action Confirmation Modal */}
            {actionModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-foreground mb-4 capitalize">
                            {actionModal.action} Verification
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {actionModal.action === 'approve' && 'Approve this driver for platform access?'}
                            {actionModal.action === 'reject' && 'Reject this verification submission? Please provide a reason.'}
                            {actionModal.action === 'suspend' && 'Suspend this driver? This will restrict their access.'}
                        </p>

                        {actionModal.action !== 'approve' && (
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Enter feedback/reason (required)"
                                className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                            />
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionModal({open: false, action: null});
                                    setFeedback('');
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(actionModal.action)}
                                disabled={loading || (actionModal.action !== 'approve' && !feedback.trim())}
                                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                                    actionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        actionModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                            'bg-orange-600 hover:bg-orange-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin"/>
                                        Processing...
                                    </>
                                ) : (
                                    <>Confirm {actionModal.action}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DriverValidationReview;