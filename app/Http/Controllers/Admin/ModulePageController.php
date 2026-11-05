<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ModulePageController extends Controller
{
    public function __invoke(): Response
    {
        $route = request()->route()?->getName() ?? 'admin.module';

        $map = [
            'admin.school-profile' => ['School Profile', 'School Setup', 'Phase 2'],
            'admin.academic-sessions.index' => ['Academic Sessions', 'School Setup', 'Phase 2'],
            'admin.classes.index' => ['Classes', 'School Setup', 'Phase 2'],
            'admin.subjects.index' => ['Subjects', 'School Setup', 'Phase 2'],
            'admin.admissions.create' => ['New Admission', 'Admissions', 'Phase 3'],
            'admin.admissions.index' => ['Admission Applications', 'Admissions', 'Phase 3'],
            'admin.students.index' => ['All Students', 'Student Management', 'Phase 4'],
            'admin.students.create' => ['Add Student', 'Student Management', 'Phase 4'],
            'admin.enrollments.index' => ['Student Enrollments', 'Student Management', 'Phase 4'],
            'admin.promotions.index' => ['Student Promotions', 'Student Management', 'Phase 4'],
            'admin.teachers.index' => ['All Teachers', 'Teacher Management', 'Phase 5'],
            'admin.teachers.create' => ['Add Teacher', 'Teacher Management', 'Phase 5'],
            'admin.teacher-assignments.index' => ['Teacher Assignments', 'Teacher Management', 'Phase 5'],
            'admin.attendance.mark' => ['Mark Attendance', 'Attendance', 'Phase 6'],
            'admin.attendance.index' => ['Attendance Records', 'Attendance', 'Phase 6'],
            'admin.attendance.reports' => ['Attendance Reports', 'Attendance', 'Phase 6'],
            'admin.fees.categories' => ['Fee Categories', 'Fees Management', 'Phase 7'],
            'admin.fees.structures' => ['Fee Structures', 'Fees Management', 'Phase 7'],
            'admin.fees.generate' => ['Generate Invoices', 'Fees Management', 'Phase 7'],
            'admin.fees.invoices' => ['All Invoices', 'Fees Management', 'Phase 7'],
            'admin.fees.collect' => ['Collect Payments', 'Fees Management', 'Phase 7'],
            'admin.fees.pending' => ['Pending Fees', 'Fees Management', 'Phase 7'],
            'admin.fees.receipts' => ['Payment Receipts', 'Fees Management', 'Phase 7'],
            'admin.exams.index' => ['Exam Management', 'Examinations', 'Phase 8'],
            'admin.exams.schedules' => ['Exam Schedules', 'Examinations', 'Phase 8'],
            'admin.exams.marks' => ['Marks Entry', 'Examinations', 'Phase 8'],
            'admin.exams.results' => ['Results', 'Examinations', 'Phase 8'],
            'admin.exams.report-cards' => ['Report Cards', 'Examinations', 'Phase 8'],
            'admin.reports.students' => ['Student Reports', 'Reports', 'Phase 9'],
            'admin.reports.attendance' => ['Attendance Reports', 'Reports', 'Phase 9'],
            'admin.reports.fee-collection' => ['Fee Collection Reports', 'Reports', 'Phase 9'],
            'admin.reports.outstanding-fees' => ['Outstanding Fees Reports', 'Reports', 'Phase 9'],
            'admin.reports.examinations' => ['Examination Reports', 'Reports', 'Phase 9'],
            'admin.settings.index' => ['General Settings', 'Settings', 'Phase 1'],
            'admin.users.index' => ['Users', 'Settings', 'Phase 1'],
            'admin.roles.index' => ['Roles', 'Settings', 'Phase 1'],
            'admin.permissions.index' => ['Permissions', 'Settings', 'Phase 1'],
        ];

        [$title, $section, $phase] = $map[$route] ?? ['Module', 'Admin', 'MVP'];

        return Inertia::render('Admin/ModulePlaceholder', [
            'title' => $title,
            'description' => "Manage {$title} for your school.",
            'breadcrumbs' => [
                ['label' => 'Admin', 'href' => route('admin.dashboard')],
                ['label' => $section],
                ['label' => $title],
            ],
            'phase' => $phase,
        ]);
    }
}
