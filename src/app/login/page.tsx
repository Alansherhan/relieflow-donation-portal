'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { portalApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // Forgot password state
    const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);

    // Get redirect URL from query params, default to dashboard
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(formData.email, formData.password);
            toast.success('Welcome back!');
            router.push(redirectUrl);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Invalid credentials';
            
            // Show helpful toast with register option
            toast.error(message, {
                description: 'Please check your email and password. If you don\'t have an account, sign up first.',
                action: {
                    label: 'Sign Up',
                    onClick: () => router.push(`/register${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`),
                },
                duration: 8000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPasswordOpen = () => {
        setForgotEmail(formData.email || '');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotStep('email');
        setForgotDialogOpen(true);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!forgotEmail.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        setForgotLoading(true);

        try {
            const response = await portalApi.forgotPassword(forgotEmail);

            if (response.data?.success) {
                toast.success('OTP has been sent. Check the server console for the OTP.');
                setForgotStep('otp');
            } else {
                toast.error(response.data?.message || 'Failed to send OTP');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to send OTP';
            toast.error(message);
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (forgotNewPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setForgotLoading(true);

        try {
            const response = await portalApi.resetPassword(forgotEmail, forgotOtp, forgotNewPassword);

            if (response.data?.success) {
                toast.success('Password has been reset successfully. Please login with your new password.');
                setForgotDialogOpen(false);
                setForgotEmail('');
                setForgotOtp('');
                setForgotNewPassword('');
                setForgotStep('email');
            } else {
                toast.error(response.data?.message || 'Failed to reset password');
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to reset password');
            toast.error(message);
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Heart className="h-6 w-6 text-primary fill-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue donating
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={handleForgotPasswordOpen}
                                    className="text-sm text-primary hover:underline font-medium"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                            Don&apos;t have an account?{' '}
                            <Link href={`/register${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>

            {/* Forgot Password Dialog */}
            <Dialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {forgotStep === 'email' ? 'Reset Password' : 'Enter OTP'}
                        </DialogTitle>
                        <DialogDescription>
                            {forgotStep === 'email'
                                ? "Enter your email address and we'll send you an OTP to reset your password."
                                : 'Enter the OTP sent to your email and your new password.'}
                        </DialogDescription>
                    </DialogHeader>

                    {forgotStep === 'email' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="forgot-email">Email</Label>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setForgotDialogOpen(false)}
                                    disabled={forgotLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={forgotLoading}>
                                    {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send OTP
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="forgot-otp">OTP Code</Label>
                                <Input
                                    id="forgot-otp"
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={forgotOtp}
                                    onChange={(e) => setForgotOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                    className="text-center tracking-[0.3em]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="forgot-new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="forgot-new-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="Enter new password (min 6 characters)"
                                        value={forgotNewPassword}
                                        onChange={(e) => setForgotNewPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setForgotStep('email')}
                                    disabled={forgotLoading}
                                >
                                    Back
                                </Button>
                                <Button type="submit" disabled={forgotLoading}>
                                    {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Reset Password
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
