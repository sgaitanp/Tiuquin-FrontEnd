/**
 * Summary tile used across the user-management header to surface
 * aggregate counts (total, active, inactive, pending).
 */

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * @param title       Short label shown above the value (e.g. "Active").
 * @param value       Numeric figure rendered prominently.
 * @param icon        Decorative icon node rendered on the right.
 * @param description Secondary caption shown below the value.
 */
export function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
