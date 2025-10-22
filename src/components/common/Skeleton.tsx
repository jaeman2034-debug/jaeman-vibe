export function CardSkeleton() {
  return <div className="p-4 rounded-2xl border bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10 animate-pulse">
    <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded mb-2" />
    <div className="h-3 w-36 bg-gray-200 dark:bg-white/10 rounded" />
    <div className="mt-3 h-20 rounded-xl bg-gray-100 dark:bg-white/5" />
  </div>;
}

export function EmptyState({ text="?°ì´?°ê? ?†ìŠµ?ˆë‹¤." }: { text?: string }) {
  return (
    <div className="col-span-full py-10 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}
