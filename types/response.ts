/**
 * Survey-response domain types.
 *
 * Models the read-side shape returned by `surveyService.getSiteSurveyResponses`
 * and consumed by the response-viewing UI (`SurveyResponsesDashboard`,
 * `ResponseDetail`, `ResponseSection`).
 *
 * Distinct from the write-side submission payload built inside
 * `surveyService.submitSurvey`, which is internal to that function.
 */

/** A file uploaded as part of an answer. */
export interface ResponseFile {
  id: string;
  /** MIME type as stored by the backend, e.g. `image/png`, `application/pdf`. */
  fileType: string;
  originalFilename: string;
  fileSize: number;
}

/**
 * A single point on a multi-measurement answer's floor plan. `order`
 * is the zero-based index the crew member recorded the point in.
 */
export interface Measurement {
  x: number;
  y: number;
  value: number;
  order: number;
}

/**
 * One worker's answer to one question, enriched with the question
 * metadata (text + type) so the viewer can render it standalone.
 *
 * Only a subset of the value fields is populated for any given
 * answer — which subset depends on `type`.
 */
export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  /** UPPERCASE wire format, e.g. `SINGLE_SELECT`, `MULTI_MEASUREMENT`. */
  type: string;

  // Scalar answers
  inputValue?: string | null;
  selectedOptionText?: string | null;

  // Geolocation
  latitude?: number | null;
  longitude?: number | null;

  // Multi-measurement
  referenceX?: number | null;
  referenceY?: number | null;
  referencePointLabel?: string | null;
  measurementUnit?: string | null;
  measurements?: Measurement[];

  // Files attached to any answer type
  files?: ResponseFile[];
}

/** A section's worth of answers inside a response. */
export interface SectionAnswers {
  sectionId: string;
  sectionName: string;
  questionAnswers: QuestionAnswer[];
}

/**
 * A single submitted response, enriched with survey / template /
 * worker metadata so the detail view can render without extra lookups.
 */
export interface ResponseDetail {
  responseId: string;
  siteSurveyName: string;
  templateName: string;
  workerName: string;
  submittedAt: string;
  sections: SectionAnswers[];
}

// ─── Fill-out (write-side) values ─────────────────────────────────────────────

/** Geolocation answer value. */
export interface GeoValue {
  latitude: number;
  longitude: number;
}

/**
 * In-progress value of a `multi_measurement` question while the
 * crew member fills it out. Becomes a `QuestionAnswer` once the
 * response is submitted.
 */
export interface MultiMeasurementValue {
  referenceX: number | null;
  referenceY: number | null;
  measurements: Measurement[];
  file: File | null;
}

/**
 * Union of every value a question can hold while the survey is
 * being filled out. There's no tag field on the payload itself —
 * narrow by question type, or by JS runtime checks (`typeof`,
 * `Array.isArray`, `instanceof File`, field presence).
 *
 *   text / single_select → string
 *   multi_select         → string[]
 *   file                 → File[]
 *   geolocation          → GeoValue
 *   multi_measurement    → MultiMeasurementValue
 */
export type QuestionValue =
  | string
  | string[]
  | File[]
  | GeoValue
  | MultiMeasurementValue;
