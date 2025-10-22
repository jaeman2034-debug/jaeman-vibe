import './firebaseAdmin';
import './globalOptions';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const N8N_WEBHOOK_CREATE = defineSecret("N8N_WEBHOOK_TEAM_BLOG_CREATE");
const N8N_WEBHOOK_SYNC = defineSecret("N8N_WEBHOOK_TEAM_BLOG_SYNC");
const INTERNAL_KEY = defineSecret("INTERNAL_KEY");

type Meetup = {
  title: string;
  category: string; // 'club'이면 팀 블로그 대상
  sportType?: string;
  region?: string;
  hostUid: string;
  hostName?: string;
  images?: string[];
  description?: string;
};

export const onClubCreated = onDocumentCreated(
  { document: "meetups/{id}", secrets: [N8N_WEBHOOK_CREATE, INTERNAL_KEY] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    
    const data = snap.data() as Meetup;
    if (!data || data.category !== 'club') return;

    // 이미 블로그가 있으면 패스(재발행 방지)
    if ((data as any)?.blog?.url) return;

    const payload = {
      id: event.params.id,
      title: data.title,
      sportType: data.sportType ?? 'soccer',
      region: data.region ?? 'KR',
      hostUid: data.hostUid,
      hostName: data.hostName ?? '',
      cover: data.images?.[0] ?? '',
      description: data.description ?? '',
      provider: 'notion', // 'gh_pages' 등으로 교체 가능
    };

    try {
      const response = await fetch(N8N_WEBHOOK_CREATE.value(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_KEY.value() 
        },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      // n8n이 반환하는 표준 응답 형식 가정
      const { blogUrl, pageId, provider } = res;

      await snap.ref.set({
        blog: {
          url: blogUrl,
          provider,
          providerId: pageId,
          createdAt: FieldValue.serverTimestamp(),
        }
      }, { merge: true });

      console.log(`팀 블로그 생성 완료: ${event.params.id} -> ${blogUrl}`);
    } catch (error) {
      console.error('팀 블로그 생성 실패:', error);
      // 실패해도 meetup 생성은 계속 진행
    }
  }
);

export const retryCreateTeamBlog = onCall(
  { secrets: [N8N_WEBHOOK_CREATE, INTERNAL_KEY] },
  async (req) => {
    const { meetupId } = req.data;
    if (!meetupId) throw new HttpsError('invalid-argument','meetupId required');

    const db = getFirestore();
    const docRef = db.doc(`meetups/${meetupId}`);
    const snap = await docRef.get();
    if (!snap.exists) throw new HttpsError('not-found','meetup not found');
    const meetupData = snap.data() as Meetup & any;

    if (meetupData.category !== 'club') {
      throw new HttpsError('failed-precondition','category must be club');
    }
    if (meetupData.blog?.url) return meetupData.blog; // 이미 생성됨

    const payload = {
      id: meetupId,
      title: meetupData.title,
      sportType: meetupData.sportType ?? 'soccer',
      region: meetupData.region ?? 'KR',
      hostUid: meetupData.hostUid,
      hostName: meetupData.hostName ?? '',
      cover: meetupData.images?.[0] ?? '',
      description: meetupData.description ?? '',
      provider: 'notion',
    };

    try {
      const response = await fetch(N8N_WEBHOOK_CREATE.value(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_KEY.value() 
        },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      const { blogUrl, pageId, provider } = res;
      await docRef.set({
        blog: {
          url: blogUrl,
          provider,
          providerId: pageId,
          createdAt: FieldValue.serverTimestamp(),
        }
      }, { merge: true });
      
      return { blogUrl, provider, pageId };
    } catch (error) {
      console.error('팀 블로그 재시도 실패:', error);
      throw new HttpsError('internal', '팀 블로그 생성에 실패했습니다.');
    }
  }
);

// 클럽 공개 정보 변경 감지 → 블로그 자동 갱신
export const onClubPublicWrite = onDocumentUpdated(
  { document: "clubs/{clubId}", secrets: [N8N_WEBHOOK_SYNC, INTERNAL_KEY] },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;
    
    // public 필드가 변경된 경우에만 처리
    const publicBefore = before?.public || {};
    const publicAfter = after?.public || {};
    
    if (JSON.stringify(publicBefore) === JSON.stringify(publicAfter)) {
      return; // 변경사항 없음
    }

    const clubId = event.params.clubId;
    const payload = buildBlogPayload(clubId, after);

    try {
      const response = await fetch(N8N_WEBHOOK_SYNC.value(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_KEY.value() 
        },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      const { blogUrl, pageId, provider } = res;
      
      // 블로그 정보 업데이트
      await event.data.after.ref.set({
        public: {
          ...publicAfter,
          blog: {
            url: blogUrl,
            provider,
            providerId: pageId,
            updatedAt: FieldValue.serverTimestamp(),
          }
        }
      }, { merge: true });

      console.log(`팀 블로그 갱신 완료: ${clubId} -> ${blogUrl}`);
    } catch (error) {
      console.error('팀 블로그 갱신 실패:', error);
    }
  }
);

// 수동 블로그 갱신 (관리자용)
export const syncClubBlog = onCall(
  { secrets: [N8N_WEBHOOK_SYNC, INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { clubId } = req.data;
    if (!clubId) {
      throw new HttpsError('invalid-argument', 'clubId가 필요합니다.');
    }

    // 관리자 권한 확인
    const db = getFirestore();
    const clubRef = db.doc(`clubs/${clubId}`);
    const clubSnap = await clubRef.get();
    if (!clubSnap.exists) {
      throw new HttpsError('not-found', '클럽을 찾을 수 없습니다.');
    }

    const clubData = clubSnap.data()!;
    const isAdmin = clubData.ownerUid === req.auth.uid || 
      (clubData.admins && clubData.admins.includes(req.auth.uid));
    
    if (!isAdmin) {
      throw new HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }

    const payload = buildBlogPayload(clubId, clubData);

    try {
      const response = await fetch(N8N_WEBHOOK_SYNC.value(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_KEY.value() 
        },
        body: JSON.stringify(payload)
      });
      const res = await response.json();

      const { blogUrl, pageId, provider } = res;
      
      // 블로그 정보 업데이트
      await clubRef.set({
        public: {
          ...clubData.public,
          blog: {
            url: blogUrl,
            provider,
            providerId: pageId,
            updatedAt: FieldValue.serverTimestamp(),
          }
        }
      }, { merge: true });

      return { blogUrl, provider, pageId };
    } catch (error) {
      console.error('팀 블로그 수동 갱신 실패:', error);
      throw new HttpsError('internal', '블로그 갱신에 실패했습니다.');
    }
  }
);

// 회원 기여 승인 처리
export const approvePublicContrib = onCall(
  {},
  async (req) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const { clubId, contribId, action, note } = req.data;
    if (!clubId || !contribId || !['approve', 'reject'].includes(action)) {
      throw new HttpsError('invalid-argument', '잘못된 매개변수입니다.');
    }

    // 관리자 권한 확인
    const db = getFirestore();
    const clubRef = db.doc(`clubs/${clubId}`);
    const clubSnap = await clubRef.get();
    if (!clubSnap.exists) {
      throw new HttpsError('not-found', '클럽을 찾을 수 없습니다.');
    }

    const clubData = clubSnap.data()!;
    const isAdmin = clubData.ownerUid === req.auth.uid || 
      (clubData.admins && clubData.admins.includes(req.auth.uid));
    
    if (!isAdmin) {
      throw new HttpsError('permission-denied', '관리자 권한이 필요합니다.');
    }

    // 기여 문서 가져오기
    const contribRef = db.doc(`clubs/${clubId}/publicContribs/${contribId}`);
    const contribSnap = await contribRef.get();
    if (!contribSnap.exists) {
      throw new HttpsError('not-found', '기여를 찾을 수 없습니다.');
    }

    const contribData = contribSnap.data()!;
    if (contribData.status !== 'requested') {
      throw new HttpsError('failed-precondition', '이미 처리된 기여입니다.');
    }

    const batch = db.batch();

    // 기여 상태 업데이트
    batch.update(contribRef, {
      status: action === 'approve' ? 'approved' : 'rejected',
      decidedAt: FieldValue.serverTimestamp(),
      decidedBy: req.auth.uid,
      decisionNote: note || null,
    });

    // 승인된 경우 클럽 public 데이터에 병합
    if (action === 'approve') {
      const currentPublic = clubData.public || {};
      const patch = contribData.patch;
      
      const updatedPublic = {
        ...currentPublic,
        ...(patch.tagline && { tagline: patch.tagline }),
        ...(patch.description && { description: patch.description }),
        ...(patch.galleryAppend && { 
          gallery: [...(currentPublic.gallery || []), ...patch.galleryAppend] 
        }),
        ...(patch.achievementsAppend && { 
          achievements: [...(currentPublic.achievements || []), ...patch.achievementsAppend] 
        }),
      };

      batch.update(clubRef, { public: updatedPublic });
    }

    await batch.commit();
    
    return { success: true, action };
  }
);

// 블로그 페이로드 생성 헬퍼 함수
function buildBlogPayload(clubId: string, clubData: any) {
  const publicData = clubData.public || {};
  
  return {
    clubId,
    name: clubData.name || '',
    sportType: clubData.sportType || 'soccer',
    region: clubData.region || 'KR',
    logoUrl: clubData.logoUrl || '',
    coverUrl: clubData.coverUrl || '',
    tagline: publicData.tagline || '',
    description: publicData.description || '',
    schedule: publicData.schedule || {},
    contact: publicData.contact || {},
    dues: publicData.dues || {},
    gallery: publicData.gallery || [],
    achievements: publicData.achievements || [],
    provider: 'gh_pages', // 기본값, 설정에 따라 변경 가능
  };
}