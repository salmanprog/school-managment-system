<?php

namespace App\Http\Controllers\Admin\SchoolSetup;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SchoolSetup\StoreSubjectRequest;
use App\Http\Requests\Admin\SchoolSetup\UpdateSubjectRequest;
use App\Models\Subject;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $subjects = Subject::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Subject $subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
                'description' => $subject->description,
                'status' => $subject->status instanceof EntityStatus ? $subject->status->value : $subject->status,
            ]);

        return Inertia::render('Admin/SchoolSetup/Subjects/Index', [
            'subjects' => $subjects,
            'filters' => [
                'search' => $search,
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => EntityStatus::values(),
        ]);
    }

    public function store(StoreSubjectRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? EntityStatus::Active->value;

        Subject::query()->create($data);

        return redirect()
            ->route('admin.subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    public function update(UpdateSubjectRequest $request, Subject $subject): RedirectResponse
    {
        $subject->update($request->validated());

        return redirect()
            ->route('admin.subjects.index', array_filter([
                'search' => $request->input('search'),
            ]))
            ->with('success', 'Subject updated successfully.');
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        $subject->delete();

        return redirect()
            ->route('admin.subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }
}
