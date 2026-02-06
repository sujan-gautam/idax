/**
 * PROJECT IDA - LOGIN PAGE
 * Enterprise-grade authentication interface
 * Design: Stripe + Vercel inspired
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import { api } from '../services/api';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading, error: authError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    // Verification State
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [verificationMessage, setVerificationMessage] = useState('');

    const from = (location.state as any)?.from?.pathname || '/dashboard';

    useEffect(() => {
        const verifyEmail = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('verify');

            if (token) {
                setVerificationStatus('verifying'); // Clear URL to prevent re-verify on refresh? Maybe later.
                try {
                    await api.post('/auth/verify', { token });
                    setVerificationStatus('success');
                    setVerificationMessage('Email verified successfully! You can now sign in.');
                } catch (err: any) {
                    setVerificationStatus('error');
                    setVerificationMessage(err.response?.data?.error || 'Verification failed. Token may be invalid or expired.');
                }
            }
        };

        verifyEmail();
    }, [location.search]);

    const [showResend, setShowResend] = useState(false);
    const [isResendLoading, setIsResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setShowResend(false);
        setResendMessage('');

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err: any) {
            const msg = err.message || 'Login failed';
            setLocalError(msg);
            // Check if error relates to verification
            if (msg.toLowerCase().includes('verify') || msg.toLowerCase().includes('active')) {
                setShowResend(true);
            }
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setIsResendLoading(true);
        try {
            await api.post('/auth/start-verification', { email });
            setResendMessage('Verification email sent! Please check your inbox.');
            setShowResend(false); // Hide the button after sending
        } catch (err: any) {
            setLocalError('Failed to resend email. Please try again.');
        } finally {
            setIsResendLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-50 p-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
            <div className="w-full max-w-[440px] space-y-8 animate-fade-in">
                {/* ... Header ... */}

                {/* Verification Alerts (from URL) */}
                {/* ... existing code ... */}

                {/* Resend Success Message */}
                {resendMessage && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-3 animate-fade-in border border-green-200 dark:border-green-800 mb-4">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        <p>{resendMessage}</p>
                    </div>
                )}

                {/* Login Card */}
                <Card className="border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Sign in to your account
                        </CardTitle>
                        <CardDescription className="text-neutral-600 dark:text-neutral-400">
                            Enter your credentials to access your workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error Alert */}
                            {(localError || authError) && (
                                <div className="alert alert-error flex flex-col items-start gap-2">
                                    <p className="text-sm font-medium">
                                        {localError || authError}
                                    </p>
                                    {showResend && (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="p-0 h-auto text-red-700 dark:text-red-300 underline font-semibold"
                                            onClick={handleResend}
                                            disabled={isResendLoading}
                                        >
                                            {isResendLoading ? 'Sending...' : 'Resend Verification Email'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">
                                    Email address
                                </label>
                                <Input
                                    id="email"
                                    placeholder="name@company.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="form-group">
                                <div className="flex items-center justify-between">
                                    <label className="form-label" htmlFor="password">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        placeholder="••••••••"
                                        type={showPassword ? 'text' : 'password'}
                                        autoCapitalize="none"
                                        autoComplete="current-password"
                                        disabled={isLoading}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="h-11 w-full bg-gradient-to-r from-primary-600 to-primary-500 font-medium hover:from-primary-700 hover:to-primary-600"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-center gap-1 border-t border-neutral-200 p-6 dark:border-neutral-800">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Don't have an account?
                        </span>
                        <Link
                            to="/register"
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            Create an account
                        </Link>
                    </CardFooter>
                </Card>

                {/* Footer Links */}
                <p className="px-8 text-center text-xs text-neutral-600 dark:text-neutral-400">
                    By continuing, you agree to our{' '}
                    <Link
                        to="/terms"
                        className="font-medium underline underline-offset-4 hover:text-primary-600"
                    >
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                        to="/privacy"
                        className="font-medium underline underline-offset-4 hover:text-primary-600"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
};

export default Login;
