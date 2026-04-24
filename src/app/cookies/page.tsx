"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiesPage() {
    return (
        <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8 relative selection:bg-blue-500/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/[0.01] blur-[150px] rounded-full pointer-events-none" />
            
            <div className="container-pro section-padding pt-0">
                <nav className="mb-12 pt-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-foreground transition-all group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>
                </nav>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-16"
                >
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                            Cookie <span className="text-gray-500">Policy</span>
                        </h1>
                        <p className="text-gray-500 text-lg font-medium">Last updated: April 2026</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-foreground/[0.01] p-10 rounded-[40px] border border-foreground/[0.05] space-y-4 md:col-span-2">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">What are cookies?</h2>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                Cookies are small text files that are placed on your computer or mobile device when you browse websites. Our Site may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information.
                            </p>
                        </section>

                        <section className="bg-foreground/[0.01] p-10 rounded-[40px] border border-foreground/[0.05] space-y-4 md:col-span-2">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">How do we use cookies?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
                                {[
                                    { t: "Essential Cookies", d: "Required for the operation of our software suite and cannot be switched off." },
                                    { t: "Analytics Cookies", d: "Allow us to recognize and count the number of visitors and see how they move around the Site." },
                                    { t: "Functionality Cookies", d: "Used to recognize you when you return to our Site and personalize content." }
                                ].map((item) => (
                                    <div key={item.t} className="space-y-2">
                                        <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">{item.t}</h4>
                                        <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.d}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-foreground/[0.01] p-10 rounded-[40px] border border-foreground/[0.05] space-y-4 md:col-span-2">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Managing Cookies</h2>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Site.
                            </p>
                            <address className="not-italic text-gray-500 text-sm font-bold uppercase tracking-[0.2em] pt-4">
                                Nexus Corporation Inc.<br />
                                Data Protection Office
                            </address>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
