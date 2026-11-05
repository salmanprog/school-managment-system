import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

function RoleCard({ role, allPermissions, canSync }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing } = useForm({
        permissions: role.permissions,
    });

    const toggle = (perm) => {
        setData(
            'permissions',
            data.permissions.includes(perm) ? data.permissions.filter((p) => p !== perm) : [...data.permissions, perm],
        );
    };

    const save = () => {
        put(`/admin/roles/${role.id}/permissions`, { preserveScroll: true, onSuccess: () => setOpen(false) });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{role.name}</CardTitle>
                <span className="text-xs text-slate-500">{role.permissions.length} permissions</span>
            </CardHeader>
            <CardContent>
                <p className="mb-2 line-clamp-2 text-sm text-slate-600">{role.permissions.slice(0, 8).join(', ')}</p>
                {canSync && (
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(!open)}>
                            {open ? 'Close editor' : 'Edit permissions'}
                        </Button>
                        {open && (
                            <div className="mt-4 max-h-64 overflow-y-auto rounded border p-3">
                                <div className="grid gap-1 sm:grid-cols-2">
                                    {allPermissions.map((perm) => (
                                        <label key={perm} className="flex items-center gap-1 text-xs">
                                            <input
                                                type="checkbox"
                                                checked={data.permissions.includes(perm)}
                                                onChange={() => toggle(perm)}
                                            />
                                            {perm}
                                        </label>
                                    ))}
                                </div>
                                <Button type="button" className="mt-3" size="sm" disabled={processing} onClick={save}>
                                    Save permissions
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function Index({ roles, allPermissions, canSync }) {
    return (
        <AdminLayout title="Roles">
            <PageHeader
                title="Roles & Permissions"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }, { label: 'Roles' }]}
            />
            <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                    <RoleCard key={role.id} role={role} allPermissions={allPermissions} canSync={canSync} />
                ))}
            </div>
        </AdminLayout>
    );
}
