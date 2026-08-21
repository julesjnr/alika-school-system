import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computePublishedAssessmentSummary,
  computeStudentAcademicSummary,
  deriveAcademicStanding,
} from './studentLookup.ts';

test('computes missing published results as awaiting results with zero enrolled units', () => {
  const summary = computeStudentAcademicSummary(
    [],
    [],
    {
      courseTitle: 'Certificate in Nurse Assistant',
      courseCode: 'CERT-NURSE-ASSISTANT',
    }
  );

  assert.equal(summary.gpa, null);
  assert.equal(summary.academicStanding, 'Awaiting results');
  assert.equal(summary.registeredUnitCount, 0);
  assert.equal(summary.programme, 'Certificate in Nurse Assistant');
  assert.equal(summary.courseCode, 'CERT-NURSE-ASSISTANT');
});

test('derives academic standing from published GPA thresholds', () => {
  assert.equal(deriveAcademicStanding(3.5), 'Good Standing');
  assert.equal(deriveAcademicStanding(2.1), 'Satisfactory');
  assert.equal(deriveAcademicStanding(null), 'Awaiting results');
});

test('computes published academic results from raw assessment marks', () => {
  const summary = computePublishedAssessmentSummary([
    { subjectCode: 'CERT-NURSE-ASSISTANT', rawMark: 78, maxMarks: 100, weight: 10, assessmentKind: 'CAT1' },
    { subjectCode: 'CERT-NURSE-ASSISTANT', rawMark: 50, maxMarks: 100, weight: 10, assessmentKind: 'CAT2' },
    { subjectCode: 'CERT-NURSE-ASSISTANT', rawMark: 20, maxMarks: 30, weight: 10, assessmentKind: 'Assignment' },
    { subjectCode: 'CERT-NURSE-ASSISTANT', rawMark: 56, maxMarks: 100, weight: 70, assessmentKind: 'FinalExam' },
  ], [
    { courseCode: 'CERT-NURSE-ASSISTANT' },
  ]);

  assert.equal(summary.subjects[0].subjectCode, 'CERT-NURSE-ASSISTANT');
  assert.equal(summary.subjects[0].overallPercent, 58.67);
  assert.equal(summary.subjects[0].grade, 'C');
  assert.equal(summary.modulesPassed, 1);
  assert.equal(summary.gpa, 2);
  assert.equal(summary.academicStanding, 'Satisfactory');
});
