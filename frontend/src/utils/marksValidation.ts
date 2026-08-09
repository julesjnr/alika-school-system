/**
 * Marks-entry validation helpers.
 * Component max marks come from assessment configuration (not hard-coded callers).
 * Aggregated continuous (CAT total) and exam bounds mirror the grades table checks.
 */

export type MarkField = 'cat1' | 'cat2' | 'assignment' | 'exam';

export interface MarkBreakdown {
  cat1: number;
  cat2: number;
  assignment: number;
  exam: number;
}

export interface AssessmentMaxSource {
  kind: string;
  maxMarks: number;
}

/** Schema / business limits for the persisted grade row (cat_score + exam_score). */
export const AGGREGATE_CAT_MAX = 30;
export const AGGREGATE_EXAM_MAX = 70;

const FIELD_KIND: Record<MarkField, string> = {
  cat1: 'CAT1',
  cat2: 'CAT2',
  assignment: 'Assignment',
  exam: 'FinalExam',
};

const DEFAULT_FIELD_MAX: Record<MarkField, number> = {
  cat1: AGGREGATE_CAT_MAX,
  cat2: AGGREGATE_CAT_MAX,
  assignment: AGGREGATE_CAT_MAX,
  exam: AGGREGATE_EXAM_MAX,
};

export function maxMarksForField(
  assessments: AssessmentMaxSource[] | undefined | null,
  field: MarkField,
): number {
  const kind = FIELD_KIND[field];
  const configured = (assessments || []).find((item) => item.kind === kind);
  const raw = configured?.maxMarks;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return DEFAULT_FIELD_MAX[field];
}

/** Parse a raw input into a number candidate (empty → 0). */
export function parseMarkInput(value: string | number | null | undefined): number {
  if (value === '' || value === null || value === undefined) return 0;
  const numeric = typeof value === 'number' ? value : Number(value);
  return numeric;
}

export function isMarkWithinMax(value: number, maxMarks: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= maxMarks;
}

export function validateMarkBreakdown(
  marks: MarkBreakdown,
  assessments?: AssessmentMaxSource[] | null,
): Partial<Record<MarkField, string>> {
  const errors: Partial<Record<MarkField, string>> = {};
  (Object.keys(FIELD_KIND) as MarkField[]).forEach((field) => {
    const max = maxMarksForField(assessments, field);
    const value = marks[field];
    if (!isMarkWithinMax(value, max)) {
      errors[field] = `Enter a mark from 0 to ${max}.`;
    }
  });
  return errors;
}

/** Sum only fields that pass their configured max — invalid values contribute 0. */
export function sumValidMarks(
  marks: MarkBreakdown,
  assessments?: AssessmentMaxSource[] | null,
): number {
  let total = 0;
  (Object.keys(FIELD_KIND) as MarkField[]).forEach((field) => {
    const max = maxMarksForField(assessments, field);
    const value = marks[field];
    if (isMarkWithinMax(value, max)) {
      total += value;
    }
  });
  return total;
}

export function continuousAssessmentTotal(
  marks: Pick<MarkBreakdown, 'cat1' | 'cat2' | 'assignment'>,
  assessments?: AssessmentMaxSource[] | null,
): number {
  let total = 0;
  (['cat1', 'cat2', 'assignment'] as MarkField[]).forEach((field) => {
    const max = maxMarksForField(assessments, field);
    const value = marks[field];
    if (isMarkWithinMax(value, max)) {
      total += value;
    }
  });
  return total;
}

export function validateAggregateGrade(cat: unknown, exam: unknown): {
  ok: true;
  cat: number;
  exam: number;
} | {
  ok: false;
  error: string;
} {
  const catNum = typeof cat === 'number' ? cat : Number(cat);
  const examNum = typeof exam === 'number' ? exam : Number(exam);

  if (!Number.isFinite(catNum) || catNum < 0 || catNum > AGGREGATE_CAT_MAX) {
    return { ok: false, error: `Continuous assessment must be between 0 and ${AGGREGATE_CAT_MAX}.` };
  }
  if (!Number.isFinite(examNum) || examNum < 0 || examNum > AGGREGATE_EXAM_MAX) {
    return { ok: false, error: `Final exam must be between 0 and ${AGGREGATE_EXAM_MAX}.` };
  }
  return { ok: true, cat: catNum, exam: examNum };
}
