import { and, eq, sql } from 'drizzle-orm';
import { db } from './db/index.ts';
import { studentEnrollments, students, courses } from './db/schema.ts';

const DEFAULT_FALLBACK_MODULE_CODE = 'CERT-CAREGIVER';

async function selectCanonicalEnrollmentRows(tx: any, studentId: string, courseCode: string) {
  const runner = tx || db;
  if (!runner) return [];

  try {
    if (typeof runner.select === 'function') {
      let baseQuery = runner.select();
      if (baseQuery && typeof baseQuery.then === 'function') {
        baseQuery = await baseQuery;
      }
      if (baseQuery && typeof baseQuery.from === 'function') {
        let fromQuery = baseQuery.from(studentEnrollments);
        if (fromQuery && typeof fromQuery.where === 'function') {
          return await fromQuery.where(
            and(
              eq(studentEnrollments.studentId, studentId),
              eq(studentEnrollments.courseCode, courseCode),
            ),
          );
        }
        if (fromQuery && typeof fromQuery.then === 'function') {
          fromQuery = await fromQuery;
        }
        if (Array.isArray(fromQuery)) {
          return fromQuery.filter((row: any) => (row?.studentId || row?.student_id) === studentId && (row?.courseCode || row?.course_code) === courseCode);
        }
      }
      if (Array.isArray(baseQuery)) {
        return baseQuery.filter((row: any) => (row?.studentId || row?.student_id) === studentId && (row?.courseCode || row?.course_code) === courseCode);
      }
    }

    if (typeof runner.execute === 'function') {
      const result = await runner.execute(sql`
        SELECT student_id AS "studentId", course_code AS "courseCode", status, enrolled_at AS "enrolledAt"
        FROM student_enrollments
        WHERE student_id = ${studentId} AND course_code = ${courseCode}
        LIMIT 1
      `);
      return result.rows || [];
    }
  } catch (err) {
    console.error('[selectCanonicalEnrollmentRows] error:', err);
  }

  return [];
}

export async function ensureStudentCanonicalEnrollment(
  tx: any,
  studentId: string,
  courseCode: string,
  status = 'active',
): Promise<boolean> {
  if (!studentId || !courseCode) {
    return false;
  }

  const cleanStudentId = String(studentId).trim();
  const cleanCourseCode = String(courseCode).trim();
  const cleanStatus = String(status || 'active').trim() || 'active';

  const runner = tx || db;
  const existing = await selectCanonicalEnrollmentRows(runner, cleanStudentId, cleanCourseCode);
  if (Array.isArray(existing) && existing.length > 0) {
    return false;
  }

  if (runner && typeof runner.insert === 'function') {
    const insertBuilder = runner.insert(studentEnrollments);
    const maybeResult = await insertBuilder
      .values({
        studentId: cleanStudentId,
        courseCode: cleanCourseCode,
        status: cleanStatus,
      })
      .onConflictDoNothing()
      .returning();

    return Array.isArray(maybeResult) ? maybeResult.length > 0 : Boolean(maybeResult);
  }

  if (runner && typeof runner.execute === 'function') {
    const res = await runner.execute(sql`
      INSERT INTO student_enrollments (student_id, course_code, status, enrolled_at)
      VALUES (${cleanStudentId}, ${cleanCourseCode}, ${cleanStatus}, NOW())
      ON CONFLICT (student_id, course_code) DO NOTHING
      RETURNING student_id
    `);
    return (res?.rows?.length || 0) > 0;
  }

  return false;
}

export async function ensureStudentCourseEnrollment(
  tx: any,
  studentId: string,
  courseId: string | null,
  status = 'active',
): Promise<{ created: boolean; courseCode?: string | null; studentCourse?: any }> {
  if (!studentId || !courseId) {
    return { created: false, courseCode: null, studentCourse: null };
  }

  const runner = tx || db;
  const cleanStudentId = String(studentId).trim();
  const cleanCourseId = String(courseId).trim();

  let student: any = null;
  let course: any = null;

  if (runner && typeof runner.select === 'function') {
    const studentQuery = await runner.select();
    const studentRows = studentQuery && typeof studentQuery.from === 'function'
      ? await studentQuery.from(students).where(eq(students.id, cleanStudentId))
      : Array.isArray(studentQuery) ? studentQuery.filter((row: any) => row?.id === cleanStudentId) : [];
    student = Array.isArray(studentRows) ? studentRows[0] : null;

    const courseQuery = await runner.select();
    const courseRows = courseQuery && typeof courseQuery.from === 'function'
      ? await courseQuery.from(courses).where(eq(courses.id, cleanCourseId))
      : Array.isArray(courseQuery) ? courseQuery.filter((row: any) => row?.id === cleanCourseId) : [];
    course = Array.isArray(courseRows) ? courseRows[0] : null;
  } else if (runner && typeof runner.execute === 'function') {
    const sRes = await runner.execute(sql`SELECT * FROM students WHERE id = ${cleanStudentId} LIMIT 1`);
    student = sRes.rows?.[0] || null;

    const cRes = await runner.execute(sql`SELECT * FROM courses WHERE id = ${cleanCourseId} LIMIT 1`);
    course = cRes.rows?.[0] || null;
  }

  if (!student) {
    return { created: false, courseCode: null, studentCourse: null };
  }

  if (!course) {
    return { created: false, courseCode: null, studentCourse: student };
  }

  const created = await ensureStudentCanonicalEnrollment(runner, cleanStudentId, course.code, status);
  return { created, courseCode: course.code, studentCourse: student };
}

/**
 * Reconciles student enrollments across all existing students in the database.
 * If a student has no enrollment entries (e.g. 'ALK-001'), they are automatically
 * enrolled into their assigned course, programme, or default module ('CERT-CAREGIVER')
 * with status = 'active'.
 */
export async function reconcileStudentEnrollments(
  txOrDb?: any,
): Promise<Array<{ studentId: string; admissionNo: string; courseCode: string; status: string }>> {
  const runner = txOrDb || db;
  if (!runner) return [];

  const enrolledResults: Array<{ studentId: string; admissionNo: string; courseCode: string; status: string }> = [];

  try {
    // 1. Fetch all existing students
    let allStudents: any[] = [];
    if (typeof runner.select === 'function') {
      let q = runner.select();
      if (q && typeof q.then === 'function') q = await q;
      if (q && typeof q.from === 'function') {
        const res = q.from(students);
        allStudents = res && typeof res.then === 'function' ? await res : res;
      } else if (Array.isArray(q)) {
        allStudents = q;
      }
    }
    if ((!allStudents || allStudents.length === 0) && typeof runner.execute === 'function') {
      const res = await runner.execute(sql`
        SELECT id, admission_no AS "admissionNo", name, email, course_id AS "courseId", programme
        FROM students
      `);
      allStudents = res.rows || [];
    }

    if (!allStudents || allStudents.length === 0) {
      return [];
    }

    // 2. Fetch all existing courses for code mapping
    let allCourses: any[] = [];
    if (typeof runner.select === 'function') {
      let cq = runner.select();
      if (cq && typeof cq.then === 'function') cq = await cq;
      if (cq && typeof cq.from === 'function') {
        const res = cq.from(courses);
        allCourses = res && typeof res.then === 'function' ? await res : res;
      } else if (Array.isArray(cq)) {
        allCourses = cq;
      }
    }
    if ((!allCourses || allCourses.length === 0) && typeof runner.execute === 'function') {
      const res = await runner.execute(sql`SELECT id, code, title FROM courses`);
      allCourses = res.rows || [];
    }

    // 3. Fetch all current enrollments
    let currentEnrollments: any[] = [];
    if (typeof runner.select === 'function') {
      let eqQuery = runner.select();
      if (eqQuery && typeof eqQuery.then === 'function') eqQuery = await eqQuery;
      if (eqQuery && typeof eqQuery.from === 'function') {
        const res = eqQuery.from(studentEnrollments);
        currentEnrollments = res && typeof res.then === 'function' ? await res : res;
      } else if (Array.isArray(eqQuery)) {
        currentEnrollments = eqQuery;
      }
    }
    if ((!currentEnrollments || currentEnrollments.length === 0) && typeof runner.execute === 'function') {
      const res = await runner.execute(sql`SELECT student_id AS "studentId", course_code AS "courseCode" FROM student_enrollments`);
      currentEnrollments = res.rows || [];
    }

    const enrollmentSet = new Set(
      currentEnrollments.map((e: any) => `${e.studentId || e.student_id}:${e.courseCode || e.course_code}`),
    );
    const studentsWithAnyEnrollment = new Set(
      currentEnrollments.map((e: any) => e.studentId || e.student_id),
    );

    // 4. For each student with no enrollments, determine module and enroll
    for (const student of allStudents) {
      const sId = String(student.id || student.studentId);
      const admissionNo = String(student.admissionNo || student.admission_no || '');
      const courseId = student.courseId || student.course_id;
      const programme = String(student.programme || '').trim().toLowerCase();

      // Check if student already has any enrollment
      if (studentsWithAnyEnrollment.has(sId)) {
        continue;
      }

      // Determine target course code
      let targetCode = DEFAULT_FALLBACK_MODULE_CODE;

      if (courseId) {
        const matchingCourse = allCourses.find((c: any) => String(c.id) === String(courseId));
        if (matchingCourse?.code) {
          targetCode = matchingCourse.code;
        }
      }

      if (targetCode === DEFAULT_FALLBACK_MODULE_CODE && programme) {
        const matchingByTitle = allCourses.find(
          (c: any) => String(c.title || '').trim().toLowerCase() === programme,
        );
        if (matchingByTitle?.code) {
          targetCode = matchingByTitle.code;
        }
      }

      // Special handling: ALK-001 or caregiver records
      if (admissionNo === 'ALK-001' || programme.includes('caregiver')) {
        targetCode = DEFAULT_FALLBACK_MODULE_CODE;
      }

      const pairKey = `${sId}:${targetCode}`;
      if (!enrollmentSet.has(pairKey)) {
        await ensureStudentCanonicalEnrollment(runner, sId, targetCode, 'active');
        enrollmentSet.add(pairKey);
        studentsWithAnyEnrollment.add(sId);
        enrolledResults.push({
          studentId: sId,
          admissionNo,
          courseCode: targetCode,
          status: 'active',
        });
      }
    }
  } catch (error) {
    console.error('[reconcileStudentEnrollments] Error reconciling student enrollments:', error);
  }

  return enrolledResults;
}

/**
 * Auto-enrolls a single student into their assigned module or default if they have no active enrollments.
 */
export async function autoEnrollStudentIfMissing(
  txOrDb: any,
  studentId: string,
  defaultCourseCode = DEFAULT_FALLBACK_MODULE_CODE,
): Promise<{ enrolled: boolean; courseCode: string }> {
  if (!studentId) return { enrolled: false, courseCode: defaultCourseCode };

  const runner = txOrDb || db;
  const cleanStudentId = String(studentId).trim();

  try {
    let existingEnrollments: any[] = [];
    if (typeof runner.select === 'function') {
      const q = await runner.select();
      if (q && typeof q.from === 'function') {
        existingEnrollments = await q.from(studentEnrollments).where(eq(studentEnrollments.studentId, cleanStudentId));
      }
    }
    if (existingEnrollments.length === 0 && typeof runner.execute === 'function') {
      const res = await runner.execute(sql`
        SELECT course_code AS "courseCode" FROM student_enrollments WHERE student_id = ${cleanStudentId}
      `);
      existingEnrollments = res.rows || [];
    }

    if (existingEnrollments.length > 0) {
      return { enrolled: false, courseCode: existingEnrollments[0].courseCode || existingEnrollments[0].course_code };
    }

    // Resolve course from student record
    let targetCode = defaultCourseCode;
    let student: any = null;
    if (typeof runner.select === 'function') {
      const sq = await runner.select();
      if (sq && typeof sq.from === 'function') {
        const sRows = await sq.from(students).where(eq(students.id, cleanStudentId)).limit(1);
        student = sRows[0];
      }
    }
    if (!student && typeof runner.execute === 'function') {
      const sRes = await runner.execute(sql`
        SELECT id, admission_no AS "admissionNo", course_id AS "courseId", programme FROM students WHERE id = ${cleanStudentId} LIMIT 1
      `);
      student = sRes.rows?.[0];
    }

    if (student) {
      const courseId = student.courseId || student.course_id;
      if (courseId) {
        const cRes = await runner.execute(sql`SELECT code FROM courses WHERE id = ${courseId} LIMIT 1`);
        if (cRes.rows?.[0]?.code) {
          targetCode = cRes.rows[0].code;
        }
      } else if (student.programme) {
        const cRes = await runner.execute(sql`SELECT code FROM courses WHERE LOWER(title) = LOWER(${student.programme}) LIMIT 1`);
        if (cRes.rows?.[0]?.code) {
          targetCode = cRes.rows[0].code;
        }
      }
      if (student.admissionNo === 'ALK-001' || student.admission_no === 'ALK-001') {
        targetCode = DEFAULT_FALLBACK_MODULE_CODE;
      }
    }

    const created = await ensureStudentCanonicalEnrollment(runner, cleanStudentId, targetCode, 'active');
    return { enrolled: created, courseCode: targetCode };
  } catch (error) {
    console.error('[autoEnrollStudentIfMissing] Error auto-enrolling student:', error);
    return { enrolled: false, courseCode: defaultCourseCode };
  }
}

/**
 * Lightweight check/utility query that finds any existing active student without a
 * `student_enrollments` record and inserts one automatically with status = 'active'
 * so existing records like 'ALK-001' show up on Attendance and Assessment screens.
 */
export async function backfillMissingStudentEnrollments(
  txOrDb?: any,
  defaultCourseCode = DEFAULT_FALLBACK_MODULE_CODE,
): Promise<number> {
  const runner = txOrDb || db;
  if (!runner) return 0;

  try {
    if (typeof runner.execute === 'function') {
      const result = await runner.execute(sql`
        INSERT INTO student_enrollments (student_id, course_code, status, enrolled_at)
        SELECT 
          s.id AS student_id,
          COALESCE(NULLIF(c.code, ''), ${defaultCourseCode}) AS course_code,
          'active' AS status,
          NOW() AS enrolled_at
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE (LOWER(COALESCE(s.account_status, 'active')) != 'suspended' OR s.admission_no = 'ALK-001')
          AND NOT EXISTS (
            SELECT 1 FROM student_enrollments se WHERE se.student_id = s.id
          )
        ON CONFLICT (student_id, course_code) DO NOTHING
        RETURNING student_id;
      `);
      const count = result?.rows?.length || result?.rowCount || 0;
      if (count > 0) {
        console.log(`[studentEnrollments] Backfilled ${count} active student(s) into student_enrollments.`);
      }
      return count;
    }
  } catch (err) {
    console.error('[backfillMissingStudentEnrollments] Error backfilling:', err);
  }

  // Fallback if runner.execute is not directly available
  try {
    const reconciled = await reconcileStudentEnrollments(runner);
    return reconciled.length;
  } catch {
    return 0;
  }
}
