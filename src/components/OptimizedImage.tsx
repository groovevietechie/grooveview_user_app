"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { createIntersectionObserver, getOptimizedImageUrl } from "@/lib/performance-utils"
import { isValidImageUrl } from "@/lib/image-utils"

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  quality?: number
  className?: string
  fallback?: React.ReactNode
  priority?: boolean
  sizes?: string
  fill?: boolean
  onLoad?: () => void
  onError?: () => void
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  className = "",
  fallback,
  priority = false,
  sizes,
  fill = false,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Load immediately if priority
  const imgRef = useRef<HTMLDivElement>(null)

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' } // Start loading 100px before image comes into view
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Don't render anything if src is invalid
  if (!src || !isValidImageUrl(src)) {
    return <div className={className}>{fallback}</div>
  }

  const optimizedSrc = getOptimizedImageUrl(src, width, height, quality)

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isInView && (
        <>
          {/* Loading placeholder */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
          )}

          {/* Actual image */}
          {!hasError && (
            <Image
              src={optimizedSrc}
              alt={alt}
              width={fill ? undefined : width}
              height={fill ? undefined : height}
              fill={fill}
              sizes={sizes}
              quality={quality}
              priority={priority}
              className={`transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              } ${fill ? 'object-cover' : ''}`}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {/* Error fallback */}
          {hasError && fallback && (
            <div className="absolute inset-0 flex items-center justify-center">
              {fallback}
            </div>
          )}
        </>
      )}

      {/* Lazy loading placeholder */}
      {!isInView && !priority && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
      )}
    </div>
  )
}

// Specialized components for common use cases
interface MenuImageProps extends Omit<OptimizedImageProps, 'width' | 'height' | 'fill'> {
  size?: 'small' | 'medium' | 'large'
}

export function MenuImage({ size = 'medium', ...props }: MenuImageProps) {
  const dimensions = {
    small: { width: 200, height: 150 },
    medium: { width: 400, height: 300 },
    large: { width: 600, height: 400 }
  }

  return (
    <OptimizedImage
      {...props}
      width={dimensions[size].width}
      height={dimensions[size].height}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

export function CategoryImage({ size = 'medium', ...props }: MenuImageProps) {
  const dimensions = {
    small: { width: 150, height: 100 },
    medium: { width: 300, height: 200 },
    large: { width: 450, height: 300 }
  }

  return (
    <OptimizedImage
      {...props}
      width={dimensions[size].width}
      height={dimensions[size].height}
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
    />
  )
}

export function ItemImage({ size = 'medium', ...props }: MenuImageProps) {
  const dimensions = {
    small: { width: 150, height: 150 },
    medium: { width: 250, height: 200 },
    large: { width: 350, height: 280 }
  }

  return (
    <OptimizedImage
      {...props}
      width={dimensions[size].width}
      height={dimensions[size].height}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}