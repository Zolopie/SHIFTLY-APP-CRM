import { Skeleton } from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-[#0B1220] border border-white/5 rounded-xl p-5 space-y-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-[#0B1220] border border-white/5 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-full" />
        </div>

        <div className="bg-[#0B1220] border border-white/5 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>

    </div>
  );
}