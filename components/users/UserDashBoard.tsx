'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Clock,
} from 'lucide-react';
import { getUsers, createUser, updateUser } from '@/services/userService';
import {
  UserTypeEnum,
  Status,
  type User,
  type CreateUserFn,
  type UpdateUserFn,
} from '@/types/user';
import { StatusBadge, TypeBadge, UserAvatar } from './common/UserBadges';
import { StatCard } from './common/StatCard';
import { CreateUserDialog } from './modals/CreateUserDialog';
import { EditUserDialog } from './modals/EditUserDialog';
import { formatUserType } from './common/shared';

type UserDashboardProps = React.ComponentProps<'div'>;

export function UserDashboard({ className, ...props }: UserDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<UserTypeEnum | 'ALL'>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === Status.ACTIVE).length,
      inactive: users.filter((u) => u.status === Status.INACTIVE).length,
      pending: users.filter((u) => u.status === Status.PENDING).length,
    }),
    [users],
  );

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const q = search.toLowerCase();
        return (
          (!q ||
            u.name.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q)) &&
          (statusFilter === 'ALL' || u.status === statusFilter) &&
          (typeFilter === 'ALL' || u.type === typeFilter)
        );
      }),
    [users, search, statusFilter, typeFilter],
  );

  const handleCreateUser: CreateUserFn = async (data) => {
    await createUser(data);
    const updated = await getUsers();
    setUsers(updated);
  };

  const handleUpdateUser: UpdateUserFn = async (id, data) => {
    await updateUser(id, data);
    const updated = await getUsers();
    setUsers(updated);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0f172a',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Loading users…
          </p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateUser}
      />
      <EditUserDialog
        user={editingUser}
        onOpenChange={(v) => {
          if (!v) setEditingUser(null);
        }}
        onSubmit={handleUpdateUser}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your team members and their permissions
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
          description="all roles"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<UserCheck className="h-5 w-5" />}
          description="currently active"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={<UserX className="h-5 w-5" />}
          description="no recent activity"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
          description="awaiting onboarding"
        />
      </div>

      {/* Table card */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CardTitle className="text-base font-semibold">All Users</CardTitle>
            <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-48 pl-8 text-sm"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as Status | 'ALL')}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.values(Status).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as UserTypeEnum | 'ALL')}
              >
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  {Object.values(UserTypeEnum).map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatUserType(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pl-6" />
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-14 text-center text-sm text-muted-foreground"
                  >
                    No users match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-6">
                      <UserAvatar name={user.name} status={user.status} />
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.id}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={user.type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingUser(user)}
                          >
                            Edit user
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <div className="flex items-center justify-between border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{' '}
            of{' '}
            <span className="font-medium text-foreground">{users.length}</span>{' '}
            users
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default UserDashboard;
