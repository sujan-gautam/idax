
import React from 'react';
import PublicNavbar from '../components/landing/PublicNavbar';
import PublicFooter from '../components/landing/PublicFooter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, MessageSquare, MapPin, Globe } from 'lucide-react';

const Contact: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            <PublicNavbar />

            <main className="py-24">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        {/* Info Section */}
                        <div className="space-y-12">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-bold mb-6">Get in touch</h1>
                                <p className="text-slate-400 text-lg leading-relaxed max-w-lg">
                                    Have questions about our enterprise plans or need support with your workspace?
                                    Our team is here to help you get the most out of Project IDA.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Email us</h3>
                                        <p className="text-slate-400">hello@projectida.ai</p>
                                        <p className="text-slate-400">support@projectida.ai</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                        <MessageSquare className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Live Chat</h3>
                                        <p className="text-slate-400">Available Mon-Fri, 9am - 5pm EST</p>
                                        <button className="text-indigo-400 hover:text-indigo-300 font-medium mt-1">Start a conversation &rarr;</button>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Headquarters</h3>
                                        <p className="text-slate-400">100 Innovation Way, Suite 500</p>
                                        <p className="text-slate-400">San Francisco, CA 94103</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                            <form className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="first-name">First name</Label>
                                        <Input id="first-name" placeholder="John" className="bg-black/50 border-white/10 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last-name">Last name</Label>
                                        <Input id="last-name" placeholder="Doe" className="bg-black/50 border-white/10 h-12" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input id="email" type="email" placeholder="john@company.com" className="bg-black/50 border-white/10 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="How can we help?" className="bg-black/50 border-white/10 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <textarea
                                        id="message"
                                        className="w-full min-h-[150px] rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Tell us more about your needs..."
                                    />
                                </div>
                                <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    Send Message
                                </Button>
                                <p className="text-xs text-center text-slate-500">
                                    By submitting this form, you agree to our privacy policy.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default Contact;
