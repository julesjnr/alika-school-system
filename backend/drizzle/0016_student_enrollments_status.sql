-- Migration: 0016_student_enrollments_status.sql
-- Add status column to student_enrollments for active/dropped module tracking
ALTER TABLE "student_enrollments" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'active' NOT NULL;
