import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
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
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Modal } from '@/Components/ui/Modal';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { confirmDelete } from '@/lib/swal';
import { router, useForm } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const emptyForm = {
    exam_id: '',
    class_id: '',
    subject_id: '',
    exam_date: '',
    start_time: '09:00',
    end_time: '11:00',
    total_marks: '100',
    passing_marks: '33',
};

export default function Index({
    groups,
    sessionOptions = [],
    examTypeOptions = [],
    examOptions,
    classOptions,
    subjectsByClass = {},
    filters,
}) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewGroup, setViewGroup] = useState(null);
    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm(emptyForm);

    const applyFilters = (next = {}) => {
        router.get(
            '/admin/exams/schedules',
            {
                session_id:
                    next.session_id !== undefined
                        ? next.session_id || undefined
                        : filters.session_id || undefined,
                exam_type_id:
                    next.exam_type_id !== undefined
                        ? next.exam_type_id || undefined
                        : filters.exam_type_id || undefined,
                exam_id:
                    next.exam_id !== undefined ? next.exam_id || undefined : filters.exam_id || undefined,
                per_page: filters.per_page || undefined,
            },
            { preserveState: true },
        );
    };

    const filteredExamOptions = useMemo(() => {
        if (!filters.exam_type_id) {
            return examOptions;
        }

        return examOptions.filter(
            (exam) => String(exam.exam_type_id) === String(filters.exam_type_id),
        );
    }, [examOptions, filters.exam_type_id]);

    const classSubjects = useMemo(() => {
        if (!data.class_id) {
            return [];
        }

        return subjectsByClass[String(data.class_id)] || [];
    }, [data.class_id, subjectsByClass]);

    const openCreate = () => {
        reset();
        clearErrors();
        setEditing(null);
        setData({
            ...emptyForm,
            exam_id: filters.exam_id || (viewGroup ? String(viewGroup.exam_id) : ''),
            class_id: viewGroup ? String(viewGroup.class_id || '') : '',
        });
        setDrawerOpen(true);
    };

    const openEdit = (row) => {
        clearErrors();
        setEditing(row);
        setData({
            exam_id: String(row.exam_id),
            class_id: String(row.class_id || ''),
            subject_id: String(row.subject_id),
            exam_date: row.exam_date,
            start_time: row.start_time,
            end_time: row.end_time,
            total_marks: String(row.total_marks),
            passing_marks: String(row.passing_marks),
        });
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setEditing(null);
        reset();
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => {
                closeDrawer();
                // Keep modal open; page reload will refresh group data via Inertia.
            },
        };
        if (editing) put(`/admin/exams/schedules/${editing.id}`, opts);
        else post('/admin/exams/schedules', opts);
    };

    const rows = groups?.data || [];
    const isEmpty = rows.length === 0;

    // Keep modal in sync after create/update/delete (fresh props).
    const activeViewGroup = useMemo(() => {
        if (!viewGroup) {
            return null;
        }

        return rows.find((row) => row.key === viewGroup.key) || null;
    }, [rows, viewGroup]);

    return (
        <AdminLayout title="Exam Schedules">
            <PageHeader
                title="Exam Schedules"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Exams' }, { label: 'Schedules' }]}
                action={{ label: 'Add schedule', onClick: openCreate }}
            />

            <ListingCard
                title="All schedules"
                total={groups.total}
                filterHint={
                    filters.exam_type_id || filters.exam_id ? 'for selected filters' : undefined
                }
                filters={filters}
                perPageUrl="/admin/exams/schedules"
                isEmpty={isEmpty}
                emptyTitle="No schedules"
                emptyDescription="Add exam schedules for classes and subjects."
                emptyAction={
                    <Button type="button" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add schedule
                    </Button>
                }
                paginator={groups}
                toolbar={
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-44">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Session
                            </Label>
                            <Select2
                                value={filters.session_id || ''}
                                onChange={(value) =>
                                    applyFilters({
                                        session_id: value || '',
                                        exam_id: '',
                                    })
                                }
                                placeholder="Session"
                                searchThreshold={Infinity}
                            >
                                {sessionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                        {s.is_current ? ' (current)' : ''}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                        <div className="w-48">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Exam Type
                            </Label>
                            <Select2
                                value={filters.exam_type_id || ''}
                                onChange={(value) =>
                                    applyFilters({
                                        exam_type_id: value || '',
                                        exam_id: '',
                                    })
                                }
                                placeholder="All exam types"
                                allowClear
                                searchThreshold={Infinity}
                            >
                                <option value="">All exam types</option>
                                {examTypeOptions.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                        <div className="w-56">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Exam
                            </Label>
                            <Select2
                                value={filters.exam_id || ''}
                                onChange={(value) => applyFilters({ exam_id: value || '' })}
                                placeholder="All exams"
                                allowClear
                                searchThreshold={Infinity}
                            >
                                <option value="">All exams</option>
                                {filteredExamOptions.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                    </div>
                }
            >
                <DataTable minWidth="720px">
                    <DataTableHead>
                        <Th>Exam type</Th>
                        <Th>Exam</Th>
                        <Th>Class</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {rows.map((row) => (
                            <Tr key={row.key}>
                                <Td>
                                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                        {row.exam_type || '—'}
                                    </span>
                                </Td>
                                <Td className="font-semibold text-ink-900">{row.exam_name}</Td>
                                <Td className="text-slate-700">
                                    <p className="font-medium">{row.class_name}</p>
                                    <p className="text-xs text-slate-400">
                                        {row.subjects_count} subject{row.subjects_count === 1 ? '' : 's'}
                                    </p>
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="View schedule"
                                            onClick={() => setViewGroup(row)}
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

            <Modal
                open={Boolean(activeViewGroup)}
                onClose={() => setViewGroup(null)}
                title={activeViewGroup?.class_name || 'Class schedule'}
                description={
                    activeViewGroup
                        ? `${activeViewGroup.exam_type || 'Exam'} · ${activeViewGroup.exam_name}`
                        : undefined
                }
                size="xl"
                footer={
                    <div className="flex justify-between gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                openCreate();
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            Add subject
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setViewGroup(null)}>
                            Close
                        </Button>
                    </div>
                }
            >
                {activeViewGroup ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class</p>
                            <p className="mt-0.5 font-semibold text-ink-900">{activeViewGroup.class_name}</p>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2.5 font-semibold">Subject</th>
                                        <th className="px-3 py-2.5 font-semibold">Date</th>
                                        <th className="px-3 py-2.5 font-semibold">Time</th>
                                        <th className="px-3 py-2.5 font-semibold">Marks</th>
                                        <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeViewGroup.schedules || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                                                No subjects scheduled for this class yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        activeViewGroup.schedules.map((item) => (
                                            <tr key={item.id} className="border-t border-slate-100">
                                                <td className="px-3 py-2.5 font-medium text-ink-900">
                                                    {item.subject_name}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-600">{item.exam_date}</td>
                                                <td className="px-3 py-2.5 tabular-nums text-slate-600">
                                                    {item.start_time}–{item.end_time}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-600">
                                                    {item.total_marks} (pass {item.passing_marks})
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Edit"
                                                            onClick={() => openEdit(item)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                            title="Delete"
                                                            onClick={async () => {
                                                                if (await confirmDelete('this subject schedule')) {
                                                                    router.delete(
                                                                        `/admin/exams/schedules/${item.id}`,
                                                                        { preserveScroll: true },
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <SideDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                title={`${editing ? 'Edit' : 'New'} schedule`}
                size="lg"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="exam-schedule-form" disabled={processing}>
                            Save
                        </Button>
                    </div>
                }
            >
                <form id="exam-schedule-form" noValidate onSubmit={submit} className="space-y-3">
                    <div>
                        <Label required>Exam</Label>
                        <Select2
                            value={data.exam_id}
                            onChange={(value) => setData('exam_id', value)}
                            placeholder="Select exam"
                        >
                            <option value="">Select</option>
                            {examOptions.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name}
                                </option>
                            ))}
                        </Select2>
                    </div>
                    <div>
                        <Label required>Class</Label>
                        <Select2
                            value={data.class_id}
                            onChange={(value) => setData({ ...data, class_id: value, subject_id: '' })}
                            placeholder="Select"
                        >
                            <option value="">Select</option>
                            {classOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select2>
                    </div>
                    <div>
                        <Label required>Subject</Label>
                        <Select2
                            value={data.subject_id}
                            onChange={(value) => setData('subject_id', value)}
                            placeholder={data.class_id ? 'Select subject' : 'Select class first'}
                            disabled={!data.class_id}
                        >
                            <option value="">
                                {data.class_id ? 'Select subject' : 'Select class first'}
                            </option>
                            {classSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Select2>
                        {data.class_id && classSubjects.length === 0 && (
                            <p className="mt-1.5 text-xs text-amber-700">
                                No subjects assigned to this class. Assign subjects in School Setup → Classes.
                            </p>
                        )}
                        {errors.subject_id && (
                            <p className="mt-1 text-sm text-rose-600">{errors.subject_id}</p>
                        )}
                        {errors.exam_id && <p className="mt-1 text-sm text-rose-600">{errors.exam_id}</p>}
                    </div>
                    <div>
                        <Label required>Date</Label>
                        <Input
                            type="date"
                            value={data.exam_date}
                            onChange={(e) => setData('exam_date', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label required>Start</Label>
                            <Input
                                type="time"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label required>End</Label>
                            <Input
                                type="time"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label required>Total marks</Label>
                            <Input
                                type="number"
                                value={data.total_marks}
                                onChange={(e) => setData('total_marks', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label required>Passing marks</Label>
                            <Input
                                type="number"
                                value={data.passing_marks}
                                onChange={(e) => setData('passing_marks', e.target.value)}
                            />
                        </div>
                    </div>
                </form>
            </SideDrawer>
        </AdminLayout>
    );
}
