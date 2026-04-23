/**
 * User domain types.
 *
 * Central source of truth for the User entity shared between
 * `services/userService`, `components/users/*`, and any other
 * consumer that needs to talk about users or their permissions.
 */

/**
 * Platform roles. Each role maps to a distinct set of UI/navigation
 * permissions enforced by `components/ui/AppSidebar.tsx`.
 */
export enum UserTypeEnum {
  ADMIN = 'ADMIN',
  DESIGNER = 'DESIGNER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  PLATFORM_OPERATOR = 'PLATFORM_OPERATOR',
  FIELD_CREW_MEMBER = 'FIELD_CREW_MEMBER',
  ENGINEER_SPECIALIST = 'ENGINEER_SPECIALIST',
}

/** Lifecycle state of a user account. */
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

/** Canonical User record as returned by the backend. */
export interface User {
  id: string;
  name: string;
  type: UserTypeEnum;
  status: Status;
}

/**
 * Payload accepted by `POST /users`. Differs from `User` in that
 * the caller also supplies the initial password.
 */
export interface CreateUserInput {
  id: string;
  name: string;
  type: UserTypeEnum;
  status: Status;
  password: string;
}

/** Signature for the create handler passed to `CreateUserDialog`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreateUserFn = (data: CreateUserInput) => Promise<any>;

/** Signature for the update handler passed to `EditUserDialog`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UpdateUserFn = (id: string, data: any) => Promise<any>;
