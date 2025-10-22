import { setGlobalOptions } from 'firebase-functions/v2';

// 모든 v2 함수에 적용되는 글로벌 설정
setGlobalOptions({ 
  region: 'us-central1', 
  timeoutSeconds: 60, 
  maxInstances: 20 
});
