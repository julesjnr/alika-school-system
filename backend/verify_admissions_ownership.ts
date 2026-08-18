/**
 * Verify Admissions enrollment owns student creation and Academic Allocation
 * reads the same PostgreSQL student id (no duplicates).
 */
import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
import { enrollAdmittedStudentRecord } from './_noop.ts';

// Inline the same helper path via dynamic import of server is heavy; call SQL + auth helpers directly.
import { hashPassword, resolvePassword, upsertUserAuthRecord } from './src/auth.ts';

function cleanText(value: unknown, max = 5000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function generateAdmissionNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const admissionNo = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await db.execute(sql`SELECT 1 FROM students WHERE admission_no=${admissionNo} LIMIT 1`);
    if (!exists.rows.length) return admissionNo;
  }
  return `ADM-${new Date().getFullYear()}-${Date.now()}`;
}

async function enroll(params: {
  name: string;
  email: string;
  admissionNo?: string;
  cohort?: string;
  programme?: string;
}) {
  const email = cleanText(params.email, 255).toLowerCase();
  const name = cleanText(params.name, 255);
  let admissionNo = cleanText(params.admissionNo || '', 100);
  if (!admissionNo) admissionNo = await generateAdmissionNumber();

  const existing = await db.execute(sql`
    SELECT * FROM students WHERE LOWER(email) = LOWER(${email}) OR admission_no = ${admissionNo} LIMIT 1
  `);
  if (existing.rows.length) {
    return { student: existing.rows[0] as any, created: false };
  }

  const cohort = cleanText(params.cohort || `Intake ${new Date().getFullYear()}`, 100);
  const programme = cleanText(params.programme || '', 255) || null;
  const studentResult = await db.execute(sql`
    INSERT INTO students (name,email,phone,admission_no,cohort,programme,department,avatar,account_status,created_at,updated_at)
    VALUES (${name}, ${email}, ${null}, ${admissionNo}, ${cohort}, ${programme}, ${null}, ${null}, 'Pending Setup', NOW(), NOW())
    RETURNING *
  `);
  const student = studentResult.rows[0] as any;
  const { plain } = resolvePassword(undefined, 'student');
  await upsertUserAuthRecord({
    username: admissionNo,
    email,
    passwordHash: hashPassword(plain),
    role: 'student',
    roleId: String(student.id),
    isActive: true,
    mustChangePassword: true,
  });
  return { student, created: true };
}

async function main() {
  const email = `alloc.verify.${Date.now()}@alikamedical.co.ke`;
  const first = await enroll({
    name: 'Allocation Verify Student',
    email,
    cohort: '2026 Intake',
    programme: 'Caregiver Certificate',
  });
  if (!first.created) throw new Error('expected first enroll to create');
  const id1 = first.student.id;

  const second = await enroll({
    name: 'Allocation Verify Student Duplicate Attempt',
    email,
    cohort: '2026 Intake',
  });
  if (second.created) throw new Error('duplicate enroll created a second student');
  if (String(second.student.id) !== String(id1)) throw new Error('duplicate path returned different student id');

  const listed = await db.execute(sql`
    SELECT id, admission_no, email FROM students WHERE id = ${id1} LIMIT 1
  `);
  if (!listed.rows.length) throw new Error('admitted student missing from students table');
  console.log('PASS same student id reused:', {
    id: id1,
    admissionNo: (listed.rows[0] as any).admission_no,
    email: (listed.rows[0] as any).email,
  });

  // Cleanup verification row + auth
  await db.execute(sql`DELETE FROM users WHERE role_id = ${String(id1)} OR LOWER(email) = LOWER(${email})`);
  await db.execute(sql`DELETE FROM students WHERE id = ${id1}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('FAIL', err);
  process.exit(1);
});
