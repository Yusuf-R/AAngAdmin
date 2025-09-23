// app/auth/google-login/page.jsx
'use client';
import {useEffect, useState} from 'react';
import {getSession, signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {toast} from 'sonner';
import AuthUtils from '@/utils/AuthUtils';
import {useSystemStore} from '@/store/useSystemStore';
import {Loader2, CheckCircle, XCircle, Shield, Users, Truck} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';

export default function CompleteRegistration() {
    const router = useRouter();
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');

    const waitForSessionUpdate = async (expectedUserId, maxRetries = 5, delay = 300) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const session = await getSession();

            if (session?.user?.id === expectedUserId) {
                return session; // Session updated successfully
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw new Error('Session update timeout - please refresh the page');
    };

    useEffect(() => {
        completeRegistration()
    }, []);

    const completeRegistration = async () => {
        try {
            setStatus('loading');
            const session = await getSession();

            if (!session?.tempGoogleData?.email) {
                throw new Error('Missing Google authentication data.');
            }

            setStatus('creating');
            const {userId, userRole, adminRole} = await AuthUtils.GoogleLogin({
                data: session.tempGoogleData,
            });

            setStatus('signing-in');
            const signInResult = await signIn('google-login', {
                id: userId,
                role: userRole,
                adminRole,
                redirect: false,
            });

            if (signInResult?.error) {
                throw new Error(`Sign-in failed: ${signInResult.error}`);
            }

            // Wait for session to update reliably
            setStatus('verifying-session');
            await waitForSessionUpdate(userId);

            setStatus('success');
            toast.success('Registration completed successfully!');

            // Use replace instead of push to prevent back navigation issues
            setTimeout(() => {
                router.replace(`/${userRole}/dashboard`);
            }, 1000);

        } catch (error) {
            console.error('Registration error:', error);
            setStatus('error');
            setError(error.message);
            toast.error('Registration failed', {description: error.message});

            // Optionally redirect to login on error
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        }
    };

    // const getRoleIcon = () => {
    //     switch (role) {
    //         case 'admin':
    //             return <Shield className="w-8 h-8 text-blue-500"/>;
    //         case 'client':
    //             return <Users className="w-8 h-8 text-green-500"/>;
    //         case 'driver':
    //             return <Truck className="w-8 h-8 text-orange-500"/>;
    //         default:
    //             return <Users className="w-8 h-8 text-gray-500"/>;
    //     }
    // };

    const getStatusContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500"/>
                        <p className="text-lg font-semibold">Connecting to Google...</p>
                        <p className="text-muted-foreground">Retrieving your information</p>
                    </div>
                );

            case 'creating':
                return (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500"/>
                        <p className="text-lg font-semibold">Retrieving your account...</p>
                        <p className="text-muted-foreground">Setting up your profile</p>
                    </div>
                );

            case 'verifying-session':
                return (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500"/>
                        <p className="text-lg font-semibold">Verifying Session...</p>
                        <p className="text-muted-foreground">Securing your login</p>
                    </div>
                );

            case 'signing-in':
                return (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500"/>
                        <p className="text-lg font-semibold">logging you in...</p>
                        <p className="text-muted-foreground">Almost there!</p>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center space-y-4">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500"/>
                        <p className="text-lg font-semibold">Login Successful!</p>
                        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center space-y-4">
                        <XCircle className="w-12 h-12 mx-auto text-red-500"/>
                        <p className="text-lg font-semibold">Login Failed</p>
                        <p className="text-muted-foreground">{error}</p>
                        <div className="space-y-2">
                            <Button onClick={completeRegistration} className="w-full">
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/auth/login')} className="w-full">
                                Back to Login
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="flex justify-center">
                            {/*{getRoleIcon()}*/}
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {status === 'success' ? 'Welcome!' : 'Completing Registration'}
                        </CardTitle>
                        <CardDescription>
                            `Setting up your account`
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {getStatusContent()}

                        {(status === 'loading' || status === 'creating' || status === 'signing-in') && (
                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Progress:</span>
                                    <span>
                                        {status === 'loading' && '25%'}
                                        {status === 'creating' && '50%'}
                                        {status === 'signing-in' && '75%'}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{

                                            width: status === 'loading' ? '25%' : status === 'creating' ? '50%' :
                                                status === 'signing-in' ? '75%' : status === 'verifying-session' ? '90%' : '0%'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}