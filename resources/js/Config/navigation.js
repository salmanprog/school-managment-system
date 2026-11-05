import {
    LayoutDashboard,
    School,
    CalendarRange,
    Layers,
    BookOpen,
    ClipboardList,
    Users,
    GraduationCap,
    UserCog,
    ClipboardCheck,
    Wallet,
    FileText,
    BarChart3,
    Settings,
} from 'lucide-react';

export const navigation = [
    {
        title: 'Dashboard',
        collapsible: false,
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard.view' },
        ],
    },
    {
        title: 'School Setup',
        items: [
            { name: 'School Profile', href: '/admin/school-profile', icon: School, permission: 'school.manage' },
            { name: 'Academic Sessions', href: '/admin/academic-sessions', icon: CalendarRange, permission: 'sessions.manage' },
            { name: 'Subjects', href: '/admin/subjects', icon: BookOpen, permission: 'subjects.manage' },
            { name: 'Classes', href: '/admin/classes', icon: Layers, permission: 'classes.manage' },
        ],
    },
    {
        title: 'Student Management',
        items: [
            { name: 'Student Admission', href: '/admin/admissions', icon: ClipboardList, permission: 'admissions.view' },
            { name: 'All Students', href: '/admin/students', icon: Users, permission: 'students.view' },
            { name: 'Enrollments', href: '/admin/enrollments', icon: ClipboardList, permission: 'students.view' },
            { name: 'Promotions', href: '/admin/promotions', icon: GraduationCap, permission: 'students.promote' },
        ],
    },
    {
        title: 'Teacher Management',
        items: [
            { name: 'All Teachers', href: '/admin/teachers', icon: UserCog, permission: 'teachers.manage' },
            { name: 'Assignments', href: '/admin/teacher-assignments', icon: ClipboardList, permission: 'teachers.manage' },
        ],
    },
    {
        title: 'Attendance',
        items: [
            { name: 'Mark Attendance', href: '/admin/attendance/mark', icon: ClipboardCheck, permission: 'attendance.mark' },
            { name: 'Records', href: '/admin/attendance', icon: ClipboardList, permission: 'attendance.view' },
            { name: 'Reports', href: '/admin/attendance/reports', icon: BarChart3, permission: 'attendance.view' },
        ],
    },
    {
        title: 'Fees',
        items: [
            // Simple flow: Setup → Collect → Receipts (invoices stay behind Collect)
            { name: 'Fee Setup', href: '/admin/fees/structures', icon: Wallet, permission: 'fees.manage' },
            { name: 'Collect Fees', href: '/admin/fees/collect', icon: Wallet, permission: 'fees.collect-payment' },
            { name: 'Fee Records', href: '/admin/fees/receipts', icon: FileText, permission: 'fees.view' },
        ],
    },
    {
        title: 'Examinations',
        items: [
            { name: 'Exam Types', href: '/admin/exam-types', icon: Layers, permission: 'exams.manage' },
            { name: 'Exams', href: '/admin/exams', icon: FileText, permission: 'exams.manage' },
            { name: 'Schedules', href: '/admin/exams/schedules', icon: CalendarRange, permission: 'exams.manage' },
            { name: 'Marks Entry', href: '/admin/exams/marks', icon: ClipboardCheck, permission: 'exams.enter-marks' },
            { name: 'Results', href: '/admin/exams/results', icon: BarChart3, permission: 'exams.view' },
            { name: 'Report Cards', href: '/admin/exams/report-cards', icon: FileText, permission: 'exams.view' },
        ],
    },
    {
        title: 'Reports',
        items: [
            { name: 'Student Reports', href: '/admin/reports/students', icon: BarChart3, permission: 'reports.view' },
            { name: 'Fee Collection', href: '/admin/reports/fee-collection', icon: BarChart3, permission: 'reports.view' },
            { name: 'Outstanding Fees', href: '/admin/reports/outstanding-fees', icon: BarChart3, permission: 'reports.view' },
            { name: 'Examination Reports', href: '/admin/reports/examinations', icon: BarChart3, permission: 'reports.view' },
        ],
    },
    {
        title: 'Settings',
        items: [
            { name: 'General Settings', href: '/admin/settings', icon: Settings, permission: 'settings.manage' },
            { name: 'Users', href: '/admin/users', icon: Users, permission: 'users.manage' },
            { name: 'Roles', href: '/admin/roles', icon: UserCog, permission: 'roles.manage' },
            { name: 'Permissions', href: '/admin/permissions', icon: ClipboardList, permission: 'roles.manage' },
        ],
    },
];
