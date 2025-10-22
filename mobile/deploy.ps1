# ===========================
# 🚀 야고 비서 원클릭 배포 스크립트 (Windows PowerShell)
# ===========================

param(
    [string]$FirebaseProjectId,
    [string]$KakaoJsKey,
    [string]$KakaoMobilityKey,
    [string]$FirebaseApiKey,
    [string]$FirebaseAuthDomain,
    [string]$FirebaseStorageBucket,
    [string]$FirebaseMessagingSenderId,
    [string]$FirebaseAppId,
    [string]$N8nWebhookUrl,
    [string]$BuildProfile = "preview",
    [string]$Platform = "all",
    [switch]$SubmitToStore,
    [switch]$DeployWeb
)

# 색상 정의
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# 함수 정의
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

# 1️⃣ 환경 확인
Write-Info "환경 확인 중..."

# Node.js 확인
try {
    $nodeVersion = node --version
    Write-Success "Node.js 버전: $nodeVersion"
} catch {
    Write-Error "Node.js가 설치되지 않았습니다. https://nodejs.org 에서 설치하세요."
    exit 1
}

# Firebase CLI 확인
try {
    $firebaseVersion = firebase --version
    Write-Success "Firebase CLI 버전: $firebaseVersion"
} catch {
    Write-Error "Firebase CLI가 설치되지 않았습니다. 'npm install -g firebase-tools'를 실행하세요."
    exit 1
}

# Expo CLI 확인
try {
    $expoVersion = expo --version
    Write-Success "Expo CLI 버전: $expoVersion"
} catch {
    Write-Error "Expo CLI가 설치되지 않았습니다. 'npm install -g @expo/cli'를 실행하세요."
    exit 1
}

Write-Success "환경 확인 완료"

# 2️⃣ 환경변수 설정
Write-Info "환경변수 설정 중..."

if (-not $FirebaseProjectId) {
    $FirebaseProjectId = Read-Host "Firebase 프로젝트 ID를 입력하세요"
}

if (-not $KakaoMobilityKey) {
    $KakaoMobilityKey = Read-Host "Kakao Mobility API 키를 입력하세요"
}

if (-not $KakaoJsKey) {
    $KakaoJsKey = Read-Host "Kakao JavaScript API 키를 입력하세요"
}

if (-not $FirebaseApiKey) {
    $FirebaseApiKey = Read-Host "Firebase API 키를 입력하세요"
}

if (-not $FirebaseAuthDomain) {
    $FirebaseAuthDomain = Read-Host "Firebase Auth Domain을 입력하세요"
}

if (-not $FirebaseStorageBucket) {
    $FirebaseStorageBucket = Read-Host "Firebase Storage Bucket을 입력하세요"
}

if (-not $FirebaseMessagingSenderId) {
    $FirebaseMessagingSenderId = Read-Host "Firebase Messaging Sender ID를 입력하세요"
}

if (-not $FirebaseAppId) {
    $FirebaseAppId = Read-Host "Firebase App ID를 입력하세요"
}

Write-Success "환경변수 설정 완료"

# 3️⃣ Firebase Functions 배포
Write-Info "Firebase Functions 배포 중..."

Set-Location "../functions"

# 의존성 설치
Write-Info "Functions 의존성 설치 중..."
npm install

# Firebase 프로젝트 설정
Write-Info "Firebase 프로젝트 설정 중..."
firebase use $FirebaseProjectId

# Kakao API 키 설정
Write-Info "Kakao API 키 설정 중..."
firebase functions:config:set kakao.key="$KakaoMobilityKey"

# n8n 웹훅 설정 (선택사항)
if ($N8nWebhookUrl) {
    firebase functions:config:set n8n.webhook="$N8nWebhookUrl"
    Write-Info "n8n 웹훅 설정 완료"
}

# Functions 배포
Write-Info "Firebase Functions 배포 중..."
firebase deploy --only functions:getKakaoDirections

Write-Success "Firebase Functions 배포 완료"

# 4️⃣ 모바일 앱 빌드 준비
Write-Info "모바일 앱 빌드 준비 중..."

Set-Location "../mobile"

# 의존성 설치
Write-Info "모바일 앱 의존성 설치 중..."
npm install

# Expo 로그인 확인
Write-Info "Expo 로그인 상태 확인 중..."
try {
    $expoUser = expo whoami
    Write-Success "Expo 로그인 완료: $expoUser"
} catch {
    Write-Warning "Expo에 로그인되지 않았습니다."
    expo login
}

# 5️⃣ app.json 업데이트
Write-Info "app.json 설정 업데이트 중..."

$appJsonPath = "app.json"
$appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json

# Firebase Functions URL 업데이트
$functionsUrl = "https://asia-northeast3-$FirebaseProjectId.cloudfunctions.net/getKakaoDirections"
$appJson.expo.extra.functionsProxy = $functionsUrl

# Kakao 키 업데이트
$appJson.expo.extra.kakaoAppKey = $KakaoJsKey

# Firebase 설정 업데이트
$appJson.expo.extra.firebase.apiKey = $FirebaseApiKey
$appJson.expo.extra.firebase.authDomain = $FirebaseAuthDomain
$appJson.expo.extra.firebase.projectId = $FirebaseProjectId
$appJson.expo.extra.firebase.storageBucket = $FirebaseStorageBucket
$appJson.expo.extra.firebase.messagingSenderId = $FirebaseMessagingSenderId
$appJson.expo.extra.firebase.appId = $FirebaseAppId

# app.json 저장
$appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath

Write-Success "app.json 설정 완료"

# 6️⃣ EAS 빌드 설정
Write-Info "EAS 빌드 설정 중..."

# EAS 설정 초기화
npx eas build:configure

Write-Success "EAS 빌드 설정 완료"

# 7️⃣ 빌드 실행
Write-Info "빌드 시작 중..."

$buildCommand = "npx eas build --platform $Platform --profile $BuildProfile"

if ($BuildProfile -eq "production") {
    Write-Warning "프로덕션 빌드는 스토어 제출용입니다. 시간이 오래 걸릴 수 있습니다."
}

Write-Info "실행 명령: $buildCommand"
Invoke-Expression $buildCommand

Write-Success "빌드 완료!"

# 8️⃣ 스토어 제출 (선택사항)
if ($SubmitToStore) {
    Write-Info "스토어 제출 중..."
    
    if ($Platform -eq "all" -or $Platform -eq "ios") {
        Write-Info "iOS 스토어 제출 중..."
        npx eas submit --platform ios --latest
    }
    
    if ($Platform -eq "all" -or $Platform -eq "android") {
        Write-Info "Android 스토어 제출 중..."
        npx eas submit --platform android --latest
    }
    
    Write-Success "스토어 제출 완료!"
}

# 9️⃣ 웹 호스팅 (선택사항)
if ($DeployWeb) {
    Write-Info "웹 버전 빌드 중..."
    
    # 웹 빌드
    npx expo export --platform web
    
    # Firebase 호스팅 배포
    Set-Location "../"
    
    if (-not (Test-Path "firebase.json")) {
        Write-Info "Firebase 호스팅 초기화 중..."
        firebase init hosting
    }
    
    Write-Info "Firebase 호스팅 배포 중..."
    firebase deploy --only hosting
    
    Write-Success "웹 버전 배포 완료!"
}

# 🔟 배포 완료
Write-Success "🎉 야고 비서 원클릭 배포가 완료되었습니다!"
Write-Host ""
Write-Host "📱 앱 정보:" -ForegroundColor $Blue
Write-Host "   - Firebase Functions: $functionsUrl" -ForegroundColor $Blue
Write-Host "   - EAS 빌드: https://expo.dev/accounts/$expoUser/projects/yago-assistant" -ForegroundColor $Blue

if ($DeployWeb) {
    Write-Host "   - 웹 버전: https://$FirebaseProjectId.web.app" -ForegroundColor $Blue
}

Write-Host ""
Write-Host "🔧 다음 단계:" -ForegroundColor $Yellow
Write-Host "   1. EAS 빌드 완료 후 다운로드 링크 확인" -ForegroundColor $Yellow
Write-Host "   2. 앱 설치 및 테스트" -ForegroundColor $Yellow
Write-Host "   3. 스토어 제출 (프로덕션 빌드인 경우)" -ForegroundColor $Yellow
Write-Host "   4. 사용자 피드백 수집" -ForegroundColor $Yellow

Write-Host ""
Write-Host "📞 지원:" -ForegroundColor $Green
Write-Host "   - Firebase Console: https://console.firebase.google.com/project/$FirebaseProjectId" -ForegroundColor $Green
Write-Host "   - Expo Dashboard: https://expo.dev/accounts/$expoUser/projects/yago-assistant" -ForegroundColor $Green

Write-Host ""
Write-Success "배포 완료! 🚀"

# 원래 디렉토리로 복귀
Set-Location "mobile"
