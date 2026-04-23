/**
 * Visual primitives for displaying a user's status, role, and avatar.
 *
 * Grouped into a single module because they are small, purely
 * presentational, and always rendered together inside the users
 * table row.
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Status, UserTypeEnum } from '@/types/user';
import { formatUserType, getInitials } from './shared';

/**
 * Coloured badge indicating the user's lifecycle state, with a
 * small status dot prepended for quick scanning.
 */
export function StatusBadge({ status }: { status: Status }) {
  const cfg: Record<Status, string> = {
    [Status.ACTIVE]:
      'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    [Status.INACTIVE]:
      'bg-slate-100  text-slate-500  border-slate-200  hover:bg-slate-100',
    [Status.PENDING]:
      'bg-amber-50   text-amber-600  border-amber-200  hover:bg-amber-50',
  };
  const dotCfg: Record<Status, string> = {
    [Status.ACTIVE]: 'bg-emerald-500',
    [Status.INACTIVE]: 'bg-slate-400',
    [Status.PENDING]: 'bg-amber-500 animate-pulse',
  };
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', cfg[status])}>
      <span
        className={cn(
          'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
          dotCfg[status],
        )}
      />
      {label}
    </Badge>
  );
}

/**
 * Coloured badge labelling the user's platform role. Colours are
 * role-specific and intended to be recognisable at a glance.
 */
export function TypeBadge({ type }: { type: UserTypeEnum }) {
  const cfg: Record<UserTypeEnum, string> = {
    [UserTypeEnum.ADMIN]: 'bg-violet-50 text-violet-700 border-violet-200',
    [UserTypeEnum.DESIGNER]: 'bg-pink-50   text-pink-700   border-pink-200',
    [UserTypeEnum.PROJECT_MANAGER]:
      'bg-blue-50   text-blue-700   border-blue-200',
    [UserTypeEnum.PLATFORM_OPERATOR]:
      'bg-cyan-50   text-cyan-700   border-cyan-200',
    [UserTypeEnum.FIELD_CREW_MEMBER]:
      'bg-orange-50 text-orange-700 border-orange-200',
    [UserTypeEnum.ENGINEER_SPECIALIST]:
      'bg-teal-50   text-teal-700   border-teal-200',
  };
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium whitespace-nowrap', cfg[type])}
    >
      {formatUserType(type)}
    </Badge>
  );
}

/**
 * Circular initials-based avatar with a status-coloured indicator
 * dot in the bottom-right corner.
 */
export function UserAvatar({ name, status }: { name: string; status: Status }) {
  const dotCfg: Record<Status, string> = {
    [Status.ACTIVE]: 'bg-emerald-500',
    [Status.INACTIVE]: 'bg-slate-300',
    [Status.PENDING]: 'bg-amber-400',
  };
  return (
    <div className="relative inline-flex flex-shrink-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border text-xs font-semibold text-muted-foreground select-none">
        {getInitials(name)}
      </div>
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
          dotCfg[status],
        )}
      />
    </div>
  );
}
