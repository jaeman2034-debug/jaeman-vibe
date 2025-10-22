import { formatKRW, shareOrCopy } from '@/utils/ui';
import { useSaves } from '@/hooks/useSaves';

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    price: number;
    region: string;
    timeAgo?: string;
    images?: string[];
    category?: string;
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  const { isSaved, toggle } = useSaves();
  
  return (
    <div className="relative rounded-2xl border bg-white/90 dark:bg-zinc-900 overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button 
          aria-label="공유" 
          onClick={() => shareOrCopy({ title: item.title, url: location.href })}
          className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          🔗
        </button>
        <button 
          aria-label="저장" 
          onClick={() => toggle(`item:${item.id}`, {
            title: item.title,
            type: 'item',
            price: item.price,
            region: item.region
          })}
          className={`px-2 py-1 rounded-lg transition-colors ${
            isSaved(`item:${item.id}`) 
              ? 'bg-yellow-400 text-black' 
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          ⭐
        </button>
      </div>
      <div className="h-40 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
        {item.images && item.images[0] ? (
          <img 
            src={item.images[0]} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-zinc-400">이미지 없음</div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold line-clamp-2">{item.title}</div>
        <div className="text-brand font-bold">{formatKRW(item.price)}</div>
        <div className="text-xs text-zinc-500">{item.region} · {item.timeAgo || '방금 전'}</div>
      </div>
    </div>
  );
}
