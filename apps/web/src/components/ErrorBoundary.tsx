import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-0">
                                Something went wrong
                            </h1>
                        </div>

                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            The application encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {this.state.error && (
                            <details className="text-xs text-neutral-500 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 p-3 rounded">
                                <summary className="cursor-pointer font-medium">Error details</summary>
                                <pre className="mt-2 overflow-auto">{this.state.error.toString()}</pre>
                            </details>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-neutral-900 dark:bg-neutral-0 text-white dark:text-neutral-900 px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
