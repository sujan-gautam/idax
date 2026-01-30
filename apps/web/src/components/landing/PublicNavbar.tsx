
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/useAuthStore';
import { Menu, X, Sparkles } from 'lucide-react';

const PublicNavbar: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
            <div className="container px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                            <span className="text-white font-mono text-sm">IDA</span>
                        </div>
                        <span>Project IDA</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</Link>
                        <Link to="/pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</Link>
                        <Link to="/about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">About</Link>
                        <Link to="/blog" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Blog</Link>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="bg-white text-black hover:bg-slate-200"
                            >
                                Go to Dashboard
                            </Button>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Button
                                    onClick={() => navigate('/register')}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border-0"
                                >
                                    Get Started
                                    <Sparkles className="ml-2 h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-slate-300"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-white/10 bg-black px-4 py-6 space-y-4">
                    <Link to="/features" className="block text-sm font-medium text-slate-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
                    <Link to="/pricing" className="block text-sm font-medium text-slate-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
                    <Link to="/about" className="block text-sm font-medium text-slate-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                    <div className="pt-4 flex flex-col gap-3">
                        {user ? (
                            <Button onClick={() => navigate('/dashboard')} className="w-full">Dashboard</Button>
                        ) : (
                            <>
                                <Link to="/login" className="block text-center text-sm font-medium text-slate-300 hover:text-white">Sign In</Link>
                                <Button onClick={() => navigate('/register')} className="w-full bg-indigo-600">Get Started</Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default PublicNavbar;
