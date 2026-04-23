/**
 * Modal dialog that captures the fields required to create a new
 * user. Owns its form state locally and delegates persistence to
 * the parent via `onSubmit`.
 */

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Status,
  UserTypeEnum,
  type CreateUserFn,
  type CreateUserInput,
} from '@/types/user';
import { formatUserType, makeEmptyForm } from '../common/shared';

interface CreateUserDialogProps {
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** Called when the dialog requests to open or close. */
  onOpenChange: (open: boolean) => void;
  /** Invoked with the validated form payload on submit. */
  onSubmit: CreateUserFn;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateUserDialogProps): React.ReactElement | null {
  const [form, setForm] = useState<CreateUserInput>(makeEmptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validates required fields, forwards to the parent handler, and
  // resets the form on success. Trims user-supplied strings before
  // submission to avoid accidental whitespace-only values.
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
