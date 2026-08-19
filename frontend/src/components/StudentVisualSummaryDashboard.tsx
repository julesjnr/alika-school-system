import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Award, Bell, BookOpen, CalendarDays, CheckCircle2,
  Library, Loader2, MapPin, TrendingUp, WalletCards,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Course, Student } from '../types';

type DashboardTab = 'dashboard' | 'grades' | 'financials' | 'materials' | 'units' | 'officeHours' | 'library';

interface DashboardSummary {
  gpa: number | null;
  gpaLabel: string;
  creditsEarned: number | null;
  modulesPassed: number;
  semesterAverage?: number | null;
  degreeProgress?: {
    completed?: number | null;
    required?: number | null;
    percent?: number | null;
  } | null;
  attendanceRate: number | null;
  attendance?: number | null;
  presentCount?: number | null;
  lateCount?: number | null;
  absentCount?: number | null;
  totalSessions?: number | null;
  attendanceModules?: Array<{ subjectCode: string; attendanceRate: number | null; present: number; late: number; absent: number; totalSessions: number }>;
  activeModules: number;
  requiredUnits: number | null;
  outstandingFees: number;
  admissionNo?: string | null;
  programme?: string | null;
  semester?: string | null;
  academicYear?: string | null;
  gpaTrend: Array<{ semester: string; GPA: number; label?: string }>;
  todaySchedule: Array<{ id: string; time: string; courseCode: string; unitName: string; lecturer: string | null; room: string | null }>;
  registeredUnits: Array<{ courseCode: string; unitName: string; credits: number | null; lecturer: string | null; status: string }>;
  notifications: Array<{ id: string; title: string; message: string; type: string; dateTime: string }>;
  feeSummary: { total: number; paid: number; balance: number; status: string };
  unpublishedSubjects?: string[];
}

interface StudentVisualSummaryDashboardProps {
  student: Student;
  allCourses: Course[];
  onNavigateTab: (tab: DashboardTab) => void;
}

const currency = (amount: number) => `KES ${amount.toLocaleString()}`;

function timeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentVisualSummaryDashboard({ student, onNavigateTab }: StudentVisualSummaryDashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollIntervalId, setPollIntervalId] = useState<number | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!student.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('zenti_session_token');
      const response = await fetch('/api/student/dashboard-summary', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to load dashboard data');
      setSummary(body);
    } catch (err: any) {
      setSummary(null);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [student.id]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Poll dashboard summary periodically so published results appear promptly
  useEffect(() => {
    if (!student.id) return;
    // refresh every 20 seconds
    const id = window.setInterval(() => { fetchSummary(); }, 20000);
    setPollIntervalId(id);
    return () => { window.clearInterval(id); setPollIntervalId(null); };
  }, [student.id, fetchSummary]);

  const firstName = student.name.trim().split(/\s+/)[0] || 'Student';
  const greeting = useMemo(() => timeGreeting(), []);
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()), []);

  if (isLoading) {
    return <div className="min-h-[360px] rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Loading dashboard…</div>;
  }
  if (!summary) {
    return <div className="rounded-xl border border-rose-200 bg-white p-8 text-center"><AlertCircle className="mx-auto h-7 w-7 text-rose-600" /><p className="mt-3 text-sm font-semibold text-slate-900">Dashboard data could not be loaded</p><p className="mt-1 text-xs text-slate-500">{error}</p><button onClick={fetchSummary} className="mt-4 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Retry</button></div>;
  }

  const programme = summary.programme || student.programme || student.department || 'Programme not recorded';
  const admissionNo = summary.admissionNo || student.admissionNo || 'Not recorded';
  const academicYear = summary.academicYear || student.cohort || 'Not recorded';
  const semester = summary.semester || 'Not recorded';
  const hasGpaHistory = new Set(summary.gpaTrend.map((point) => point.semester || point.label || '')).size >= 2;

  const metricCards = [
    { label: 'CGPA', value: summary.gpa === null ? '—' : summary.gpa.toFixed(2), detail: summary.gpa === null ? 'No grades published' : 'Current cumulative GPA', icon: Award, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Modules Passed', value: String(summary.modulesPassed ?? 0), detail: summary.modulesPassed > 0 ? 'Published passing results' : 'No passed modules yet', icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Registered Modules', value: String(summary.activeModules), detail: 'Active this semester', icon: BookOpen, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Academic Classification', value: summary.gpa === null ? '—' : summary.gpaLabel, detail: summary.gpa === null ? 'Awaiting results' : 'Based on published marks', icon: TrendingUp, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Semester Avg', value: summary.semesterAverage === null ? '—' : (String(summary.semesterAverage) + '%'), detail: summary.semesterAverage === null ? 'No published subjects' : 'Average of published units', icon: TrendingUp, tone: 'text-sky-600 bg-sky-50' },
    { label: 'Credits Earned', value: summary.creditsEarned === null ? '—' : String(summary.creditsEarned), detail: summary.creditsEarned === null ? 'Not available' : 'Accumulated credits', icon: Library, tone: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <div className="space-y-5 font-sans" aria-live="polite">
      <header className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-5 text-white shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-blue-100">Student portal</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{greeting}, {firstName}</h1>
            <p className="mt-1 text-sm text-blue-100">{programme}</p>
            <p className="mt-1 text-xs text-blue-200">
              Adm. {admissionNo} · Semester: {semester} · Academic year: {academicYear}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100"><CalendarDays className="h-4 w-4" />{dateLabel}</div>
        </div>
      </header>

      {/* Mobile-First 2-Column Metric Cards Grid with Trend Indicators */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Academic summary">
        {metricCards.map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className="min-h-[100px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display truncate">{value}</p>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">{detail}</p>
              </div>
              <span className={`rounded-xl p-2 shrink-0 ${tone}`}><Icon className="h-4 w-4" /></span>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Access Action Chips Row */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Quick Access Services</h3>
          <span className="text-[10px] text-slate-400 font-medium">Touch to navigate</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Results', tab: 'grades', icon: Award, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
            { label: 'Fees & Balance', tab: 'financials', icon: WalletCards, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
            { label: 'Attendance', tab: 'units', icon: CheckCircle2, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800' },
            { label: 'Register Units', tab: 'units', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
            { label: 'Library HQ', tab: 'library', icon: Library, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
            { label: 'Consultations', tab: 'officeHours', icon: CalendarDays, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
          ].map(({ label, tab, icon: Icon, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => onNavigateTab(tab as DashboardTab)}
              className={`min-h-[48px] h-12 flex items-center gap-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs ${color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Academic progress & Transcript */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Academic Progress & Curriculum</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Programme completion and module credit standing</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.dispatchEvent(new CustomEvent('openTranscript'))} className="h-9 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors">View Transcript</button>
            <button onClick={() => onNavigateTab('grades')} className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors">View Grades</button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed modules</div>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white font-mono">{summary.degreeProgress?.completed ?? '—'}</div>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Remaining modules</div>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white font-mono">{Math.max((summary.degreeProgress?.required ?? 0) - (summary.degreeProgress?.completed ?? 0), 0)}</div>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completion rate</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{summary.degreeProgress?.percent ?? '—'}%</span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${Math.min(100, summary.degreeProgress?.percent || 0)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Attendance summary */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Summary</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Aggregated participation across registered units</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance rate</div>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white font-mono">{summary.attendance === null || summary.attendance === undefined ? '—' : `${summary.attendance}%`}</div>
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present / Late / Absent</div>
            {((summary.presentCount ?? null) !== null || (Array.isArray(summary.attendanceModules) && summary.attendanceModules.length > 0)) ? (
              <div className="mt-1 text-xs text-slate-700 dark:text-slate-300 space-y-0.5 font-medium">
                <div>Present: <strong className="text-emerald-600 font-bold">{summary.presentCount ?? summary.attendanceModules?.reduce((s, m) => s + (m.present || 0), 0) ?? 0}</strong></div>
                <div>Late: <strong className="text-amber-600 font-bold">{summary.lateCount ?? summary.attendanceModules?.reduce((s, m) => s + (m.late || 0), 0) ?? 0}</strong></div>
                <div>Absent: <strong className="text-rose-600 font-bold">{summary.absentCount ?? summary.attendanceModules?.reduce((s, m) => s + (m.absent || 0), 0) ?? 0}</strong></div>
              </div>
            ) : (
              <div className="mt-1 text-xs text-slate-500">No attendance records yet.</div>
            )}
          </div>
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Eligibility Status</div>
            <div className="mt-1 text-xs font-bold text-slate-800 dark:text-white">
              {(typeof summary.attendance === 'number' && summary.attendance < 75) ? (
                <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Below 75% threshold
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Exam Eligible (≥75%)
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Today’s schedule</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Classes assigned to your registered units</p>
            </div>
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          {summary.todaySchedule.length === 0 ? (
            <Empty message="No classes scheduled today." />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.todaySchedule.map((item) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[100px_1fr_1fr_110px] gap-2 py-3 text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{item.time}</span>
                  <div>
                    <strong className="font-bold text-slate-900 dark:text-white">{item.courseCode}</strong>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.unitName}</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.lecturer || 'Lecturer not assigned'}</span>
                  <span className="flex items-center gap-1 text-slate-500 font-medium"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />{item.room || 'Room not set'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Latest institutional updates</p>
            </div>
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          {summary.notifications.length === 0 ? (
            <Empty message="No new notifications." />
          ) : (
            <div className="space-y-3">
              {summary.notifications.map((notification) => (
                <article key={notification.id} className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{notification.message}</p>
                  <time className="mt-1 block text-[10px] text-slate-400 font-mono">{new Date(notification.dateTime).toLocaleDateString('en-GB')}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Registered Units: Responsive Stacked Cards on Mobile / Table on sm+ */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Registered units</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Manage registration from Unit Registration</p>
            </div>
            <button onClick={() => onNavigateTab('units')} className="h-9 px-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-all cursor-pointer shrink-0">Manage units</button>
          </div>

          {summary.registeredUnits.length === 0 ? (
            <Empty message="No registered units. Register units to begin your semester." action="Register units" onAction={() => onNavigateTab('units')} />
          ) : (
            <>
              {/* Mobile Stacked Card View (<640px) */}
              <div className="block sm:hidden space-y-2.5">
                {summary.registeredUnits.map((unit) => (
                  <div key={unit.courseCode} className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                          {unit.courseCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 leading-snug">{unit.unitName}</h4>
                      </div>
                      {summary.unpublishedSubjects && summary.unpublishedSubjects.includes(unit.courseCode) ? (
                        <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-[10px] font-bold px-2 py-0.5 text-amber-800 dark:text-amber-300 shrink-0">Pending</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 text-emerald-700 dark:text-emerald-300 shrink-0">{unit.status}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>{unit.lecturer || 'Lecturer not assigned'}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{unit.credits ?? 3} Credits</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>=640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Unit code</th>
                      <th className="px-3 py-2.5">Unit name</th>
                      <th className="px-3 py-2.5">Credits</th>
                      <th className="px-3 py-2.5">Lecturer</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {summary.registeredUnits.map((unit) => (
                      <tr key={unit.courseCode} className="hover:bg-slate-50/50">
                        <td className="px-3 py-3 font-mono font-bold text-blue-600">{unit.courseCode}</td>
                        <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-200">{unit.unitName}</td>
                        <td className="px-3 py-3 text-slate-600 font-mono">{unit.credits ?? '—'}</td>
                        <td className="px-3 py-3 text-slate-600">{unit.lecturer || 'Not assigned'}</td>
                        <td className="px-3 py-3">
                          {summary.unpublishedSubjects && summary.unpublishedSubjects.includes(unit.courseCode) ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">Pending publication</span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{unit.status}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => onNavigateTab('units')} className="font-bold text-blue-600 hover:underline mr-3 cursor-pointer">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* CGPA Trend Chart */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Academic progress</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">CGPA history trend</p>
            </div>
          </div>
          {hasGpaHistory ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.gpaTrend}>
                  <defs>
                    <linearGradient id="gpaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={10} />
                  <YAxis domain={[0, 4]} fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="GPA" stroke="#2563eb" strokeWidth={2} fill="url(#gpaFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex min-h-[192px] flex-col items-center justify-center text-center">
              <Award className="h-8 w-8 text-blue-300 mb-2" />
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{summary.gpa === null ? '—' : summary.gpa.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                {summary.gpa === null ? 'No published results yet.' : 'Current cumulative GPA based on published courses.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Financial Breakdown Card with Visual Progress Bar */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Fee Balance & Financial Breakdown</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current tuition and ledger statement</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onNavigateTab('financials')} 
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs shadow-blue-500/20 cursor-pointer active:scale-95 transition-all self-stretch sm:self-auto"
          >
            <span>View Fees & Ledger</span>
          </button>
        </div>

        {(() => {
          const total = summary.feeSummary.total || 1;
          const paid = summary.feeSummary.paid || 0;
          const pct = Math.min(100, Math.round((paid / total) * 100)) || 0;

          return (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Invoiced</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-1 block">{currency(summary.feeSummary.total)}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Paid</span>
                  <span className="text-base font-black text-emerald-600 font-mono mt-1 block">{currency(summary.feeSummary.paid)}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Outstanding Balance</span>
                  <span className={`text-base font-black font-mono mt-1 block ${summary.feeSummary.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {currency(summary.feeSummary.balance)}
                  </span>
                </div>
              </div>

              {/* Visual Percentage Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Fee Payment Progress</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">{pct}% Cleared</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </section>
    </div>
  );
}

function Empty({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {action && <button onClick={onAction} className="mt-3 text-xs font-semibold text-blue-700 hover:underline">{action}</button>}
    </div>
  );
}

function Row({ label, value, success, danger }: { label: string; value: string; success?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={success ? 'font-medium text-emerald-700' : danger ? 'font-medium text-rose-700' : 'font-medium text-slate-800'}>{value}</dd>
    </div>
  );
}
