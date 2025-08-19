# Firebase 데이터 구조 & 보안 규칙

## 📊 데이터 구조

### **1. 상품 아이템 (market_items/{id})**
```typescript
interface MarketItem {
  id: string;                    // 문서 ID
  title: string;                 // 상품 제목
  description: string;           // 상품 설명
  price: number;                 // 가격
  category: '축구화' | '유니폼' | '보호장비' | '볼/장비' | '트레이닝' | '기타';
  region: '서울' | '부산' | '대구' | ...;  // 17개 시도
  images: string[];              // 이미지 URL 배열
  ownerId: string;               // 판매자 UID
  createdAt: Timestamp;          // 등록 시간
  status: 'active' | 'sold';     // 상품 상태
}
```

### **2. 사용자 (users/{uid})**
```typescript
interface User {
  uid: string;                   // 사용자 UID
  nickname: string;              // 닉네임
  phone?: string;                // 전화번호 (선택)
  profileImage?: string;         // 프로필 이미지 URL (선택)
  createdAt: Timestamp;          // 가입 시간
  updatedAt: Timestamp;          // 수정 시간
}
```

### **3. 채팅방 (chats/{roomId})**
```typescript
interface ChatRoom {
  id: string;                    // 채팅방 ID
  itemId: string;                // 상품 ID
  buyerId: string;               // 구매자 UID
  sellerId: string;              // 판매자 UID
  lastMessage?: string;          // 마지막 메시지
  lastMessageAt?: Timestamp;     // 마지막 메시지 시간
  createdAt: Timestamp;          // 생성 시간
  updatedAt: Timestamp;          // 수정 시간
}
```

### **4. 채팅 메시지 (chats/{roomId}/messages/{mid})**
```typescript
interface ChatMessage {
  id: string;                    // 메시지 ID
  roomId: string;                // 채팅방 ID
  senderId: string;              // 발신자 UID
  content: string;               // 메시지 내용
  type: 'text' | 'image' | 'offer';  // 메시지 타입
  createdAt: Timestamp;          // 발신 시간
}
```

### **5. 찜하기 (favorites/{uid}/items/{itemId})**
```typescript
interface Favorite {
  id: string;                    // 찜하기 ID
  userId: string;                // 사용자 UID
  itemId: string;                // 상품 ID
  createdAt: Timestamp;          // 찜하기 시간
}
```

### **6. 가격 제안 (offers/{itemId}/{offerId})**
```typescript
interface Offer {
  id: string;                    // 제안 ID
  itemId: string;                // 상품 ID
  buyerId: string;               // 구매자 UID
  price: number;                 // 제안 가격
  message?: string;              // 제안 메시지 (선택)
  status: 'pending' | 'accepted' | 'rejected';  // 제안 상태
  createdAt: Timestamp;          // 제안 시간
  updatedAt: Timestamp;          // 수정 시간
}
```

## 🔐 보안 규칙 (간소화 버전)

### **개발 환경 (에뮬레이터)**
- **Firestore**: 모든 읽기/쓰기 허용
- **Storage**: 모든 읽기/쓰기 허용
- **목적**: 개발 편의성

### **프로덕션 환경**
- **Firestore**: 기본적인 인증 및 소유권 검사
- **Storage**: 상품 이미지만 제한적 업로드 허용
- **목적**: 핵심 보안 보장 + 유지보수 용이성

## 🚀 사용 방법

### **1. 개발 환경**
```bash
# 에뮬레이터 실행
firebase emulators:start

# 개발용 규칙 사용
# firestore.rules, storage.rules (모든 허용)
```

### **2. 프로덕션 환경**
```bash
# 프로덕션 규칙 배포
firebase deploy --only firestore:rules
firebase deploy --only storage

# 프로덕션용 규칙 사용
# firestore.rules.production, storage.rules.production
```

## 📁 Storage 경로 구조

```
storage/
├── products/{uid}/{timestamp}-{filename}  # 상품 이미지 (10MB 제한)
├── profiles/{uid}/{filename}              # 프로필 이미지
└── chats/{roomId}/{timestamp}-{filename}  # 채팅 이미지
```

## 🔒 핵심 보안 원칙

### **Storage 보안**
- **상품 이미지**: `/products/{uid}/` 경로에만 업로드 허용
- **파일 크기**: 10MB 제한
- **파일 타입**: 이미지 파일만 허용
- **소유권**: 자신의 UID 폴더에만 쓰기 가능
- **읽기**: 모든 사용자에게 허용

### **Firestore 보안**
- **읽기**: 모든 사용자에게 허용 (상품 목록 공개)
- **생성**: 인증된 사용자만, 자신의 UID를 ownerId로 설정
- **수정/삭제**: 소유자만 가능

## ⚠️ 주의사항

1. **개발 환경**: 에뮬레이터에서만 개발용 규칙 사용
2. **프로덕션 환경**: 반드시 보안 규칙 적용
3. **파일 업로드**: 적절한 크기 제한 및 타입 검증
4. **사용자 인증**: 모든 민감한 작업에 인증 필요
5. **데이터 검증**: 클라이언트와 서버 양쪽에서 검증

## 🔄 마이그레이션

개발에서 프로덕션으로 전환 시:

1. `firestore.rules.production` → `firestore.rules`로 복사
2. `storage.rules.production` → `storage.rules`로 복사
3. `firebase deploy`로 규칙 배포
4. 환경 변수 `VITE_USE_EMULATORS=0`으로 설정

## 💡 보안 규칙 특징

### **장점**
- **간단함**: 복잡한 함수나 조건 없이 핵심 보안만 보장
- **유지보수**: 규칙 변경 시 쉽게 수정 가능
- **성능**: 복잡한 검증 로직으로 인한 성능 저하 없음
- **이해도**: 개발자가 쉽게 이해하고 적용 가능

### **적용 범위**
- **현재**: `market_items` 컬렉션과 상품 이미지 업로드
- **향후**: 필요에 따라 다른 컬렉션 규칙 추가 가능
- **확장성**: 채팅, 찜하기 등 기능 추가 시 규칙 확장 