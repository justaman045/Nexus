"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Rocket } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 transition-all duration-300 rounded-2xl ${scrolled ? "glass-nav py-2" : "bg-transparent py-4"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg">
                                <Rocket className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                                Nexus
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium">
                                Home
                            </Link>
                            <Link href="/products" className="text-gray-300 hover:text-white transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium">
                                Products
                            </Link>
                            <Link href="/orders" className="text-gray-300 hover:text-white transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium">
                                Track Order
                            </Link>
                            <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium">
                                About
                            </Link>
                            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-300 px-3 py-2 rounded-md text-sm font-medium">
                                Contact
                            </Link>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <Link href="/products" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 transition-all duration-300 text-sm font-medium">
                            Explore Apps
                        </Link>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 glass border-b border-white/10">
                    <Link href="/" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Home
                    </Link>
                    <Link href="/products" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Products
                    </Link>
                    <Link href="/orders" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Track Order
                    </Link>
                    <Link href="/about" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        About
                    </Link>
                    <Link href="/contact" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Contact
                    </Link>
                </div>
            </div>
        </nav>
    );
}
