<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\Exam;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\Teacher;
use App\Support\AttendanceScore;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today()->toDateString();
        $monthStart = Carbon::now()->startOfMonth()->toDateString();

        $attendanceToday = StudentAttendance::query()
            ->whereDate('attendance_date', $today)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $marked = (int) $attendanceToday->sum();
        $presentLike = (int) (
            ($attendanceToday['present'] ?? 0)
            + ($attendanceToday['late'] ?? 0)
            + (($attendanceToday['half_day'] ?? 0) * 0.5)
        );
        $todayPct = $marked > 0 ? round(($presentLike / $marked) * 100, 1).'%' : '—';

        $monthCollection = (float) FeePayment::query()
            ->whereDate('payment_date', '>=', $monthStart)
            ->where('status', 'completed')
            ->sum('amount');

        $outstanding = (float) FeeInvoice::query()
            ->whereIn('status', ['unpaid', 'partially_paid', 'overdue'])
            ->sum('total_amount');

        $paidAllocations = (float) DB::table('fee_payment_allocations')
            ->join('fee_invoices', 'fee_invoices.id', '=', 'fee_payment_allocations.fee_invoice_id')
            ->whereIn('fee_invoices.status', ['unpaid', 'partially_paid', 'overdue'])
            ->sum('fee_payment_allocations.allocated_amount');

        $stats = [
            'active_students' => Student::query()->where('status', 'active')->count(),
            'teachers' => Teacher::query()->where('status', 'active')->count(),
            'classes' => SchoolClass::query()->where('status', 'active')->count(),
            'today_attendance' => $todayPct,
            'month_fee_collection' => number_format($monthCollection, 2),
            'outstanding_fees' => number_format(max($outstanding - $paidAllocations, 0), 2),
            'pending_admissions' => AdmissionApplication::query()->where('status', 'pending')->count(),
            'upcoming_exams' => Exam::query()
                ->whereDate('start_date', '>=', $today)
                ->where('status', '!=', 'cancelled')
                ->count(),
        ];

        $charts = [
            'monthlyFeeCollection' => $this->monthlyFeeCollection(),
            'attendanceTrend' => $this->attendanceTrend(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'charts' => $charts,
        ]);
    }

    /**
     * @return list<array{name: string, total: float}>
     */
    protected function monthlyFeeCollection(): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths(5);

        $raw = FeePayment::query()
            ->where('status', 'completed')
            ->whereDate('payment_date', '>=', $start->toDateString())
            ->get(['payment_date', 'amount'])
            ->groupBy(fn (FeePayment $payment) => $payment->payment_date->format('Y-m'))
            ->map(fn ($group) => (float) $group->sum('amount'));

        $series = [];
        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i);
            $key = $month->format('Y-m');
            $series[] = [
                'name' => $month->format('M Y'),
                'total' => round((float) ($raw[$key] ?? 0), 2),
            ];
        }

        return $series;
    }

    /**
     * @return list<array{name: string, pct: float|null}>
     */
    protected function attendanceTrend(): array
    {
        $from = Carbon::today()->subDays(13)->toDateString();
        $to = Carbon::today()->toDateString();

        $records = StudentAttendance::query()
            ->whereBetween('attendance_date', [$from, $to])
            ->get(['attendance_date', 'status'])
            ->groupBy(fn ($row) => $row->attendance_date->format('Y-m-d'));

        $series = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $key = $date->format('Y-m-d');
            $dayRecords = $records->get($key, collect());
            $pct = AttendanceScore::percentageFromStatuses($dayRecords->pluck('status'));

            $series[] = [
                'name' => $date->format('M d'),
                'pct' => $pct,
            ];
        }

        return $series;
    }

}
