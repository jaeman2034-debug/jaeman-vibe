import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { createProduct } from "@/services/productService";
export default function ProductCreateForm() { const [title, setTitle] = useState(""); const [price, setPrice] = useState(""); const [files, setFiles] = useState([]); async function onSubmit(e) { e.preventDefault(); console.log("[PRODUCT] submit start"); try {
    const res = await createProduct({ title, price: Number(price), files, });
    alert(`?�록 ?�료: ${res.id}`);
}
catch (e) {
    console.error("[PRODUCT] create failed:", e);
    alert(`?�록 ?�패: ${e?.code || e?.message}`);
} } return (_jsxs("form", { onSubmit: onSubmit, children: ["      ", _jsx("input", { value: title, onChange: e => setTitle(e.target.value), placeholder: "?\uFFFD\uBAA9", required: true }), "      ", _jsx("input", { type: "number", value: price, onChange: e => setPrice(e.target.value === "" ? "" : Number(e.target.value)), placeholder: "\uAC00\uFFFD? required />      <input type=", file: true }), "\" multiple onChange=", e => setFiles(Array.from(e.target.files || [])), " />      ", _jsx("button", { type: "submit", children: "?\uFFFD\uB85D" }), "    "] })); }
