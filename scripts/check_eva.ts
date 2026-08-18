import dotenv from 'dotenv';
dotenv.config({ override: false });
import { db } from '../backend/src/db/index';
import { students, studentEnrollments, studentAssessmentMarks, grades } from '../backend/src/db/schema';

async function run() {
  const admissionNo = 'ALK-002';
  const [student] = await db.select({ id: students.id, name: students.name, admissionNo: students.admissionNo }).from(students).where(eq(students.admissionNo, admissionNo)).limit(1);
  console.log('STUDENT:', student || null);
  if (!student) return;
  const studentId = student.id;
  const enrollments = await db.select().from(studentEnrollments).where(eq(studentEnrollments.studentId, studentId));
  console.log('ENROLLMENTS:', enrollments);
  const assessments = await db.select().from(studentAssessmentMarks).where(and(eq(studentAssessmentMarks.studentId, studentId), eq(studentAssessmentMarks.subjectCode, 'CERT-NURSE-ASSISTANT')));
  console.log('STUDENT_ASSESSMENT_MARKS:', assessments);
  const legacy = await db.select().from(grades).where(and(eq(grades.studentId, studentId), eq(grades.subjectCode, 'CERT-NURSE-ASSISTANT')));
  console.log('LEGACY_GRADES:', legacy);
}

// helpers
import { eq, and } from 'drizzle-orm';

run().catch((err) => {
  console.error('ERROR', err);
  process.exit(1);
});
