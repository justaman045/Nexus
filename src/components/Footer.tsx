import Link from "next/link";
import { useEffect, useState } from "react";
import { getHomepageContent, HomepageContent, defaultContent } from "@/lib/cms";
import { getProducts, Product } from "@/lib/products";

export default function Footer() {
    const [content, setContent] = useState<HomepageContent["footer"]>(defaultContent.footer);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        async function loadContent() {
            const data = await getHomepageContent();
            if (data?.footer) {
                setContent(data.footer);
            }

            const productsData = await getProducts();
            setProducts(productsData.slice(0, 3)); // Get top 3 products
        }
        loadContent();
    }, []);

    return (
        <footer className="glass border-t border-white/10 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Nexus
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {content.description}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Products</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            {products.length > 0 ? (
                                products.map(product => (
                                    <li key={product.id}>
                                        <Link href={`/products/${product.id}`} className="hover:text-white transition-colors">
                                            {product.name}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li><span className="text-gray-600">Loading...</span></li>
                            )}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Connect</h4>
                        <div className="flex space-x-4">
                            <a href={content.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                Twitter
                            </a>
                            <a href={content.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                GitHub
                            </a>
                            <a href={content.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                LinkedIn
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Nexus Company. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

