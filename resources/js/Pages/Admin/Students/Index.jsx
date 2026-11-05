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
import { PhoneInput } from '@/Components/ui/PhoneInput';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { Link, router, useForm } from '@inertiajs/react';
import { Eye, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const emptyEdit = {
    _method: 'put',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    admission_date: '',
    address: '',
    status: 'active',
    photo: null,
    guardian_full_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: 'parent',
};

export default function Index({
    students,
    filters,
    sessionOptions,
    classOptions,
    statusOptions,
    genderOptions = ['male', 'female', 'other'],
}) {
    const [sessionId, setSessionId] = useState(filters.session_id || '');
    const [classId, setClassId] = useState(filters.class_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [editing, setEditing] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm(emptyEdit);

    const photoPreview = useMemo(() => {
        if (data.photo instanceof File) {
            return URL.createObjectURL(data.photo);
        }
        return editing?.photo_url ?? null;
    }, [data.photo, editing?.photo_url]);

    useEffect(() => {
        if (!(data.photo instanceof File) || !photoPreview) {
            return undefined;
        }
        return () => URL.revokeObjectURL(photoPreview);
    }, [data.photo, photoPreview]);

    const openEdit = (row) => {
        clearErrors();
        setEditing(row);
        setData({
            _method: 'put',
            first_name: row.first_name ?? '',
            last_name: row.last_name ?? '',
            date_of_birth: row.date_of_birth ?? '',
            gender: row.gender ?? 'male',
            admission_date: row.admission_date ?? '',
            address: row.address ?? '',
            status: row.status ?? 'active',
            photo: null,
            guardian_full_name: row.guardian_name ?? '',
            guardian_phone: row.guardian_phone ?? '',
            guardian_email: row.guardian_email ?? '',
            guardian_relationship: row.guardian_relationship ?? 'parent',
        });
    };

    const closeEdit = () => {
        setEditing(null);
        reset();
        clearErrors();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        post(`/admin/students/${editing.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeEdit,
        });
    };

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            '/admin/students',
            {
                ...filters,
                status: status || undefined,
                session_id: sessionId || undefined,
                class_id: classId || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filterToolbar = (
        <div className="flex flex-nowrap items-end gap-2">
            <ListingSearch
                url="/admin/students"
                filters={filters}
                defaultValue={filters.search}
                placeholder="Search students…"
            />
            <form noValidate onSubmit={applyFilters} className="flex flex-nowrap items-end gap-2">
                <div>
                    <Label className="mb-1 block text-xs text-slate-500">Session</Label>
                    <Select2 value={sessionId} onChange={setSessionId} placeholder="Current session" allowClear>
                        <option value="">Current session</option>
                        {sessionOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                                {s.is_current ? ' (current)' : ''}
                            </option>
                        ))}
                    </Select2>
                </div>
                <div>
                    <Label className="mb-1 block text-xs text-slate-500">Class</Label>
                    <Select2 value={classId} onChange={setClassId} placeholder="All classes" allowClear>
                        <option value="">All classes</option>
                        {classOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </Select2>
                </div>
                <div>
                    <Label className="mb-1 block text-xs text-slate-500">Status</Label>
                    <Select2 value={status} onChange={setStatus} placeholder="All" allowClear>
                        <option value="">All</option>
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
        <AdminLayout title="Students">
            <PageHeader
                title="All Students"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Student Management' }]}
            />

            <ListingCard
                title="All students"
                total={students.total}
                filters={filters}
                perPageUrl="/admin/students"
                toolbar={filterToolbar}
                isEmpty={students.data.length === 0}
                emptyTitle="No students found"
                emptyDescription="Approve a student admission or adjust your filters."
                paginator={students}
            >
                <DataTable minWidth="960px">
                    <DataTableHead>
                        <Th>Student</Th>
                        <Th>Admission #</Th>
                        <Th>Class</Th>
                        <Th>Roll</Th>
                        <Th>Guardian</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {students.data.map((row) => (
                            <Tr key={row.id}>
                                <Td>
                                    <div className="flex items-center gap-3">
                                        {row.photo_url ? (
                                            <img src={row.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                                                {row.full_name?.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-medium text-slate-900">{row.full_name}</span>
                                    </div>
                                </Td>
                                <Td className="font-mono text-xs text-slate-600">{row.admission_number}</Td>
                                <Td className="text-slate-600">{row.class_name ?? '—'}</Td>
                                <Td className="text-slate-600">{row.roll_number ?? '—'}</Td>
                                <Td className="text-slate-600">
                                    <div>{row.guardian_name ?? '—'}</div>
                                    <div className="text-xs text-slate-400">{row.guardian_phone}</div>
                                </Td>
                                <Td>
                                    <StatusBadge status={row.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button variant="ghost" size="icon" asChild title="View student">
                                            <Link href={`/admin/students/${row.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Edit student"
                                            onClick={() => openEdit(row)}
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
                open={Boolean(editing)}
                onClose={closeEdit}
                title="Edit student"
                description={editing?.admission_number}
                size="xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeEdit}>
                            Cancel
                        </Button>
                        <Button type="submit" form="student-edit-form" disabled={processing}>
                            Save changes
                        </Button>
                    </div>
                }
            >
                <form id="student-edit-form" noValidate onSubmit={submitEdit} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
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
                        <Field label="Admission date" required error={errors.admission_date}>
                            <Input
                                type="date"
                                value={data.admission_date}
                                onChange={(e) => setData('admission_date', e.target.value)}
                            />
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
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt=""
                                    className="mb-2 h-20 w-20 rounded-lg border border-slate-200 object-cover"
                                />
                            ) : (
                                <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                                    No photo
                                </div>
                            )}
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setData('photo', e.target.files?.[0] ?? null)}
                            />
                            {data.photo instanceof File && (
                                <p className="mt-1 truncate text-xs text-slate-500">{data.photo.name}</p>
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

                    <div className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Primary guardian
                        </h2>
                        <Field label="Full name" required error={errors.guardian_full_name}>
                            <Input
                                value={data.guardian_full_name}
                                onChange={(e) => setData('guardian_full_name', e.target.value)}
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
                        <Field label="Relationship" error={errors.guardian_relationship}>
                            <Input
                                value={data.guardian_relationship}
                                onChange={(e) => setData('guardian_relationship', e.target.value)}
                            />
                        </Field>
                    </div>
                </form>
            </SideDrawer>
        </AdminLayout>
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
