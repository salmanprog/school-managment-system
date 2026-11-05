<?php

namespace App\Http\Controllers\Admin\Fees;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Fees\StoreFeeCategoryRequest;
use App\Http\Requests\Admin\Fees\UpdateFeeCategoryRequest;
use App\Models\FeeCategory;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeeCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $categories = FeeCategory::query()
            ->when($search !== '', fn ($q) => $q->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            }))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (FeeCategory $row) => [
                'id' => $row->id,
                'name' => $row->name,
                'code' => $row->code,
                'recurrence_type' => $row->recurrence_type,
                'status' => $row->status,
            ]);

        return Inertia::render('Admin/Fees/Categories/Index', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => EntityStatus::values(),
            'recurrenceOptions' => ['monthly', 'one_time'],
        ]);
    }

    public function store(StoreFeeCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? EntityStatus::Active->value;

        FeeCategory::query()->create($data);

        return redirect()->route('admin.fees.categories')->with('success', 'Fee category created.');
    }

    public function update(UpdateFeeCategoryRequest $request, FeeCategory $feeCategory): RedirectResponse
    {
        $feeCategory->update($request->validated());

        return redirect()->route('admin.fees.categories')->with('success', 'Fee category updated.');
    }

    public function destroy(FeeCategory $feeCategory): RedirectResponse
    {
        $feeCategory->delete();

        return redirect()->route('admin.fees.categories')->with('success', 'Fee category deleted.');
    }
}
