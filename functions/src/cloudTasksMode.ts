// Cloud Tasks 모드: 고신뢰 큐 전환을 위한 스텁
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Cloud Tasks 설정
const CLOUD_TASKS_ENABLED = process.env.CLOUD_TASKS_ENABLED === 'true';
const CLOUD_TASKS_QUEUE_NAME = process.env.CLOUD_TASKS_QUEUE_NAME || 'slack-approval-queue';
const CLOUD_TASKS_LOCATION = process.env.CLOUD_TASKS_LOCATION || 'asia-northeast3';

// Cloud Tasks 클라이언트 초기화
let cloudTasksClient: any = null;
if (CLOUD_TASKS_ENABLED) {
  try {
    const { CloudTasksClient } = require('@google-cloud/tasks');
    cloudTasksClient = new CloudTasksClient();
  } catch (error) {
    console.error('Cloud Tasks client initialization failed:', error);
  }
}

// 큐 작업 타입 정의
interface QueueJob {
  type: 'webhook_retry' | 'slack_update' | 'approval_expiry' | 'metrics_update';
  payload: any;
  attempts?: number;
  maxAttempts?: number;
  delaySeconds?: number;
}

// Cloud Tasks로 작업 큐잉
export async function enqueueCloudTask(job: QueueJob): Promise<void> {
  if (!CLOUD_TASKS_ENABLED || !cloudTasksClient) {
    // Cloud Tasks 비활성화 시 Firestore 큐 사용
    return enqueueFirestoreQueue(job);
  }

  try {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const queuePath = cloudTasksClient.queuePath(projectId, CLOUD_TASKS_LOCATION, CLOUD_TASKS_QUEUE_NAME);
    
    const task = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: `https://${CLOUD_TASKS_LOCATION}-${projectId}.cloudfunctions.net/cloudTasksWorker`,
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': process.env.INTERNAL_KEY || '',
        },
        body: Buffer.from(JSON.stringify(job)).toString('base64'),
      },
      scheduleTime: {
        seconds: Math.floor(Date.now() / 1000) + (job.delaySeconds || 0),
      },
    };

    await cloudTasksClient.createTask({ parent: queuePath, task });
    console.log('Cloud Task enqueued:', job.type);
  } catch (error) {
    console.error('Cloud Task enqueue failed:', error);
    // 실패 시 Firestore 큐로 폴백
    return enqueueFirestoreQueue(job);
  }
}

// Firestore 큐 사용 (기존 방식)
async function enqueueFirestoreQueue(job: QueueJob): Promise<void> {
  const db = admin.firestore();
  const collectionName = job.type === 'webhook_retry' ? 'webhook_retry' : 
                        job.type === 'slack_update' ? 'slack_update' : 
                        job.type === 'approval_expiry' ? 'approval_expiry' : 'metrics_update';
  
  await db.collection(collectionName).add({
    status: 'pending',
    attempts: job.attempts || 0,
    maxAttempts: job.maxAttempts || 6,
    nextAttemptAt: admin.firestore.Timestamp.fromMillis(
      Date.now() + (job.delaySeconds || 0) * 1000
    ),
    payload: job.payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    // TTL 설정
    ttlAt: admin.firestore.Timestamp.fromMillis(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7일
    )
  });
}

// Cloud Tasks 워커 함수
export const cloudTasksWorker = functions
  .region(CLOUD_TASKS_LOCATION)
  .https.onRequest(async (req, res) => {
    try {
      const job: QueueJob = JSON.parse(req.body);
      
      switch (job.type) {
        case 'webhook_retry':
          await processWebhookRetry(job.payload);
          break;
        case 'slack_update':
          await processSlackUpdate(job.payload);
          break;
        case 'approval_expiry':
          await processApprovalExpiry(job.payload);
          break;
        case 'metrics_update':
          await processMetricsUpdate(job.payload);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Cloud Tasks worker error:', error);
      res.status(500).json({ error: String(error) });
    }
  });

// 웹훅 재시도 처리
async function processWebhookRetry(payload: any): Promise<void> {
  const { url1, url2, body, attempts = 0, maxAttempts = 6 } = payload;
  
  try {
    const response = await fetch(url1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      console.log('Webhook retry successful');
      return;
    }
    
    // 1차 실패 시 2차 시도
    if (url2) {
      const response2 = await fetch(url2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response2.ok) {
        console.log('Webhook retry successful (fallback)');
        return;
      }
    }
    
    // 모든 시도 실패 시 재큐잉
    if (attempts < maxAttempts) {
      const delaySeconds = Math.min(3600, Math.pow(2, attempts) * 60);
      await enqueueCloudTask({
        type: 'webhook_retry',
        payload: { ...payload, attempts: attempts + 1 },
        delaySeconds
      });
    }
  } catch (error) {
    console.error('Webhook retry error:', error);
    throw error;
  }
}

// Slack 업데이트 처리
async function processSlackUpdate(payload: any): Promise<void> {
  const { channel, ts, text, blocks, attempts = 0, maxAttempts = 8 } = payload;
  
  try {
    const response = await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({ channel, ts, text, blocks })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('Slack update successful');
      return;
    }
    
    // 429 에러 시 재큐잉
    if (response.status === 429 && attempts < maxAttempts) {
      const retryAfter = Number(response.headers.get('retry-after') || 60);
      await enqueueCloudTask({
        type: 'slack_update',
        payload: { ...payload, attempts: attempts + 1 },
        delaySeconds: retryAfter
      });
    }
  } catch (error) {
    console.error('Slack update error:', error);
    throw error;
  }
}

// 승인 만료 처리
async function processApprovalExpiry(payload: any): Promise<void> {
  const { docId, channel, ts } = payload;
  
  try {
    const db = admin.firestore();
    const docRef = db.collection('approvals').doc(docId);
    
    await docRef.update({
      status: 'expired',
      expiredAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Slack 카드 업데이트
    if (channel && ts) {
      await enqueueCloudTask({
        type: 'slack_update',
        payload: {
          channel,
          ts,
          text: `${payload.title} (만료됨)`,
          blocks: payload.blocks
        }
      });
    }
    
    console.log('Approval expiry processed:', docId);
  } catch (error) {
    console.error('Approval expiry error:', error);
    throw error;
  }
}

// 메트릭 업데이트 처리
async function processMetricsUpdate(payload: any): Promise<void> {
  const { docId, metrics } = payload;
  
  try {
    const db = admin.firestore();
    const docRef = db.collection('approvals').doc(docId);
    
    await docRef.update({
      metrics: metrics,
      metricsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Metrics update processed:', docId);
  } catch (error) {
    console.error('Metrics update error:', error);
    throw error;
  }
}

// Cloud Tasks 모드 활성화 함수
export function enableCloudTasksMode(): void {
  if (CLOUD_TASKS_ENABLED) {
    console.log('Cloud Tasks mode enabled');
  } else {
    console.log('Cloud Tasks mode disabled, using Firestore queues');
  }
}
