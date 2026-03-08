// Optimized Image component with lazy loading and placeholder
import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  containerClassName?: string;
  lazy?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  className,
  containerClassName,
  lazy = true,
  placeholder = 'skeleton',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', containerClassName)}>
      {/* Placeholder */}
      {placeholder !== 'none' && !isLoaded && isInView && (
        <div
          className={cn(
            'absolute inset-0',
            placeholder === 'skeleton' && 'bg-muted animate-pulse',
            placeholder === 'blur' && 'bg-muted/50 backdrop-blur-sm'
          )}
        />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={hasError ? fallback : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={lazy ? 'lazy' : undefined}
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
});

export default OptimizedImage;
