/**
 * Marks-entry validation helpers.
 * Every component and aggregate maximum is derived from lecturer configuration.
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
  weight?: number;
}

const FIELD_KIND: Record<MarkField, string> = {
  cat1: 'CAT1',
  cat2: 'CAT2',
  assignment: 'Assignment',
  exam: 'FinalExam',
};

const DEFAULT_FIELD_MAX: Record<MarkField, number> = {
  cat1: 0,
  cat2: 0,
  assignment: 0,
  exam: 0,
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

export function configuredAggregateLimits(
  assessments?: AssessmentMaxSource[] | null,
): { catMax: number; examMax: number } {
  const catMax = (['cat1', 'cat2', 'assignment'] as MarkField[]).reduce(
    (sum, field) => sum + maxMarksForField(assessments, field),
    0,
  );
  const examMax = maxMarksForField(assessments, 'exam');
  return { catMax, examMax };
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

export function assessmentWeightForField(
  assessments: AssessmentMaxSource[] | undefined | null,
  field: MarkField,
): number {
  const kind = FIELD_KIND[field];
  const configured = (assessments || []).find((item) => item.kind === kind);
  const raw = configured?.weight;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return 0;
}

export function assessmentWeightTotal(
  assessments?: AssessmentMaxSource[] | null,
): number {
  return (assessments || []).reduce((total, assessment) => {
    const weight = Number(assessment?.weight ?? 0);
    return total + (Number.isFinite(weight) && weight >= 0 ? weight : 0);
  }, 0);
}

export function validateAssessmentWeights(
  assessments?: AssessmentMaxSource[] | null,
): string | null {
  const configured = (assessments || []).filter(
    (assessment) => typeof assessment?.kind === 'string' && typeof assessment?.maxMarks === 'number' && Number.isFinite(assessment.maxMarks) && assessment.maxMarks > 0,
  );
  if (configured.length === 0) {
    return null;
  }
  const total = assessmentWeightTotal(configured);
  if (total <= 0) {
    return 'Assessment weights must be configured. Enter a contribution for each assessment.';
  }
  if (Math.abs(total - 100) > 0.0001) {
    return `Assessment weights currently total ${total}%. They must total 100%.`;
  }
  return null;
}

export function assessmentPercentage(value: number, maxMarks: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(maxMarks) || maxMarks <= 0) {
    return 0;
  }
  return Math.min(Math.max((value / maxMarks) * 100, 0), 100);
}

export function calculateOverallPercentage(
  marks: Record<string, number> | MarkBreakdown,
  assessments?: AssessmentMaxSource[] | null,
): number {
  const normalizedAssessments = (assessments || []).filter(
    (item) => typeof item?.kind === 'string' && typeof item?.maxMarks === 'number' && Number.isFinite(item.maxMarks) && item.maxMarks > 0,
  );

  if (normalizedAssessments.length === 0) {
    return 0;
  }

  const weights = normalizedAssessments.map((item) => Number(item.weight ?? 0));
  const hasExplicitWeights = weights.some((weight) => Number.isFinite(weight) && weight > 0);

  const percentageContributions = normalizedAssessments.map((item) => {
    const kind = String(item.kind);
    const markValue = Number((marks as Record<string, number>)[
      Object.keys(FIELD_KIND).find((field) => FIELD_KIND[field as MarkField] === kind) ?? kind
    ] ?? (marks as Record<string, number>)[kind.toLowerCase()] ?? (marks as Record<string, number>)[kind]);
    const percentage = assessmentPercentage(markValue, item.maxMarks);
    return { kind, percentage, weight: Number.isFinite(Number(item.weight)) ? Number(item.weight) : 0 };
  });

  if (hasExplicitWeights) {
    const totalWeight = percentageContributions.reduce((sum, entry) => sum + (entry.weight > 0 ? entry.weight : 0), 0);
    if (Math.abs(totalWeight - 100) > 0.0001) {
      return 0;
    }
    const weightedTotal = percentageContributions.reduce((sum, entry) => {
      if (!Number.isFinite(entry.percentage) || entry.weight <= 0) return sum;
      return sum + (entry.percentage / 100) * entry.weight;
    }, 0);
    return totalWeight > 0 ? Number(((weightedTotal / totalWeight) * 100).toFixed(2)) : 0;
  }

  const average = percentageContributions.reduce((sum, entry) => sum + entry.percentage, 0) / (percentageContributions.length || 1);
  return Number(average.toFixed(2));
}

export function letterGradeFromOverallPercentage(value: number): string {
  if (value >= 70) return 'A';
  if (value >= 60) return 'B';
  if (value >= 50) return 'C';
  if (value >= 40) return 'D';
  return 'F';
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

export function validateAggregateGrade(
  cat: unknown,
  exam: unknown,
  assessments?: AssessmentMaxSource[] | null,
): {
  ok: true;
  cat: number;
  exam: number;
} | {
  ok: false;
  error: string;
} {
  const hasConfiguredMaxima = Array.isArray(assessments) && assessments.some((item) => typeof item?.maxMarks === 'number' && Number.isFinite(item.maxMarks) && item.maxMarks > 0);
  if (!hasConfiguredMaxima) {
    return { ok: false, error: 'Assessment maxima must be configured before saving grades.' };
  }

  const catNum = typeof cat === 'number' ? cat : Number(cat);
  const examNum = typeof exam === 'number' ? exam : Number(exam);
  const limits = configuredAggregateLimits(assessments);
  const catLimit = limits.catMax > 0 ? limits.catMax : Number.POSITIVE_INFINITY;
  const examLimit = limits.examMax > 0 ? limits.examMax : Number.POSITIVE_INFINITY;

  if (!Number.isFinite(catNum) || catNum < 0) {
    return { ok: false, error: 'Continuous assessment must be a valid non-negative number.' };
  }
  if (catLimit !== Number.POSITIVE_INFINITY && catNum > catLimit) {
    return { ok: false, error: `Continuous assessment exceeds the configured limit of ${catLimit}.` };
  }
  if (!Number.isFinite(examNum) || examNum < 0) {
    return { ok: false, error: 'Final exam must be a valid non-negative number.' };
  }
  if (examLimit !== Number.POSITIVE_INFINITY && examNum > examLimit) {
    return { ok: false, error: `Final exam exceeds the configured limit of ${examLimit}.` };
  }
  return { ok: true, cat: catNum, exam: examNum };
}
