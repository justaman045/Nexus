"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Target, Zap, Loader2 } from "lucide-react";
import { getHomepageContent, HomepageContent, defaultContent } from "@/lib/cms";

export default function AboutPage() {
    const [content, setContent] = useState<HomepageContent>(defaultContent);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchContent() {
            const data = await getHomepageContent();
            if (data) setContent(data);
            setIsLoading(false);
        }
        fetchContent();
    }, []);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

    return (
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                        {content.about?.title || "About Nexus"}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        {content.about?.description || "We are a team of visionary developers and designers dedicated to building the next generation of software tools."}
                    </p>
                </motion.div>

                {/* Mission Values */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {[
                        {
                            icon: <Target className="w-8 h-8 text-blue-400" />,
                            title: "Our Mission",
                            desc: "To empower creators with tools that are as beautiful as they are functional."
                        },
                        {
                            icon: <Zap className="w-8 h-8 text-purple-400" />,
                            title: "Innovation",
                            desc: "Pushing the boundaries of what's possible on the web and Mobile with modern tech stacks."
                        },
                        {
                            icon: <Users className="w-8 h-8 text-pink-400" />,
                            title: "Community",
                            desc: "Building a supportive ecosystem where developers can thrive together."
                        }
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="glass p-8 rounded-2xl border border-white/10 text-center"
                        >
                            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-gray-400">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Story Section */}
                <div className="glass p-8 md:p-12 rounded-3xl border border-white/10 mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
                            <div className="space-y-4 text-gray-300">
                                <p>
                                    Founded in 2024, Nexus began with a simple idea: software shouldn't just work well, it should look good too.
                                </p>
                                <p>
                                    Frustrated by clunky, outdated interfaces, we set out to build a suite of tools that respect the user's attention and time. What started as a small side project has grown into a platform used by thousands of professionals worldwide.
                                </p>
                                <p>
                                    Today, we continue to innovate, driven by our core belief that great design is not just a coat of paint, but how it works.
                                </p>
                            </div>
                        </div>
                        <div className="h-64 md:h-full bg-gradient-to-tr from-blue-900/50 to-purple-900/50 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden relative">
                            {content.about?.imageUrl ? (
                                <img src={content.about.imageUrl} alt="About Us" className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <span className="text-gray-500 font-mono">Office/Team Image Placeholder</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
