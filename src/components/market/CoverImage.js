import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { FALLBACK_IMG, toRenderableUrl } from '@/lib/image';
export default function CoverImage({ raw, alt = '', className }) { const [src, setSrc] = useState(FALLBACK_IMG); const [errored, setErrored] = useState(false); useEffect(() => { let mounted = true; (async () => { const url = await toRenderableUrl(raw); if (mounted)
    setSrc(url); })(); return () => { mounted = false; }; }, [raw]); return (_jsx("img", { src: src, alt: alt, className: className, onError: () => { if (!errored) {
        setErrored(true);
        setSrc(FALLBACK_IMG);
    } }, loading: "lazy", decoding: "async" })); }
