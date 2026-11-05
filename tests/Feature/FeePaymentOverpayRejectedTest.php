<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\FeeInvoice;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use App\Services\Fees\CollectPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class FeePaymentOverpayRejectedTest extends TestCase
{
    use RefreshDatabase;

    public function test_over_allocation_is_rejected(): void
    {
        $session = AcademicSession::query()->create([
            'name' => '2026–2027',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'is_current' => true,
            'status' => 'active',
        ]);

        $class = SchoolClass::query()->create([
            'name' => 'Class 1',
            'code' => 'C01',
            'sort_order' => 1,
            'status' => 'active',
        ]);

        $section = Section::query()->create([
            'class_id' => $class->id,
            'name' => 'A',
            'capacity' => 40,
            'status' => 'active',
        ]);

        $student = Student::query()->create([
            'first_name' => 'Omar',
            'last_name' => 'Ali',
            'date_of_birth' => '2013-03-03',
            'gender' => 'male',
            'admission_date' => now()->toDateString(),
            'admission_number' => 'ADM-0002',
            'status' => 'active',
        ]);

        $enrollment = StudentEnrollment::query()->create([
            'student_id' => $student->id,
            'academic_session_id' => $session->id,
            'section_id' => $section->id,
            'enrollment_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $invoice = FeeInvoice::query()->create([
            'student_enrollment_id' => $enrollment->id,
            'invoice_number' => 'INV-0001',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'subtotal' => 1000,
            'discount_total' => 0,
            'total_amount' => 1000,
            'status' => 'unpaid',
        ]);

        $cashier = User::factory()->create();

        $service = app(CollectPaymentService::class);

        $this->expectException(InvalidArgumentException::class);

        $service->collect(
            $student->id,
            1500,
            now()->toDateString(),
            'cash',
            null,
            $cashier->id,
            [
                ['fee_invoice_id' => $invoice->id, 'allocated_amount' => 1500],
            ],
        );
    }
}
