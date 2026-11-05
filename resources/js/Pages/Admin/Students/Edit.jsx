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

export default function Edit({ student, guardian, genderOptions, statusOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        first_name: student.first_name,
        last_name: student.last_name,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        admission_date: student.admission_date,
        address: student.address ?? '',
        status: student.status,
        photo: null,
        guardian_full_name: guardian.full_name,
        guardian_phone: guardian.phone,
        guardian_email: guardian.email ?? '',
        guardian_relationship: guardian.relationship ?? 'parent',
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/admin/students/${student.id}`, { forceFormData: true });
    };

    return (
        <AdminLayout title={`Edit ${student.admission_number}`}>
            <PageHeader
                title="Edit student"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Students', href: '/admin/students' },
                    { label: student.admission_number },
                ]}
            />

            <Card>
                <CardContent className="pt-6">
                    <form noValidate onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="First name" required error={errors.first_name}>
                                <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                            </Field>
                            <Field label="Last name" required error={errors.last_name}>
                                <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                            </Field>
                            <Field label="Date of birth" required error={errors.date_of_birth}>
                                <Input type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                            </Field>
                            <Field label="Gender" required error={errors.gender}>
                                <Select2
                                    value={data.gender}
                                    onChange={(value) => setData('gender', value)}
                                    invalid={Boolean(errors.gender)}
                                    searchThreshold={Infinity}
                                >
                                    {genderOptions.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </Select2>
                            </Field>
                            <Field label="Admission date" required error={errors.admission_date}>
                                <Input type="date" value={data.admission_date} onChange={(e) => setData('admission_date', e.target.value)} />
                            </Field>
                            <Field label="Status" required error={errors.status}>
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
                            </Field>
                            <Field label="Photo" error={errors.photo}>
                                <Input type="file" accept="image/*" onChange={(e) => setData('photo', e.target.files[0])} />
                                {student.photo_url && (
                                    <img src={student.photo_url} alt="" className="mt-2 h-16 w-16 rounded-lg object-cover" />
                                )}
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="Address" error={errors.address}>
                                    <textarea
                                        className="min-h-[80px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-6">
                            <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Primary guardian</h2>
                            <Field label="Full name" required error={errors.guardian_full_name}>
                                <Input value={data.guardian_full_name} onChange={(e) => setData('guardian_full_name', e.target.value)} />
                            </Field>
                            <Field label="Phone" required error={errors.guardian_phone}>
                                <PhoneInput value={data.guardian_phone} onChange={(value) => setData('guardian_phone', value)} invalid={Boolean(errors.guardian_phone)} />
                            </Field>
                            <Field label="Email" error={errors.guardian_email}>
                                <Input type="email" value={data.guardian_email} onChange={(e) => setData('guardian_email', e.target.value)} />
                            </Field>
                            <Field label="Relationship" error={errors.guardian_relationship}>
                                <Input
                                    value={data.guardian_relationship}
                                    onChange={(e) => setData('guardian_relationship', e.target.value)}
                                />
                            </Field>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/admin/students/${student.id}`}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
