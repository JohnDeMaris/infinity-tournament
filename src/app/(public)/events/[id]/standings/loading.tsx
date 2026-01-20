import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-5 w-6" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-5 w-8 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-5 w-10 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-5 w-10 ml-auto" />
      </TableCell>
      <TableCell className="text-center">
        <Skeleton className="h-5 w-16 mx-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-5 w-8 ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export default function StandingsLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Skeleton className="h-6 w-12" />
          <div className="hidden md:flex items-center space-x-6 ml-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      <main className="flex-1 container py-8">
        <div className="mb-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-9 w-64 mb-1" />
          <Skeleton className="h-5 w-48" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Faction</TableHead>
                    <TableHead className="text-right">OP</TableHead>
                    <TableHead className="text-right">VP</TableHead>
                    <TableHead className="text-right">AP</TableHead>
                    <TableHead className="text-center">W-L-D</TableHead>
                    <TableHead className="text-right">SoS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
