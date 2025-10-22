import admin from 'firebase-admin';
import { setBucketCaps } from './utils/capacity-redis.mjs';

export async function getMeetupBuckets(meetupId) {
  const snap = await admin.firestore().doc(`meetups/${meetupId}`).get();
  const buckets = snap?.data()?.meta?.buckets || [{ key: 'default', label: '일반', capacity: Infinity }];
  return buckets;
}

export async function setMeetupBuckets(meetupId, buckets) {
  await admin.firestore().doc(`meetups/${meetupId}`).set({ meta: { buckets } }, { merge: true });
  const caps = Object.fromEntries(buckets.map(b => [b.key, b.capacity ?? Infinity]));
  await setBucketCaps(meetupId, caps);
  return buckets;
}
