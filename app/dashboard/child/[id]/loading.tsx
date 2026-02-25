import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ChildDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        {/* Back link skeleton */}
        <Skeleton className="mb-6 h-5 w-36" />

        {/* Header skeleton */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Goal overview skeleton */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-3.5 w-full rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex gap-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            </CardContent>
          </Card>

          {/* Chart skeleton */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* History skeleton */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-44" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
