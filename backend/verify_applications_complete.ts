import { issueAccessToken } from './src/auth.ts';

const API_BASE = 'http://127.0.0.1:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'zenti_secret_key_development_987654321';

async function runVerification() {
  console.log("==========================================================================");
  console.log("PUBLIC APPLICATION & ADMIN ADMISSIONS WORKFLOW VERIFICATION");
  console.log("==========================================================================\n");

  // 1. Check Courses
  console.log("[1/7] Fetching active courses from institutional database...");
  const coursesRes = await fetch(`${API_BASE}/api/courses`);
  if (!coursesRes.ok) throw new Error(`Failed to load courses: ${coursesRes.statusText}`);
  const courses: any = await coursesRes.json();
  if (!courses.length) throw new Error("No active courses found");
  const firstCourse = courses[0];
  const secondCourse = courses.length > 1 ? courses[1] : null;
  console.log(`      ✓ Verified ${courses.length} courses loaded.`);
  console.log(`      - First Choice: ${firstCourse.title} (${firstCourse.id})`);
  if (secondCourse) console.log(`      - Second Choice: ${secondCourse.title} (${secondCourse.id})`);

  // 2. Validate Required Fields
  console.log("\n[2/7] Testing validation of required application fields...");
  const invalidRes = await fetch(`${API_BASE}/api/public/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: '' })
  });
  if (invalidRes.status !== 400) throw new Error(`Expected 400, got ${invalidRes.status}`);
  const invalidJson: any = await invalidRes.json();
  console.log(`      ✓ Correctly rejected missing required fields (HTTP 400): "${invalidJson.error}"`);

  // 3. Upload Required Documents (passport_photo, national_id, kcse_certificate)
  console.log("\n[3/7] Uploading required supporting documents...");
  const docTypes = [
    { type: 'passport_photo', name: 'passport.jpg', mime: 'image/jpeg', content: '%JPEG_SAMPLE_IMAGE_DATA' },
    { type: 'national_id', name: 'national_id.pdf', mime: 'application/pdf', content: '%PDF-1.4_SAMPLE_NATIONAL_ID' },
    { type: 'kcse_certificate', name: 'kcse_cert.pdf', mime: 'application/pdf', content: '%PDF-1.4_SAMPLE_KCSE_CERT' }
  ];

  const uploadedDocs: any[] = [];
  for (const doc of docConfigs(docTypes)) {
    const formData = new FormData();
    const blob = new Blob([doc.content], { type: doc.mime });
    formData.append('documentType', doc.type);
    formData.append('file', blob, doc.name);

    const uploadRes = await fetch(`${API_BASE}/api/public/application-documents`, {
      method: 'POST',
      body: formData
    });
    if (uploadRes.status !== 201) throw new Error(`Failed to upload ${doc.type}: ${uploadRes.statusText}`);
    const uploadData: any = await uploadRes.json();
    uploadedDocs.push({
      documentType: doc.type,
      fileName: uploadData.fileName,
      mimeType: uploadData.mimeType,
      fileUrl: uploadData.fileUrl,
      sizeBytes: uploadData.sizeBytes
    });
    console.log(`      ✓ Uploaded ${doc.type}: ${uploadData.fileUrl} (${uploadData.sizeBytes} bytes)`);
  }

  // 4. Missing Document Requirement Validation
  console.log("\n[4/7] Testing validation of missing document requirements...");
  const missingDocRes = await fetch(`${API_BASE}/api/public/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: "Brenda Chebet",
      nationalId: "38920192",
      dateOfBirth: "2002-12-05",
      gender: "Female",
      nationality: "Kenyan",
      phone: "+254712003344",
      email: "brenda.chebet@example.com",
      postalAddress: "P.O. Box 101, Bomet",
      previousSchool: "Moi Tea Girls",
      highestQualification: "KCSE Certificate",
      kcseGrade: "B+",
      firstChoiceCourseId: firstCourse.id,
      preferredIntake: "September 2026",
      documents: [uploadedDocs[0]] // Only 1 doc
    })
  });
  if (missingDocRes.status !== 400) throw new Error(`Expected 400 for missing docs, got ${missingDocRes.status}`);
  const missingDocJson: any = await missingDocRes.json();
  console.log(`      ✓ Correctly rejected missing documents (HTTP 400): "${missingDocJson.error}"`);

  // 5. Submit Valid Complete Public Application
  console.log("\n[5/7] Submitting complete public application with 3 verified documents...");
  const suffix = Date.now().toString().slice(-6);
  const testEmail = `brenda.chebet.${suffix}@example.com`;
  const validPayload = {
    fullName: "Brenda Chebet Rotich",
    nationalId: `ID-${suffix}`,
    dateOfBirth: "2002-12-05",
    gender: "Female",
    nationality: "Kenyan",
    phone: "+254712003344",
    email: testEmail,
    postalAddress: "P.O. Box 101-20400, Bomet",
    previousSchool: "Moi Tea Girls Secondary School",
    highestQualification: "KCSE Certificate",
    kcseGrade: "B+",
    firstChoiceCourseId: firstCourse.id,
    secondChoiceCourseId: secondCourse ? secondCourse.id : null,
    preferredIntake: "September 2026",
    documents: uploadedDocs
  };

  const submitRes = await fetch(`${API_BASE}/api/public/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload)
  });
  if (submitRes.status !== 201) {
    const err = await submitRes.text();
    throw new Error(`Submission failed: ${err}`);
  }
  const submitData: any = await submitRes.json();
  const applicationNo = submitData.applicationNo;
  const appId = submitData.application?.id;

  console.log(`      ✓ Application submitted and recorded in PostgreSQL:`);
  console.log(`        - Application Number: ${applicationNo}`);
  console.log(`        - Initial Status: ${submitData.status}`);
  console.log(`        - Database ID: ${appId}`);
  console.log(`        - Stored Documents: ${submitData.documents?.length}`);

  if (!applicationNo.startsWith('APP-')) throw new Error('Application number must start with APP-');
  if (submitData.status !== 'submitted') throw new Error('Status must be submitted');
  if (submitData.documents?.length !== 3) throw new Error('Must store all 3 documents');

  // 6. Public Lookup by Reference
  console.log("\n[6/7] Verifying public lookup by Application Reference...");
  const refRes = await fetch(`${API_BASE}/api/public/applications/reference/${applicationNo}`);
  if (refRes.status !== 200) throw new Error(`Lookup failed: ${refRes.statusText}`);
  const refData: any = await refRes.json();
  if (refData.applicationNo !== applicationNo) throw new Error('Reference mismatch');
  if (refData.fullName !== 'Brenda Chebet Rotich') throw new Error('Name mismatch');
  if (refData.status !== 'submitted') throw new Error('Status mismatch');
  if (refData.documents?.length !== 3) throw new Error('Documents mismatch');
  console.log(`      ✓ Public reference lookup verified: full details & ${refData.documents.length} documents linked.`);

  // 7. Admin Admissions Lifecycle & Persistence
  console.log("\n[7/7] Verifying Admin Admissions Workflow & Persistence Lifecycle...");
  const adminToken = issueAccessToken('admin', 'admin', 'admin@zenti.edu', JWT_SECRET, 'admin', 0);
  const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  // Fetch admin applications
  const adminListRes = await fetch(`${API_BASE}/api/admin/applications`, { headers: adminHeaders });
  if (adminListRes.status !== 200) throw new Error('Failed to load admin applications');
  const adminApps: any = await adminListRes.json();
  const matchedApp = adminApps.find((a: any) => a.id === appId || a.application_no === applicationNo);
  if (!matchedApp) throw new Error('Application not found in Admin list');

  console.log(`      ✓ Application located in Admin Admissions Hub:`);
  console.log(`        - Name: ${matchedApp.full_name}`);
  console.log(`        - 1st Choice Course: ${matchedApp.first_choice_course_title}`);
  console.log(`        - Status: ${matchedApp.status}`);
  console.log(`        - Attached Documents: ${matchedApp.documents?.length}`);

  // Update status -> under_review
  const reviewRes = await fetch(`${API_BASE}/api/admin/applications/${appId}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'under_review', internalNote: 'Verified candidate credentials.' })
  });
  if (reviewRes.status !== 200) throw new Error('Failed to update status to under_review');
  console.log(`      ✓ Status updated to 'under_review'.`);

  // Persistence check across reload
  const reloadCheck = await fetch(`${API_BASE}/api/public/applications/reference/${applicationNo}`);
  const reloadData: any = await reloadCheck.json();
  if (reloadData.status !== 'under_review') throw new Error('Status change not persisted across re-queries');
  console.log(`      ✓ Persistence verified: Reloading page preserves status 'under_review'.`);

  // Approve application
  const approveRes = await fetch(`${API_BASE}/api/admin/applications/${appId}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'approved', internalNote: 'Approved for September 2026 intake.' })
  });
  if (approveRes.status !== 200) throw new Error('Failed to approve application');
  const approveData: any = await approveRes.json();
  const admissionNo = approveData.admission_no;
  if (!admissionNo) throw new Error('Admission number not generated on approval');
  console.log(`      ✓ Application Approved! Generated Admission Number: ${admissionNo}`);

  // Verify student profile creation
  const studentsRes = await fetch(`${API_BASE}/api/students`, { headers: adminHeaders });
  if (studentsRes.status !== 200) throw new Error('Failed to fetch students list');
  const students: any = await studentsRes.json();
  const admitted = students.find((s: any) => s.admissionNo === admissionNo || s.email.toLowerCase() === testEmail.toLowerCase());
  if (!admitted) throw new Error('Student profile was not created upon approval');
  console.log(`      ✓ Admitted Student profile created in PostgreSQL:`);
  console.log(`        - Name: ${admitted.name}`);
  console.log(`        - Admission No: ${admitted.admissionNo}`);
  console.log(`        - Programme: ${admitted.programme}`);
  console.log(`        - Status: ${admitted.accountStatus}`);

  // Final persistence check
  const finalCheck = await fetch(`${API_BASE}/api/public/applications/reference/${applicationNo}`);
  const finalData: any = await finalCheck.json();
  if (finalData.status !== 'approved') throw new Error('Approved status not persisted');
  if (finalData.admissionNo !== admissionNo) throw new Error('Admission number not persisted');
  console.log(`      ✓ Final Persistence Confirmed: Application ${applicationNo} fully approved and stored.`);

  console.log("\n==========================================================================");
  console.log("🎉 ALL PUBLIC APPLICATION & ADMISSIONS WORKFLOW CHECKS PASSED (100%)");
  console.log("==========================================================================\n");
}

function docConfigs(types: any[]) {
  return types;
}

runVerification()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("\n❌ VERIFICATION FAILED:", err);
    process.exit(1);
  });
