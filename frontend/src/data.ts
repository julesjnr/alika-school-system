import { Course, Lecturer, Student, Expense, StockItem, Requisition, NewsPost, Testimony, CourseReview, Book, Loan, Reservation, LMSReadingList, BookReview, BookRequest, ExamPaper, TeacherResource, LibraryGateLog, InAppNotification } from './types';

export const initialCourses: Course[] = [];
export const initialLecturers: Lecturer[] = [];
export const initialStudents: Student[] = [];
export const initialExpenses: Expense[] = [];
export const initialInventory: StockItem[] = [];
export const initialRequisitions: Requisition[] = [];
export const initialNews: NewsPost[] = [];
export const initialTestimonies: Testimony[] = [];

export const subjectMap: Record<string, string> = {};

// The authoritative academic catalogue is loaded from PostgreSQL through the
// backend API. This map is hydrated at runtime and should never contain a
// hardcoded production curriculum list.

export const initialReviews: CourseReview[] = [];
export const initialBooks: Book[] = [];
export const initialLoans: Loan[] = [];
export const initialReservations: Reservation[] = [];
export const initialReadingLists: LMSReadingList[] = [];
export const initialBookReviews: BookReview[] = [];
export const initialBookRequests: BookRequest[] = [];
export const initialExamPapers: ExamPaper[] = [];
export const initialTeacherResources: TeacherResource[] = [];
export const initialLibraryGateLogs: LibraryGateLog[] = [];
export const initialNotifications: InAppNotification[] = [];

// Do not maintain an authoritative hardcoded academic map. The PostgreSQL-backed
// course list is the source of truth for all real academic data in the app.