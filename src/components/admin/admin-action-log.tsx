'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AdminLog } from '@/types/database';

interface AdminActionLogProps {
  logs: (AdminLog & {
    admin?: { name: string } | null;
  })[];
  maxItems?: number;
}

const actionLabels: Record<string, string> = {
  suspend_user: 'Suspended user',
  unsuspend_user: 'Unsuspended user',
  delete_tournament: 'Deleted tournament',
  delete_match: 'Deleted match',
  edit_user: 'Edited user',
};

const targetTypeColors: Record<string, string> = {
  user: 'bg-blue-500',
  tournament: 'bg-green-500',
  match: 'bg-purple-500',
  registration: 'bg-orange-500',
};

export function AdminActionLog({ logs, maxItems = 10 }: AdminActionLogProps) {
  const displayLogs = logs.slice(0, maxItems);

  if (displayLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Admin actions and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No admin activity yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Last {displayLogs.length} admin actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
            >
              {/* Target type badge */}
              <Badge
                variant="secondary"
                className={`${targetTypeColors[log.target_type] || 'bg-gray-500'} text-white shrink-0`}
              >
                {log.target_type}
              </Badge>

              {/* Action details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {actionLabels[log.action] || log.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {log.admin?.name || 'Unknown admin'}
                </p>
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {JSON.stringify(log.details)}
                  </p>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
