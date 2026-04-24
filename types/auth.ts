/**
 * Auth / session types.
 *
 * What the login endpoint returns and what we persist to
 * `sessionStorage`. Consumers should read the session through
 * `lib/auth.ts` helpers rather than parsing sessionStorage directly.
 */

import type { User } from './user';

/**
 * Logged-in user record persisted to `sessionStorage` as
 * `currentUser`. Same shape as `User` — kept as a distinct alias so
 * it's clear at call sites that this value came from the session
 * (and might be null if no one is logged in).
 */
export type CurrentUser = User;

/** Full payload produced by the login endpoint. */
export interface AuthSession {
  token: string;
  user: CurrentUser;
}
