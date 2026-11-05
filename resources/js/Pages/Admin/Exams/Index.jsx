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
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { confirmDelete } from '@/lib/swal';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const emptyExam = {
    academic_session_id: '',
    exam_type_id: '',
    name: '',
    start_date: '',
    end_date: '',
    status: 'scheduled',
};

const examStatusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function Index({ exams, examTypes = [], sessionOptions, filters }) {
    const [examDrawer, setExamDrawer] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const examForm = useForm(emptyExam);

    const closeExamDrawer = () => {
        setExamDrawer(false);
        setEditingExam(null);
        examForm.reset();
        examForm.clearErrors();
    };

    const openExamCreate = () => {
        examForm.reset();
        examForm.clearErrors();
        setEditingExam(null);
        examForm.setData({
            ...emptyExam,
            academic_session_id: filters.session_id || String(sessionOptions.find((s) => s.is_current)?.id || ''),
        });
        setExamDrawer(true);
    };

    const submitExam = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeExamDrawer };
        if (editingExam) examForm.put(`/admin/exams/${editingExam.id}`, opts);
        else examForm.post('/admin/exams', opts);
    };

    const isEmpty = exams.data.length === 0;

    return (
        <AdminLayout title="Exams">
            <PageHeader
                title="Exams"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Examinations' },
                    { label: 'Exams' },
                ]}
                action={{ label: 'Add exam', onClick: openExamCreate }}
            />

            <ListingCard
                title="All exams"
                total={exams.total}
                filters={filters}
                perPageUrl="/admin/exams"
                isEmpty={isEmpty}
                emptyTitle="No exams"
                emptyDescription="Create an exam for the selected academic session."
                emptyAction={
                    <Button type="button" onClick={openExamCreate}>
                        <Plus className="h-4 w-4" />
                        Add exam
                    </Button>
                }
                paginator={exams}
                toolbar={
                    <div className="w-44">
                        <Select2
                            value={filters.session_id}
                            onChange={(value) =>
                                router.get('/admin/exams', { session_id: value }, { preserveState: true })
                            }
                            searchThreshold={Infinity}
                        >
                            {sessionOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Select2>
                    </div>
                }
            >
                <DataTable minWidth="720px">
                    <DataTableHead>
                        <Th>Name</Th>
                        <Th>Type</Th>
                        <Th>Period</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {exams.data.map((row) => (
                            <Tr key={row.id}>
                                <Td>
                                    <p className="font-semibold text-ink-900">{row.name}</p>
                                    <p className="text-xs text-slate-400">{row.session_name}</p>
                                </Td>
                                <Td>
                                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                        {row.exam_type || '—'}
                                    </span>
                                </Td>
                                <Td className="tabular-nums text-slate-600">
                                    <span className="block">{row.start_date}</span>
                                    <span className="text-xs text-slate-400">to {row.end_date}</span>
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
                                            title="Edit exam"
                                            onClick={() => {
                                                setEditingExam(row);
                                                examForm.setData({
                                                    academic_session_id:
                                                        filters.session_id ||
                                                        String(sessionOptions.find((s) => s.is_current)?.id || ''),
                                                    exam_type_id: String(row.exam_type_id || ''),
                                                    name: row.name,
                                                    start_date: row.start_date,
                                                    end_date: row.end_date,
                                                    status: row.status || 'scheduled',
                                                });
                                                setExamDrawer(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            title="Delete exam"
                                            onClick={async () => {
                                                if (await confirmDelete('this exam')) {
                                                    router.delete(`/admin/exams/${row.id}`, {
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
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
                open={examDrawer}
                onClose={closeExamDrawer}
                title={`${editingExam ? 'Edit' : 'New'} exam`}
                size="lg"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeExamDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="exam-form" disabled={examForm.processing}>
                            {examForm.processing ? 'Saving…' : 'Save exam'}
                        </Button>
                    </div>
                }
            >
                <form id="exam-form" noValidate onSubmit={submitExam} className="space-y-4">
                    <div>
                        <Label required>Session</Label>
                        <Select2
                            value={examForm.data.academic_session_id}
                            onChange={(value) => examForm.setData('academic_session_id', value)}
                        >
                            {sessionOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Select2>
                    </div>
                    <div>
                        <Label required>Exam type</Label>
                        <Select2
                            value={examForm.data.exam_type_id}
                            onChange={(value) => examForm.setData('exam_type_id', value)}
                            placeholder="Select type"
                        >
                            <option value="">Select type</option>
                            {examTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </Select2>
                        {examTypes.length === 0 && (
                            <p className="mt-1.5 text-xs text-amber-700">
                                No exam types yet.{' '}
                                <Link href="/admin/exam-types" className="font-medium text-teal-700 hover:underline">
                                    Add exam types
                                </Link>
                                .
                            </p>
                        )}
                    </div>
                    <div>
                        <Label required>Exam name</Label>
                        <Input
                            value={examForm.data.name}
                            onChange={(e) => examForm.setData('name', e.target.value)}
                            placeholder="e.g. Annual Examination 2026"
                            className={cn(examForm.errors.name && 'border-rose-400')}
                        />
                        {examForm.errors.name && (
                            <p className="mt-1 text-sm text-rose-600">{examForm.errors.name}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label required>Start date</Label>
                            <Input
                                type="date"
                                value={examForm.data.start_date}
                                onChange={(e) => examForm.setData('start_date', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label required>End date</Label>
                            <Input
                                type="date"
                                value={examForm.data.end_date}
                                onChange={(e) => examForm.setData('end_date', e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select2
                            value={examForm.data.status}
                            onChange={(value) => examForm.setData('status', value)}
                            searchThreshold={Infinity}
                        >
                            {examStatusOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </Select2>
                    </div>
                </form>
            </SideDrawer>
        </AdminLayout>
    );
}
