'use client';
import {useState} from "react";
import Link from "next/link";
import {Mail, Lock, ArrowRight, Loader2} from "lucide-react";
import AuthContainer from "./AuthContainer";
import InputField from "./InputField";
import SocialButton from "./SocialButton";
import GoogleIcon from "./GoogleIcon";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import DarkVeil from "@/components/ReactBits/DarkVeil";
import {getSession, signIn} from "next-auth/react";
import {toast} from "sonner";
import {Controller, useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {logInSchema} from "@/validators/authValidators";
import {useRouter} from "next/navigation";

function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const router = useRouter();


    const {
        control,
        handleSubmit,
        setValue,
        formState: {errors, isSubmitting}
    } = useForm({
        resolver: yupResolver(logInSchema),
        defaultValues: {email: '', password: ''},
        mode: 'onTouched',
    });

    const onSubmit = async (data) => {
        setIsLoggingIn(true);
        toast.loading("Logging in...", { id: "login" });

        try {
            const result = await signIn('login-credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            toast.dismiss("login");

            if (result?.error) {
                toast.error("Login failed", { description: "Invalid email or password" });
                setIsLoggingIn(false);
                return;
            }

            const session = await getSession();
            if (!session?.user?.role) {
                throw new Error("Session not properly created");
            }

            toast.success("Welcome back!");
            setTimeout(() => {
                router.replace(`/${session.user.role}/dashboard`);
            }, 1000);

        } catch (error) {
            console.error("Login error:", error);
            toast.error("Login failed", { description: "Please try again" });
            setIsLoggingIn(false);
        }
    };


    async function handleGoogleLogin() {
        try {
            await signIn("google", {redirectTo: "/auth/google-login"});
        } catch (error) {
            toast.error("Google signup failed")
            console.error(error);
        }
    }

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
                    <DarkVeil/>
                </div>
                <AuthContainer
                    title="Welcome Back"
                    subtitle="Sign in to your admin account"
                    background="none"
                    fullScreen={false}
                >
                    <div className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe}/>
                                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                    Remember me
                                </label>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleSubmit(onSubmit)}
                                disabled={isLoggingIn}
                                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 size={18} className="mr-2 animate-spin"/>
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        Login <ArrowRight size={18} className="ml-2"/>
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="relative flex items-center">
                            <div className="flex-1 border-t border-gray-200"></div>
                            <span className="px-3 text-sm text-gray-500 bg-white">Or continue with</span>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </div>

                        <SocialButton
                            provider="Google"
                            icon={GoogleIcon}
                            onClick={() => handleGoogleLogin()}
                        />

                        <div className="text-center space-y-2">
                            <Link href="/auth/forgot-password"
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Forgot your password?
                            </Link>
                            <div className="text-sm text-gray-600">
                                Don&apos;t have an account?{" "}
                                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                </AuthContainer>
            </div>
        </>
    )
}

export default Login;