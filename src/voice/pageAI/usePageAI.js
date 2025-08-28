import { useEffect } from "react";
import { setActivePlugin, clearActivePlugin } from "./registry";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/components/ModalHost";
export function usePageAI(pageId, makePlugin) { const navigate = useNavigate(); const { open } = useModal(); useEffect(() => { const ctx = { pageId, navigate, openModal: open }; const plugin = makePlugin(ctx); setActivePlugin(plugin, ctx); return () => clearActivePlugin(); }, [pageId, navigate, open, makePlugin]); }
