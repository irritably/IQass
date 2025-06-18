/**
 * Custom Hook for Lazy Loading Image Thumbnails
 * 
 * This hook uses the Intersection Observer API to efficiently manage
 * the loading and unloading of image thumbnails based on viewport visibility.
 * This dramatically reduces memory usage when handling large image batches.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CONFIG } from '../config';

interface UseLazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  unloadOnExit?: boolean;
}

interface LazyLoadingState {
  isVisible: boolean;
  hasBeenVisible: boolean;
}

/**
 * Hook for implementing lazy loading with Intersection Observer
 * @param options - Configuration options for the intersection observer
 * @returns Object containing ref, visibility state, and loading state
 */
export const useLazyLoading = (options: UseLazyLoadingOptions = {}) => {
  const {
    rootMargin = CONFIG.LAZY_LOADING.ROOT_MARGIN,
    threshold = CONFIG.LAZY_LOADING.THRESHOLD,
    unloadOnExit = CONFIG.LAZY_LOADING.UNLOAD_ON_EXIT
  } = options;

  const [state, setState] = useState<LazyLoadingState>({
    isVisible: false,
    hasBeenVisible: false
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    setState(prevState => {
      const isVisible = entry.isIntersecting;
      const hasBeenVisible = prevState.hasBeenVisible || isVisible;
      
      return {
        isVisible,
        hasBeenVisible: unloadOnExit ? isVisible : hasBeenVisible
      };
    });
  }, [unloadOnExit]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold
    });

    // Start observing
    observerRef.current.observe(element);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  return {
    ref: elementRef,
    isVisible: state.isVisible,
    hasBeenVisible: state.hasBeenVisible,
    shouldLoad: state.hasBeenVisible
  };
};

/**
 * Hook for managing lazy loading of multiple items in a virtualized list
 * @param itemCount - Total number of items
 * @param options - Lazy loading options
 * @returns Object with visibility tracking utilities
 */
export const useVirtualizedLazyLoading = (
  itemCount: number,
  options: UseLazyLoadingOptions = {}
) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const [loadedItems, setLoadedItems] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const {
    rootMargin = CONFIG.LAZY_LOADING.ROOT_MARGIN,
    threshold = CONFIG.LAZY_LOADING.THRESHOLD,
    unloadOnExit = true
  } = options;

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const itemIndex = parseInt(entry.target.getAttribute('data-index') || '0', 10);
      
      if (entry.isIntersecting) {
        setVisibleItems(prev => new Set(prev).add(itemIndex));
        setLoadedItems(prev => new Set(prev).add(itemIndex));
      } else {
        setVisibleItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemIndex);
          return newSet;
        });
        
        if (unloadOnExit) {
          setLoadedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemIndex);
            return newSet;
          });
        }
      }
    });
  }, [unloadOnExit]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  const registerItem = useCallback((index: number, element: HTMLElement | null) => {
    if (!element || !observerRef.current) return;

    // Unobserve previous element if it exists
    const previousElement = itemRefs.current.get(index);
    if (previousElement) {
      observerRef.current.unobserve(previousElement);
    }

    // Set data attribute for identification
    element.setAttribute('data-index', index.toString());
    
    // Store reference and observe
    itemRefs.current.set(index, element);
    observerRef.current.observe(element);
  }, []);

  const unregisterItem = useCallback((index: number) => {
    const element = itemRefs.current.get(index);
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
      itemRefs.current.delete(index);
    }
  }, []);

  const isItemVisible = useCallback((index: number) => {
    return visibleItems.has(index);
  }, [visibleItems]);

  const shouldLoadItem = useCallback((index: number) => {
    return loadedItems.has(index);
  }, [loadedItems]);

  return {
    registerItem,
    unregisterItem,
    isItemVisible,
    shouldLoadItem,
    visibleItems,
    loadedItems
  };
};

/**
 * Hook for preloading images with lazy loading
 * @param src - Image source URL
 * @param shouldLoad - Whether the image should be loaded
 * @returns Loading state and error information
 */
export const useLazyImage = (src: string, shouldLoad: boolean) => {
  const [imageState, setImageState] = useState<{
    loaded: boolean;
    loading: boolean;
    error: boolean;
    imageSrc?: string;
  }>({
    loaded: false,
    loading: false,
    error: false
  });

  useEffect(() => {
    if (!shouldLoad || !src) {
      setImageState({
        loaded: false,
        loading: false,
        error: false
      });
      return;
    }

    setImageState(prev => ({ ...prev, loading: true, error: false }));

    const img = new Image();
    
    img.onload = () => {
      setImageState({
        loaded: true,
        loading: false,
        error: false,
        imageSrc: src
      });
    };

    img.onerror = () => {
      setImageState({
        loaded: false,
        loading: false,
        error: true
      });
    };

    img.src = src;

    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, shouldLoad]);

  return imageState;
};