/**
 * Project / SiteSurvey domain types.
 *
 * Central source of truth for the project hierarchy:
 *   Project → SiteSurvey[] → WorkOrder, Location, Contact, AssignedTo
 *
 * Shared between `services/projectService`, `services/surveyService`,
 * `components/projects/*`, and any other consumer that reasons about
 * projects or their site surveys.
 */

/**
 * Work order priority, as accepted by the backend.
 *
 * Declared as a const object + union type (rather than a TS enum)
 * so that plain string literals like `'HIGH'` remain assignable to
 * the `Priority` type — convenient when data arrives from the wire
 * or from a `<select>` input.
 */
export const Priority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

/** Lifecycle state of a site survey. Same const-object pattern as `Priority`. */
export const SiteSurveyStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
} as const;
export type SiteSurveyStatus =
  (typeof SiteSurveyStatus)[keyof typeof SiteSurveyStatus];

/**
 * Physical address attached to a site survey. Some endpoints embed
 * lat/lng inside the location block rather than at the survey root —
 * both fields are optional so the service-layer normalizers can
 * accept either shape.
 */
export interface Location {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number | null;
  longitude?: number | null;
}

/** Point of contact for a site survey. */
export interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

/**
 * Minimal user reference embedded in a site survey's `assignedTo`
 * field. Carries only the fields the UI needs to render.
 */
export interface AssignedTo {
  id: string;
  name: string;
}

/** Work order associated with a site survey. */
export interface WorkOrder {
  id: string;
  number: string;
  description: string;
  priority: Priority;
  createdBy: string;
  createdAt: string;
}

/**
 * A single site survey belonging to a project.
 *
 * `projectId`, `projectName`, `client`, and `responses` are projected
 * onto the survey by `projectService.getProjects` / `surveyService.*`
 * so the UI can render a survey in isolation without having to walk
 * back to its parent project.
 */
export interface SiteSurvey {
  id: string;
  name: string;
  status: SiteSurveyStatus;
  scheduledDate: string;
  location: Location;
  contact: Contact;
  workOrder: WorkOrder;
  assignedTo?: AssignedTo;
  templateId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  projectId?: string;
  projectName?: string;
  client?: string;
  responses?: Record<string, unknown>;
}

/** Top-level project record with its site surveys. */
export interface Project {
  id: string;
  name: string;
  client: string;
  siteSurveys: SiteSurvey[];
}
