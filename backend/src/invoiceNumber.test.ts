import test from 'node:test';
import assert from 'node:assert/strict';

import { formatInvoiceNumber, resolveInvoiceDefaults } from './invoiceNumber.ts';

test('formatInvoiceNumber yields a stable readable invoice number', () => {
  assert.match(formatInvoiceNumber(1, 2026), /^INV-2026-000001$/);
  assert.match(formatInvoiceNumber(42, 2026), /^INV-2026-000042$/);
});

test('resolveInvoiceDefaults fills required invoice fields for a new unpaid invoice', () => {
  const result = resolveInvoiceDefaults({
    studentId: 'student-123',
    amount: '8000',
    description: 'pay before semester starts',
    status: 'unpaid',
  });

  assert.equal(result.amount, '8000.00');
  assert.equal(result.outstandingBalance, '8000.00');
  assert.ok(result.date.length >= 8);
  assert.ok(result.dueDate.length >= 8);
  assert.equal(result.status, 'unpaid');
});
