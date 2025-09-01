# 🚀 배포 가이드

## **🛡️ 프로덕션 안전 체계**

### **1. 개발 환경 세이프가드**
- ✅ **자동 감지**: 개발 모드에서 실프로젝트 연결 시 즉시 중단
- ✅ **환경 변수 검증**: `VITE_USE_EMULATORS=true` 필수
- ✅ **에뮬레이터 전용**: 로컬 개발은 100% 에뮬레이터 기반

### **2. 브랜치 전략**
```
main          → 프로덕션 배포용
feature/*     → 기능 개발 브랜치
```

### **3. 배포 워크플로우**

#### **PR 생성 시:**
1. `feature/your-feature` 브랜치 생성
2. 개발 완료 후 PR 생성
3. **자동 테스트**: 에뮬레이터 기반 테스트 실행
4. **프리뷰 배포**: `preview-{PR번호}` 채널에 자동 배포
5. **수동 검증**: 프리뷰 URL에서 기능 확인
6. **승인 후 머지**: main 브랜치로 머지

#### **메인 배포:**
- main 브랜치 푸시 시 자동으로 프로덕션 배포

## **⚡ 개발 명령어**

### **로컬 개발**
```bash
# 개발용 규칙 적용
npm run rules:dev

# 에뮬레이터 + 웹 동시 시작
npm run dev

# 에뮬레이터만 시작
npm run emu
```

### **테스트**
```bash
# 에뮬레이터 기반 테스트
npm run test:emu

# 보안 규칙 테스트
npm run test:rules
```

### **배포 준비**
```bash
# 프로덕션 규칙 적용
npm run rules:prod

# 빌드
npm run build
```

## **🔒 보안 규칙**

### **개발용 (firestore.rules.dev)**
- 모든 접근 허용 (편의성)
- 에뮬레이터 전용

### **프로덕션용 (firestore.rules.prod)**
- Secure-by-default (기본 거부)
- 소유권 기반 접근 제어
- 필드 밸리데이션
- 관리자 권한 지원

## **📋 체크리스트**

### **개발 시작 전:**
- [ ] `npm run rules:dev` 실행
- [ ] `.env.local`에 `VITE_USE_EMULATORS=true` 설정
- [ ] 에뮬레이터 포트 확인 (Auth: 9108, Firestore: 8210, Storage: 9320)

### **PR 생성 전:**
- [ ] `npm run test:emu` 통과
- [ ] `npm run test:rules` 통과
- [ ] 빌드 성공 확인

### **배포 전:**
- [ ] `npm run rules:prod` 실행
- [ ] 프리뷰에서 기능 검증 완료
- [ ] 보안 규칙 테스트 통과

## **🚨 주의사항**

1. **절대 실프로젝트 데이터 건드리지 않기**
2. **에뮬레이터만 사용하기**
3. **.env.local은 절대 커밋하지 않기**
4. **프로덕션 규칙 적용 후 배포하기**

## **🔧 문제 해결**

### **세이프가드 에러 발생 시:**
```
[SAFEGUARD] 개발 모드인데 에뮬레이터 연결이 감지되지 않았습니다.
```
**해결**: `.env.local`에 `VITE_USE_EMULATORS=true` 추가

### **포트 충돌 시:**
```bash
# 기존 프로세스 종료
taskkill /F /IM node.exe
# 또는
netstat -ano | findstr :5175
taskkill /F /PID <PID>
```

### **에뮬레이터 연결 실패 시:**
```bash
# 허브 락 정리
Get-ChildItem $env:TEMP -Filter "hub-*.json" | Remove-Item -Force
# 에뮬레이터 재시작
npm run emu
```
