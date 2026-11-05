import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { Link, useForm } from '@inertiajs/react';

export default function Create({ roleOptions, statusOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        status: 'active',
        roles: [],
    });

    const toggleRole = (role) => {
        setData(
            'roles',
            data.roles.includes(role) ? data.roles.filter((r) => r !== role) : [...data.roles, role],
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post('/admin/users');
    };

    return (
        <AdminLayout title="Add User">
            <PageHeader
                title="Add User"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Users', href: '/admin/users' },
                    { label: 'Create' },
                ]}
            />
            <Card>
                <CardContent className="pt-6">
                    <form noValidate onSubmit={submit} className="mx-auto max-w-lg space-y-4">
                        <div>
                            <Label required>Name</Label>
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
                        </div>
                        <div>
                            <Label required>Email</Label>
                            <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
                        </div>
                        <div>
                            <Label required>Password</Label>
                            <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                            {errors.password && <p className="text-xs text-rose-600">{errors.password}</p>}
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
                        </div>
                        <div>
                            <Label className="mb-2 block">Roles</Label>
                            <div className="flex flex-wrap gap-2">
                                {roleOptions.map((role) => (
                                    <label key={role} className="flex items-center gap-1 rounded border px-2 py-1 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={data.roles.includes(role)}
                                            onChange={() => toggleRole(role)}
                                        />
                                        {role}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>
                            <Link href="/admin/users" className="text-sm text-slate-600 hover:underline">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
