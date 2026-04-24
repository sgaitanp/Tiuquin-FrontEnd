'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { clearAuthSession, getCurrentUser } from '@/lib/auth';

function Ms({ icon, className }: { icon: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined select-none', className)}>
      {icon}
    </span>
  );
}

const ALL_NAV_ITEMS = [
  {
    label: 'Projects',
    href: '/dashboard/projects',
    icon: 'folder_open',
    roles: ['ADMIN', 'PROJECT_MANAGER', 'PLATFORM_OPERATOR'],
  },
  {
    label: 'Surveys',
    href: '/dashboard/surveys',
    icon: 'assignment',
    roles: [
      'ADMIN',
      'PROJECT_MANAGER',
      'PLATFORM_OPERATOR',
      'FIELD_CREW_MEMBER',
    ],
  },
  {
    label: 'Responses',
    href: '/dashboard/responses',
    icon: 'rate_review',
    roles: ['ADMIN', 'PROJECT_MANAGER', 'PLATFORM_OPERATOR'],
  },
  {
    label: 'Templates',
    href: '/dashboard/templates',
    icon: 'description',
    roles: ['ADMIN', 'PROJECT_MANAGER', 'DESIGNER'],
  },
  { label: 'Users', href: '/dashboard/users', icon: 'group', roles: ['ADMIN'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = React.useState('');

  React.useEffect(() => {
    setRole(getCurrentUser()?.type ?? '');
  }, []);

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <img
          src="/assets/tiuquin_logo.png"
          alt="Tiuquin"
          className="h-8 w-auto object-contain"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Ms icon={item.icon} className="text-xl" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={() => {
            clearAuthSession();
            router.push('/login');
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Ms icon="logout" className="text-xl" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
