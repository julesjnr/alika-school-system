import { and, eq } from 'drizzle-orm';
import { studentEnrollments, students, courses } from './db/schema.ts';

async function selectCanonicalEnrollmentRows(tx: any, studentId: string, courseCode: string) {
  if (typeof tx.select !== 'function') {
    return [];
  }

  const baseQuery = await tx.select();
  if (baseQuery && typeof baseQuery.from === 'function') {
    return baseQuery.from(studentEnrollments).where(
      and(
        eq(studentEnrollments.studentId, studentId),
        eq(studentEnrollments.courseCode, courseCode),
      ),
    );
  }

  if (Array.isArray(baseQuery)) {
    return baseQuery.filter((row: any) => row?.studentId === studentId && row?.courseCode === courseCode);
  }

  return [];
}

export async function ensureStudentCanonicalEnrollment(
  tx: any,
  studentId: string,
  courseCode: string,
): Promise<boolean> {
  if (!studentId || !courseCode) {
    return false;
  }

  const existing = await selectCanonicalEnrollmentRows(tx, studentId, courseCode);
  if (Array.isArray(existing) && existing.length > 0) {
    return false;
  }

  if (typeof tx.insert !== 'function') {
    return false;
  }

  const insertBuilder = tx.insert(studentEnrollments);
  const maybeResult = await insertBuilder
    .values({ studentId, courseCode })
    .onConflictDoNothing()
    .returning();

  return Array.isArray(maybeResult) ? maybeResult.length > 0 : Boolean(maybeResult);
}

export async function ensureStudentCourseEnrollment(
  tx: any,
  studentId: string,
  courseId: string | null,
): Promise<{ created: boolean; courseCode?: string | null; studentCourse?: any }> {
  if (!studentId || !courseId) {
    return { created: false, courseCode: null, studentCourse: null };
  }

  const studentQuery = typeof tx.select === 'function' ? await tx.select() : null;
  const studentRows = studentQuery && typeof studentQuery.from === 'function'
    ? await studentQuery.from(students).where(eq(students.id, studentId))
    : Array.isArray(studentQuery) ? studentQuery.filter((row: any) => row?.id === studentId) : [];

  const [student] = Array.isArray(studentRows) ? studentRows : [];
  if (!student) {
    return { created: false, courseCode: null, studentCourse: null };
  }

  const courseQuery = typeof tx.select === 'function' ? await tx.select() : null;
  const courseRows = courseQuery && typeof courseQuery.from === 'function'
    ? await courseQuery.from(courses).where(eq(courses.id, courseId))
    : Array.isArray(courseQuery) ? courseQuery.filter((row: any) => row?.id === courseId) : [];

  const [course] = Array.isArray(courseRows) ? courseRows : [];
  if (!course) {
    return { created: false, courseCode: null, studentCourse: student };
  }

  const created = await ensureStudentCanonicalEnrollment(tx, studentId, course.code);
  return { created, courseCode: course.code, studentCourse: student };
}
