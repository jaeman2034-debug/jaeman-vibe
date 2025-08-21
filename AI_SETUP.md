# AI 상품 분석 기능 설정 가이드

## 🚀 빠른 시작

### 1. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# .env
OPENAI_API_KEY=***REMOVED***
KAKAO_REST_KEY=your_kakao_rest_api_key_here
PORT=3001
NODE_ENV=development
MAX_IMAGE_SIZE=10485760
```

### 2. OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. API Keys 메뉴에서 새 키 생성
3. 생성된 키를 `.env` 파일의 `OPENAI_API_KEY`에 설정

### 3. 서버 실행

```bash
# 개발 모드
npm run dev:api

# 또는 직접 실행
node server.cjs
```

## 🔧 상세 설정

### 서버 설정 (server.cjs)

- **포트**: 3001 (기본값)
- **CORS**: 개발/프로덕션 환경별 설정
- **이미지 제한**: 최대 10MB
- **타임아웃**: 30초

### AI 모델 설정

- **모델**: GPT-4o-mini (비용 효율적)
- **온도**: 0.2 (일관된 결과)
- **최대 토큰**: 500
- **이미지 상세도**: low (비용 절약)

## 📱 사용법

### 1. 컴포넌트 사용

```tsx
import { AIProductAnalysis } from '@/components/ai/AIProductAnalysis';

function MyPage() {
  const handleAnalysisComplete = (result) => {
    console.log('AI 분석 결과:', result);
    // 상품 등록 폼에 결과 적용
  };

  return (
    <AIProductAnalysis
      onAnalysisComplete={handleAnalysisComplete}
      onClose={() => {/* 모달 닫기 */}}
    />
  );
}
```

### 2. 훅 직접 사용

```tsx
import { useAIFeatures } from '@/hooks/useAIFeatures';

function MyComponent() {
  const { analyzeProductImage, isAnalyzing, lastAnalysis } = useAIFeatures();

  const handleImageUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const result = await analyzeProductImage(base64);
      if (result) {
        console.log('분석 완료:', result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
      {isAnalyzing && <p>분석 중...</p>}
      {lastAnalysis && <pre>{JSON.stringify(lastAnalysis, null, 2)}</pre>}
    </div>
  );
}
```

## 🛡️ 보안 및 에러 처리

### 보안 기능

- **API 키 검증**: 서버 시작 시 환경변수 확인
- **이미지 크기 제한**: 10MB 초과 차단
- **이미지 형식 검증**: JPG, PNG, WebP만 허용
- **CORS 설정**: 허용된 도메인만 접근 가능

### 에러 코드

| 코드 | 설명 | 해결 방법 |
|------|------|-----------|
| `openai-key-missing` | OpenAI API 키 누락 | `.env` 파일에 API 키 설정 |
| `image-too-large` | 이미지 크기 초과 | 10MB 이하로 압축 |
| `invalid-image-format` | 지원하지 않는 형식 | JPG, PNG, WebP 사용 |
| `openai-unauthorized` | API 키 인증 실패 | API 키 확인 및 갱신 |
| `openai-rate-limit` | 사용량 초과 | 잠시 후 재시도 |
| `ai-timeout` | 분석 시간 초과 | 네트워크 확인 후 재시도 |

### 에러 처리 예시

```tsx
const { analyzeProductImage, lastError } = useAIFeatures();

useEffect(() => {
  if (lastError) {
    switch (lastError.error) {
      case 'openai-rate-limit':
        alert('AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        break;
      case 'image-too-large':
        alert('이미지 크기가 너무 큽니다. 10MB 이하로 압축해주세요.');
        break;
      default:
        alert(`분석 실패: ${lastError.message}`);
    }
  }
}, [lastError]);
```

## 📊 성능 최적화

### 1. 이미지 최적화

- **압축**: WebP 형식 사용 권장
- **크기**: 1024x1024 이하 권장
- **품질**: 80-90% 품질로 압축

### 2. API 호출 최적화

- **배치 처리**: 여러 이미지 동시 분석
- **캐싱**: 동일 이미지 재분석 방지
- **재시도**: 실패 시 자동 재시도 (최대 3회)

### 3. 사용자 경험

- **로딩 상태**: 분석 진행률 표시
- **에러 복구**: 자동 재시도 및 수동 재시도
- **결과 미리보기**: 분석 결과 즉시 표시

## 🧪 테스트

### 1. 서버 상태 확인

```bash
curl http://localhost:3001/api/health
```

응답 예시:
```json
{
  "ok": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "openai": true,
    "kakao": true
  }
}
```

### 2. AI 분석 테스트

```bash
# 이미지 파일을 base64로 인코딩 후 테스트
curl -X POST http://localhost:3001/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "base64_encoded_image_here",
    "prompt": "이 스포츠용품을 분석해주세요"
  }'
```

## 🚨 문제 해결

### 일반적인 문제

1. **서버 시작 실패**
   - `.env` 파일 존재 확인
   - `OPENAI_API_KEY` 설정 확인
   - 포트 3001 사용 가능 여부 확인

2. **CORS 오류**
   - `server.cjs`의 CORS 설정 확인
   - 클라이언트 도메인이 허용 목록에 포함되어 있는지 확인

3. **이미지 분석 실패**
   - 이미지 형식 및 크기 확인
   - OpenAI API 키 유효성 확인
   - 네트워크 연결 상태 확인

4. **메모리 부족**
   - `MAX_IMAGE_SIZE` 환경변수 조정
   - 이미지 압축 강화

### 로그 확인

서버 콘솔에서 다음 로그를 확인하세요:

```
🚀 [SERVER] AI 상품 분석 서버 시작
📍 포트: http://localhost:3001
🤖 OpenAI: ✅
🗺️  Kakao: ✅
⏰ 시작시간: 2024-01-01T00:00:00.000Z
```

## 📈 모니터링

### 성능 지표

- **응답 시간**: 평균 분석 시간
- **성공률**: 분석 성공/실패 비율
- **에러율**: 에러 발생 빈도
- **사용량**: API 호출 횟수

### 로그 분석

```bash
# OpenAI API 에러 로그
grep "openai-unauthorized" server.log

# 이미지 크기 초과 로그
grep "image-too-large" server.log

# 분석 성공 로그
grep "분석 완료" server.log
```

## 🔄 업데이트

### 최신 버전 확인

```bash
npm update openai
npm update express
```

### 설정 파일 백업

```bash
cp .env .env.backup
cp server.cjs server.cjs.backup
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **로그 파일**: 서버 콘솔 출력
2. **환경변수**: `.env` 파일 설정
3. **의존성**: `package.json` 의존성 버전
4. **네트워크**: 방화벽 및 프록시 설정

---

**참고**: 이 가이드는 AI 상품 분석 기능의 기본 설정을 다룹니다. 프로덕션 환경에서는 추가적인 보안 및 모니터링 설정이 필요할 수 있습니다. 