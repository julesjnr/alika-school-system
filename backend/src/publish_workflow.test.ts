import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from './db/index';
import { students, studentEnrollments, studentAssessmentMarks, assessmentConfigurations, grades } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { validateAssessmentWeights, validateAggregateGrade } from './marksValidation';
import { computePublishedAssessmentSummary } from './studentLookup';

describe('publish workflow integration', () => {
  it('saves assessment config, marks, publishes and returns persisted result', async () => {
    // create test student
    const admission = `TEST-${Date.now()}`;
    const studentId = (await db.insert(students).values({ name: 'Test Student', email: `${admission}@example.com`, phone: '000', admissionNo: admission, cohort: '2026' }).returning({ id: students.id }))[0].id;

    const subjectCode = 'TEST101';
    // enroll student
    await db.insert(studentEnrollments).values({ studentId, courseCode: subjectCode }).onConflictDoNothing();

    // create assessment configuration (valid total 100)
    const configs = [
      { assessmentKind: 'CAT1', assessmentName: 'CAT 1', maxMarks: 100, weight: 10 },
      { assessmentKind: 'CAT2', assessmentName: 'CAT 2', maxMarks: 100, weight: 10 },
      { assessmentKind: 'Assignment', assessmentName: 'Assignment', maxMarks: 30, weight: 10 },
      { assessmentKind: 'FinalExam', assessmentName: 'Final Exam', maxMarks: 100, weight: 70 },
    ];
    for (const c of configs) {
      await db.insert(assessmentConfigurations).values({ subjectCode, assessmentKind: c.assessmentKind, assessmentName: c.assessmentName, maxMarks: String(c.maxMarks), weight: String(c.weight) }).onConflictDoUpdate({ target: [assessmentConfigurations.subjectCode, assessmentConfigurations.assessmentKind], set: { assessmentName: c.assessmentName, maxMarks: String(c.maxMarks), weight: String(c.weight) } });
    }

    // insert raw marks (within max)
    await db.insert(studentAssessmentMarks).values({ studentId, subjectCode, assessmentKind: 'CAT1', assessmentName: 'CAT 1', rawMark: '78.00', maxMarks: '100.00', weight: '10.00' });
    await db.insert(studentAssessmentMarks).values({ studentId, subjectCode, assessmentKind: 'CAT2', assessmentName: 'CAT 2', rawMark: '50.00', maxMarks: '100.00', weight: '10.00' });
    await db.insert(studentAssessmentMarks).values({ studentId, subjectCode, assessmentKind: 'Assignment', assessmentName: 'Assignment', rawMark: '20.00', maxMarks: '30.00', weight: '10.00' });
    await db.insert(studentAssessmentMarks).values({ studentId, subjectCode, assessmentKind: 'FinalExam', assessmentName: 'Final Exam', rawMark: '56.00', maxMarks: '100.00', weight: '70.00' });

    // verify rows exist
    const rows = await db.select().from(studentAssessmentMarks).where(and(eq(studentAssessmentMarks.studentId, studentId), eq(studentAssessmentMarks.subjectCode, subjectCode)));
    assert.equal(rows.length, 4);

    // load configs and validate weights
    const loadedConfigs = await db.select().from(assessmentConfigurations).where(eq(assessmentConfigurations.subjectCode, subjectCode));
    const assessmentList = loadedConfigs.map((c:any) => ({ kind: c.assessmentKind, maxMarks: Number(c.maxMarks), weight: Number(c.weight) }));
    assert.equal(validateAssessmentWeights(assessmentList), null);

    // compute published summary
    const publishedSummary = computePublishedAssessmentSummary(rows.map((r:any) => ({ subjectCode, rawMark: r.rawMark, maxMarks: r.maxMarks, weight: r.weight, assessmentKind: r.assessmentKind })), [], { courseTitle: null, courseCode: null });
    const subjectEntry = (publishedSummary.subjects || []).find((s:any) => s.subjectCode === subjectCode);
    assert.ok(subjectEntry && subjectEntry.totalWeight === 100);

    const overallPercent = Number(subjectEntry.overallPercent || 0);
    const catScore = Math.round(Number((overallPercent * 0.3).toFixed(2)));
    const examScore = Math.round(Number((overallPercent * 0.7).toFixed(2)));
    const agg = validateAggregateGrade(catScore, examScore, assessmentList);
    assert.ok(agg.ok);

    // publish (upsert into grades)
    await db.insert(grades).values({ studentId, subjectCode, catScore: String(catScore), examScore: String(examScore) }).onConflictDoUpdate({ target: [grades.studentId, grades.subjectCode], set: { catScore: String(catScore), examScore: String(examScore) } });

    const g = await db.select().from(grades).where(and(eq(grades.studentId, studentId), eq(grades.subjectCode, subjectCode)));
    assert.equal(g.length, 1);
    assert.equal(Number(g[0].catScore), catScore);
    assert.equal(Number(g[0].examScore), examScore);

    // cleanup
    await db.delete(studentAssessmentMarks).where(eq(studentAssessmentMarks.studentId, studentId));
    await db.delete(assessmentConfigurations).where(eq(assessmentConfigurations.subjectCode, subjectCode));
    await db.delete(grades).where(eq(grades.studentId, studentId));
    await db.delete(studentEnrollments).where(eq(studentEnrollments.studentId, studentId));
    await db.delete(students).where(eq(students.id, studentId));
  });
});
