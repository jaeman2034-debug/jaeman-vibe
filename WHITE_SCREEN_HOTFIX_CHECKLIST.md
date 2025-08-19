# White Screen Hotfix - 점검 체크리스트

## ✅ 적용된 수정사항들

### 1) 글로벌 Error Boundary
- [x] `src/app/RootErrorBoundary.tsx` 생성
- [x] `src/main.tsx`에 `RootErrorBoundary` 적용
- [x] React 컴포넌트 에러 시 에러 화면 표시

### 2) 로딩 폴백 컴포넌트
- [x] `src/components/AppSplash.tsx` 생성
- [x] `small` prop으로 크기 조절 가능
- [x] 애니메이션과 함께 "불러오는 중…" 표시

### 3) 전역 런타임 에러 오버레이
- [x] `src/app/GlobalErrorOverlay.tsx` 생성
- [x] `window.error` 및 `unhandledrejection` 이벤트 캐치
- [x] 우측 하단에 에러 메시지 표시

### 4) Suspense fallback을 모두 표시형으로 변경
- [x] `src/main.tsx` 모달 레지스트리: `fallback={null}` → `<AppSplash small/>`
- [x] `src/pages/voice/VoiceRoutes.tsx`: `fallback={null}` → `<AppSplash small/>`

### 5) DevGuard 로딩 상태에 스피너 표시
- [x] `src/components/DevGuard.tsx`: `return null` → `<AppSplash small/>`
- [x] Auth 로딩 중 빈 화면 방지

### 6) Vite 경로/별칭 확인
- [x] `vite.config.ts`에서 `@` 별칭 올바르게 설정
- [x] 에러 오버레이 및 소스맵 활성화

## 🔍 빠른 점검 체크리스트

### 1) 브라우저 콘솔(F12) 확인
- [ ] 빨간 에러가 노출되는지 (이제 ErrorBoundary/Overlay로도 보임)
- [ ] 에러 스택 트레이스가 정확한지

### 2) 네트워크 탭 확인
- [ ] `*.js` 청크 404가 없는지
- [ ] 있다면 `vite.config.ts`의 `base` 수정 필요

### 3) 로딩 상태 확인
- [ ] `/voice/*` 접속 시 **로딩 스피너**가 보이는지
- [ ] Auth 로딩 동안 빈 화면이 아닌지
- [ ] lazy 컴포넌트 로드 시 fallback 컴포넌트 노출 → 실페이지 전환

### 4) 에러 처리 확인
- [ ] React 컴포넌트 에러 시 ErrorBoundary 화면 표시
- [ ] 런타임 에러 시 GlobalErrorOverlay 표시
- [ ] 새로고침 버튼으로 복구 가능

## 🚨 문제 발생 시 추가 확인사항

### Vite 청크 404 문제
```bash
# 빌드 후 정적 파일 경로 확인
npm run build
# dist 폴더에 index.html과 assets 폴더가 올바르게 생성되었는지 확인
```

### 환경별 base 경로 설정
```ts
// vite.config.ts
export default defineConfig({
  // GitHub Pages: "/repo-name/"
  // Vercel: "/"
  // 로컬: "/"
  base: "/",
});
```

### 개발 서버 재시작
```bash
# 의존성 변경 후 개발 서버 재시작
npm run dev
```

## 📝 커밋 메시지 예시

```
fix(app): add RootErrorBoundary, visible Suspense fallbacks, DevGuard spinner; ensure vite alias/base

- show errors instead of blank screen
- visible loaders for lazy pages/modals
- avoid white screen during auth init
- configured @ alias and base path
```

## 🎯 예상 결과

이제 **화면이 하얗게만 보이는 문제**가 해결되어야 합니다:

1. **에러 발생 시**: 명확한 에러 메시지와 스택 트레이스 표시
2. **로딩 중**: "불러오는 중…" 스피너 표시
3. **Auth 초기화**: DevGuard에서 로딩 상태 표시
4. **Lazy 컴포넌트**: fallback 컴포넌트로 로딩 상태 표시
5. **런타임 에러**: GlobalErrorOverlay로 즉시 알림

**문제가 지속되면 브라우저 콘솔의 구체적인 에러 메시지를 확인하세요!** 