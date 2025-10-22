export interface ProductAnalysis {
  category: string | null;
  brand: string | null;
  confidence: number | null; // 0.0 ~ 1.0
  imageUrl: string | null;
  tips: string[];
}

/**
 * TODO: server integration later.
 * Temporary mock: will be replaced by POST /api/vision/analyze { imageUrl } ??LLM/Vision response.
 */
export async function analyzeProduct(
  imageUrl?: string
): Promise<ProductAnalysis> {
  return {
    category: "축구??추정)",
    brand: "Adidas(추정)",
    confidence: 0.78,
    imageUrl: imageUrl ?? null,
    tips: [
      "가격을 ?�력?�면 추천가�??�안?�드?�요",
      "?�면/측면 2???�상 촬영 ???�확????,
    ],
  };
} 
