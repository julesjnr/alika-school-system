import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Award, Download, FileSpreadsheet, FileText, Plus,
  Printer, Save, Search, Trash2, Users,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Grade, LecturerAssignedSubject, Student } from '../types';
import {
  calculateOverallPercentage,
  continuousAssessmentTotal,
  configuredAggregateLimits,
  letterGradeFromOverallPercentage,
  maxMarksForField,
  parseMarkInput,
  sumValidMarks,
  validateAggregateGrade,
  validateAssessmentWeights,
  validateMarkBreakdown,
  type MarkBreakdown,
  type MarkField,
} from '../utils/marksValidation';

type AssessmentKind = 'CAT1' | 'CAT2' | 'Assignment' | 'FinalExam';

interface AssessmentDef {
  id: string;
  kind: AssessmentKind;
  name: string;
  maxMarks: number;
  weight: number;
  published: boolean;
}

interface AssessmentAnalytics {
  average: number | null;
  highest: number | null;
  lowest: number | null;
  passRate: number | null;
  failRate: number | null;
  graded: number;
  pending: number;
  distribution: Array<{ name: string; count: number; percent: number; color: string }>;
}

interface LecturerAssessmentWorkspaceProps {
  lecturerId: string;
  assignedSubjects: LecturerAssignedSubject[];
  selectedSubject: string;
  onSelectSubject: (code: string) => void;
  students: Student[];
  onUpdateGrades: (studentId: string, subjectCode: string, grade: Grade) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  showWarning: (title: string, message: string) => void;
}

const DEFAULT_ASSESSMENTS: AssessmentDef[] = [
  { id: 'cat1', kind: 'CAT1', name: 'CAT 1', maxMarks: 50, weight: 15, published: false },
  { id: 'cat2', kind: 'CAT2', name: 'CAT 2', maxMarks: 50, weight: 15, published: false },
  { id: 'assignment', kind: 'Assignment', name: 'Assignment', maxMarks: 50, weight: 10, published: false },
  { id: 'final', kind: 'FinalExam', name: 'Final Exam', maxMarks: 100, weight: 60, published: false },
];

const KIND_OPTIONS: Array<{ kind: AssessmentKind; label: string; defaultMax: number; defaultWeight: number }> = [
  { kind: 'CAT1', label: 'CAT 1', defaultMax: 50, defaultWeight: 15 },
  { kind: 'CAT2', label: 'CAT 2', defaultMax: 50, defaultWeight: 15 },
  { kind: 'Assignment', label: 'Assignment', defaultMax: 50, defaultWeight: 10 },
  { kind: 'FinalExam', label: 'Final Exam', defaultMax: 100, defaultWeight: 60 },
];

const MARK_FIELDS: MarkField[] = ['cat1', 'cat2', 'assignment', 'exam'];

function getDefaultMaxForKind(kind: AssessmentKind, existingAssessments: AssessmentDef[]): number {
  const configured = existingAssessments.find((item) => item.kind === kind);
  if (configured && Number.isFinite(configured.maxMarks) && configured.maxMarks > 0) {
    return configured.maxMarks;
  }
  return kind === 'FinalExam' ? 100 : 50;
}

function letterGrade(total: number): string {
  return letterGradeFromOverallPercentage(total);
}

function assessmentsKey(lecturerId: string, subject: string) {
  return `lecturer-assessments:${lecturerId}:${subject}`;
}

function marksKey(lecturerId: string, subject: string) {
  return `lecturer-mark-breakdown:${lecturerId}:${subject}`;
}

function loadAssessments(lecturerId: string, subject: string): AssessmentDef[] {
  if (!subject) return DEFAULT_ASSESSMENTS.map((item) => ({ ...item }));
  try {
    const raw = localStorage.getItem(assessmentsKey(lecturerId, subject));
    if (!raw) return DEFAULT_ASSESSMENTS.map((item) => ({ ...item }));
    const parsed = JSON.parse(raw) as AssessmentDef[];
    const configured = Array.isArray(parsed) ? parsed : [];
    if (configured.length === 0) return DEFAULT_ASSESSMENTS.map((item) => ({ ...item }));

    const merged = DEFAULT_ASSESSMENTS.map((item) => {
      const existing = configured.find((candidate) => candidate.kind === item.kind);
      if (!existing) return { ...item };
      const fallbackMax = item.kind === 'FinalExam' ? 100 : 50;
      const rawMax = Number(existing.maxMarks);
      const maxMarks = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : fallbackMax;
      const name = String(existing.name ?? '').trim() || item.name;
      const rawWeight = Number(existing.weight);
      const weight = Number.isFinite(rawWeight) && rawWeight >= 0 ? rawWeight : item.weight;
      return { ...item, ...existing, name, maxMarks, weight };
    });
    const extras = configured
      .filter((item) => !DEFAULT_ASSESSMENTS.some((defaultItem) => defaultItem.kind === item.kind))
      .filter((item) => item && String(item.name ?? '').trim() !== '')
      .map((item) => {
        const fallbackMax = item.kind === 'FinalExam' ? 100 : 50;
        const rawMax = Number(item.maxMarks);
        const maxMarks = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : fallbackMax;
        const rawWeight = Number(item.weight);
        const weight = Number.isFinite(rawWeight) && rawWeight >= 0 ? rawWeight : 0;
        const name = String(item.name ?? '').trim() || (item.kind === 'FinalExam' ? 'Final Exam' : 'CAT 1');
        return { ...item, name, maxMarks, weight };
      });
    return [...merged, ...extras];
  } catch {
    return DEFAULT_ASSESSMENTS.map((item) => ({ ...item }));
  }
}

function loadBreakdowns(lecturerId: string, subject: string): Record<string, MarkBreakdown> {
  if (!subject) return {};
  try {
    const raw = localStorage.getItem(marksKey(lecturerId, subject));
    return raw ? (JSON.parse(raw) as Record<string, MarkBreakdown>) : {};
  } catch {
    return {};
  }
}

function splitCat(cat: number, assessments: AssessmentDef[] = []): Pick<MarkBreakdown, 'cat1' | 'cat2' | 'assignment'> {
  const catFields = ['cat1', 'cat2', 'assignment'] as MarkField[];
  const configuredTotal = catFields.reduce((sum, field) => sum + maxMarksForField(assessments, field), 0);
  const safe = Math.max(0, Number(cat) || 0);
  if (configuredTotal <= 0 || safe <= 0) return { cat1: 0, cat2: 0, assignment: 0 };

  const shares = catFields.map((field) => maxMarksForField(assessments, field) / configuredTotal);
  const cat1 = Math.min(maxMarksForField(assessments, 'cat1'), safe * shares[0]);
  const remaining = Math.max(0, safe - cat1);
  const cat2 = Math.min(maxMarksForField(assessments, 'cat2'), remaining * (maxMarksForField(assessments, 'cat2') / Math.max(1, maxMarksForField(assessments, 'cat2') + maxMarksForField(assessments, 'assignment'))));
  const assignment = Math.max(0, safe - cat1 - cat2);
  return { cat1, cat2, assignment };
}

export default function LecturerAssessmentWorkspace({
  lecturerId,
  assignedSubjects,
  selectedSubject,
  onSelectSubject,
  students,
  onUpdateGrades,
  showToast,
  showWarning,
}: LecturerAssessmentWorkspaceProps) {
  const ASSESSMENT_DEFAULTS: Record<AssessmentKind, { weight: number; max: number; label: string }> = {
    CAT1: { weight: 15, max: 50, label: 'CAT 1' },
    CAT2: { weight: 15, max: 50, label: 'CAT 2' },
    Assignment: { weight: 10, max: 50, label: 'Assignment' },
    FinalExam: { weight: 60, max: 100, label: 'Final Exam' },
  };
  const [assessments, setAssessments] = useState<AssessmentDef[]>(() => loadAssessments(lecturerId, selectedSubject));
  const [breakdowns, setBreakdowns] = useState<Record<string, MarkBreakdown>>(() => loadBreakdowns(lecturerId, selectedSubject));
  // drafts: studentId -> { [assessmentId]: numericValue }
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState<AssessmentKind>('CAT1');
  const [newName, setNewName] = useState('CAT 1');
  const [newMax, setNewMax] = useState(50);
  const [newWeight, setNewWeight] = useState(15);
  const [saveFlash, setSaveFlash] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AssessmentAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [assessmentErrors, setAssessmentErrors] = useState<Record<string, { name?: boolean; maxMarks?: boolean; weight?: boolean }>>({});
  const [newFieldErrors, setNewFieldErrors] = useState<{ name?: boolean; maxMarks?: boolean; weight?: boolean }>({});
  const [publishModal, setPublishModal] = useState<{ open: boolean; student?: Student | null }>({ open: false, student: null });

  useEffect(() => {
    setAssessments(loadAssessments(lecturerId, selectedSubject));
    setBreakdowns(loadBreakdowns(lecturerId, selectedSubject));
    setDrafts({});
    setSearchQuery('');
    setEditingAssessmentId(null);
    setNewKind('CAT1');
    setNewName('CAT 1');
    setNewMax(50);
    setNewWeight(15);
    setAssessmentErrors({});
    setNewFieldErrors({});
  }, [lecturerId, selectedSubject]);

  // Ensure the Type dropdown defaults to CAT1 on mount
  useEffect(() => {
    setNewKind((prev) => prev || 'CAT1');
    setNewName((prev) => prev || 'CAT 1');
    setNewMax((prev) => (prev > 0 ? prev : 50));
    setNewWeight((prev) => (prev > 0 ? prev : 15));
  }, []);

  // Fetch persisted assessment config from backend when subject selected
  useEffect(() => {
    if (!selectedSubject) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('zenti_session_token');
        const resp = await fetch(`/api/lecturer/assessment-config?subjectCode=${encodeURIComponent(selectedSubject)}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!resp.ok) return;
        const data = await resp.json();
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: AssessmentDef[] = data.map((d: any) => {
            const kind = (d.assessmentKind as AssessmentKind) || 'CAT1';
            const fallbackMax = kind === 'FinalExam' ? 100 : 50;
            const rawMax = Number(d.maxMarks);
            const maxMarks = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : fallbackMax;
            return {
              id: `${d.assessmentKind}-${selectedSubject}`,
              kind,
              name: String(d.assessmentName ?? '').trim() || (kind === 'FinalExam' ? 'Final Exam' : 'CAT 1'),
              maxMarks,
              weight: Number(d.weight ?? 0),
              published: false,
            };
          });
          setAssessments(mapped);
          return;
        }
      } catch (err) {
        // ignore and keep local state
      }
    })();
    return () => { cancelled = true; };
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedSubject) {
      setAnalytics(null);
      return;
    }

    let cancelled = false;
    setAnalyticsLoading(true);
    fetch(`/api/lecturer/assessment-analytics?lecturerId=${encodeURIComponent(lecturerId)}&subjectCode=${encodeURIComponent(selectedSubject)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load analytics');
        return response.json() as Promise<AssessmentAnalytics>;
      })
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lecturerId, selectedSubject]);

  const selectedMeta = assignedSubjects.find((subject) => subject.code === selectedSubject);
  const subjectStudents = useMemo(
    () => students.filter((student) => student.enrolledUnits.includes(selectedSubject)),
    [students, selectedSubject],
  );

  const assessmentFieldForKind = (kind: AssessmentKind): MarkField => (
    kind === 'CAT1' ? 'cat1' : kind === 'CAT2' ? 'cat2' : kind === 'Assignment' ? 'assignment' : 'exam'
  );

  const activeAssessments = useMemo(() => (
    assessments.map((a) => ({ ...a }))
  ), [assessments]);

  const filteredStudents = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return subjectStudents;
    return subjectStudents.filter((student) =>
      student.name.toLowerCase().includes(term) ||
      student.admissionNo.toLowerCase().includes(term),
    );
  }, [searchQuery, subjectStudents]);

  // Build a MarkBreakdown (cat1/cat2/assignment/exam) for a student by combining persisted breakdowns,
  // student grades and any per-assessment drafts stored under drafts[studentId][assessmentId].
  const resolveBreakdown = (student: Student): MarkBreakdown => {
    const base = breakdowns[student.id] || (() => {
      const grade = student.grades[selectedSubject];
      if (!grade) return { cat1: 0, cat2: 0, assignment: 0, exam: 0 };
      return { ...splitCat(grade.cat, assessments), exam: grade.exam };
    })();

    // Start from base
    const result: MarkBreakdown = { cat1: base.cat1 ?? 0, cat2: base.cat2 ?? 0, assignment: base.assignment ?? 0, exam: base.exam ?? 0 };

    // If there are per-assessment drafts for this student, overlay them mapped by assessment kind -> mark field
    const studentDrafts = drafts[student.id];
    if (studentDrafts && Object.keys(studentDrafts).length > 0) {
      for (const a of activeAssessments) {
        const field = assessmentFieldForKind(a.kind);
        const val = studentDrafts[a.id];
        if (val !== undefined && Number.isFinite(val)) {
          result[field] = val;
        }
      }
    }

    return result;
  };

  const sanitizeAssessments = (rawList: AssessmentDef[]): AssessmentDef[] => {
    // 1. Filter out any blank/empty draft rows
    const nonBlank = (rawList || []).filter((a) => a && String(a.name ?? '').trim() !== '');

    // 2. Normalize and auto-fallback maxMarks for empty or 0 values
    return nonBlank.map((a) => {
      const fallbackMax = a.kind === 'FinalExam' ? 100 : 50;
      const rawMax = Number(a.maxMarks);
      const maxMarks = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : fallbackMax;
      const rawWeight = Number(a.weight);
      const weight = Number.isFinite(rawWeight) && rawWeight >= 0 ? rawWeight : 0;
      const name = String(a.name ?? '').trim() || (a.kind === 'FinalExam' ? 'Final Exam' : 'CAT 1');
      return {
        ...a,
        name,
        maxMarks,
        weight,
      };
    });
  };

  const persistAssessments = (next: AssessmentDef[]) => {
    // Sanitize submission payload
    const normalized = sanitizeAssessments(next);

    const errors: Record<string, { name?: boolean; maxMarks?: boolean; weight?: boolean }> = {};
    for (const a of normalized) {
      const e: { name?: boolean; maxMarks?: boolean; weight?: boolean } = {};
      if (!a.name || a.name === '') e.name = true;
      if (!Number.isFinite(a.maxMarks) || a.maxMarks <= 0) e.maxMarks = true;
      if (!Number.isFinite(a.weight) || a.weight < 0) e.weight = true;
      if (e.name || e.maxMarks || e.weight) errors[a.id] = e;
    }

    if (Object.keys(errors).length > 0) {
      setAssessmentErrors(errors);
      showWarning('Invalid assessment(s)', 'Each assessment requires a non-empty name, maxMarks > 0 and weight >= 0. Fix highlighted fields before saving.');
      return;
    }

    // Clear any previous errors and persist
    setAssessmentErrors({});
    setAssessments(normalized);
    if (selectedSubject) localStorage.setItem(assessmentsKey(lecturerId, selectedSubject), JSON.stringify(normalized));
    // Also persist to backend so weights are canonical
    (async () => {
      try {
        const token = localStorage.getItem('zenti_session_token');
        const resp = await fetch('/api/lecturer/assessment-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            subjectCode: selectedSubject,
            assessments: normalized.map((a) => ({
              assessmentKind: a.kind,
              assessmentName: a.name,
              maxMarks: a.maxMarks,
              weight: a.weight,
            })),
          }),
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          showWarning('Save failed', body.error || 'Unable to persist assessment configuration.');
        }
      } catch (err: any) {
        // ignore
      }
    })();
  };

  const persistBreakdowns = (next: Record<string, MarkBreakdown>) => {
    setBreakdowns(next);
    if (selectedSubject) localStorage.setItem(marksKey(lecturerId, selectedSubject), JSON.stringify(next));
  };

  // Update a draft entry for a specific student and assessment id (not the field name)
  const updateDraft = (studentId: string, assessmentId: string, value: string) => {
    const numeric = parseMarkInput(value);
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentId]: Number.isNaN(numeric) ? Number.NaN : numeric,
      },
    }));
  };

  const saveStudentMarks = async (student: Student) => {
    if (!selectedSubject) return;
    const weightError = validateAssessmentWeights(assessments);
    if (weightError) {
      showWarning('Assessment weights invalid', weightError);
      return;
    }
    const marks = resolveBreakdown(student);
    const fieldErrors = validateMarkBreakdown(marks, assessments);
    const firstError = Object.values(fieldErrors)[0];
    if (firstError) {
      showWarning('Mark invalid', firstError);
      return;
    }
    const catTotal = continuousAssessmentTotal(marks, assessments);
    const aggregate = validateAggregateGrade(catTotal, marks.exam, assessments);
    if (aggregate.ok === false) {
      showWarning('Grade invalid', aggregate.error);
      return;
    }

    const hasConfiguredMaxima = assessments.some((assessment) => assessment.maxMarks > 0);
    if (!hasConfiguredMaxima) {
      showWarning('Set assessment maxima', 'Create a valid CAT/Assignment/Final Exam maximum for this module before saving marks.');
      return;
    }

    try {
      const response = await fetch('/api/lecturer/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecturerId,
          studentId: student.id,
          subjectCode: selectedSubject,
          marks,
          assessments,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        showWarning('Save blocked', body.error || 'Unable to save marks.');
        return;
      }

      const nextBreakdowns = { ...breakdowns, [student.id]: marks };
      persistBreakdowns(nextBreakdowns);
      const overallPct = body.overallPercent ?? calculateOverallPercentage(marks, assessments);
      const gradeLetter = body.gradeLetter ?? letterGradeFromOverallPercentage(overallPct);
      onUpdateGrades(student.id, selectedSubject, {
        cat: body.grade?.cat ?? aggregate.cat,
        exam: body.grade?.exam ?? aggregate.exam,
      });
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[student.id];
        return copy;
      });
      setSaveFlash(student.id);
      setTimeout(() => setSaveFlash(null), 1200);
      showToast(`Saved marks for ${student.name}.`, 'success');
    } catch (error: any) {
      showWarning('Save failed', error?.message || 'Unable to save marks.');
    }
  };

  const saveAllVisible = () => {
    void (async () => {
      for (const student of filteredStudents) {
        await saveStudentMarks(student);
      }
    })();
  };

  const createAssessment = () => {
    const option = KIND_OPTIONS.find((item) => item.kind === newKind);
    const defaultLabel = option?.label || newKind || 'CAT 1';
    const name = newName.trim() || defaultLabel;
    const fallbackMax = newKind === 'FinalExam' ? 100 : 50;
    const rawMax = Number(newMax);
    const maxMarks = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : fallbackMax;
    const rawWeight = Number(newWeight);
    const weight = Number.isFinite(rawWeight) && rawWeight >= 0 ? rawWeight : (option?.defaultWeight || 15);

    const fieldErrors: { name?: boolean; maxMarks?: boolean; weight?: boolean } = {};
    if (!name) fieldErrors.name = true;
    if (!Number.isFinite(maxMarks) || maxMarks <= 0) fieldErrors.maxMarks = true;
    if (!Number.isFinite(weight) || weight < 0) fieldErrors.weight = true;

    if (fieldErrors.name || fieldErrors.maxMarks || fieldErrors.weight) {
      setNewFieldErrors(fieldErrors);
      showWarning('Invalid input', 'Please fix the highlighted fields before creating the assessment.');
      return;
    }
    if (assessments.some((item) => item.kind === newKind)) {
      showWarning('Assessment exists', `${option?.label || newKind} is already configured for this module.`);
      return;
    }
    const next = [...assessments, { id: `${newKind.toLowerCase()}-${Date.now()}`, kind: newKind, name, maxMarks, weight, published: false }];
    const weightWarning = validateAssessmentWeights(next);
    if (weightWarning) {
      showWarning('Weights invalid', weightWarning);
      return;
    }
    persistAssessments(next);
    setNewKind('CAT1');
    setNewName('CAT 1');
    setNewMax(50);
    setNewWeight(15);
    setNewFieldErrors({});
    showToast('Assessment created.', 'success');
  };

  const isCreateInvalid = (() => {
    const name = newName.trim();
    const fallbackMax = newKind === 'FinalExam' ? 100 : 50;
    const trimmedMax = Number(newMax) || fallbackMax;
    const trimmedWeight = Number(newWeight);
    return !name || !Number.isFinite(trimmedMax) || trimmedMax <= 0 || !Number.isFinite(trimmedWeight) || trimmedWeight < 0;
  })();

  const deleteAssessment = (id: string) => {
    persistAssessments(assessments.filter((item) => item.id !== id));
    showToast('Assessment removed.', 'success');
  };

  const publishAssessment = (id: string) => {
    persistAssessments(assessments.map((item) => (item.id === id ? { ...item, published: true } : item)));
    showToast('Results marked as published for this assessment.', 'success');
  };

  const confirmPublish = async () => {
    const student = publishModal.student;
    if (!student || !selectedSubject) {
      setPublishModal({ open: false, student: null });
      return;
    }
    try {
      const token = localStorage.getItem('zenti_session_token');
      const resp = await fetch('/api/lecturer/publish-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ studentId: student.id, subjectCode: selectedSubject }),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showWarning('Publish failed', body.error || 'Unable to publish result.');
        setPublishModal({ open: false, student: null });
        return;
      }
      if (body && body.catScore !== undefined) {
        onUpdateGrades(student.id, selectedSubject, { cat: Number(body.catScore), exam: Number(body.examScore) });
      }
      showToast('Result published successfully.', 'success');
    } catch (err: any) {
      showWarning('Publish failed', err?.message || 'Unable to publish result.');
    } finally {
      setPublishModal({ open: false, student: null });
    }
  };

  const reportRows = () => subjectStudents.map((student) => {
    const marks = resolveBreakdown(student);
    const total = sumValidMarks(marks, assessments);
    const totalMax = activeAssessments.reduce((sum, a) => sum + Number(a.maxMarks || 0), 0);
    const overallPct = calculateOverallPercentage(marks, assessments);
    const row = [
      student.admissionNo,
      student.name,
      ...activeAssessments.map((a) => {
        const field = assessmentFieldForKind(a.kind);
        return String(Number.isFinite(marks[field]) ? marks[field] : '');
      }),
      `${total} / ${totalMax || 0}`,
      `${overallPct.toFixed(2)}%`,
      letterGrade(overallPct),
      student.grades[selectedSubject] ? 'Graded' : 'Pending',
    ];
    return row;
  });

  const exportExcel = () => {
    if (!selectedSubject || subjectStudents.length === 0) {
      showWarning('Nothing to export', 'No students available for this module.');
      return;
    }
    const rows = [
      ['Admission Number', 'Student Name', ...activeAssessments.map((a) => a.name), 'Total', 'Overall %', 'Grade', 'Status'],
      ...reportRows(),
    ];
    const tsv = rows.map((row) => row.map((cell) => String(cell).replace(/\t|\r?\n/g, ' ')).join('\t')).join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selectedSubject}-grade-sheet.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Excel grade sheet exported.', 'success');
  };

  const printGradeSheet = (forPdf = false) => {
    if (!selectedSubject || subjectStudents.length === 0) {
      showWarning('Nothing to print', 'No students available for this module.');
      return;
    }

    const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    }[character] || character));
    const rows = reportRows().map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      showWarning('Report blocked', 'Allow pop-ups to generate the grade sheet.');
      return;
    }

    const headerCells = ['Admission Number', 'Student Name', ...activeAssessments.map((a) => a.name), 'Total', 'Overall %', 'Grade', 'Status'];
    reportWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(selectedSubject)} Grade Sheet</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:32px}h1{font-size:20px;margin:0 0 4px}p{color:#526176;margin:0 0 20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#eff6ff;font-weight:700}@media print{body{margin:16px}}</style></head><body><h1>${escapeHtml(selectedMeta ? `${selectedMeta.code} – ${selectedMeta.title}` : selectedSubject)} Grade Sheet</h1><p>Generated ${new Date().toLocaleString()}</p><table><thead><tr>${headerCells.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
    if (forPdf) showToast('Choose “Save as PDF” in the print dialog to export the report.', 'info');
  };

  if (assignedSubjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">No modules assigned.</p>
        <p className="mt-1 text-xs text-slate-500">Ask an administrator to allocate teaching modules to your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Assessment & Grading
          </h2>
          <p className="mt-1 text-xs text-slate-500">Enter marks for your assigned modules and review class performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportExcel} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> Export Excel
          </button>
          <button type="button" onClick={() => printGradeSheet(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </button>
          <button type="button" onClick={() => printGradeSheet()} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            <Printer className="h-3.5 w-3.5" /> Print Grade Report
          </button>
        </div>
      </div>

      {/* Module selector — assigned modules only */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Select module</p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {assignedSubjects.map((subject) => {
            const active = subject.code === selectedSubject;
            return (
              <button
                key={subject.code}
                type="button"
                onClick={() => onSelectSubject(subject.code)}
                className={`rounded-lg border px-3 py-3 text-left transition ${active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`}
              >
                <p className="font-mono text-xs font-bold text-slate-900">{subject.code}</p>
                <p className="mt-1 text-xs font-medium text-slate-700 line-clamp-1">{subject.title}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Semester: {subject.semester || 'Not recorded'} · Year: {subject.academicYear || 'Not recorded'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Class analytics */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Award className="h-4 w-4 text-blue-600" />
            Class Performance Analytics
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {selectedMeta ? `${selectedMeta.code} – ${selectedMeta.title}` : 'Select a module'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {[
            { label: 'Average Score', value: analytics?.average === null || analytics?.average === undefined ? '—' : `${analytics.average}%` },
            { label: 'Highest Score', value: analytics?.highest === null || analytics?.highest === undefined ? '—' : `${analytics.highest}%` },
            { label: 'Lowest Score', value: analytics?.lowest === null || analytics?.lowest === undefined ? '—' : `${analytics.lowest}%` },
            { label: 'Pass Rate', value: analytics?.passRate === null || analytics?.passRate === undefined ? '—' : `${analytics.passRate}%` },
            { label: 'Fail Rate', value: analytics?.failRate === null || analytics?.failRate === undefined ? '—' : `${analytics.failRate}%` },
            { label: 'Students Graded', value: analytics ? String(analytics.graded) : '—' },
            { label: 'Students Pending', value: analytics ? String(analytics.pending) : '—' },
          ].map((card) => (
            <div key={card.label} className="min-h-[84px] rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{analyticsLoading ? '…' : card.value}</p>
            </div>
          ))}
        </div>

        {!analyticsLoading && (!analytics || analytics.graded === 0) ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
            <p className="text-xs font-semibold text-slate-700">No database grades available.</p>
            <p className="mt-1 text-[11px] text-slate-500">Saved grades for this module will appear here.</p>
          </div>
        ) : (
          <div className="w-full" style={{ width: '100%', height: 224, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <BarChart layout="vertical" data={analytics?.distribution || []} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={36} fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload as { name: string; count: number; percent: number };
                    return (
                      <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                        <p className="font-semibold">Grade {data.name}</p>
                        <p className="mt-1 text-slate-300">{data.count} student{data.count === 1 ? '' : 's'} · {data.percent}% of graded students</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                  <LabelList dataKey="count" position="right" className="fill-slate-600 text-[11px]" />
                  {(analytics?.distribution || []).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Assessment management */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Assessment management</h3>
            <p className="text-xs text-slate-500">Configure CAT 1, CAT 2, Assignments, and Final Exam for this module.</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <div>Total Weight: <span className={`font-semibold ${assessments.reduce((s, a) => s + Number(a.weight || 0), 0) !== 100 ? 'text-rose-600' : 'text-emerald-700'}`}>{assessments.reduce((s, a) => s + Number(a.weight || 0), 0)}%</span></div>
            {(() => {
              const total = assessments.reduce((s, a) => s + Number(a.weight || 0), 0);
              if (total > 100) return <div className="text-rose-600 text-xs">Total weight exceeds 100% by {total - 100}%.</div>;
              if (total < 100) return <div className="text-amber-600 text-xs">Total weight is short by {100 - total}% (suggested remaining weight for next assessment).</div>;
              return <div className="text-emerald-600 text-xs">Total weight is 100% — good.</div>;
            })()}
          </div>
        </div>

        {assessments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-600">No assessments created.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Assessment</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Max Marks</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3">
                      {editingAssessmentId === assessment.id ? (
                        <input
                          value={assessment.name}
                          onChange={(event) => {
                            setAssessmentErrors((prev) => { const copy = { ...prev }; delete copy[assessment.id]; return copy; });
                            persistAssessments(assessments.map((item) => item.id === assessment.id ? { ...item, name: event.target.value } : item));
                          }}
                          className={`w-full rounded px-2 py-1 text-xs border transition ${
                            assessmentErrors[assessment.id]?.name ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50' : 'border-slate-200'
                          }`}
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">{assessment.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{assessment.kind}</td>
                    <td className="px-3 py-3">
                      {editingAssessmentId === assessment.id ? (
                        <input
                          type="number"
                          min={1}
                          value={assessment.maxMarks}
                          onChange={(event) => {
                            setAssessmentErrors((prev) => { const copy = { ...prev }; delete copy[assessment.id]; return copy; });
                            const val = Number(event.target.value);
                            const fallbackMax = assessment.kind === 'FinalExam' ? 100 : 50;
                            const safeMax = val > 0 ? val : fallbackMax;
                            persistAssessments(assessments.map((item) => item.id === assessment.id ? { ...item, maxMarks: safeMax } : item));
                          }}
                          className={`w-20 rounded px-2 py-1 text-xs border transition ${
                            assessmentErrors[assessment.id]?.maxMarks ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50' : 'border-slate-200'
                          }`}
                        />
                      ) : (
                        assessment.maxMarks
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${assessment.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {assessment.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right space-x-2">
                      <button type="button" onClick={() => setEditingAssessmentId(editingAssessmentId === assessment.id ? null : assessment.id)} className="font-semibold text-blue-700 hover:underline">
                        {editingAssessmentId === assessment.id ? 'Done' : 'Edit'}
                      </button>
                      <button type="button" onClick={() => publishAssessment(assessment.id)} className="font-semibold text-emerald-700 hover:underline">Publish</button>
                      <button type="button" onClick={() => deleteAssessment(assessment.id)} className="inline-flex items-center text-rose-600 hover:underline"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-600">Type</label>
            <select
              value={newKind}
              onChange={(event) => {
                const kind = event.target.value as AssessmentKind;
                setNewKind(kind);
                const defaults = ASSESSMENT_DEFAULTS[kind] || { weight: 15, max: 50, label: 'CAT 1' };
                const currentTotal = assessments.reduce((s, a) => s + Number(a.weight || 0), 0);
                const remaining = Math.max(0, 100 - currentTotal);
                const suggestedWeight = remaining > 0 ? remaining : defaults.weight;
                setNewName(defaults.label);
                setNewWeight(suggestedWeight);
                setNewMax(defaults.max);
                setNewFieldErrors({});
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
            >
              {KIND_OPTIONS.map((option) => <option key={option.kind} value={option.kind}>{option.label}</option>)}
            </select>
          </div>
          <div className="flex-[1.4]">
            <label className="text-[11px] font-semibold text-slate-600">Name</label>
            <input
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value);
                setNewFieldErrors((p) => ({ ...p, name: false }));
              }}
              placeholder="Assessment name (e.g. CAT 1)"
              className={`mt-1 w-full rounded-lg border px-2 py-2 text-xs transition ${
                newFieldErrors.name ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
              }`}
            />
          </div>
          <div className="w-28">
            <label className="text-[11px] font-semibold text-slate-600">Max</label>
            <input
              type="number"
              min={1}
              value={newMax || ''}
              onChange={(event) => {
                setNewMax(Number(event.target.value) || 0);
                setNewFieldErrors((p) => ({ ...p, maxMarks: false }));
              }}
              className={`mt-1 w-full rounded-lg border px-2 py-2 text-xs transition ${
                newFieldErrors.maxMarks ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
              }`}
            />
          </div>
          <div className="w-28">
            <label className="text-[11px] font-semibold text-slate-600">Weight %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={newWeight || ''}
              onChange={(event) => {
                setNewWeight(Number(event.target.value) || 0);
                setNewFieldErrors((p) => ({ ...p, weight: false }));
              }}
              className={`mt-1 w-full rounded-lg border px-2 py-2 text-xs transition ${
                newFieldErrors.weight ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={createAssessment}
            disabled={isCreateInvalid}
            className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white ${
              isCreateInvalid ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> Create Assessment
          </button>
        </div>
        {isCreateInvalid && (
          <div className="text-rose-600 text-xs mt-1">
            {newFieldErrors.name && <div>Provide a valid assessment name.</div>}
            {newFieldErrors.maxMarks && <div>Max marks must be a number greater than 0.</div>}
            {newFieldErrors.weight && <div>Weight must be a number greater than or equal to 0.</div>}
            {!newFieldErrors.name && !newFieldErrors.maxMarks && !newFieldErrors.weight && (
              <div>Please ensure name is non-empty and max marks/weight are valid numbers.</div>
            )}
          </div>
        )}
      </section>

      {/* Marks entry */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Marks entry</h3>
            <p className="text-xs text-slate-500">CAT components and final exam limits are taken from the lecturer-configured assessment structure for this module.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search admission no. or name"
                className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>
            <button type="button" onClick={saveAllVisible} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              <Save className="h-3.5 w-3.5" /> Save All
            </button>
          </div>
        </div>

        {subjectStudents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No students assigned.</p>
            <p className="mt-1 text-xs text-slate-500">No enrolled students found for this module.</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-600">No students match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="border-y border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Admission Number</th>
                  <th className="px-3 py-2.5">Student Name</th>
                  {activeAssessments.map((a) => (
                    <th key={a.id} className="px-3 py-2.5 text-center">
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-[11px] text-slate-400">Max {a.maxMarks}</div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center">Total</th>
                  <th className="px-3 py-2.5 text-center">Grade</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                  {filteredStudents.map((student) => {
                  const marks = resolveBreakdown(student);
                  const fieldErrors = validateMarkBreakdown(marks, assessments);
                  const total = sumValidMarks(marks, assessments);
                  const totalMax = activeAssessments.reduce((sum, a) => sum + Number(a.maxMarks || 0), 0);
                  const overallPct = calculateOverallPercentage(marks, assessments);
                  const hasInvalid = Object.keys(fieldErrors).length > 0;
                  const graded = !!student.grades[selectedSubject];
                  return (
                    <tr key={student.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2.5 font-mono font-semibold text-slate-800">{student.admissionNo}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{student.name}</td>
                      {activeAssessments.map((a) => {
                        const field = assessmentFieldForKind(a.kind);
                        const max = Number(a.maxMarks || maxMarksForField(assessments, field));
                        const displayValue = Number.isFinite(marks[field]) ? marks[field] : '';
                        return (
                          <td key={a.id} className="px-3 py-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={max}
                              step="any"
                              value={displayValue}
                              onChange={(event) => updateDraft(student.id, a.id, event.target.value)}
                              aria-invalid={Boolean(fieldErrors[field])}
                              title={fieldErrors[field]}
                              className={`w-16 rounded border px-2 py-1 text-center font-mono outline-none focus:ring-2 ${
                                fieldErrors[field] ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className={`px-3 py-2.5 text-center font-semibold ${hasInvalid ? 'text-slate-400' : 'text-slate-900'}`}>
                        {hasInvalid ? '—' : `${total} / ${totalMax || 0}`}
                      </td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${hasInvalid ? 'text-slate-400' : 'text-slate-900'}`}>
                        {hasInvalid ? '—' : `${overallPct.toFixed(2)}%`}
                      </td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${hasInvalid ? 'text-slate-400' : 'text-slate-900'}`}>
                        {hasInvalid ? '—' : letterGrade(overallPct)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${graded ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {graded ? 'Graded' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => void saveStudentMarks(student)}
                          disabled={hasInvalid}
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${saveFlash === student.id ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          {saveFlash === student.id ? 'Saved' : 'Save'}
                        </button>
                        {' '}
                        <button
                          type="button"
                          onClick={() => setPublishModal({ open: true, student })}
                          disabled={hasInvalid || Boolean(validateAssessmentWeights(assessments))}
                          className="ml-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Publish Result
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* Publish confirmation modal */}
      {publishModal.open && publishModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPublishModal({ open: false, student: null })} />
          <div className="relative max-w-md w-full rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Publish Result</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Are you sure you want to publish this student's result? This action will make the result visible to the student.</p>
            <div className="mt-4 text-sm">
              <div className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Student:</span> {publishModal.student.name}</div>
              <div className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Admission No:</span> {publishModal.student.admissionNo}</div>
              <div className="text-slate-700 dark:text-slate-200"><span className="font-semibold">Module:</span> {selectedMeta ? `${selectedMeta.code} – ${selectedMeta.title}` : selectedSubject}</div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setPublishModal({ open: false, student: null })} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button type="button" onClick={confirmPublish} className="px-3 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">Confirm Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
