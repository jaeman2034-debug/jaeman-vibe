"use strict";
import * as admin from 'firebase-admin';
// Firebase 초기화
admin.initializeApp();
const db = admin.firestore();
(async () => {
    console.log('🚩 Seeding feature flags...');
    try {
        await db.doc('config/runtime').set({
            payments_enabled: false,
            pilot_mode: true,
            moderation_required: true,
            search_v2: false,
            voice_signup_v2: false,
            market_listings: true,
            club_events: true,
            job_postings: true,
            facility_bookings: true,
            fcm_notifications: true,
            image_processing: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system'
        }, { merge: true });
        console.log('✅ Feature flags seeded successfully!');
        console.log('📋 Flags set:');
        console.log('  - payments_enabled: false');
        console.log('  - pilot_mode: true');
        console.log('  - moderation_required: true');
        console.log('  - search_v2: false');
        console.log('  - voice_signup_v2: false');
        console.log('  - market_listings: true');
        console.log('  - club_events: true');
        console.log('  - job_postings: true');
        console.log('  - facility_bookings: true');
        console.log('  - fcm_notifications: true');
        console.log('  - image_processing: true');
    }
    catch (error) {
        console.error('❌ Feature flags seeding failed:', error);
        throw error;
    }
})()
    .then(() => {
    console.log('🎉 Feature flags seeding completed!');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Feature flags seeding failed:', error);
    process.exit(1);
});
