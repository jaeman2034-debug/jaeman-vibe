export function assertLocalDevSafety() {
  const isDev = import.meta.env.MODE !== "production";
  const usingEmu =
    import.meta.env.VITE_USE_EMULATORS === "true" ||
    !!(import.meta as any).env?.VITE_EMU_FS_PORT;

  if (isDev && !usingEmu) {
    throw new Error("[SAFEGUARD] 개발 모드?�데 ?��??�이???�결??꺼져?�습?�다.");
  }
}
