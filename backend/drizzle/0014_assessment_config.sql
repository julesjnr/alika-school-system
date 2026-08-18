-- Create module-level assessment configuration table
CREATE TABLE IF NOT EXISTS assessment_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_code VARCHAR(30) NOT NULL,
  assessment_kind VARCHAR(30) NOT NULL,
  assessment_name VARCHAR(100) NOT NULL,
  max_marks NUMERIC(8,2) NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_assessment_config_subject_kind UNIQUE(subject_code, assessment_kind),
  CONSTRAINT assessment_config_max_marks_check CHECK (max_marks > 0),
  CONSTRAINT assessment_config_weight_check CHECK (weight >= 0)
);

CREATE INDEX IF NOT EXISTS idx_assessment_config_subject ON assessment_configurations (subject_code);
