ALTER TABLE invoices ALTER COLUMN date SET DEFAULT CURRENT_DATE;
ALTER TABLE invoices ALTER COLUMN due_date SET DEFAULT CURRENT_DATE + INTERVAL '14 days';
ALTER TABLE invoices ALTER COLUMN outstanding_balance SET DEFAULT 0.00;
--> statement-breakpoint
UPDATE invoices
SET date = COALESCE(date, CURRENT_DATE)
WHERE date IS NULL;
--> statement-breakpoint
UPDATE invoices
SET due_date = COALESCE(due_date, date + INTERVAL '14 days')
WHERE due_date IS NULL;
--> statement-breakpoint
UPDATE invoices
SET outstanding_balance = COALESCE(outstanding_balance, amount)
WHERE outstanding_balance IS NULL;
--> statement-breakpoint
ALTER TABLE invoices ALTER COLUMN outstanding_balance SET NOT NULL;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;
