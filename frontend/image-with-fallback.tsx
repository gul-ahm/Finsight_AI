"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
    fallbackSrc?: string;
}

export function ImageWithFallback({
    src,
    alt,
    fallbackSrc = "/placeholder-news.jpg", // You might need to ensure this asset exists or use a robust external placeholder
    className,
    ...props
}: ImageWithFallbackProps) {
    const [error, setError] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
        setError(false);
    }, [src]);

    if (error || !imgSrc) {
        return (
            <div className={`flex items-center justify-center bg-muted ${className}`}>
                <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
        );
    }

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            className={className}
            onError={() => setError(true)}
            unoptimized // Optional: skips Next.js optimization for unknown domains to prevent 500 errors
        />
    );
}

