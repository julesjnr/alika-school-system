import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { issueAccessToken, issueRefreshToken } from './auth.ts';

const TEST_JWT_SECRET = 'alika-test-secret-key-1234567890';

test('issueAccessToken creates valid student access token', () => {
  const token = issueAccessToken('ADM-001', 'student', 'student@alikamedical.co.ke', TEST_JWT_SECRET, 'stu-uuid-101', 0);
  assert.ok(typeof token === 'string' && token.length > 0);

  const decoded = jwt.verify(token, TEST_JWT_SECRET) as any;
  assert.equal(decoded.userId, 'ADM-001');
  assert.equal(decoded.role, 'student');
  assert.equal(decoded.email, 'student@alikamedical.co.ke');
  assert.equal(decoded.roleId, 'stu-uuid-101');
  assert.equal(decoded.tokenType, 'access');
  assert.equal(decoded.sv, 0);
});

test('issueRefreshToken creates valid refresh token', () => {
  const refreshToken = issueRefreshToken('ADM-001', 'student', 'student@alikamedical.co.ke', TEST_JWT_SECRET, 'stu-uuid-101', 0);
  assert.ok(typeof refreshToken === 'string' && refreshToken.length > 0);

  const decoded = jwt.verify(refreshToken, TEST_JWT_SECRET) as any;
  assert.equal(decoded.userId, 'ADM-001');
  assert.equal(decoded.role, 'student');
  assert.equal(decoded.tokenType, 'refresh');
  assert.equal(decoded.sv, 0);
});
