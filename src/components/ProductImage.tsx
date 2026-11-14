"use client";

import { useState } from "react";

interface ProductImageProps {
    src?: string | Blob | undefined | null;
    images?: string[];
    alt: string;
    className?: string;
    fallbackClassName?: string;
    onError?: (error: string | null) => void;
    isGallery?: boolean;
}

/**
 * Robust image component that handles broken/empty image URLs gracefully.
 * Falls back to images[0] when src is empty, then to a letter placeholder.
 * Supports gallery mode to show multiple images.
 */
export function ProductImage({
    src,
    images,
    alt,
    className = "w-full h-full object-cover",
    fallbackClassName = "flex items-center justify-center",
    onError,
    isGallery = false,
}: ProductImageProps) {
    const [failed, setFailed] = useState(false);

    // Determine the best source: src prop first, then images[0], then empty
    const resolvedSrc =
        typeof src === "string" && src.trim() !== ""
            ? src
            : images?.[0] ?? "";

    const srcStr = resolvedSrc;
    const hasSrc = Boolean(srcStr) && srcStr.trim() !== "";

    const handleError = () => {
        setFailed(true);
        if (onError) {
            onError(`Image failed to load: ${srcStr}`);
        }
        console.error(`[ProductImage] Failed to load image: "${srcStr}" for alt="${alt}"`);
    };

    // Gallery mode: show all images
    if (isGallery && images && images.length > 0) {
        return (
            <div className="flex flex-col gap-2">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary/30 border border-border">
                    <img
                        src={srcStr || images[0]}
                        alt={alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={handleError}
                    />
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`${alt} ${idx + 1}`}
                            className="w-full h-16 object-cover cursor-pointer hover:opacity-80 transition-opacity border border-border"
                            onClick={() => {
                                // Could add modal here
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

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
