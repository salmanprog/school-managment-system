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
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { confirmAction } from '@/lib/swal';
import { router, useForm } from '@inertiajs/react';
import { Trash2, X } from 'lucide-react';
import { useState } from 'react';

export default function Index({
    assignments,
    filters,
    sessionOptions,
    teacherOptions,
    classOptions,
    subjectOptions,
}) {
    const [formOpen, setFormOpen] = useState(false);
    const [filterSessionId, setFilterSessionId] = useState(filters.session_id || '');
    const [filterTeacherId, setFilterTeacherId] = useState(filters.teacher_id || '');
    const [filterClassId, setFilterClassId] = useState(filters.class_id || '');

    const defaultSession = filters.session_id || sessionOptions.find((s) => s.is_current)?.id?.toString() || '';

    const form = useForm({
        teacher_id: '',
        academic_session_id: defaultSession,
        class_id: filters.class_id || '',
        subject_id: '',
    });

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            '/admin/teacher-assignments',
            {
                session_id: filterSessionId || undefined,
                teacher_id: filterTeacherId || undefined,
                class_id: filterClassId || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const submitAssignment = (e) => {
        e.preventDefault();
        form.post('/admin/teacher-assignments', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('teacher_id', 'subject_id');
                setFormOpen(false);
            },
        });
    };

    const destroy = async (id) => {
        if (
            await confirmAction({
                title: 'Remove assignment?',
                text: 'Are you sure you want to remove this assignment?',
                confirmText: 'Yes, remove',
            })
        ) {
            router.delete(`/admin/teacher-assignments/${id}`, { preserveScroll: true });
        }
    };

    const filterToolbar = (
        <form noValidate onSubmit={applyFilters} className="flex flex-nowrap items-end gap-2">
            <div>
                <Label className="mb-1 block text-xs text-slate-500">Session</Label>
                <Select2 value={filterSessionId} onChange={setFilterSessionId}>
                    {sessionOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                            {s.is_current ? ' (current)' : ''}
                        </option>
                    ))}
                </Select2>
            </div>
            <div>
                <Label className="mb-1 block text-xs text-slate-500">Teacher</Label>
                <Select2 value={filterTeacherId} onChange={setFilterTeacherId} placeholder="All teachers" allowClear>
                    <option value="">All teachers</option>
                    {teacherOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.first_name} {t.last_name} ({t.employee_number})
                        </option>
                    ))}
                </Select2>
            </div>
            <div>
                <Label className="mb-1 block text-xs text-slate-500">Class</Label>
                <Select2 value={filterClassId} onChange={setFilterClassId} placeholder="All classes" allowClear>
                    <option value="">All classes</option>
                    {classOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select2>
            </div>
            <Button type="submit" variant="secondary">
                Filter
            </Button>
        </form>
    );

    return (
        <AdminLayout title="Teacher Assignments">
            <PageHeader
                title="Teacher Assignments"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Teacher Management' }]}
                action={{ label: 'New assignment', onClick: () => setFormOpen(true) }}
            />

            {formOpen && (
                <Card className="mb-6 border-brand-200 bg-brand-50/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">Add assignment</CardTitle>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFormOpen(false)}>
                            <X className="h-4 w-4 text-slate-500" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form noValidate onSubmit={submitAssignment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <Label className="mb-1 block" required>
                                    Teacher
                                </Label>
                                <Select2
                                    value={form.data.teacher_id}
                                    onChange={(value) => form.setData('teacher_id', value)}
                                    placeholder="Select teacher"
                                    invalid={Boolean(form.errors.teacher_id)}
                                >
                                    <option value="">Select teacher</option>
                                    {teacherOptions.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.first_name} {t.last_name}
                                        </option>
                                    ))}
                                </Select2>
                                {form.errors.teacher_id && <p className="mt-1 text-xs text-rose-600">{form.errors.teacher_id}</p>}
                            </div>
                            <div>
                                <Label className="mb-1 block" required>
                                    Session
                                </Label>
                                <Select2
                                    value={form.data.academic_session_id}
                                    onChange={(value) => form.setData('academic_session_id', value)}
                                >
                                    {sessionOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                            <div>
                                <Label className="mb-1 block" required>
                                    Class
                                </Label>
                                <Select2
                                    value={form.data.class_id}
                                    onChange={(value) => form.setData('class_id', value)}
                                    placeholder="Select class"
                                    invalid={Boolean(form.errors.class_id)}
                                >
                                    <option value="">Select class</option>
                                    {classOptions.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select2>
                                {form.errors.class_id && <p className="mt-1 text-xs text-rose-600">{form.errors.class_id}</p>}
                            </div>
                            <div>
                                <Label className="mb-1 block" required>
                                    Subject
                                </Label>
                                <Select2
                                    value={form.data.subject_id}
                                    onChange={(value) => form.setData('subject_id', value)}
                                    placeholder="Select subject"
                                >
                                    <option value="">Select subject</option>
                                    {subjectOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                                <Button type="submit" disabled={form.processing}>
                                    Save assignment
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <ListingCard
                title="All assignments"
                total={assignments.total}
                filters={filters}
                perPageUrl="/admin/teacher-assignments"
                toolbar={filterToolbar}
                isEmpty={assignments.data.length === 0}
                emptyTitle="No assignments"
                emptyDescription="Create an assignment for the selected filters."
                emptyAction={
                    <Button type="button" onClick={() => setFormOpen(true)}>
                        New assignment
                    </Button>
                }
                paginator={assignments}
            >
                <DataTable minWidth="800px">
                    <DataTableHead>
                        <Th>Teacher</Th>
                        <Th>Session</Th>
                        <Th>Class</Th>
                        <Th>Subject</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {assignments.data.map((row) => (
                            <Tr key={row.id}>
                                <Td>
                                    <p className="font-medium">{row.teacher_name}</p>
                                    <p className="font-mono text-xs text-slate-500">{row.employee_number}</p>
                                </Td>
                                <Td>{row.session}</Td>
                                <Td>{row.class_name}</Td>
                                <Td>{row.subject_name}</Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button variant="outline" size="sm" type="button" onClick={() => destroy(row.id)}>
                                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                            Remove
                                        </Button>
                                    </RowActions>
                                </Td>
                            </Tr>
                        ))}
                    </DataTableBody>
                </DataTable>
            </ListingCard>
        </AdminLayout>
    );
}
