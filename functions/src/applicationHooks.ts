import "./_admin";
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

export const onApplicationCreated = functions.firestore
  .document('applications/{appId}')
  .onCreate(async (snap, ctx) => {
    const data = snap.data();
    const hook = process.env.N8N_WEBHOOK_APPLICATION_CREATED || '';
    
    if (!hook) return;
    
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appId: ctx.params.appId, 
          jobId: data.jobId,
          ownerUid: data.ownerUid,
          title: data.title,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt,
          ...data 
        }),
      });
    } catch (e) {
      console.error('n8n fanout failed', e);
    }
  });
