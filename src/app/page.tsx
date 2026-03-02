"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Code, Zap, Globe, Loader2 } from "lucide-react";
import { getHomepageContent, HomepageContent, defaultContent } from "@/lib/cms";
import { getProducts, Product } from "@/lib/products";

export default function Home() {
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Create a timeout promise that rejects after 4 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 4000)
        );

        // Race the fetch against the timeout
        const [cmsData, productsData] = await Promise.race([
          Promise.all([getHomepageContent(), getProducts()]),
          timeoutPromise
        ]) as [HomepageContent, Product[]];

        let newContent = cmsData || defaultContent;
        if (productsData) {
          const totalPurchases = productsData.reduce((acc, p) => acc + (p.purchases || 0), 0);
          newContent = {
            ...newContent,
            stats: newContent.stats.map(stat =>
              stat.label.toLowerCase() === "downloads" && totalPurchases > 1000
                ? { ...stat, value: totalPurchases.toLocaleString() + "+" }
                : stat
            )
          };
        }
        setContent(newContent);
        setProducts(productsData.slice(0, 3));
      } catch (error) {
        console.error("Data fetch failed or timed out, using defaults:", error);
        // Fallback is already set in state (defaultContent), just need to ensure products has something if possible
        // If getProducts failed, we might want to ensure we have empty array or mock data
        // For now, we just stop loading. defaultContent is already there.
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center max-w-5xl mx-auto space-y-8 pt-40 pb-32 relative z-10">
        <div className="hero-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-semibold text-blue-300 mb-8 backdrop-blur-md animate-float shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]">
            {content.hero.badge}
          </span>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight drop-shadow-2xl">
            {content.hero.headingLine1} <br />
            <span className="gradient-text drop-shadow-lg">
              {content.hero.headingLine2}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            {content.hero.subheading}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/products" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full overflow-hidden transition-all duration-300 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                Explore Products <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link href="/about" className="px-8 py-4 text-lg font-bold text-gray-300 border border-white/10 rounded-full hover:bg-white/5 transition-all duration-300 backdrop-blur-sm hover:border-white/20 hover:text-white">
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
            {content.stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-4"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 gradient-text">{stat.value}</div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-8 h-8 text-yellow-400" />,
              title: "Lightning Fast",
              desc: "Optimized for performance with modern tech stacks."
            },
            {
              icon: <Code className="w-8 h-8 text-blue-400" />,
              title: "Developer First",
              desc: "Built by developers, for developers. Clean APIs."
            },
            {
              icon: <Globe className="w-8 h-8 text-purple-400" />,
              title: "Global Scale",
              desc: "Architecture designed to scale with your needs."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl glass hover:bg-white/10 transition-colors duration-300 border border-white/5"
            >
              <div className="mb-4 p-3 bg-white/5 rounded-lg inline-block">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products Preview */}
      <section className="w-full max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Software</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Tools that power the next generation of creators and developers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden group flex flex-col"
            >
              <div className="h-56 bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-105 transition-transform duration-700 relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-mono text-sm">
                    {item.name} Preview
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold mb-3 text-white">{item.name}</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed flex-grow">
                  {item.description}
                </p>
                <Link href={`/products/${item.id}`} className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-2 transition-all hover:translate-x-2">
                  View Details <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/products" className="inline-block text-gray-400 hover:text-white transition-colors border-b border-gray-700 hover:border-white pb-1">
            View all products
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full max-h-[400px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Loved by Developers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl glass border border-white/10 relative"
              >
                <div className="text-4xl text-blue-500/20 absolute top-4 left-4">"</div>
                <p className="text-gray-300 mb-6 relative z-10">{t.quote}</p>
                <div>
                  <div className="font-bold text-white">{t.author}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {content.faq.map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-xl border border-white/10 group animate-accordion-down open:pb-4"
            >
              <summary className="flex items-center justify-between p-6 font-bold text-lg text-white cursor-pointer list-none select-none group-hover:text-blue-300 transition-colors">
                {faq.q}
                <span className="transform group-open:rotate-180 transition-transform duration-300">▼</span>
              </summary>
              <p className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                {faq.a}
              </p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full px-4 py-20">
        <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden glass border border-white/10 p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Upgrade Your Workflow?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of developers and creators who trust Nexus for their daily operations.
            </p>
            <Link href="/products" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform duration-300">
              Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
