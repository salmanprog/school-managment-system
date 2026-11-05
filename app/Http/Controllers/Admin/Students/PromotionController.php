<?php

namespace App\Http\Controllers\Admin\Students;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Students\BulkPromotionRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Services\Students\PromoteStudentsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PromotionController extends Controller
{
    public function index(Request $request): Response
    {
        $sourceSessionId = $request->integer('source_session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $sourceClassId = $request->integer('source_class_id') ?: null;

        $eligible = collect();
        if ($sourceSessionId && $sourceClassId) {
            $eligible = StudentEnrollment::query()
                ->with(['student:id,admission_number,first_name,last_name'])
                ->where('academic_session_id', $sourceSessionId)
                ->where('status', 'active')
                ->whereHas('section', fn ($s) => $s->where('class_id', $sourceClassId))
                ->orderBy('roll_number')
                ->get()
                ->map(fn (StudentEnrollment $row) => [
                    'enrollment_id' => $row->id,
                    'student_id' => $row->student_id,
                    'roll_number' => $row->roll_number,
                    'admission_number' => $row->student?->admission_number,
                    'full_name' => $row->student ? trim("{$row->student->first_name} {$row->student->last_name}") : '—',
                ]);
        }

        return Inertia::render('Admin/Students/Promotions/Index', [
            'eligibleStudents' => $eligible,
            'filters' => [
                'source_session_id' => $sourceSessionId ? (string) $sourceSessionId : '',
                'source_class_id' => $sourceClassId ? (string) $sourceClassId : '',
            ],
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name']),
        ]);
    }

    public function store(BulkPromotionRequest $request, PromoteStudentsService $service): RedirectResponse
    {
        $data = $request->validated();

        try {
            $service->process(
                $data['student_ids'],
                $data['action'],
                (int) $data['source_session_id'],
                (int) $data['source_class_id'],
                (int) ($data['target_session_id'] ?? $data['source_session_id']),
                (int) ($data['target_class_id'] ?? $data['source_class_id']),
            );
        } catch (Throwable $e) {
            return redirect()
                ->route('admin.promotions.index', array_filter([
                    'source_session_id' => $data['source_session_id'],
                    'source_class_id' => $data['source_class_id'],
                ]))
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('admin.promotions.index', array_filter([
                'source_session_id' => $data['source_session_id'],
                'source_class_id' => $data['source_class_id'],
            ]))
            ->with('success', 'Student promotion processed successfully.');
    }
}
