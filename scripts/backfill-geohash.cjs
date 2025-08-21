require('dotenv').config();
const admin = require('firebase-admin');
const { geohashForLocation } = require('geofire-common');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
const db = admin.firestore();

(async () => {
  const snap = await db.collection('products').get();
  let done = 0, updated = 0;
  for (const doc of snap.docs) {
    done++;
    const d = doc.data();
    const gp = d.location;
    if (!d.geohash && gp && typeof gp.latitude === 'number') {
      const gh = geohashForLocation([gp.latitude, gp.longitude]);
      await doc.ref.update({ geohash: gh });
      updated++;
    }
  }
  console.log(`Backfill complete. scanned=${done}, updated=${updated}`);
  process.exit(0);
})().catch(e=>{ console.error(e); process.exit(1); });
