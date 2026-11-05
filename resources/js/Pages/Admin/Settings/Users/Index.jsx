import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/PaginationLinks';
import {
    DataTable,
    DataTableBody,
    DataTableHead,
    ListingCard,
    RowActions,
    Td,
    Th,
    Tr,
} from '@/Components/ListingCard';
import { ListingSearch } from '@/Components/ListingSearch';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';

const emptyForm = {
    name: '',
    email: '',
    password: '',
    status: 'active',
    roles: [],
};

export default function Index({ users, filters, roleOptions = [], statusOptions = [] }) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(emptyForm);

    const apply = (e) => {
        e.preventDefault();
        router.get(
            '/admin/users',
            { ...filters, status: status || undefined },
            { preserveState: true },
        );
    };

    const openCreate = () => {
        reset();
        clearErrors();
        setEditing(null);
        setData(emptyForm);
        setDrawerOpen(true);
    };

    const openEdit = (user) => {
        clearErrors();
        setEditing(user);
        setData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            status: user.status || 'active',
            roles: user.roles || [],
        });
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setEditing(null);
        reset();
        clearErrors();
    };

    const toggleRole = (role) => {
        setData(
            'roles',
            data.roles.includes(role)
                ? data.roles.filter((r) => r !== role)
                : [...data.roles, role],
        );
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeDrawer };
        if (editing) {
            put(`/admin/users/${editing.id}`, opts);
        } else {
            post('/admin/users', opts);
        }
    };

    const isEmpty = users.data.length === 0;

    const filterToolbar = (
        <div className="flex flex-nowrap items-end gap-2">
            <ListingSearch
                url="/admin/users"
                filters={filters}
                defaultValue={filters.search ?? ''}
                placeholder="Search users…"
            />
            <form noValidate onSubmit={apply} className="flex flex-nowrap items-end gap-2">
                <div className="w-[130px]">
                    <Label className="mb-1 block text-xs font-medium text-slate-500">Status</Label>
                    <Select2
                        value={status}
                        onChange={setStatus}
                        placeholder="All"
                        allowClear
                        searchThreshold={Infinity}
                    >
                        <option value="">All</option>
                        {statusOptions.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </Select2>
                </div>
                <Button type="submit" variant="secondary" size="sm" className="h-10">
                    Filter
                </Button>
            </form>
        </div>
    );

    return (
        <AdminLayout title="Users">
            <PageHeader
                title="Users"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Settings' },
                    { label: 'Users' },
                ]}
                description="Manage staff accounts and assign roles. The Super Admin account is hidden from this list."
                action={{ label: 'Add user', onClick: openCreate }}
            />

            <ListingCard
                title="All users"
                total={users.total}
                filterHint={filters.search ? `matching “${filters.search}”` : undefined}
                filters={filters}
                perPageUrl="/admin/users"
                toolbar={filterToolbar}
                isEmpty={isEmpty}
                emptyTitle="No users found"
                emptyDescription="Add a staff user or adjust your filters."
                emptyAction={
                    <Button type="button" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add user
                    </Button>
                }
                paginator={users}
            >
                <DataTable>
                    <DataTableHead>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Roles</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {users.data.map((user) => (
                            <Tr key={user.id}>
                                <Td className="font-semibold text-ink-900">{user.name}</Td>
                                <Td className="text-slate-600">{user.email}</Td>
                                <Td>{user.roles.join(', ') || '—'}</Td>
                                <Td>
                                    <StatusBadge status={user.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Edit user"
                                            onClick={() => openEdit(user)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </RowActions>
                                </Td>
                            </Tr>
                        ))}
                    </DataTableBody>
                </DataTable>
            </ListingCard>

            <SideDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                title={editing ? 'Edit user' : 'Add user'}
                description={
                    editing
                        ? 'Update account details, password, and roles.'
                        : 'Create a staff account and assign one or more roles.'
                }
                size="md"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="user-form" disabled={processing}>
                            {processing ? 'Saving…' : editing ? 'Update user' : 'Save user'}
                        </Button>
                    </div>
                }
            >
                <form id="user-form" noValidate onSubmit={submit} className="space-y-4">
                    <div>
                        <Label required>Name</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Full name"
                        />
                        {errors.name ? (
                            <p className="mt-1 text-sm text-rose-600">{errors.name}</p>
                        ) : null}
                    </div>
                    <div>
                        <Label required>Email</Label>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="user@school.com"
                        />
                        {errors.email ? (
                            <p className="mt-1 text-sm text-rose-600">{errors.email}</p>
                        ) : null}
                    </div>
                    <div>
                        <Label required={!editing}>
                            {editing ? 'New password (optional)' : 'Password'}
                        </Label>
                        <Input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={editing ? 'Leave blank to keep current' : '••••••••'}
                            autoComplete="new-password"
                        />
                        {errors.password ? (
                            <p className="mt-1 text-sm text-rose-600">{errors.password}</p>
                        ) : null}
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select2
                            value={data.status}
                            onChange={(value) => setData('status', value)}
                            invalid={Boolean(errors.status)}
                            searchThreshold={Infinity}
                        >
                            {statusOptions.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </Select2>
                        {errors.status ? (
                            <p className="mt-1 text-sm text-rose-600">{errors.status}</p>
                        ) : null}
                    </div>
                    <div>
                        <Label className="mb-2 block">Roles</Label>
                        <div className="flex flex-wrap gap-2">
                            {roleOptions.map((role) => (
                                <label
                                    key={role}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 hover:border-teal-300 hover:bg-teal-50/50"
                                >
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                                        checked={data.roles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                    />
                                    {role}
                                </label>
                            ))}
                        </div>
                        {errors.roles ? (
                            <p className="mt-1 text-sm text-rose-600">{errors.roles}</p>
                        ) : null}
                    </div>
                </form>
            </SideDrawer>
        </AdminLayout>
    );
}
