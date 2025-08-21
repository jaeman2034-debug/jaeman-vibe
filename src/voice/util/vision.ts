export async function analyzeProduct(imageUrl?: string) {
  // 실제 구현: 서버 라우트 POST /api/vision/analyze { imageUrl } → LLM/Vision (예: OpenAI, Vertex 등)
  // 여기서는 데모 응답
  return {
    category: "축구화(추정)",
    brand: "Adidas(추정)",
    confidence: 0.78,
    imageUrl: imageUrl || null,
    tips: ["가격대를 입력하면 추천가를 제안할 수 있어요", "정면/측면 2장 이상 촬영 시 정확도↑"],
  };
} 