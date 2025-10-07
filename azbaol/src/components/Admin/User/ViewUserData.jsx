'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, User, Phone, Mail, MapPin, Calendar, Shield,
    Wallet as WalletIcon, Star, Truck, Clock, CheckCircle, XCircle, Circle,
    Eye, EyeOff, Activity, BarChart3, Lock, CreditCard, Settings, Users, FileText, Briefcase
} from 'lucide-react';

/* ----------------------------- helpers ---------------------------------- */

const maskEmail = (email, show) =>
    show ? email : email?.replace(/(.{2}).*(@.*)/, '$1***$2');

const maskNgPhone = (phone, show) =>
    show ? phone : phone?.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1-$2-***-$4');

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount ?? 0);

const formatDate = (dateString) =>
    new Date(dateString ?? Date.now()).toLocaleDateString('en-NG', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

const getRoleIcon = (role) => ({ Client: Users, Driver: Truck, Admin: Shield }[role] || User);

const getStatusChipClass = (status) => {
    const map = {
        Active: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
        online: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
        approved: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
        pending: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
        rejected: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
        Suspended: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
        offline: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/30',
    };
    return map[status] || 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/30';
};

/* ----------------------------- stat card --------------------------------- */

const STAT_VARIANTS = {
    blue:   { wrap: 'bg-blue-50/50 border border-blue-200/50 dark:bg-blue-900/20 dark:border-blue-800/30',
        label: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-600 dark:text-blue-400' },
    green:  { wrap: 'bg-green-50/50 border border-green-200/50 dark:bg-green-900/20 dark:border-green-800/30',
        label: 'text-green-700 dark:text-green-300', icon: 'text-green-600 dark:text-green-400' },
    yellow: { wrap: 'bg-yellow-50/50 border border-yellow-200/50 dark:bg-yellow-900/20 dark:border-yellow-800/30',
        label: 'text-yellow-700 dark:text-yellow-300', icon: 'text-yellow-600 dark:text-yellow-400' },
    purple: { wrap: 'bg-purple-50/50 border border-purple-200/50 dark:bg-purple-900/20 dark:border-purple-800/30',
        label: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-600 dark:text-purple-400' },
    red:    { wrap: 'bg-red-50/50 border border-red-200/50 dark:bg-red-900/20 dark:border-red-800/30',
        label: 'text-red-700 dark:text-red-300', icon: 'text-red-600 dark:text-red-400' },
};

const StatCard = ({ label, value, icon: Icon, variant = 'blue', subtext }) => {
    const v = STAT_VARIANTS[variant] ?? STAT_VARIANTS.blue;
    return (
        <div className={`p-4 rounded-lg transition-transform duration-300 hover:scale-105 ${v.wrap}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm font-medium ${v.label}`}>{label}</p>
                    <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
                    {subtext ? (
                        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{subtext}</p>
                    ) : null}
                </div>
                {Icon ? <Icon className={`h-8 w-8 ${v.icon}`} /> : null}
            </div>
        </div>
    );
};

/* ----------------------------- info card --------------------------------- */

const InfoCard = ({ title, children, icon: Icon }) => (
    <div className="
    rounded-xl border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20
    bg-white/70 border-gray-200/50 backdrop-blur-sm
    dark:bg-slate-800/50 dark:border-slate-700/50
  ">
        <div className="p-6">
            <div className="flex items-center space-x-3">
                {Icon ? <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : null}
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
            </div>
        </div>
        <div className="px-6 pb-6 pt-0">
            {children}
        </div>
    </div>
);

/* --------------------------- main component ------------------------------ */

const ViewUserData = ({ userData = null }) => {
    const router = useRouter();
    const [showSensitiveData, setShowSensitiveData] = useState(false);

    // sample fallback for local testing
    const sampleUserData = {
        _id: '67123abc456def789',
        role: 'Driver',
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        phoneNumber: '+2348031234567',
        status: 'Active',
        avatar: null,
        dob: '1990-05-15',
        gender: 'Male',
        address: '123 Garki Street, Abuja',
        state: 'FCT',
        lga: 'Abuja Municipal',
        emailVerified: true,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-09-20T14:45:00Z',
        availabilityStatus: 'online',
        vehicleDetails: {
            type: 'motorcycle',
            plateNumber: 'ABC-123-XY',
            model: 'Honda CB150',
            year: 2022,
            color: 'Red',
            capacity: { weight: 50, volume: 0.5, passengers: 1 },
        },
        currentLocation: { address: 'Wuse II, Abuja' },
        performance: {
            totalDeliveries: 1247, completionRate: 94.5, averageRating: 4.7, onTimeDeliveryRate: 89.2, averageDeliveryTime: 22,
        },
        wallet: {
            balance: 45750.5, totalEarnings: 234500, totalWithdrawn: 188749.5, pendingEarnings: 12500,
        },
        verification: {
            overallStatus: 'approved',
            documentsStatus: {
                license: 'approved',
                vehicleRegistration: 'approved',
                insurance: 'approved',
                roadWorthiness: 'approved',
            },
        },
        statistics: { totalOrders: 42, completedOrders: 39, cancelledOrders: 3, averageOrderValue: 8700 },
        trustScore: { score: 92, factors: [{ factor: 'payment_reliability', impact: +5, description: 'On-time payments' }] },
        authMethods: [
            { type: 'Google', verified: true, lastUsed: '2024-06-03T09:12:00Z' },
            { type: 'Credentials', verified: true, lastUsed: '2024-09-12T07:55:00Z' },
        ],
        adminRole: 'platform_manager',
        permissionLevel: 'operational',
        workloadStatus: 'light',
        assignedWorkload: { currentShift: { start: '2024-09-20T08:00:00Z' } },
        security: {
            requires2FA: true,
            sessionSettings: { timeoutMinutes: 30, concurrentSessions: 3, allowMobileAccess: true },
            ipWhitelist: [{ ip: '1.1.1.1' }],
            deviceWhitelist: [{ deviceId: 'abc' }],
        },
        auditTrail: [
            { action: 'refund_processed', resourceType: 'order', timestamp: '2024-09-18T11:22:00Z', severity: 'medium', outcome: 'success' },
        ],
    };

    const data = userData || sampleUserData;
    const RoleIcon = getRoleIcon(data?.role);

    return (
        <div className="
      relative min-h-screen transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
    ">
            {/* background dots */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div
                    className="absolute inset-0 block dark:hidden"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '20px 20px' }}
                />
                <div
                    className="absolute inset-0 hidden dark:block"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '20px 20px' }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6">
                {/* header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="
                  p-2 rounded-xl backdrop-blur-sm transition
                  bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90
                  dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white dark:hover:bg-slate-700/50
                "
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive user data overview</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowSensitiveData((s) => !s)}
                                className="
                  p-2 rounded-xl backdrop-blur-sm transition
                  bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90
                  dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white dark:hover:bg-slate-700/50
                "
                                title={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                            >
                                {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* profile overview */}
                <div className="mb-8">
                    <InfoCard title="Profile Overview" icon={User}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* avatar & basics */}
                            <div className="text-center lg:text-left">
                                <div className="flex justify-center lg:justify-start mb-4">
                                    <div className="
                    w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg
                    bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600
                  ">
                                        {data?.avatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={data.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            (data?.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                    {data?.fullName || 'Unknown User'}
                                </h2>
                                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
                                    <RoleIcon className="h-4 w-4" />
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusChipClass(data?.role)}`}>
                    {data?.role}
                  </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusChipClass(data?.status)}`}>
                    {data?.status}
                  </span>
                                </div>
                            </div>

                            {/* contact */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Email</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {maskEmail(data?.email, showSensitiveData)}
                                            </p>
                                        </div>
                                        {data?.emailVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Phone</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {maskNgPhone(data?.phoneNumber, showSensitiveData)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <MapPin className="h-4 w-4 mt-1 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Address</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{data?.address}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{data?.lga} {data?.state}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* account details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Account Details</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Date of Birth</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {data?.dob ? formatDate(data.dob) : 'Not provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Gender</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{data?.gender || 'Not specified'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">Member Since</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(data?.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InfoCard>
                </div>

                {/* role: driver */}
                {data?.role === 'Driver' && (
                    <>
                        <div className="mb-8">
                            <InfoCard title="Performance Overview" icon={BarChart3}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Total Deliveries" value={data?.performance?.totalDeliveries ?? 0} icon={Truck} variant="blue" />
                                    <StatCard label="Completion Rate" value={`${data?.performance?.completionRate ?? 0}%`} icon={CheckCircle} variant="green" />
                                    <StatCard label="Average Rating" value={data?.performance?.averageRating ?? 0} icon={Star} variant="yellow" subtext="out of 5.0" />
                                    <StatCard label="On-Time Rate" value={`${data?.performance?.onTimeDeliveryRate ?? 0}%`} icon={Clock} variant="purple" />
                                </div>
                            </InfoCard>
                        </div>

                        <div className="mb-8">
                            <InfoCard title="Vehicle Information" icon={Truck}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Vehicle Type</label>
                                            <p className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
                                                {data?.vehicleDetails?.type || 'Not specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Plate Number</label>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {showSensitiveData
                                                    ? data?.vehicleDetails?.plateNumber
                                                    : data?.vehicleDetails?.plateNumber?.replace(/(.{3})(.*)(.{2})/, '$1-***-$3') || 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Model & Year</label>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {data?.vehicleDetails?.model || 'Not specified'} ({data?.vehicleDetails?.year || 'Unknown'})
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Color</label>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {data?.vehicleDetails?.color || 'Not specified'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Capacity</label>
                                            <div className="space-y-1 text-gray-900 dark:text-white">
                                                <p>Weight: {data?.vehicleDetails?.capacity?.weight ?? 0} kg</p>
                                                <p>Volume: {data?.vehicleDetails?.capacity?.volume ?? 0} m³</p>
                                                <p>Passengers: {data?.vehicleDetails?.capacity?.passengers ?? 0}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Current Location</label>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {data?.currentLocation?.address || 'Location not available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>
                        </div>

                        <div className="mb-8">
                            <InfoCard title="Verification Status" icon={Shield}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(data?.verification?.documentsStatus || {}).map(([doc, status]) => (
                                        <div
                                            key={doc}
                                            className={`
                        p-4 rounded-lg border transition-colors
                        ${status === 'approved'
                                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30'
                                                : status === 'rejected'
                                                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30'
                                                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30'
                                            }
                      `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm capitalize text-gray-900 dark:text-white">
                                                        {doc.replace(/([A-Z])/g, ' $1').trim()}
                                                    </p>
                                                    <p className={`
                            text-xs mt-1 capitalize
                            ${status === 'approved' ? 'text-green-600 dark:text-green-400'
                                                        : status === 'rejected' ? 'text-red-600 dark:text-red-400'
                                                            : 'text-yellow-600 dark:text-yellow-400'}
                          `}>
                                                        {status}
                                                    </p>
                                                </div>
                                                {status === 'approved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                                {status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                                                {status === 'pending' && <Circle className="h-5 w-5 text-yellow-500" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        </div>
                    </>
                )}

                {/* financial overview */}
                <div className="mb-8">
                    <InfoCard title="Financial Overview" icon={WalletIcon}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Current Balance" value={formatCurrency(data?.wallet?.balance)} icon={WalletIcon} variant="green" />
                            {data?.role === 'Driver' && (
                                <>
                                    <StatCard label="Total Earnings" value={formatCurrency(data?.wallet?.totalEarnings)} icon={Star} variant="blue" />
                                    <StatCard label="Total Withdrawn" value={formatCurrency(data?.wallet?.totalWithdrawn)} icon={CreditCard} variant="purple" />
                                    <StatCard label="Pending Earnings" value={formatCurrency(data?.wallet?.pendingEarnings)} icon={Clock} variant="yellow" />
                                </>
                            )}
                        </div>
                    </InfoCard>
                </div>

                {/* role: client */}
                {data?.role === 'Client' && (
                    <>
                        <div className="mb-8">
                            <InfoCard title="Usage Statistics" icon={BarChart3}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Total Orders" value={data?.statistics?.totalOrders ?? 0} icon={FileText} variant="blue" />
                                    <StatCard label="Completed Orders" value={data?.statistics?.completedOrders ?? 0} icon={CheckCircle} variant="green" />
                                    <StatCard label="Cancelled Orders" value={data?.statistics?.cancelledOrders ?? 0} icon={XCircle} variant="red" />
                                    <StatCard label="Average Order Value" value={formatCurrency(data?.statistics?.averageOrderValue)} icon={CreditCard} variant="purple" />
                                </div>
                            </InfoCard>
                        </div>

                        <div className="mb-8">
                            <InfoCard title="Trust & Safety Score" icon={Shield}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{data?.trustScore?.score ?? 100}/100</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Trust Score</p>
                                    </div>
                                    <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center
                    ${(data?.trustScore?.score ?? 100) >= 80
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : (data?.trustScore?.score ?? 100) >= 60
                                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                            : 'bg-red-100 dark:bg-red-900/30'}
                  `}>
                                        <Star className={`
                      h-8 w-8
                      ${(data?.trustScore?.score ?? 100) >= 80
                                            ? 'text-green-600 dark:text-green-400'
                                            : (data?.trustScore?.score ?? 100) >= 60
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'}
                    `} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h5 className="font-semibold text-gray-900 dark:text-white">Recent Factors</h5>
                                    {(data?.trustScore?.factors ?? []).slice(-3).length > 0 ? (
                                        data.trustScore.factors.slice(-3).map((factor, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                                                <div className="flex justify-between items-center">
                          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                            {factor?.factor?.replace(/_/g, ' ')}
                          </span>
                                                    <span className={`text-sm font-semibold ${factor?.impact > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {factor?.impact > 0 ? '+' : ''}{factor?.impact}
                          </span>
                                                </div>
                                                {factor?.description ? (
                                                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{factor.description}</p>
                                                ) : null}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">No trust score factors recorded yet</p>
                                    )}
                                </div>
                            </InfoCard>
                        </div>

                        <div className="mb-8">
                            <InfoCard title="Saved Locations" icon={MapPin}>
                                <div className="space-y-4">
                                    {(data?.savedLocations ?? []).length > 0 ? (
                                        data.savedLocations.map((location, index) => (
                                            <div key={location?._id || index} className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-slate-700/30 dark:border-slate-600">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h6 className="font-semibold text-gray-900 dark:text-white">
                                                            {(location?.locationType || 'Location').replace(/^\w/, c => c.toUpperCase())} {index + 1}
                                                        </h6>
                                                        <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{location?.address}</p>
                                                        {location?.landmark ? (
                                                            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Landmark: {location.landmark}</p>
                                                        ) : null}
                                                    </div>
                                                    <div className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {location?.locationType || 'residential'}
                                                    </div>
                                                </div>
                                                {location?.contactPerson ? (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            Contact: {location.contactPerson.name} — {location.contactPerson.phone}
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-8 text-gray-600 dark:text-gray-400">No saved locations yet</p>
                                    )}
                                </div>
                            </InfoCard>
                        </div>
                    </>
                )}

                {/* role: admin */}
                {data?.role === 'Admin' && (
                    <>
                        <div className="mb-8">
                            <InfoCard title="Administrative Access" icon={Lock}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Admin Role</label>
                                            <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Briefcase className="h-4 w-4 mr-2" />
                                                {(data?.adminRole || 'super_admin').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Permission Level</label>
                                            <p className="text-lg font-semibold capitalize text-gray-900 dark:text-white">{data?.permissionLevel || 'maximum'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Current Workload</label>
                                            <div className="flex items-center space-x-3">
                        <span className={`
                          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${data?.workloadStatus === 'available'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : data?.workloadStatus === 'light'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : data?.workloadStatus === 'moderate'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}
                        `}>
                          {data?.workloadStatus || 'available'}
                        </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Active Since</label>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {data?.assignedWorkload?.currentShift?.start ? formatDate(data.assignedWorkload.currentShift.start) : 'Not currently active'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>
                        </div>

                        <div className="mb-8">
                            <InfoCard title="Security Configuration" icon={Shield}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Two-Factor Authentication</span>
                                            <span className={`
                        px-2 py-1 rounded text-xs
                        ${data?.security?.requires2FA
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}
                      `}>
                        {data?.security?.requires2FA ? 'Enabled' : 'Disabled'}
                      </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Session Timeout</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {data?.security?.sessionSettings?.timeoutMinutes ?? 30} minutes
                      </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Concurrent Sessions</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {data?.security?.sessionSettings?.concurrentSessions ?? 3} allowed
                      </span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Mobile Access</span>
                                            <span className={`
                        px-2 py-1 rounded text-xs
                        ${data?.security?.sessionSettings?.allowMobileAccess
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}
                      `}>
                        {data?.security?.sessionSettings?.allowMobileAccess ? 'Allowed' : 'Blocked'}
                      </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">IP Whitelist</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(data?.security?.ipWhitelist || []).length} addresses
                      </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Trusted Devices</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(data?.security?.deviceWhitelist || []).length} devices
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>
                        </div>

                        <div className="mb-8">
                            <InfoCard title="Recent Administrative Actions" icon={Activity}>
                                <div className="space-y-3">
                                    {(data?.auditTrail || []).slice(-5).length > 0 ? (
                                        data.auditTrail.slice(-5).map((action, i) => (
                                            <div
                                                key={i}
                                                className={`
                          p-4 rounded-lg border-l-4
                          ${action?.severity === 'critical'
                                                    ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
                                                    : action?.severity === 'high'
                                                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20'
                                                        : action?.severity === 'medium'
                                                            ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20'
                                                            : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'}
                          bg-white dark:bg-slate-700/30
                        `}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm text-gray-900 dark:text-white">{action?.action}</p>
                                                        <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                                                            {action?.resourceType} • {formatDate(action?.timestamp)}
                                                        </p>
                                                    </div>
                                                    <span className={`
                            px-2 py-1 rounded text-xs capitalize
                            ${action?.outcome === 'success'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                        : action?.outcome === 'failure'
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}
                          `}>
                            {action?.outcome}
                          </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-8 text-gray-600 dark:text-gray-400">No recent administrative actions</p>
                                    )}
                                </div>
                            </InfoCard>
                        </div>
                    </>
                )}

                {/* authentication methods */}
                <div className="mb-8">
                    <InfoCard title="Authentication Methods" icon={Lock}>
                        <div className="space-y-4">
                            {(data?.authMethods || []).length > 0 ? (
                                data.authMethods.map((method, index) => (
                                    <div key={index} className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-slate-700/30 dark:border-slate-600">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`
                          p-2 rounded-lg
                          ${method?.type === 'Google' ? 'bg-red-100 dark:bg-red-900/30'
                                                    : method?.type === 'Apple' ? 'bg-gray-100 dark:bg-gray-700'
                                                        : method?.type === 'Credentials' ? 'bg-blue-100 dark:bg-blue-900/30'
                                                            : 'bg-purple-100 dark:bg-purple-900/30'}
                        `}>
                                                    {method?.type === 'Google' ? '🔗' : method?.type === 'Apple' ? '🍎' : method?.type === 'Credentials' ? '🔑' : '📱'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{method?.type}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Last used: {method?.lastUsed ? formatDate(method.lastUsed) : 'Never'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {method?.verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
                                                <span className={`
                          px-2 py-1 rounded text-xs
                          ${method?.verified
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}
                        `}>
                          {method?.verified ? 'Verified' : 'Unverified'}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-8 text-gray-600 dark:text-gray-400">No authentication methods configured</p>
                            )}
                        </div>
                    </InfoCard>
                </div>

                {/* system info */}
                <div className="mb-8">
                    <InfoCard title="System Information" icon={Settings}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">User ID</label>
                                    <p className="font-mono text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 p-2 rounded break-all">
                                        {data?._id}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Created At</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{formatDate(data?.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Preferred Auth Method</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{data?.preferredAuthMethod || 'Not set'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Last Updated</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{formatDate(data?.updatedAt)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Account Status</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusChipClass(data?.status)}`}>
                    <Activity className="h-3 w-3 mr-2" />
                                        {data?.status}
                  </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email Verified</label>
                                    <div className="flex items-center space-x-2">
                                        {data?.emailVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                        <span className="text-sm text-gray-900 dark:text-white">
                      {data?.emailVerified ? 'Verified' : 'Not verified'}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InfoCard>
                </div>

                {/* actions */}
                <div className="flex items-center justify-center space-x-4 pb-8">
                    <button className="
            px-6 py-3 rounded-xl font-medium transition
            bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105
          ">
                        Edit User
                    </button>
                    <button className="
            px-6 py-3 rounded-xl font-medium transition border hover:scale-105
            border-gray-300 text-gray-700 hover:bg-gray-50
            dark:border-slate-600 dark:text-white dark:hover:bg-slate-700/50
          ">
                        Export Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewUserData;
