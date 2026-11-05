<?php

namespace App\Http\Controllers\Admin\Fees;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Fees\StoreFeeStructureRequest;
use App\Http\Requests\Admin\Fees\UpdateFeeStructureRequest;
use App\Models\AcademicSession;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeeStructureController extends Controller
{
    public function index(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $classId = $request->integer('class_id') ?: null;
        $perPage = ListQuery::perPage($request);

        $structures = FeeStructure::query()
            ->with(['feeCategory:id,name,code', 'schoolClass:id,name', 'academicSession:id,name'])
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->when($classId, fn ($q) => $q->where('class_id', $classId))
            ->orderByDesc('effective_from')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (FeeStructure $row) => [
                'id' => $row->id,
                'academic_session_id' => $row->academic_session_id,
                'session_name' => $row->academicSession?->name,
                'class_id' => $row->class_id,
                'class_name' => $row->schoolClass?->name,
                'fee_category_id' => $row->fee_category_id,
                'category_name' => $row->feeCategory?->name,
                'amount' => (float) $row->amount,
                'effective_from' => $row->effective_from?->format('Y-m-d'),
                'status' => $row->status,
            ]);

        return Inertia::render('Admin/Fees/Structures/Index', [
            'structures' => $structures,
            'sessionOptions' => AcademicSession::query()->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->orderBy('sort_order')->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'class_id' => $classId ? (string) $classId : '',
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => EntityStatus::values(),
        ]);
    }

    public function store(StoreFeeStructureRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? EntityStatus::Active->value;
        $data['fee_category_id'] = $data['fee_category_id']
            ?? $this->resolveCategoryIdForClass((int) $data['class_id']);

        FeeStructure::query()->create($data);

        return redirect()->route('admin.fees.structures')->with('success', 'Fee structure created.');
    }

    public function update(UpdateFeeStructureRequest $request, FeeStructure $feeStructure): RedirectResponse
    {
        $data = $request->validated();
        $data['fee_category_id'] = $data['fee_category_id']
            ?? $this->resolveCategoryIdForClass((int) $data['class_id']);

        $feeStructure->update($data);

        return redirect()->route('admin.fees.structures')->with('success', 'Fee structure updated.');
    }

    /**
     * Keep fee_category_id filled without asking admins to manage categories.
     */
    protected function resolveCategoryIdForClass(int $classId): int
    {
        $class = SchoolClass::query()->findOrFail($classId);
        $name = trim($class->name).' Fee';
        $base = filled($class->code) ? (string) $class->code : 'CLS-'.$class->id;
        $code = strtoupper((string) preg_replace('/[^A-Za-z0-9]+/', '-', $base));
        $code = trim($code, '-').'-FEE';

        $category = FeeCategory::query()->firstOrCreate(
            ['code' => $code],
            [
                'name' => $name,
                'recurrence_type' => 'monthly',
                'status' => 'active',
            ],
        );

        return (int) $category->id;
    }

    public function destroy(FeeStructure $feeStructure): RedirectResponse
    {
        $feeStructure->delete();

        return redirect()->route('admin.fees.structures')->with('success', 'Fee structure deleted.');
    }
}
