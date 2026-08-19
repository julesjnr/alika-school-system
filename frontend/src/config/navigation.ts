import React from 'react';
import {
  Home, Sliders, Award, BookOpen, CreditCard, Landmark, DollarSign,
  CheckSquare, GraduationCap, Users, User, Clock, PhoneCall,
  Library, School, Briefcase, Activity, FileText, CheckCircle2,
  Settings, LogOut, Menu
} from 'lucide-react';

export type PortalRole =
  | 'student'
  | 'lecturer'
  | 'admin'
  | 'super_admin'
  | 'admissions_officer'
  | 'accountant'
  | 'librarian'
  | 'hr'
  | 'hr_officer'
  | 'hr_manager'
  | 'faculty';

export type NavPermission =
  // Student permissions
  | 'portal:student'
  | 'student:home'
  | 'student:courses'
  | 'student:results'
  | 'student:fees'
  | 'student:units'
  | 'student:consultation'
  | 'student:library'
  // Lecturer permissions
  | 'portal:lecturer'
  | 'lecturer:home'
  | 'lecturer:classes'
  | 'lecturer:attendance'
  | 'lecturer:marks'
  | 'lecturer:students'
  | 'lecturer:timetable'
  | 'lecturer:library'
  // Admin permissions
  | 'portal:admin'
  | 'admin:dashboard'
  | 'admin:students'
  | 'admin:academics'
  | 'admin:finance'
  | 'admin:admissions'
  | 'admin:lecturers'
  | 'admin:hr'
  | 'admin:inventory'
  | 'admin:library'
  | 'admin:reports'
  // Accountant permissions
  | 'portal:accountant'
  | 'accountant:finance'
  | 'accountant:payroll'
  | 'accountant:overview'
  // Librarian permissions
  | 'portal:librarian'
  | 'librarian:library'
  | 'librarian:overview'
  // Admissions Officer permissions
  | 'portal:admissions'
  | 'admissions:dashboard'
  | 'admissions:applicants'
  | 'admissions:applications'
  | 'admissions:consultations'
  | 'admissions:enrollment'
  // HR Officer permissions
  | 'portal:hr'
  | 'hr:payroll'
  | 'hr:staff'
  | 'hr:overview';

export interface UserNavContext {
  role?: string | null;
  portal?: string | null;
  permissions?: string[];
  isAccountantView?: boolean;
  isLibrarianView?: boolean;
  isLoading?: boolean;
}

export interface NavigationItem {
  id: string;
  label: string;
  route?: string;
  tabId: string;
  subTabId?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: NavPermission | NavPermission[];
  portal?: PortalRole | PortalRole[];
  primary: boolean;
  badge?: string | number;
  badgeColor?: string;
  nestedRoutes?: string[];
  actionType?: 'tab' | 'route' | 'profile' | 'settings' | 'logout';
}

/**
 * Normalizes any incoming role string or alias to a canonical portal role.
 */
export function normalizePortalRole(role?: string | null): PortalRole | null {
  if (!role) return null;
  const clean = role.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (clean === 'super_admin' || clean === 'superadmin' || clean === 'admin') return 'admin';
  if (clean === 'admissions' || clean === 'admissions_officer') return 'admissions_officer';
  if (clean === 'accountant' || clean === 'finance' || clean === 'finance_officer') return 'accountant';
  if (clean === 'faculty' || clean === 'lecturer') return 'lecturer';
  if (clean === 'student') return 'student';
  if (clean === 'librarian') return 'librarian';
  if (clean === 'hr' || clean === 'hr_officer' || clean === 'hr_manager') return 'hr';
  return clean as PortalRole;
}

/**
 * Derives the active set of permissions based on the authenticated user's context.
 */
export function getUserPermissions(context: UserNavContext): Set<string> {
  const permissions = new Set<string>();
  if (context.isLoading || !context.role) {
    return permissions;
  }

  // Add explicit permissions if provided
  if (context.permissions && context.permissions.length > 0) {
    context.permissions.forEach(p => permissions.add(p));
  }

  const role = normalizePortalRole(context.role);

  // Role-based permission assignment matching the school management portals:
  if (role === 'student') {
    permissions.add('portal:student');
    permissions.add('student:home');
    permissions.add('student:courses');
    permissions.add('student:results');
    permissions.add('student:fees');
    permissions.add('student:units');
    permissions.add('student:consultation');
    permissions.add('student:library');
  } else if (role === 'lecturer') {
    permissions.add('portal:lecturer');
    permissions.add('lecturer:home');
    permissions.add('lecturer:classes');
    permissions.add('lecturer:attendance');
    permissions.add('lecturer:marks');
    permissions.add('lecturer:students');
    permissions.add('lecturer:timetable');
    permissions.add('lecturer:library');
  } else if (role === 'accountant' || context.isAccountantView) {
    permissions.add('portal:accountant');
    permissions.add('accountant:finance');
    permissions.add('accountant:payroll');
    permissions.add('accountant:overview');
  } else if (role === 'librarian' || context.isLibrarianView) {
    permissions.add('portal:librarian');
    permissions.add('librarian:library');
    permissions.add('librarian:overview');
  } else if (role === 'admissions_officer') {
    permissions.add('portal:admissions');
    permissions.add('admissions:dashboard');
    permissions.add('admissions:applicants');
    permissions.add('admissions:applications');
    permissions.add('admissions:consultations');
    permissions.add('admissions:enrollment');
  } else if (role === 'hr') {
    permissions.add('portal:hr');
    permissions.add('hr:payroll');
    permissions.add('hr:staff');
    permissions.add('hr:overview');
  } else if (role === 'admin') {
    permissions.add('portal:admin');
    permissions.add('admin:dashboard');
    permissions.add('admin:students');
    permissions.add('admin:academics');
    permissions.add('admin:finance');
    permissions.add('admin:admissions');
    permissions.add('admin:lecturers');
    permissions.add('admin:hr');
    permissions.add('admin:inventory');
    permissions.add('admin:library');
    permissions.add('admin:reports');
  }

  return permissions;
}

/**
 * Checks whether the user context satisfies the required permission(s).
 */
export function hasPermission(
  context: UserNavContext,
  requiredPermission?: NavPermission | NavPermission[]
): boolean {
  if (!requiredPermission) return true;
  const userPermissions = getUserPermissions(context);
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some(p => userPermissions.has(p));
  }
  return userPermissions.has(requiredPermission);
}

/**
 * Master Navigation Registry: Single declarative configuration of all portal modules.
 */
export const MASTER_NAVIGATION_ITEMS: NavigationItem[] = [
  // ================= STUDENT MODULES =================
  {
    id: 'dashboard',
    label: 'Home',
    tabId: 'dashboard',
    route: '/',
    icon: Home,
    primary: true,
    portal: ['student'],
    permission: 'student:home',
    nestedRoutes: ['/', '/dashboard'],
  },
  {
    id: 'materials',
    label: 'Courses',
    tabId: 'materials',
    route: '/courses',
    icon: BookOpen,
    primary: true,
    portal: ['student'],
    permission: 'student:courses',
    nestedRoutes: ['/courses', '/materials'],
  },
  {
    id: 'grades',
    label: 'Results',
    tabId: 'grades',
    route: '/grades',
    icon: Award,
    primary: true,
    portal: ['student'],
    permission: 'student:results',
    nestedRoutes: ['/grades', '/results', '/academics'],
  },
  {
    id: 'financials',
    label: 'Fees',
    tabId: 'financials',
    route: '/fees',
    icon: CreditCard,
    primary: false,
    portal: ['student'],
    permission: 'student:fees',
    nestedRoutes: ['/fees', '/financials', '/finance'],
  },
  {
    id: 'units',
    label: 'Units',
    tabId: 'units',
    route: '/units',
    icon: CheckSquare,
    primary: false,
    portal: ['student'],
    permission: 'student:units',
    nestedRoutes: ['/units', '/registration', '/curriculum'],
  },
  {
    id: 'officeHours',
    label: 'Consultation',
    tabId: 'officeHours',
    route: '/consultation',
    icon: PhoneCall,
    primary: false,
    portal: ['student'],
    permission: 'student:consultation',
    nestedRoutes: ['/consultation', '/office-hours', '/officeHours'],
  },
  {
    id: 'library',
    label: 'Library',
    tabId: 'library',
    route: '/library',
    icon: Library,
    primary: false,
    portal: ['student'],
    permission: 'student:library',
    nestedRoutes: ['/library'],
  },

  // ================= LECTURER MODULES =================
  {
    id: 'workstation',
    label: 'Home',
    tabId: 'workstation',
    route: '/',
    icon: Home,
    primary: true,
    portal: ['lecturer', 'faculty'],
    permission: 'lecturer:home',
    nestedRoutes: ['/', '/workstation', '/dashboard'],
  },
  {
    id: 'classlist',
    label: 'Classes',
    tabId: 'classlist',
    route: '/classes',
    icon: BookOpen,
    primary: true,
    portal: ['lecturer', 'faculty'],
    permission: 'lecturer:classes',
    nestedRoutes: ['/classes', '/classlist'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    tabId: 'attendance',
    route: '/attendance',
    icon: CheckSquare,
    primary: true,
    portal: ['lecturer', 'faculty'],
    permission: 'lecturer:attendance',
    nestedRoutes: ['/attendance'],
  },
  {
    id: 'grading',
    label: 'Marks',
    tabId: 'grading',
    route: '/marks',
    icon: Award,
    primary: true,
    portal: ['lecturer', 'faculty'],
    permission: 'lecturer:marks',
    nestedRoutes: ['/marks', '/grading', '/grades'],
  },
  {
    id: 'lookup',
    label: 'Students',
    tabId: 'lookup',
    route: '/students',
    icon: GraduationCap,
    primary: false,
    portal: ['lecturer', 'faculty'],
    permission: 'lecturer:students',
    nestedRoutes: ['/students', '/lookup'],
  },
  {
    id: 'schedule',
    label: 'Timetable',
    tabId: 'schedule',
    route: '/timetable',
    icon: Clock,
    primary: false,
    portal: ['lecturer', 'faculty'],
    permission: 'lecturer:timetable',
    nestedRoutes: ['/timetable', '/schedule', '/consultation'],
  },
  {
    id: 'books',
    label: 'Library',
    tabId: 'books',
    route: '/books',
    icon: Library,
    primary: false,
    portal: ['lecturer', 'faculty'],
    permission: 'lecturer:library',
    nestedRoutes: ['/books', '/library'],
  },

  // ================= ADMIN / SUPER ADMIN MODULES =================
  {
    id: 'overview',
    label: 'Dashboard',
    tabId: 'overview',
    route: '/admin',
    icon: Sliders,
    primary: true,
    portal: ['admin', 'super_admin'],
    permission: 'admin:dashboard',
    nestedRoutes: ['/admin', '/admin/overview', '/'],
  },
  {
    id: 'students',
    label: 'Students',
    tabId: 'admissions',
    subTabId: 'applicants',
    route: '/admin/admissions/applicants',
    icon: GraduationCap,
    primary: true,
    portal: ['admin', 'super_admin'],
    permission: 'admin:students',
    nestedRoutes: ['/admin/admissions/applicants', '/admin/students'],
  },
  {
    id: 'academics',
    label: 'Academics',
    tabId: 'academics',
    route: '/admin/academics',
    icon: Award,
    primary: true,
    portal: ['admin', 'super_admin'],
    permission: 'admin:academics',
    nestedRoutes: ['/admin/academics'],
  },
  {
    id: 'finances',
    label: 'Finance',
    tabId: 'finances',
    route: '/admin/finances',
    icon: Landmark,
    primary: true,
    portal: ['admin', 'super_admin'],
    permission: 'admin:finance',
    nestedRoutes: ['/admin/finances', '/admin/finance'],
  },
  {
    id: 'admissions',
    label: 'Admissions',
    tabId: 'admissions',
    subTabId: 'dashboard',
    route: '/admin/admissions/dashboard',
    icon: School,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:admissions',
    nestedRoutes: ['/admin/admissions', '/admin/admissions/dashboard'],
  },
  {
    id: 'consultation',
    label: 'Consultations',
    tabId: 'admissions',
    subTabId: 'consultations',
    route: '/admin/admissions/consultations',
    icon: PhoneCall,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:admissions',
    nestedRoutes: ['/admin/admissions/consultations'],
  },
  {
    id: 'applications',
    label: 'Applications',
    tabId: 'admissions',
    subTabId: 'applications',
    route: '/admin/admissions/applications',
    icon: FileText,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:admissions',
    nestedRoutes: ['/admin/admissions/applications'],
  },
  {
    id: 'enrollment',
    label: 'Enrollment',
    tabId: 'admissions',
    subTabId: 'enrollment',
    route: '/admin/admissions/enrollment',
    icon: CheckCircle2,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:admissions',
    nestedRoutes: ['/admin/admissions/enrollment', '/admin/admissions/enrolment'],
  },
  {
    id: 'roles',
    label: 'Lecturers',
    tabId: 'roles',
    route: '/admin/roles',
    icon: Users,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:lecturers',
    nestedRoutes: ['/admin/roles', '/admin/lecturers'],
  },
  {
    id: 'payroll',
    label: 'HR',
    tabId: 'payroll',
    route: '/admin/payroll',
    icon: Briefcase,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:hr',
    nestedRoutes: ['/admin/payroll', '/admin/hr'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    tabId: 'inventory',
    route: '/admin/inventory',
    icon: Activity,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:inventory',
    nestedRoutes: ['/admin/inventory'],
  },
  {
    id: 'library',
    label: 'Library',
    tabId: 'library',
    route: '/admin/library',
    icon: Library,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:library',
    nestedRoutes: ['/admin/library'],
  },
  {
    id: 'diagnostics',
    label: 'Reports',
    tabId: 'diagnostics',
    route: '/admin/diagnostics',
    icon: FileText,
    primary: false,
    portal: ['admin', 'super_admin'],
    permission: 'admin:reports',
    nestedRoutes: ['/admin/diagnostics', '/admin/reports'],
  },

  // ================= ACCOUNTANT MODULES =================
  {
    id: 'finances',
    label: 'Finance',
    tabId: 'finances',
    route: '/admin/finances',
    icon: Landmark,
    primary: true,
    portal: ['accountant'],
    permission: 'accountant:finance',
    nestedRoutes: ['/admin/finances', '/admin/finance'],
  },
  {
    id: 'payroll',
    label: 'HR & Payroll',
    tabId: 'payroll',
    route: '/admin/payroll',
    icon: DollarSign,
    primary: true,
    portal: ['accountant'],
    permission: 'accountant:payroll',
    nestedRoutes: ['/admin/payroll', '/admin/hr'],
  },
  {
    id: 'overview',
    label: 'Dashboard',
    tabId: 'overview',
    route: '/admin',
    icon: Sliders,
    primary: true,
    portal: ['accountant'],
    permission: 'accountant:overview',
    nestedRoutes: ['/admin', '/admin/overview'],
  },

  // ================= LIBRARIAN MODULES =================
  {
    id: 'library',
    label: 'Library',
    tabId: 'library',
    route: '/admin/library',
    icon: Library,
    primary: true,
    portal: ['librarian'],
    permission: 'librarian:library',
    nestedRoutes: ['/admin/library'],
  },
  {
    id: 'overview',
    label: 'Dashboard',
    tabId: 'overview',
    route: '/admin',
    icon: Sliders,
    primary: true,
    portal: ['librarian'],
    permission: 'librarian:overview',
    nestedRoutes: ['/admin', '/admin/overview'],
  },

  // ================= ADMISSIONS OFFICER MODULES =================
  {
    id: 'admissions',
    label: 'Admissions',
    tabId: 'admissions',
    subTabId: 'dashboard',
    route: '/admin/admissions/dashboard',
    icon: School,
    primary: true,
    portal: ['admissions_officer'],
    permission: 'admissions:dashboard',
    nestedRoutes: ['/admin/admissions', '/admin/admissions/dashboard'],
  },
  {
    id: 'applicants',
    label: 'Applicants',
    tabId: 'admissions',
    subTabId: 'applicants',
    route: '/admin/admissions/applicants',
    icon: GraduationCap,
    primary: true,
    portal: ['admissions_officer'],
    permission: 'admissions:applicants',
    nestedRoutes: ['/admin/admissions/applicants'],
  },
  {
    id: 'applications',
    label: 'Applications',
    tabId: 'admissions',
    subTabId: 'applications',
    route: '/admin/admissions/applications',
    icon: FileText,
    primary: true,
    portal: ['admissions_officer'],
    permission: 'admissions:applications',
    nestedRoutes: ['/admin/admissions/applications'],
  },
  {
    id: 'consultation',
    label: 'Consultations',
    tabId: 'admissions',
    subTabId: 'consultations',
    route: '/admin/admissions/consultations',
    icon: PhoneCall,
    primary: true,
    portal: ['admissions_officer'],
    permission: 'admissions:consultations',
    nestedRoutes: ['/admin/admissions/consultations'],
  },
  {
    id: 'enrollment',
    label: 'Enrollment',
    tabId: 'admissions',
    subTabId: 'enrollment',
    route: '/admin/admissions/enrollment',
    icon: CheckCircle2,
    primary: false,
    portal: ['admissions_officer'],
    permission: 'admissions:enrollment',
    nestedRoutes: ['/admin/admissions/enrollment', '/admin/admissions/enrolment'],
  },
  {
    id: 'overview',
    label: 'Dashboard',
    tabId: 'overview',
    route: '/admin',
    icon: Sliders,
    primary: false,
    portal: ['admissions_officer'],
    permission: 'portal:admissions',
    nestedRoutes: ['/admin'],
  },

  // ================= HR OFFICER MODULES =================
  {
    id: 'payroll',
    label: 'HR & Payroll',
    tabId: 'payroll',
    route: '/admin/payroll',
    icon: Briefcase,
    primary: true,
    portal: ['hr', 'hr_officer', 'hr_manager'],
    permission: 'hr:payroll',
    nestedRoutes: ['/admin/payroll'],
  },
  {
    id: 'roles',
    label: 'Staff Roles',
    tabId: 'roles',
    route: '/admin/roles',
    icon: Users,
    primary: true,
    portal: ['hr', 'hr_officer', 'hr_manager'],
    permission: 'hr:staff',
    nestedRoutes: ['/admin/roles'],
  },
  {
    id: 'overview',
    label: 'Dashboard',
    tabId: 'overview',
    route: '/admin',
    icon: Sliders,
    primary: true,
    portal: ['hr', 'hr_officer', 'hr_manager'],
    permission: 'hr:overview',
    nestedRoutes: ['/admin'],
  },
];

/**
 * Checks whether an item is accessible in the given user context.
 */
export function hasAccessToItem(context: UserNavContext, item: NavigationItem): boolean {
  if (context.isLoading || !context.role) {
    return false;
  }
  const normRole = normalizePortalRole(context.role);
  if (!normRole) return false;

  // Check portal match if defined
  if (item.portal) {
    const portals = Array.isArray(item.portal) ? item.portal : [item.portal];
    const normalizedPortals = portals.map(normalizePortalRole);
    if (!normalizedPortals.includes(normRole)) {
      return false;
    }
  }

  // Check permission match if defined
  if (item.permission) {
    return hasPermission(context, item.permission);
  }

  return true;
}

/**
 * Returns all navigation items authorized for the user context.
 */
export function getAuthorizedNavItems(context: UserNavContext): NavigationItem[] {
  if (context.isLoading || !context.role) return [];
  return MASTER_NAVIGATION_ITEMS.filter(item => hasAccessToItem(context, item));
}

/**
 * Returns primary navigation tabs for the bottom navigation bar.
 */
export function getPrimaryNavItems(context: UserNavContext): NavigationItem[] {
  if (context.isLoading || !context.role) return [];
  return getAuthorizedNavItems(context).filter(item => item.primary);
}

/**
 * Returns secondary navigation items to be placed inside the "More" drawer.
 */
export function getSecondaryNavItems(context: UserNavContext): NavigationItem[] {
  if (context.isLoading || !context.role) return [];
  return getAuthorizedNavItems(context).filter(item => !item.primary);
}

/**
 * Evaluates whether a navigation item is active given the current route and active tab state.
 */
export function isItemActive(
  item: NavigationItem,
  currentPath?: string,
  activeTab?: string,
  subTab?: string
): boolean {
  // 1. If item has a specific subTabId
  if (item.subTabId) {
    if (subTab) {
      return item.tabId === activeTab && item.subTabId === subTab;
    }
    if (currentPath && item.route) {
      const cleanPath = currentPath.split('?')[0].replace(/\/$/, '') || '/';
      const cleanRoute = item.route.split('?')[0].replace(/\/$/, '') || '/';
      if (cleanPath === cleanRoute) return true;
      if (item.nestedRoutes) {
        return item.nestedRoutes.some(nr => cleanPath === nr.split('?')[0].replace(/\/$/, ''));
      }
    }
    return false;
  }

  // 2. If item is the main Admissions dashboard/HQ module
  if (item.tabId === 'admissions' && item.id === 'admissions') {
    if (subTab && subTab !== 'dashboard') return false;
    if (currentPath) {
      const cleanPath = currentPath.split('?')[0].replace(/\/$/, '') || '/';
      if (cleanPath === '/admin/admissions' || cleanPath === '/admin/admissions/dashboard') return true;
      if (cleanPath.startsWith('/admin/admissions/')) return false;
    }
    return activeTab === 'admissions';
  }

  // 3. If a specific subTab is active on the portal, generic non-matching tab items shouldn't conflict
  if (subTab && activeTab === item.tabId && item.id !== activeTab) {
    return false;
  }

  // 4. Tab ID direct match
  if (activeTab && (item.tabId === activeTab || item.id === activeTab)) {
    return true;
  }

  // 5. Route direct or exact nested route match
  if (currentPath) {
    const cleanPath = currentPath.split('?')[0].replace(/\/$/, '') || '/';
    if (item.route) {
      const cleanRoute = item.route.split('?')[0].replace(/\/$/, '') || '/';
      if (cleanPath === cleanRoute) return true;
    }
    if (item.nestedRoutes && item.nestedRoutes.length > 0) {
      for (const nr of item.nestedRoutes) {
        const cleanNr = nr.split('?')[0].replace(/\/$/, '') || '/';
        if (cleanPath === cleanNr) {
          return true;
        }
      }
    }
  }

  return false;
}
