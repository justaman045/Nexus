"use client";

import { useState } from "react";
import { updateHomepageContent, defaultContent } from "@/lib/cms";
import { seedProducts } from "@/lib/products";
import { motion } from "framer-motion";
import { Database, Check, AlertCircle } from "lucide-react";

export default function AdminSettings() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSeedDatabase = async () => {
        if (!confirm("This will overwrite existing content with default data. Are you sure?")) return;

        setStatus("loading");
        try {
            // Seed content
            await updateHomepageContent(defaultContent);
            // Seed products
            await seedProducts();

            setStatus("success");
            setMessage("Database populated successfully!");
        } catch (error) {
            console.error(error);
            setStatus("error");
            setMessage("Failed to seed database. Check console.");
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">System configuration and tools</p>
            </div>

            <div className="max-w-xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-8 rounded-2xl border border-white/10"
                >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        Database Tools
                    </h3>

                    <p className="text-gray-400 mb-6 text-sm">
                        Use this tool to initialize your Firestore database with the default content and products.
                        Existing data may be overwritten.
                    </p>

                    <button
                        onClick={handleSeedDatabase}
                        disabled={status === "loading"}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${status === "loading"
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                            } text-white`}
                    >
                        {status === "loading" ? "Seeding..." : "Seed Database"}
                    </button>

                    {status === "success" && (
                        <div className="mt-4 flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            <Check className="w-4 h-4" />
                            {message}
                        </div>
                    )}

                    {status === "error" && (
                        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-4 h-4" />
                            {message}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
