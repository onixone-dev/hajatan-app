export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Skeleton card */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-batik-100 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-batik-100 rounded-lg w-3/4" />
            <div className="h-4 bg-cream-200 rounded-lg w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
