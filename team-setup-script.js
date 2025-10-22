// 팀 생성/오너 지정 스크립트
// 브라우저 개발자 도구 Console에서 실행

const TEAM_ID = 'yago-demo-fc';
const uid = window.auth.currentUser.uid;

console.log('팀 생성 시작...', { TEAM_ID, uid });

// 팀 문서
await window.fs.setDoc(
  window.fs.doc(window.db, 'teams', TEAM_ID),
  {
    name: '야고 데모 FC',
    ownerUid: uid,
    public: {
      tagline: '매주 즐겁게 뛰는 생활축구팀',
      description: '데모 팀입니다.',
      schedule: { summary: '매주 토 18:00-20:00, 소흘 체육공원', placeName: '소흘 체육공원' },
      blog: { provider: 'gh_pages' }
    },
    createdAt: window.fs.serverTimestamp()
  },
  { merge: true }
);

// 멤버/오너 권한
await window.fs.setDoc(
  window.fs.doc(window.db, 'teams', TEAM_ID, 'members', uid),
  { roles: ['owner'], status: 'active', joinedAt: window.fs.serverTimestamp() },
  { merge: true }
);

console.log('팀 생성 및 owner 지정 완료');
'팀 생성 및 owner 지정 완료';
