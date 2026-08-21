import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  continuousAssessmentTotal,
  isMarkWithinMax,
  maxMarksForField,
  parseMarkInput,
  sumValidMarks,
  validateAggregateGrade,
  validateMarkBreakdown,
} from "./marksValidation.ts";

const assessments = [
  { kind: "CAT1", maxMarks: 10 },
  { kind: "CAT2", maxMarks: 10 },
  { kind: "Assignment", maxMarks: 10 },
  { kind: "FinalExam", maxMarks: 70 },
];

describe("marksValidation — field max from assessments", () => {
  it("uses configured assessment maxMarks", () => {
    assert.equal(maxMarksForField(assessments, "cat1"), 10);
    assert.equal(maxMarksForField(assessments, "exam"), 70);
    assert.equal(maxMarksForField([{ kind: "CAT1", maxMarks: 15 }], "cat1"), 15);
  });
});

describe("marksValidation — valid / boundary values", () => {
  it("requires configured max marks before accepting entry", () => {
    const errors = validateMarkBreakdown({ cat1: 5, cat2: 5, assignment: 5, exam: 10 }, []);
    assert.equal(maxMarksForField([], "cat1"), 0);
    assert.equal(errors.cat1, "Enter a mark from 0 to 0.");
    assert.equal(errors.exam, "Enter a mark from 0 to 0.");
  });

  it("accepts 0 and exact maximum", () => {
    const marks = { cat1: 0, cat2: 10, assignment: 10, exam: 70 };
    assert.deepEqual(validateMarkBreakdown(marks, assessments), {});
    assert.equal(sumValidMarks(marks, assessments), 90);
  });

  it("accepts typical valid row", () => {
    const marks = { cat1: 8, cat2: 7, assignment: 9, exam: 55 };
    assert.deepEqual(validateMarkBreakdown(marks, assessments), {});
    assert.equal(sumValidMarks(marks, assessments), 79);
  });
});

describe("marksValidation — invalid values do not contribute to total", () => {
  it("excludes over-max CAT and assignment from total (screenshot case)", () => {
    const marks = { cat1: 30, cat2: 54, assignment: 87, exam: 65 };
    const errors = validateMarkBreakdown(marks, assessments);
    assert.equal(errors.cat1, "Enter a mark from 0 to 10.");
    assert.equal(errors.cat2, "Enter a mark from 0 to 10.");
    assert.equal(errors.assignment, "Enter a mark from 0 to 10.");
    assert.equal(errors.exam, undefined);
    // Only Final Exam 65 is valid → total 65, never 236
    assert.equal(sumValidMarks(marks, assessments), 65);
  });

  it("rejects negatives and non-finite values", () => {
    const marks = { cat1: -1, cat2: Number.NaN, assignment: 5, exam: 70 };
    const errors = validateMarkBreakdown(marks, assessments);
    assert.ok(errors.cat1);
    assert.ok(errors.cat2);
    assert.equal(errors.assignment, undefined);
    assert.equal(sumValidMarks(marks, assessments), 75);
  });

  it("rejects exam above configured max", () => {
    const marks = { cat1: 5, cat2: 5, assignment: 5, exam: 71 };
    assert.equal(validateMarkBreakdown(marks, assessments).exam, "Enter a mark from 0 to 70.");
    assert.equal(sumValidMarks(marks, assessments), 15);
  });

  it("uses assessment max marks when building the CAT total", () => {
    const marks = { cat1: 11, cat2: 5, assignment: 4, exam: 71 };
    assert.equal(continuousAssessmentTotal(marks, assessments), 9);
  });

  it("treats empty input as 0 and malformed as NaN", () => {
    assert.equal(parseMarkInput(""), 0);
    assert.equal(isMarkWithinMax(parseMarkInput(""), 10), true);
    assert.equal(Number.isNaN(parseMarkInput("abc")), true);
    assert.equal(isMarkWithinMax(parseMarkInput("abc"), 10), false);
  });
});

describe("marksValidation — aggregate grade for API/DB", () => {
  it("uses lecturer-defined aggregate bounds when configured", () => {
    const configured = [
      { kind: "CAT1", maxMarks: 10 },
      { kind: "CAT2", maxMarks: 10 },
      { kind: "Assignment", maxMarks: 10 },
      { kind: "FinalExam", maxMarks: 70 },
    ];
    assert.equal(validateAggregateGrade(30, 70, configured).ok, true);
    assert.equal(validateAggregateGrade(0, 0, configured).ok, true);
    assert.equal(validateAggregateGrade(31, 70, configured).ok, false);
    assert.equal(validateAggregateGrade(30, 71, configured).ok, false);
    assert.equal(validateAggregateGrade(-1, 10, configured).ok, false);
    assert.equal(validateAggregateGrade("x", 10, configured).ok, false);
  });

  it("requires explicit assessment maxima before a CAT total is accepted", () => {
    assert.equal(continuousAssessmentTotal({ cat1: 10, cat2: 10, assignment: 10 }, []), 0);
    assert.equal(validateAggregateGrade(10, 70, []).ok, false);
  });
});
