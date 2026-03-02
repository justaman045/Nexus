"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Filter, ArrowRight } from "lucide-react";
import { getProducts, Product } from "@/lib/products";
import { getHomepageContent } from "@/lib/cms";

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");

    // Currency State
    const [currency, setCurrency] = useState<"USD" | "INR">("USD");
    const [exchangeRate, setExchangeRate] = useState<number>(90);

    useEffect(() => {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (userTimezone === "Asia/Kolkata" || userTimezone === "Asia/Calcutta" || userTimezone.includes("India")) {
            setCurrency("INR");
        }

        fetch("https://open.er-api.com/v6/latest/USD")
            .then(res => res.json())
            .then(data => {
                if (data && data.rates && data.rates.INR) {
                    setExchangeRate(data.rates.INR);
                }
            })
            .catch(err => console.error("Failed to fetch live exchange rate", err));
    }, []);

    useEffect(() => {
        Promise.all([
            getProducts(),
            getHomepageContent()
        ]).then(([productsData, contentData]) => {
            setProducts(productsData);

            // Derive unique categories dynamically from actual products
            const uniqueCategories = Array.from(new Set(productsData.map(p => p.category)));
            setCategories(["All", ...uniqueCategories]);
        });
    }, []);

    const filteredProducts = products.filter((product) => {
        const matchesFilter = filter === "All" || product.category === filter;
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Our Software Suite
                </h1>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filter === cat
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                    : "glass text-gray-300 hover:bg-white/10"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white placeholder-gray-500 transition-all"
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card overflow-hidden group flex flex-col h-full"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
                                    {product.category}
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold mb-2 text-white">{product.name}</h3>
                                <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-3">
                                    {product.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {product.features.slice(0, 2).map((feat, i) => (
                                        <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                                            {feat}
                                        </span>
                                    ))}
                                    {product.features.length > 2 && (
                                        <span className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                                            +{product.features.length - 2} more
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                                    <span className="text-lg font-bold text-white">
                                        {currency === "USD" ? "$" : "₹"}{(currency === "USD" ? product.price : product.price * exchangeRate).toLocaleString()}
                                    </span>
                                    <div className="flex gap-3">
                                        <Link href={`/products/${product.id}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors">
                                            View Details <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        {product.demoUrl && (
                                            <a
                                                href={product.demoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                            >
                                                Live Demo
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        No products found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
