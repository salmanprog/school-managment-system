<?php

namespace App\Http\Controllers\Admin\SchoolSetup;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SchoolSetup\StoreSchoolClassRequest;
use App\Http\Requests\Admin\SchoolSetup\UpdateSchoolClassRequest;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Support\DefaultSection;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClassController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $perPage = ListQuery::perPage($request);
        [$sortColumn, $sortDir, $sortKey] = ListQuery::sort($request, [
            'order' => 'sort_order',
            'name' => 'name',
            'code' => 'code',
            'status' => 'status',
        ], 'order');

        $classes = SchoolClass::query()
            ->with(['subjects:id,name,code,status'])
            ->withCount('subjects')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortColumn, $sortDir)
            ->when($sortKey !== 'name', fn ($q) => $q->orderBy('name'))
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (SchoolClass $class) => [
                'id' => $class->id,
                'name' => $class->name,
                'code' => $class->code,
                'sort_order' => $class->sort_order,
                'status' => $class->status instanceof EntityStatus ? $class->status->value : $class->status,
                'subjects_count' => $class->subjects_count,
                'subject_ids' => $class->subjects->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
                'subjects' => $class->subjects
                    ->sortBy('name')
                    ->values()
                    ->map(fn (Subject $subject) => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                        'status' => $subject->status instanceof EntityStatus
                            ? $subject->status->value
                            : $subject->status,
                    ])
                    ->all(),
            ]);

        $subjectOptions = Subject::query()
            ->where('status', EntityStatus::Active->value)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/SchoolSetup/Classes/Index', [
            'classes' => $classes,
            'subjectOptions' => $subjectOptions,
            'filters' => [
                'search' => $search,
                'per_page' => (string) $perPage,
                'sort' => $sortKey,
                'dir' => $sortDir,
            ],
            'statusOptions' => EntityStatus::values(),
        ]);
    }

    public function store(StoreSchoolClassRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $subjectIds = $data['subject_ids'] ?? [];
        unset($data['subject_ids']);

        $data['status'] = $data['status'] ?? EntityStatus::Active->value;
        unset($data['sort_order']);
        $data['sort_order'] = ((int) SchoolClass::query()->max('sort_order')) + 1;

        DB::transaction(function () use ($data, $subjectIds) {
            $class = SchoolClass::query()->create($data);
            DefaultSection::forClass((int) $class->id);
            $this->syncSubjects($class, $subjectIds);
        });

        return redirect()
            ->route('admin.classes.index')
            ->with('success', 'Class created successfully.');
    }

    public function update(UpdateSchoolClassRequest $request, SchoolClass $schoolClass): RedirectResponse
    {
        $data = $request->validated();
        $subjectIds = $data['subject_ids'] ?? [];
        unset($data['subject_ids'], $data['sort_order']);

        DB::transaction(function () use ($schoolClass, $data, $subjectIds) {
            $schoolClass->update($data);
            $this->syncSubjects($schoolClass, $subjectIds);
        });

        return redirect()
            ->route('admin.classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function destroy(SchoolClass $schoolClass): RedirectResponse
    {
        $schoolClass->delete();

        return redirect()
            ->route('admin.classes.index')
            ->with('success', 'Class deleted successfully.');
    }

    /**
     * @param  list<int|string>  $subjectIds
     */
    protected function syncSubjects(SchoolClass $class, array $subjectIds): void
    {
        $sync = [];
        foreach ($subjectIds as $subjectId) {
            $sync[(int) $subjectId] = ['is_compulsory' => true];
        }

        $class->subjects()->sync($sync);
    }
}
