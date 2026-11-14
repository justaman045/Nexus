"use client";

import { useState } from "react";

interface ProductImageProps {
    src: string | Blob | undefined | null;
    alt: string;
    className?: string;
    fallbackClassName?: string;
}

/**
 * Robust image component that handles broken/empty image URLs gracefully.
 * Falls back to a letter placeholder when the image fails to load or is missing.
 */
export function ProductImage({
    src,
    alt,
    className = "w-full h-full object-cover",
    fallbackClassName = "flex items-center justify-center",
}: ProductImageProps) {
    const [failed, setFailed] = useState(false);
    const srcStr = typeof src === "string" ? src : "";
    const hasSrc = Boolean(srcStr) && srcStr.trim() !== "";

    if (!hasSrc || failed) {
        const initial = alt ? alt.trim().charAt(0).toUpperCase() : "?";
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
            onError={() => setFailed(true)}
        />
    );
}
