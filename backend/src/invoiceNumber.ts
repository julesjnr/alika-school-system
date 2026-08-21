import { sql } from 'drizzle-orm';
import { db } from './db/index.ts';
import crypto from 'crypto';

export function formatInvoiceNumber(sequenceNumber: number, year = new Date().getFullYear()): string {
  return `INV-${year}-${String(sequenceNumber).padStart(6, '0')}`;
}

export function formatMoney(value: number | string | null | undefined): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0.00';
  }
  return numeric.toFixed(2);
}

export function buildDueDate(inputDate?: string | Date, days = 14): string {
  const baseDate = inputDate ? new Date(inputDate) : new Date();
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().slice(0, 10);
}

export async function generateInvoiceNumber(year = new Date().getFullYear()): Promise<string> {
  // Generate invoice numbers in the format: INV-<YEAR>-<suffix>
  // where <suffix> is derived from timestamp + random to reduce collisions.
  // We attempt a few times and check the DB for existence before returning.
  for (let attempt = 0; attempt < 6; attempt++) {
    const tsPart = Date.now().toString().slice(-6);
    const randPart = Math.floor(Math.random() * 90 + 10).toString();
    const candidate = `INV-${year}-${tsPart}${randPart}`;

    // Check existence
    const existsRes = await db.execute(sql`SELECT 1 FROM invoices WHERE invoice_no = ${candidate} LIMIT 1`);
    const existsRow = Array.isArray(existsRes)
      ? existsRes[0]
      : (existsRes && typeof existsRes === 'object' && 'rows' in existsRes && Array.isArray((existsRes as any).rows))
        ? (existsRes as any).rows[0]
        : undefined;

    if (!existsRow) return candidate;
    // small jitter before retrying
    await new Promise((r) => setTimeout(r, 5 + Math.floor(Math.random() * 10)));
  }

  // Fallback to UUID-based suffix if all attempts collide (extremely unlikely)
  return `INV-${year}-${Date.now().toString().slice(-6)}-${crypto.randomUUID().slice(0, 6)}`;
}

export function resolveInvoiceDefaults(input: {
  studentId?: string | null;
  amount?: number | string | null;
  description?: string | null;
  status?: string | null;
  date?: string | null;
  dueDate?: string | null;
  outstandingBalance?: number | string | null;
  invoiceNo?: string | null;
} = {}) {
  const dateValue = input.date || new Date().toISOString().slice(0, 10);
  const amountValue = Number(input.amount ?? 0);
  const numericAmount = Number.isFinite(amountValue) ? amountValue : 0;
  const statusValue = input.status === 'paid' ? 'paid' : 'unpaid';
  const outstandingValue = input.outstandingBalance === undefined
    ? (statusValue === 'paid' ? 0 : numericAmount)
    : Number(input.outstandingBalance ?? 0);

  return {
    studentId: input.studentId || '',
    invoiceNo: input.invoiceNo || '',
    description: input.description?.trim() || 'Semester Fees',
    amount: formatMoney(numericAmount),
    date: dateValue,
    dueDate: input.dueDate || buildDueDate(dateValue),
    outstandingBalance: formatMoney(outstandingValue),
    status: statusValue,
  };
}
