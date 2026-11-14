"use client";

import { useMemo, useState } from "react";

interface ProductImageProps {
    src?: string | Blob | undefined | null;
    images?: string[];
    alt: string;
    className?: string;
    fallbackClassName?: string;
    onError?: (error: string | null) => void;
    isGallery?: boolean;
}

function letterPlaceholder(alt: string) {
    return alt ? alt.trim().charAt(0).toUpperCase() : "?";
}

/** Normalised gallery: cover image first, empty entries removed. */
function buildGallery(src: ProductImageProps["src"], images?: string[]): string[] {
    const list = (images ?? []).filter(
        (img): img is string => typeof img === "string" && img.trim() !== ""
    );
    if (typeof src === "string" && src.trim() !== "" && !list.includes(src)) {
        return [src, ...list];
    }
    return list;
}

function LetterFallback({ alt, fallbackClassName }: { alt: string; fallbackClassName: string }) {
    return (
        <div className={`flex items-center justify-center ${fallbackClassName}`}>
            <span className="text-5xl font-bold text-foreground/10">{letterPlaceholder(alt)}</span>
        </div>
    );
}

/** Non-gallery image with a single fallback state. */
function SingleImage({
    resolvedSrc,
    alt,
    className,
    fallbackClassName,
    onError,
}: {
    resolvedSrc: string;
    alt: string;
    className: string;
    fallbackClassName: string;
    onError?: (error: string | null) => void;
}) {
    const [failed, setFailed] = useState(false);

    if (!resolvedSrc || failed) {
        return <LetterFallback alt={alt} fallbackClassName={fallbackClassName} />;
    }

    return (
        <img
            src={resolvedSrc}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            onError={() => {
                setFailed(true);
                onError?.(`Image failed to load: ${resolvedSrc}`);
            }}
        />
    );
}

/**
 * Interactive gallery. Rendered with a `key` derived from the image list so
 * selection/failure state resets naturally when the product changes — no
 * setState-inside-effect required.
 */
function Gallery({
    gallery,
    alt,
    onError,
}: {
    gallery: string[];
    alt: string;
    onError?: (error: string | null) => void;
}) {
    const [selected, setSelected] = useState(0);
    const [failed, setFailed] = useState<Set<number>>(new Set());

    const markFailed = (index: number, value: string) => {
        setFailed((prev) => {
            if (prev.has(index)) return prev;
            const next = new Set(prev);
            next.add(index);
            return next;
        });
        onError?.(`Image failed to load: ${value}`);
    };

    const safeIndex = Math.min(selected, gallery.length - 1);
    const current = gallery[safeIndex] ?? "";
    const currentFailed = failed.has(safeIndex);

    return (
        <div className="flex flex-col gap-2">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary/30 border border-border">
                {current && !currentFailed ? (
                    <img
                        src={current}
                        alt={alt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={() => markFailed(safeIndex, current)}
                    />
                ) : (
                    <LetterFallback alt={alt} fallbackClassName="h-full" />
                )}
            </div>
            {gallery.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                    {gallery.map((img, idx) =>
                        failed.has(idx) ? null : (
                            <button
                                type="button"
                                key={`${img}-${idx}`}
                                onClick={() => setSelected(idx)}
                                aria-label={`View image ${idx + 1} of ${alt}`}
                                aria-pressed={idx === safeIndex}
                                className={`rounded-lg overflow-hidden border transition-all ${
                                    idx === safeIndex
                                        ? "border-indigo-400/70 ring-2 ring-indigo-500/20"
                                        : "border-border hover:opacity-80"
                                }`}
                            >
                                <img
                                    src={img}
                                    alt={`${alt} view ${idx + 1}`}
                                    className="w-full h-16 object-cover"
                                    loading="lazy"
                                    decoding="async"
                                    onError={() => markFailed(idx, img)}
                                />
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Robust image component that handles broken/empty image URLs gracefully.
 * Falls back to images[0] when src is empty, then to a letter placeholder.
 * In gallery mode the thumbnails are interactive and individual broken images
 * are dropped instead of breaking the whole gallery.
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
    const gallery = useMemo(() => buildGallery(src, images), [src, images]);
    const galleryKey = gallery.join("|");

    if (isGallery && gallery.length > 0) {
        return <Gallery key={galleryKey} gallery={gallery} alt={alt} onError={onError} />;
    }

    const resolvedSrc =
        typeof src === "string" && src.trim() !== "" ? src : images?.[0] ?? "";

    return (
        <SingleImage
            key={resolvedSrc}
            resolvedSrc={resolvedSrc}
            alt={alt}
            className={className}
            fallbackClassName={fallbackClassName}
            onError={onError}
        />
    );
}
