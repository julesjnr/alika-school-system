import dotenv from 'dotenv';
dotenv.config({ override: false });
import { db } from '../backend/src/db/index';
import { students, studentAssessmentMarks, grades } from '../backend/src/db/schema';
import { computePublishedAssessmentSummary } from '../backend/src/studentLookup';
import { validateAssessmentWeights, validateAggregateGrade } from '../backend/src/marksValidation';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

async function run() {
  const admissionNo = 'ALK-002';
  const subjectCode = 'CERT-NURSE-ASSISTANT';

  const [student] = await db.select().from(students).where(eq(students.admissionNo, admissionNo)).limit(1);
  if (!student) { console.log('student not found'); return; }
  const studentId = student.id;

  // Step 1: Lecturer saves a raw mark (insert or upsert)
  const testKind = 'Assignment';
  const rawMarkValue = 15; // out of maxMarks (assumed present)
  const maxMarks = 20;
  const weight = 20; // percentage weight

  // Upsert into studentAssessmentMarks by unique constraint: studentId+subjectCode+assessmentKind
  const existing = await db.select().from(studentAssessmentMarks).where(and(eq(studentAssessmentMarks.studentId, studentId), eq(studentAssessmentMarks.subjectCode, subjectCode), eq(studentAssessmentMarks.assessmentKind, testKind))).limit(1);
  if (existing.length === 0) {
    await db.insert(studentAssessmentMarks).values({ id: crypto.randomUUID(), studentId, subjectCode, assessmentKind: testKind, rawMark: String(rawMarkValue), maxMarks: String(maxMarks), weight: String(weight) });
    console.log('Inserted raw mark row');
  } else {
    await db.update(studentAssessmentMarks).set({ rawMark: String(rawMarkValue), maxMarks: String(maxMarks), weight: String(weight) }).where(eq(studentAssessmentMarks.id, existing[0].id));
    console.log('Updated raw mark row');
  }

  const checkRow = await db.select().from(studentAssessmentMarks).where(and(eq(studentAssessmentMarks.studentId, studentId), eq(studentAssessmentMarks.subjectCode, subjectCode), eq(studentAssessmentMarks.assessmentKind, testKind))).limit(1);
  console.log('Raw row now:', checkRow[0]);

  // Step 2: Lecturer publishes result (reuse server logic locally)
  const allRows = await db.select().from(studentAssessmentMarks).where(and(eq(studentAssessmentMarks.studentId, studentId), eq(studentAssessmentMarks.subjectCode, subjectCode)));
  // build config
  const configMap = new Map();
  for (const r of allRows as any[]) {
    const kind = String(r.assessmentKind || '').trim();
    if (!kind) continue;
    const mm = Number(r.maxMarks) || 0;
    const w = Number(r.weight) || 0;
    if (!configMap.has(kind)) configMap.set(kind, { kind, maxMarks: mm, weight: w });
    else {
      const exist = configMap.get(kind);
      if ((exist.maxMarks || 0) <= 0 && mm > 0) exist.maxMarks = mm;
      if ((exist.weight || 0) <= 0 && w > 0) exist.weight = w;
      configMap.set(kind, exist);
    }
  }
  const assessmentList = Array.from(configMap.values()).map(c => ({ kind: c.kind, maxMarks: c.maxMarks, weight: c.weight }));
  const weightError = validateAssessmentWeights(assessmentList);
  console.log('weightError', weightError);
  if (weightError) { console.log('Cannot publish: weights invalid'); return; }

  const publishedSummary = computePublishedAssessmentSummary(allRows.map((r:any) => ({ subjectCode, rawMark: r.rawMark, maxMarks: r.maxMarks, weight: r.weight, assessmentKind: r.assessmentKind })), [], { courseTitle: null, courseCode: null });
  const subjectEntry = (publishedSummary.subjects || []).find((s:any) => s.subjectCode === subjectCode);
  if (!subjectEntry) { console.log('no subject entry'); return; }
  console.log('subjectEntry', subjectEntry);
  if (!Number.isFinite(subjectEntry.totalWeight) || Number(subjectEntry.totalWeight) <= 0) { console.log('totalWeight <= 0', subjectEntry.totalWeight); return; }

  const overallPercent = Number(subjectEntry.overallPercent || 0);
  const catScore = Math.round(Number((overallPercent * 0.3).toFixed(2)));
  const examScore = Math.round(Number((overallPercent * 0.7).toFixed(2)));
  const agg = validateAggregateGrade(catScore, examScore, assessmentList);
  console.log('agg validation', agg);
  if (!agg.ok) { console.log('aggregate invalid', agg.error); return; }

  await db.insert(grades).values({ id: crypto.randomUUID(), studentId, subjectCode, catScore: String(catScore), examScore: String(examScore), gradedAt: new Date().toISOString() }).onConflictDoUpdate({ target: [grades.studentId, grades.subjectCode], set: { catScore: String(catScore), examScore: String(examScore), gradedAt: new Date().toISOString() } });

  const [g] = await db.select().from(grades).where(and(eq(grades.studentId, studentId), eq(grades.subjectCode, subjectCode))).limit(1);
  console.log('published grade row:', g);

  // Step 3: Verify student dashboard would show the published result — compute what student API returns
  const studentPublished = computePublishedAssessmentSummary(allRows.map((r:any) => ({ subjectCode, rawMark: r.rawMark, maxMarks: r.maxMarks, weight: r.weight, assessmentKind: r.assessmentKind })), [], { courseTitle: null, courseCode: null });
  console.log('studentPublished summary subjects:', studentPublished.subjects);
}

run().catch(err => { console.error(err); process.exit(1); });
