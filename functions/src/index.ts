import * as admin from 'firebase-admin';
import { analyze, analyzeCallable } from './analyze';

// Firebase Admin 초기화
admin.initializeApp();

// AI 분석 함수들 export
export { analyze, analyzeCallable }; 