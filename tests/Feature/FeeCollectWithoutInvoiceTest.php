<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use App\Services\Fees\CollectPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class FeeCollectWithoutInvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_collect_creates_invoice_and_payment_when_none_pending(): void
    {
        AcademicSession::query()->create([
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
            'first_name' => 'Sara',
            'last_name' => 'Khan',
            'date_of_birth' => '2014-01-10',
            'gender' => 'female',
            'admission_date' => now()->toDateString(),
            'admission_number' => 'ADM-0099',
            'status' => 'active',
        ]);

        StudentEnrollment::query()->create([
            'student_id' => $student->id,
            'academic_session_id' => AcademicSession::query()->value('id'),
            'section_id' => $section->id,
            'enrollment_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        FeeCategory::query()->create([
            'name' => 'Tuition',
            'code' => 'TUI',
            'recurrence_type' => 'monthly',
            'status' => 'active',
        ]);

        $cashier = User::factory()->create();
        $service = app(CollectPaymentService::class);

        $payment = $service->collect(
            $student->id,
            1200,
            now()->toDateString(),
            'cash',
            null,
            $cashier->id,
            [],
        );

        $this->assertSame(1200.0, (float) $payment->amount);
        $this->assertSame(1, FeePayment::query()->count());
        $this->assertDatabaseHas('fee_payments', [
            'student_id' => $student->id,
            'amount' => 1200,
            'status' => 'completed',
        ]);
        $this->assertDatabaseCount('fee_payment_allocations', 1);
    }

    public function test_second_payment_same_month_is_rejected(): void
    {
        AcademicSession::query()->create([
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
            'first_name' => 'Sara',
            'last_name' => 'Khan',
            'date_of_birth' => '2014-01-10',
            'gender' => 'female',
            'admission_date' => now()->toDateString(),
            'admission_number' => 'ADM-0100',
            'status' => 'active',
        ]);

        StudentEnrollment::query()->create([
            'student_id' => $student->id,
            'academic_session_id' => AcademicSession::query()->value('id'),
            'section_id' => $section->id,
            'enrollment_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        FeeCategory::query()->create([
            'name' => 'Tuition',
            'code' => 'TUI',
            'recurrence_type' => 'monthly',
            'status' => 'active',
        ]);

        $cashier = User::factory()->create();
        $service = app(CollectPaymentService::class);
        $date = now()->toDateString();

        $service->collect($student->id, 1200, $date, 'cash', null, $cashier->id, []);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('already been received');

        $service->collect($student->id, 1200, $date, 'cash', null, $cashier->id, []);
    }
}
