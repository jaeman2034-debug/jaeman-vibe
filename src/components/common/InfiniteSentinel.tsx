import { useEffect, useRef } from "react";

export default function InfiniteSentinel({
  onLoadMore,
  canLoad = true,
  rootMargin = "600px", // 바닥 600px ?�에 미리 로드
}: {
  onLoadMore: () => void;
  canLoad?: boolean;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canLoad || !ref.current) return;
    const el = ref.current;

    let ticking = false;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e.isIntersecting || ticking) return;
        ticking = true;
        Promise.resolve(onLoadMore()).finally(() => (ticking = false));
      },
      { root: null, rootMargin, threshold: 0 }
    );

    io.observe(el);
    return () => io.unobserve(el);
  }, [canLoad, onLoadMore, rootMargin]);

  return <div ref={ref} aria-hidden="true" />;
}
