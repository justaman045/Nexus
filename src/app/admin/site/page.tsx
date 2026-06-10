"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Check, Warning, CircleNotch } from "@phosphor-icons/react";
import { getSiteSettings, updateSiteSettings, SiteSettings, defaultSiteSettings } from "@/lib/siteSettings";
import { Glass, inputCls, labelCls, EASE } from "../_components/shared";

type Section = {
  key: string;
  label: string;
  collapsed?: boolean;
};
const SECTIONS: Section[] = [
  { key: "brand", label: "Brand & Navigation", collapsed: false },
  { key: "footer", label: "Footer" },
  { key: "homepage", label: "Homepage Sections" },
  { key: "products", label: "Products & Detail" },
  { key: "dashboard", label: "Dashboard & Orders" },
  { key: "about", label: "About Page" },
  { key: "contact", label: "Contact Page" },
  { key: "pages", label: "Legal & Utility Pages" },
  { key: "cookies", label: "Cookie Banner" },
];

function SectionHeader({ label }: { label: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[13px] font-bold text-white/40 hover:text-white/70 transition-colors mb-4 w-full text-left"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>{">"}</span>
        {label}
      </button>
      {open && <div className="space-y-4" />}
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 font-bold text-[12px] px-6 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 text-white"
      style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
    >
      {saving ? <CircleNotch size={14} className="animate-spin" /> : <Globe size={14} weight="fill" />}
      Save Settings
    </button>
  );
}

function StringArrayEditor({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input value={v} onChange={(e) => { const n = [...values]; n[i] = e.target.value; onChange(n); }} className={inputCls} placeholder={placeholder} />
          <button onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-400/70 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all text-[16px]">x</button>
        </div>
      ))}
      <button onClick={() => onChange([...values, ""])}
        className="text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors">+ Add item</button>
    </div>
  );
}

function NavLinksEditor({ links, onChange }: { links: { label: string; href: string }[]; onChange: (v: { label: string; href: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={link.label} onChange={(e) => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; onChange(n); }} className={inputCls} placeholder="Label" />
          <input value={link.href} onChange={(e) => { const n = [...links]; n[i] = { ...n[i], href: e.target.value }; onChange(n); }} className={inputCls} placeholder="/path" />
          <button onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-400/70 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all text-[16px]">x</button>
        </div>
      ))}
      <button onClick={() => onChange([...links, { label: "", href: "" }])}
        className="text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors">+ Add link</button>
    </div>
  );
}

function FooterColumnsEditor({ columns, onChange }: { columns: SiteSettings["footerColumns"]; onChange: (v: SiteSettings["footerColumns"]) => void }) {
  return (
    <div className="space-y-4">
      {columns.map((col, i) => (
        <div key={i} className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between">
            <input value={col.heading} onChange={(e) => { const n = [...columns]; n[i] = { ...n[i], heading: e.target.value }; onChange(n); }} className={inputCls + " max-w-[200px]"} placeholder="Column heading" />
            <button onClick={() => onChange(columns.filter((_, j) => j !== i))}
              className="text-white/20 hover:text-red-400/70 transition-colors text-[13px]">Remove</button>
          </div>
          <NavLinksEditor links={col.links} onChange={(links) => { const n = [...columns]; n[i] = { ...n[i], links }; onChange(n); }} />
        </div>
      ))}
      <button onClick={() => onChange([...columns, { heading: "", links: [{ label: "", href: "" }] }])}
        className="text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors">+ Add column</button>
    </div>
  );
}

function StepsEditor({ steps, onChange }: { steps: { title: string; description: string }[]; onChange: (v: { title: string; description: string }[]) => void }) {
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input value={s.title} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], title: e.target.value }; onChange(n); }} className={inputCls} placeholder="Title" />
          <input value={s.description} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], description: e.target.value }; onChange(n); }} className={inputCls} placeholder="Description" />
          <button onClick={() => onChange(steps.filter((_, j) => j !== i))}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-400/70 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all text-[16px]">x</button>
        </div>
      ))}
      <button onClick={() => onChange([...steps, { title: "", description: "" }])}
        className="text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors">+ Add step</button>
    </div>
  );
}

function FeaturesEditor({ features, onChange }: { features: { title: string; description: string }[]; onChange: (v: { title: string; description: string }[]) => void }) {
  return <StepsEditor steps={features} onChange={onChange} />;
}

function PrinciplesEditor({ principles, onChange }: { principles: { title: string; description: string }[]; onChange: (v: { title: string; description: string }[]) => void }) {
  return <StepsEditor steps={principles} onChange={onChange} />;
}

function StatCardsEditor({ cards, onChange }: { cards: { value: string; label: string }[]; onChange: (v: { value: string; label: string }[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={c.value} onChange={(e) => { const n = [...cards]; n[i] = { ...n[i], value: e.target.value }; onChange(n); }} className={inputCls} placeholder="Value" />
          <input value={c.label} onChange={(e) => { const n = [...cards]; n[i] = { ...n[i], label: e.target.value }; onChange(n); }} className={inputCls} placeholder="Label" />
          <button onClick={() => onChange(cards.filter((_, j) => j !== i))}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-400/70 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all text-[16px]">x</button>
        </div>
      ))}
      <button onClick={() => onChange([...cards, { value: "", label: "" }])}
        className="col-span-2 text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors">+ Add stat</button>
    </div>
  );
}

export default function AdminSite() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    getSiteSettings().then(s => { setSettings(s); setIsLoading(false); });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus("idle");
    try {
      await updateSiteSettings(settings);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setSettings(p => ({ ...p, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Globe size={16} className="text-white/40" />
        </motion.div>
        <p className="text-white/30 text-[13px]">Loading site settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Site Settings</h1>
          <p className="text-white/30 text-[14px] mt-1">Brand, navigation, page content, and global configuration</p>
        </div>
        {status === "success" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-emerald-500/[0.1] border border-emerald-500/[0.15] text-emerald-400/80 px-4 py-2 rounded-xl text-[13px] font-semibold">
            <Check size={14} weight="bold" /> Saved
          </motion.div>
        )}
        {status === "error" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-500/[0.07] border border-red-500/[0.12] text-red-400/80 px-4 py-2 rounded-xl text-[13px] font-medium">
            <Warning size={14} /> Failed
          </motion.div>
        )}
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Brand & Navigation */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Brand & Navigation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Brand Name</label>
              <input value={settings.brandName} onChange={(e) => update("brandName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Site URL</label>
              <input value={settings.siteUrl} onChange={(e) => update("siteUrl", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Nav Links</label>
            <NavLinksEditor links={settings.navLinks} onChange={(v) => update("navLinks", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>CTA Label</label>
              <input value={settings.navCta.label} onChange={(e) => update("navCta", { ...settings.navCta, label: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CTA Link</label>
              <input value={settings.navCta.href} onChange={(e) => update("navCta", { ...settings.navCta, href: e.target.value })} className={inputCls} />
            </div>
          </div>
        </Glass>

        {/* Footer */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Footer</h2>
          <FooterColumnsEditor columns={settings.footerColumns} onChange={(v) => update("footerColumns", v)} />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Copyright</label>
              <input value={settings.footerCopyright} onChange={(e) => update("footerCopyright", e.target.value)} className={inputCls} placeholder="{year}" />
            </div>
            <div>
              <label className={labelCls}>Status Text</label>
              <input value={settings.footerStatusText} onChange={(e) => update("footerStatusText", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Version Badge</label>
              <input value={settings.footerVersionBadge} onChange={(e) => update("footerVersionBadge", e.target.value)} className={inputCls} />
            </div>
          </div>
        </Glass>

        {/* Homepage Sections */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Homepage Sections</h2>

          <div>
            <label className={labelCls}>Trust Strip (items)</label>
            <StringArrayEditor values={settings.trustStrip} onChange={(v) => update("trustStrip", v)} placeholder="Trust item text" />
          </div>

          <div className="border-t border-white/[0.04] pt-5 space-y-4">
            <label className={labelCls}>How It Works</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.howItWorks.heading} onChange={(e) => update("howItWorks", { ...settings.howItWorks, heading: e.target.value })} className={inputCls} placeholder="Heading" />
              <input value={settings.howItWorks.subheading} onChange={(e) => update("howItWorks", { ...settings.howItWorks, subheading: e.target.value })} className={inputCls} placeholder="Subheading" />
            </div>
            <StepsEditor steps={settings.howItWorks.steps} onChange={(steps) => update("howItWorks", { ...settings.howItWorks, steps })} />
          </div>

          <div className="border-t border-white/[0.04] pt-5 space-y-4">
            <label className={labelCls}>Bento / Feature Grid</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.bentoGrid.heading} onChange={(e) => update("bentoGrid", { ...settings.bentoGrid, heading: e.target.value })} className={inputCls} />
              <input value={settings.bentoGrid.subheading} onChange={(e) => update("bentoGrid", { ...settings.bentoGrid, subheading: e.target.value })} className={inputCls} />
            </div>
            <input value={settings.bentoGrid.description} onChange={(e) => update("bentoGrid", { ...settings.bentoGrid, description: e.target.value })} className={inputCls} placeholder="Description" />
            <FeaturesEditor features={settings.bentoGrid.features} onChange={(features) => update("bentoGrid", { ...settings.bentoGrid, features })} />
          </div>

          <div className="border-t border-white/[0.04] pt-5 space-y-4">
            <label className={labelCls}>Products Section Headings</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.productSectionHeadings.heading} onChange={(e) => update("productSectionHeadings", { ...settings.productSectionHeadings, heading: e.target.value })} className={inputCls} />
              <input value={settings.productSectionHeadings.subheading} onChange={(e) => update("productSectionHeadings", { ...settings.productSectionHeadings, subheading: e.target.value })} className={inputCls} />
            </div>
            <input value={settings.productSectionHeadings.description} onChange={(e) => update("productSectionHeadings", { ...settings.productSectionHeadings, description: e.target.value })} className={inputCls} />
          </div>

          <div className="border-t border-white/[0.04] pt-5 space-y-4">
            <label className={labelCls}>Final CTA</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.finalCta.heading} onChange={(e) => update("finalCta", { ...settings.finalCta, heading: e.target.value })} className={inputCls} />
              <input value={settings.finalCta.subheading} onChange={(e) => update("finalCta", { ...settings.finalCta, subheading: e.target.value })} className={inputCls} />
            </div>
            <input value={settings.finalCta.description} onChange={(e) => update("finalCta", { ...settings.finalCta, description: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.finalCta.primaryButton} onChange={(e) => update("finalCta", { ...settings.finalCta, primaryButton: e.target.value })} className={inputCls} />
              <input value={settings.finalCta.secondaryButton} onChange={(e) => update("finalCta", { ...settings.finalCta, secondaryButton: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-5 space-y-4">
            <label className={labelCls}>Section Headings (Testimonials & FAQ)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/20">Testimonials Heading</label>
                <input value={settings.sectionHeadings.testimonials.heading} onChange={(e) => update("sectionHeadings", { ...settings.sectionHeadings, testimonials: { ...settings.sectionHeadings.testimonials, heading: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Testimonials Subheading</label>
                <input value={settings.sectionHeadings.testimonials.subheading} onChange={(e) => update("sectionHeadings", { ...settings.sectionHeadings, testimonials: { ...settings.sectionHeadings.testimonials, subheading: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/20">FAQ Heading</label>
                <input value={settings.sectionHeadings.faq.heading} onChange={(e) => update("sectionHeadings", { ...settings.sectionHeadings, faq: { ...settings.sectionHeadings.faq, heading: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">FAQ Subheading</label>
                <input value={settings.sectionHeadings.faq.subheading} onChange={(e) => update("sectionHeadings", { ...settings.sectionHeadings, faq: { ...settings.sectionHeadings.faq, subheading: e.target.value } })} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-5">
            <label className={labelCls}>Hero Decorative Stats</label>
            <StatCardsEditor cards={settings.heroDecorStats} onChange={(v) => update("heroDecorStats", v)} />
          </div>
        </Glass>

        {/* Products & Detail */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Products & Detail Page</h2>
          <div>
            <label className={labelCls}>Products Page Headings</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.productsPage.heading} onChange={(e) => update("productsPage", { ...settings.productsPage, heading: e.target.value })} className={inputCls} />
              <input value={settings.productsPage.subheading} onChange={(e) => update("productsPage", { ...settings.productsPage, subheading: e.target.value })} className={inputCls} />
            </div>
            <input value={settings.productsPage.description} onChange={(e) => update("productsPage", { ...settings.productsPage, description: e.target.value })} className={`${inputCls} mt-4`} />
          </div>
          <div className="border-t border-white/[0.04] pt-4 space-y-4">
            <label className={labelCls}>Product Detail Labels</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-white/20">Acquire Label</label>
                <input value={settings.productDetail.acquireLabel} onChange={(e) => update("productDetail", { ...settings.productDetail, acquireLabel: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Live Preview</label>
                <input value={settings.productDetail.livePreviewLabel} onChange={(e) => update("productDetail", { ...settings.productDetail, livePreviewLabel: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">No Demo</label>
                <input value={settings.productDetail.noDemoLabel} onChange={(e) => update("productDetail", { ...settings.productDetail, noDemoLabel: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Documentation</label>
                <input value={settings.productDetail.documentationLabel} onChange={(e) => update("productDetail", { ...settings.productDetail, documentationLabel: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Checkout</label>
                <input value={settings.productDetail.checkoutLabel} onChange={(e) => update("productDetail", { ...settings.productDetail, checkoutLabel: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Merchant Name</label>
                <input value={settings.productDetail.merchantName} onChange={(e) => update("productDetail", { ...settings.productDetail, merchantName: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>
        </Glass>

        {/* Dashboard & Orders */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Dashboard & Orders Page</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vault Heading</label>
              <input value={settings.dashboard.vaultHeading} onChange={(e) => update("dashboard", { ...settings.dashboard, vaultHeading: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Library Heading</label>
              <input value={settings.dashboard.libraryHeading} onChange={(e) => update("dashboard", { ...settings.dashboard, libraryHeading: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Vault Description</label>
            <input value={settings.dashboard.vaultDescription} onChange={(e) => update("dashboard", { ...settings.dashboard, vaultDescription: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Downloads Ready</label>
              <input value={settings.dashboard.downloadsReady} onChange={(e) => update("dashboard", { ...settings.dashboard, downloadsReady: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sign Out</label>
              <input value={settings.dashboard.signOutLabel} onChange={(e) => update("dashboard", { ...settings.dashboard, signOutLabel: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>SSL Badge</label>
            <input value={settings.dashboard.sslBadge} onChange={(e) => update("dashboard", { ...settings.dashboard, sslBadge: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Empty State Heading</label>
            <input value={settings.dashboard.emptyHeading} onChange={(e) => update("dashboard", { ...settings.dashboard, emptyHeading: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Empty State Description</label>
            <input value={settings.dashboard.emptyDescription} onChange={(e) => update("dashboard", { ...settings.dashboard, emptyDescription: e.target.value })} className={inputCls} />
          </div>
          <div className="border-t border-white/[0.04] pt-4 space-y-4">
            <label className={labelCls}>Orders Page</label>
            <input value={settings.ordersPage.heading} onChange={(e) => update("ordersPage", { ...settings.ordersPage, heading: e.target.value })} className={inputCls} />
            <input value={settings.ordersPage.subheading} onChange={(e) => update("ordersPage", { ...settings.ordersPage, subheading: e.target.value })} className={inputCls} />
            <input value={settings.ordersPage.description} onChange={(e) => update("ordersPage", { ...settings.ordersPage, description: e.target.value })} className={inputCls} />
          </div>
        </Glass>

        {/* About Page */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">About Page</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Hero Heading</label>
              <input value={settings.aboutPage.heroHeading} onChange={(e) => update("aboutPage", { ...settings.aboutPage, heroHeading: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hero Subheading</label>
              <input value={settings.aboutPage.heroSubheading} onChange={(e) => update("aboutPage", { ...settings.aboutPage, heroSubheading: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Stat Cards</label>
            <StatCardsEditor cards={settings.aboutPage.statCards} onChange={(v) => update("aboutPage", { ...settings.aboutPage, statCards: v })} />
          </div>
          <div>
            <label className={labelCls}>Manifesto Quote</label>
            <textarea value={settings.aboutPage.manifestoQuote} onChange={(e) => update("aboutPage", { ...settings.aboutPage, manifestoQuote: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Attribution</label>
            <input value={settings.aboutPage.manifestoAttribution} onChange={(e) => update("aboutPage", { ...settings.aboutPage, manifestoAttribution: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Principles Heading</label>
              <input value={settings.aboutPage.principlesSectionHeading} onChange={(e) => update("aboutPage", { ...settings.aboutPage, principlesSectionHeading: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Principles Subheading</label>
              <input value={settings.aboutPage.principlesSectionSubheading} onChange={(e) => update("aboutPage", { ...settings.aboutPage, principlesSectionSubheading: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Principles</label>
            <PrinciplesEditor principles={settings.aboutPage.principles} onChange={(principles) => update("aboutPage", { ...settings.aboutPage, principles })} />
          </div>
          <div className="border-t border-white/[0.04] pt-4 space-y-4">
            <label className={labelCls}>Collective Section</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.aboutPage.collectiveSectionLabel} onChange={(e) => update("aboutPage", { ...settings.aboutPage, collectiveSectionLabel: e.target.value })} className={inputCls} />
              <input value={settings.aboutPage.collectiveHeading} onChange={(e) => update("aboutPage", { ...settings.aboutPage, collectiveHeading: e.target.value })} className={inputCls} />
            </div>
            <label className="text-[10px] text-white/20">Body text (one paragraph per line)</label>
            <StringArrayEditor values={settings.aboutPage.collectiveBody} onChange={(v) => update("aboutPage", { ...settings.aboutPage, collectiveBody: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/20">Team Label</label>
                <input value={settings.aboutPage.teamLabel} onChange={(e) => update("aboutPage", { ...settings.aboutPage, teamLabel: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Team Date</label>
                <input value={settings.aboutPage.teamDate} onChange={(e) => update("aboutPage", { ...settings.aboutPage, teamDate: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>
        </Glass>

        {/* Contact Page */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Contact Page</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Heading</label>
              <input value={settings.contactPage.heading} onChange={(e) => update("contactPage", { ...settings.contactPage, heading: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Subheading</label>
              <input value={settings.contactPage.subheading} onChange={(e) => update("contactPage", { ...settings.contactPage, subheading: e.target.value })} className={inputCls} />
            </div>
          </div>
          <input value={settings.contactPage.description} onChange={(e) => update("contactPage", { ...settings.contactPage, description: e.target.value })} className={inputCls} />
          <div className="grid grid-cols-2 gap-4">
            <input value={settings.contactPage.detailsHeading} onChange={(e) => update("contactPage", { ...settings.contactPage, detailsHeading: e.target.value })} className={inputCls} />
            <input value={settings.contactPage.detailsSubheading} onChange={(e) => update("contactPage", { ...settings.contactPage, detailsSubheading: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Response Time</label>
            <input value={settings.contactPage.responseTime} onChange={(e) => update("contactPage", { ...settings.contactPage, responseTime: e.target.value })} className={inputCls} />
          </div>
          <div className="border-t border-white/[0.04] pt-4 space-y-4">
            <label className={labelCls}>Form Success State</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={settings.contactPage.formSuccessHeading} onChange={(e) => update("contactPage", { ...settings.contactPage, formSuccessHeading: e.target.value })} className={inputCls} />
              <input value={settings.contactPage.formSuccessMessage} onChange={(e) => update("contactPage", { ...settings.contactPage, formSuccessMessage: e.target.value })} className={inputCls} />
            </div>
            <input value={settings.contactPage.formSendAnother} onChange={(e) => update("contactPage", { ...settings.contactPage, formSendAnother: e.target.value })} className={inputCls} />
          </div>
          <div className="border-t border-white/[0.04] pt-4">
            <label className={labelCls}>Form Labels</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/20">Name</label>
                <input value={settings.contactPage.formLabels.name} onChange={(e) => update("contactPage", { ...settings.contactPage, formLabels: { ...settings.contactPage.formLabels, name: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Email</label>
                <input value={settings.contactPage.formLabels.email} onChange={(e) => update("contactPage", { ...settings.contactPage, formLabels: { ...settings.contactPage.formLabels, email: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Subject</label>
                <input value={settings.contactPage.formLabels.subject} onChange={(e) => update("contactPage", { ...settings.contactPage, formLabels: { ...settings.contactPage.formLabels, subject: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] text-white/20">Message</label>
                <input value={settings.contactPage.formLabels.message} onChange={(e) => update("contactPage", { ...settings.contactPage, formLabels: { ...settings.contactPage.formLabels, message: e.target.value } })} className={inputCls} />
              </div>
            </div>
          </div>
        </Glass>

        {/* Legal & Utility Pages */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Utility Pages</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Code</label>
              <input value={settings.notFound.code} onChange={(e) => update("notFound", { ...settings.notFound, code: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Heading</label>
              <input value={settings.notFound.heading} onChange={(e) => update("notFound", { ...settings.notFound, heading: e.target.value })} className={inputCls} />
            </div>
          </div>
          <input value={settings.notFound.description} onChange={(e) => update("notFound", { ...settings.notFound, description: e.target.value })} className={inputCls} />
          <div className="grid grid-cols-2 gap-4">
            <input value={settings.notFound.backButton} onChange={(e) => update("notFound", { ...settings.notFound, backButton: e.target.value })} className={inputCls} />
            <input value={settings.notFound.browseButton} onChange={(e) => update("notFound", { ...settings.notFound, browseButton: e.target.value })} className={inputCls} />
          </div>

          <div className="border-t border-white/[0.04] pt-4 space-y-4">
            <label className={labelCls}>Legal Pages (Markdown)</label>
            <div>
              <label className="text-[10px] text-white/20">Terms of Service</label>
              <textarea value={settings.legalPages.terms} onChange={(e) => update("legalPages", { ...settings.legalPages, terms: e.target.value })}
                rows={8} className={`${inputCls} resize-y font-mono text-[13px]`} placeholder="# Terms of Service\n\nEnter markdown..." />
            </div>
            <div>
              <label className="text-[10px] text-white/20">Privacy Policy</label>
              <textarea value={settings.legalPages.privacy} onChange={(e) => update("legalPages", { ...settings.legalPages, privacy: e.target.value })}
                rows={8} className={`${inputCls} resize-y font-mono text-[13px]`} placeholder="# Privacy Policy\n\nEnter markdown..." />
            </div>
            <div>
              <label className="text-[10px] text-white/20">Cookie Policy</label>
              <textarea value={settings.legalPages.cookies} onChange={(e) => update("legalPages", { ...settings.legalPages, cookies: e.target.value })}
                rows={8} className={`${inputCls} resize-y font-mono text-[13px]`} placeholder="# Cookie Policy\n\nEnter markdown..." />
            </div>
          </div>
        </Glass>

        {/* Cookie Banner */}
        <Glass className="p-8 rounded-[28px] space-y-5">
          <h2 className="text-[17px] font-bold text-white">Cookie Banner</h2>
          <input value={settings.cookieBanner.message} onChange={(e) => update("cookieBanner", { ...settings.cookieBanner, message: e.target.value })} className={inputCls} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Accept Label</label>
              <input value={settings.cookieBanner.acceptLabel} onChange={(e) => update("cookieBanner", { ...settings.cookieBanner, acceptLabel: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Learn More Label</label>
              <input value={settings.cookieBanner.learnMoreLabel} onChange={(e) => update("cookieBanner", { ...settings.cookieBanner, learnMoreLabel: e.target.value })} className={inputCls} />
            </div>
          </div>
        </Glass>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <SaveButton onClick={handleSave} saving={isSaving} />
        </div>
      </div>
    </div>
  );
}
