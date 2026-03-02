"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Loader2, X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, getProducts, deleteProduct, addProduct, updateProduct } from "@/lib/products";
import { getHomepageContent } from "@/lib/cms";

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [isSaving, setIsSaving] = useState(false);

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
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [productsData, contentData] = await Promise.all([
            getProducts(),
            getHomepageContent()
        ]);
        setProducts(productsData);
        if (contentData.categories) {
            setCategories(contentData.categories);
        } else {
            setCategories(["Developer Tool", "Design", "Productivity"]); // Fallback
        }
        setIsLoading(false);
    }

    async function loadProducts() {
        const data = await getProducts();
        setProducts(data);
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        await deleteProduct(id);
        loadProducts();
    };

    const handleOpenAdd = () => {
        setCurrentProduct({
            name: "",
            description: "",
            longDescription: "",
            price: 0,
            imageUrl: "",
            demoUrl: "",
            category: categories[0] || "",
            features: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product: Product) => {
        setCurrentProduct({ ...product });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const productToSave = {
                ...currentProduct,
                features: currentProduct.features?.map(f => f.trim()).filter(Boolean) || []
            };

            if (currentProduct.id) {
                await updateProduct(currentProduct.id, productToSave);
            } else {
                // Remove id, purchases, createdAt from currentProduct before passing if they exist (though they shouldn't for new)
                // We cast to any to bypass strict checks here, relying on the function to handle omitted fields
                const { id, purchases, createdAt, ...newProductData } = productToSave as any;
                await addProduct(newProductData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Products</h1>
                    <p className="text-gray-400 mt-1">Manage your software catalog</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25"
                >
                    <Plus className="w-5 h-5" />
                    Add New Product
                </button>
            </div>

            {/* Search and Filter */}
            <div className="glass p-4 rounded-xl border border-white/10 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-12 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option>All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Product List */}
            <div className="glass rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-6 text-sm font-semibold text-gray-400">Product Name</th>
                            <th className="p-6 text-sm font-semibold text-gray-400">Category</th>
                            <th className="p-6 text-sm font-semibold text-gray-400">Downloads/Purchases</th>
                            <th className="p-6 text-sm font-semibold text-gray-400">Price</th>
                            <th className="p-6 text-sm font-semibold text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="font-bold text-white">{product.name}</div>
                                        <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                                    </td>
                                    <td className="p-6">
                                        <span className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="p-6 text-gray-300 font-mono">{product.purchases || 0}</td>
                                    <td className="p-6 text-gray-300 font-mono">
                                        {currency === "USD" ? "$" : "₹"}{(currency === "USD" ? product.price : product.price * exchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenEdit(product)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoading && products.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No products found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 backdrop-blur-md z-10">
                                    <h2 className="text-xl font-bold text-white">
                                        {currentProduct.id ? "Edit Product" : "Add New Product"}
                                    </h2>
                                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Product Name</label>
                                            <input
                                                type="text"
                                                value={currentProduct.name || ""}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                                            <select
                                                value={currentProduct.category || categories[0] || ""}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Price ($)</label>
                                            <input
                                                type="number"
                                                value={currentProduct.price ?? ""}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Image URL</label>
                                            <input
                                                type="text"
                                                value={currentProduct.imageUrl || ""}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>


                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Demo URL</label>
                                            <input
                                                type="text"
                                                value={currentProduct.demoUrl || ""}
                                                onChange={(e) => setCurrentProduct({ ...currentProduct, demoUrl: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Short Description</label>
                                        <textarea
                                            rows={2}
                                            value={currentProduct.description || ""}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Detailed Description</label>
                                        <textarea
                                            rows={5}
                                            value={currentProduct.longDescription || ""}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, longDescription: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            placeholder="A deeper dive into what makes this product great..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Features (Newline separated)</label>
                                        <textarea
                                            rows={4}
                                            value={currentProduct.features?.join("\n") || ""}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, features: e.target.value.split("\n") })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none whitespace-pre-wrap"
                                            placeholder="Dark Mode&#10;API Access&#10;Cloud Sync"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        Save Product
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
