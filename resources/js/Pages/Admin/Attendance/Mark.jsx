import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { EmptyState } from '@/Components/ui/EmptyState';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const STATUS_IDLE = {
    present: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    absent: 'border-rose-300 bg-rose-50 text-rose-800',
    late: 'border-amber-300 bg-amber-50 text-amber-800',
};

const STATUS_ACTIVE = {
    present: 'border-emerald-600 bg-emerald-600 text-white shadow-sm',
    absent: 'border-rose-600 bg-rose-600 text-white shadow-sm',
    late: 'border-amber-500 bg-amber-500 text-white shadow-sm',
};

export default function Mark({
    students,
    filters,
    sessionOptions,
    classOptions,
    statusOptions,
    locked = false,
}) {
    const defaultSession = filters.session_id || sessionOptions.find((s) => s.is_current)?.id?.toString() || '';

    const [localFilters, setLocalFilters] = useState({
        session_id: defaultSession,
        class_id: filters.class_id || '',
        date: filters.date || new Date().toISOString().slice(0, 10),
    });
    const [loadError, setLoadError] = useState('');

    const lockedByEnrollment = useMemo(() => {
        const map = {};
        students.forEach((s) => {
            map[s.student_enrollment_id] = Boolean(s.locked);
        });
        return map;
    }, [students]);

    const loadRoster = (e) => {
        e.preventDefault();
        if (!localFilters.class_id) {
            setLoadError('Please select a class.');
            toast.error('Please select a class.');
            return;
        }
        setLoadError('');
        router.get('/admin/attendance/mark', localFilters, { preserveState: true });
    };

    const { data, setData, post, processing, errors } = useForm({
        academic_session_id: defaultSession,
        class_id: filters.class_id || '',
        attendance_date: filters.date || new Date().toISOString().slice(0, 10),
        records: [],
    });

    useEffect(() => {
        setData({
            academic_session_id: filters.session_id || defaultSession,
            class_id: filters.class_id || '',
            attendance_date: filters.date || new Date().toISOString().slice(0, 10),
            records: students.map((s) => ({
                student_enrollment_id: s.student_enrollment_id,
                status: s.status || '',
                remarks: s.remarks || '',
            })),
        });
    }, [students, filters.session_id, filters.class_id, filters.date]);

    const selectedCount = data.records.filter(
        (r) => r.status && !lockedByEnrollment[r.student_enrollment_id],
    ).length;

    const setStatus = (enrollmentId, status) => {
        if (lockedByEnrollment[enrollmentId]) {
            return;
        }
        setData(
            'records',
            data.records.map((r) => {
                if (r.student_enrollment_id !== enrollmentId) {
                    return r;
                }
                // Click same status again to unselect.
                return { ...r, status: r.status === status ? '' : status };
            }),
        );
    };

    const clearAll = () => {
        setData(
            'records',
            data.records.map((r) =>
                lockedByEnrollment[r.student_enrollment_id] ? r : { ...r, status: '' },
            ),
        );
    };

    const setRemarks = (enrollmentId, remarks) => {
        if (lockedByEnrollment[enrollmentId]) {
            return;
        }
        setData(
            'records',
            data.records.map((r) => (r.student_enrollment_id === enrollmentId ? { ...r, remarks } : r)),
        );
    };

    const markAll = (status) => {
        setData(
            'records',
            data.records.map((r) =>
                lockedByEnrollment[r.student_enrollment_id] ? r : { ...r, status },
            ),
        );
    };

    const submit = (e) => {
        e.preventDefault();

        const payloadRecords = data.records.filter(
            (r) => r.status && !lockedByEnrollment[r.student_enrollment_id],
        );

        if (payloadRecords.length === 0) {
            toast.error('Select attendance for at least one student before saving.');
            return;
        }

        setData({
            ...data,
            records: payloadRecords,
        });

        // Post with explicit data so only selected students are sent.
        router.post(
            '/admin/attendance',
            {
                academic_session_id: data.academic_session_id,
                class_id: data.class_id,
                attendance_date: data.attendance_date,
                records: payloadRecords,
            },
            {
                preserveScroll: true,
                onError: (errs) => {
                    const message = errs.records || Object.values(errs)[0];
                    if (message) {
                        toast.error(typeof message === 'string' ? message : 'Unable to save attendance.');
                    }
                },
            },
        );
    };

    const selectedClassName =
        classOptions.find((c) => String(c.id) === String(filters.class_id))?.name || 'selected class';

    const unlockedCount = students.filter((s) => !s.locked).length;

    return (
        <AdminLayout title="Mark Attendance">
            <PageHeader
                title="Mark Attendance"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Attendance' }]}
                description="Select session, class, and date to load the roster."
            />

            <Card className="mb-6">
                <CardContent className="pt-5">
                    <form noValidate onSubmit={loadRoster} className="flex flex-wrap items-end gap-2">
                        <div>
                            <Label className="mb-1 block text-xs text-slate-500">Session</Label>
                            <Select2
                                value={localFilters.session_id}
                                onChange={(value) => setLocalFilters({ ...localFilters, session_id: value })}
                            >
                                {sessionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                        {s.is_current ? ' (current)' : ''}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs text-slate-500" required>
                                Class
                            </Label>
                            <Select2
                                value={localFilters.class_id}
                                onChange={(value) => {
                                    setLocalFilters({ ...localFilters, class_id: value });
                                    setLoadError('');
                                }}
                                placeholder="Select class"
                                invalid={Boolean(loadError)}
                            >
                                <option value="">Select class</option>
                                {classOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select2>
                            {loadError && <p className="mt-1 text-xs text-rose-600">{loadError}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs text-slate-500">Date</Label>
                            <input
                                type="date"
                                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                value={localFilters.date}
                                onChange={(e) => setLocalFilters({ ...localFilters, date: e.target.value })}
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Load roster
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {!filters.class_id ? (
                <EmptyState
                    title="Choose a class"
                    description="Select session, class, and date, then load the roster."
                />
            ) : students.length === 0 ? (
                <EmptyState
                    title={`No students in ${selectedClassName}`}
                    description="No enrollments found for this class and session."
                />
            ) : (
                <form noValidate onSubmit={submit}>
                    <Card>
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                            <div>
                                <CardTitle>
                                    Roster · {selectedClassName} ({students.length})
                                </CardTitle>
                                <p className="mt-1 text-xs text-slate-500">
                                    {locked
                                        ? 'All students are already marked for this date'
                                        : `Choose a status yourself · ${selectedCount} selected · only selected students will be saved`}
                                </p>
                            </div>
                            {unlockedCount > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {statusOptions.map((st) => (
                                        <Button
                                            key={st}
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => markAll(st)}
                                        >
                                            All {st.replace('_', ' ')}
                                        </Button>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={clearAll}>
                                        Clear all
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {locked && (
                                <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    Attendance for <strong>{filters.date}</strong> is already saved for all
                                    students and cannot be changed.
                                </div>
                            )}
                            {!locked && students.some((s) => s.locked) && (
                                <div className="border-b border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                                    Some students are already marked (locked). Select status only for the
                                    remaining students, then save.
                                </div>
                            )}
                            {errors.records && (
                                <p className="px-4 py-2 text-sm text-rose-600">{errors.records}</p>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Roll</th>
                                            <th className="px-4 py-3">Student</th>
                                            <th className="px-4 py-3 normal-case tracking-normal">
                                                Mark Attendance
                                            </th>
                                            <th className="px-4 py-3">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {students.map((s) => {
                                            const record = data.records.find(
                                                (r) => r.student_enrollment_id === s.student_enrollment_id,
                                            );
                                            const currentStatus = record?.status || '';
                                            const rowLocked = Boolean(s.locked);

                                            return (
                                                <tr
                                                    key={s.student_enrollment_id}
                                                    className={rowLocked ? 'bg-slate-50/60' : undefined}
                                                >
                                                    <td className="px-4 py-3 font-mono text-slate-600">
                                                        {s.roll_number ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium">{s.student_name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {s.admission_number}
                                                            {s.enrollment_status &&
                                                            s.enrollment_status !== 'active'
                                                                ? ` · ${s.enrollment_status.replace('_', ' ')}`
                                                                : ''}
                                                            {rowLocked ? ' · saved' : ''}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div
                                                            className="flex flex-wrap gap-1.5"
                                                            role="radiogroup"
                                                            aria-label={`Attendance status for ${s.student_name}`}
                                                        >
                                                            {statusOptions.map((st) => {
                                                                const selected = currentStatus === st;
                                                                return (
                                                                    <button
                                                                        key={st}
                                                                        type="button"
                                                                        disabled={rowLocked}
                                                                        aria-pressed={selected}
                                                                        onClick={() =>
                                                                            setStatus(
                                                                                s.student_enrollment_id,
                                                                                st,
                                                                            )
                                                                        }
                                                                        className={cn(
                                                                            'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize transition',
                                                                            selected
                                                                                ? STATUS_ACTIVE[st]
                                                                                : STATUS_IDLE[st],
                                                                            rowLocked
                                                                                ? 'cursor-default opacity-60'
                                                                                : 'cursor-pointer hover:brightness-95',
                                                                        )}
                                                                    >
                                                                        {st.replace('_', ' ')}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            className="h-9 w-full min-w-[8rem] rounded-lg border border-slate-300 px-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                                                            value={record?.remarks ?? ''}
                                                            onChange={(e) =>
                                                                setRemarks(
                                                                    s.student_enrollment_id,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Optional"
                                                            disabled={rowLocked}
                                                            readOnly={rowLocked}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t px-4 py-4">
                                {locked ? (
                                    <Button type="button" variant="secondary" disabled>
                                        Attendance locked
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={processing || selectedCount === 0}>
                                        Save {selectedCount > 0 ? `${selectedCount} ` : ''}attendance
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </form>
            )}
        </AdminLayout>
    );
}
