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
