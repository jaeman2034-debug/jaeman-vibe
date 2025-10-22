export default function SkeletonCard() {
  return (
    <div className="border p-4 rounded-lg animate-pulse bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
        <div className="flex-1">
          <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="h-40 w-full bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
      <div className="h-3 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );
}
