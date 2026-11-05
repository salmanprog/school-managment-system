<?php

namespace App\Http\Controllers\Admin\Exams;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Exams\StoreExamTypeRequest;
use App\Http\Requests\Admin\Exams\UpdateExamTypeRequest;
use App\Models\ExamType;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $types = ExamType::query()
            ->withCount('exams')
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (ExamType $type) => [
                'id' => $type->id,
                'name' => $type->name,
                'status' => $type->status,
                'exams_count' => (int) $type->exams_count,
                'can_delete' => (int) $type->exams_count === 0,
            ]);

        return Inertia::render('Admin/Exams/Types/Index', [
            'types' => $types,
            'filters' => [
                'search' => $search,
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => EntityStatus::values(),
        ]);
    }

    public function store(StoreExamTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? EntityStatus::Active->value;

        ExamType::query()->create($data);

        return redirect()->route('admin.exam-types.index')->with('success', 'Exam type created.');
    }

    public function update(UpdateExamTypeRequest $request, ExamType $examType): RedirectResponse
    {
        $examType->update($request->validated());

        return redirect()->route('admin.exam-types.index')->with('success', 'Exam type updated.');
    }

    public function destroy(ExamType $examType): RedirectResponse
    {
        if ($examType->exams()->exists()) {
            return redirect()
                ->route('admin.exam-types.index')
                ->with('error', 'This exam type is used by an exam and cannot be deleted.');
        }

        $examType->delete();

        return redirect()->route('admin.exam-types.index')->with('success', 'Exam type deleted.');
    }
}
