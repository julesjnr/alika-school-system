import test from 'node:test';
import assert from 'node:assert/strict';

import { ensureStudentCanonicalEnrollment } from './studentEnrollmentSync.ts';

test('creates the canonical enrollment when the student is not yet assigned to that course', async () => {
  let insertCalls = 0;
  const tx = {
    select: async () => [],
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            insertCalls += 1;
            return [{ studentId: 'student-1', courseCode: 'CERT-NA' }];
          },
        }),
      }),
    }),
  } as any;

  const created = await ensureStudentCanonicalEnrollment(tx, 'student-1', 'CERT-NA');
  assert.equal(created, true);
  assert.equal(insertCalls, 1);
});

test('does not create a duplicate canonical enrollment for the same course', async () => {
  let insertCalls = 0;
  const tx = {
    select: async () => [{ studentId: 'student-1', courseCode: 'CERT-NA' }],
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            insertCalls += 1;
            return [{ studentId: 'student-1', courseCode: 'CERT-NA' }];
          },
        }),
      }),
    }),
  } as any;

  const created = await ensureStudentCanonicalEnrollment(tx, 'student-1', 'CERT-NA');
  assert.equal(created, false);
  assert.equal(insertCalls, 0);
});

test('reconcileStudentEnrollments backfills active students like ALK-001 with default module', async () => {
  const mockStudents = [
    { id: 'uuid-1', admissionNo: 'ALK-001', name: 'Alika Student', email: 'alk@example.com', courseId: null, programme: 'Caregiver Course' },
  ];
  const mockCourses = [
    { id: 'course-uuid-1', code: 'CERT-CAREGIVER', title: 'Caregiver Course' },
  ];
  const mockEnrollments: any[] = [];

  const runner = {
    select: async () => ({
      from: async (table: any) => {
        // Distinguish by table or return corresponding mock list
        const tableName = table?._?.name || table?.name;
        if (tableName === 'student_enrollments') return mockEnrollments;
        if (tableName === 'courses') return mockCourses;
        return mockStudents;
      },
    }),
    insert: () => ({
      values: (val: any) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            mockEnrollments.push(val);
            return [val];
          },
        }),
      }),
    }),
  } as any;

  const { reconcileStudentEnrollments } = await import('./studentEnrollmentSync.ts');
  const results = await reconcileStudentEnrollments(runner);

  assert.equal(results.length, 1);
  assert.equal(results[0].studentId, 'uuid-1');
  assert.equal(results[0].admissionNo, 'ALK-001');
  assert.equal(results[0].courseCode, 'CERT-CAREGIVER');
  assert.equal(results[0].status, 'active');
});

