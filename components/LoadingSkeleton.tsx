// components/LoadingSkeleton.tsx

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

export function TreeSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-3 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3"
          style={{ paddingLeft: `${(i % 3) * 24}px` }}
        >
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}
