FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apk update && apk add --no-cache \
    wget \
    curl \
    && rm -rf /var/cache/apk/*

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치 (production only)
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY . .

# 사용자 생성 (보안 강화)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S castbridge -u 1001

# 소유권 변경
RUN chown -R castbridge:nodejs /app
USER castbridge

# 포트 노출
EXPOSE 4000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

# 서버 시작
CMD ["npm", "start"]
