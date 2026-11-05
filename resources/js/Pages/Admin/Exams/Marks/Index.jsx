import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent } from '@/Components/ui/Card';
import { EmptyState } from '@/Components/ui/EmptyState';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

export default function MarksIndex({
    examTypeOptions = [],
    sessionOptions = [],
    examOptions = [],
    classOptions = [],
    subjectOptions = [],
    filters,
    schedule,
    rows,
}) {
    const { data, setData, post, processing, errors } = useForm({
        exam_schedule_id: schedule?.id ? String(schedule.id) : '',
        marks: [],
    });

    useEffect(() => {
        setData({
            exam_schedule_id: schedule?.id ? String(schedule.id) : '',
            marks: rows.map((r) => ({
                student_enrollment_id: r.student_enrollment_id,
                attendance_status: r.attendance_status,
                obtained_marks: r.obtained_marks,
                remarks: r.remarks,
            })),
        });
    }, [schedule?.id, rows]);

    const applyFilters = (next = {}) => {
        const merged = {
            exam_type_id:
                next.exam_type_id !== undefined
                    ? next.exam_type_id || undefined
                    : filters.exam_type_id || undefined,
            session_id:
                next.session_id !== undefined
                    ? next.session_id || undefined
                    : filters.session_id || undefined,
            exam_id:
                next.exam_id !== undefined ? next.exam_id || undefined : filters.exam_id || undefined,
            class_id:
                next.class_id !== undefined
                    ? next.class_id || undefined
                    : filters.class_id || undefined,
            subject_id:
                next.subject_id !== undefined
                    ? next.subject_id || undefined
                    : filters.subject_id || undefined,
        };

        router.get('/admin/exams/marks', merged, { preserveState: true });
    };

    const emptyMessage = useMemo(() => {
        if (!filters.exam_type_id) {
            return {
                title: 'Select exam type',
                description: 'Choose an exam type to begin entering marks.',
            };
        }
        if (!filters.session_id) {
            return {
                title: 'Select session',
                description: 'Choose an academic session for this exam type.',
            };
        }
        if (!filters.exam_id) {
            return {
                title: 'Select exam',
                description: 'Choose an exam to continue.',
            };
        }
        if (!filters.class_id) {
            return {
                title: 'Select class',
                description: 'Choose a class that has schedules for this exam.',
            };
        }
        if (!filters.subject_id) {
            return {
                title: 'Select subject',
                description: 'Choose a subject schedule to enter marks.',
            };
        }
        if (!schedule) {
            return {
                title: 'No schedule found',
                description: 'No exam schedule exists for this exam, class, and subject.',
            };
        }
        return null;
    }, [filters, schedule]);

    const updateMark = (index, field, value) => {
        const marks = [...data.marks];
        marks[index] = { ...marks[index], [field]: value };
        if (field === 'attendance_status' && value === 'absent') {
            marks[index].obtained_marks = '';
        }
        setData('marks', marks);
    };

    const submit = (e) => {
        e.preventDefault();
        post('/admin/exams/marks', { preserveScroll: true });
    };

    return (
        <AdminLayout title="Marks Entry">
            <PageHeader
                title="Marks Entry"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Exams' },
                    { label: 'Marks' },
                ]}
            />

            <Card className="mb-4">
                <CardContent className="pt-5">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-48">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Exam Type
                            </Label>
                            <Select2
                                value={filters.exam_type_id || ''}
                                onChange={(value) =>
                                    applyFilters({
                                        exam_type_id: value || '',
                                        session_id: '',
                                        exam_id: '',
                                        class_id: '',
                                        subject_id: '',
                                    })
                                }
                                placeholder="Select exam type"
                                allowClear
                                searchThreshold={Infinity}
                            >
                                <option value="">Select exam type</option>
                                {examTypeOptions.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </Select2>
                        </div>

                        {filters.exam_type_id ? (
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
                                            class_id: '',
                                            subject_id: '',
                                        })
                                    }
                                    placeholder="Select session"
                                    allowClear
                                    searchThreshold={Infinity}
                                >
                                    <option value="">Select session</option>
                                    {sessionOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                            {s.is_current ? ' (current)' : ''}
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                        ) : null}

                        {filters.exam_type_id && filters.session_id ? (
                            <div className="w-56">
                                <Label className="mb-1 block text-xs font-medium text-slate-500">
                                    Exam
                                </Label>
                                <Select2
                                    value={filters.exam_id || ''}
                                    onChange={(value) =>
                                        applyFilters({
                                            exam_id: value || '',
                                            class_id: '',
                                            subject_id: '',
                                        })
                                    }
                                    placeholder="Select exam"
                                    allowClear
                                    searchThreshold={Infinity}
                                >
                                    <option value="">Select exam</option>
                                    {examOptions.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.name}
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                        ) : null}

                        {filters.exam_id ? (
                            <div className="w-44">
                                <Label className="mb-1 block text-xs font-medium text-slate-500">
                                    Class
                                </Label>
                                <Select2
                                    value={filters.class_id || ''}
                                    onChange={(value) =>
                                        applyFilters({
                                            class_id: value || '',
                                            subject_id: '',
                                        })
                                    }
                                    placeholder="Select class"
                                    allowClear
                                    searchThreshold={Infinity}
                                >
                                    <option value="">Select class</option>
                                    {classOptions.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                        ) : null}

                        {filters.class_id ? (
                            <div className="w-48">
                                <Label className="mb-1 block text-xs font-medium text-slate-500">
                                    Subject
                                </Label>
                                <Select2
                                    value={filters.subject_id || ''}
                                    onChange={(value) =>
                                        applyFilters({
                                            subject_id: value || '',
                                        })
                                    }
                                    placeholder="Select subject"
                                    allowClear
                                    searchThreshold={Infinity}
                                >
                                    <option value="">Select subject</option>
                                    {subjectOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            {!schedule ? (
                <EmptyState title={emptyMessage.title} description={emptyMessage.description} />
            ) : (
                <Card>
                    <CardContent className="pt-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {schedule.exam_name} · {schedule.subject_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {schedule.class_name}
                                    {schedule.section_name ? ` · ${schedule.section_name}` : ''} ·
                                    Total {schedule.total_marks} (pass {schedule.passing_marks})
                                </p>
                            </div>
                            <p className="text-xs text-slate-400">{rows.length} students</p>
                        </div>

                        {rows.length === 0 ? (
                            <EmptyState
                                title="No students"
                                description="No active enrollments found for this class."
                            />
                        ) : (
                            <form noValidate onSubmit={submit}>
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                                <th className="px-3 py-2.5">Roll</th>
                                                <th className="px-3 py-2.5">Student</th>
                                                <th className="px-3 py-2.5">Present</th>
                                                <th className="px-3 py-2.5">Marks</th>
                                                <th className="px-3 py-2.5">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, index) => (
                                                <tr
                                                    key={row.student_enrollment_id}
                                                    className="border-b border-slate-100"
                                                >
                                                    <td className="px-3 py-2.5 tabular-nums text-slate-600">
                                                        {row.roll_number ?? '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="font-medium text-slate-900">
                                                            {row.student_name}
                                                        </span>
                                                        <div className="text-xs text-slate-400">
                                                            {row.admission_number}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="w-32">
                                                            <Select2
                                                                value={
                                                                    data.marks[index]
                                                                        ?.attendance_status ||
                                                                    'present'
                                                                }
                                                                onChange={(value) =>
                                                                    updateMark(
                                                                        index,
                                                                        'attendance_status',
                                                                        value,
                                                                    )
                                                                }
                                                                searchThreshold={Infinity}
                                                            >
                                                                <option value="present">
                                                                    Present
                                                                </option>
                                                                <option value="absent">
                                                                    Absent
                                                                </option>
                                                            </Select2>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="max-w-[110px]"
                                                            disabled={
                                                                data.marks[index]
                                                                    ?.attendance_status ===
                                                                'absent'
                                                            }
                                                            value={
                                                                data.marks[index]
                                                                    ?.obtained_marks ?? ''
                                                            }
                                                            onChange={(e) =>
                                                                updateMark(
                                                                    index,
                                                                    'obtained_marks',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <Input
                                                            className="max-w-[180px]"
                                                            value={
                                                                data.marks[index]?.remarks ?? ''
                                                            }
                                                            onChange={(e) =>
                                                                updateMark(
                                                                    index,
                                                                    'remarks',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {errors.marks && (
                                    <p className="mt-2 text-sm text-rose-600">{errors.marks}</p>
                                )}
                                <Button type="submit" className="mt-4" disabled={processing}>
                                    Save marks
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            )}
        </AdminLayout>
    );
}
