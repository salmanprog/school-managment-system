import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { FormField } from '@/Components/ui/FormField';
import { Input } from '@/Components/ui/Input';
import { PhoneInput } from '@/Components/ui/PhoneInput';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function SchoolProfile({ setting }) {
    const fileRef = useRef(null);
    const { data, setData, post, processing, errors, transform } = useForm({
        _method: 'put',
        school_name: setting.school_name ?? '',
        school_code: setting.school_code ?? '',
        registration_number: setting.registration_number ?? '',
        email: setting.email ?? '',
        phone: setting.phone ?? '',
        address: setting.address ?? '',
        city: setting.city ?? '',
        country: setting.country ?? '',
        principal_name: setting.principal_name ?? '',
        currency: setting.currency ?? 'USD',
        timezone: setting.timezone ?? 'UTC',
        academic_year_format: setting.academic_year_format ?? '',
        logo: null,
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) => ({ ...form, _method: 'put' }));
        post('/admin/school-profile', { forceFormData: true, preserveScroll: true });
    };

    const logoPreview = data.logo ? URL.createObjectURL(data.logo) : setting.logo_url;

    return (
        <AdminLayout title="School Profile">
            <PageHeader
                title="School Profile"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'School Profile' }]}
            />

            <form onSubmit={submit} noValidate>
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <FormField label="School name" required error={errors.school_name} className="sm:col-span-2">
                                <Input
                                    value={data.school_name}
                                    onChange={(e) => setData('school_name', e.target.value)}
                                    invalid={Boolean(errors.school_name)}
                                    placeholder="e.g. Demo High School"
                                />
                            </FormField>
                            <FormField label="School code" error={errors.school_code}>
                                <Input
                                    value={data.school_code}
                                    onChange={(e) => setData('school_code', e.target.value)}
                                    invalid={Boolean(errors.school_code)}
                                />
                            </FormField>
                            <FormField label="Registration number" error={errors.registration_number}>
                                <Input
                                    value={data.registration_number}
                                    onChange={(e) => setData('registration_number', e.target.value)}
                                    invalid={Boolean(errors.registration_number)}
                                />
                            </FormField>
                            <FormField label="Email" required error={errors.email}>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    invalid={Boolean(errors.email)}
                                    placeholder="info@school.edu"
                                />
                            </FormField>
                            <FormField
                                label="Phone"
                                required
                                error={errors.phone}
                                hint="Format: 92000-000-0000"
                            >
                                <PhoneInput
                                    value={data.phone}
                                    onChange={(value) => setData('phone', value)}
                                    invalid={Boolean(errors.phone)}
                                />
                            </FormField>
                            <FormField label="Principal name" required error={errors.principal_name} className="sm:col-span-2">
                                <Input
                                    value={data.principal_name}
                                    onChange={(e) => setData('principal_name', e.target.value)}
                                    invalid={Boolean(errors.principal_name)}
                                />
                            </FormField>
                            <FormField label="Address" error={errors.address} className="sm:col-span-2">
                                <textarea
                                    className={`flex min-h-[80px] w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 ${
                                        errors.address
                                            ? 'border-rose-400 focus-visible:ring-rose-400'
                                            : 'border-slate-300 focus-visible:ring-teal-500'
                                    }`}
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                            </FormField>
                            <FormField label="City" error={errors.city}>
                                <Input
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    invalid={Boolean(errors.city)}
                                />
                            </FormField>
                            <FormField label="Country" error={errors.country}>
                                <Input
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                    invalid={Boolean(errors.country)}
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Logo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {logoPreview && (
                                    <img
                                        src={logoPreview}
                                        alt="School logo"
                                        className="mx-auto h-24 w-24 rounded-lg border border-slate-200 object-contain"
                                    />
                                )}
                                <Input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    invalid={Boolean(errors.logo)}
                                    onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                />
                                {errors.logo && <p className="text-xs font-medium text-rose-600">{errors.logo}</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Regional</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField label="Currency" error={errors.currency}>
                                    <Input
                                        value={data.currency}
                                        onChange={(e) => setData('currency', e.target.value)}
                                        invalid={Boolean(errors.currency)}
                                    />
                                </FormField>
                                <FormField label="Timezone" error={errors.timezone}>
                                    <Input
                                        value={data.timezone}
                                        onChange={(e) => setData('timezone', e.target.value)}
                                        invalid={Boolean(errors.timezone)}
                                    />
                                </FormField>
                                <FormField label="Academic year format" error={errors.academic_year_format}>
                                    <Input
                                        value={data.academic_year_format}
                                        onChange={(e) => setData('academic_year_format', e.target.value)}
                                        invalid={Boolean(errors.academic_year_format)}
                                        placeholder="YYYY–YYYY"
                                    />
                                </FormField>
                            </CardContent>
                        </Card>

                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing ? 'Saving…' : 'Save changes'}
                        </Button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
