export function envLog() {
  console.log('[env]', {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').slice(0, 5),
    hasAll: [
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ].every(k => !!(import.meta.env as any)[k]),
  })
}
