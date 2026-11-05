<?php

namespace App\Http\Controllers\Admin\SchoolSetup;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SchoolSetup\StoreAcademicSessionRequest;
use App\Http\Requests\Admin\SchoolSetup\UpdateAcademicSessionRequest;
use App\Models\AcademicSession;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AcademicSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $sessions = AcademicSession::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (AcademicSession $session) => [
                'id' => $session->id,
                'name' => $session->name,
                'start_date' => $session->start_date?->format('Y-m-d'),
                'end_date' => $session->end_date?->format('Y-m-d'),
                'is_current' => $session->is_current,
                'status' => $session->status instanceof EntityStatus ? $session->status->value : $session->status,
            ]);

        return Inertia::render('Admin/SchoolSetup/AcademicSessions/Index', [
            'sessions' => $sessions,
            'filters' => [
                'search' => $search,
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => EntityStatus::values(),
        ]);
    }

    public function store(StoreAcademicSessionRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? EntityStatus::Active->value;
        $data['is_current'] = (bool) ($data['is_current'] ?? false);

        DB::transaction(function () use ($data) {
            if ($data['is_current']) {
                AcademicSession::query()->update(['is_current' => false]);
            }

            AcademicSession::query()->create($data);
        });

        return redirect()
            ->route('admin.academic-sessions.index')
            ->with('success', 'Academic session created successfully.');
    }

    public function update(UpdateAcademicSessionRequest $request, AcademicSession $academicSession): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $academicSession) {
            if (! empty($data['is_current'])) {
                AcademicSession::query()->where('id', '!=', $academicSession->id)->update(['is_current' => false]);
                $data['is_current'] = true;
            }

            $academicSession->update($data);
        });

        return redirect()
            ->route('admin.academic-sessions.index')
            ->with('success', 'Academic session updated successfully.');
    }

    public function setCurrent(AcademicSession $academicSession): RedirectResponse
    {
        DB::transaction(function () use ($academicSession) {
            AcademicSession::query()->update(['is_current' => false]);
            $academicSession->update([
                'is_current' => true,
                'status' => EntityStatus::Active->value,
            ]);
        });

        return redirect()
            ->route('admin.academic-sessions.index')
            ->with('success', 'Current academic session updated.');
    }

    public function destroy(AcademicSession $academicSession): RedirectResponse
    {
        if ($academicSession->is_current) {
            return redirect()
                ->route('admin.academic-sessions.index')
                ->with('error', 'Cannot delete the current academic session.');
        }

        $academicSession->delete();

        return redirect()
            ->route('admin.academic-sessions.index')
            ->with('success', 'Academic session deleted successfully.');
    }
}
