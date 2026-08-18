CREATE TABLE IF NOT EXISTS "student_assessment_marks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "subject_code" varchar(30) NOT NULL,
  "assessment_kind" varchar(30) NOT NULL,
  "assessment_name" varchar(100) NOT NULL,
  "raw_mark" numeric(8,2) NOT NULL,
  "max_marks" numeric(8,2) NOT NULL,
  "weight" numeric(5,2) DEFAULT 0.00 NOT NULL,
  "lecturer_id" uuid,
  "recorded_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "student_assessment_marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE,
  CONSTRAINT "student_assessment_marks_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE SET NULL,
  CONSTRAINT "student_assessment_marks_raw_mark_check" CHECK ("raw_mark" >= 0),
  CONSTRAINT "student_assessment_marks_max_marks_check" CHECK ("max_marks" > 0),
  CONSTRAINT "student_assessment_marks_weight_check" CHECK ("weight" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_student_assessment_mark"
  ON "student_assessment_marks" ("student_id", "subject_code", "assessment_kind");
