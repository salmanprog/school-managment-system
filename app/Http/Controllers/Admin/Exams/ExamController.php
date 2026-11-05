<?php

namespace App\Http\Controllers\Admin\Exams;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Exams\StoreExamRequest;
use App\Http\Requests\Admin\Exams\UpdateExamRequest;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\ExamType;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $perPage = ListQuery::perPage($request);

        $exams = Exam::query()
            ->with(['examType:id,name', 'academicSession:id,name'])
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->orderByDesc('start_date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Exam $exam) => [
                'id' => $exam->id,
                'name' => $exam->name,
                'exam_type_id' => $exam->exam_type_id,
                'exam_type' => $exam->examType?->name,
                'session_name' => $exam->academicSession?->name,
                'start_date' => $exam->start_date?->format('Y-m-d'),
                'end_date' => $exam->end_date?->format('Y-m-d'),
                'status' => $exam->status,
            ]);

        return Inertia::render('Admin/Exams/Index', [
            'exams' => $exams,
            'examTypes' => ExamType::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'status']),
            'sessionOptions' => AcademicSession::query()->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'per_page' => (string) $perPage,
            ],
        ]);
    }

    public function store(StoreExamRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? 'scheduled';

        Exam::query()->create($data);

        return redirect()->route('admin.exams.index')->with('success', 'Exam created.');
    }

    public function update(UpdateExamRequest $request, Exam $exam): RedirectResponse
    {
        $exam->update($request->validated());

        return redirect()->route('admin.exams.index')->with('success', 'Exam updated.');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $exam->delete();

        return redirect()->route('admin.exams.index')->with('success', 'Exam deleted.');
    }
}
