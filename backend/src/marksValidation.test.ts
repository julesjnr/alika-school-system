import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateWeightedAssessmentResult,
  continuousAssessmentTotal,
  maxMarksForField,
  sanitizeStudentGradesRecord,
  sumValidMarks,
  validateAggregateGrade,
  validateMarkBreakdown,
} from "./marksValidation.ts";

describe("backend marksValidation", () => {
  it("accepts configured aggregate grades when the lecturer-defined maxima are respected", () => {
    const assessments = [
      { kind: "CAT1", maxMarks: 15 },
      { kind: "CAT2", maxMarks: 15 },
      { kind: "Assignment", maxMarks: 20 },
      { kind: "FinalExam", maxMarks: 50 },
    ];
    assert.deepEqual(validateAggregateGrade(0, 0, assessments), { ok: true, cat: 0, exam: 0 });
    assert.deepEqual(validateAggregateGrade(30, 50, assessments), {
      ok: true,
      cat: 30,
      exam: 50,
    });
  });

  it("requires explicit assessment maxima instead of arbitrary defaults", () => {
    assert.equal(maxMarksForField([], "cat1"), 0);
    assert.equal(maxMarksForField([], "exam"), 0);
    assert.equal(validateMarkBreakdown({ cat1: 5, cat2: 5, assignment: 5, exam: 10 }, []).cat1, "Enter a mark from 0 to 0.");
    assert.equal(validateMarkBreakdown({ cat1: 5, cat2: 5, assignment: 5, exam: 10 }, []).exam, "Enter a mark from 0 to 0.");
  });

  it("rejects above-max, negative, and malformed grades", () => {
    const assessments = [
      { kind: "CAT1", maxMarks: 10 },
      { kind: "CAT2", maxMarks: 10 },
      { kind: "Assignment", maxMarks: 10 },
      { kind: "FinalExam", maxMarks: 70 },
    ];
    assert.equal(validateAggregateGrade(31, 10, assessments).ok, false);
    assert.equal(validateAggregateGrade(10, 71, assessments).ok, false);
    assert.equal(validateAggregateGrade(-1, 10, assessments).ok, false);
    assert.equal(validateAggregateGrade(10, -5, assessments).ok, false);
    assert.equal(validateAggregateGrade("abc", 10, assessments).ok, false);
    assert.equal(validateAggregateGrade(10, Number.NaN, assessments).ok, false);
  });

  it("sanitize drops invalid subject grades and keeps prior valid ones", () => {
    const assessments = [
      { kind: "CAT1", maxMarks: 10 },
      { kind: "CAT2", maxMarks: 10 },
      { kind: "Assignment", maxMarks: 10 },
      { kind: "FinalExam", maxMarks: 70 },
    ];
    const previous = { CSC101: { cat: 20, exam: 50 } };
    const incoming = {
      CSC101: { cat: 30, exam: 54 },
      CSC102: { cat: 40, exam: 65 },
      CSC103: { cat: 10, exam: 80 },
    };
    const sanitized = sanitizeStudentGradesRecord(incoming, previous, assessments);
    assert.deepEqual(sanitized.CSC101, { cat: 30, exam: 54 });
    assert.equal(sanitized.CSC102, undefined);
    assert.equal(sanitized.CSC103, undefined);
  });

  it("sanitize restores previous when replacement is invalid", () => {
    const assessments = [
      { kind: "CAT1", maxMarks: 10 },
      { kind: "CAT2", maxMarks: 10 },
      { kind: "Assignment", maxMarks: 10 },
      { kind: "FinalExam", maxMarks: 70 },
    ];
    const previous = { CSC101: { cat: 12, exam: 40 } };
    const incoming = { CSC101: { cat: 99, exam: 40 } };
    const sanitized = sanitizeStudentGradesRecord(incoming, previous, assessments);
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

  it("calculates a weighted assessment total from configured maxima", () => {
    const assessments = [
      { kind: "CAT1", maxMarks: 10 },
      { kind: "CAT2", maxMarks: 10 },
      { kind: "Assignment", maxMarks: 10 },
      { kind: "FinalExam", maxMarks: 70 },
    ];
    const marks = { cat1: 8, cat2: 7, assignment: 9, exam: 56 };
    assert.equal(calculateWeightedAssessmentResult(marks, assessments), 80);
  });
});
