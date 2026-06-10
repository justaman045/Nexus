"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { EnvelopeSimple, MapPin, Phone, PaperPlaneTilt, CircleNotch } from "@phosphor-icons/react";
import { getHomepageContent, defaultContent, HomepageContent } from "@/lib/cms";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function ContactPage() {
    const siteSettings = useSiteSettings();
    const [content, setContent] = useState<HomepageContent>(defaultContent);
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        getHomepageContent().then(d => { if (d) setContent(d); }).catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1400));
        setSent(true);
        setIsSubmitting(false);
        setFormData({ name: "", email: "", subject: "", message: "" });
    };

    const contactInfo = content.contact || {
        emails: ["hello@nexus.com"],
        phone: "+1 (555) 000-0000",
        hours: "Mon–Fri, 9am–6pm EST",
        address: { line1: "123 Innovation Drive", line2: "San Francisco, CA" },
    };

    return (
        <div className="min-h-[100dvh] bg-background overflow-x-hidden">

            {/* ── Hero ── */}
            <section className="text-center py-20 px-6 border-b border-border/50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className="max-w-[600px] mx-auto space-y-5"
                >
                    <p className="text-label">{siteSettings.contactPage.heading}</p>
                    <h1 className="text-[clamp(40px,6vw,72px)] font-bold tracking-tight leading-[1.05] gradient-text">
                        {siteSettings.contactPage.subheading}
                    </h1>
                    <p className="text-[16px] text-muted-foreground leading-relaxed max-w-[420px] mx-auto">
                        {siteSettings.contactPage.description}
                    </p>
                </motion.div>
            </section>

            {/* ── Content ── */}
            <div className="container-pro px-6 sm:px-8 lg:px-12 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-12 xl:gap-20 items-start">

                    {/* Left: contact info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.8, ease: EASE }}
                        className="space-y-10"
                    >
                        <div className="space-y-2">
                            <h2 className="text-[24px] font-bold tracking-tight text-foreground">{siteSettings.contactPage.detailsHeading}</h2>
                            <p className="text-[15px] text-muted-foreground leading-relaxed">
                                {siteSettings.contactPage.detailsSubheading}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                {
                                    icon: EnvelopeSimple,
                                    label: "Email",
                                    value: contactInfo.emails?.[0] ?? "hello@nexus.com",
                                    sub: null,
                                },
                                {
                                    icon: Phone,
                                    label: "Phone",
                                    value: contactInfo.phone ?? "+1 (555) 000-0000",
                                    sub: contactInfo.hours ?? "Mon–Fri, 9am–6pm",
                                },
                                {
                                    icon: MapPin,
                                    label: "Location",
                                    value: contactInfo.address?.line1 ?? "San Francisco, CA",
                                    sub: contactInfo.address?.line2 ?? null,
                                },
                            ].map(({ icon: Icon, label, value, sub }) => (
                                <div key={label} className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                                        <Icon size={18} weight="regular" className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-1">{label}</p>
                                        <p className="text-[15px] font-semibold text-foreground">{value}</p>
                                        {sub && <p className="text-[13px] text-muted-foreground mt-0.5">{sub}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Response time note */}
                        <div className="card-pro p-5 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <p className="text-[13px] text-muted-foreground">
                                {siteSettings.contactPage.responseTime}
                            </p>
                        </div>
                    </motion.div>

                    {/* Right: form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8, ease: EASE }}
                    >
                        <div className="card-pro p-8 rounded-[24px]">
                            {sent ? (
                                <div className="py-12 text-center space-y-4">
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                        <PaperPlaneTilt size={24} weight="fill" className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-[20px] font-bold text-foreground">{siteSettings.contactPage.formSuccessHeading}</h3>
                                    <p className="text-[14px] text-muted-foreground">{siteSettings.contactPage.formSuccessMessage}</p>
                                    <button
                                        onClick={() => setSent(false)}
                                        className="text-[13px] font-semibold text-accent hover:underline mt-2"
                                    >
                                        {siteSettings.contactPage.formSendAnother}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: siteSettings.contactPage.formLabels.name, name: "name", type: "text", placeholder: "Your name" },
                                            { label: siteSettings.contactPage.formLabels.email, name: "email", type: "email", placeholder: "your@email.com" },
                                        ].map(f => (
                                            <div key={f.name} className="space-y-1.5">
                                                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{f.label}</label>
                                                <input
                                                    required
                                                    type={f.type}
                                                    name={f.name}
                                                    value={formData[f.name as keyof typeof formData]}
                                                    onChange={e => setFormData(p => ({ ...p, [f.name]: e.target.value }))}
                                                    placeholder={f.placeholder}
                                                    className="input-apple py-3 text-[14px]"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{siteSettings.contactPage.formLabels.subject}</label>
                                        <input
                                            required
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                                            placeholder="What's this about?"
                                            className="input-apple py-3 text-[14px]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{siteSettings.contactPage.formLabels.message}</label>
                                        <textarea
                                            required
                                            name="message"
                                            value={formData.message}
                                            onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                                            placeholder="How can we help you?"
                                            rows={5}
                                            className="input-apple py-3 text-[14px] resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-apple btn-apple-primary w-full py-3.5 text-[14px] font-semibold mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting
                                            ? <CircleNotch size={18} className="animate-spin" weight="bold" />
                                            : <><PaperPlaneTilt size={16} weight="bold" /> Send Message</>
                                        }
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
