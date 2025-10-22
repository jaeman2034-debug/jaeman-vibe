// scripts/resetFirestore.js
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function reset() {
  console.log('🔥 Resetting Firestore "posts" collection...');

  const postsRef = db.collection('posts');
  const snapshot = await postsRef.get();

  let batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  console.log('✅ All posts deleted.');
  process.exit(0);
}

reset().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
