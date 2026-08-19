import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePortalRole,
  getUserPermissions,
  hasPermission,
  hasAccessToItem,
  getAuthorizedNavItems,
  getPrimaryNavItems,
  getSecondaryNavItems,
  isItemActive,
  MASTER_NAVIGATION_ITEMS,
  UserNavContext,
} from './navigation';

describe('Mobile Navigation & Authorization Config', () => {
  describe('normalizePortalRole', () => {
    it('normalizes various role strings and aliases', () => {
      assert.equal(normalizePortalRole('student'), 'student');
      assert.equal(normalizePortalRole('lecturer'), 'lecturer');
      assert.equal(normalizePortalRole('faculty'), 'lecturer');
      assert.equal(normalizePortalRole('admin'), 'admin');
      assert.equal(normalizePortalRole('super_admin'), 'admin');
      assert.equal(normalizePortalRole('superadmin'), 'admin');
      assert.equal(normalizePortalRole('accountant'), 'accountant');
      assert.equal(normalizePortalRole('finance'), 'accountant');
      assert.equal(normalizePortalRole('finance_officer'), 'accountant');
      assert.equal(normalizePortalRole('librarian'), 'librarian');
      assert.equal(normalizePortalRole('admissions_officer'), 'admissions_officer');
      assert.equal(normalizePortalRole('admissions'), 'admissions_officer');
      assert.equal(normalizePortalRole('hr'), 'hr');
      assert.equal(normalizePortalRole('hr_officer'), 'hr');
      assert.equal(normalizePortalRole(null), null);
      assert.equal(normalizePortalRole(undefined), null);
      assert.equal(normalizePortalRole(''), null);
    });
  });

  describe('getUserPermissions', () => {
    it('returns empty permissions when context is loading or unauthenticated', () => {
      assert.equal(getUserPermissions({ isLoading: true, role: 'admin' }).size, 0);
      assert.equal(getUserPermissions({ role: null }).size, 0);
      assert.equal(getUserPermissions({ role: undefined }).size, 0);
      assert.equal(getUserPermissions({}).size, 0);
    });

    it('returns student permissions for student role', () => {
      const perms = getUserPermissions({ role: 'student' });
      assert.ok(perms.has('portal:student'));
      assert.ok(perms.has('student:home'));
      assert.ok(perms.has('student:courses'));
      assert.ok(perms.has('student:results'));
      assert.ok(perms.has('student:fees'));
      assert.ok(perms.has('student:units'));
      assert.ok(perms.has('student:consultation'));
      assert.ok(perms.has('student:library'));
      // Student must NOT have admin or lecturer permissions
      assert.ok(!perms.has('admin:dashboard'));
      assert.ok(!perms.has('lecturer:grading'));
      assert.ok(!perms.has('admin:finance'));
    });

    it('returns lecturer permissions for lecturer role', () => {
      const perms = getUserPermissions({ role: 'lecturer' });
      assert.ok(perms.has('portal:lecturer'));
      assert.ok(perms.has('lecturer:home'));
      assert.ok(perms.has('lecturer:classes'));
      assert.ok(perms.has('lecturer:attendance'));
      assert.ok(perms.has('lecturer:marks'));
      assert.ok(perms.has('lecturer:students'));
      assert.ok(perms.has('lecturer:timetable'));
      assert.ok(perms.has('lecturer:library'));
      // Lecturer must NOT have student results or admin admissions permissions
      assert.ok(!perms.has('student:results'));
      assert.ok(!perms.has('admin:admissions'));
    });

    it('returns admin permissions for admin / super_admin role', () => {
      const perms = getUserPermissions({ role: 'admin' });
      assert.ok(perms.has('portal:admin'));
      assert.ok(perms.has('admin:dashboard'));
      assert.ok(perms.has('admin:students'));
      assert.ok(perms.has('admin:academics'));
      assert.ok(perms.has('admin:finance'));
      assert.ok(perms.has('admin:admissions'));
      assert.ok(perms.has('admin:lecturers'));
      assert.ok(perms.has('admin:hr'));
      assert.ok(perms.has('admin:inventory'));
      assert.ok(perms.has('admin:library'));
      assert.ok(perms.has('admin:reports'));
    });

    it('returns restricted permissions for accountant view', () => {
      const perms = getUserPermissions({ role: 'accountant', isAccountantView: true });
      assert.ok(perms.has('portal:accountant'));
      assert.ok(perms.has('accountant:finance'));
      assert.ok(perms.has('accountant:payroll'));
      assert.ok(perms.has('accountant:overview'));
      // Accountant must NOT have admin admissions, academics, or library admin
      assert.ok(!perms.has('admin:admissions'));
      assert.ok(!perms.has('admin:academics'));
      assert.ok(!perms.has('admin:library'));
      assert.ok(!perms.has('librarian:library'));
    });

    it('returns restricted permissions for librarian view', () => {
      const perms = getUserPermissions({ role: 'librarian', isLibrarianView: true });
      assert.ok(perms.has('portal:librarian'));
      assert.ok(perms.has('librarian:library'));
      assert.ok(perms.has('librarian:overview'));
      // Librarian must NOT have finance or payroll permissions
      assert.ok(!perms.has('admin:finance'));
      assert.ok(!perms.has('accountant:finance'));
      assert.ok(!perms.has('accountant:payroll'));
    });
  });

  describe('hasPermission & hasAccessToItem', () => {
    it('denies access when unauthenticated or loading', () => {
      const context: UserNavContext = { isLoading: true, role: 'student' };
      assert.equal(hasPermission(context, 'student:home'), false);
      const studentItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'dashboard' && i.portal?.includes('student'))!;
      assert.equal(hasAccessToItem(context, studentItem), false);
    });

    it('allows access to authorized items only', () => {
      const studentContext: UserNavContext = { role: 'student' };
      const lecturerContext: UserNavContext = { role: 'lecturer' };
      const adminContext: UserNavContext = { role: 'admin' };

      const studentCoursesItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'materials' && i.portal?.includes('student'))!;
      const lecturerAttendanceItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'attendance' && i.portal?.includes('lecturer'))!;
      const adminFinanceItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'finances' && i.portal?.includes('admin'))!;

      assert.equal(hasAccessToItem(studentContext, studentCoursesItem), true);
      assert.equal(hasAccessToItem(studentContext, lecturerAttendanceItem), false);
      assert.equal(hasAccessToItem(studentContext, adminFinanceItem), false);

      assert.equal(hasAccessToItem(lecturerContext, studentCoursesItem), false);
      assert.equal(hasAccessToItem(lecturerContext, lecturerAttendanceItem), true);
      assert.equal(hasAccessToItem(lecturerContext, adminFinanceItem), false);

      assert.equal(hasAccessToItem(adminContext, adminFinanceItem), true);
      assert.equal(hasAccessToItem(adminContext, lecturerAttendanceItem), false);
    });
  });

  describe('getAuthorizedNavItems, getPrimaryNavItems, getSecondaryNavItems', () => {
    it('returns exactly the student tabs (Home, Courses, Results as primary; Fees, Units, Consultation, Library as secondary)', () => {
      const studentContext: UserNavContext = { role: 'student' };
      const authorized = getAuthorizedNavItems(studentContext);
      const primary = getPrimaryNavItems(studentContext);
      const secondary = getSecondaryNavItems(studentContext);

      assert.equal(primary.length, 3);
      assert.deepEqual(primary.map(i => i.label), ['Home', 'Courses', 'Results']);

      assert.equal(secondary.length, 4);
      assert.deepEqual(secondary.map(i => i.label), ['Fees', 'Units', 'Consultation', 'Library']);

      assert.equal(authorized.length, 7);
      // Ensure no admin tabs or lecturer tabs leaked in
      assert.ok(!authorized.some(i => i.label === 'Attendance' || i.label === 'Marks' || i.label === 'Admissions'));
    });

    it('returns exactly the lecturer tabs (Home, Classes, Attendance, Marks as primary; Students, Timetable, Library as secondary)', () => {
      const lecturerContext: UserNavContext = { role: 'lecturer' };
      const authorized = getAuthorizedNavItems(lecturerContext);
      const primary = getPrimaryNavItems(lecturerContext);
      const secondary = getSecondaryNavItems(lecturerContext);

      assert.equal(primary.length, 4);
      assert.deepEqual(primary.map(i => i.label), ['Home', 'Classes', 'Attendance', 'Marks']);

      assert.equal(secondary.length, 3);
      assert.deepEqual(secondary.map(i => i.label), ['Students', 'Timetable', 'Library']);

      assert.equal(authorized.length, 7);
      // Ensure no student fee statements or admin modules leaked in
      assert.ok(!authorized.some(i => i.label === 'Fees' || i.label === 'Admissions' || i.label === 'HR'));
    });

    it('returns exactly the admin tabs (Dashboard, Students, Academics, Finance as primary; Admissions, Consultations, Applications, Enrollment, Lecturers, HR, Inventory, Library, Reports as secondary)', () => {
      const adminContext: UserNavContext = { role: 'admin' };
      const authorized = getAuthorizedNavItems(adminContext);
      const primary = getPrimaryNavItems(adminContext);
      const secondary = getSecondaryNavItems(adminContext);

      assert.equal(primary.length, 4);
      assert.deepEqual(primary.map(i => i.label), ['Dashboard', 'Students', 'Academics', 'Finance']);

      assert.equal(secondary.length, 9);
      assert.deepEqual(secondary.map(i => i.label), [
        'Admissions',
        'Consultations',
        'Applications',
        'Enrollment',
        'Lecturers',
        'HR',
        'Inventory',
        'Library',
        'Reports',
      ]);
    });

    it('returns restricted tabs for Accountant without unauthorized modules', () => {
      const accountantContext: UserNavContext = { role: 'accountant' };
      const authorized = getAuthorizedNavItems(accountantContext);
      const primary = getPrimaryNavItems(accountantContext);
      const secondary = getSecondaryNavItems(accountantContext);

      assert.deepEqual(primary.map(i => i.label), ['Finance', 'HR & Payroll', 'Dashboard']);
      assert.equal(secondary.length, 0); // All authorized accountant items fit in primary
      // Make sure unauthorized items are NOT present
      assert.ok(!authorized.some(i => i.label === 'Admissions' || i.label === 'Students' || i.label === 'Academics'));
    });

    it('returns restricted tabs for Librarian without unauthorized modules', () => {
      const librarianContext: UserNavContext = { role: 'librarian' };
      const authorized = getAuthorizedNavItems(librarianContext);
      const primary = getPrimaryNavItems(librarianContext);

      assert.deepEqual(primary.map(i => i.label), ['Library', 'Dashboard']);
      // Make sure finance, admissions, hr are NOT present
      assert.ok(!authorized.some(i => i.label === 'Finance' || i.label === 'Admissions' || i.label === 'HR'));
    });

    it('returns empty lists while loading or when logged out', () => {
      assert.equal(getAuthorizedNavItems({ isLoading: true, role: 'admin' }).length, 0);
      assert.equal(getPrimaryNavItems({ isLoading: true, role: 'admin' }).length, 0);
      assert.equal(getSecondaryNavItems({ isLoading: true, role: 'admin' }).length, 0);

      assert.equal(getAuthorizedNavItems({ role: null }).length, 0);
      assert.equal(getPrimaryNavItems({ role: null }).length, 0);
      assert.equal(getSecondaryNavItems({ role: null }).length, 0);
    });
  });

  describe('isItemActive (nested routes & tab matching)', () => {
    it('matches student tabs accurately', () => {
      const studentCoursesItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'materials' && i.portal?.includes('student'))!;
      assert.equal(isItemActive(studentCoursesItem, '/courses', 'materials'), true);
      assert.equal(isItemActive(studentCoursesItem, '/', 'dashboard'), false);
    });

    it('matches nested admin routes and subTabs', () => {
      const adminStudentsItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'students' && i.portal?.includes('admin'))!;
      const adminConsultationsItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'consultation' && i.portal?.includes('admin'))!;
      const adminAdmissionsHQItem = MASTER_NAVIGATION_ITEMS.find(i => i.id === 'admissions' && i.portal?.includes('admin'))!;

      // When on /admin/admissions/applicants
      assert.equal(isItemActive(adminStudentsItem, '/admin/admissions/applicants', 'admissions', 'applicants'), true);
      assert.equal(isItemActive(adminConsultationsItem, '/admin/admissions/applicants', 'admissions', 'applicants'), false);
      assert.equal(isItemActive(adminAdmissionsHQItem, '/admin/admissions/applicants', 'admissions', 'applicants'), false);

      // When on /admin/admissions/consultations
      assert.equal(isItemActive(adminConsultationsItem, '/admin/admissions/consultations', 'admissions', 'consultations'), true);
      assert.equal(isItemActive(adminStudentsItem, '/admin/admissions/consultations', 'admissions', 'consultations'), false);

      // When on /admin/admissions/dashboard
      assert.equal(isItemActive(adminAdmissionsHQItem, '/admin/admissions/dashboard', 'admissions', 'dashboard'), true);
    });
  });

  describe('Logout and Login Transitions', () => {
    it('dynamically adapts when switching roles', () => {
      // Step 1: Student is logged in
      let userContext: UserNavContext = { role: 'student' };
      let primary = getPrimaryNavItems(userContext);
      assert.equal(primary[0].label, 'Home');
      assert.equal(primary[1].label, 'Courses');
      assert.equal(primary[2].label, 'Results');

      // Step 2: User logs out
      userContext = { role: null };
      assert.equal(getAuthorizedNavItems(userContext).length, 0);

      // Step 3: Admin logs in
      userContext = { role: 'admin' };
      primary = getPrimaryNavItems(userContext);
      assert.equal(primary[0].label, 'Dashboard');
      assert.equal(primary[1].label, 'Students');
      assert.equal(primary[2].label, 'Academics');
      assert.equal(primary[3].label, 'Finance');

      // Step 4: Admin logs out and Lecturer logs in
      userContext = { role: 'lecturer' };
      primary = getPrimaryNavItems(userContext);
      assert.equal(primary[0].label, 'Home');
      assert.equal(primary[1].label, 'Classes');
      assert.equal(primary[2].label, 'Attendance');
      assert.equal(primary[3].label, 'Marks');
    });
  });
});
