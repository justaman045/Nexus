"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Privacy Policy
                    </h1>

                    <div className="space-y-6 text-gray-300 leading-relaxed">
                        <section className="glass p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
                            <p>
                                At Nexus, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website or use our software services.
                            </p>
                        </section>

                        <section className="glass p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
                            <p>
                                We may collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
                                <li>Name and Contact Data</li>
                                <li>Credentials</li>
                                <li>Payment Data</li>
                            </ul>
                        </section>

                        <section className="glass p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
                            <p>
                                We use the information we collect or receive:
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
                                <li>To facilitate account creation and logon process.</li>
                                <li>To post testimonials.</li>
                                <li>To send you marketing and promotional communications.</li>
                                <li>To send administrative information to you.</li>
                            </ul>
                        </section>

                        <section className="glass p-8 rounded-2xl border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                            <p>
                                If you have questions or comments about this policy, you may email us at support@nexus.com or by post to:
                            </p>
                            <address className="mt-4 not-italic text-gray-400">
                                Nexus Company Inc.<br />
                                123 Innovation Drive<br />
                                Tech City, TC 90210
                            </address>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
