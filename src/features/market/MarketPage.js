import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import "./Market.css";
import FIREBASE from "@/lib/firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
// === 자동 주입될 마켓 CSS (외부 CSS가 안 실릴 때 대비) ===
const MARKET_CSS = String.raw `
:root{
  --bg:#f7f8fa; --surface:#fff; --text:#111827; --border:#e5e7eb;
  --shadow:0 10px 30px rgba(16,24,40,.08);
}
.market-wrap{ min-height:100dvh; background:var(--bg); padding:24px; }
.market-head{ display:flex; align-items:center; gap:12px; margin:0 auto 16px; max-width:1200px; }
.market-head h1{ font-size:22px; font-weight:800; margin:0; color:var(--text); }
.btn{ height:34px; padding:0 12px; border-radius:10px; border:1px solid var(--border); background:#fff; cursor:pointer; }
.market-grid{
  max-width:1200px; margin:0 auto;
  display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:16px;
}
.product-card{
  background:#fff; border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow);
  overflow:hidden; transition:transform .12s ease, box-shadow .12s ease; cursor:pointer;
}
.product-card:hover{ transform:translateY(-2px); box-shadow:0 14px 38px rgba(16,24,40,.12); }
.thumb{ width:100%; padding-top:66%; background:#f3f4f6 center/cover no-repeat; position:relative; }
.thumb.empty{ background:#f8fafc; border-bottom:1px dashed var(--border); }
.thumb .placeholder{ position:absolute; inset:0; display:grid; place-items:center; color:#9aa0a6; font-size:13px; }
.meta{ padding:12px 14px 16px; }
.title{ font-size:15px; font-weight:700; color:#111827; margin:0 0 6px; line-height:1.3; }
.price{ font-size:14px; color:#0f172a; }
.skeleton .thumb{ animation: sk 1.2s linear infinite alternate; }
.skeleton .sk-title,.skeleton .sk-price{ height:12px; background:#eceff3; border-radius:6px; animation: sk 1.2s linear infinite alternate; margin-top:10px; }
.skeleton .sk-title{ width:70%; } .skeleton .sk-price{ width:40%; }
@keyframes sk{ from{opacity:.6} to{opacity:1} }
`;
// 최초 1회만 <head>에 스타일 주입
function useInjectMarketCss() {
    useEffect(() => {
        const id = "market-inline-css";
        if (!document.getElementById(id)) {
            const s = document.createElement("style");
            s.id = id;
            s.textContent = MARKET_CSS;
            document.head.appendChild(s);
        }
    }, []);
}
const formatKRW = (n) => typeof n === "number"
    ? new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n)
    : "가격 미정";
export default function MarketPage() {
    useInjectMarketCss(); // ← CSS 강제 주입
    const { db } = FIREBASE;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(60));
                const snap = await getDocs(q);
                const rows = [];
                snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
                setItems(rows);
            }
            finally {
                setLoading(false);
            }
        })();
    }, [db]);
    return (_jsxs("div", { className: "market-wrap", children: [_jsxs("header", { className: "market-head", children: [_jsx("h1", { children: "\uC2A4\uD3EC\uCE20 \uB9C8\uCF13" }), _jsx("button", { className: "btn back", onClick: () => (location.hash = "/start"), children: "\u2190 \uC2DC\uC791\uC73C\uB85C" })] }), loading ? (_jsx("div", { className: "market-grid", children: Array.from({ length: 8 }).map((_, i) => (_jsxs("div", { className: "product-card skeleton", children: [_jsx("div", { className: "thumb" }), _jsxs("div", { className: "meta", children: [_jsx("div", { className: "sk-title" }), _jsx("div", { className: "sk-price" })] })] }, i))) })) : (_jsx("section", { className: "market-grid", children: items.map((p) => (_jsxs("article", { className: "product-card", onClick: () => alert(`상세 미리보기: ${p.title}`), children: [_jsx("div", { className: "thumb" + (!p.cover ? " empty" : ""), style: p.cover ? { backgroundImage: `url(${p.cover})` } : undefined, children: !p.cover && _jsx("span", { className: "placeholder", children: "\uC774\uBBF8\uC9C0 \uC5C6\uC74C" }) }), _jsxs("div", { className: "meta", children: [_jsx("h3", { className: "title", children: p.title || "제목 없음" }), _jsx("div", { className: "price", children: formatKRW(p.price) })] })] }, p.id))) }))] }));
}
