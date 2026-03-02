"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Box, FileText, LogOut, Settings, ShoppingBag } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user && pathname !== "/admin/login") {
                router.push("/admin/login");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // If on login page, just render children without sidebar
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-black/95 text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 glass fixed h-full z-20 hidden md:block">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Nexus Admin
                    </h2>
                </div>

                <nav className="p-4 space-y-2">
                    <Link href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/dashboard' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        Overview
                    </Link>
                    <Link href="/admin/products" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/products' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Box className="w-5 h-5" />
                        Products
                    </Link>
                    <Link href="/admin/content" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/content' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <FileText className="w-5 h-5" />
                        Content
                    </Link>
                    <Link href="/admin/orders" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/orders' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <ShoppingBag className="w-5 h-5" />
                        Orders
                    </Link>
                    <Link href="/admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/settings' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={() => signOut(auth)}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
