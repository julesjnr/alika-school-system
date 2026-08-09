import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AGGREGATE_CAT_MAX,
  AGGREGATE_EXAM_MAX,
  continuousAssessmentTotal,
  sanitizeStudentGradesRecord,
  sumValidMarks,
  validateAggregateGrade,
  validateMarkBreakdown,
} from "./marksValidation.ts";

describe("backend marksValidation", () => {
  it("accepts boundary aggregate grades", () => {
    assert.deepEqual(validateAggregateGrade(0, 0), { ok: true, cat: 0, exam: 0 });
    assert.deepEqual(validateAggregateGrade(AGGREGATE_CAT_MAX, AGGREGATE_EXAM_MAX), {
      ok: true,
      cat: AGGREGATE_CAT_MAX,
      exam: AGGREGATE_EXAM_MAX,
    });
  });

  it("rejects above-max, negative, and malformed grades", () => {
    assert.equal(validateAggregateGrade(31, 10).ok, false);
    assert.equal(validateAggregateGrade(10, 71).ok, false);
    assert.equal(validateAggregateGrade(-1, 10).ok, false);
    assert.equal(validateAggregateGrade(10, -5).ok, false);
    assert.equal(validateAggregateGrade("abc", 10).ok, false);
    assert.equal(validateAggregateGrade(10, Number.NaN).ok, false);
  });

  it("sanitize drops invalid subject grades and keeps prior valid ones", () => {
    const previous = { CSC101: { cat: 20, exam: 50 } };
    const incoming = {
      CSC101: { cat: 30, exam: 54 }, // screenshot-like invalid exam if treated as component — but aggregate exam 54 is valid
      CSC102: { cat: 40, exam: 65 }, // invalid cat > 30
      CSC103: { cat: 10, exam: 80 }, // invalid exam > 70
    };
    const sanitized = sanitizeStudentGradesRecord(incoming, previous);
    assert.deepEqual(sanitized.CSC101, { cat: 30, exam: 54 });
    assert.equal(sanitized.CSC102, undefined);
    assert.equal(sanitized.CSC103, undefined);
  });

  it("sanitize restores previous when replacement is invalid", () => {
    const previous = { CSC101: { cat: 12, exam: 40 } };
    const incoming = { CSC101: { cat: 99, exam: 40 } };
    const sanitized = sanitizeStudentGradesRecord(incoming, previous);
    assert.deepEqual(sanitized.CSC101, { cat: 12, exam: 40 });
  });

  it("uses assessment max marks for component validation and totals", () => {
    const assessments = [
      { kind: "CAT1", maxMarks: 10 },
      { kind: "CAT2", maxMarks: 10 },
      { kind: "Assignment", maxMarks: 10 },
      { kind: "FinalExam", maxMarks: 70 },
    ];
    const marks = { cat1: 11, cat2: 5, assignment: 4, exam: 71 };
    const errors = validateMarkBreakdown(marks, assessments);
    assert.equal(errors.cat1, "Enter a mark from 0 to 10.");
    assert.equal(errors.exam, "Enter a mark from 0 to 70.");
    assert.equal(sumValidMarks(marks, assessments), 9);
    assert.equal(continuousAssessmentTotal(marks, assessments), 9);
  });
});
