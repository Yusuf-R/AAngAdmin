'use client';
import React, {useEffect, useState} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {toast} from "sonner";
import {
    User,
    Shield,
    Wallet,
    Settings,
    Truck,
    Star,
    Clock,
    MapPin,
    Trash,
    Phone,
    Mail,
    CreditCard,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Save,
    RotateCcw, ArrowLeft, EyeOff, Eye, Users, EarthLock
} from 'lucide-react';
import {useRouter} from "next/navigation";
import {stateAndLGA} from "@/utils/data";
import * as yup from "yup";
import {Controller, useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {useMutation} from "@tanstack/react-query";
import AdminUtils from "@/utils/AdminUtils";
import {queryClient} from "@/lib/queryClient";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

const getRoleIcon = (role) => ({Client: Users, Driver: Truck, Admin: Shield}[role]);

// Validation

// Validation helper functions
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidDate = (dateString) => {
    if (!dateString) return true; // Optional field
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

const isFutureDate = (dateString) => {
    return new Date(dateString) > new Date();
};

const isUnderage = (dateString) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 < 18;
    }
    return age < 18;
};

const EditUserData = ({userData}) => {
    const [availableStates] = useState(Object.keys(stateAndLGA));
    const [availableLGAs, setAvailableLGAs] = useState([]);
    const [savedLocations, setSavedLocations] = useState(userData?.savedLocations || []);
    const [modifiedLocations, setModifiedLocations] = useState(new Set());
    const [editingLocationId, setEditingLocationId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        type: null, // 'single' or 'all'
        locationId: null,
        title: '',
        message: ''
    });


    const router = useRouter();
    const userType = userData?.role || 'Admin';
    const isAdmin = userType === 'Admin';

    const createBasicInfoSchema = (availableStates, stateAndLGA, isAdmin) => yup.object().shape({
        fullName: yup
            .string()
            .required('Full name is required')
            .min(2, 'Full name must be at least 2 characters')
            .max(100, 'Full name must be less than 100 characters')
            .trim(),

        email: yup
            .string()
            .required('Email address is required')
            .test('valid-email', 'Please enter a valid email address', (value) => {
                if (!value) return false;
                return isValidEmail(value.trim());
            }),
        phoneNumber: yup.string()
            .required('Phone number is required')
            .matches(
                /^(\+234|0)[7-9][0-1]\d{8}$/,
                'Please enter a valid Nigerian phone number'
            ),

        gender: yup
            .string()
            .oneOf(['', 'Male', 'Female'], 'Please select a valid gender'),

        dob: yup
            .string()
            .test('valid-date', 'Please enter a valid date', function (value) {
                if (!value) return true;
                return isValidDate(value);
            })
            .test('not-future', 'Date of birth cannot be in the future', function (value) {
                if (!value) return true;
                return !isFutureDate(value);
            })
            .test('not-underage', 'User must be at least 18 years old', function (value) {
                if (!value) return true;
                return !isUnderage(value);
            }),

        address: yup
            .string()
            .max(500, 'Address must be less than 500 characters'),

        state: yup
            .string()
            .test('valid-state', 'Please select a valid state from the list', function (value) {
                if (!value) return true;
                return availableStates.includes(value);
            }),

        lga: yup
            .string()
            .test('state-required-for-lga', 'Please select a state first', function (value) {
                const {state} = this.parent;
                if (value && !state) return false;
                return true;
            })
            .test('valid-lga', 'Please select a valid LGA for the selected state', function (value) {
                const {state} = this.parent;
                if (!state || !value) return true;
                const validLGAs = stateAndLGA[state] || [];
                return validLGAs.includes(value);
            }),

        status: isAdmin
            ? yup.string().oneOf(['Active', 'Inactive', 'Suspended', 'Banned', 'Pending'], 'Please select a valid status')
            : yup.string()
    });
    const basicInfoSchema = createBasicInfoSchema(availableStates, stateAndLGA, isAdmin);
    const {
        control,
        handleSubmit,
        formState: {errors, isSubmitting, isDirty},
        setValue,
        watch,
        reset,
        trigger
    } = useForm({
        resolver: yupResolver(basicInfoSchema),
        defaultValues: {
            fullName: userData?.fullName || '',
            email: userData?.email || '',
            phoneNumber: userData?.phoneNumber || '',
            address: userData?.address || '',
            state: userData?.state || '',
            lga: userData?.lga || '',
            gender: userData?.gender || '',
            dob: userData?.dob || '',
            status: userData?.status || 'Active',
            sanctionAction: userData?.status || 'Active'
        },
        mode: 'onChange' // This enables real-time validation but RHF optimizes it
    });
    const watchedState = watch('state')

    const [saveLoading, setSaveLoading] = useState({
        basicInfo: false,
        authInfo: false,
        // ... other tabs
    });

    useEffect(() => {
        // Reset form when userData changes (from server)
        reset({
            fullName: userData?.fullName || '',
            email: userData?.email || '',
            phoneNumber: userData?.phoneNumber || '',
            address: userData?.address || '',
            state: userData?.state || '',
            lga: userData?.lga || '',
            gender: userData?.gender || '',
            dob: userData?.dob || '',
            status: userData?.status || 'Active',
            sanctionAction: userData?.status || 'Active' // ← Add this
        });
    }, [userData, reset]);

    useEffect(() => {
        if (userData?.status) {
            setValue('sanctionAction', userData.status, { shouldValidate: true, shouldDirty: false });
        }
    }, [userData?.status, setValue]);


    // Initialize LGAs based on userData state
    useEffect(() => {
        if (watchedState && stateAndLGA[watchedState]) {
            setAvailableLGAs(stateAndLGA[watchedState]);
        } else {
            setAvailableLGAs([]);
            // Clear LGA when state changes
            setValue('lga', '');
        }
    }, [watchedState, setValue]);

    const resetBasicInfo = () => {
        reset({
            fullName: userData?.fullName || '',
            email: userData?.email || '',
            phoneNumber: userData?.phoneNumber || '',
            address: userData?.address || '',
            state: userData?.state || '',
            lga: userData?.lga || '',
            gender: userData?.gender || '',
            dob: userData?.dob || '',
            status: userData?.status || 'Active',
            sanctionAction: userData?.status || 'Active'
        });

        // Reset LGAs based on userData state
        if (userData?.state && stateAndLGA[userData.state]) {
            setAvailableLGAs(stateAndLGA[userData.state]);
        } else {
            setAvailableLGAs([]);
        }
    };

    const RoleIcon = getRoleIcon(userData?.role);

    const getStatusChipClass = (status) => {
        const map = {
            Active: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
            Inactive: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/30',
            Suspended: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
            Banned: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
            Deleted: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50',
            Pending: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
            Blocked: 'text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/70',
            online: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
            approved: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
            rejected: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
            offline: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/30',
        };
        return map[status] || 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/30';
    };

    const validatePhone = (phone) => {
        if (!phone || phone.trim() === '') return {isValid: true, error: null}; // Empty is allowed
        const phoneRegex = /^(\+234|0)[7-9][0-1]\d{8}$/;
        return {
            isValid: phoneRegex.test(phone.trim()),
            error: phoneRegex.test(phone.trim()) ? null : 'Please enter a valid Nigerian phone number'
        };
    };

    const hasLocationValidationErrors = (locationId) => {
        const location = savedLocations.find(loc => loc._id === locationId);
        if (!location) return false;

        const phoneValidation = validatePhone(location.contactPerson?.phone || '');
        const alternatePhoneValidation = validatePhone(location.contactPerson?.alternatePhone || '');

        return !phoneValidation.isValid || !alternatePhoneValidation.isValid;
    };

    // Location Info
    const updateLocationsMutation = useMutation({
        mutationFn: AdminUtils.updateUserLocations,
        queryKey: ['updateUserLocations'],
    });

    const deleteLocationMutation = useMutation({
        mutationFn: AdminUtils.deleteUserLocation,
        queryKey: ['deleteUserLocation'],
    });

    const deleteAllLocationsMutation = useMutation({
        mutationFn: AdminUtils.deleteAllUserLocation,
        queryKey: ['deleteAllUserLocations'],
    });

    // Delete handler functions
    const handleDeleteLocation = (locationId) => {
        const location = savedLocations.find(loc => loc._id === locationId);
        setConfirmDialog({
            isOpen: true,
            type: 'single',
            locationId: locationId,
            title: 'Delete Location',
            message: `Are you sure you want to delete this Address Location`
        });
    };

    const handleDeleteAllLocations = () => {
        setConfirmDialog({
            isOpen: true,
            type: 'all',
            locationId: null,
            title: 'Delete All Locations',
            message: `Are you sure you want to delete ALL saved locations`
        });
    };

    const executeDelete = async () => {
        if (confirmDialog.type === 'single') {
            const payload = {
                userId: userData._id,
                locationId: confirmDialog.locationId
            };

            deleteLocationMutation.mutate(payload, {
                onSuccess: async (result) => {
                    if (result.success) {
                        toast.success('Location deleted successfully');
                        setSavedLocations(prev => prev.filter(loc => loc._id !== confirmDialog.locationId));
                        await queryClient.invalidateQueries({queryKey: ['allUserData']});
                        setTimeout(() => {
                            router.refresh();
                        }, 400);
                    }
                    setConfirmDialog({isOpen: false, type: null, locationId: null, title: '', message: ''});
                },
                onError: (error) => {
                    toast.error(`Delete failed: ${error.message}`);
                    setConfirmDialog({isOpen: false, type: null, locationId: null, title: '', message: ''});
                }
            });
        } else if (confirmDialog.type === 'all') {
            const payload = {userId: userData._id};

            deleteAllLocationsMutation.mutate(payload, {
                onSuccess: async (result) => {
                    if (result.success) {
                        toast.success('All locations deleted successfully');
                        setSavedLocations([]);
                        await queryClient.invalidateQueries({queryKey: ['allUserData']});
                        setTimeout(() => {
                            router.refresh();
                        }, 400);
                    }
                    setConfirmDialog({isOpen: false, type: null, locationId: null, title: '', message: ''});
                },
                onError: (error) => {
                    toast.error(`Delete all failed: ${error.message}`);
                    setConfirmDialog({isOpen: false, type: null, locationId: null, title: '', message: ''});
                }
            });
        }
    };


    const resetSavedLocations = () => {
        setSavedLocations(userData?.savedLocations || []);
        setEditingLocationId(null);
    };


    const onSubmitLocationUpdate = async (locationId) => {
        const locationToUpdate = savedLocations.find(loc => loc._id === locationId);
        if (!locationToUpdate) return;

        const payload = {
            userId: userData._id,
            locationId: locationId,
            locationData: locationToUpdate
        };

        updateLocationsMutation.mutate(payload, {
            onSuccess: async (result) => {
                if (result.success) {
                    toast.success('Location updated successfully');
                    setEditingLocationId(null);
                    setModifiedLocations(prev => {
                        const updated = new Set(prev);
                        updated.delete(locationId);
                        return updated;
                    });
                    await queryClient.invalidateQueries({queryKey: ['allUserData']});
                    setTimeout(() => {
                        router.refresh();
                    }, 400);
                }
            },
            onError: (error) => {
                toast.error(`Update failed: ${error.message}`);
            }
        });
    };

// 4. Add location helper functions with change tracking:
    const handleLocationEdit = (locationId, field, value) => {
        setSavedLocations(prev => prev.map(location =>
            location._id === locationId
                ? {...location, [field]: value}
                : location
        ));
        // Mark this location as modified
        setModifiedLocations(prev => new Set([...prev, locationId]));
    };

    const handleContactPersonEdit = (locationId, field, value) => {
        setSavedLocations(prev => prev.map(location =>
            location._id === locationId
                ? {
                    ...location,
                    contactPerson: {...location.contactPerson, [field]: value}
                }
                : location
        ));
        setModifiedLocations(prev => new Set([...prev, locationId]));
    };

    const handleBuildingEdit = (locationId, field, value) => {
        setSavedLocations(prev => prev.map(location =>
            location._id === locationId
                ? {
                    ...location,
                    building: {...location.building, [field]: value}
                }
                : location
        ));
        setModifiedLocations(prev => new Set([...prev, locationId]));
    };

    const resetSingleLocation = (locationId) => {
        const originalLocation = userData?.savedLocations?.find(loc => loc._id === locationId);
        if (originalLocation) {
            setSavedLocations(prev => prev.map(location =>
                location._id === locationId ? {...originalLocation} : location
            ));
            setModifiedLocations(prev => {
                const updated = new Set(prev);
                updated.delete(locationId);
                return updated;
            });
        }
    };

    const hasLocationChanged = (locationId) => {
        return modifiedLocations.has(locationId);
    };


    const hasLocationChanges = () => {
        return JSON.stringify(savedLocations) !== JSON.stringify(userData?.savedLocations || []);
    };


    // Auth Info
    const [authInfo, setAuthInfo] = useState({
        emailVerified: userData?.emailVerified || false,
        preferredAuthMethod: userData?.preferredAuthMethod || 'Credentials',
        authPinEnabled: userData?.authPin?.isEnabled || false,
        ninNumber: userData?.nin?.number || '',
        ninVerified: userData?.nin?.verified || false
    });

    // Client Info
    const [clientPrefs, setClientPrefs] = useState({
        notifications: userData?.preferences?.notifications || {
            orderUpdates: true,
            driverLocation: true,
            promotional: false,
            smsUpdates: true,
            emailUpdates: false
        },
        defaultPaymentMethod: userData?.preferences?.defaultPaymentMethod || 'PayStack',
        preferredVehicleTypes: userData?.preferences?.preferredVehicleTypes || [],
        deliveryInstructions: userData?.preferences?.deliveryInstructions || ''
    });

    // Driver Info
    const [driverInfo, setDriverInfo] = useState({
        licenseNumber: userData?.licenseNumber || '',
        availabilityStatus: userData?.availabilityStatus || 'offline',
        vehicleType: userData?.vehicleDetails?.type || '',
        plateNumber: userData?.vehicleDetails?.plateNumber || '',
        vehicleModel: userData?.vehicleDetails?.model || '',
        vehicleYear: userData?.vehicleDetails?.year || '',
        vehicleColor: userData?.vehicleDetails?.color || '',
        bankAccountName: userData?.wallet?.bankDetails?.accountName || '',
        bankAccountNumber: userData?.wallet?.bankDetails?.accountNumber || '',
        bankName: userData?.wallet?.bankDetails?.bankName || ''
    });

    // Admin Info
    const [adminInfo, setAdminInfo] = useState({
        adminRole: userData?.adminRole || 'customer_support',
        requires2FA: userData?.security?.requires2FA || true,
        concurrentSessions: userData?.security?.sessionSettings?.concurrentSessions || 3,
        timeoutMinutes: userData?.security?.sessionSettings?.timeoutMinutes || 30,
        maxRefundAmount: userData?.operationalLimits?.maxRefundAmount || 0,
        geofenceType: userData?.operationalLimits?.geofence?.type || 'national'
    });

    const adminRoleMutation = useMutation({
        mutationFn: AdminUtils.updateAdminRole,
        queryKey: ["updateAdminInfo"],
    })

    const updateAdminRole = async (data) => {
        const payload = {
            userId: userData._id,
            adminRole: data?.adminRole
        }
        adminRoleMutation.mutate(payload, {
            onSuccess: async (result) => {
                // result contains success, data (the current object instance fresh from db after update)
                if (result.success) {
                    toast.success('Admin role updated successfully');
                    await queryClient.invalidateQueries({queryKey: ['allUserData']});
                    setTimeout(() => {
                        router.refresh();
                    }, 800);
                }
            },
            onError: (error) => {
                toast.error(`Update failed: ${error.message}`);
            }
        })
    }


    // Financial Info
    const [financialInfo, setFinancialInfo] = useState({
        walletBalance: userData?.wallet?.balance || 0,
        totalEarnings: userData?.wallet?.totalEarnings || 0,
        pendingEarnings: userData?.wallet?.pendingEarnings || 0,
        trustScore: userData?.trustScore?.score || 100
    });

    // Generic save handler for each tab
    const handleTabSave = async (tabName, data) => {
        if (tabName === 'adminInfo') {
            console.log({
                data
            })
            await updateAdminRole(data);
        }
    };


    const resetAuthInfo = () => {
        setAuthInfo({
            emailVerified: userData?.emailVerified || false,
            preferredAuthMethod: userData?.preferredAuthMethod || 'Credentials',
            authPinEnabled: userData?.authPin?.isEnabled || false,
            ninNumber: userData?.nin?.number || '',
            ninVerified: userData?.nin?.verified || false
        });
    };

    const resetClientPrefs = () => {
        setClientPrefs({
            notifications: userData?.preferences?.notifications || {
                orderUpdates: true,
                driverLocation: true,
                promotional: false,
                smsUpdates: true,
                emailUpdates: false
            },
            defaultPaymentMethod: userData?.preferences?.defaultPaymentMethod || 'PayStack',
            preferredVehicleTypes: userData?.preferences?.preferredVehicleTypes || [],
            deliveryInstructions: userData?.preferences?.deliveryInstructions || ''
        });
    };

    const updateBasicInfoMutation = useMutation({
        mutationFn: AdminUtils.updateUserBasicInfo,
        queryKey: ['updateUserBasicData'],
    })

    const onSubmitBasicInfo = async (data) => {
        const payload = {
            userId: userData._id,
            data
        }
        updateBasicInfoMutation.mutate(payload, {
            onSuccess: async (result) => {
                // result contains success, data (the current object instance fresh from db after update)
                if (result.success) {
                    toast.success('Basic information updated successfully');
                    await queryClient.invalidateQueries({queryKey: ['allUserData']});
                    setTimeout(() => {
                        router.refresh();
                    }, 400);
                }
            },
            onError: (error) => {
                toast.error(`Update failed: ${error.message}`);
            }
        })
    };

    const updateSanctionMutation = useMutation({
        mutationFn: AdminUtils.adminActions,
        onSuccess: async (result) => {
            await queryClient.invalidateQueries({ queryKey: ['allUserData'] });
            const newStatus = result.message.split(' ').pop(); // Extract status from message
            setValue('status', newStatus, { shouldValidate: true, shouldDirty: false });
            setValue('sanctionAction', newStatus, { shouldValidate: true, shouldDirty: false });
            toast.success(`User status updated to: ${newStatus}`);
            setTimeout(() => {
                router.refresh();
            }, 400);
        },
        onError: (error) => {
            toast.error(`Sanction failed: ${error.message}`);
        }
    });


    return (
        <>
            <div
                className="w-full max-w-6xl mx-auto p-6 space-y-6 transition bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white ">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.back()}
                                    className="p-2 rounded-xl backdrop-blur-sm transition  bg-white/70 border border-gray-200/50 text-gray-700 hover:bg-white/90  dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-white dark:hover:bg-slate-700/50">
                                <ArrowLeft className="h-5 w-5 color-green-600 "/>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive user data
                                    overview</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className=" w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg  bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 ">
                            {userData?.avatar ? (
                                <img src={userData.avatar} alt="Avatar"
                                     className="w-full h-full rounded-full object-cover"/>
                            ) : (
                                (userData?.fullName || 'X').split(' ').map(n => n[0]).join('').toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground"> {userData?.fullName || 'User Profile'} </h1>
                            <p className="text-muted-foreground"> {userType} • ID: {userData?._id} </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
                        <RoleIcon className="h-4 w-4"/>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusChipClass(userData?.role)}`}>
                    {userData?.role}
                  </span>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusChipClass(userData?.status)}`}>
                    {userData?.status}
                  </span>
                    </div>
                </div>
                <Separator/>
                {/* Tabbed Interface */}
                <Tabs defaultValue="basic" className="w-full ">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                        <TabsTrigger value="basic" className="flex items-center gap-2">
                            <User className="w-4 h-4"/>
                            Basic Info
                        </TabsTrigger>
                        <TabsTrigger value="locations" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4"/>
                            Locations
                        </TabsTrigger>
                        <TabsTrigger value="auth" className="flex items-center gap-2">
                            <Shield className="w-4 h-4"/>
                            Authentication
                        </TabsTrigger>
                        {userType === 'Client' && (
                            <TabsTrigger value="preferences" className="flex items-center gap-2">
                                <Settings className="w-4 h-4"/>
                                Preferences
                            </TabsTrigger>
                        )}
                        {userType === 'Driver' && (
                            <TabsTrigger value="driver" className="flex items-center gap-2">
                                <Truck className="w-4 h-4"/>
                                Driver Info
                            </TabsTrigger>
                        )}
                        {userType === 'Admin' && (
                            <TabsTrigger value="admin" className="flex items-center gap-2">
                                <Shield className="w-4 h-4"/>
                                Admin Settings
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="financial" className="flex items-center gap-2">
                            <Wallet className="w-4 h-4"/>
                            Financial
                        </TabsTrigger>
                        <TabsTrigger value="sanctions" className="flex items-center gap-2">
                            <EarthLock className="w-4 h-4"/>
                            Sanctions
                        </TabsTrigger>
                    </TabsList>

                    {/* Basic Information Tab */}
                    <TabsContent value="basic" className="mt-6 ">
                        <Card
                            className="transition-colors duration-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5"/>
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Manage basic profile information and contact details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Controller
                                            name="fullName"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    id="fullName"
                                                    placeholder="Enter full name"
                                                    className={errors.fullName ? 'border-red-500' : ''}
                                                />
                                            )}
                                        />
                                        {errors.fullName && (
                                            <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter email address"
                                                    className={errors.email ? 'border-red-500' : ''}
                                                />
                                            )}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Controller
                                            name="phoneNumber"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    id="phoneNumber"
                                                    placeholder="Enter phone number"
                                                    className={errors.phoneNumber ? 'border-red-500' : ''}
                                                />
                                            )}
                                        />
                                        {errors.phoneNumber && (
                                            <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Controller
                                            name="gender"
                                            control={control}
                                            render={({field}) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger
                                                        className={`w-[200px] ${errors.gender ? 'border-red-500' : ''}`}>
                                                        <SelectValue placeholder="Select gender"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={null}>Select gender</SelectItem>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.gender && (
                                            <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dob">Date of Birth</Label>
                                        <Controller
                                            name="dob"
                                            control={control}
                                            render={({field}) => (
                                                <Input
                                                    {...field}
                                                    id="dob"
                                                    type="date"
                                                    className={errors.dob ? 'border-red-500' : ''}
                                                />
                                            )}
                                        />
                                        {errors.dob && (
                                            <p className="text-red-500 text-sm mt-1">{errors.dob.message}</p>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Account Status</Label>
                                            <Controller
                                                name="status"
                                                control={control}
                                                render={({field}) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger
                                                            className={errors.status ? 'border-red-500' : ''}>
                                                            <SelectValue/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Active">Active</SelectItem>
                                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                                            <SelectItem value="Suspended">Suspended</SelectItem>
                                                            <SelectItem value="Banned">Banned</SelectItem>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.status && (
                                                <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Controller
                                        name="address"
                                        control={control}
                                        render={({field}) => (
                                            <Textarea
                                                {...field}
                                                id="address"
                                                placeholder="Enter full address"
                                                rows={3}
                                                className={errors.address ? 'border-red-500' : ''}
                                            />
                                        )}
                                    />
                                    {errors.address && (
                                        <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Controller
                                            name="state"
                                            control={control}
                                            render={({field}) => (
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        // Trigger LGA validation when state changes
                                                        trigger('lga');
                                                    }}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger
                                                        className={`w-[250px] ${errors.state ? 'border-red-500' : ''}`}>
                                                        <SelectValue placeholder="Select state"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={null}>Select a state</SelectItem>
                                                        {availableStates.map(state => (
                                                            <SelectItem key={state} value={state}>
                                                                {state}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.state && (
                                            <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lga">Local Government Area</Label>
                                        <Controller
                                            name="lga"
                                            control={control}
                                            render={({field}) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!watchedState}
                                                >
                                                    <SelectTrigger
                                                        className={`w-[250px] ${errors.lga ? 'border-red-500' : ''}`}>
                                                        <SelectValue
                                                            placeholder={watchedState ? "Select LGA" : "Select state first"}/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={null}>Select an LGA</SelectItem>
                                                        {availableLGAs.map(lga => (
                                                            <SelectItem key={lga} value={lga}>
                                                                {lga}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.lga && (
                                            <p className="text-red-500 text-sm mt-1">{errors.lga.message}</p>
                                        )}
                                        {!watchedState && (
                                            <p className="text-gray-500 text-sm mt-1">Please select a state first to
                                                choose
                                                LGA</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={resetBasicInfo}
                                        disabled={saveLoading.basicInfo}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2"/>
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleSubmit(onSubmitBasicInfo)}
                                        disabled={updateBasicInfoMutation.isPending || !isDirty || Object.keys(errors).length > 0}
                                    >
                                        {updateBasicInfoMutation.isPending ? (
                                            <>
                                                <div
                                                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2"/>
                                                Save Changes
                                                {Object.keys(errors).length > 0 && (
                                                    <span
                                                        className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                                                              {Object.keys(errors).length} error(s)
                                                </span>
                                                )}
                                                {!isDirty && (
                                                    <span
                                                        className="ml-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">
                                                    No changes
                                                </span>
                                                )}
                                            </>
                                        )}
                                    </Button>


                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Location Tab */}
                    <TabsContent value="locations" className="mt-6">
                        <Card
                            className="transition-colors duration-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5"/>
                                    Saved Locations ({savedLocations.length})
                                </CardTitle>
                                <CardDescription>
                                    Manage user's saved delivery locations. Address and coordinates cannot be modified.
                                    <div className="flex justify-end items-center gap-4">
                                        <Button
                                            onClick={() => router.push(`/admin/location/new/${userData._id}`)}
                                            size="sm"
                                        >
                                            <MapPin className="w-4 h-4 mr-2"/>
                                            Add New Location
                                        </Button>

                                        <Button
                                            onClick={handleDeleteAllLocations}
                                            size="sm"
                                            variant="destructive"
                                            disabled={savedLocations.length === 0}
                                        >
                                            <Trash className="w-4 h-4 mr-2"/>
                                            Delete All ({savedLocations.length})
                                        </Button>
                                    </div>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {savedLocations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                                        <p className="text-gray-500">No saved locations found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {savedLocations.map((location, index) => (
                                            <Card key={location._id}
                                                  className="border-2 hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                {location.locationType}
                                            </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 flex items-start gap-2">
                                                                <MapPin className="w-4 h-4 mt-0.5 text-gray-400"/>
                                                                {location.address}
                                                            </p>
                                                            <p className="text-xs text-gray-400 ml-6">
                                                                Coordinates: {location.coordinates.lat}, {location.coordinates.lng}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingLocationId(
                                                                    editingLocationId === location._id ? null : location._id
                                                                )}
                                                            >
                                                                {editingLocationId === location._id ? 'Cancel' : 'Basic Edit'}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.push(`/admin/location/edit/${userData._id}/${location._id}`)}
                                                            >
                                                                <MapPin className="w-4 h-4 mr-2"/>
                                                                Map Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeleteLocation(location._id)}
                                                                disabled={deleteLocationMutation.isPending}
                                                            >
                                                                {deleteLocationMutation.isPending ? 'Deleting...' : 'Delete'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                {editingLocationId === location._id && (
                                                    <CardContent className="space-y-4 bg-gray-50 dark:bg-slate-800/50">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Landmark */}
                                                            <div className="space-y-2">
                                                                <Label>Landmark</Label>
                                                                <Input
                                                                    value={location.landmark || ''}
                                                                    onChange={(e) => handleLocationEdit(location._id, 'landmark', e.target.value)}
                                                                    placeholder="Enter landmark"
                                                                />
                                                            </div>

                                                            {/* Location Type */}
                                                            <div className="space-y-2">
                                                                <Label>Location Type</Label>
                                                                <Select
                                                                    value={location.locationType}
                                                                    onValueChange={(value) => handleLocationEdit(location._id, 'locationType', value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue/>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem
                                                                            value="residential">Residential</SelectItem>
                                                                        <SelectItem
                                                                            value="commercial">Commercial</SelectItem>
                                                                        <SelectItem value="office">Office</SelectItem>
                                                                        <SelectItem value="mall">Mall</SelectItem>
                                                                        <SelectItem
                                                                            value="hospital">Hospital</SelectItem>
                                                                        <SelectItem value="school">School</SelectItem>
                                                                        <SelectItem value="other">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {/* Extra Information */}
                                                        <div className="space-y-2">
                                                            <Label>Extra Information</Label>
                                                            <Textarea
                                                                value={location.extraInformation || ''}
                                                                onChange={(e) => handleLocationEdit(location._id, 'extraInformation', e.target.value)}
                                                                placeholder="Additional delivery instructions"
                                                                rows={2}
                                                            />
                                                        </div>

                                                        {/* Contact Person */}
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-sm">Contact Person</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label>Name</Label>
                                                                    <Input
                                                                        value={location.contactPerson?.name || ''}
                                                                        onChange={(e) => handleContactPersonEdit(location._id, 'name', e.target.value)}
                                                                        placeholder="Contact name"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Phone</Label>
                                                                    <Input
                                                                        value={location.contactPerson?.phone || ''}
                                                                        onChange={(e) => handleContactPersonEdit(location._id, 'phone', e.target.value)}
                                                                        placeholder="Primary phone"
                                                                    />
                                                                    {!validatePhone(location.contactPerson?.phone || '').isValid && (
                                                                        <p className="text-red-500 text-xs mt-1">
                                                                            {validatePhone(location.contactPerson?.phone || '').error}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Alternate Phone</Label>
                                                                    <Input
                                                                        value={location.contactPerson?.alternatePhone || ''}
                                                                        onChange={(e) => handleContactPersonEdit(location._id, 'alternatePhone', e.target.value)}
                                                                        placeholder="Secondary phone"
                                                                    />
                                                                    {!validatePhone(location.contactPerson?.alternatePhone || '').isValid && (
                                                                        <p className="text-red-500 text-xs mt-1">
                                                                            {validatePhone(location.contactPerson?.alternatePhone || '').error}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Building Details */}
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-sm">Building Details</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label>Building Name</Label>
                                                                    <Input
                                                                        value={location.building?.name || ''}
                                                                        onChange={(e) => handleBuildingEdit(location._id, 'name', e.target.value)}
                                                                        placeholder="Building name"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Floor</Label>
                                                                    <Input
                                                                        value={location.building?.floor || ''}
                                                                        onChange={(e) => handleBuildingEdit(location._id, 'floor', e.target.value)}
                                                                        placeholder="Floor number"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Unit/Apt</Label>
                                                                    <Input
                                                                        value={location.building?.unit || ''}
                                                                        onChange={(e) => handleBuildingEdit(location._id, 'unit', e.target.value)}
                                                                        placeholder="Unit/Apartment"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action buttons for this specific location */}
                                                        <div className="flex justify-end gap-3 pt-4 border-t">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => resetSingleLocation(location._id)}
                                                                disabled={updateLocationsMutation.isPending || !hasLocationChanged(location._id)}
                                                            >
                                                                <RotateCcw className="w-4 h-4 mr-2"/>
                                                                Reset
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => onSubmitLocationUpdate(location._id)}
                                                                disabled={updateLocationsMutation.isPending || !hasLocationChanged(location._id)}
                                                            >
                                                                {updateLocationsMutation.isPending ? (
                                                                    <>
                                                                        <div
                                                                            className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                                        Saving...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="w-4 h-4 mr-2"/>
                                                                        Update Location
                                                                        {hasLocationValidationErrors(location._id) && (
                                                                            <span
                                                                                className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                                                            Fix errors
                                                        </span>
                                                                        )}
                                                                        {!hasLocationChanged(location._id) && !hasLocationValidationErrors(location._id) && (
                                                                            <span
                                                                                className="ml-2 bg-gray-500 text-white px-2 py-1 rounded text-xs">
                                                            No changes
                                                        </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {/* Global reset button */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={resetSavedLocations}
                                        disabled={updateLocationsMutation.isPending || modifiedLocations.size === 0}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2"/>
                                        Reset All Changes
                                        {modifiedLocations.size > 0 && (
                                            <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                            {modifiedLocations.size} modified
                        </span>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Authentication Tab */}
                    <TabsContent value="auth" className="mt-6">
                        <Card
                            className="transition-colors duration-500  bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50  dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5"/>
                                    Authentication & Security
                                </CardTitle>
                                <CardDescription>
                                    Manage authentication methods and security settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Email Verification</Label>
                                                <p className="text-sm text-muted-foreground">Email verification
                                                    status</p>
                                            </div>
                                            <Switch
                                                checked={authInfo.emailVerified}
                                                onCheckedChange={(checked) => setAuthInfo(prev => ({
                                                    ...prev,
                                                    emailVerified: checked
                                                }))}
                                                disabled={!isAdmin}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Auth PIN Enabled</Label>
                                                <p className="text-sm text-muted-foreground">PIN-based
                                                    authentication</p>
                                            </div>
                                            <Switch
                                                checked={authInfo.authPinEnabled}
                                                onCheckedChange={(checked) => setAuthInfo(prev => ({
                                                    ...prev,
                                                    authPinEnabled: checked
                                                }))}
                                                disabled={!isAdmin}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>NIN Verified</Label>
                                                <p className="text-sm text-muted-foreground">National ID
                                                    verification</p>
                                            </div>
                                            <Switch
                                                checked={authInfo.ninVerified}
                                                onCheckedChange={(checked) => setAuthInfo(prev => ({
                                                    ...prev,
                                                    ninVerified: checked
                                                }))}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="preferredAuth">Preferred Auth Method</Label>
                                            <Select
                                                value={authInfo.preferredAuthMethod}
                                                onValueChange={(value) => setAuthInfo(prev => ({
                                                    ...prev,
                                                    preferredAuthMethod: value
                                                }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Credentials">Email/Password</SelectItem>
                                                    <SelectItem value="AuthPin">Auth PIN</SelectItem>
                                                    <SelectItem value="Google">Google</SelectItem>
                                                    <SelectItem value="Apple">Apple</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ninNumber">NIN Number</Label>
                                            <Input
                                                id="ninNumber"
                                                value={authInfo.ninNumber}
                                                onChange={(e) => setAuthInfo(prev => ({
                                                    ...prev,
                                                    ninNumber: e.target.value
                                                }))}
                                                placeholder="Enter NIN number"
                                                maxLength={11}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={resetAuthInfo}>
                                        <RotateCcw className="w-4 h-4 mr-2"/>
                                        Reset
                                    </Button>
                                    <Button onClick={() => handleTabSave('authInfo', authInfo)}>
                                        <Save className="w-4 h-4 mr-2"/>
                                        Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Client Preferences Tab */}
                    {userType === 'Client' && (
                        <TabsContent value="preferences" className="mt-6">
                            <Card className="transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-5 h-5"/>
                                        Client Preferences
                                    </CardTitle>
                                    <CardDescription>
                                        Manage notification preferences and delivery settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Notification Preferences</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(clientPrefs.notifications).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <Label
                                                            className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                                    </div>
                                                    <Switch
                                                        checked={value}
                                                        onCheckedChange={(checked) =>
                                                            setClientPrefs(prev => ({
                                                                ...prev,
                                                                notifications: {...prev.notifications, [key]: checked}
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator/>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paymentMethod">Default Payment Method</Label>
                                            <Select
                                                value={clientPrefs.defaultPaymentMethod}
                                                onValueChange={(value) => setClientPrefs(prev => ({
                                                    ...prev,
                                                    defaultPaymentMethod: value
                                                }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Wallet">Wallet</SelectItem>
                                                    <SelectItem value="PayStack">PayStack</SelectItem>
                                                    <SelectItem value="BankTransfer">Bank Transfer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="deliveryInstructions">Default Delivery Instructions</Label>
                                        <Textarea
                                            id="deliveryInstructions"
                                            value={clientPrefs.deliveryInstructions}
                                            onChange={(e) => setClientPrefs(prev => ({
                                                ...prev,
                                                deliveryInstructions: e.target.value
                                            }))}
                                            placeholder="Enter default delivery instructions"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="outline" onClick={resetClientPrefs}>
                                            <RotateCcw className="w-4 h-4 mr-2"/>
                                            Reset
                                        </Button>
                                        <Button onClick={() => handleTabSave('clientPrefs', clientPrefs)}>
                                            <Save className="w-4 h-4 mr-2"/>
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Driver Information Tab */}
                    {userType === 'Driver' && (
                        <TabsContent value="driver" className="mt-6">
                            <Card className="transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="w-5 h-5"/>
                                        Driver Information
                                    </CardTitle>
                                    <CardDescription>
                                        Manage driver credentials and vehicle details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="licenseNumber">License Number</Label>
                                            <Input
                                                id="licenseNumber"
                                                value={driverInfo.licenseNumber}
                                                onChange={(e) => setDriverInfo(prev => ({
                                                    ...prev,
                                                    licenseNumber: e.target.value
                                                }))}
                                                placeholder="Enter license number"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="availabilityStatus">Availability Status</Label>
                                            <Select
                                                value={driverInfo.availabilityStatus}
                                                onValueChange={(value) => setDriverInfo(prev => ({
                                                    ...prev,
                                                    availabilityStatus: value
                                                }))}
                                                disabled={!isAdmin}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="online">Online</SelectItem>
                                                    <SelectItem value="offline">Offline</SelectItem>
                                                    <SelectItem value="on-ride">On Ride</SelectItem>
                                                    <SelectItem value="break">On Break</SelectItem>
                                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleType">Vehicle Type</Label>
                                            <Select
                                                value={driverInfo.vehicleType}
                                                onValueChange={(value) => setDriverInfo(prev => ({
                                                    ...prev,
                                                    vehicleType: value
                                                }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select vehicle type"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bicycle">Bicycle</SelectItem>
                                                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                                    <SelectItem value="tricycle">Tricycle</SelectItem>
                                                    <SelectItem value="van">Van</SelectItem>
                                                    <SelectItem value="truck">Truck</SelectItem>
                                                    <SelectItem value="car">Car</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="plateNumber">Plate Number</Label>
                                            <Input
                                                id="plateNumber"
                                                value={driverInfo.plateNumber}
                                                onChange={(e) => setDriverInfo(prev => ({
                                                    ...prev,
                                                    plateNumber: e.target.value
                                                }))}
                                                placeholder="Enter plate number"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleModel">Vehicle Model</Label>
                                            <Input
                                                id="vehicleModel"
                                                value={driverInfo.vehicleModel}
                                                onChange={(e) => setDriverInfo(prev => ({
                                                    ...prev,
                                                    vehicleModel: e.target.value
                                                }))}
                                                placeholder="Enter vehicle model"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleYear">Vehicle Year</Label>
                                            <Input
                                                id="vehicleYear"
                                                type="number"
                                                value={driverInfo.vehicleYear}
                                                onChange={(e) => setDriverInfo(prev => ({
                                                    ...prev,
                                                    vehicleYear: e.target.value
                                                }))}
                                                placeholder="Enter vehicle year"
                                                min="1990"
                                                max={new Date().getFullYear() + 2}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleColor">Vehicle Color</Label>
                                            <Input
                                                id="vehicleColor"
                                                value={driverInfo.vehicleColor}
                                                onChange={(e) => setDriverInfo(prev => ({
                                                    ...prev,
                                                    vehicleColor: e.target.value
                                                }))}
                                                placeholder="Enter vehicle color"
                                            />
                                        </div>
                                    </div>

                                    <Separator/>

                                    <div className="space-y-4">
                                        <h4 className="font-medium">Bank Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bankAccountName">Account Name</Label>
                                                <Input
                                                    id="bankAccountName"
                                                    value={driverInfo.bankAccountName}
                                                    onChange={(e) => setDriverInfo(prev => ({
                                                        ...prev,
                                                        bankAccountName: e.target.value
                                                    }))}
                                                    placeholder="Enter account name"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bankAccountNumber">Account Number</Label>
                                                <Input
                                                    id="bankAccountNumber"
                                                    value={driverInfo.bankAccountNumber}
                                                    onChange={(e) => setDriverInfo(prev => ({
                                                        ...prev,
                                                        bankAccountNumber: e.target.value
                                                    }))}
                                                    placeholder="Enter account number"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bankName">Bank Name</Label>
                                                <Input
                                                    id="bankName"
                                                    value={driverInfo.bankName}
                                                    onChange={(e) => setDriverInfo(prev => ({
                                                        ...prev,
                                                        bankName: e.target.value
                                                    }))}
                                                    placeholder="Enter bank name"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setDriverInfo({
                                            licenseNumber: userData?.licenseNumber || '',
                                            availabilityStatus: userData?.availabilityStatus || 'offline',
                                            vehicleType: userData?.vehicleDetails?.type || '',
                                            plateNumber: userData?.vehicleDetails?.plateNumber || '',
                                            vehicleModel: userData?.vehicleDetails?.model || '',
                                            vehicleYear: userData?.vehicleDetails?.year || '',
                                            vehicleColor: userData?.vehicleDetails?.color || '',
                                            bankAccountName: userData?.wallet?.bankDetails?.accountName || '',
                                            bankAccountNumber: userData?.wallet?.bankDetails?.accountNumber || '',
                                            bankName: userData?.wallet?.bankDetails?.bankName || ''
                                        })}>
                                            <RotateCcw className="w-4 h-4 mr-2"/>
                                            Reset
                                        </Button>
                                        <Button onClick={() => handleTabSave('driverInfo', driverInfo)}>
                                            <Save className="w-4 h-4 mr-2"/>
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Admin Settings Tab */}
                    {userType === 'Admin' && (
                        <TabsContent value="admin" className="mt-6">
                            <Card className="transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5"/>
                                        Admin Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Manage admin role, permissions and operational limits
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="adminRole">Admin Role</Label>
                                            <Select
                                                value={adminInfo.adminRole}
                                                onValueChange={(value) => setAdminInfo(prev => ({
                                                    ...prev,
                                                    adminRole: value
                                                }))}
                                                disabled={!isAdmin}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                                    <SelectItem value="platform_manager">Platform Manager</SelectItem>
                                                    <SelectItem value="operations_manager">Operations
                                                        Manager</SelectItem>
                                                    <SelectItem value="customer_support">Customer Support</SelectItem>
                                                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                                                    <SelectItem value="compliance_officer">Compliance
                                                        Officer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="geofenceType">Geofence Type</Label>
                                            <Select
                                                value={adminInfo.geofenceType}
                                                onValueChange={(value) => setAdminInfo(prev => ({
                                                    ...prev,
                                                    geofenceType: value
                                                }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="national">National</SelectItem>
                                                    <SelectItem value="regional">Regional</SelectItem>
                                                    <SelectItem value="state">State</SelectItem>
                                                    <SelectItem value="lga">LGA</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="concurrentSessions">Concurrent Sessions</Label>
                                            <Input
                                                id="concurrentSessions"
                                                type="number"
                                                value={adminInfo.concurrentSessions}
                                                onChange={(e) => setAdminInfo(prev => ({
                                                    ...prev,
                                                    concurrentSessions: parseInt(e.target.value)
                                                }))}
                                                min="1"
                                                max="10"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="timeoutMinutes">Session Timeout (minutes)</Label>
                                            <Input
                                                id="timeoutMinutes"
                                                type="number"
                                                value={adminInfo.timeoutMinutes}
                                                onChange={(e) => setAdminInfo(prev => ({
                                                    ...prev,
                                                    timeoutMinutes: parseInt(e.target.value)
                                                }))}
                                                min="5"
                                                max="480"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="maxRefundAmount">Max Refund Amount (₦)</Label>
                                            <Input
                                                id="maxRefundAmount"
                                                type="number"
                                                value={adminInfo.maxRefundAmount}
                                                onChange={(e) => setAdminInfo(prev => ({
                                                    ...prev,
                                                    maxRefundAmount: parseFloat(e.target.value)
                                                }))}
                                                min="0"
                                                placeholder="0 = No limit"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label>Require 2FA</Label>
                                            <p className="text-sm text-muted-foreground">Two-factor authentication
                                                requirement</p>
                                        </div>
                                        <Switch
                                            checked={adminInfo.requires2FA}
                                            onCheckedChange={(checked) => setAdminInfo(prev => ({
                                                ...prev,
                                                requires2FA: checked
                                            }))}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setAdminInfo({
                                            adminRole: userData?.adminRole || 'customer_support',
                                            requires2FA: userData?.security?.requires2FA || true,
                                            concurrentSessions: userData?.security?.sessionSettings?.concurrentSessions || 3,
                                            timeoutMinutes: userData?.security?.sessionSettings?.timeoutMinutes || 30,
                                            maxRefundAmount: userData?.operationalLimits?.maxRefundAmount || 0,
                                            geofenceType: userData?.operationalLimits?.geofence?.type || 'national'
                                        })}>
                                            <RotateCcw className="w-4 h-4 mr-2"/>
                                            Reset
                                        </Button>
                                        <Button
                                            onClick={() => handleTabSave('adminInfo', adminInfo)}
                                            disabled={adminRoleMutation.isPending}
                                        >
                                            {adminRoleMutation.isPending ? (
                                                <>
                                                    <div
                                                        className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2"/>
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Financial Tab */}
                    <TabsContent value="financial" className="mt-6">
                        <Card className="transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5"/>
                                    Financial Information
                                </CardTitle>
                                <CardDescription>
                                    View and manage financial
                                    data {isAdmin ? '(Admin access required for modifications)' : '(Read-only)'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="walletBalance">Wallet Balance (₦)</Label>
                                        <Input
                                            id="walletBalance"
                                            type="number"
                                            value={financialInfo.walletBalance}
                                            onChange={(e) => setFinancialInfo(prev => ({
                                                ...prev,
                                                walletBalance: parseFloat(e.target.value) || 0
                                            }))}
                                            disabled={!isAdmin}
                                            step="0.01"
                                        />
                                    </div>

                                    {userType === 'Driver' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="totalEarnings">Total Earnings (₦)</Label>
                                                <Input
                                                    id="totalEarnings"
                                                    type="number"
                                                    value={financialInfo.totalEarnings}
                                                    onChange={(e) => setFinancialInfo(prev => ({
                                                        ...prev,
                                                        totalEarnings: parseFloat(e.target.value) || 0
                                                    }))}
                                                    disabled={!isAdmin}
                                                    step="0.01"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="pendingEarnings">Pending Earnings (₦)</Label>
                                                <Input
                                                    id="pendingEarnings"
                                                    type="number"
                                                    value={financialInfo.pendingEarnings}
                                                    onChange={(e) => setFinancialInfo(prev => ({
                                                        ...prev,
                                                        pendingEarnings: parseFloat(e.target.value) || 0
                                                    }))}
                                                    disabled={!isAdmin}
                                                    step="0.01"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {userType === 'Client' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="trustScore">Trust Score</Label>
                                            <Input
                                                id="trustScore"
                                                type="number"
                                                value={financialInfo.trustScore}
                                                onChange={(e) => setFinancialInfo(prev => ({
                                                    ...prev,
                                                    trustScore: parseInt(e.target.value) || 100
                                                }))}
                                                disabled={!isAdmin}
                                                min="0"
                                                max="100"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Financial Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="p-4 rounded-lg bg-card border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wallet className="w-4 h-4 text-green-600"/>
                                            <span className="text-sm font-medium">Current Balance</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₦{financialInfo.walletBalance.toLocaleString()}
                                        </p>
                                    </div>

                                    {userType === 'Driver' && (
                                        <>
                                            <div className="p-4 rounded-lg bg-card border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Star className="w-4 h-4 text-blue-600"/>
                                                    <span className="text-sm font-medium">Total Earnings</span>
                                                </div>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    ₦{financialInfo.totalEarnings.toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="p-4 rounded-lg bg-card border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="w-4 h-4 text-yellow-600"/>
                                                    <span className="text-sm font-medium">Pending</span>
                                                </div>
                                                <p className="text-2xl font-bold text-yellow-600">
                                                    ₦{financialInfo.pendingEarnings.toLocaleString()}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {userType === 'Client' && (
                                        <div className="p-4 rounded-lg bg-card border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Shield className="w-4 h-4 text-purple-600"/>
                                                <span className="text-sm font-medium">Trust Score</span>
                                            </div>
                                            <p className="text-2xl font-bold text-purple-600">
                                                {financialInfo.trustScore}/100
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {isAdmin && (
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setFinancialInfo({
                                            walletBalance: userData?.wallet?.balance || 0,
                                            totalEarnings: userData?.wallet?.totalEarnings || 0,
                                            pendingEarnings: userData?.wallet?.pendingEarnings || 0,
                                            trustScore: userData?.trustScore?.score || 100
                                        })}>
                                            <RotateCcw className="w-4 h-4 mr-2"/>
                                            Reset
                                        </Button>
                                        <Button onClick={() => handleTabSave('financialInfo', financialInfo)}>
                                            <Save className="w-4 h-4 mr-2"/>
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sanctions Tab */}
                    <TabsContent value="sanctions" className="mt-6">
                        <Card
                            className="transition-colors duration-500 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600"/>
                                    User Sanctions & Status
                                </CardTitle>
                                <CardDescription>
                                    Apply administrative actions to change the user's system status.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div
                                    className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400"/>
                                        <span className="font-medium text-red-800 dark:text-red-200">Warning</span>
                                    </div>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        Changing a user's status may restrict their access. Actions
                                        like <strong>Banned</strong> or <strong>Deleted</strong> are often irreversible.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label>Current Status</Label>
                                        <div className="mt-1">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusChipClass(userData?.status)}`}>
              {userData?.status || 'Unknown'}
            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newStatus">New Status</Label>
                                        <Controller
                                            name="sanctionAction"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={updateSanctionMutation.isPending} // Disable during update
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select new status">
                                                            {updateSanctionMutation.isPending ? "Updating..." : field.value}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Active">✅ Active</SelectItem>
                                                        <SelectItem value="Inactive">⏸️ Inactive</SelectItem>
                                                        <SelectItem value="Pending">⏳ Pending</SelectItem>
                                                        <SelectItem value="Suspended">⚠️ Suspended</SelectItem>
                                                        <SelectItem value="Blocked">🚫 Blocked</SelectItem>
                                                        <SelectItem value="Banned">❌ Banned</SelectItem>
                                                        <SelectItem value="Deleted">🗑️ Deleted</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <Button
                                        variant="destructive"
                                        onClick={handleSubmit((data) => {
                                            const newStatus = data.sanctionAction;
                                            if (!newStatus || newStatus === userData?.status) {
                                                toast.info('No change needed');
                                                return;
                                            }

                                            updateSanctionMutation.mutate({
                                                userId: userData?._id,
                                                actions: newStatus
                                            });
                                        })}
                                        disabled={updateSanctionMutation.isPending}
                                    >
                                        {updateSanctionMutation.isPending ? (
                                            <>
                                                <div
                                                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                Applying...
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-4 h-4 mr-2"/>
                                                Apply Sanction
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>


                </Tabs>
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog({
                        isOpen: false,
                        type: null,
                        locationId: null,
                        title: '',
                        message: ''
                    })}
                    onConfirm={executeDelete}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText={confirmDialog.type === 'all' ? 'Delete All' : 'Delete'}
                    variant="destructive"
                    isLoading={deleteLocationMutation.isPending || deleteAllLocationsMutation.isPending}
                />
            </div>

        </>
    );
};

export default EditUserData;