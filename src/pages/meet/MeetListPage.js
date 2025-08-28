import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import InfiniteGrid from "../../features/lists/InfiniteGrid";
import { usePageAI } from "@/voice/pageAI/usePageAI";
import { makeMeetPlugin } from "./meet.ai";
import PageAITips from "@/voice/pageAI/PageAITips";
export default function MeetListPage() { usePageAI("meet", makeMeetPlugin()); return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: ["      ", _jsx("h1", { className: "text-2xl font-bold mb-4", children: "\uBAA8\uC784" }), "      ", _jsx(PageAITips, {}), "      ", _jsx(InfiniteGrid, { collectionName: "meetings" }), "    "] })); }
