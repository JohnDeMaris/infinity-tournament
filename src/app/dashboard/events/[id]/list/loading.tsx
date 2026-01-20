import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ArmyListLoading() {
  return (
    <div className="container max-w-2xl py-8">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-64 mb-8" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Faction selector */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Army code textarea */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>

          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
