export interface StudentLookupGradeRow {
  subjectCode: string;
  catScore: string | number | null;
  examScore: string | number | null;
  gradedAt?: string | null;
}

export interface StudentLookUpCourseInfo {
  courseTitle?: string | null;
  courseCode?: string | null;
  department?: string | null;
}

export interface PublishedAssessmentRow {
  subjectCode: string;
  rawMark?: string | number | null;
  maxMarks?: string | number | null;
  weight?: string | number | null;
  assessmentKind?: string | null;
  recordedAt?: string | null;
}

export interface PublishedAssessmentSubjectSummary {
  subjectCode: string;
  overallPercent: number;
  grade: string;
  passed: boolean;
  totalWeight: number;
}

export interface StudentLookupAcademicSummary {
  gpa: number | null;
  academicStanding: string;
  registeredUnitCount: number;
  programme: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  department: string | null;
  yearOfStudy: number | null;
  semester: string | null;
  modulesPassed?: number;
  subjects?: PublishedAssessmentSubjectSummary[];
}

export function deriveAcademicStanding(gpa: number | null): string {
  if (gpa === null || Number.isNaN(gpa)) return 'Awaiting results';
  if (gpa >= 3.7) return 'Excellent';
  if (gpa >= 3.0) return 'Good Standing';
  if (gpa >= 2.0) return 'Satisfactory';
  if (gpa > 0) return 'At Risk';
  return 'Awaiting results';
}

export function computeStudentAcademicSummary(
  gradeRows: StudentLookupGradeRow[],
  enrollmentRows: Array<{ courseCode?: string | null }>,
  course: StudentLookUpCourseInfo = {}
): StudentLookupAcademicSummary {
  const validGrades = gradeRows.filter((row) => row && row.subjectCode);

  const totalMarks = validGrades.reduce((sum, row) => {
    const cat = Number(row.catScore ?? 0);
    const exam = Number(row.examScore ?? 0);
    return sum + (Number.isFinite(cat) ? cat : 0) + (Number.isFinite(exam) ? exam : 0);
  }, 0);

  const gpa = validGrades.length > 0
    ? Number((totalMarks / validGrades.length / 100 * 4).toFixed(2))
    : null;

  return {
    gpa,
    academicStanding: deriveAcademicStanding(gpa),
    registeredUnitCount: Array.isArray(enrollmentRows) ? enrollmentRows.length : 0,
    programme: course.courseTitle ?? null,
    courseCode: course.courseCode ?? null,
    courseTitle: course.courseTitle ?? null,
    department: course.department ?? null,
    yearOfStudy: null,
    semester: null,
  };
}

function letterGradeFromOverallPercentage(value: number): string {
  if (value >= 70) return 'A';
  if (value >= 60) return 'B';
  if (value >= 50) return 'C';
  if (value >= 40) return 'D';
  return 'F';
}

function gradePointForPercent(percent: number): number {
  if (percent >= 70) return 4.0;
  if (percent >= 60) return 3.0;
  if (percent >= 50) return 2.0;
  if (percent >= 40) return 1.0;
  return 0.0;
}

export function computePublishedAssessmentSummary(
  assessmentRows: PublishedAssessmentRow[],
  enrollmentRows: Array<{ courseCode?: string | null }> = [],
  course: StudentLookUpCourseInfo = {}
): StudentLookupAcademicSummary {
  const grouped = new Map<string, PublishedAssessmentRow[]>();

  for (const row of assessmentRows) {
    if (!row?.subjectCode) continue;
    const key = String(row.subjectCode).trim();
    if (!key) continue;
    const existing = grouped.get(key) || [];
    existing.push(row);
    grouped.set(key, existing);
  }

  const subjects: PublishedAssessmentSubjectSummary[] = [];
  const effectiveSubjectCodes = Array.from(grouped.keys());

  for (const subjectCode of effectiveSubjectCodes) {
    const rows = grouped.get(subjectCode) || [];
    let weightedPercentTotal = 0;
    let totalWeight = 0;

    for (const row of rows) {
      const rawMark = Number(row.rawMark ?? 0);
      const maxMarks = Number(row.maxMarks ?? 0);
      const weight = Number(row.weight ?? 0);

      if (!Number.isFinite(rawMark) || !Number.isFinite(maxMarks) || maxMarks <= 0) continue;
      if (!Number.isFinite(weight) || weight < 0) continue;

      const percentage = Math.min((rawMark / maxMarks) * 100, 100);
      weightedPercentTotal += percentage * weight;
      totalWeight += weight;
    }

    const overallPercent = totalWeight > 0 ? Number((weightedPercentTotal / totalWeight).toFixed(2)) : 0;
    const grade = letterGradeFromOverallPercentage(overallPercent);
    subjects.push({
      subjectCode,
      overallPercent,
      grade,
      passed: overallPercent >= 40,
      totalWeight,
    });
  }

  const modulesPassed = subjects.filter((subject) => subject.passed).length;
  const gpa = subjects.length > 0
    ? Number((subjects.reduce((sum, subject) => sum + gradePointForPercent(subject.overallPercent), 0) / subjects.length).toFixed(2))
    : null;

  return {
    gpa,
    academicStanding: deriveAcademicStanding(gpa),
    registeredUnitCount: Array.isArray(enrollmentRows) ? enrollmentRows.length : 0,
    programme: course.courseTitle ?? null,
    courseCode: course.courseCode ?? null,
    courseTitle: course.courseTitle ?? null,
    department: course.department ?? null,
    yearOfStudy: null,
    semester: null,
    modulesPassed,
    subjects,
  };
}

export function getAcademicStandingFromPublishedResults(gpa: number | null): string {
  return deriveAcademicStanding(gpa);
}
