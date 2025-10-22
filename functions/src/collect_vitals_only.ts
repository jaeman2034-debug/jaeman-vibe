import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const collectVitals = functions
  .region("asia-northeast3")
  .https.onRequest((req, res) => {
    // CORS 헤더 설정 - 더 안전하게
    const origin = req.headers.origin || 'http://127.0.0.1:5179';
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
  
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  const { name, value, id, url, ua, uid } = req.body;
  
  db.collection('metrics/webvitals').add({
    name, 
    value, 
    id, 
    url, 
    ua,
    uid: uid || null,
    at: admin.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    res.status(200).json({ ok: true });
  }).catch((error) => {
    console.error('Error collecting vitals:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  });
});
