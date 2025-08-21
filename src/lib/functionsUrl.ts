const PID = 'jaeman-vibe-platform'; // 실제 프로젝트 ID
const REGION = 'us-central1';

export const FUNCTIONS_BASE =
  location.hostname === 'localhost'
    ? `http://localhost:5001/${PID}/${REGION}`
    : `https://${REGION}-${PID}.cloudfunctions.net`;

// 사용 예시:
// import { FUNCTIONS_BASE } from '@/lib/functionsUrl';
// await fetch(`${FUNCTIONS_BASE}/analyzeProduct`, { /* ... */ }); 