export const FLAGS = {
  CHAT: String(import.meta.env.VITE_ENABLE_CHAT).toLowerCase() === "true",
}; 