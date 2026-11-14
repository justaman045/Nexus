"use client";

import { useState } from "react";

interface ProductImageProps {
    src: string | Blob | undefined | null;
    alt: string;
    className?: string;
    fallbackClassName?: string;
    onError?: (error: string | null) => void;
}

/**
 * Robust image component that handles broken/empty image URLs gracefully.
 * Falls back to a letter placeholder when the image fails to load or is missing.
 * Logs errors to help diagnose why images aren't showing.
 */
export function ProductImage({
    src,
    alt,
    className = "w-full h-full object-cover",
    fallbackClassName = "flex items-center justify-center",
    onError,
}: ProductImageProps) {
    const [failed, setFailed] = useState(false);
    const srcStr = typeof src === "string" ? src : "";
    const hasSrc = Boolean(srcStr) && srcStr.trim() !== "";

    const handleError = () => {
        setFailed(true);
        if (onError) {
            onError(`Image failed to load: ${srcStr}`);
        }
        console.error(`[ProductImage] Failed to load image: "${srcStr}" for alt="${alt}"`);
    };

    if (!hasSrc || failed) {
        const initial = alt ? alt.trim().charAt(0).toUpperCase() : "?";
        if (!hasSrc) {
            console.warn(`[ProductImage] No image URL provided for product: "${alt}"`);
        }
        return (
            <div className={`flex items-center justify-center ${fallbackClassName}`}>
                <span className="text-5xl font-bold text-foreground/10">{initial}</span>
            </div>
        );
    }

    return (
        <img
            src={srcStr}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            onError={handleError}
        />
    );
}
