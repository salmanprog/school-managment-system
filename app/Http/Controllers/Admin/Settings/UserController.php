<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Settings\StoreUserRequest;
use App\Http\Requests\Admin\Settings\UpdateUserRequest;
use App\Models\User;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $users = User::query()
            ->with('roles:id,name')
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'Super Admin'))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status ?? 'active',
                'roles' => $user->roles->pluck('name')->values(),
            ]);

        return Inertia::render('Admin/Settings/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => (string) $perPage,
            ],
            'roleOptions' => $this->assignableRoles(),
            'statusOptions' => ['active', 'inactive'],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Settings/Users/Create', [
            'roleOptions' => $this->assignableRoles(),
            'statusOptions' => ['active', 'inactive'],
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $roles = $this->sanitizeRoles($data['roles'] ?? []);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'admin',
            'status' => $data['status'] ?? 'active',
        ]);

        $user->syncRoles($roles);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response|RedirectResponse
    {
        if ($this->isSuperAdmin($user)) {
            return redirect()
                ->route('admin.users.index')
                ->with('error', 'The Super Admin account cannot be edited here.');
        }

        $user->load('roles:id,name');

        return Inertia::render('Admin/Settings/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status ?? 'active',
                'roles' => $user->roles->pluck('name')->values(),
            ],
            'roleOptions' => $this->assignableRoles(),
            'statusOptions' => ['active', 'inactive'],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        if ($this->isSuperAdmin($user)) {
            return redirect()
                ->route('admin.users.index')
                ->with('error', 'The Super Admin account cannot be edited here.');
        }

        $data = $request->validated();
        $roles = $this->sanitizeRoles($data['roles'] ?? []);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'status' => $data['status'] ?? 'active',
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        $user->syncRoles($roles);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * @return list<string>
     */
    protected function assignableRoles(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->whereNotIn('name', ['Super Admin', 'Parent', 'Student'])
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    /**
     * @param  list<string>  $roles
     * @return list<string>
     */
    protected function sanitizeRoles(array $roles): array
    {
        $allowed = $this->assignableRoles();

        return array_values(array_intersect($roles, $allowed));
    }

    protected function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('Super Admin');
    }
}
