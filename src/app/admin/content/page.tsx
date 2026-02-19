"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Plus, Trash2, Loader2, Check } from "lucide-react";
import { getHomepageContent, updateHomepageContent, HomepageContent, defaultContent } from "@/lib/cms";

export default function AdminContent() {
    const [activeTab, setActiveTab] = useState("hero");
    const [content, setContent] = useState<HomepageContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    useEffect(() => {
        async function loadContent() {
            const data = await getHomepageContent();
            setContent(data);
            setIsLoading(false);
        }
        loadContent();
    }, []);

    const handleSave = async () => {
        if (!content) return;
        setIsSaving(true);
        try {
            await updateHomepageContent(content);
            setSaveMessage("Saved successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (error) {
            console.error(error);
            setSaveMessage("Error saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateHero = (field: string, value: string) => {
        if (!content) return;
        setContent({
            ...content,
            hero: { ...content.hero, [field]: value }
        });
    };

    const updateStat = (index: number, field: string, value: string) => {
        if (!content) return;
        const newStats = [...content.stats];
        newStats[index] = { ...newStats[index], [field]: value };
        setContent({ ...content, stats: newStats });
    };

    const updateFAQ = (index: number, field: string, value: string) => {
        if (!content) return;
        const newFaq = [...content.faq];
        newFaq[index] = { ...newFaq[index], [field]: value };
        setContent({ ...content, faq: newFaq });
    };

    const addFAQ = () => {
        if (!content) return;
        setContent({ ...content, faq: [...content.faq, { q: "New Question", a: "New Answer" }] });
    };

    const removeFAQ = (index: number) => {
        if (!content) return;
        const newFaq = content.faq.filter((_, i) => i !== index);
        setContent({ ...content, faq: newFaq });
    };

    const addCategory = () => {
        if (!content) return;
        setContent({ ...content, categories: [...(content.categories || []), "New Category"] });
    };

    const updateCategory = (index: number, value: string) => {
        if (!content) return;
        const newCategories = [...(content.categories || [])];
        newCategories[index] = value;
        setContent({ ...content, categories: newCategories });
    };

    const removeCategory = (index: number) => {
        if (!content) return;
        const newCategories = (content.categories || []).filter((_, i) => i !== index);
        setContent({ ...content, categories: newCategories });
    };

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
    }

    if (!content) return <div>Error loading content</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white">Content Management</h1>
                    <p className="text-gray-400 mt-1">Update homepage content and global settings</p>
                </div>
                {saveMessage && (
                    <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                        <Check className="w-4 h-4" /> {saveMessage}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-1 overflow-x-auto">
                {["hero", "stats", "about", "testimonials", "faq", "footer", "categories", "contact"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === tab ? "text-blue-400" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Forms */}
            <div className="max-w-4xl">
                {activeTab === "hero" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-2xl border border-white/10 space-y-6"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Hero Section</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Badge Text</label>
                                <input
                                    type="text"
                                    value={content.hero.badge}
                                    onChange={(e) => updateHero("badge", e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Heading Line 1</label>
                                    <input
                                        type="text"
                                        value={content.hero.headingLine1}
                                        onChange={(e) => updateHero("headingLine1", e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Heading Line 2 (Gradient)</label>
                                    <input
                                        type="text"
                                        value={content.hero.headingLine2}
                                        onChange={(e) => updateHero("headingLine2", e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Subheading</label>
                                <textarea
                                    rows={3}
                                    value={content.hero.subheading}
                                    onChange={(e) => updateHero("subheading", e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === "stats" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-2xl border border-white/10 space-y-6"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                        <div className="grid grid-cols-2 gap-6">
                            {content.stats.map((stat, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Label {i + 1}</label>
                                    <input
                                        type="text"
                                        value={stat.label}
                                        onChange={(e) => updateStat(i, "label", e.target.value)}
                                        className="w-full bg-transparent border-b border-white/10 py-1 text-white mb-3 focus:outline-none focus:border-blue-500"
                                    />
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Value {i + 1}</label>
                                    <input
                                        type="text"
                                        value={stat.value}
                                        onChange={(e) => updateStat(i, "value", e.target.value)}
                                        className="w-full bg-transparent border-b border-white/10 py-1 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Testimonials tab implementation similar to FAQ/Stats, omitted for brevity but should be implemented if needed */}
                {activeTab === "testimonials" && (
                    <div className="glass p-8 rounded-2xl border border-white/10 text-center text-gray-400">
                        Testimonials editing enabled in next update.
                    </div>
                )}

                {activeTab === "about" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-2xl border border-white/10 space-y-6"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">About Section</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={content.about?.title || ""}
                                    onChange={(e) => setContent({ ...content, about: { ...content.about, title: e.target.value } })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    rows={5}
                                    value={content.about?.description || ""}
                                    onChange={(e) => setContent({ ...content, about: { ...content.about, description: e.target.value } })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Image URL</label>
                                <input
                                    type="text"
                                    value={content.about?.imageUrl || ""}
                                    onChange={(e) => setContent({ ...content, about: { ...content.about, imageUrl: e.target.value } })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === "faq" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-2xl border border-white/10 space-y-6"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
                            <button
                                onClick={addFAQ}
                                className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Question
                            </button>
                        </div>

                        <div className="space-y-4">
                            {content.faq.map((faq, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 group">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 space-y-3">
                                            <input
                                                type="text"
                                                value={faq.q}
                                                onChange={(e) => updateFAQ(i, "q", e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                                                placeholder="Question"
                                            />
                                            <textarea
                                                rows={2}
                                                value={faq.a}
                                                onChange={(e) => updateFAQ(i, "a", e.target.value)}
                                                className="w-full bg-transparent border-b border-white/10 py-2 text-gray-400 text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="Answer"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeFAQ(i)}
                                            className="text-gray-500 hover:text-red-400 transition-colors p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === "footer" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-2xl border border-white/10 space-y-6"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Footer Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    rows={3}
                                    value={content.footer?.description || ""}
                                    onChange={(e) => setContent({ ...content, footer: { ...content.footer, description: e.target.value } })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Twitter URL</label>
                                    <input
                                        type="text"
                                        value={content.footer?.socialLinks?.twitter || ""}
                                        onChange={(e) => setContent({ ...content, footer: { ...content.footer, socialLinks: { ...content.footer.socialLinks, twitter: e.target.value } } })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">GitHub URL</label>
                                    <input
                                        type="text"
                                        value={content.footer?.socialLinks?.github || ""}
                                        onChange={(e) => setContent({ ...content, footer: { ...content.footer, socialLinks: { ...content.footer.socialLinks, github: e.target.value } } })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">LinkedIn URL</label>
                                    <input
                                        type="text"
                                        value={content.footer?.socialLinks?.linkedin || ""}
                                        onChange={(e) => setContent({ ...content, footer: { ...content.footer, socialLinks: { ...content.footer.socialLinks, linkedin: e.target.value } } })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === "categories" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-2xl border border-white/10 space-y-6"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Product Categories</h2>
                            <button
                                onClick={addCategory}
                                className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Category
                            </button>
                        </div>

                        <div className="space-y-4">
                            {(content.categories || []).map((category, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => updateCategory(i, e.target.value)}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                    />
                                    <button
                                        onClick={() => removeCategory(i)}
                                        className="p-3 text-gray-500 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === "contact" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-8 rounded-2xl border border-white/10 space-y-6"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Contact Details</h2>

                        {/* Emails */}
                        <div className="space-y-4 border-b border-white/10 pb-6">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-400">Support Emails</label>
                                <button
                                    onClick={() => setContent({
                                        ...content,
                                        contact: {
                                            ...content.contact,
                                            emails: [...(content.contact?.emails || []), ""]
                                        }
                                    })}
                                    className="text-xs bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded border border-white/10 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Email
                                </button>
                            </div>
                            {(content.contact?.emails || []).map((email, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            const newEmails = [...(content.contact?.emails || [])];
                                            newEmails[i] = e.target.value;
                                            setContent({
                                                ...content,
                                                contact: { ...content.contact, emails: newEmails }
                                            });
                                        }}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                        placeholder="email@example.com"
                                    />
                                    <button
                                        onClick={() => {
                                            const newEmails = (content.contact?.emails || []).filter((_, idx) => idx !== i);
                                            setContent({
                                                ...content,
                                                contact: { ...content.contact, emails: newEmails }
                                            });
                                        }}
                                        className="p-3 text-gray-500 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Phone & Hours */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    value={content.contact?.phone || ""}
                                    onChange={(e) => setContent({
                                        ...content,
                                        contact: { ...content.contact, phone: e.target.value }
                                    })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Business Hours</label>
                                <input
                                    type="text"
                                    value={content.contact?.hours || ""}
                                    onChange={(e) => setContent({
                                        ...content,
                                        contact: { ...content.contact, hours: e.target.value }
                                    })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4 pt-2">
                            <label className="block text-sm font-medium text-gray-400">Office Address</label>
                            <input
                                type="text"
                                value={content.contact?.address?.line1 || ""}
                                onChange={(e) => setContent({
                                    ...content,
                                    contact: {
                                        ...content.contact,
                                        address: { ...content.contact.address, line1: e.target.value }
                                    }
                                })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                placeholder="Address Line 1"
                            />
                            <input
                                type="text"
                                value={content.contact?.address?.line2 || ""}
                                onChange={(e) => setContent({
                                    ...content,
                                    contact: {
                                        ...content.contact,
                                        address: { ...content.contact.address, line2: e.target.value }
                                    }
                                })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
                                placeholder="Address Line 2"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
