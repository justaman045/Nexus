"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  CircleNotch,
  X,
  FloppyDisk,
} from "@phosphor-icons/react";
import { Product, getProducts, deleteProduct, addProduct, updateProduct } from "@/lib/products";
import { getHomepageContent } from "@/lib/cms";
import { useCurrency } from "@/components/CurrencyProvider";

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white text-[14px] font-medium placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all";

const labelCls = "block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2";

export default function AdminProducts() {
  const { format: formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const [productsData, contentData] = await Promise.all([getProducts(), getHomepageContent()]);
    setProducts(productsData);
    setCategories(contentData.categories?.length ? contentData.categories : ["Developer Tool", "Design", "Productivity"]);
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    await loadData();
  };

  const handleOpenAdd = () => {
    setCurrentProduct({ name: "", description: "", longDescription: "", price: 0, imageUrl: "", demoUrl: "", version: "", downloadUrl: "", documentationUrl: "", category: categories[0] || "", features: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setCurrentProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const productToSave = { ...currentProduct, features: currentProduct.features?.map((f) => f.trim()).filter(Boolean) || [] };
      if (currentProduct.id) {
        await updateProduct(currentProduct.id, productToSave);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { id, purchases, createdAt, ...newData } = productToSave as any;
        void id; void purchases; void createdAt;
        await addProduct(newData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Products</h1>
          <p className="text-white/30 text-[14px] mt-1">Manage your software catalogue</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-white text-black font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus size={15} weight="bold" /> New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl pl-11 pr-4 py-3.5 text-white text-[14px] font-medium placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-all max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-[28px] overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Product</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Category</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Price</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]">Status</th>
              <th className="px-8 py-5 text-[10px] font-bold text-white/25 uppercase tracking-[0.18em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <CircleNotch size={24} className="animate-spin text-white/20 mx-auto" />
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-white/25 text-[13px]">
                  {searchQuery ? "No products match your search" : "No products yet. Click New Product to add one."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] shrink-0 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-500/5" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-[14px] font-semibold">{product.name}</p>
                        <p className="text-white/30 text-[11px] mt-0.5 font-mono">v{product.version || "1.0.0"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-bold text-white/40 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-white text-[14px] font-bold">{formatCurrency(product.price)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                      <span className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-wider">Active</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/[0.07] transition-all"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/30 hover:text-red-400/70 hover:bg-red-500/[0.05] transition-all"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[60]"
              onClick={() => !isSaving && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="w-full max-w-3xl max-h-[90vh] rounded-[40px] pointer-events-auto overflow-hidden flex flex-col shadow-[0_50px_120px_rgba(0,0,0,0.8)]" style={{ background: "rgba(10,10,20,0.85)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {/* Modal header */}
                <div className="flex justify-between items-center px-10 py-8 border-b border-white/[0.04]">
                  <div>
                    <h2 className="text-[22px] font-bold text-white tracking-tight">
                      {currentProduct.id ? "Edit Product" : "New Product"}
                    </h2>
                    <p className="text-white/30 text-[13px] mt-0.5">Fill in the product details below</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/70 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal body */}
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className={labelCls}>Product Name</label>
                      <input type="text" value={currentProduct.name || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })} className={inputCls} placeholder="Product name" />
                    </div>
                    <div>
                      <label className={labelCls}>Price (USD)</label>
                      <input type="number" value={currentProduct.price ?? ""} onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) || 0 })} className={inputCls} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={currentProduct.category || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })} className={inputCls + " appearance-none"}>
                        {categories.map((cat) => (<option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Cover Image URL</label>
                      <input type="text" value={currentProduct.imageUrl || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                    </div>
                    <div>
                      <label className={labelCls}>Version</label>
                      <input type="text" value={currentProduct.version || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, version: e.target.value })} className={inputCls} placeholder="v1.0.0" />
                    </div>
                    <div>
                      <label className={labelCls}>Live Demo URL</label>
                      <input type="text" value={currentProduct.demoUrl || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, demoUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                    </div>
                    <div>
                      <label className={labelCls}>Download URL</label>
                      <input type="text" value={currentProduct.downloadUrl || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, downloadUrl: e.target.value })} className={inputCls} placeholder="Storage link..." />
                    </div>
                    <div>
                      <label className={labelCls}>Documentation URL</label>
                      <input type="text" value={currentProduct.documentationUrl || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, documentationUrl: e.target.value })} className={inputCls} placeholder="https://docs..." />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Description</label>
                      <textarea rows={4} value={currentProduct.longDescription || currentProduct.description || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, longDescription: e.target.value, description: e.target.value })} className={inputCls + " resize-none"} placeholder="Product description..." />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Features (one per line)</label>
                      <textarea rows={4} value={currentProduct.features?.join("\n") || ""} onChange={(e) => setCurrentProduct({ ...currentProduct, features: e.target.value.split("\n") })} className={inputCls + " resize-none"} placeholder={"Feature one\nFeature two\nFeature three"} />
                    </div>
                  </div>
                </div>

                {/* Modal footer */}
                <div className="flex justify-end gap-4 px-10 py-8 border-t border-white/[0.04]">
                  <button onClick={() => setIsModalOpen(false)} className="text-white/30 hover:text-white/60 text-[13px] font-medium transition-colors px-4">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-white text-black font-bold text-[13px] px-7 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                  >
                    {isSaving ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} weight="fill" />}
                    {currentProduct.id ? "Save Changes" : "Add Product"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
