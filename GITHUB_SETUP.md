# 🔐 GitHub Secrets 설정 가이드

## **Firebase Service Account 설정**

### **1. GCP 콘솔에서 서비스 계정 생성**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택: `jaeman-vibe-platform`
3. **IAM & Admin** → **Service Accounts** 이동
4. **CREATE SERVICE ACCOUNT** 클릭

### **2. 서비스 계정 정보 입력**
- **Service account name**: `github-actions-deploy`
- **Service account ID**: 자동 생성됨
- **Description**: `GitHub Actions for Firebase deployment`

### **3. 권한 설정**
**Role** 선택:
- **Firebase Admin** (권장) - 모든 Firebase 서비스 접근
- 또는 **Firebase Hosting Admin** + **Firestore Admin** + **Storage Admin**

### **4. 키 생성**
1. 생성된 서비스 계정 클릭
2. **KEYS** 탭 → **ADD KEY** → **Create new key**
3. **JSON** 형식 선택 → **CREATE**
4. JSON 파일 다운로드

### **5. GitHub Secrets 설정**

#### **웹 인터페이스:**
1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. **Name**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value**: 다운로드한 JSON 파일 내용 전체 복사/붙여넣기
5. **Add secret** 클릭

#### **GitHub CLI (선택):**
```bash
gh secret set FIREBASE_SERVICE_ACCOUNT < service-account-key.json
```

## **✅ 설정 완료 확인**

### **PR 생성 시:**
- ✅ 자동 빌드
- ✅ 에뮬레이터 테스트
- ✅ 프리뷰 URL 자동 생성 (7일 유효)

### **main 브랜치 푸시 시:**
- ✅ 자동 빌드
- ✅ 에뮬레이터 테스트
- ✅ 프로덕션 배포

## **🔧 문제 해결**

### **Secrets 에러 발생 시:**
```
Error: Could not deploy to Firebase Hosting
```
**해결**: 
1. JSON 파일 내용이 올바르게 복사되었는지 확인
2. 서비스 계정 권한 확인
3. 프로젝트 ID가 `jaeman-vibe-platform`인지 확인

### **권한 에러 발생 시:**
```
Error: Permission denied
```
**해결**: 서비스 계정에 **Firebase Admin** 역할 추가

## **📋 체크리스트**

- [ ] GCP 서비스 계정 생성
- [ ] Firebase Admin 권한 부여
- [ ] JSON 키 다운로드
- [ ] GitHub Secrets 설정
- [ ] PR 테스트
- [ ] 프로덕션 배포 테스트
