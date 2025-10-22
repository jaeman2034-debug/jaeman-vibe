import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();

function dayKey(ts: FirebaseFirestore.Timestamp | admin.firestore.FieldValue | Date = new Date()) {
  const d = ts instanceof Date ? ts : ts instanceof admin.firestore.Timestamp ? ts.toDate() : new Date();
  const y = d.getFullYear(); 
  const m = String(d.getMonth()+1).padStart(2,'0'); 
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}${m}${dd}`;
}

async function inc(path: string, field: string, by = 1) {
  const ref = db.doc(path);
  await ref.set({ 
    [field]: admin.firestore.FieldValue.increment(by), 
    updatedAt: admin.firestore.FieldValue.serverTimestamp() 
  }, { merge: true });
}

export const onMarketCreated = functions.firestore.document('market/{id}').onCreate(async (snap)=>{
  await inc(`metrics/daily_${dayKey()}`, 'market_created', 1);
});

export const onMeetupCreated = functions.firestore.document('meetups/{id}').onCreate(async ()=>{
  await inc(`metrics/daily_${dayKey()}`, 'meetup_created', 1);
});

export const onApplicationCreated = functions.firestore.document('applications/{id}').onCreate(async ()=>{
  await inc(`metrics/daily_${dayKey()}`, 'job_app_created', 1);
});