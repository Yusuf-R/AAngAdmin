import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {toast} from 'sonner';
import {Shield, Building, Truck, Loader2, EyeOff, Eye} from 'lucide-react';


// Yup Validation Schema
const userSchema = yup.object({
    role: yup.string().oneOf(['Admin', 'Client', 'Driver']).required('Role is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    fullName: yup.string().required('Full name is required'),
    phoneNumber: yup
        .string()
        .nullable()
        .notRequired()
        .matches(/^(\+2340\d{10}|\+234\d{10}|0\d{10})$/, {
            message: 'Invalid phone number format',
            excludeEmptyString: true,
        }),
    gender: yup.string().oneOf(['Male', 'Female', 'Others'], 'Gender is required').required('Gender is required'),
    adminRole: yup.string().when('role', {
        is: 'Admin',
        then: (schema) => schema.oneOf([
            'super_admin', 'platform_manager', 'operations_manager',
            'customer_support', 'finance_manager', 'compliance_officer'
        ], 'Admin role is required').required('Admin role is required'),
        otherwise: (schema) => schema.notRequired()
    })
});

const UserCreationModal = ({isOpen, onClose, onSubmit, isSubmitting}) => {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: {errors},
        reset
    } = useForm({
        resolver: yupResolver(userSchema),
        defaultValues: {
            role: 'Client',
            password: 'User@1234',
            gender: 'Male'
        }
    });

    const selectedRole = watch('role');

    const userTypes = [
        {type: 'Admin', icon: Shield, color: 'red'},
        {type: 'Client', icon: Building, color: 'blue'},
        {type: 'Driver', icon: Truck, color: 'purple'}
    ];

    const adminRoles = [
        {value: 'super_admin', label: 'Super Admin'},
        {value: 'platform_manager', label: 'Platform Manager'},
        {value: 'operations_manager', label: 'Operations Manager'},
        {value: 'customer_support', label: 'Customer Support'},
        {value: 'finance_manager', label: 'Finance Manager'},
        {value: 'compliance_officer', label: 'Compliance Officer'}
    ];

    const handleFormSubmit = async (data) => {
        await onSubmit(data);
        reset();
        onClose();
    };
    const handleClose = () => {
        reset();
        onClose();
    };


    const handleRoleSelect = (role) => {
        setValue('role', role);
    };

    const getColorClass = (color, isSelected) => {
        const baseClasses = "w-8 h-8 mx-auto mb-2 transition-transform group-hover:scale-110";
        const selectedBorder = isSelected ? "border-solid border-2 border-emerald-500" : "border-dashed border-2";

        switch (color) {
            case 'red':
                return `${baseClasses} text-red-600 dark:text-red-400`;
            case 'blue':
                return `${baseClasses} text-blue-600 dark:text-blue-400`;
            case 'purple':
                return `${baseClasses} text-purple-600 dark:text-purple-400`;
            default:
                return baseClasses;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* Loading Overlay */}
            {isSubmitting && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500"/>
                        <p className="text-foreground">Creating user...</p>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Create New User</h2>
                    <p className="text-muted-foreground">Add a new user to the platform</p>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                            User Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3 transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            {userTypes.map((ut) => {
                                const isSelected = selectedRole === ut.type;
                                return (
                                    <div
                                        key={ut.type}
                                        onClick={() => handleRoleSelect(ut.type)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all group bg-background transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${
                                            isSelected
                                                ? 'border-solid border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                : 'border-dashed border-border hover:border-emerald-500/50'
                                        }`}
                                    >
                                        <div className="text-center">
                                            <ut.icon className={getColorClass(ut.color, isSelected)}/>
                                            <p className="font-medium text-foreground">{ut.type}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {errors.role && (
                            <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                        )}
                    </div>

                    {/* Admin Role Selection (only shown when Admin is selected) */}
                    {selectedRole === 'Admin' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Admin Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('adminRole')}
                                className=" transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="">Select Admin Role</option>
                                {adminRoles.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            {errors.adminRole && (
                                <p className="text-red-500 text-sm mt-1">{errors.adminRole.message}</p>
                            )}
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('fullName')}
                                type="text"
                                className=" transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="Enter full name"
                            />
                            {errors.fullName && (
                                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className=" transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className=" transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full px-4 py-3 pr-10 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4"/>
                                    ) : (
                                        <Eye className="w-4 h-4"/>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                            )}
                            <p className="text-muted-foreground text-xs mt-1">Default: User@1234</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Phone Number
                            </label>
                            <input
                                {...register('phoneNumber')}
                                type="tel"
                                className="transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                placeholder="+234 xxx xxx xxxx"
                            />
                            {errors.phoneNumber && (
                                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('gender')}
                                className=" transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                <option value="">Select Gender Role</option>
                                {["Male", "Female", "Others"].map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                            {errors.gender && (
                                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 border-t border-border flex justify-end gap-3 bg-card -m-6 mt-6 transition-colors duration-500
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserCreationModal;