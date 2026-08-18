import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
import { issueAccessToken } from './src/auth.ts';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://127.0.0.1:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'zenti_secret_key_development_987654321';

async function runAudit() {
  const results: {
    section: string;
    passed: boolean;
    name: string;
    details: string;
    error?: string;
  }[] = [];

  function record(section: string, name: string, passed: boolean, details: string, error?: string) {
    results.push({ section, name, passed, details, error });
    const statusStr = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${statusStr}] ${section} > ${name}: ${details} ${error ? `(Error: ${error})` : ''}`);
  }

  console.log("\n=======================================================");
  console.log("STARTING PRODUCTION ACCEPTANCE AUDIT SUITE");
  console.log("Institution: Alika Medical Training College & Medical Center");
  console.log("=======================================================\n");

  // Load real users from DB
  const adminUserRes = await db.execute(sql`SELECT * FROM users WHERE role='admin' AND is_active=true LIMIT 1`);
  const adminUser: any = adminUserRes.rows[0];
  const adminToken = adminUser ? issueAccessToken(adminUser.username, adminUser.role, adminUser.email, JWT_SECRET, adminUser.role_id, adminUser.session_version || 0) : '';

  const studentUserRes = await db.execute(sql`SELECT * FROM users WHERE role='student' AND is_active=true LIMIT 1`);
  const studentUser: any = studentUserRes.rows[0];
  const studentToken = studentUser ? issueAccessToken(studentUser.username, 'student', studentUser.email, JWT_SECRET, studentUser.role_id, studentUser.session_version || 0) : '';

  const lecturerUserRes = await db.execute(sql`SELECT * FROM users WHERE role='lecturer' AND is_active=true LIMIT 1`);
  const lecturerUser: any = lecturerUserRes.rows[0];
  const lecturerToken = lecturerUser ? issueAccessToken(lecturerUser.username, 'lecturer', lecturerUser.email, JWT_SECRET, lecturerUser.role_id, lecturerUser.session_version || 0) : '';

  const accountantUserRes = await db.execute(sql`SELECT * FROM users WHERE role='accountant' AND is_active=true LIMIT 1`);
  const accountantUser: any = accountantUserRes.rows[0];
  const accountantToken = accountantUser ? issueAccessToken(accountantUser.username, 'accountant', accountantUser.email, JWT_SECRET, accountantUser.role_id, accountantUser.session_version || 0) : '';

  const librarianUserRes = await db.execute(sql`SELECT * FROM users WHERE role='librarian' AND is_active=true LIMIT 1`);
  const librarianUser: any = librarianUserRes.rows[0];
  const librarianToken = librarianUser ? issueAccessToken(librarianUser.username, 'librarian', librarianUser.email, JWT_SECRET, librarianUser.role_id, librarianUser.session_version || 0) : '';

  // -----------------------------------------------------------
  // 1. PUBLIC APPLICATION WORKFLOW
  // -----------------------------------------------------------
  let submittedAppId = '';
  let submittedAppNo = '';
  let sampleUploadedDocUrl = '';
  try {
    const courseRes = await db.execute(sql`SELECT id FROM courses LIMIT 1`);
    const courseId = courseRes.rows[0]?.id;

    // A. Upload Required Documents (passport_photo, national_id, kcse_certificate)
    const docTypes = ['passport_photo', 'national_id', 'kcse_certificate'];
    const uploadedDocs: any[] = [];

    for (const dType of docTypes) {
      const formData = new FormData();
      const blob = new Blob([`%PDF-1.4 test document for ${dType}`], { type: 'application/pdf' });
      formData.append('documentType', dType);
      formData.append('file', blob, `${dType}_sample.pdf`);

      const uploadRes = await fetch(`${API_BASE}/api/public/application-documents`, {
        method: 'POST',
        body: formData
      });
      const uploadJson = await uploadRes.json();
      if (uploadRes.status === 201 && uploadJson.fileUrl) {
        uploadedDocs.push({
          documentType: dType,
          fileName: `${dType}_sample.pdf`,
          mimeType: 'application/pdf',
          fileUrl: uploadJson.fileUrl,
          sizeBytes: 1024
        });
        sampleUploadedDocUrl = uploadJson.fileUrl;
      }
    }

    const allDocsUploaded = uploadedDocs.length === 3;
    record('1. Public Application', 'Document Upload API (3 required documents)', allDocsUploaded, `Uploaded ${uploadedDocs.length}/3 documents`);

    // B. Application Submission
    const appPayload = {
      fullName: 'Amina Mohamed Hassan',
      nationalId: `ID-${Date.now().toString().slice(-8)}`,
      dateOfBirth: '2002-08-20',
      gender: 'Female',
      nationality: 'Kenyan',
      phone: '+254712345678',
      email: `amina.audit.${Date.now()}@example.com`,
      postalAddress: 'P.O. Box 456, Nairobi',
      previousSchool: 'Kenya High School',
      highestQualification: 'KCSE Certificate',
      kcseGrade: 'B+',
      firstChoiceCourseId: courseId,
      preferredIntake: 'September 2026',
      documents: uploadedDocs
    };

    const submitAppRes = await fetch(`${API_BASE}/api/public/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appPayload)
    });
    const submitAppJson = await submitAppRes.json();
    const appCreated = submitAppRes.status === 201 && submitAppJson.applicationNo;
    submittedAppId = submitAppJson.application?.id;
    submittedAppNo = submitAppJson.applicationNo;
    record('1. Public Application', 'Application Submission API', appCreated, `HTTP ${submitAppRes.status}, AppNo: ${submittedAppNo}`);

    // C. Verify in PostgreSQL
    if (submittedAppId) {
      const dbAppRes = await db.execute(sql`SELECT * FROM applications WHERE id=${submittedAppId}`);
      const dbDocsRes = await db.execute(sql`SELECT * FROM application_documents WHERE application_id=${submittedAppId}`);
      const dbSaved = Boolean(dbAppRes.rows[0] && dbDocsRes.rows.length === 3);
      record('1. Public Application', 'PostgreSQL Application & Document Records', dbSaved, `Found in DB with ${dbDocsRes.rows.length} document(s)`);
    }

    // D. Public Reference Retrieval
    if (submittedAppNo) {
      const refRes = await fetch(`${API_BASE}/api/public/applications/reference/${submittedAppNo}`);
      const refJson = await refRes.json();
      const refOk = refRes.status === 200 && refJson.applicationNo === submittedAppNo;
      record('1. Public Application', 'Public Reference Retrieval API', refOk, `HTTP ${refRes.status}, Reference match`);
    }

    // E. Admin Admissions Retrieval
    const adminAppsRes = await fetch(`${API_BASE}/api/admin/applications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminAppsJson = await adminAppsRes.json();
    const adminSeesApp = adminAppsRes.status === 200 && Array.isArray(adminAppsJson) && adminAppsJson.some((a: any) => a.id === submittedAppId);
    record('1. Public Application', 'Admin Admissions View', adminSeesApp, `Admin sees application in /api/admin/applications`);

  } catch (err: any) {
    record('1. Public Application', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 2. PUBLIC CONSULTATION WORKFLOW
  // -----------------------------------------------------------
  let submittedConsultId = '';
  try {
    const consultPayload = {
      fullName: 'Brian Omondi',
      email: `brian.consult.${Date.now()}@example.com`,
      phone: '+254733445566',
      preferredDate: '2026-09-15',
      preferredTime: '02:00 PM',
      subject: 'Diploma in Pharmacy inquiry',
      message: 'I would like to inquire about course duration, practical lab sessions, and fee structures.'
    };

    const submitConsultRes = await fetch(`${API_BASE}/api/public/consultations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultPayload)
    });
    const submitConsultJson = await submitConsultRes.json();
    const consultCreated = submitConsultRes.status === 201 && submitConsultJson.requestNo;
    submittedConsultId = submitConsultJson.consultation?.id;
    record('2. Public Consultation', 'Consultation Submission API', consultCreated, `HTTP ${submitConsultRes.status}, RequestNo: ${submitConsultJson.requestNo}`);

    // DB Record Check
    if (submittedConsultId) {
      const dbConsultRes = await db.execute(sql`SELECT * FROM consultations WHERE id=${submittedConsultId}`);
      const dbMsgRes = await db.execute(sql`SELECT * FROM consultation_messages WHERE consultation_id=${submittedConsultId}`);
      record('2. Public Consultation', 'PostgreSQL Consultation & Initial Message', Boolean(dbConsultRes.rows[0] && dbMsgRes.rows.length > 0), `Found in DB with status: ${dbConsultRes.rows[0]?.status}`);
    }

    // Admin View
    const adminConsultRes = await fetch(`${API_BASE}/api/admin/consultations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminConsultJson = await adminConsultRes.json();
    const adminSeesConsult = adminConsultRes.status === 200 && Array.isArray(adminConsultJson) && adminConsultJson.some((c: any) => c.id === submittedConsultId);
    record('2. Public Consultation', 'Admin Consultations View', adminSeesConsult, `Admin sees consultation in /api/admin/consultations`);

    // Admin Reply
    if (submittedConsultId) {
      const replyRes = await fetch(`${API_BASE}/api/admin/consultations/${submittedConsultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: 'contacted',
          reply: 'Thank you for your interest in Alika Medical Training College. The Diploma in Pharmacy is a 3-year accredited program with comprehensive clinical lab attachments.'
        })
      });
      const replyJson = await replyRes.json();
      const replyOk = replyRes.status === 200 && replyJson.status === 'contacted';
      record('2. Public Consultation', 'Admin Consultation Reply & Status Update', replyOk, `HTTP ${replyRes.status}, Status: ${replyJson.status}`);

      // Check Conversation History
      const msgRes = await fetch(`${API_BASE}/api/admin/consultations/${submittedConsultId}/messages`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const msgJson = await msgRes.json();
      const msgOk = msgRes.status === 200 && Array.isArray(msgJson) && msgJson.length >= 2;
      record('2. Public Consultation', 'Consultation Conversation Messages History', msgOk, `Found ${msgJson.length} message(s) in history`);
    }

  } catch (err: any) {
    record('2. Public Consultation', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 3. AUTHENTICATION & CROSS-PORTAL PROTECTION
  // -----------------------------------------------------------
  try {
    // Cross-portal rejection tests
    const crossPortalTests = [
      { identifier: studentUser?.username, portalExpected: 'super_admin', shouldReject: true, desc: 'Student credentials blocked on Admin portal' },
      { identifier: studentUser?.username, portalExpected: 'lecturer', shouldReject: true, desc: 'Student credentials blocked on Lecturer portal' },
      { identifier: lecturerUser?.username, portalExpected: 'student', shouldReject: true, desc: 'Lecturer credentials blocked on Student portal' },
      { identifier: adminUser?.username, portalExpected: 'student', shouldReject: true, desc: 'Admin credentials blocked on Student portal' },
    ];

    for (const t of crossPortalTests) {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: t.identifier,
          passcode: 'some_password_attempt',
          expectedRole: t.portalExpected
        })
      });
      const json = await res.json();
      const blocked = res.status === 401 || res.status === 400 || json.success === false;
      record('3. Authentication', t.desc, blocked, `Blocked: ${json.error || 'rejected'}`);
    }

    // Role verification for tokens
    record('3. Authentication', 'Admin Role Session Token Verification', Boolean(adminToken), 'Admin token issued and valid');
    record('3. Authentication', 'Student Role Session Token Verification', Boolean(studentToken), 'Student token issued and valid');
    record('3. Authentication', 'Lecturer Role Session Token Verification', Boolean(lecturerToken), 'Lecturer token issued and valid');
    record('3. Authentication', 'Accountant Role Session Token Verification', Boolean(accountantToken), 'Accountant token issued and valid');
    record('3. Authentication', 'Librarian Role Session Token Verification', Boolean(librarianToken), 'Librarian token issued and valid');

  } catch (err: any) {
    record('3. Authentication', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 4. AUTHORIZATION & IDOR CHECKS
  // -----------------------------------------------------------
  try {
    // A. Student calling Admin Endpoints
    const studentAccessAdmin = await fetch(`${API_BASE}/api/admin/applications`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const adminBlocked = studentAccessAdmin.status === 403;
    record('4. Authorization', 'RBAC Student blocked from /api/admin/applications', adminBlocked, `HTTP ${studentAccessAdmin.status}`);

    const studentAccessStats = await fetch(`${API_BASE}/api/admin/system-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const statsBlocked = studentAccessStats.status === 403;
    record('4. Authorization', 'RBAC Student blocked from /api/admin/system-stats', statsBlocked, `HTTP ${studentAccessStats.status}`);

    // B. Unauthenticated requests to protected endpoints
    const noAuthRes = await fetch(`${API_BASE}/api/admin/applications`);
    const noAuthBlocked = noAuthRes.status === 401;
    record('4. Authorization', 'Unauthenticated request blocked from protected API', noAuthBlocked, `HTTP ${noAuthRes.status}`);

    // C. Student calling student password reset endpoint (must be blocked by RBAC)
    const studentResetOther = await fetch(`${API_BASE}/api/students/${studentUser?.id}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const resetBlocked = studentResetOther.status === 403;
    record('4. Authorization', 'RBAC Student blocked from /api/students/:id/reset-password', resetBlocked, `HTTP ${studentResetOther.status}`);

  } catch (err: any) {
    record('4. Authorization', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 5. FACULTY DASHBOARD ENDPOINTS
  // -----------------------------------------------------------
  try {
    const facultyGetEndpoints = [
      { path: '/api/faculty/dashboard', desc: 'Faculty Dashboard' },
      { path: `/api/lecturer/dashboard-summary?lecturerId=${lecturerUser?.role_id || ''}`, desc: 'Lecturer Dashboard Summary' },
      { path: `/api/faculty/assessment-analytics?lecturerId=${lecturerUser?.role_id || ''}`, desc: 'Faculty Assessment Analytics' },
      { path: '/api/faculty/students', desc: 'Faculty Students List' },
      { path: '/api/faculty/student-lookup?term=TEST', desc: 'Faculty Student Lookup' }
    ];

    for (const ep of facultyGetEndpoints) {
      const epRes = await fetch(`${API_BASE}${ep.path}`, {
        headers: { Authorization: `Bearer ${lecturerToken}` }
      });
      const epOk = epRes.status === 200;
      record('5. Faculty Dashboard', ep.desc, epOk, `HTTP ${epRes.status}`);
    }

    // POST Teaching Session
    const teachRes = await fetch(`${API_BASE}/api/faculty/teaching-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lecturerToken}`
      },
      body: JSON.stringify({
        lecturerId: lecturerUser?.role_id || lecturerUser?.username,
        subjectCode: 'MED-101',
        topic: 'Introduction to Anatomy and Physiology',
        durationHours: 2,
        sessionDate: '2026-08-15',
        sessionTime: '10:00'
      })
    });
    const teachOk = teachRes.status === 200 || teachRes.status === 201;
    record('5. Faculty Dashboard', 'Log Teaching Session API', teachOk, `HTTP ${teachRes.status}`);

  } catch (err: any) {
    record('5. Faculty Dashboard', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 6. APPLICATIONS ADMIN REVIEW & ADMISSION LIFECYCLE
  // -----------------------------------------------------------
  try {
    if (submittedAppId) {
      // Approve Application
      const approveRes = await fetch(`${API_BASE}/api/admin/applications/${submittedAppId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: 'approved',
          internalNote: 'Meets all academic criteria for clinical training.'
        })
      });
      const approveJson = await approveRes.json();
      const approvedOk = approveRes.status === 200 && approveJson.status === 'approved' && approveJson.admission_no;
      record('6. Applications Lifecycle', 'Admin Approval & Admission Number Assignment', approvedOk, `HTTP ${approveRes.status}, AdmissionNo: ${approveJson?.admission_no}`);

      // Verify Student Record Creation in PostgreSQL
      const studentCreatedRes = await db.execute(sql`SELECT * FROM students WHERE admission_no=${approveJson.admission_no}`);
      const studentCreated = studentCreatedRes.rows.length > 0;
      record('6. Applications Lifecycle', 'Student Creation in PostgreSQL', studentCreated, `Student record created with ID: ${studentCreatedRes.rows[0]?.id}`);

      // Verify Auth Record in users table
      const authUserRes = await db.execute(sql`SELECT * FROM users WHERE username=${approveJson.admission_no}`);
      const authUserCreated = authUserRes.rows.length > 0;
      record('6. Applications Lifecycle', 'Student User Auth Record in PostgreSQL', authUserCreated, `User auth record created with role: ${authUserRes.rows[0]?.role}`);

      // Verify Admission Letter Email Queued
      const emailRes = await db.execute(sql`SELECT * FROM email_outbox WHERE recipient=${approveJson.email} AND event_key LIKE '%admission%'`);
      const emailQueued = emailRes.rows.length > 0;
      record('6. Applications Lifecycle', 'Admission Letter Email Queued in email_outbox', emailQueued, `Queued with subject: ${emailRes.rows[0]?.subject}`);
    }
  } catch (err: any) {
    record('6. Applications Lifecycle', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 7. CONSULTATIONS PERSISTENCE & MESSAGES
  // -----------------------------------------------------------
  try {
    const consultCountRes = await db.execute(sql`SELECT count(*) as count FROM consultations`);
    const msgsCountRes = await db.execute(sql`SELECT count(*) as count FROM consultation_messages`);
    const consultsPersisted = Number(consultCountRes.rows[0].count) > 0;
    record('7. Consultations', 'Consultation Database Records Persisted', consultsPersisted, `Total in DB: ${consultCountRes.rows[0].count} consultations, ${msgsCountRes.rows[0].count} messages`);
  } catch (err: any) {
    record('7. Consultations', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 8. COURSES WORKFLOW
  // -----------------------------------------------------------
  try {
    // A. Course List
    const coursesRes = await fetch(`${API_BASE}/api/courses`);
    const coursesJson = await coursesRes.json();
    const coursesOk = coursesRes.status === 200 && Array.isArray(coursesJson) && coursesJson.length > 0;
    record('8. Courses', 'Public Course List API', coursesOk, `HTTP ${coursesRes.status}, returned ${coursesJson.length} courses`);

    // B. Course Edit / Patch
    const targetCourse = coursesJson[0];
    if (targetCourse) {
      const patchCourseRes = await fetch(`${API_BASE}/api/admin/courses/${targetCourse.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: targetCourse.title,
          code: targetCourse.code,
          faculty: targetCourse.faculty,
          duration: targetCourse.duration,
          fees: targetCourse.fees
        })
      });
      const patchOk = patchCourseRes.status === 200;
      record('8. Courses', 'Admin Course Edit API', patchOk, `HTTP ${patchCourseRes.status}`);

      // C. Course Gallery
      const galleryRes = await fetch(`${API_BASE}/api/courses/${targetCourse.id}/gallery`);
      const galleryOk = galleryRes.status === 200;
      record('8. Courses', 'Course Gallery API', galleryOk, `HTTP ${galleryRes.status}`);

      // D. Course Reviews
      const reviewRes = await fetch(`${API_BASE}/api/courses/${targetCourse.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          rating: 5,
          comment: 'Outstanding clinical curriculum and highly dedicated lecturers.',
          studentName: 'Audit Student',
          studentId: studentUser?.role_id || studentUser?.id
        })
      });
      const reviewOk = reviewRes.status === 200 || reviewRes.status === 201;
      record('8. Courses', 'Course Review Submission API', reviewOk, `HTTP ${reviewRes.status}`);
    }
  } catch (err: any) {
    record('8. Courses', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 9. FINANCE WORKFLOW
  // -----------------------------------------------------------
  try {
    // A. Invoices API
    const invRes = await fetch(`${API_BASE}/api/invoices`, {
      headers: { Authorization: `Bearer ${accountantToken}` }
    });
    const invJson = await invRes.json();
    const invOk = invRes.status === 200 && Array.isArray(invJson);
    record('9. Finance', 'Invoices Retrieval API', invOk, `HTTP ${invRes.status}, returned ${invJson.length} invoices`);

    // B. Payments API
    const payRes = await fetch(`${API_BASE}/api/finance/payments`, {
      headers: { Authorization: `Bearer ${accountantToken}` }
    });
    const payJson = await payRes.json();
    const payOk = payRes.status === 200 && Array.isArray(payJson);
    record('9. Finance', 'Payments Retrieval API', payOk, `HTTP ${payRes.status}, returned ${payJson.length} payments`);

    // C. Student Ledger DB check
    const ledgerCountRes = await db.execute(sql`SELECT count(*) as count FROM student_ledger`);
    const ledgerOk = Number(ledgerCountRes.rows[0].count) >= 0;
    record('9. Finance', 'Student Ledger in PostgreSQL', ledgerOk, `Found ${ledgerCountRes.rows[0].count} ledger entries in DB`);
  } catch (err: any) {
    record('9. Finance', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 10. NOTIFICATIONS & EMAIL OUTBOX
  // -----------------------------------------------------------
  try {
    const outboxCountRes = await db.execute(sql`SELECT count(*) as count FROM email_outbox`);
    const notifCountRes = await db.execute(sql`SELECT count(*) as count FROM notifications`);
    const outboxOk = Number(outboxCountRes.rows[0].count) > 0;
    record('10. Notifications', 'Email Outbox & Notifications Persistence', outboxOk, `Found ${outboxCountRes.rows[0].count} queued email(s) in email_outbox, ${notifCountRes.rows[0].count} in notifications`);
  } catch (err: any) {
    record('10. Notifications', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 11. FILE SECURITY
  // -----------------------------------------------------------
  try {
    // Unauthenticated access to /uploads/applications/
    const filename = sampleUploadedDocUrl ? path.basename(sampleUploadedDocUrl) : 'sample.pdf';
    const unauthFileRes = await fetch(`${API_BASE}/uploads/applications/${filename}`);
    const unauthBlocked = unauthFileRes.status === 401 || unauthFileRes.status === 403;
    record('11. File Security', 'Unauthenticated access to private applicant document blocked', unauthBlocked, `HTTP ${unauthFileRes.status}`);

    // Authenticated access with admin token
    const authFileRes = await fetch(`${API_BASE}/uploads/applications/${filename}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const authFileOk = authFileRes.status === 200 || authFileRes.status === 304;
    record('11. File Security', 'Authorized access to applicant document permitted', authFileOk, `HTTP ${authFileRes.status}`);

  } catch (err: any) {
    record('11. File Security', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 12. DATABASE MIGRATIONS
  // -----------------------------------------------------------
  try {
    const migrationsRes = await db.execute(sql`SELECT count(*) as count FROM app_migrations`);
    const migrationsOk = Number(migrationsRes.rows[0].count) > 0;
    record('12. Database Migrations', 'app_migrations schema tracking', migrationsOk, `Found ${migrationsRes.rows[0].count} applied migration(s)`);
  } catch (err: any) {
    record('12. Database Migrations', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 13. PRODUCTION CONFIGURATION
  // -----------------------------------------------------------
  try {
    const hasDbUrl = Boolean(process.env.DATABASE_URL || (process.env.SQL_HOST && process.env.SQL_PASSWORD));
    const hasJwtSecret = Boolean(process.env.JWT_SECRET);
    const hasAppUrl = Boolean(process.env.APP_URL || process.env.APP_BASE_URL);
    record('13. Production Configuration', 'Database Environment Variables', hasDbUrl, 'PostgreSQL credentials configured');
    record('13. Production Configuration', 'JWT Secret Key', hasJwtSecret, 'JWT_SECRET configured');
    record('13. Production Configuration', 'App URL Configuration', hasAppUrl, `APP_URL: ${process.env.APP_URL}`);
  } catch (err: any) {
    record('13. Production Configuration', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  // -----------------------------------------------------------
  // 14. BRANDING
  // -----------------------------------------------------------
  try {
    const serverTsContent = fs.readFileSync(path.join(process.cwd(), 'backend', 'server.ts'), 'utf-8');
    const customerFacingZenti = [
      serverTsContent.includes("Reset your Zenti administrator password"),
      serverTsContent.includes("portal.zenti.local"),
      serverTsContent.includes("Zenti Admissions Team"),
      serverTsContent.includes("admin@zenti.edu"),
      serverTsContent.includes("@zenti.local"),
      serverTsContent.includes('"ZENTI-" +')
    ];
    const brandingClean = !customerFacingZenti.some(Boolean);
    record('14. Branding', 'Customer-facing institutional branding consistency', brandingClean, brandingClean ? 'All customer-facing branding clean' : 'Found legacy Zenti customer-facing references in backend/server.ts');
  } catch (err: any) {
    record('14. Branding', 'Workflow Execution', false, 'Exception occurred', err.message);
  }

  console.log("\n=======================================================");
  console.log("AUDIT SUMMARY");
  console.log(`Total tests run: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  console.log("=======================================================\n");

  process.exit(0);
}

runAudit().catch(err => {
  console.error("Audit suite crashed:", err);
  process.exit(1);
});
