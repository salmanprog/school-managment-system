<?php

use App\Http\Controllers\Admin\Admissions\AdmissionController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\Reports\ReportController;
use App\Http\Controllers\Admin\Settings\PermissionController;
use App\Http\Controllers\Admin\Settings\RoleController;
use App\Http\Controllers\Admin\Settings\SettingsController;
use App\Http\Controllers\Admin\Settings\UserController;
use App\Http\Controllers\Admin\SchoolSetup\AcademicSessionController;
use App\Http\Controllers\Admin\Attendance\AttendanceController;
use App\Http\Controllers\Admin\Students\EnrollmentController;
use App\Http\Controllers\Admin\Students\PromotionController;
use App\Http\Controllers\Admin\Students\StudentController;
use App\Http\Controllers\Admin\Teachers\TeacherAssignmentController;
use App\Http\Controllers\Admin\Teachers\TeacherController;
use App\Http\Controllers\Admin\SchoolSetup\SchoolClassController;
use App\Http\Controllers\Admin\SchoolSetup\SchoolProfileController;
use App\Http\Controllers\Admin\SchoolSetup\SubjectController;
use App\Http\Controllers\Admin\Fees\FeeCategoryController;
use App\Http\Controllers\Admin\Fees\FeeStructureController;
use App\Http\Controllers\Admin\Fees\InvoiceController;
use App\Http\Controllers\Admin\Fees\PaymentController;
use App\Http\Controllers\Admin\Exams\ExamController;
use App\Http\Controllers\Admin\Exams\ExamTypeController;
use App\Http\Controllers\Admin\Exams\ExamScheduleController;
use App\Http\Controllers\Admin\Exams\MarksController;
use App\Http\Controllers\Admin\Exams\ReportCardController;
use App\Http\Controllers\Admin\Exams\ResultController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('login', [AuthController::class, 'showLoginForm'])->name('login');
        Route::post('login', [AuthController::class, 'login'])->name('login.submit');
    });

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');

        // School Setup
        Route::middleware('permission:school.manage')->group(function () {
            Route::get('school-profile', [SchoolProfileController::class, 'show'])->name('school-profile');
            Route::put('school-profile', [SchoolProfileController::class, 'update'])->name('school-profile.update');
        });

        Route::middleware('permission:sessions.manage')->group(function () {
            Route::get('academic-sessions', [AcademicSessionController::class, 'index'])->name('academic-sessions.index');
            Route::post('academic-sessions', [AcademicSessionController::class, 'store'])->name('academic-sessions.store');
            Route::put('academic-sessions/{academic_session}', [AcademicSessionController::class, 'update'])->name('academic-sessions.update');
            Route::post('academic-sessions/{academic_session}/set-current', [AcademicSessionController::class, 'setCurrent'])->name('academic-sessions.set-current');
            Route::delete('academic-sessions/{academic_session}', [AcademicSessionController::class, 'destroy'])->name('academic-sessions.destroy');
        });

        Route::middleware('permission:classes.manage')->group(function () {
            Route::resource('classes', SchoolClassController::class)
                ->parameters(['classes' => 'school_class'])
                ->except(['show', 'create', 'edit']);
        });

        Route::middleware('permission:subjects.manage')->group(function () {
            Route::get('subjects', [SubjectController::class, 'index'])->name('subjects.index');
            Route::post('subjects', [SubjectController::class, 'store'])->name('subjects.store');
            Route::put('subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
            Route::delete('subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');
        });

        // Admissions
        Route::middleware('permission:admissions.create')->group(function () {
            Route::get('admissions/create', [AdmissionController::class, 'create'])->name('admissions.create');
            Route::post('admissions', [AdmissionController::class, 'store'])->name('admissions.store');
        });
        Route::middleware('permission:admissions.view')->group(function () {
            Route::get('admissions', [AdmissionController::class, 'index'])->name('admissions.index');
            Route::get('admissions/{admission_application}', [AdmissionController::class, 'show'])->name('admissions.show');
        });
        Route::middleware('permission:admissions.approve')->group(function () {
            Route::post('admissions/{admission_application}/approve', [AdmissionController::class, 'approve'])->name('admissions.approve');
        });
        Route::middleware('permission:admissions.reject')->group(function () {
            Route::post('admissions/{admission_application}/reject', [AdmissionController::class, 'reject'])->name('admissions.reject');
        });

        // Students
        Route::middleware('permission:students.create')->group(function () {
            Route::get('students/create', [StudentController::class, 'create'])->name('students.create');
            Route::post('students', [StudentController::class, 'store'])->name('students.store');
        });
        Route::middleware('permission:students.update')->group(function () {
            Route::get('students/{student}/edit', [StudentController::class, 'edit'])->name('students.edit');
            Route::put('students/{student}', [StudentController::class, 'update'])->name('students.update');
        });
        Route::middleware('permission:students.view')->group(function () {
            Route::get('students', [StudentController::class, 'index'])->name('students.index');
            Route::get('students/{student}', [StudentController::class, 'show'])->name('students.show');
            Route::get('enrollments', [EnrollmentController::class, 'index'])->name('enrollments.index');
        });
        Route::middleware('permission:students.promote')->group(function () {
            Route::get('promotions', [PromotionController::class, 'index'])->name('promotions.index');
            Route::post('promotions', [PromotionController::class, 'store'])->name('promotions.store');
        });

        // Teachers
        Route::middleware('permission:teachers.manage')->group(function () {
            Route::get('teachers', [TeacherController::class, 'index'])->name('teachers.index');
            Route::get('teachers/create', [TeacherController::class, 'create'])->name('teachers.create');
            Route::post('teachers', [TeacherController::class, 'store'])->name('teachers.store');
            Route::get('teachers/{teacher}', [TeacherController::class, 'show'])->name('teachers.show');
            Route::get('teachers/{teacher}/edit', [TeacherController::class, 'edit'])->name('teachers.edit');
            Route::put('teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');

            Route::get('teacher-assignments', [TeacherAssignmentController::class, 'index'])->name('teacher-assignments.index');
            Route::post('teacher-assignments', [TeacherAssignmentController::class, 'store'])->name('teacher-assignments.store');
            Route::delete('teacher-assignments/{teacher_assignment}', [TeacherAssignmentController::class, 'destroy'])->name('teacher-assignments.destroy');
        });

        // Attendance
        Route::middleware('permission:attendance.view')->group(function () {
            Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
            Route::get('attendance/reports', [AttendanceController::class, 'reports'])->name('attendance.reports');
        });
        Route::middleware('permission:attendance.mark|attendance.update')->group(function () {
            Route::get('attendance/mark', [AttendanceController::class, 'mark'])->name('attendance.mark');
            Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
        });

        // Fees
        Route::middleware('permission:fees.manage')->group(function () {
            Route::get('fees/categories', [FeeCategoryController::class, 'index'])->name('fees.categories');
            Route::post('fees/categories', [FeeCategoryController::class, 'store'])->name('fees.categories.store');
            Route::put('fees/categories/{fee_category}', [FeeCategoryController::class, 'update'])->name('fees.categories.update');
            Route::delete('fees/categories/{fee_category}', [FeeCategoryController::class, 'destroy'])->name('fees.categories.destroy');

            Route::get('fees/structures', [FeeStructureController::class, 'index'])->name('fees.structures');
            Route::post('fees/structures', [FeeStructureController::class, 'store'])->name('fees.structures.store');
            Route::put('fees/structures/{fee_structure}', [FeeStructureController::class, 'update'])->name('fees.structures.update');
            Route::delete('fees/structures/{fee_structure}', [FeeStructureController::class, 'destroy'])->name('fees.structures.destroy');
        });

        Route::middleware('permission:fees.generate-invoices')->group(function () {
            Route::get('fees/generate', [InvoiceController::class, 'generateForm'])->name('fees.generate');
            Route::post('fees/generate', [InvoiceController::class, 'generateStore'])->name('fees.generate.store');
        });

        Route::middleware('permission:fees.view')->group(function () {
            Route::get('fees/invoices', [InvoiceController::class, 'index'])->name('fees.invoices');
            Route::get('fees/invoices/{fee_invoice}', [InvoiceController::class, 'show'])->name('fees.invoices.show');
            Route::get('fees/invoices/{fee_invoice}/pdf', [InvoiceController::class, 'pdf'])->name('fees.invoices.pdf');
            Route::get('fees/pending', [PaymentController::class, 'pending'])->name('fees.pending');
            Route::get('fees/receipts', [PaymentController::class, 'receipts'])->name('fees.receipts');
            Route::get('fees/receipts/{fee_payment}/print', [PaymentController::class, 'receiptPrint'])->name('fees.receipts.print');
            Route::get('fees/receipts/{fee_payment}/pdf', [PaymentController::class, 'receiptPrint'])->name('fees.receipts.pdf');
        });

        Route::middleware('permission:fees.collect-payment')->group(function () {
            Route::get('fees/collect', [PaymentController::class, 'collectForm'])->name('fees.collect');
            Route::post('fees/collect', [PaymentController::class, 'collectStore'])->name('fees.collect.store');
        });

        // Exams
        Route::middleware('permission:exams.manage')->group(function () {
            Route::get('exams', [ExamController::class, 'index'])->name('exams.index');
            Route::post('exams', [ExamController::class, 'store'])->name('exams.store');
            Route::put('exams/{exam}', [ExamController::class, 'update'])->name('exams.update');
            Route::delete('exams/{exam}', [ExamController::class, 'destroy'])->name('exams.destroy');

            Route::get('exam-types', [ExamTypeController::class, 'index'])->name('exam-types.index');
            Route::post('exam-types', [ExamTypeController::class, 'store'])->name('exam-types.store');
            Route::put('exam-types/{exam_type}', [ExamTypeController::class, 'update'])->name('exam-types.update');
            Route::delete('exam-types/{exam_type}', [ExamTypeController::class, 'destroy'])->name('exam-types.destroy');

            Route::get('exams/schedules', [ExamScheduleController::class, 'index'])->name('exams.schedules');
            Route::post('exams/schedules', [ExamScheduleController::class, 'store'])->name('exams.schedules.store');
            Route::put('exams/schedules/{exam_schedule}', [ExamScheduleController::class, 'update'])->name('exams.schedules.update');
            Route::delete('exams/schedules/{exam_schedule}', [ExamScheduleController::class, 'destroy'])->name('exams.schedules.destroy');
        });

        Route::middleware('permission:exams.enter-marks')->group(function () {
            Route::get('exams/marks', [MarksController::class, 'index'])->name('exams.marks');
            Route::post('exams/marks', [MarksController::class, 'store'])->name('exams.marks.store');
        });

        Route::middleware('permission:exams.view')->group(function () {
            Route::get('exams/results', [ResultController::class, 'index'])->name('exams.results');
            Route::get('exams/report-cards', [ReportCardController::class, 'index'])->name('exams.report-cards');
            Route::get('exams/report-cards/{report_card}/pdf', [ReportCardController::class, 'pdf'])->name('exams.report-cards.pdf');
        });

        Route::middleware('permission:exams.publish')->group(function () {
            Route::post('exams/results/calculate', [ResultController::class, 'calculate'])->name('exams.results.calculate');
        });

        // Reports
        Route::middleware('permission:reports.view')->group(function () {
            Route::get('reports/students', [ReportController::class, 'students'])->name('reports.students');
            Route::get('reports/attendance', [ReportController::class, 'attendance'])->name('reports.attendance');
            Route::get('reports/fee-collection', [ReportController::class, 'feeCollection'])->name('reports.fee-collection');
            Route::get('reports/outstanding-fees', [ReportController::class, 'outstandingFees'])->name('reports.outstanding-fees');
            Route::get('reports/examinations', [ReportController::class, 'examinations'])->name('reports.examinations');
        });

        // Settings
        Route::middleware('permission:settings.manage')->group(function () {
            Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
        });

        Route::middleware('permission:users.manage')->group(function () {
            Route::get('users', [UserController::class, 'index'])->name('users.index');
            Route::get('users/create', [UserController::class, 'create'])->name('users.create');
            Route::post('users', [UserController::class, 'store'])->name('users.store');
            Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
            Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        });

        Route::middleware('permission:roles.manage')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
            Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->name('roles.permissions.sync');
            Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
        });
    });
});
