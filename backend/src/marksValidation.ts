/**
 * Server-side grade validation aligned with grades table check constraints:
 * cat_score 0..30, exam_score 0..70.
 */

export const AGGREGATE_CAT_MAX = 30;
export const AGGREGATE_EXAM_MAX = 70;

export type MarkField = "cat1" | "cat2" | "assignment" | "exam";

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

const FIELD_KIND: Record<MarkField, string> = {
  cat1: "CAT1",
  cat2: "CAT2",
  assignment: "Assignment",
  exam: "FinalExam",
};

const DEFAULT_FIELD_MAX: Record<MarkField, number> = {
  cat1: 10,
  cat2: 10,
  assignment: 10,
  exam: 70,
};

export function maxMarksForField(
  assessments: AssessmentMaxSource[] | undefined | null,
  field: MarkField,
): number {
  const kind = FIELD_KIND[field];
  const configured = (assessments || []).find((item) => item.kind === kind);
  const raw = configured?.maxMarks;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return DEFAULT_FIELD_MAX[field];
}

export function parseMarkInput(value: string | number | null | undefined): number {
  if (value === "" || value === null || value === undefined) return 0;
  const numeric = typeof value === "number" ? value : Number(value);
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
  marks: Pick<MarkBreakdown, "cat1" | "cat2" | "assignment">,
  assessments?: AssessmentMaxSource[] | null,
): number {
  const valid = [marks.cat1, marks.cat2, marks.assignment].filter((value) => {
    const max = maxMarksForField(assessments, "cat1");
    return Number.isFinite(value) && value >= 0 && value <= max;
  });
  return valid.reduce((sum, value) => sum + value, 0);
}

export function validateAggregateGrade(cat: unknown, exam: unknown): {
  ok: true;
  cat: number;
  exam: number;
} | {
  ok: false;
  error: string;
} {
  const catNum = typeof cat === "number" ? cat : Number(cat);
  const examNum = typeof exam === "number" ? exam : Number(exam);

  if (!Number.isFinite(catNum) || catNum < 0 || catNum > AGGREGATE_CAT_MAX) {
    return { ok: false, error: `Continuous assessment must be between 0 and ${AGGREGATE_CAT_MAX}.` };
  }
  if (!Number.isFinite(examNum) || examNum < 0 || examNum > AGGREGATE_EXAM_MAX) {
    return { ok: false, error: `Final exam must be between 0 and ${AGGREGATE_EXAM_MAX}.` };
  }
  return { ok: true, cat: catNum, exam: examNum };
}

/** Drop or retain previous grades when incoming values are out of range. */
export function sanitizeStudentGradesRecord(
  incoming: Record<string, { cat?: unknown; exam?: unknown }> | null | undefined,
  previous: Record<string, { cat?: unknown; exam?: unknown }> | null | undefined = {},
): Record<string, { cat: number; exam: number }> {
  const result: Record<string, { cat: number; exam: number }> = {};
  const prev = previous || {};

  for (const [subjectCode, grade] of Object.entries(incoming || {})) {
    const validated = validateAggregateGrade(grade?.cat, grade?.exam);
    if (validated.ok) {
      result[subjectCode] = { cat: validated.cat, exam: validated.exam };
      continue;
    }
    const prior = prev[subjectCode];
    const priorValidated = prior ? validateAggregateGrade(prior.cat, prior.exam) : null;
    if (priorValidated?.ok) {
      result[subjectCode] = { cat: priorValidated.cat, exam: priorValidated.exam };
    }
    // else: omit invalid grade so it is not persisted
  }

  return result;
}
