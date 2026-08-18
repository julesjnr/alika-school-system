import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("=== CHECKING USERS IN POSTGRESQL ===");
  const usersRes = await db.execute(sql`
    SELECT id, username, email, role, role_id, is_active, must_change_password 
    FROM users 
    ORDER BY role, id
  `);
  console.log(`Found ${usersRes.rows.length} users:`);
  for (const u of usersRes.rows) {
    console.log(`- Role: ${u.role}, Username: ${u.username}, Email: ${u.email}, Active: ${u.is_active}, MustChange: ${u.must_change_password}`);
  }

  console.log("\n=== CHECKING RECORD COUNTS ===");
  const tables = [
    'applications', 'application_documents', 'consultations', 'consultation_messages',
    'students', 'lecturers', 'courses', 'course_reviews', 'course_gallery_images',
    'invoices', 'payments', 'student_ledger', 'email_outbox', 'notifications', 'mock_emails'
  ];
  for (const t of tables) {
    const res = await db.execute(sql.raw(`SELECT count(*) as cnt FROM ${t}`));
    console.log(`${t}: ${res.rows[0].cnt} records`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
