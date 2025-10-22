// src/diag/envGuard.ts
export function assertEnv() {
  const need = [
    "VITE_USE_EMU",
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN", 
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID"
  ];
  
  const miss = need.filter(k => !import.meta.env[k]);
  
  if (miss.length > 0) {
    const errorMsg = `??Missing required environment variables: ${miss.join(", ")}\n\n` +
      `Please copy env.example to .env.local and fill in the values.\n` +
      `Required variables: ${need.join(", ")}`;
    
    console.error(errorMsg);
    throw new Error(`Missing env: ${miss.join(", ")}`);
  }
  
  console.log("??Environment variables validated successfully");
}

// ê°œë°œ ?˜ê²½?ì„œë§??¤í–‰ (?ë??ˆì´???¬ìš© ?œì—ë§?
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMU === 'true') {
  assertEnv();
}
