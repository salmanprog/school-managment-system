import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/Badge';
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
import { PhoneInput } from '@/Components/ui/PhoneInput';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { router, useForm } from '@inertiajs/react';
import { Eye, Plus } from 'lucide-react';
import { useState } from 'react';

function AppStatusBadge({ status }) {
    const variant =
        status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : status === 'pending' ? 'warning' : 'muted';
    return (
        <Badge variant={variant} className="capitalize">
            {status}
        </Badge>
    );
}

const emptyForm = {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    requested_class_id: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    previous_school: '',
    address: '',
    application_date: new Date().toISOString().slice(0, 10),
};

export default function Index({
    applications,
    filters,
    statusOptions,
    classOptions = [],
    genderOptions = ['male', 'female', 'other'],
    canCreate = false,
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [status, setStatus] = useState(filters.status || '');
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ ...emptyForm });

    const openCreate = () => {
        reset();
        clearErrors();
        setViewing(null);
        setData({
            ...emptyForm,
            application_date: new Date().toISOString().slice(0, 10),
        });
        setDrawerOpen(true);
    };

    const openView = (row) => {
        setDrawerOpen(false);
        setViewing(row);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        reset();
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        post('/admin/admissions', {
            preserveScroll: true,
            onSuccess: closeDrawer,
        });
    };

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            '/admin/admissions',
            { ...filters, status: status || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filterToolbar = (
        <div className="flex flex-nowrap items-end gap-2">
            <ListingSearch
                url="/admin/admissions"
                filters={filters}
                defaultValue={filters.search}
                placeholder="Search admissions…"
            />
            <form noValidate onSubmit={applyFilters} className="flex flex-nowrap items-end gap-2">
                <div>
                    <Label className="mb-1 block text-xs text-slate-500">Status</Label>
                    <Select2 value={status} onChange={setStatus} placeholder="All statuses" allowClear>
                        <option value="">All statuses</option>
                        {statusOptions.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </Select2>
                </div>
                <Button type="submit" variant="secondary">
                    Filter
                </Button>
            </form>
        </div>
    );

    return (
        <AdminLayout title="Student Admission">
            <PageHeader
                title="Student Admission"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Student Management' }, { label: 'Student Admission' }]}
                action={canCreate ? { label: 'New admission', onClick: openCreate } : undefined}
            />

            <ListingCard
                title="All admissions"
                total={applications.total}
                filters={filters}
                perPageUrl="/admin/admissions"
                toolbar={filterToolbar}
                isEmpty={applications.data.length === 0}
                emptyTitle="No admissions found"
                emptyDescription="Create a new admission or adjust your filters."
                emptyAction={
                    canCreate ? (
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            New admission
                        </Button>
                    ) : null
                }
                paginator={applications}
            >
                <DataTable minWidth="880px">
                    <DataTableHead>
                        <Th>Admission #</Th>
                        <Th>Applicant</Th>
                        <Th>Class</Th>
                        <Th>Guardian</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {applications.data.map((row) => (
                            <Tr key={row.id}>
                                <Td className="font-mono text-xs text-slate-600">{row.application_number}</Td>
                                <Td>
                                    <button
                                        type="button"
                                        onClick={() => openView(row)}
                                        className="font-medium text-teal-700 hover:text-teal-800 hover:underline"
                                        title="View admission"
                                    >
                                        {row.full_name}
                                    </button>
                                </Td>
                                <Td className="text-slate-600">{row.requested_class?.name ?? '—'}</Td>
                                <Td className="text-slate-600">
                                    <div>{row.guardian_name}</div>
                                    <div className="text-xs text-slate-400">{row.guardian_phone}</div>
                                </Td>
                                <Td className="text-slate-600">{row.application_date}</Td>
                                <Td>
                                    <AppStatusBadge status={row.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="View admission"
                                            onClick={() => openView(row)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </RowActions>
                                </Td>
                            </Tr>
                        ))}
                    </DataTableBody>
                </DataTable>
            </ListingCard>

            <SideDrawer
                open={Boolean(viewing)}
                onClose={() => setViewing(null)}
                title="Admission details"
                description={viewing?.application_number}
                size="lg"
                footer={
                    viewing ? (
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setViewing(null)}>
                                Close
                            </Button>
                            {viewing.student ? (
                                <Button
                                    type="button"
                                    onClick={() => router.visit(`/admin/students/${viewing.student.id}`)}
                                >
                                    View student
                                </Button>
                            ) : viewing.status === 'pending' ? (
                                <Button
                                    type="button"
                                    onClick={() => router.visit(`/admin/admissions/${viewing.id}`)}
                                >
                                    Approve / reject
                                </Button>
                            ) : null}
                        </div>
                    ) : null
                }
            >
                {viewing && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-lg font-semibold text-slate-900">{viewing.full_name}</p>
                                <p className="font-mono text-xs text-slate-400">{viewing.application_number}</p>
                            </div>
                            <AppStatusBadge status={viewing.status} />
                        </div>

                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Detail label="Date of birth" value={viewing.date_of_birth || '—'} />
                            <Detail label="Gender" value={viewing.gender || '—'} />
                            <Detail label="Requested class" value={viewing.requested_class?.name ?? '—'} />
                            <Detail label="Admission date" value={viewing.application_date || '—'} />
                            <Detail label="Previous school" value={viewing.previous_school || '—'} />
                            <Detail label="Guardian" value={viewing.guardian_name || '—'} />
                            <Detail label="Guardian phone" value={viewing.guardian_phone || '—'} />
                            <Detail label="Guardian email" value={viewing.guardian_email || '—'} />
                            <Detail label="Address" value={viewing.address || '—'} className="sm:col-span-2" />
                            {viewing.rejection_reason ? (
                                <Detail
                                    label="Rejection reason"
                                    value={viewing.rejection_reason}
                                    className="sm:col-span-2"
                                />
                            ) : null}
                            {viewing.reviewer ? (
                                <Detail label="Reviewed by" value={viewing.reviewer.name} />
                            ) : null}
                            {viewing.student ? (
                                <Detail
                                    label="Student"
                                    value={`${viewing.student.full_name} (${viewing.student.admission_number})`}
                                    className="sm:col-span-2"
                                />
                            ) : null}
                        </dl>
                    </div>
                )}
            </SideDrawer>

            <SideDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                title="New admission"
                description="Submit a new admission for review."
                size="xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="admission-form" disabled={processing}>
                            Submit admission
                        </Button>
                    </div>
                }
            >
                <form id="admission-form" noValidate onSubmit={submit} className="space-y-6">
                    <section className="grid gap-4 sm:grid-cols-2">
                        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Student
                        </h2>
                        <Field label="First name" required error={errors.first_name}>
                            <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                        </Field>
                        <Field label="Last name" required error={errors.last_name}>
                            <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                        </Field>
                        <Field label="Date of birth" required error={errors.date_of_birth}>
                            <Input
                                type="date"
                                value={data.date_of_birth}
                                onChange={(e) => setData('date_of_birth', e.target.value)}
                            />
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
                        <Field label="Requested class" error={errors.requested_class_id}>
                            <Select2
                                value={data.requested_class_id}
                                onChange={(value) => setData('requested_class_id', value)}
                                placeholder="Select class"
                                invalid={Boolean(errors.requested_class_id)}
                            >
                                <option value="">Select class</option>
                                {classOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select2>
                        </Field>
                        <Field label="Admission date" error={errors.application_date}>
                            <Input
                                type="date"
                                value={data.application_date}
                                onChange={(e) => setData('application_date', e.target.value)}
                            />
                        </Field>
                        <Field label="Previous school" error={errors.previous_school}>
                            <Input
                                value={data.previous_school}
                                onChange={(e) => setData('previous_school', e.target.value)}
                            />
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
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2">
                        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Guardian
                        </h2>
                        <Field label="Full name" required error={errors.guardian_name}>
                            <Input
                                value={data.guardian_name}
                                onChange={(e) => setData('guardian_name', e.target.value)}
                            />
                        </Field>
                        <Field label="Phone" required error={errors.guardian_phone}>
                            <PhoneInput
                                value={data.guardian_phone}
                                onChange={(value) => setData('guardian_phone', value)}
                                invalid={Boolean(errors.guardian_phone)}
                            />
                        </Field>
                        <Field label="Email" error={errors.guardian_email}>
                            <Input
                                type="email"
                                value={data.guardian_email}
                                onChange={(e) => setData('guardian_email', e.target.value)}
                            />
                        </Field>
                    </section>
                </form>
            </SideDrawer>
        </AdminLayout>
    );
}

function Detail({ label, value, className = '' }) {
    return (
        <div className={className}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
        </div>
    );
}

function Field({ label, error, children, required = false }) {
    return (
        <div>
            <Label className="mb-1.5 block" required={required}>
                {label}
            </Label>
            {children}
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}
