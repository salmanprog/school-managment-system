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
import { confirmDelete } from '@/lib/swal';
import { router, useForm } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const emptyForm = { name: '', code: '', status: 'active', subject_ids: [] };

export default function Index({ classes, filters, statusOptions, subjectOptions = [] }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [detailsClass, setDetailsClass] = useState(null);
    const [subjectsClass, setSubjectsClass] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(emptyForm);

    const openCreate = () => {
        reset();
        clearErrors();
        setEditing(null);
        setDetailsClass(null);
        setSubjectsClass(null);
        setData(emptyForm);
        setDrawerOpen(true);
    };

    const openEdit = (row) => {
        clearErrors();
        setDetailsClass(null);
        setSubjectsClass(null);
        setEditing(row);
        setData({
            name: row.name,
            code: row.code,
            status: row.status,
            subject_ids: (row.subject_ids ?? []).map((id) => Number(id)),
        });
        setDrawerOpen(true);
    };

    const openDetails = (row) => {
        setDrawerOpen(false);
        setSubjectsClass(null);
        setDetailsClass(row);
    };

    const openSubjects = (row) => {
        setDrawerOpen(false);
        setDetailsClass(null);
        setSubjectsClass(row);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setEditing(null);
        reset();
        clearErrors();
    };

    const toggleSubject = (subjectId, checked) => {
        const id = Number(subjectId);
        const current = data.subject_ids.map(Number);
        setData(
            'subject_ids',
            checked ? [...current, id] : current.filter((value) => value !== id),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(`/admin/classes/${editing.id}`, { preserveScroll: true, onSuccess: closeDrawer });
        } else {
            post('/admin/classes', { preserveScroll: true, onSuccess: closeDrawer });
        }
    };

    const destroy = async (id) => {
        if (await confirmDelete('this class')) {
            router.delete(`/admin/classes/${id}`, { preserveScroll: true });
        }
    };

    const isEmpty = classes.data.length === 0;
    const filterHint = filters.search ? `matching “${filters.search}”` : undefined;

    return (
        <AdminLayout title="Classes">
            <PageHeader
                title="Classes"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'School Setup' }, { label: 'Classes' }]}
                action={{ label: 'Add class', onClick: openCreate }}
            />

            <ListingCard
                title="All classes"
                total={classes.total}
                filterHint={filterHint}
                filters={filters}
                perPageUrl="/admin/classes"
                isEmpty={isEmpty}
                emptyTitle={filters.search ? 'No classes found' : 'No classes yet'}
                emptyDescription={
                    filters.search
                        ? 'Try a different search term or clear the filter.'
                        : 'Add a class and select its subjects.'
                }
                emptyAction={
                    !filters.search ? (
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Add class
                        </Button>
                    ) : null
                }
                paginator={classes}
                toolbar={
                    <ListingSearch
                        url="/admin/classes"
                        filters={filters}
                        defaultValue={filters.search}
                        placeholder="Search name or code…"
                    />
                }
            >
                <DataTable>
                    <DataTableHead>
                        <Th sortKey="name" sortUrl="/admin/classes" filters={filters}>
                            Name
                        </Th>
                        <Th sortKey="code" sortUrl="/admin/classes" filters={filters}>
                            Code
                        </Th>
                        <Th>Subjects</Th>
                        <Th sortKey="status" sortUrl="/admin/classes" filters={filters}>
                            Status
                        </Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {classes.data.map((row) => (
                            <Tr key={row.id}>
                                <Td>
                                    <button
                                        type="button"
                                        onClick={() => openDetails(row)}
                                        className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                                        title="View class details"
                                    >
                                        {row.name}
                                    </button>
                                </Td>
                                <Td mono>{row.code}</Td>
                                <Td>
                                    <button
                                        type="button"
                                        onClick={() => openSubjects(row)}
                                        className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-teal-50 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-teal-700 ring-1 ring-teal-100 hover:bg-teal-100"
                                        title="View assigned subjects"
                                    >
                                        {row.subjects_count ?? 0}
                                    </button>
                                </Td>
                                <Td>
                                    <StatusBadge status={row.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(row)}
                                            title="Edit class"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={() => destroy(row.id)}
                                            title="Delete class"
                                        >
                                            <Trash2 className="h-4 w-4" />
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
                title={editing ? 'Edit class' : 'Add class'}
                size="lg"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="class-form" disabled={processing}>
                            {editing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                }
            >
                <form id="class-form" noValidate onSubmit={submit} className="space-y-4">
                    <Field label="Name" required error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    </Field>
                    <Field label="Code" required error={errors.code}>
                        <Input value={data.code} onChange={(e) => setData('code', e.target.value)} />
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
                                    {s}
                                </option>
                            ))}
                        </Select2>
                    </Field>
                    <Field label="Subjects" error={errors.subject_ids}>
                        {subjectOptions.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                                No subjects yet. Create subjects first, then assign them here.
                            </p>
                        ) : (
                            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                                {subjectOptions.map((subject) => {
                                    const checked = data.subject_ids.map(Number).includes(Number(subject.id));
                                    return (
                                        <label
                                            key={subject.id}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                                checked={checked}
                                                onChange={(e) => toggleSubject(subject.id, e.target.checked)}
                                            />
                                            <span className="font-medium text-slate-800">{subject.name}</span>
                                            <span className="font-mono text-xs text-slate-400">{subject.code}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </Field>
                </form>
            </SideDrawer>

            <SideDrawer
                open={Boolean(detailsClass)}
                onClose={() => setDetailsClass(null)}
                title="Class details"
                description={detailsClass ? detailsClass.name : undefined}
                footer={
                    detailsClass ? (
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDetailsClass(null)}>
                                Close
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    const row = detailsClass;
                                    setDetailsClass(null);
                                    openEdit(row);
                                }}
                            >
                                <Pencil className="h-4 w-4" />
                                Edit class
                            </Button>
                        </div>
                    ) : null
                }
            >
                {detailsClass && (
                    <div className="space-y-5">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Detail label="Name" value={detailsClass.name} />
                            <Detail label="Code" value={detailsClass.code} mono />
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                                <dd className="mt-1">
                                    <StatusBadge status={detailsClass.status} />
                                </dd>
                            </div>
                            <Detail
                                label="Subjects assigned"
                                value={detailsClass.subjects_count ?? detailsClass.subjects?.length ?? 0}
                            />
                        </dl>

                        <div>
                            <h3 className="mb-2 text-sm font-semibold text-slate-800">Assigned subjects</h3>
                            {(detailsClass.subjects ?? []).length === 0 ? (
                                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                                    No subjects assigned to this class yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                                    {detailsClass.subjects.map((subject) => (
                                        <li key={subject.id} className="flex items-center gap-3 px-3 py-2.5">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                                                <BookOpen className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-900">{subject.name}</p>
                                                <p className="font-mono text-xs text-slate-400">{subject.code}</p>
                                            </div>
                                            <StatusBadge status={subject.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </SideDrawer>

            <SideDrawer
                open={Boolean(subjectsClass)}
                onClose={() => setSubjectsClass(null)}
                title="Assigned subjects"
                description={subjectsClass ? subjectsClass.name : undefined}
                footer={
                    subjectsClass ? (
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setSubjectsClass(null)}>
                                Close
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    const row = subjectsClass;
                                    setSubjectsClass(null);
                                    openEdit(row);
                                }}
                            >
                                Manage subjects
                            </Button>
                        </div>
                    ) : null
                }
            >
                {subjectsClass && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-500">
                            {(subjectsClass.subjects ?? []).length} subject
                            {(subjectsClass.subjects ?? []).length === 1 ? '' : 's'} selected for this class.
                        </p>
                        {(subjectsClass.subjects ?? []).length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                                No subjects assigned yet. Edit the class to select subjects.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {subjectsClass.subjects.map((subject, index) => (
                                    <li
                                        key={subject.id}
                                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                            {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">{subject.name}</p>
                                            <p className="font-mono text-xs text-slate-400">{subject.code}</p>
                                        </div>
                                        <StatusBadge status={subject.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </SideDrawer>
        </AdminLayout>
    );
}

function Detail({ label, value, mono = false }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className={`mt-1 text-sm font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
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
