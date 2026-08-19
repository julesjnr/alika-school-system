import React, { useEffect, useMemo, useState } from 'react';
import { Award, ChevronRight, LoaderCircle } from 'lucide-react';
import { Course } from '../types';

type Mark = {
  subjectCode: string;
  overallPercent: number | null;
  grade: string | null;
  gradePoint?: number | null;
  passed: boolean | null;
  catScore: number | null;
  examScore: number | null;
  gradedAt: string | null;
  status: 'Published' | 'Submitted' | 'No Result';
};

type Summary = {
  academicYear: string | null;
  semester: string | null;
  programme: string | null;
  gpa: number | null;
  gpaLabel: string;
  creditsEarned: number | null;
  publishedSubjectsDetailed: Mark[];
};

function gradeTone(mark: Mark) {
  if (mark.status === 'No Result') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (mark.status === 'Submitted') return 'bg-blue-50 text-blue-700 border-blue-200';
  return mark.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200';
}

export default function StudentAcademicMarks({ studentId, courses }: { studentId: string; courses: Course[] }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const token = localStorage.getItem('zenti_session_token');
    fetch('/api/student/dashboard-summary', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load academic marks.');
        if (active) setSummary(body);
      })
      .catch((reason) => active && setError(reason.message || 'Unable to load academic marks.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [studentId]);

  const courseByCode = useMemo(() => new Map(courses.map((course) => [course.code, course])), [courses]);
  const marks = summary?.publishedSubjectsDetailed || [];
  const selected = marks.find((mark) => mark.subjectCode === selectedCode) || null;
  const currentYear = summary?.academicYear || 'Current academic year';
  const currentSemester = summary?.semester || 'Current semester';

  const openDetails = async (code: string) => {
    setSelectedCode(code);
    setDetails(null);
    try {
      const token = localStorage.getItem('zenti_session_token');
      const response = await fetch(`/api/student/assessment-details?subjectCode=${encodeURIComponent(code)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load the assessment breakdown.');
      setDetails(body);
    } catch (reason: any) {
      setDetails({ error: reason.message || 'Unable to load the assessment breakdown.' });
    }
  };

  return (
    <section className="space-y-5" aria-label="Academic marks">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 font-display"><Award className="h-5 w-5 text-blue-600" />Academic Marks</h2>
          <p className="mt-1 text-xs text-slate-500">Published results and assessment breakdowns for your registered courses.</p>
        </div>
        <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">Published results only</span>
      </div>

      {loading ? <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading academic record…</div> : error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic year</span><p className="mt-1 text-sm font-semibold text-slate-800">{currentYear}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester</span><p className="mt-1 text-sm font-semibold text-slate-800">{currentSemester}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Programme</span><p className="mt-1 text-sm font-semibold text-slate-800">{summary?.programme || 'Not recorded'}</p></div>
        </div>

        {summary?.gpa !== null && summary?.gpa !== undefined && <div className="grid grid-cols-2 gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:grid-cols-4"><Metric label="GPA" value={summary.gpa.toFixed(2)} /><Metric label="Academic standing" value={summary.gpaLabel} /><Metric label="Graded courses" value={String(marks.filter((mark) => mark.status === 'Published' || mark.status === 'Submitted').length)} /><Metric label="Credits earned" value={summary.creditsEarned == null ? '—' : String(summary.creditsEarned)} /></div>}

        {marks.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center"><Award className="mx-auto mb-2 h-8 w-8 text-slate-300" /><p className="text-sm font-semibold text-slate-700">No registered courses or published marks yet.</p><p className="mt-1 text-xs text-slate-500">Results will appear here when they are released by the school.</p></div> : <>
          <div className="space-y-3 md:hidden">{marks.map((mark) => <MarkCard key={mark.subjectCode} mark={mark} course={courseByCode.get(mark.subjectCode)} onDetails={openDetails} />)}</div>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="p-4">Course</th><th>CAT</th><th>Exam</th><th>Total</th><th>Grade</th><th>Points</th><th>Status</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{marks.map((mark) => { const course = courseByCode.get(mark.subjectCode); return <tr key={mark.subjectCode}><td className="p-4"><p className="font-mono font-bold text-slate-900">{mark.subjectCode}</p><p className="mt-0.5 text-slate-500">{course?.title || mark.subjectCode}</p></td><td>{mark.catScore ?? '—'}</td><td>{mark.examScore ?? '—'}</td><td className="font-bold">{mark.overallPercent == null ? '—' : `${mark.overallPercent}/100`}</td><td className="font-bold">{mark.grade || '—'}</td><td>{mark.gradePoint ?? '—'}</td><td><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${gradeTone(mark)}`}>{statusLabel(mark)}</span></td><td>{mark.status === 'Published' && <button onClick={() => openDetails(mark.subjectCode)} className="font-semibold text-blue-600 hover:underline">View details</button>}</td></tr>; })}</tbody></table></div>
        </>}
      </>}

      {selectedCode && <div className="fixed inset-0 z-60 flex items-end bg-slate-900/50 p-0 sm:items-center sm:justify-center sm:p-4"><div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold text-blue-600">{selectedCode}</p><h3 className="text-lg font-bold text-slate-900">{courseByCode.get(selectedCode)?.title || selectedCode}</h3><p className="text-xs text-slate-500">Published assessment breakdown</p></div><button onClick={() => setSelectedCode(null)} className="text-sm font-semibold text-slate-500">Close</button></div>{!details ? <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading details…</div> : details.error ? <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{details.error}</p> : <div className="mt-5 space-y-2">{(details.breakdown || []).map((item: any, index: number) => <div key={`${item.assessmentKind}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="text-sm font-semibold text-slate-800">{item.assessmentName || item.assessmentKind}</p><p className="text-[11px] text-slate-500">{item.assessmentKind}</p></div><span className="font-mono text-sm font-bold text-slate-900">{item.rawMark}/{item.maxMarks}</span></div>)}{selected && <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center"><Metric label="Final mark" value={`${selected.overallPercent}/100`} /><Metric label="Grade" value={selected.grade || '—'} /><Metric label="Grade point" value={selected.gradePoint == null ? '—' : selected.gradePoint.toFixed(1)} /></div>}</div>}</div></div>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p></div>; }
function statusLabel(mark: Mark): string {
  if (mark.status === 'Published') return mark.passed ? 'Passed' : 'Failed';
  if (mark.status === 'Submitted') return 'Under Review';
  return mark.status;
}
function MarkCard({ mark, course, onDetails }: { mark: Mark; course?: Course; onDetails: (code: string) => void }) {
  const hasScore = mark.status === 'Published' || mark.status === 'Submitted';
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-3xs"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-blue-700">{mark.subjectCode}</p><h3 className="mt-1 text-sm font-bold text-slate-900">{course?.title || mark.subjectCode}</h3><p className="mt-1 text-[11px] text-slate-500">Credit hours: not recorded</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${gradeTone(mark)}`}>{statusLabel(mark)}</span></div>{hasScore ? <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs">{mark.catScore != null && <><span className="text-slate-500">CAT</span><b>{mark.catScore}</b></>}{mark.examScore != null && <><span className="text-slate-500">Exam</span><b>{mark.examScore}</b></>}<span className="text-slate-500">Total</span><b>{mark.overallPercent}/100</b><span className="text-slate-500">Grade</span><b>{mark.grade}</b><span className="text-slate-500">Points</span><b>{mark.gradePoint == null ? '—' : mark.gradePoint.toFixed(1)}</b></div> : <p className="mt-4 text-xs text-slate-500">No result has been released for this course.</p>}{mark.status === 'Published' && <button onClick={() => onDetails(mark.subjectCode)} className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-blue-200 py-2 text-xs font-bold text-blue-700">View details <ChevronRight className="h-3.5 w-3.5" /></button>}</article>;
}
