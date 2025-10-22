/**
 * Sentry 모니터링 설정
 */

import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Sentry 초기화
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  const release = import.meta.env.VITE_APP_VERSION || '1.0.0';
  
  if (!dsn) {
    console.warn('Sentry DSN not configured');
    return;
  }
  
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    integrations: [
      new BrowserTracing({
        // 라우팅 변경 추적
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],
    // 성능 모니터링
    beforeSend(event) {
      // 민감한 정보 필터링
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      // 개발 환경에서는 모든 이벤트 로깅
      if (environment === 'development') {
        console.log('Sentry Event:', event);
      }
      
      return event;
    },
    // 사용자 컨텍스트 설정
    beforeBreadcrumb(breadcrumb) {
      // 민감한 정보가 포함된 breadcrumb 제거
      if (breadcrumb.category === 'console' && 
          breadcrumb.message?.includes('password')) {
        return null;
      }
      return breadcrumb;
    }
  });
  
  console.log('Sentry initialized');
}

/**
 * 사용자 컨텍스트 설정
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  });
}

/**
 * 사용자 컨텍스트 제거
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * 커스텀 태그 설정
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * 커스텀 컨텍스트 설정
 */
export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

/**
 * 커스텀 이벤트 캡처
 */
export function captureEvent(event: {
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: Record<string, any>;
}) {
  Sentry.captureEvent(event);
}

/**
 * 예외 캡처
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope(scope => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * 메시지 캡처
 */
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * 성능 트랜잭션 시작
 */
export function startTransaction(name: string, op: string = 'custom') {
  return Sentry.startTransaction({ name, op });
}

/**
 * 비즈니스 이벤트 추적
 */
export function trackBusinessEvent(event: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: event,
    category: 'business',
    level: 'info',
    data: properties
  });
}

/**
 * 사용자 액션 추적
 */
export function trackUserAction(action: string, target?: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `${action}${target ? ` on ${target}` : ''}`,
    category: 'user',
    level: 'info',
    data: properties
  });
}

/**
 * API 호출 추적
 */
export function trackApiCall(method: string, url: string, status?: number, duration?: number) {
  Sentry.addBreadcrumb({
    message: `${method} ${url}`,
    category: 'http',
    level: status && status >= 400 ? 'error' : 'info',
    data: {
      method,
      url,
      status_code: status,
      duration
    }
  });
}

/**
 * 페이지 뷰 추적
 */
export function trackPageView(page: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Page view: ${page}`,
    category: 'navigation',
    level: 'info',
    data: properties
  });
}

/**
 * 에러 바운더리용 헬퍼
 */
export function withErrorBoundary<T extends React.ComponentType<any>>(
  Component: T,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
): T {
  return Sentry.withErrorBoundary(Component, {
    fallback: fallback || (({ error }) => (
      <div className="error-boundary">
        <h2>문제가 발생했습니다</h2>
        <p>페이지를 새로고침해주세요.</p>
        <button onClick={() => window.location.reload()}>
          새로고침
        </button>
      </div>
    )),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('errorBoundary', true);
      scope.setContext('errorInfo', errorInfo);
    }
  });
}

// React 관련 import들 (실제 사용 시 추가)
// import React from 'react';
// import { useLocation, useNavigationType } from 'react-router-dom';
// import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';
