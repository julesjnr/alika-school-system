import dotenv from 'dotenv';
dotenv.config({ override: false });
import { db } from '../backend/src/db/index';
import { students, studentAssessmentMarks, grades } from '../backend/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { computePublishedAssessmentSummary } from '../backend/src/studentLookup';
import { validateAssessmentWeights, validateAggregateGrade } from '../backend/src/marksValidation';
import crypto from 'crypto';

async function run() {
  const admissionNo = 'ALK-002';
  const subjectCode = 'CERT-NURSE-ASSISTANT';

  const [student] = await db.select().from(students).where(eq(students.admissionNo, admissionNo)).limit(1);
  if (!student) {
    console.log('student not found');
    return;
  }
  const studentId = student.id;
  const assessmentRows = await db.select({ assessmentKind: studentAssessmentMarks.assessmentKind, rawMark: studentAssessmentMarks.rawMark, maxMarks: studentAssessmentMarks.maxMarks, weight: studentAssessmentMarks.weight }).from(studentAssessmentMarks).where(and(eq(studentAssessmentMarks.studentId, studentId), eq(studentAssessmentMarks.subjectCode, subjectCode)));

  console.log('found', assessmentRows.length, 'assessment rows');
  if (assessmentRows.length === 0) return;

  const configMap = new Map();
  for (const r of assessmentRows) {
    const kind = String(r.assessmentKind || '').trim();
    if (!kind) continue;
    const maxMarks = Number(r.maxMarks) || 0;
    const weight = Number(r.weight) || 0;
    if (!configMap.has(kind)) configMap.set(kind, { kind, maxMarks, weight });
    else {
      const exist = configMap.get(kind);
      if ((exist.maxMarks || 0) <= 0 && maxMarks > 0) exist.maxMarks = maxMarks;
      if ((exist.weight || 0) <= 0 && weight > 0) exist.weight = weight;
      configMap.set(kind, exist);
    }
  }
  const assessmentList = Array.from(configMap.values()).map(c => ({ kind: c.kind, maxMarks: c.maxMarks, weight: c.weight }));
  const weightError = validateAssessmentWeights(assessmentList);
  console.log('weightError', weightError);
  const publishedSummary = computePublishedAssessmentSummary(assessmentRows.map((r:any) => ({ subjectCode, rawMark: r.rawMark, maxMarks: r.maxMarks, weight: r.weight, assessmentKind: r.assessmentKind })), [], { courseTitle: null, courseCode: null });
  console.log('publishedSummary', publishedSummary.subjects);
  const subjectEntry = (publishedSummary.subjects || []).find((s:any) => s.subjectCode === subjectCode);
  if (!subjectEntry) { console.log('no subject entry'); return; }
  if (!Number.isFinite(subjectEntry.totalWeight) || Number(subjectEntry.totalWeight) <= 0) { console.log('totalWeight <= 0', subjectEntry.totalWeight); return; }
  const overallPercent = Number(subjectEntry.overallPercent || 0);
  const catScore = Math.round(Number((overallPercent * 0.3).toFixed(2)));
  const examScore = Math.round(Number((overallPercent * 0.7).toFixed(2)));
  const agg = validateAggregateGrade(catScore, examScore, assessmentList);
  console.log('agg validation', agg);
  if (!agg.ok) { console.log('aggregate invalid', agg.error); return; }

  await db.insert(grades).values({ id: crypto.randomUUID(), studentId, subjectCode, catScore: String(catScore), examScore: String(examScore), gradedAt: new Date().toISOString() }).onConflictDoUpdate({ target: [grades.studentId, grades.subjectCode], set: { catScore: String(catScore), examScore: String(examScore), gradedAt: new Date().toISOString() } });
  const [g] = await db.select().from(grades).where(grades.studentId.equals(studentId).and(grades.subjectCode.equals(subjectCode))).limit(1);
  console.log('published grade row:', g);
}

run().catch(err => { console.error(err); process.exit(1); });
