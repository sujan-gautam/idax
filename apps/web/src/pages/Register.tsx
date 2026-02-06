/**
 * PROJECT IDA - REGISTER PAGE
 * Enterprise-grade registration interface
 * Design: Stripe + Vercel inspired
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Database, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../services/api';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register, isLoading, error: authError } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        tenantName: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }

        setIsAuthLoading(true);

        try {
            await api.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                tenantName: formData.tenantName
            });
            setIsSuccess(true);
        } catch (err: any) {
            setLocalError(err.response?.data?.error || err.message || 'Registration failed');
        } finally {
            setIsAuthLoading(false);
        }
    };

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
        { label: 'Contains number', met: /[0-9]/.test(formData.password) },
    ];

    const [isResendLoading, setIsResendLoading] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');

    if (isSuccess) {
        const handleResendVerification = async () => {
            setIsResendLoading(true);
            setResendStatus('idle');
            try {
                await api.post('/auth/start-verification', { email: formData.email });
                setResendStatus('sent');
            } catch (err) {
                setResendStatus('error');
            } finally {
                setIsResendLoading(false);
            }
        };

        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-50 p-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
                <div className="w-full max-w-md text-center animate-fade-in space-y-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Check your email</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                        We've sent a verification link to <strong>{formData.email}</strong>.
                        Please check your inbox (and spam folder) to verify your account.
                    </p>

                    <div className="space-y-4 pt-4">
                        <Link to="/login" className="block w-full">
                            <Button variant="outline" className="w-full">
                                Back to Login
                            </Button>
                        </Link>

                        <div className="text-sm">
                            <p className="text-neutral-500 mb-2">Didn't receive the email?</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResendVerification}
                                disabled={isResendLoading || resendStatus === 'sent'}
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400"
                            >
                                {isResendLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Sending...
                                    </>
                                ) : resendStatus === 'sent' ? (
                                    "Email Resent!"
                                ) : (
                                    "Click to Resend"
                                )}
                            </Button>
                            {resendStatus === 'error' && (
                                <p className="text-xs text-red-500 mt-1">Failed to resend. Please try again.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-50 p-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
            <div className="w-full max-w-[480px] space-y-8 animate-fade-in">
                {/* Brand Header */}
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-lg shadow-primary-500/30">
                        <Database className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Project IDA
                        </h1>
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            Enterprise Intelligent Data Analysis
                        </p>
                    </div>
                </div>

                {/* Register Card */}
                <Card className="border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Create your account
                        </CardTitle>
                        <CardDescription className="text-neutral-600 dark:text-neutral-400">
                            Get started with your data analysis workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error Alert */}
                            {(localError || authError) && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 rounded-md">
                                    {localError || authError}
                                </div>
                            )}

                            {/* Name Field */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="name">
                                    Full name
                                </label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    type="text"
                                    autoComplete="name"
                                    disabled={isLoading || isAuthLoading}
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                    Email address
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading || isAuthLoading}
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                            </div>

                            {/* Organization Name */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="tenantName">
                                    Organization name
                                </label>
                                <Input
                                    id="tenantName"
                                    name="tenantName"
                                    placeholder="Acme Corp"
                                    type="text"
                                    autoComplete="organization"
                                    disabled={isLoading || isAuthLoading}
                                    value={formData.tenantName}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                                <p className="text-[0.8rem] text-neutral-500 dark:text-neutral-400">
                                    This will be the name of your workspace
                                </p>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        type={showPassword ? 'text' : 'password'}
                                        autoCapitalize="none"
                                        autoComplete="new-password"
                                        disabled={isLoading || isAuthLoading}
                                        value={formData.password}
                                        onChange={handleChange}
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
                                {formData.password && (
                                    <div className="mt-2 space-y-1">
                                        {passwordRequirements.map((req, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <CheckCircle2
                                                    className={`h-3 w-3 ${req.met
                                                        ? 'text-green-600 dark:text-green-500'
                                                        : 'text-neutral-300 dark:text-neutral-600'
                                                        }`}
                                                />
                                                <span
                                                    className={
                                                        req.met
                                                            ? 'text-green-700 dark:text-green-400'
                                                            : 'text-neutral-500 dark:text-neutral-500'
                                                    }
                                                >
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="confirmPassword">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoCapitalize="none"
                                        autoComplete="new-password"
                                        disabled={isLoading || isAuthLoading}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="h-11 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="h-11 w-full bg-gradient-to-r from-indigo-600 to-purple-600 font-medium hover:from-indigo-700 hover:to-purple-700 text-white"
                                type="submit"
                                disabled={isLoading || isAuthLoading}
                            >
                                {(isLoading || isAuthLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {(isLoading || isAuthLoading) ? 'Creating account...' : 'Create account'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-center gap-1 border-t border-neutral-200 p-6 dark:border-neutral-800">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Already have an account?
                        </span>
                        <Link
                            to="/login"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Sign in
                        </Link>
                    </CardFooter>
                </Card>

                {/* Footer Links */}
                <p className="px-8 text-center text-xs text-neutral-600 dark:text-neutral-400">
                    By creating an account, you agree to our{' '}
                    <Link
                        to="/terms"
                        className="font-medium underline underline-offset-4 hover:text-indigo-600"
                    >
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                        to="/privacy"
                        className="font-medium underline underline-offset-4 hover:text-indigo-600"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
};

export default Register;
