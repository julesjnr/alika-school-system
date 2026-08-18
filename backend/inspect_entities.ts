import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("=== COURSES ===");
  const coursesRes = await db.execute(sql`SELECT id, title, code, faculty, fees, active FROM courses`);
  console.log(coursesRes.rows);

  console.log("\n=== INVOICES ===");
  const invRes = await db.execute(sql`SELECT * FROM invoices LIMIT 5`);
  console.log(invRes.rows);

  console.log("\n=== PAYMENTS ===");
  const payRes = await db.execute(sql`SELECT * FROM payments LIMIT 5`);
  console.log(payRes.rows);

  console.log("\n=== SAMPLE STUDENTS ===");
  const stuRes = await db.execute(sql`SELECT id, admission_number, name, email, current_balance FROM students LIMIT 5`);
  console.log(stuRes.rows);

  console.log("\n=== SAMPLE LECTURERS ===");
  const lecRes = await db.execute(sql`SELECT id, staff_id, name, email, department, role FROM lecturers LIMIT 5`);
  console.log(lecRes.rows);

  console.log("\n=== NOTIFICATIONS ===");
  const notifRes = await db.execute(sql`SELECT * FROM notifications LIMIT 5`);
  console.log(notifRes.rows);

  console.log("\n=== STUDENT LEDGER ===");
  const ledgerRes = await db.execute(sql`SELECT * FROM student_ledger LIMIT 5`);
  console.log(ledgerRes.rows);

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
