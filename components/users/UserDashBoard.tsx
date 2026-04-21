'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserTypeEnum {
  ADMIN = 'ADMIN',
  DESIGNER = 'DESIGNER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  PLATFORM_OPERATOR = 'PLATFORM_OPERATOR',
  FIELD_CREW_MEMBER = 'FIELD_CREW_MEMBER',
  ENGINEER_SPECIALIST = 'ENGINEER_SPECIALIST',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  type: UserTypeEnum;
  status: Status;
}

export interface CreateUserInput {
  id: string;
  name: string;
  type: UserTypeEnum;
  status: Status;
  password: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreateUserFn = (data: CreateUserInput) => Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UpdateUserFn = (id: string, data: any) => Promise<any>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUserType(type: UserTypeEnum): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
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

function TypeBadge({ type }: { type: UserTypeEnum }) {
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

function UserAvatar({ name, status }: { name: string; status: Status }) {
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

function StatCard({
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

// ─── Create User Dialog ───────────────────────────────────────────────────────

const makeEmptyForm = (): CreateUserInput => ({
  id: '',
  name: '',
  type: UserTypeEnum.FIELD_CREW_MEMBER,
  status: Status.ACTIVE,
  password: '',
});

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: CreateUserFn;
}

function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateUserDialogProps): React.ReactElement | null {
  const [form, setForm] = useState<CreateUserInput>(makeEmptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.id.trim()) {
      setError('User ID is required.');
      return;
    }
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.password.trim()) {
      setError('Password is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({ ...form, name: form.name.trim(), id: form.id.trim() });
      setForm(makeEmptyForm());
      onOpenChange(false);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          setForm(makeEmptyForm());
          setError('');
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cu-id">
              User ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cu-id"
              placeholder="e.g. USR-004"
              value={form.id}
              className="font-mono text-xs"
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cu-name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cu-name"
              placeholder="e.g. Jane Smith"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, type: v as UserTypeEnum }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UserTypeEnum).map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatUserType(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as Status }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Status).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cu-password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cu-password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              disabled={loading}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

interface EditUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: UpdateUserFn;
}

function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
}: EditUserDialogProps): React.ReactElement | null {
  const [form, setForm] = useState<Omit<CreateUserInput, 'password'>>({
    id: user?.id ?? '',
    name: user?.name ?? '',
    type: user?.type ?? UserTypeEnum.FIELD_CREW_MEMBER,
    status: user?.status ?? Status.ACTIVE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user)
      setForm({
        id: user.id,
        name: user.name,
        type: user.type,
        status: user.status,
      });
  }, [user]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(user!.id, { ...form, name: form.name.trim() });
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
      console.error('Edit user error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!user}
      onOpenChange={(v) => {
        if (!loading) {
          setError('');
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eu-name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eu-name"
              placeholder="e.g. Jane Smith"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, type: v as UserTypeEnum }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UserTypeEnum).map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatUserType(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as Status }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Status).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

interface UserDashboardProps extends React.ComponentProps<'div'> {}

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
