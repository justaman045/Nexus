"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FloppyDisk,
  Plus,
  Trash,
  CircleNotch,
  Check,
} from "@phosphor-icons/react";
import { getHomepageContent, updateHomepageContent, HomepageContent } from "@/lib/cms";
import { Glass, inputCls, labelCls, EASE } from "../_components/shared";

const TABS = ["hero", "stats", "about", "testimonials", "faq", "footer", "categories", "contact"];

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 font-bold text-[12px] px-6 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 text-white"
      style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
    >
      {saving ? (
        <CircleNotch size={14} className="animate-spin" />
      ) : (
        <FloppyDisk size={14} weight="fill" />
      )}
      Save Changes
    </button>
  );
}

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getHomepageContent().then((data) => {
      setContent(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!content) return;
    setIsSaving(true);
    try {
      await updateHomepageContent(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateHero = (field: string, value: string) => {
    if (!content) return;
    setContent({ ...content, hero: { ...content.hero, [field]: value } });
  };

  const updateStat = (i: number, field: string, value: string) => {
    if (!content) return;
    const s = [...content.stats];
    s[i] = { ...s[i], [field]: value };
    setContent({ ...content, stats: s });
  };

  const updateFAQ = (i: number, field: string, value: string) => {
    if (!content) return;
    const f = [...content.faq];
    f[i] = { ...f[i], [field]: value };
    setContent({ ...content, faq: f });
  };

  const addFAQ = () => {
    if (!content) return;
    setContent({ ...content, faq: [...content.faq, { q: "New question?", a: "Answer here." }] });
  };

  const removeFAQ = (i: number) => {
    if (!content) return;
    setContent({ ...content, faq: content.faq.filter((_, idx) => idx !== i) });
  };

  const updateTestimonial = (i: number, field: string, value: string) => {
    if (!content) return;
    const t = [...content.testimonials];
    t[i] = { ...t[i], [field]: value };
    setContent({ ...content, testimonials: t });
  };

  const addTestimonial = () => {
    if (!content) return;
    setContent({
      ...content,
      testimonials: [
        ...content.testimonials,
        { quote: "Enter testimonial quote here.", author: "Author Name", role: "Role / Company" },
      ],
    });
  };

  const removeTestimonial = (i: number) => {
    if (!content) return;
    setContent({ ...content, testimonials: content.testimonials.filter((_, idx) => idx !== i) });
  };

  const addCategory = () => {
    if (!content) return;
    setContent({ ...content, categories: [...(content.categories || []), "New Category"] });
  };

  const updateCategory = (i: number, value: string) => {
    if (!content) return;
    const c = [...(content.categories || [])];
    c[i] = value;
    setContent({ ...content, categories: c });
  };

  const removeCategory = (i: number) => {
    if (!content) return;
    setContent({ ...content, categories: (content.categories || []).filter((_, idx) => idx !== i) });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <FloppyDisk size={16} className="text-white/40" />
        </motion.div>
        <p className="text-white/30 text-[13px]">Loading content…</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Content Management</h1>
          <p className="text-white/30 text-[14px] mt-1">Edit all website content from here</p>
        </div>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-emerald-500/[0.1] border border-emerald-500/[0.15] text-emerald-400/80 px-4 py-2 rounded-xl text-[13px] font-semibold"
          >
            <Check size={14} weight="bold" /> Saved successfully
          </motion.div>
        )}
      </div>

      {/* Tab bar */}
      <Glass className="rounded-2xl p-1.5 overflow-x-auto" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? "text-black shadow-sm"
                  : "text-white/35 hover:text-white/65"
              }`}
              style={activeTab === tab ? { background: "#fff" } : {}}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </Glass>

      {/* Forms */}
      <div className="max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {activeTab === "hero" && (
              <Glass className="p-8 rounded-[28px] space-y-5">
                <h2 className="text-[17px] font-bold text-white mb-2">Hero Section</h2>
                <div>
                  <label className={labelCls}>Badge Text</label>
                  <input type="text" value={content.hero.badge} onChange={(e) => updateHero("badge", e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Heading Line 1</label>
                    <input type="text" value={content.hero.headingLine1} onChange={(e) => updateHero("headingLine1", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Heading Line 2</label>
                    <input type="text" value={content.hero.headingLine2} onChange={(e) => updateHero("headingLine2", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Subheading</label>
                  <textarea rows={3} value={content.hero.subheading} onChange={(e) => updateHero("subheading", e.target.value)} className={`${inputCls} resize-none`} />
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}

            {activeTab === "stats" && (
              <Glass className="p-8 rounded-[28px] space-y-5">
                <h2 className="text-[17px] font-bold text-white mb-2">Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  {content.stats.map((stat, i) => (
                    <div key={i} className="p-5 rounded-2xl space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <label className={labelCls}>Label</label>
                        <input type="text" value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Value</label>
                        <input type="text" value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}

            {activeTab === "about" && (
              <Glass className="p-8 rounded-[28px] space-y-5">
                <h2 className="text-[17px] font-bold text-white mb-2">About Section</h2>
                <div>
                  <label className={labelCls}>Title</label>
                  <input type="text" value={content.about?.title || ""} onChange={(e) => setContent({ ...content, about: { ...content.about, title: e.target.value } })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={5} value={content.about?.description || ""} onChange={(e) => setContent({ ...content, about: { ...content.about, description: e.target.value } })} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Image URL</label>
                  <input type="text" value={content.about?.imageUrl || ""} onChange={(e) => setContent({ ...content, about: { ...content.about, imageUrl: e.target.value } })} className={inputCls} placeholder="https://..." />
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}

            {activeTab === "testimonials" && (
              <Glass className="p-8 rounded-[28px] space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-[17px] font-bold text-white">Testimonials</h2>
                  <button
                    onClick={addTestimonial}
                    className="flex items-center gap-2 text-[12px] font-semibold bg-white/[0.04] hover:bg-white/[0.07] text-white/60 hover:text-white px-3 py-1.5 rounded-xl border border-white/[0.06] transition-all"
                  >
                    <Plus size={13} weight="bold" /> Add
                  </button>
                </div>
                <div className="space-y-4">
                  {content.testimonials.map((t, i) => (
                    <div key={i} className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className={labelCls}>Quote</label>
                            <textarea rows={2} value={t.quote} onChange={(e) => updateTestimonial(i, "quote", e.target.value)} className={`${inputCls} resize-none`} placeholder="Testimonial quote..." />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelCls}>Author Name</label>
                              <input type="text" value={t.author} onChange={(e) => updateTestimonial(i, "author", e.target.value)} className={inputCls} placeholder="Jane Doe" />
                            </div>
                            <div>
                              <label className={labelCls}>Role / Company</label>
                              <input type="text" value={t.role} onChange={(e) => updateTestimonial(i, "role", e.target.value)} className={inputCls} placeholder="CEO at Acme" />
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeTestimonial(i)} className="text-white/20 hover:text-red-400/70 transition-colors p-1.5 mt-1 shrink-0">
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {content.testimonials.length === 0 && (
                    <p className="text-white/25 text-[13px] text-center py-8">No testimonials yet. Click Add to create one.</p>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}

            {activeTab === "faq" && (
              <Glass className="p-8 rounded-[28px] space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-[17px] font-bold text-white">FAQ</h2>
                  <button
                    onClick={addFAQ}
                    className="flex items-center gap-2 text-[12px] font-semibold bg-white/[0.04] hover:bg-white/[0.07] text-white/60 hover:text-white px-3 py-1.5 rounded-xl border border-white/[0.06] transition-all"
                  >
                    <Plus size={13} weight="bold" /> Add Question
                  </button>
                </div>
                <div className="space-y-3">
                  {content.faq.map((faq, i) => (
                    <div key={i} className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className={labelCls}>Question</label>
                            <input type="text" value={faq.q} onChange={(e) => updateFAQ(i, "q", e.target.value)} className={inputCls} placeholder="Question?" />
                          </div>
                          <div>
                            <label className={labelCls}>Answer</label>
                            <textarea rows={2} value={faq.a} onChange={(e) => updateFAQ(i, "a", e.target.value)} className={`${inputCls} resize-none`} placeholder="Answer..." />
                          </div>
                        </div>
                        <button onClick={() => removeFAQ(i)} className="text-white/20 hover:text-red-400/70 transition-colors p-1.5 mt-1 shrink-0">
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}

            {activeTab === "footer" && (
              <Glass className="p-8 rounded-[28px] space-y-5">
                <h2 className="text-[17px] font-bold text-white mb-2">Footer</h2>
                <div>
                  <label className={labelCls}>Brand Description</label>
                  <textarea rows={3} value={content.footer?.description || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, description: e.target.value } })} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Twitter URL</label>
                    <input type="text" value={content.footer?.socialLinks?.twitter || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, socialLinks: { ...content.footer.socialLinks, twitter: e.target.value } } })} className={inputCls} placeholder="https://twitter.com/..." />
                  </div>
                  <div>
                    <label className={labelCls}>GitHub URL</label>
                    <input type="text" value={content.footer?.socialLinks?.github || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, socialLinks: { ...content.footer.socialLinks, github: e.target.value } } })} className={inputCls} placeholder="https://github.com/..." />
                  </div>
                  <div>
                    <label className={labelCls}>LinkedIn URL</label>
                    <input type="text" value={content.footer?.socialLinks?.linkedin || ""} onChange={(e) => setContent({ ...content, footer: { ...content.footer, socialLinks: { ...content.footer.socialLinks, linkedin: e.target.value } } })} className={inputCls} placeholder="https://linkedin.com/..." />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}

            {activeTab === "categories" && (
              <Glass className="p-8 rounded-[28px] space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-[17px] font-bold text-white">Product Categories</h2>
                  <button
                    onClick={addCategory}
                    className="flex items-center gap-2 text-[12px] font-semibold bg-white/[0.04] hover:bg-white/[0.07] text-white/60 hover:text-white px-3 py-1.5 rounded-xl border border-white/[0.06] transition-all"
                  >
                    <Plus size={13} weight="bold" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(content.categories || []).map((cat, i) => (
                    <div key={i} className="flex gap-3">
                      <input type="text" value={cat} onChange={(e) => updateCategory(i, e.target.value)} className={inputCls} />
                      <button onClick={() => removeCategory(i)} className="shrink-0 w-11 h-11 flex items-center justify-center text-white/20 hover:text-red-400/70 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all">
                        <Trash size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}

            {activeTab === "contact" && (
              <Glass className="p-8 rounded-[28px] space-y-6">
                <h2 className="text-[17px] font-bold text-white mb-2">Contact Details</h2>

                {/* Emails */}
                <div className="space-y-3 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-between items-center">
                    <label className={labelCls}>Support Emails</label>
                    <button
                      onClick={() => setContent({ ...content, contact: { ...content.contact, emails: [...(content.contact?.emails || []), ""] } })}
                      className="flex items-center gap-1.5 text-[11px] font-bold bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white/70 px-2.5 py-1 rounded-lg border border-white/[0.05] transition-all"
                    >
                      <Plus size={11} weight="bold" /> Add Email
                    </button>
                  </div>
                  {(content.contact?.emails || []).map((email, i) => (
                    <div key={i} className="flex gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const emails = [...(content.contact?.emails || [])];
                          emails[i] = e.target.value;
                          setContent({ ...content, contact: { ...content.contact, emails } });
                        }}
                        className={inputCls}
                        placeholder="support@example.com"
                      />
                      <button
                        onClick={() => {
                          const emails = (content.contact?.emails || []).filter((_, idx) => idx !== i);
                          setContent({ ...content, contact: { ...content.contact, emails } });
                        }}
                        className="shrink-0 w-11 h-11 flex items-center justify-center text-white/20 hover:text-red-400/70 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="text" value={content.contact?.phone || ""} onChange={(e) => setContent({ ...content, contact: { ...content.contact, phone: e.target.value } })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Business Hours</label>
                    <input type="text" value={content.contact?.hours || ""} onChange={(e) => setContent({ ...content, contact: { ...content.contact, hours: e.target.value } })} className={inputCls} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={labelCls}>Address</label>
                  <input type="text" value={content.contact?.address?.line1 || ""} onChange={(e) => setContent({ ...content, contact: { ...content.contact, address: { ...content.contact.address, line1: e.target.value } } })} className={inputCls} placeholder="Line 1" />
                  <input type="text" value={content.contact?.address?.line2 || ""} onChange={(e) => setContent({ ...content, contact: { ...content.contact, address: { ...content.contact.address, line2: e.target.value } } })} className={inputCls} placeholder="Line 2" />
                </div>

                <div className="flex justify-end pt-2">
                  <SaveButton onClick={handleSave} saving={isSaving} />
                </div>
              </Glass>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
