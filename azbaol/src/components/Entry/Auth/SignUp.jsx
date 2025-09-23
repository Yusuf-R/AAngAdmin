'use client';
import Galaxy from "@/components/ReactBits/Galaxy";
import {useState, useEffect} from "react";
import Link from "next/link";
import {Mail, Lock, Users, ArrowRight, ChevronDown, Truck, Shield, Loader2, AlertCircle} from "lucide-react";
import InputField from "./InputField";
import SocialButton from "./SocialButton";
import GoogleIcon from "./GoogleIcon";
import PasswordRequirements from "./PasswordRequirements";
import {Button} from "@/components/ui/button";
import {Controller, useForm} from "react-hook-form";
import {signUpSchema} from "@/validators/authValidators";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "sonner";
import {getSession, signIn} from "next-auth/react";
import {useSystemStore} from "@/store/useSystemStore";
import {useRouter} from "next/navigation";

function SignUp() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {role} = useSystemStore();
    const router = useRouter();

    const roles = [
        {value: "client", label: "Client", icon: Users},
        {value: "driver", label: "Driver", icon: Truck},
        {value: "admin", label: "Admin", icon: Shield}
    ];

    const selectedRoleData = roles.find(r => r.value === role);

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: {errors, isSubmitting}
    } = useForm({
        resolver: yupResolver(signUpSchema),
        defaultValues: {role: role || '', email: '', password: '', confirmPassword: ''},
        mode: 'onTouched',
    });

    // Set the role from store when component mounts
    useEffect(() => {
        if (role) {
            setValue('role', role);
        }
    }, [role, setValue]);

    const password = watch('password');
    const confirmPassword = watch('confirmPassword');

    const onSubmit = async (data) => {
        toast.loading("Signing in...", { id: "signup" });

        try {
            const result = await signIn('signup-credentials', { // 👈 Use 'credentials', not 'login-credentials'
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmPassword,
                role,
                redirect: false,
            });

            toast.dismiss("signup");

            if (result?.error) {
                toast.error("Signup failed", { description: result.error });
                return;
            }

            // ✅ Get updated session
            const session = await getSession();
            if (!session?.user?.role) {
                throw new Error("Session not properly created");
            }
            console.log({
                session
            })

            toast.success("Welcome! Redirecting...");
            setTimeout(() => {
                router.replace(`/${session.user.role}/dashboard`);
            }, 1000);

        } catch (error) {
            console.error("Login error:", error);
            toast.error("Login failed", { description: "Please try again" });
        }
    };

    const isLoading = isSubmitting;

    async function handleGoogleSignup() {
        try {
            await signIn("google", {redirectTo: "/auth/google-signup"});
        } catch (error) {
            toast.error("Google signup failed")
            console.error(error);
        }
    }

    return (
        <>
            <div className="fixed inset-0 flex overflow-hidden">
                <div className="absolute inset-0 -z-10 pointer-events-none bg-black">
                    <Galaxy mouseRepulsion={false}/>
                </div>

                {/* Left Panel - Branding */}
                <div
                    className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center p-4 lg:p-8 text-white relative">
                    <div className="max-w-md mx-auto text-center relative z-10">
                        <div
                            className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg mx-auto">
                            <Shield className="w-8 h-8 lg:w-10 lg:h-10 text-white"/>
                        </div>
                        <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-3 lg:mb-4">
                            Create Account
                        </h1>
                        <p className="text-lg lg:text-xl text-gray-200 mb-6 lg:mb-8">
                            Join the AAngLogistics team
                        </p>

                        {/* Role confirmation display */}
                        {selectedRoleData && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-center mb-2">
                                    <selectedRoleData.icon className="w-6 h-6 text-cyan-400 mr-2"/>
                                    <span className="text-cyan-400 font-medium">Selected Role</span>
                                </div>
                                <p className="text-white font-semibold text-lg">{selectedRoleData.label}</p>
                            </div>
                        )}

                        <div className="mt-8 lg:mt-16 text-xs lg:text-sm text-gray-300">
                            <p>© {new Date().getFullYear()} AAngLogistics Admin Portal</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div
                    className="w-full lg:w-3/5 flex items-start lg:items-center justify-center p-4 py-4 lg:py-8 relative overflow-y-auto">
                    <div
                        className="absolute inset-0 bg-gradient-to-l from-blue-900/10 to-transparent backdrop-blur-[1px] z-0"></div>

                    <div className="w-full max-w-md relative z-10 my-4 lg:my-0">
                        {/* Mobile Header */}
                        <div className="lg:hidden text-center mb-6">
                            <div
                                className="mx-auto w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                                <Shield className="w-7 h-7 text-white"/>
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-green-400 bg-clip-text text-transparent">
                                Create Account
                            </h1>
                            <p className="text-gray-200 mt-2 text-sm">Join the AAngLogistics team</p>

                            {/* Mobile role display */}
                            {selectedRoleData && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-4">
                                    <div className="flex items-center justify-center">
                                        <selectedRoleData.icon className="w-5 h-5 text-cyan-400 mr-2"/>
                                        <span className="text-cyan-400 text-sm">Role: </span>
                                        <span
                                            className="text-white font-medium ml-1">{selectedRoleData.label}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Card */}
                        <div className="relative group">
                            {/* Animated Border */}
                            <div
                                className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl opacity-70 group-hover:opacity-100 transition duration-1000 animate-tilt"></div>

                            {/* Loading Overlay */}
                            {isLoading && (
                                <div
                                    className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl z-50 flex items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2"/>
                                        <p className="text-sm font-medium text-gray-700">Creating your
                                            account...</p>
                                        <p className="text-xs text-gray-500">Please wait</p>
                                    </div>
                                </div>
                            )}

                            {/* Main Card */}
                            <div
                                className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
                                <div className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                                    {/* Email */}
                                    <Controller
                                        name="email"
                                        control={control}
                                        render={({field}) => (
                                            <div>
                                                <InputField
                                                    label="Email Address"
                                                    type="email"
                                                    placeholder="user@aanglogistics.com"
                                                    icon={Mail}
                                                    error={!!errors.email}
                                                    {...field}
                                                />
                                                {errors.email && (
                                                    <p className="text-xs text-red-500 mt-0.5 px-1">{errors.email.message}</p>
                                                )}
                                            </div>
                                        )}
                                    />

                                    {/* Password */}
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({field}) => (
                                            <div>
                                                <InputField
                                                    label="Password"
                                                    placeholder="Create a strong password"
                                                    icon={Lock}
                                                    hasToggle
                                                    showPassword={showPassword}
                                                    onTogglePassword={() => setShowPassword(v => !v)}
                                                    error={!!errors.password}
                                                    {...field}
                                                />
                                                {errors.password && (
                                                    <p className="text-xs text-red-500 mt-0.5 px-1">{errors.password.message}</p>
                                                )}
                                            </div>
                                        )}
                                    />

                                    {/* Confirm Password */}
                                    <Controller
                                        name="confirmPassword"
                                        control={control}
                                        render={({field}) => (
                                            <div>
                                                <InputField
                                                    label="Confirm Password"
                                                    placeholder="Confirm your password"
                                                    icon={Lock}
                                                    hasToggle
                                                    showPassword={showConfirmPassword}
                                                    onTogglePassword={() => setShowConfirmPassword(v => !v)}
                                                    error={!!errors.confirmPassword}
                                                    {...field}
                                                />
                                                {errors.confirmPassword && (
                                                    <p className="text-xs text-red-500 mt-0.5 px-1">{errors.confirmPassword.message}</p>
                                                )}
                                            </div>
                                        )}
                                    />

                                    {/* Password Requirements */}
                                    {password && (
                                        <PasswordRequirements password={password}
                                                              confirmPassword={confirmPassword}/>
                                    )}

                                    {/* Submit Button */}
                                    <div className="pt-2">
                                        <Button
                                            onClick={handleSubmit(onSubmit)}
                                            disabled={isLoading}
                                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 size={18} className="mr-2 animate-spin"/>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    Create Account <ArrowRight size={18} className="ml-2"/>
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-1 border-t border-gray-200"></div>
                                        <span className="px-3 text-sm text-gray-500">Or continue with</span>
                                        <div className="flex-1 border-t border-gray-200"></div>
                                    </div>

                                    {/* Social Button */}
                                    <SocialButton
                                        provider="Google"
                                        icon={GoogleIcon}
                                        onClick={() => handleGoogleSignup()}
                                    />

                                    {/* Login Link */}
                                    <div className="text-center text-sm text-gray-600 pt-2">
                                        Already have an account?{" "}
                                        <Link href="/auth/login"
                                              className="text-blue-600 hover:text-blue-700 font-medium">
                                            Login
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Footer */}
                        <div className="lg:hidden text-center mt-4 text-xs text-gray-300">
                            <p>© {new Date().getFullYear()} AAngLogistics Admin Portal</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes tilt {
                    0%, 100% {
                        filter: blur(6px);
                        opacity: 0.7;
                    }
                    50% {
                        filter: blur(8px);
                        opacity: 0.8;
                    }
                }

                .animate-tilt {
                    animation: tilt 10s infinite ease-in-out;
                }
            `}</style>
        </>
    );
}

export default SignUp;