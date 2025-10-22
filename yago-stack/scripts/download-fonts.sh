#!/bin/bash
# 한글 폰트 다운로드 스크립트

echo "🔤 한글 폰트를 다운로드합니다..."

# 폰트 디렉터리 생성
mkdir -p services/og/fonts

# Noto Sans KR 폰트 다운로드
echo "📥 Noto Sans KR 폰트 다운로드 중..."
wget -O services/og/fonts/NotoSansKR-Regular.otf \
  "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Korean/NotoSansKR-Regular.otf"

# 다운로드 확인
if [ -f "services/og/fonts/NotoSansKR-Regular.otf" ]; then
  echo "✅ Noto Sans KR 폰트 다운로드 완료"
  echo "📁 위치: services/og/fonts/NotoSansKR-Regular.otf"
else
  echo "❌ 폰트 다운로드 실패"
  echo "💡 수동으로 다운로드하세요:"
  echo "   https://fonts.google.com/noto/specimen/Noto+Sans+KR"
  echo "   또는 https://github.com/googlefonts/noto-cjk"
fi

echo ""
echo "🎉 폰트 설정 완료!"
echo "이제 OG 이미지에서 한글이 정상적으로 표시됩니다."
