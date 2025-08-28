import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { backfillAllSellerId, backfillSellerId, backfillMarketSellerId } from '@/utils/backfillSellerId';
export default function BackfillPage() { const [loading, setLoading] = useState(false); const [result, setResult] = useState(null); const [error, setError] = useState(null); const handleBackfillAll = async () => { if (!confirm('?�체 sellerId 백필???�행?�시겠습?�까? ???�업?� ?�돌�????�습?�다.')) {
    return;
} setLoading(true); setError(null); setResult(null); try {
    const result = await backfillAllSellerId();
    setResult(result);
    console.log('백필 ?�료:', result);
}
catch (err) {
    setError(err.message || '백필 ?�행 �??�류가 발생?�습?�다.');
    console.error('백필 ?�류:', err);
}
finally {
    setLoading(false);
} }; const handleBackfillProducts = async () => { if (!confirm('products 컬렉??sellerId 백필???�행?�시겠습?�까?')) {
    return;
} setLoading(true); setError(null); setResult(null); try {
    const result = await backfillSellerId();
    setResult({ products: result });
    console.log('products 백필 ?�료:', result);
}
catch (err) {
    setError(err.message || '백필 ?�행 �??�류가 발생?�습?�다.');
    console.error('백필 ?�류:', err);
}
finally {
    setLoading(false);
} }; const handleBackfillMarket = async () => { if (!confirm('market 컬렉??sellerId 백필???�행?�시겠습?�까?')) {
    return;
} setLoading(true); setError(null); setResult(null); try {
    const result = await backfillMarketSellerId();
    setResult({ market: result });
    console.log('market 백필 ?�료:', result);
}
catch (err) {
    setError(err.message || '백필 ?�행 �??�류가 발생?�습?�다.');
    console.error('백필 ?�류:', err);
}
finally {
    setLoading(false);
} }; return (_jsxs("div", { className: "p-6 max-w-4xl mx-auto", children: ["      ", _jsx("h1", { className: "text-2xl font-bold mb-6", children: "SellerId \uBC31\uD544 ?\uFFFD\uD2F8\uB9AC\uD2F0" }), "            ", _jsxs("div", { className: "mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: ["        ", _jsx("h2", { className: "text-lg font-semibold text-yellow-800 mb-2", children: "?\uFFFD\uFE0F \uC8FC\uC758?\uFFFD\uD56D" }), "        ", _jsxs("ul", { className: "text-sm text-yellow-700 space-y-1", children: ["          ", _jsx("li", { children: "?????\uFFFD\uC5C5?\uFFFD \uAE30\uC874 \uBB38\uC11C\uFFFD??\uFFFD\uC815?\uFFFD\uFFFD?\uFFFD??\uFFFD\uB3CC\uFFFD????\uFFFD\uC2B5?\uFFFD\uB2E4" }), "          ", _jsxs("li", { children: ["??\uBC31\uD544 ?\uFFFD\uC5D0 Firestore \uBC31\uC5C5??\uAD8C\uC7A5?\uFFFD\uB2C8??/li>          ", _jsx("li", { children: "??\uAC1C\uBC1C/?\uFFFD\uC2A4???\uFFFD\uACBD?\uFFFD\uC11C \uBA3C\uFFFD? ?\uFFFD\uD589?\uFFFD\uBCF4?\uFFFD\uC694" }), "          ", _jsx("li", { children: "??\uACFC\uC18D \uBC29\uFFFD?\uFFFD??\uFFFD\uD574 \uBB38\uC11C??100ms \uC9C0?\uFFFD\uC774 ?\uFFFD\uC2B5?\uFFFD\uB2E4" }), "        "] })] }), "      "] }), "      ", _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: ["        ", _jsxs("button", { onClick: handleBackfillAll, disabled: loading, className: "p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: ["          ", loading ? '?�행 �?..' : '?�체 백필 ?�행', "        "] }), "                ", _jsxs("button", { onClick: handleBackfillProducts, disabled: loading, className: "p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed", children: ["          ", loading ? '?�행 �?..' : 'Products 컬렉?�만', "        "] }), "                ", _jsxs("button", { onClick: handleBackfillMarket, disabled: loading, className: "p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed", children: ["          ", loading ? '?�행 �?..' : 'Market 컬렉?�만', "        "] }), "      "] }), "      ", error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg", children: ["          ", _jsx("h3", { className: "text-lg font-semibold text-red-800 mb-2", children: "???\uFFFD\uB958 \uBC1C\uC0DD" }), "          ", _jsx("p", { className: "text-red-700", children: error }), "        "] })), "      ", result && (_jsxs("div", { className: "mb-6 p-4 bg-green-50 border border-green-200 rounded-lg", children: ["          ", _jsx("h3", { className: "text-lg font-semibold text-green-800 mb-2", children: "??\uBC31\uD544 ?\uFFFD\uB8CC" }), "          ", _jsxs("pre", { className: "text-sm text-green-700 bg-white p-3 rounded border overflow-auto", children: ["            ", JSON.stringify(result, null, 2), "          "] }), "        "] })), "      ", _jsxs("div", { className: "text-sm text-gray-600", children: ["        ", _jsx("h3", { className: "font-semibold mb-2", children: "\uBC31\uD544 ?\uFFFD???\uFFFD\uB4DC:" }), "        ", _jsxs("ul", { className: "space-y-1", children: ["          ", _jsx("li", { children: "??sellerId (?\uFFFD\uC120?\uFFFD\uC704 1)" }), "          ", _jsx("li", { children: "??seller.uid (?\uFFFD\uC120?\uFFFD\uC704 2)" }), "          ", _jsx("li", { children: "??ownerId (?\uFFFD\uC120?\uFFFD\uC704 3)" }), "          ", _jsx("li", { children: "??createdBy (?\uFFFD\uC120?\uFFFD\uC704 4)" }), "          ", _jsx("li", { children: "??uid (?\uFFFD\uC120?\uFFFD\uC704 5)" }), "        "] }), "      "] }), "    "] })); }
