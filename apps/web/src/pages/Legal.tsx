
import React from 'react';
import PublicNavbar from '../components/landing/PublicNavbar';
import PublicFooter from '../components/landing/PublicFooter';

const LegalPage: React.FC<{ title: string, content: React.ReactNode }> = ({ title, content }) => (
    <div className="min-h-screen bg-black text-white">
        <PublicNavbar />
        <main className="py-24">
            <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-12">{title}</h1>
                <div className="prose prose-invert max-w-none text-slate-400 space-y-8">
                    {content}
                </div>
            </div>
        </main>
        <PublicFooter />
    </div>
);

export const Privacy: React.FC = () => (
    <LegalPage
        title="Privacy Policy"
        content={
            <>
                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                    <p>Welcome to Project IDA. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">2. The Data We Collect</h2>
                    <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows: Identity Data, Contact Data, Financial Data, and Transaction Data.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">3. Data Security</h2>
                    <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.</p>
                </section>
            </>
        }
    />
);

export const Terms: React.FC = () => (
    <LegalPage
        title="Terms of Service"
        content={
            <>
                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing and using Project IDA, you accept and agree to be bound by the terms and provision of this agreement.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">2. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">3. Limitation of Liability</h2>
                    <p>In no event shall Project IDA be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever.</p>
                </section>
            </>
        }
    />
);
