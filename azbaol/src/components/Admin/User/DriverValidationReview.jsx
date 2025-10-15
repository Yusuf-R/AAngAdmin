// src/components/Admin/User/DriverValidationReview.jsx
'use client';
import React, {useState} from 'react';

import {
    CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown,
    ChevronUp, MapPin, Phone, Mail, Calendar, Shield,
    Truck, FileText, Image as ImageIcon, X, Check, Ban, Loader2, ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import {useRouter} from "next/navigation";
import AdminUtils from "@/utils/AdminUtils";
import {toast} from "sonner";

function DriverValidationReview({driver}) {
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        specific: true,
        vehicle: false
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [actionModal, setActionModal] = useState({open: false, action: null});
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const verification = driver?.verification;
    const basicInfo = verification?.basicVerification;
    const specificInfo = verification?.specificVerification;
    const vehicleType = specificInfo?.activeVerificationType;
    const vehicleData = specificInfo?.[vehicleType];

    const toggleSection = (section) => {
        setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
    };

    const handleImageClick = (imageUrl, title) => {
        setSelectedImages([{url: imageUrl, title}]);
    };

    const handleAction = async (action) => {
        const payload = {
            action,
            id: driver._id,
            feedback
        }
        setLoading(true);
        try {
            // API call to update driver verification status
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

    const ImagePreview = ({url, title, onClose}) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose}
                        className="absolute -top-4 -right-4 p-2 rounded-full bg-white dark:bg-slate-800 shadow-lg">
                    <X className="w-5 h-5"/>
                </button>
                {/* Use regular img for modal since it's not part of layout */}
                <img
                    src={url}
                    alt={title}
                    className="rounded-lg object-contain max-h-[85vh] w-full"
                />
                <p className="mt-4 text-center text-white font-medium">{title}</p>
            </div>
        </div>
    );

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-500">

            <div className="max-w-7xl mx-auto space-y-6">
                {/*Intro and Back Button */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.back()}
                                    className="p-2 rounded-xl backdrop-blur-sm transition  bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90  dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white dark:hover:bg-slate-700/50">
                                <ArrowLeft className="h-5 w-5 color-green-600 "/>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Validation Review</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive credential overview</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/*{verification?.overallStatus !== 'submitted' && (*/}
                {/*    <div className={`rounded-2xl border p-6 ${*/}
                {/*        verification?.overallStatus === 'approved'*/}
                {/*            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'*/}
                {/*            : verification?.overallStatus === 'rejected'*/}
                {/*                ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'*/}
                {/*                : 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20'*/}
                {/*    }`}>*/}
                {/*        <div className="flex items-center gap-3">*/}
                {/*            {verification?.overallStatus === 'approved' ? (*/}
                {/*                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />*/}
                {/*            ) : verification?.overallStatus === 'rejected' ? (*/}
                {/*                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />*/}
                {/*            ) : (*/}
                {/*                <Ban className="w-6 h-6 text-orange-600 dark:text-orange-400" />*/}
                {/*            )}*/}
                {/*            <div>*/}
                {/*                <h3 className="font-semibold text-foreground capitalize">*/}
                {/*                    {verification?.overallStatus} - {formatDate(verification?.verificationDate)}*/}
                {/*                </h3>*/}
                {/*                {verification?.rejectionReason && verification?.overallStatus !== 'approved' && (*/}
                {/*                    <p className="text-sm text-muted-foreground mt-1">*/}
                {/*                        <strong>Reason:</strong> {verification.rejectionReason}*/}
                {/*                    </p>*/}
                {/*                )}*/}
                {/*                {verification?.verifiedBy && (*/}
                {/*                    <p className="text-sm text-muted-foreground">*/}
                {/*                        Verified by Admin*/}
                {/*                    </p>*/}
                {/*                )}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*)}*/}

                {/* Status Summary Banner - Show for all statuses except 'submitted' */}
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
                                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" /> // For pending status
                            )}
                            <div>
                                <h3 className="font-semibold text-foreground capitalize">
                                    {verification.overallStatus} {verification.verificationDate && `- ${formatDate(verification.verificationDate)}`}
                                </h3>
                                {verification.rejectionReason && verification.overallStatus !== 'approved' &&  (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        <strong>Reason:</strong> {verification.rejectionReason}
                                    </p>
                                )}
                                {verification.verifiedBy &&  (
                                    <p className="text-sm text-muted-foreground">
                                        Verified by Admin
                                    </p>
                                )}
                                {verification.overallStatus === 'pending' && (
                                    <p className="text-sm text-muted-foreground">
                                        Waiting for driver to complete submission
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                                {driver.avatar ? (
                                    <Image src={driver.avatar} alt={driver.fullName} width={80} height={80}
                                           className="object-cover"/>
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                        {driver.fullName?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{driver.fullName}</h1>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Mail className="w-4 h-4"/>{driver.email}</span>
                                    <span className="flex items-center gap-1"><Phone
                                        className="w-4 h-4"/>{driver.phoneNumber}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    {getStatusBadge(verification?.overallStatus)}
                                    <span className="text-sm text-muted-foreground">
                                        Submitted: {formatDate(verification?.lastReviewDate)}
                                    </span>
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
                {/* Basic Verification */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <button
                        onClick={() => toggleSection('basic')}
                        className="w-full flex items-center justify-between p-6 hover:bg-muted/40 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/>
                            <h2 className="text-xl font-bold text-foreground">Basic Verification</h2>
                        </div>
                        {expandedSections.basic ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                    </button>

                    {expandedSections.basic && (
                        <div className="p-6 space-y-6 border-t border-border">
                            {/* Identification */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-4">Identification Document</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Type</p>
                                        <p className="font-medium text-foreground capitalize">
                                            {basicInfo?.identification?.type?.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Number</p>
                                        <p className="font-medium text-foreground">{basicInfo?.identification?.number}</p>
                                    </div>
                                    {basicInfo?.identification?.expiryDate && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Expiry Date</p>
                                            <p className="font-medium text-foreground">{formatDate(basicInfo.identification.expiryDate)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        {getStatusBadge(basicInfo?.identification?.status)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {basicInfo?.identification?.frontImageUrl && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Front Image</p>
                                            <div
                                                onClick={() => handleImageClick(basicInfo.identification.frontImageUrl, 'ID Front')}
                                                className="relative h-48 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                <Image
                                                    src={basicInfo.identification.frontImageUrl}
                                                    alt="ID Front"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover"
                                                    priority
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {basicInfo?.identification?.backImageUrl && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Back Image</p>
                                            <div
                                                onClick={() => handleImageClick(basicInfo.identification.backImageUrl, 'ID Back')}
                                                className="relative h-48 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                                <Image
                                                    src={basicInfo.identification.backImageUrl}
                                                    alt="Passport"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 25vw"
                                                    className="object-cover"
                                                    priority
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Passport Photo */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-4">Passport Photograph</h3>
                                <div className="w-48">
                                    {basicInfo?.passportPhoto?.imageUrl && (
                                        <div
                                            onClick={() => handleImageClick(basicInfo.passportPhoto.imageUrl, 'Passport Photo')}
                                            className="relative h-64 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <Image
                                                src={basicInfo.passportPhoto.imageUrl}
                                                alt="Passport"
                                                fill
                                                sizes="(max-width: 768px) 100vw, 25vw"
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operational Area */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-4">Operational Area</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">State</p>
                                        <p className="font-medium text-foreground">{basicInfo?.operationalArea?.state}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">LGA</p>
                                        <p className="font-medium text-foreground">{basicInfo?.operationalArea?.lga}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Accounts */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-4">Bank Accounts</h3>
                                <div className="space-y-3">
                                    {basicInfo?.bankAccounts?.map((account, idx) => (
                                        <div key={idx} className="p-4 rounded-lg border border-border bg-muted/20">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Account Name</p>
                                                    <p className="font-medium text-foreground">{account.accountName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Account Number</p>
                                                    <p className="font-medium text-foreground">{account.accountNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Bank</p>
                                                    <p className="font-medium text-foreground">{account.bankName}</p>
                                                </div>
                                            </div>
                                            {account.isPrimary && (
                                                <span
                                                    className="inline-block mt-2 px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                                    Primary Account
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                                <h2 className="text-xl font-bold text-foreground capitalize">{vehicleType} Documentation</h2>
                            </div>
                            {expandedSections.specific ? <ChevronUp className="w-5 h-5"/> :
                                <ChevronDown className="w-5 h-5"/>}
                        </button>

                        {expandedSections.specific && (
                            <div className="p-6 space-y-6 border-t border-border">
                                {/* Render based on vehicle type */}
                                {vehicleType === 'bicycle' && (
                                    <>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Has Helmet</p>
                                            <p className="font-medium text-foreground">{vehicleData.hasHelmet ? 'Yes' : 'No'}</p>
                                        </div>

                                        {vehicleData.backpackEvidence?.imageUrl && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground mb-4">Backpack
                                                    Evidence</h3>
                                                <div
                                                    onClick={() => handleImageClick(vehicleData.backpackEvidence.imageUrl, 'Backpack')}
                                                    className="relative h-64 w-full rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                                >
                                                    <Image src={vehicleData.backpackEvidence.imageUrl} alt="Backpack"
                                                           fill className="object-cover"
                                                           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"/>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground mb-4">Bicycle
                                                Pictures</h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['front', 'rear', 'side'].map((view) => (
                                                    vehicleData.bicyclePictures?.[view]?.imageUrl && (
                                                        <div key={view}>
                                                            <p className="text-sm text-muted-foreground mb-2 capitalize">{view}</p>
                                                            <div
                                                                onClick={() => handleImageClick(vehicleData.bicyclePictures[view].imageUrl, `Bicycle ${view}`)}
                                                                className="relative h-48 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                                            >
                                                                <Image priority
                                                                       src={vehicleData.bicyclePictures[view].imageUrl}
                                                                       alt={view} fill className="object-cover"
                                                                       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"/>
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Add more vehicle types rendering here */}
                            </div>
                        )}
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
                                className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none mb-4"
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
                                className="flex-1 px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-accent transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(actionModal.action)}
                                disabled={loading || (actionModal.action !== 'approve' && !feedback.trim())}
                                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                                    actionModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        actionModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                            'bg-slate-600 hover:bg-slate-700'
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