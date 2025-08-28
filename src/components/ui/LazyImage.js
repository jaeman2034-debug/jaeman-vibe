import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
export default function LazyImage({ src, alt, className = '', placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==', fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZlYmFiYiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2Y5NzM3NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==', webpSrc, avifSrc }) { const [isLoaded, setIsLoaded] = useState(false); const [hasError, setHasError] = useState(false); const [isInView, setIsInView] = useState(false); const imgRef = useRef(null); const observerRef = useRef(null); useEffect(() => { if (!imgRef.current)
    return; observerRef.current = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) {
    setIsInView(true);
    observerRef.current?.disconnect();
} }); }, { threshold: 0.1 }); observerRef.current.observe(imgRef.current); return () => { if (observerRef.current) {
    observerRef.current.disconnect();
} }; }, []); const handleLoad = () => { setIsLoaded(true); }; const handleError = () => { setHasError(true); }; const getImageSrc = () => { if (hasError)
    return fallback; if (!isInView)
    return placeholder; return src; }; const getPictureSources = () => { if (!isInView)
    return null; return (_jsxs(_Fragment, { children: ["        ", avifSrc && _jsx("source", { srcSet: avifSrc, type: "image/avif" }), "        ", webpSrc && _jsx("source", { srcSet: webpSrc, type: "image/webp" }), "      "] })); }; return (_jsxs("picture", { className: className, children: ["      ", getPictureSources(), "      ", _jsx("img", { ref: imgRef, src: getImageSrc(), alt: alt, className: `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`, onLoad: handleLoad, onError: handleError, loading: "lazy" }), "    "] })); }
