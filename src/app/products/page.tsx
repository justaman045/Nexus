"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MagnifyingGlass, ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { getProducts, Product } from "@/lib/products";
import { useCurrency } from "@/components/CurrencyProvider";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function ProductsPage() {
    const siteSettings = useSiteSettings();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getProducts();
                setProducts(data);
                const uniqueCategories = Array.from(new Set(data.map(p => p.category)));
                setCategories(["All", ...uniqueCategories]);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const filteredProducts = products.filter((product) => {
        const matchesFilter = filter === "All" || product.category === filter;
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-background">
                <CircleNotch className="w-10 h-10 text-foreground animate-spin opacity-20" weight="bold" />
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-background overflow-x-hidden">

            {/* ── CENTERED HERO HEADER ── */}
            <section className="section-padding text-center border-b border-border/50">
                <div className="max-w-[760px] mx-auto space-y-6">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="text-label"
                    >
                        {siteSettings.productsPage.heading}
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="text-hero gradient-text"
                    >
                        {siteSettings.productsPage.subheading}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-body-large text-muted-foreground max-w-[520px] mx-auto"
                    >
                        {siteSettings.productsPage.description}
                    </motion.p>

                    {/* Product count badge */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.28, duration: 0.6 }}
                        className="pt-2"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/40 text-[12px] font-semibold text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {products.length} product{products.length !== 1 ? "s" : ""} available
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* ── FILTER BAR ── */}
            <div className="container-pro px-6 sm:px-8 lg:px-12 pt-10 pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/40 border border-border">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`relative px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                                    filter === cat
                                        ? "bg-foreground text-background shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <MagnifyingGlass size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-muted-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-apple pl-10 pr-4 py-2.5 w-64 text-[13px]"
                        />
                    </div>
                </div>
            </div>

            {/* ── PRODUCT GRID ── */}
            <div className="container-pro px-6 sm:px-8 lg:px-12 pb-32 pt-8">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-32 text-muted-foreground">
                        <p className="text-[17px] font-medium">No products found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
    const { format: formatCurrency } = useCurrency();
    return (
        <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="group"
        >
            <Link href={`/products/${product.id}`} className="block">
                {/* Image */}
                <div className="relative aspect-[3/2] rounded-[20px] overflow-hidden bg-secondary/30 border border-border mb-5">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[2s] ease-out"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl font-bold text-foreground/5">{product.name[0]}</span>
                        </div>
                    )}
                    {/* Category pill */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.14em] uppercase backdrop-blur-md bg-background/70 border border-border text-foreground/80">
                            {product.category}
                        </span>
                    </div>
                    {/* Price pill */}
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-[13px] font-bold backdrop-blur-md bg-background/70 border border-border text-foreground">
                            {formatCurrency(product.price)}
                        </span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Info */}
                <div className="space-y-3 px-1">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[20px] font-bold text-foreground tracking-tight leading-tight">{product.name}</h3>
                        {product.version && (
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest shrink-0 pt-1">
                                v{product.version}
                            </span>
                        )}
                    </div>
                    <p className="text-[14px] text-muted-foreground leading-relaxed line-clamp-2">
                        {product.description}
                    </p>
                </div>
            </Link>

            {/* CTA */}
            <div className="px-1 mt-5">
                <Link
                    href={`/products/${product.id}`}
                    className="flex items-center justify-between w-full px-5 py-3.5 rounded-[14px] border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-foreground/20 transition-all duration-200 group/btn"
                >
                    <span className="text-[14px] font-semibold text-foreground">View & Purchase</span>
                    <ArrowRight size={16} className="text-muted-foreground group-hover/btn:text-foreground group-hover/btn:translate-x-0.5 transition-all duration-200" />
                </Link>
            </div>
        </motion.div>
    );
}
