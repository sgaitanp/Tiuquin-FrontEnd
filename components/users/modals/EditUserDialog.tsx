/**
 * Modal dialog for editing an existing user. Visibility is driven
 * by the presence of the `user` prop: a non-null value opens the
 * dialog and seeds the form with that user's current values.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
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
  type CreateUserInput,
  type UpdateUserFn,
  type User,
} from '@/types/user';
import { formatUserType } from '../common/shared';

interface EditUserDialogProps {
  /** The user being edited. `null` hides the dialog. */
  user: User | null;
  /** Called when the dialog requests to open or close. */
  onOpenChange: (open: boolean) => void;
  /** Invoked with the user id and the updated payload on submit. */
  onSubmit: UpdateUserFn;
}

export function EditUserDialog({
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

  // Re-seed the form whenever a different user is selected so the
  // dialog always reflects the latest values from the parent list.
  useEffect(() => {
    if (user)
      setForm({
        id: user.id,
        name: user.name,
        type: user.type,
        status: user.status,
      });
  }, [user]);

  // Validates the name field and forwards the trimmed payload.
  // Relies on `user` being non-null while the dialog is open, so
  // the non-null assertion on `user!.id` is safe here.
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
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
