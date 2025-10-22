import { useSearchParams } from "react-router-dom";
import InfiniteGrid from "@/features/lists/InfiniteGrid";
import { usePageAI } from "@/voice/pageAI/usePageAI";
import { makeMarketPlugin } from "./market.ai";
import PageAITips from "@/voice/pageAI/PageAITips";

export default function MarketListPage() {
  usePageAI("market", makeMarketPlugin());
  const [sp] = useSearchParams();
  const cat = sp.get("cat") || undefined;
  const sort = sp.get("sort") || undefined;
  const loc = sp.get("loc") || undefined;

  // 정렬 설정
  let orderByField = "createdAt";
  let orderDirection: "desc" | "asc" = "desc";
  if (sort === "price_asc") { orderByField = "price"; orderDirection = "asc"; }
  if (sort === "price_desc") { orderByField = "price"; orderDirection = "desc"; }

  // 필터 설정
  const whereEquals: Array<{ field: string; value: any }> = [];
  if (cat) whereEquals.push({ field: "category", value: cat });
  if (loc) whereEquals.push({ field: "location", value: loc });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-4">축구마켓{cat ? ` - ${cat}` : ''}</h1>
      <PageAITips />
      <InfiniteGrid 
        collectionName="market"
        whereEquals={whereEquals.length > 0 ? whereEquals : undefined}
        orderByField={orderByField}
        orderDirection={orderDirection}
      />
    </div>
  );
}