const admin = require('firebase-admin');

// Initialize Firebase Admin (adjust path as needed)
const serviceAccount = require('../path-to-your-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function ensureCategoryIdField() {
  console.log('🔍 Ensuring categoryId field in collections...');
  
  const collections = ['clubs', 'products', 'jobs', 'facility_slots'];
  
  for (const collectionName of collections) {
    console.log(`\n📁 Processing ${collectionName} collection...`);
    
    try {
      const snapshot = await db.collection(collectionName).get();
      let updatedCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Check if categoryId is missing
        if (!data.categoryId) {
          console.log(`  ⚠️  Document ${doc.id} missing categoryId`);
          
          // Set a default categoryId based on existing category field or set to 'general'
          let categoryId = 'general';
          
          if (data.category) {
            // Map existing category values to categoryId
            const categoryMap = {
              'baseball': 'baseball',
              'football': 'football',
              'basketball': 'basketball',
              'tennis': 'tennis',
              'golf': 'golf',
              'running': 'running',
              'snow': 'snow',
              'outdoor': 'outdoor',
              '야구': 'baseball',
              '축구': 'football',
              '농구': 'basketball',
              '테니스': 'tennis',
              '골프': 'golf',
              '러닝': 'running',
              '스노우': 'snow',
              '아웃도어': 'outdoor'
            };
            
            categoryId = categoryMap[data.category] || 'general';
          }
          
          // Update the document
          await doc.ref.update({
            categoryId: categoryId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          updatedCount++;
          console.log(`  ✅ Updated ${doc.id} with categoryId: ${categoryId}`);
        }
      }
      
      console.log(`  📊 ${collectionName}: ${updatedCount} documents updated`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${collectionName}:`, error);
    }
  }
  
  console.log('\n🎉 Category ID field check completed!');
}

// Run the migration
ensureCategoryIdField()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
