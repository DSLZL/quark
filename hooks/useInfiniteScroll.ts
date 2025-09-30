import { useEffect, useRef } from 'react';

interface Options {
  enabled: boolean;
  onIntersect: () => void;
  rootMargin?: string;
}

export function useInfiniteScroll({ enabled, onIntersect, rootMargin = '200px' }: Options) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onIntersect();
    }, { rootMargin });
    observer.observe(node);
    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, [enabled, onIntersect, rootMargin]);

  return ref;
}

