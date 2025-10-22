export function assertLocalDevSafety() {
  const isDev = import.meta.env.MODE !== "production";
  const usingEmu =
    import.meta.env.VITE_USE_EMULATORS === "true" ||
    !!(import.meta as any).env?.VITE_EMU_FS_PORT;

  if (isDev && !usingEmu) {
    throw new Error("[SAFEGUARD] ê°œë°œ ëª¨ë“œ?¸ë° ?ë??ˆì´???°ê²°??êº¼ì ¸?ˆìŠµ?ˆë‹¤.");
  }
}
