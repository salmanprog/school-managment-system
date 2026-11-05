import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { PhoneInput } from '@/Components/ui/PhoneInput';
import { Select2 } from '@/Components/ui/Select2';
import { Link, useForm } from '@inertiajs/react';

function Field({ label, error, children, required = false }) {
    return (
        <div>
            <Label className="mb-1.5 block" required={required}>{label}</Label>
            {children}
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}

export default function Edit({ teacher, statusOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email ?? '',
        phone: teacher.phone ?? '',
        qualification: teacher.qualification ?? '',
        specialization: teacher.specialization ?? '',
        joining_date: teacher.joining_date,
        status: teacher.status,
        photo: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/admin/teachers/${teacher.id}`, { forceFormData: true });
    };

    return (
        <AdminLayout title={`Edit ${teacher.employee_number}`}>
            <PageHeader
                title="Edit teacher"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Teachers', href: '/admin/teachers' },
                    { label: teacher.employee_number },
                ]}
            />

            <Card>
                <CardContent className="pt-6">
                    <form noValidate onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                        <p className="text-sm text-slate-500">
                            Employee ID: <span className="font-mono">{teacher.employee_number}</span>
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="First name" required error={errors.first_name}>
                                <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                            </Field>
                            <Field label="Last name" required error={errors.last_name}>
                                <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                            </Field>
                            <Field label="Email" required error={errors.email}>
                                <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            </Field>
                            <Field label="Phone" required error={errors.phone}>
                                <PhoneInput value={data.phone} onChange={(value) => setData('phone', value)} invalid={Boolean(errors.phone)} />
                            </Field>
                            <Field label="Qualification" error={errors.qualification}>
                                <Input value={data.qualification} onChange={(e) => setData('qualification', e.target.value)} />
                            </Field>
                            <Field label="Specialization" error={errors.specialization}>
                                <Input value={data.specialization} onChange={(e) => setData('specialization', e.target.value)} />
                            </Field>
                            <Field label="Joining date" required error={errors.joining_date}>
                                <Input type="date" value={data.joining_date} onChange={(e) => setData('joining_date', e.target.value)} />
                            </Field>
                            <Field label="Status" error={errors.status}>
                                <Select2
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    invalid={Boolean(errors.status)}
                                    searchThreshold={Infinity}
                                >
                                    {statusOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s.replace('_', ' ')}
                                        </option>
                                    ))}
                                </Select2>
                            </Field>
                            <Field label="Photo" error={errors.photo}>
                                {teacher.photo_url && (
                                    <img src={teacher.photo_url} alt="" className="mb-2 h-16 w-16 rounded-lg object-cover" />
                                )}
                                <Input type="file" accept="image/*" onChange={(e) => setData('photo', e.target.files[0])} />
                            </Field>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>
                                Save changes
                            </Button>
                            <Button variant="secondary" asChild>
                                <Link href={`/admin/teachers/${teacher.id}`}>Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
