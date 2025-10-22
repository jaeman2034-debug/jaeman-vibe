export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl shadow p-3">
      <div className="w-full aspect-square bg-gray-200 rounded-xl mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  );
}
