/**
 * Shared helpers and defaults for the user management feature.
 *
 * Kept free of React imports so it can be consumed from both the
 * dashboard and any utility layer without pulling in JSX.
 */

import { Status, UserTypeEnum, type CreateUserInput } from '@/types/user';

/**
 * Renders a backend role code (e.g. `FIELD_CREW_MEMBER`) as a
 * human-readable label (e.g. `Field Crew Member`).
 */
export function formatUserType(type: UserTypeEnum): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns up to two uppercase initials for avatar placeholders.
 * Falls back gracefully when the name has a single token.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Default `CreateUserDialog` form state. Defined as a factory so
 * each dialog instance starts with its own object reference.
 */
export const makeEmptyForm = (): CreateUserInput => ({
  id: '',
  name: '',
  type: UserTypeEnum.FIELD_CREW_MEMBER,
  status: Status.ACTIVE,
  password: '',
});
