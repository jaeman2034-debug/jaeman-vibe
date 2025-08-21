const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const sharp = require('sharp');

initializeApp();

exports.generateThumbs = onObjectFinalized({ bucket: process.env.STORAGE_BUCKET }, async (event) => {
  const file = event.data;
  const bucket = getStorage().bucket(file.bucket);
  const contentType = file.contentType || '';
  const name = file.name; // path
  
  if (!contentType.startsWith('image/')) return;
  
  // 기대 경로: products/{id}/original/filename.jpg
  const m = name.match(/^products\/([^/]+)\/original\/(.+)$/);
  if (!m) return;
  
  const [_, docId, filename] = m;

  try {
    // 원본 다운로드
    const [buf] = await bucket.file(name).download();

    // 파생 생성
    const large = await sharp(buf).resize(1280).jpeg({ quality: 85 }).toBuffer();
    const thumb = await sharp(buf).resize(480).jpeg({ quality: 80 }).toBuffer();

    // 업로드 경로
    const largePath = `products/${docId}/derived/large.jpg`;
    const thumbPath = `products/${docId}/derived/thumb.jpg`;

    await bucket.file(largePath).save(large, { 
      contentType: 'image/jpeg', 
      metadata: { cacheControl: 'public,max-age=31536000' }
    });
    
    await bucket.file(thumbPath).save(thumb, { 
      contentType: 'image/jpeg', 
      metadata: { cacheControl: 'public,max-age=31536000' }
    });

    // Firestore 갱신: 경로 저장(클라에서 getDownloadURL로 사용)
    const db = getFirestore();
    await db.collection('products').doc(docId).set({
      thumbnailPath: thumbPath,
      derived: { large: largePath, thumb: thumbPath }
    }, { merge: true });

    console.log(`Generated thumbnails for ${docId}`);
  } catch (error) {
    console.error(`Error generating thumbnails for ${docId}:`, error);
  }

  return;
});
