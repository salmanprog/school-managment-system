<?php

namespace App\Http\Controllers\Admin\Fees;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Fees\GenerateInvoicesRequest;
use App\Models\AcademicSession;
use App\Models\FeeCategory;
use App\Models\FeeInvoice;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Services\Fees\GenerateInvoicesService;
use App\Support\ListQuery;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class InvoiceController extends Controller
{
    public function __construct(
        protected GenerateInvoicesService $generateInvoicesService,
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->string('status')->trim()->toString();
        $search = $request->string('search')->trim()->toString();
        $sessionId = $request->integer('session_id') ?: null;
        $perPage = ListQuery::perPage($request);

        $invoices = FeeInvoice::query()
            ->with([
                'studentEnrollment.student:id,first_name,last_name,admission_number',
                'studentEnrollment.academicSession:id,name',
                'studentEnrollment.section.schoolClass:id,name',
            ])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($sessionId, fn ($q) => $q->whereHas('studentEnrollment', fn ($e) => $e->where('academic_session_id', $sessionId)))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('studentEnrollment.student', function ($s) use ($search) {
                            $s->where('admission_number', 'like', "%{$search}%")
                                ->orWhere('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('invoice_date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (FeeInvoice $invoice) {
                $student = $invoice->studentEnrollment?->student;

                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'billing_period' => $invoice->billing_period,
                    'invoice_date' => $invoice->invoice_date?->format('Y-m-d'),
                    'due_date' => $invoice->due_date?->format('Y-m-d'),
                    'total_amount' => (float) $invoice->total_amount,
                    'status' => $invoice->status,
                    'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : null,
                    'admission_number' => $student?->admission_number,
                    'class_name' => $invoice->studentEnrollment?->section?->schoolClass?->name,
                    'session_name' => $invoice->studentEnrollment?->academicSession?->name,
                ];
            });

        return Inertia::render('Admin/Fees/Invoices/Index', [
            'invoices' => $invoices,
            'sessionOptions' => AcademicSession::query()->orderByDesc('start_date')->get(['id', 'name']),
            'filters' => [
                'status' => $status,
                'search' => $search,
                'session_id' => $sessionId ? (string) $sessionId : '',
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => ['unpaid', 'partially_paid', 'paid'],
        ]);
    }

    public function show(FeeInvoice $feeInvoice): Response
    {
        $feeInvoice->load([
            'items.feeCategory:id,name,code',
            'paymentAllocations.feePayment:id,payment_number,payment_date',
            'studentEnrollment.student',
            'studentEnrollment.section.schoolClass',
            'studentEnrollment.academicSession',
        ]);

        $student = $feeInvoice->studentEnrollment?->student;

        return Inertia::render('Admin/Fees/Invoices/Show', [
            'invoice' => [
                'id' => $feeInvoice->id,
                'invoice_number' => $feeInvoice->invoice_number,
                'billing_period' => $feeInvoice->billing_period,
                'invoice_date' => $feeInvoice->invoice_date?->format('Y-m-d'),
                'due_date' => $feeInvoice->due_date?->format('Y-m-d'),
                'subtotal' => (float) $feeInvoice->subtotal,
                'discount_total' => (float) $feeInvoice->discount_total,
                'total_amount' => (float) $feeInvoice->total_amount,
                'status' => $feeInvoice->status,
                'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : null,
                'admission_number' => $student?->admission_number,
                'class_name' => $feeInvoice->studentEnrollment?->section?->schoolClass?->name,
                'session_name' => $feeInvoice->studentEnrollment?->academicSession?->name,
                'items' => $feeInvoice->items->map(fn ($item) => [
                    'description' => $item->description,
                    'category' => $item->feeCategory?->name,
                    'amount' => (float) $item->amount,
                    'discount_amount' => (float) $item->discount_amount,
                    'net_amount' => (float) $item->net_amount,
                ])->values(),
                'payments' => $feeInvoice->paymentAllocations->map(fn ($row) => [
                    'payment_number' => $row->feePayment?->payment_number,
                    'payment_date' => $row->feePayment?->payment_date?->format('Y-m-d'),
                    'allocated_amount' => (float) $row->allocated_amount,
                ])->values(),
            ],
        ]);
    }

    public function generateForm(): Response
    {
        return Inertia::render('Admin/Fees/Invoices/Generate', [
            'sessionOptions' => AcademicSession::query()->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
            'categoryOptions' => FeeCategory::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'recurrence_type']),
        ]);
    }

    public function generateStore(GenerateInvoicesRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $result = $this->generateInvoicesService->generate(
                (int) $data['academic_session_id'],
                (int) $data['class_id'],
                $data['billing_period'],
                $data['invoice_date'],
                $data['due_date'],
                ! empty($data['fee_category_ids']) ? $data['fee_category_ids'] : null,
            );
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['generate' => $e->getMessage()]);
        }

        return redirect()
            ->route('admin.fees.collect')
            ->with('success', "Generated {$result['created']} fee invoice(s). Skipped {$result['skipped']} duplicate line(s). You can collect fees now.");
    }

    public function pdf(FeeInvoice $feeInvoice): HttpResponse
    {
        $feeInvoice->load([
            'items.feeCategory',
            'studentEnrollment.student',
            'studentEnrollment.section.schoolClass',
            'studentEnrollment.academicSession',
        ]);

        $school = SchoolSetting::query()->first();
        $filename = 'invoice-'.preg_replace('/[^A-Za-z0-9\-_.]/', '', (string) $feeInvoice->invoice_number).'.pdf';

        $pdf = Pdf::loadView('pdf.fee-invoice', [
            'invoice' => $feeInvoice,
            'school' => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download($filename);
    }
}
