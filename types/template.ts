/**
 * Template domain types.
 *
 * Central source of truth for survey templates and the question
 * structure beneath them. Shared between `services/templateService`,
 * the template builder UI, and the survey-filling UI.
 *
 * Wire-format convention: `type` and `acceptedFileType` are stored
 * lowercase in memory and UPPERCASE on the wire. The mappers in
 * `templateService.ts` handle the conversion.
 */

/** Lifecycle state of a template version. */
export const TEMPLATE_STATUSES = [
  'IN_DESIGN',
  'IN_REVISION',
  'APPROVED',
] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

/** All question types the template builder can produce. */
export const QUESTION_TYPES = [
  'text',
  'single_select',
  'multi_select',
  'file',
  'geolocation',
  'multi_measurement',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Allowed file categories for a `file`-type question. */
export const ACCEPTED_FILE_TYPES = [
  'image',
  'pdf',
  'doc',
  'excel',
  'video',
  'audio',
] as const;
export type AcceptedFileType = (typeof ACCEPTED_FILE_TYPES)[number];

/**
 * A single choice on a `single_select` or `multi_select` question.
 * `followUpQuestionId` links a single-select option to a question
 * that only becomes relevant when this option is chosen.
 */
export interface Option {
  id: string;
  text: string;
  order: number;
  followUpQuestionId?: string | null;
}

/**
 * A question inside a section. The set of fields that applies
 * depends on `type` — `options` is only populated for select
 * variants, `acceptedFileType` only for `file`, and the
 * `required*` / `referencePointLabel` / `measurementUnit` trio
 * only for `multi_measurement`.
 */
export interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  order: number;
  isFollowUp?: boolean;
  acceptedFileType?: AcceptedFileType | null;
  options?: Option[] | null;
  requiredReadings?: number | null;
  referencePointLabel?: string | null;
  measurementUnit?: string | null;
}

/** A logical grouping of questions inside a template. */
export interface Section {
  id: string;
  name: string;
  description?: string;
  order: number;
  questions: Question[];
}

/**
 * A versioned survey template. Multiple `Template` records can
 * share a `groupId` — each then represents a distinct version
 * (`version` is a numeric string, e.g. "1.0", "2.0"). Only one
 * version at a time should be in `APPROVED` status.
 */
export interface Template {
  id: string;
  groupId: string;
  name: string;
  version: string;
  status: TemplateStatus;
  createdAt: string;
  sections: Section[];
}

/**
 * A "template group" is the bag of versions that share a `groupId`.
 * Built client-side in `TemplateDashboard.load` from the flat list
 * returned by the backend — no dedicated endpoint.
 */
export interface TemplateGroup {
  groupId: string;
  name: string;
  versions: Template[];
}
