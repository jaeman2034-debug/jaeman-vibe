// src/features/auth/authService.ts
import { FirebaseError } from 'firebase/app';
import { auth, isUsingEmulators } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User,
  AuthErrorCodes,
} from 'firebase/auth';
// 타입은 필요하면 이렇게만 사용
// import type { AuthError } from 'firebase/auth';

// isUsingEmulators 를 로그로만 쓰거나, 조건 분기에 사용 가능
console.log('[AUTH] using emulators?', isUsingEmulators);

// Google provider 인스턴스 생성
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firebase 인증 오류 분석 및 사용자 친화적 메시지 생성
function analyzeAuthError(error: FirebaseError): {
  code: string;
  message: string;
  userMessage: string;
  solution: string;
  severity: 'info' | 'warning' | 'error';
} {
  const { code, message } = error;
  
  console.group(`[AUTH ERROR] ${code}`);
  console.error('Error details:', error);
  console.error('Error code:', code);
  console.error('Error message:', message);
  console.error('Stack trace:', error.stack);
  console.groupEnd();

  // 에러 코드별 상세 분석
  switch (code) {
    // 이메일/비밀번호 로그인 관련 오류
    case AuthErrorCodes.INVALID_EMAIL:
      return {
        code,
        message,
        userMessage: '이메일 형식이 올바르지 않습니다.',
        solution: '올바른 이메일 주소를 입력해주세요. (예: user@example.com)',
        severity: 'warning'
      };
    
    case AuthErrorCodes.USER_DELETED:
      return {
        code,
        message,
        userMessage: '존재하지 않는 계정입니다.',
        solution: '회원가입을 먼저 진행해주세요.',
        severity: 'error'
      };
    
    case AuthErrorCodes.INVALID_PASSWORD:
      return {
        code,
        message,
        userMessage: '비밀번호가 올바르지 않습니다.',
        solution: '비밀번호를 다시 확인해주세요.',
        severity: 'error'
      };
    
    case AuthErrorCodes.WEAK_PASSWORD:
      return {
        code,
        message,
        userMessage: '비밀번호가 너무 약합니다.',
        solution: '영문, 숫자, 특수문자를 포함하여 8자 이상으로 설정해주세요.',
        severity: 'warning'
      };
    
    case AuthErrorCodes.EMAIL_ALREADY_IN_USE:
      return {
        code,
        message,
        userMessage: '이미 사용 중인 이메일입니다.',
        solution: '다른 이메일 주소를 사용하거나 로그인을 시도해주세요.',
        severity: 'warning'
      };
    
    case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
      return {
        code,
        message,
        userMessage: '이메일 또는 비밀번호가 올바르지 않습니다.',
        solution: '입력한 정보를 다시 확인해주세요.',
        severity: 'error'
      };
    
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
      return {
        code,
        message,
        userMessage: '로그인 시도가 너무 많습니다.',
        solution: '잠시 후 다시 시도해주세요. (보통 15분 후 해제)',
        severity: 'warning'
      };
    
    case AuthErrorCodes.OPERATION_NOT_ALLOWED:
      return {
        code,
        message,
        userMessage: '이 로그인 방식이 허용되지 않습니다.',
        solution: '관리자에게 문의하거나 다른 로그인 방식을 사용해주세요.',
        severity: 'error'
      };
    
    case AuthErrorCodes.USER_DISABLED:
      return {
        code,
        message,
        userMessage: '비활성화된 계정입니다.',
        solution: '관리자에게 문의해주세요.',
        severity: 'error'
      };
    
    case AuthErrorCodes.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL:
      return {
        code,
        message,
        userMessage: '다른 로그인 방식으로 가입된 계정입니다.',
        solution: 'Google 로그인 등 다른 방식을 시도해보세요.',
        severity: 'warning'
      };
    
    // 네트워크 및 기타 오류
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
      return {
        code,
        message,
        userMessage: '네트워크 연결을 확인해주세요.',
        solution: '인터넷 연결 상태를 확인하고 다시 시도해주세요.',
        severity: 'warning'
      };
    
    case AuthErrorCodes.TIMEOUT:
      return {
        code,
        message,
        userMessage: '요청 시간이 초과되었습니다.',
        solution: '네트워크 상태를 확인하고 다시 시도해주세요.',
        severity: 'warning'
      };
    
    case AuthErrorCodes.INVALID_APP_CREDENTIAL:
      return {
        code,
        message,
        userMessage: '앱 인증 정보가 올바르지 않습니다.',
        solution: '앱을 다시 시작하거나 관리자에게 문의해주세요.',
        severity: 'error'
      };
    
    case AuthErrorCodes.INVALID_USER_TOKEN:
      return {
        code,
        message,
        userMessage: '로그인 세션이 만료되었습니다.',
        solution: '다시 로그인해주세요.',
        severity: 'warning'
      };
    
    case AuthErrorCodes.USER_TOKEN_EXPIRED:
      return {
        code,
        message,
        userMessage: '로그인 세션이 만료되었습니다.',
        solution: '다시 로그인해주세요.',
        severity: 'warning'
      };
    
    case AuthErrorCodes.REQUIRES_RECENT_LOGIN:
      return {
        code,
        message,
        userMessage: '보안을 위해 다시 로그인이 필요합니다.',
        solution: '현재 비밀번호로 다시 로그인해주세요.',
        severity: 'warning'
      };
    
    // 기본 오류
    default:
      return {
        code,
        message,
        userMessage: '로그인 중 오류가 발생했습니다.',
        solution: '잠시 후 다시 시도하거나 관리자에게 문의해주세요.',
        severity: 'error'
      };
  }
}

// ---- Email/Password ----
export async function emailLogin(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (e: unknown) {
    if (isFirebaseError(e)) {
      console.error('[AUTH] login failed', e.code, e.message);
      // 호출 측에서 코드 기반으로 메시지 매핑 가능하도록 에러 코드 전달
      throw new Error(e.code);
    }
    console.error('[AUTH] unknown error', e);
    throw new Error('auth/unknown');
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    console.log('[AUTH] Attempting email login for:', email);
    
    // 입력값 검증
    if (!email || !email.trim()) {
      throw new Error('이메일을 입력해주세요.');
    }
    if (!password || !password.trim()) {
      throw new Error('비밀번호를 입력해주세요.');
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('올바른 이메일 형식을 입력해주세요.');
    }
    
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    console.log('[AUTH] Email login successful for:', email);
    return result;
  } catch (error) {
    console.error('[AUTH] Email login failed for:', email);
    
    if (isFirebaseError(error)) {
      // Firebase 오류 코드/메시지만 로깅 (민감 정보 제외)
      console.error('[AUTH] Firebase login error:', error.code, error.message);
      
      const analyzedError = analyzeAuthError(error);
      console.error('[AUTH] Analyzed error:', analyzedError);
      
      // 사용자 친화적인 오류 객체 생성
      const userFriendlyError = new Error(analyzedError.userMessage);
      (userFriendlyError as any).authError = analyzedError;
      (userFriendlyError as any).originalError = error;
      
      throw userFriendlyError;
    }
    
    // 일반 오류 처리
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}
export const loginWithEmail = signInWithEmail; // alias

export async function registerWithEmail(email: string, password: string) {
  try {
    console.log('[AUTH] Attempting email registration for:', email);
    
    // 입력값 검증
    if (!email || !email.trim()) {
      throw new Error('이메일을 입력해주세요.');
    }
    if (!password || !password.trim()) {
      throw new Error('비밀번호를 입력해주세요.');
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('올바른 이메일 형식을 입력해주세요.');
    }
    
    // 비밀번호 강도 검증
    if (password.length < 8) {
      throw new Error('비밀번호는 8자 이상이어야 합니다.');
    }
    
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    console.log('[AUTH] Email registration successful for:', email);
    return result;
  } catch (error) {
    console.error('[AUTH] Email registration failed for:', email);
    
    if (isFirebaseError(error)) {
      const analyzedError = analyzeAuthError(error);
      console.error('[AUTH] Analyzed error:', analyzedError);
      
      // 사용자 친화적인 오류 객체 생성
      const userFriendlyError = new Error(analyzedError.userMessage);
      (userFriendlyError as any).authError = analyzedError;
      (userFriendlyError as any).originalError = error;
      
      throw userFriendlyError;
    }
    
    // 일반 오류 처리
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}
export const signUpWithEmail = registerWithEmail; // alias

// ---- Google ----
export async function signInWithGoogle() {
  try {
    if (isUsingEmulators) {
      // 에뮬레이터에선 구글 팝업 로그인 불편/미지원 케이스가 있어 이메일/비번 권장
      throw new Error('에뮬레이터에서는 이메일/비밀번호 로그인을 사용하세요.');
    }
    
    console.log('[AUTH] Attempting Google login');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[AUTH] Google login successful');
    return result;
  } catch (error) {
    console.error('[AUTH] Google login failed');
    
    if (isFirebaseError(error)) {
      const analyzedError = analyzeAuthError(error);
      console.error('[AUTH] Analyzed error:', analyzedError);
      
      // 사용자 친화적인 오류 객체 생성
      const userFriendlyError = new Error(analyzedError.userMessage);
      (userFriendlyError as any).authError = analyzedError;
      (userFriendlyError as any).originalError = error;
      
      throw userFriendlyError;
    }
    
    // 일반 오류 처리
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Google 로그인 중 오류가 발생했습니다.');
  }
}
export const loginWithGoogle = signInWithGoogle; // alias

// ---- Session helpers ----
export function logout() {
  return signOut(auth);
}
export function subscribeAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

// ---- 오류 처리 유틸리티 ----
function isFirebaseError(e: unknown): e is FirebaseError {
  return e instanceof FirebaseError || (
    typeof e === 'object' && e !== null && 'code' in e
  );
}

export function isAuthError(error: any): error is { code: string; message: string } {
  return error && typeof error === 'object' && 'code' in error;
}

export function getAuthErrorInfo(error: any) {
  if (isFirebaseError(error)) {
    return analyzeAuthError(error);
  }
  return null;
}

export function formatAuthErrorForUser(error: any): {
  message: string;
  solution: string;
  severity: 'info' | 'warning' | 'error';
} {
  if (isAuthError(error)) {
    const analyzedError = analyzeAuthError(error);
    return {
      message: analyzedError.userMessage,
      solution: analyzedError.solution,
      severity: analyzedError.severity
    };
  }
  
  // 일반 오류 처리
  if (error instanceof Error) {
    return {
      message: error.message,
      solution: '잠시 후 다시 시도하거나 관리자에게 문의해주세요.',
      severity: 'error'
    };
  }
  
  return {
    message: '알 수 없는 오류가 발생했습니다.',
    solution: '잠시 후 다시 시도하거나 관리자에게 문의해주세요.',
    severity: 'error'
  };
}

// 오류 로깅을 위한 헬퍼 함수
export function logAuthError(context: string, error: any, additionalInfo?: any) {
  console.group(`[AUTH ERROR] ${context}`);
  console.error('Error:', error);
  console.error('Error type:', typeof error);
  console.error('Error constructor:', error?.constructor?.name);
  
  if (additionalInfo) {
    console.error('Additional info:', additionalInfo);
  }
  
  if (isFirebaseError(error)) {
    const analyzedError = analyzeAuthError(error);
    console.error('Analyzed error:', analyzedError);
  }
  
  console.groupEnd();
} 