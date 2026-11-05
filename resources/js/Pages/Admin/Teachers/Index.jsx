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
import { router, useForm } from '@inertiajs/react';
import { Eye, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const emptyCreate = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    joining_date: new Date().toISOString().slice(0, 10),
    status: 'active',
    photo: null,
};

const emptyEdit = {
    _method: 'put',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    joining_date: '',
    status: 'active',
    photo: null,
};

export default function Index({ teachers, filters, statusOptions }) {
    const [status, setStatus] = useState(filters.status || '');
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);

    const createForm = useForm(emptyCreate);
    const editForm = useForm(emptyEdit);

    const createPhotoPreview = useMemo(() => {
        if (createForm.data.photo instanceof File) {
            return URL.createObjectURL(createForm.data.photo);
        }
        return null;
    }, [createForm.data.photo]);

    const editPhotoPreview = useMemo(() => {
        if (editForm.data.photo instanceof File) {
            return URL.createObjectURL(editForm.data.photo);
        }
        return editing?.photo_url ?? null;
    }, [editForm.data.photo, editing?.photo_url]);

    useEffect(() => {
        if (!(createForm.data.photo instanceof File) || !createPhotoPreview) {
            return undefined;
        }
        return () => URL.revokeObjectURL(createPhotoPreview);
    }, [createForm.data.photo, createPhotoPreview]);

    useEffect(() => {
        if (!(editForm.data.photo instanceof File) || !editPhotoPreview?.startsWith?.('blob:')) {
            return undefined;
        }
        return () => URL.revokeObjectURL(editPhotoPreview);
    }, [editForm.data.photo, editPhotoPreview]);

    const openCreate = () => {
        setViewing(null);
        setEditing(null);
        editForm.reset();
        editForm.clearErrors();
        createForm.clearErrors();
        createForm.reset();
        createForm.setData({
            ...emptyCreate,
            joining_date: new Date().toISOString().slice(0, 10),
        });
        setCreating(true);
    };

    const closeCreate = () => {
        setCreating(false);
        createForm.reset();
        createForm.clearErrors();
    };

    const openView = (row) => {
        setCreating(false);
        setEditing(null);
        createForm.reset();
        createForm.clearErrors();
        editForm.reset();
        editForm.clearErrors();
        setViewing(row);
    };

    const closeView = () => {
        setViewing(null);
    };

    const openEdit = (row) => {
        setCreating(false);
        setViewing(null);
        createForm.reset();
        createForm.clearErrors();
        editForm.clearErrors();
        setEditing(row);
        editForm.setData({
            _method: 'put',
            first_name: row.first_name ?? '',
            last_name: row.last_name ?? '',
            email: row.email ?? '',
            phone: row.phone ?? '',
            qualification: row.qualification ?? '',
            specialization: row.specialization ?? '',
            joining_date: row.joining_date ?? '',
            status: row.status ?? 'active',
            photo: null,
        });
    };

    const closeEdit = () => {
        setEditing(null);
        editForm.reset();
        editForm.clearErrors();
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post('/admin/teachers', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeCreate,
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editing) {
            return;
        }
        editForm.post(`/admin/teachers/${editing.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeEdit,
        });
    };

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            '/admin/teachers',
            { ...filters, status: status || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filterToolbar = (
        <div className="flex flex-nowrap items-end gap-2">
            <ListingSearch
                url="/admin/teachers"
                filters={filters}
                defaultValue={filters.search}
                placeholder="Search name, email, ID…"
            />
            <form noValidate onSubmit={applyFilters} className="flex flex-nowrap items-end gap-2">
                <div>
                    <Label className="mb-1 block text-xs text-slate-500">Status</Label>
                    <Select2 value={status} onChange={setStatus} placeholder="All statuses" allowClear>
                        <option value="">All statuses</option>
                        {statusOptions.map((s) => (
                            <option key={s} value={s}>
                                {s.replace('_', ' ')}
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
        <AdminLayout title="Teachers">
            <PageHeader
                title="All Teachers"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Teacher Management' }]}
                action={{ label: 'Add teacher', onClick: openCreate }}
            />

            <ListingCard
                title="All teachers"
                total={teachers.total}
                filters={filters}
                perPageUrl="/admin/teachers"
                toolbar={filterToolbar}
                isEmpty={teachers.data.length === 0}
                emptyTitle="No teachers found"
                emptyDescription="Add a teacher or adjust your filters."
                emptyAction={<Button onClick={openCreate}>Add teacher</Button>}
                paginator={teachers}
            >
                <DataTable minWidth="800px">
                    <DataTableHead>
                        <Th>Teacher</Th>
                        <Th>Contact</Th>
                        <Th>Joined</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {teachers.data.map((t) => (
                            <Tr key={t.id}>
                                <Td>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(t)}
                                        className="flex w-full items-center gap-3 rounded-lg text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                        title="Edit teacher"
                                    >
                                        {t.photo_url ? (
                                            <img
                                                src={t.photo_url}
                                                alt=""
                                                className="h-9 w-9 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                                                {t.full_name?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-900 hover:text-teal-700">
                                                {t.full_name}
                                            </p>
                                            <p className="font-mono text-xs text-slate-500">
                                                {t.employee_number}
                                            </p>
                                        </div>
                                    </button>
                                </Td>
                                <Td className="text-slate-600">
                                    <p>{t.email || '—'}</p>
                                    <p className="text-xs">{t.phone || '—'}</p>
                                </Td>
                                <Td className="text-slate-600">{t.joining_date}</Td>
                                <Td>
                                    <StatusBadge status={t.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="View teacher"
                                            onClick={() => openView(t)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Edit teacher"
                                            onClick={() => openEdit(t)}
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
                open={Boolean(viewing)}
                onClose={closeView}
                title="Teacher details"
                description={viewing?.employee_number}
                size="xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeView}>
                            Close
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (viewing) {
                                    openEdit(viewing);
                                }
                            }}
                        >
                            Edit teacher
                        </Button>
                    </div>
                }
            >
                {viewing && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            {viewing.photo_url ? (
                                <img
                                    src={viewing.photo_url}
                                    alt=""
                                    className="h-16 w-16 rounded-xl object-cover shadow-sm"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-xl font-bold text-brand-700">
                                    {viewing.full_name?.charAt(0)}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="font-display text-lg font-semibold text-ink-900">
                                    {viewing.full_name}
                                </h3>
                                <p className="font-mono text-xs text-slate-500">{viewing.employee_number}</p>
                                <div className="mt-2">
                                    <StatusBadge status={viewing.status} />
                                </div>
                            </div>
                        </div>

                        <dl className="grid gap-3 sm:grid-cols-2">
                            <ViewField label="Email" value={viewing.email} />
                            <ViewField label="Phone" value={viewing.phone} />
                            <ViewField label="Joining date" value={viewing.joining_date} />
                            <ViewField label="Status" value={viewing.status} capitalize />
                            <ViewField label="Qualification" value={viewing.qualification} />
                            <ViewField label="Specialization" value={viewing.specialization} />
                        </dl>

                        <div>
                            <div className="mb-2.5 flex items-center justify-between gap-2">
                                <h4 className="text-sm font-semibold text-slate-900">Class assignments</h4>
                                <span className="text-xs text-slate-500">
                                    {(viewing.assignments ?? []).length} record
                                    {(viewing.assignments ?? []).length === 1 ? '' : 's'}
                                </span>
                            </div>
                            {(viewing.assignments ?? []).length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
                                    No class assignments yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[360px] text-left text-sm">
                                        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            <tr>
                                                <th className="px-3 py-2.5">Session</th>
                                                <th className="px-3 py-2.5">Class</th>
                                                <th className="px-3 py-2.5">Subject</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {viewing.assignments.map((a) => (
                                                <tr key={a.id} className="hover:bg-teal-50/30">
                                                    <td className="px-3 py-2.5 text-slate-700">{a.session || '—'}</td>
                                                    <td className="px-3 py-2.5 text-slate-700">
                                                        {a.class_name || '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-700">
                                                        {a.subject_name || '—'}
                                                        {a.subject_code ? (
                                                            <span className="ml-1 font-mono text-xs text-slate-400">
                                                                ({a.subject_code})
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SideDrawer>

            <SideDrawer
                open={creating}
                onClose={closeCreate}
                title="Add teacher"
                description="Create a new teacher profile"
                size="xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeCreate}>
                            Cancel
                        </Button>
                        <Button type="submit" form="teacher-create-form" disabled={createForm.processing}>
                            Save teacher
                        </Button>
                    </div>
                }
            >
                <TeacherForm
                    formId="teacher-create-form"
                    data={createForm.data}
                    setData={createForm.setData}
                    errors={createForm.errors}
                    statusOptions={statusOptions}
                    photoPreview={createPhotoPreview}
                    onSubmit={submitCreate}
                />
            </SideDrawer>

            <SideDrawer
                open={Boolean(editing)}
                onClose={closeEdit}
                title="Edit teacher"
                description={editing?.employee_number}
                size="xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeEdit}>
                            Cancel
                        </Button>
                        <Button type="submit" form="teacher-edit-form" disabled={editForm.processing}>
                            Save changes
                        </Button>
                    </div>
                }
            >
                <TeacherForm
                    formId="teacher-edit-form"
                    data={editForm.data}
                    setData={editForm.setData}
                    errors={editForm.errors}
                    statusOptions={statusOptions}
                    photoPreview={editPhotoPreview}
                    onSubmit={submitEdit}
                />
            </SideDrawer>
        </AdminLayout>
    );
}

function TeacherForm({ formId, data, setData, errors, statusOptions, photoPreview, onSubmit }) {
    return (
        <form id={formId} noValidate onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required error={errors.first_name}>
                <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
            </Field>
            <Field label="Last name" required error={errors.last_name}>
                <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
            </Field>
            <Field label="Email" required error={errors.email}>
                <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                />
            </Field>
            <Field label="Phone" required error={errors.phone}>
                <PhoneInput
                    value={data.phone}
                    onChange={(value) => setData('phone', value)}
                    invalid={Boolean(errors.phone)}
                />
            </Field>
            <Field label="Qualification" error={errors.qualification}>
                <Input
                    value={data.qualification}
                    onChange={(e) => setData('qualification', e.target.value)}
                />
            </Field>
            <Field label="Specialization" error={errors.specialization}>
                <Input
                    value={data.specialization}
                    onChange={(e) => setData('specialization', e.target.value)}
                />
            </Field>
            <Field label="Joining date" required error={errors.joining_date}>
                <Input
                    type="date"
                    value={data.joining_date}
                    onChange={(e) => setData('joining_date', e.target.value)}
                />
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
            <Field label="Photo" error={errors.photo} className="sm:col-span-2">
                {photoPreview ? (
                    <img
                        src={photoPreview}
                        alt=""
                        className="mb-2 h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                ) : null}
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setData('photo', e.target.files?.[0] ?? null)}
                />
                {data.photo instanceof File && (
                    <p className="mt-1 truncate text-xs text-slate-500">{data.photo.name}</p>
                )}
            </Field>
        </form>
    );
}

function Field({ label, error, children, required = false, className = '' }) {
    return (
        <div className={className}>
            <Label className="mb-1.5 block" required={required}>
                {label}
            </Label>
            {children}
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}

function ViewField({ label, value, capitalize = false }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
            <dd className={`mt-1 text-sm font-medium text-slate-900 ${capitalize ? 'capitalize' : ''}`}>
                {value || '—'}
            </dd>
        </div>
    );
}
