import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import {
    DataTable,
    DataTableBody,
    DataTableHead,
    ListingCard,
    Td,
    Th,
    Tr,
} from '@/Components/ListingCard';
import { Button } from '@/Components/ui/Button';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { Link, router } from '@inertiajs/react';
import { ChevronRight, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

function MarkStatusBadge({ status }) {
    const styles = {
        present: 'bg-emerald-50 text-emerald-700',
        absent: 'bg-rose-50 text-rose-700',
        late: 'bg-amber-50 text-amber-800',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                styles[status] || 'bg-slate-100 text-slate-600'
            }`}
        >
            {status?.replace('_', ' ') ?? '—'}
        </span>
    );
}

const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

export default function Index({
    view = 'classes',
    classes = [],
    students,
    selectedClass,
    viewingStudent = null,
    studentAttendance = [],
    filters,
    sessionOptions,
    monthOptions = MONTHS,
    yearOptions = [],
}) {
    const [sessionId, setSessionId] = useState(filters.session_id || '');
    const [month, setMonth] = useState(filters.month || String(new Date().getMonth() + 1));
    const [year, setYear] = useState(filters.year || String(new Date().getFullYear()));
    const isStudentsView = view === 'students' && Boolean(filters.class_id);

    useEffect(() => {
        if (filters.month) {
            setMonth(String(filters.month));
        }
        if (filters.year) {
            setYear(String(filters.year));
        }
    }, [filters.month, filters.year, filters.enrollment_id]);

    const years = (() => {
        const base =
            yearOptions.length > 0
                ? yearOptions.map(String)
                : Array.from({ length: 7 }, (_, i) => String(new Date().getFullYear() + 1 - i));
        if (year && !base.includes(String(year))) {
            return [String(year), ...base];
        }
        return base;
    })();

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            '/admin/attendance',
            {
                session_id: sessionId || undefined,
                class_id: filters.class_id || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openClass = (classId) => {
        router.get(
            '/admin/attendance',
            {
                session_id: sessionId || filters.session_id || undefined,
                class_id: classId,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openStudentAttendance = (enrollmentId) => {
        router.get(
            '/admin/attendance',
            {
                session_id: sessionId || filters.session_id || undefined,
                class_id: filters.class_id,
                enrollment_id: enrollmentId,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const closeStudentAttendance = () => {
        router.get(
            '/admin/attendance',
            {
                session_id: sessionId || filters.session_id || undefined,
                class_id: filters.class_id,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const applyMonthYearFilter = (nextMonth = month, nextYear = year) => {
        if (!viewingStudent?.enrollment_id) {
            return;
        }
        router.get(
            '/admin/attendance',
            {
                session_id: sessionId || filters.session_id || undefined,
                class_id: filters.class_id,
                enrollment_id: viewingStudent.enrollment_id,
                month: nextMonth || undefined,
                year: nextYear || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filterToolbar = (
        <form noValidate onSubmit={applyFilters} className="flex flex-wrap items-end gap-2">
            <div className="w-44 shrink-0">
                <Label className="mb-1 block text-xs text-slate-500">Session</Label>
                <Select2 value={sessionId} onChange={setSessionId} placeholder="Current session" allowClear>
                    <option value="">Current session</option>
                    {sessionOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </Select2>
            </div>
            <Button type="submit" variant="secondary" className="shrink-0">
                Filter
            </Button>
        </form>
    );

    return (
        <AdminLayout title="Attendance Records">
            <PageHeader
                title="Attendance Records"
                breadcrumbs={
                    isStudentsView
                        ? [
                              { label: 'Admin', href: '/admin' },
                              { label: 'Attendance', href: '/admin/attendance' },
                              { label: selectedClass?.name || 'Class' },
                          ]
                        : [{ label: 'Admin', href: '/admin' }, { label: 'Attendance' }]
                }
            />

            {isStudentsView ? (
                <ListingCard
                    title={`${selectedClass?.name || 'Class'} — students`}
                    total={students?.total ?? 0}
                    filters={filters}
                    perPageUrl="/admin/attendance"
                    isEmpty={!students || students.data.length === 0}
                    emptyTitle="No students"
                    emptyDescription="No students enrolled in this class for the selected session."
                    emptyAction={
                        <Button asChild>
                            <Link href="/admin/students">Go to students</Link>
                        </Button>
                    }
                    paginator={students}
                >
                    <DataTable minWidth="520px">
                        <DataTableHead>
                            <Th>Student Name</Th>
                            <Th>Class</Th>
                            <Th align="right">Action</Th>
                        </DataTableHead>
                        <DataTableBody>
                            {(students?.data || []).map((row) => (
                                <Tr key={row.enrollment_id}>
                                    <Td>
                                        <p className="font-medium text-ink-900">{row.student_name}</p>
                                        <p className="text-xs text-slate-500">
                                            {row.admission_number || '—'}
                                            {row.roll_number ? ` · Roll ${row.roll_number}` : ''}
                                        </p>
                                    </Td>
                                    <Td className="text-slate-700">{row.class_name}</Td>
                                    <Td align="right">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openStudentAttendance(row.enrollment_id)}
                                        >
                                            <Eye className="mr-1 h-3.5 w-3.5" />
                                            View attendance
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </ListingCard>
            ) : (
                <ListingCard
                    title="Classes"
                    total={classes.length}
                    toolbar={filterToolbar}
                    isEmpty={classes.length === 0}
                    emptyTitle="No classes"
                    emptyDescription="Add classes under School Setup first."
                >
                    <DataTable minWidth="480px">
                        <DataTableHead>
                            <Th>Class</Th>
                            <Th>Students</Th>
                            <Th align="right">Action</Th>
                        </DataTableHead>
                        <DataTableBody>
                            {classes.map((row) => (
                                <Tr
                                    key={row.id}
                                    className="cursor-pointer hover:bg-teal-50/60"
                                    onClick={() => openClass(row.id)}
                                >
                                    <Td>
                                        <p className="font-medium text-ink-900">{row.name}</p>
                                        {row.code ? (
                                            <p className="text-xs text-slate-500">{row.code}</p>
                                        ) : null}
                                    </Td>
                                    <Td className="tabular-nums text-slate-700">{row.students_count}</Td>
                                    <Td align="right">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openClass(row.id);
                                            }}
                                        >
                                            View students
                                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </ListingCard>
            )}

            <SideDrawer
                open={Boolean(viewingStudent)}
                onClose={closeStudentAttendance}
                title={viewingStudent?.student_name || 'Student attendance'}
                description={
                    viewingStudent
                        ? `${viewingStudent.class_name || ''}${
                              viewingStudent.admission_number ? ` · ${viewingStudent.admission_number}` : ''
                          }`
                        : undefined
                }
                size="lg"
                footer={
                    <Button type="button" variant="outline" onClick={closeStudentAttendance}>
                        Close
                    </Button>
                }
            >
                <div className="mb-4 flex flex-wrap items-end gap-3">
                    <div className="w-40 shrink-0">
                        <Label className="mb-1 block text-xs text-slate-500">Month</Label>
                        <select
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            value={month}
                            onChange={(e) => {
                                const next = e.target.value;
                                setMonth(next);
                                applyMonthYearFilter(next, year);
                            }}
                        >
                            {(monthOptions.length ? monthOptions : MONTHS).map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-28 shrink-0">
                        <Label className="mb-1 block text-xs text-slate-500">Year</Label>
                        <select
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            value={year}
                            onChange={(e) => {
                                const next = e.target.value;
                                setYear(next);
                                applyMonthYearFilter(month, next);
                            }}
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {studentAttendance.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No attendance records for{' '}
                        {(monthOptions.find((m) => String(m.value) === String(month)) || MONTHS.find((m) => m.value === String(month)))
                            ?.label || 'this month'}{' '}
                        {year}.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Remarks</th>
                                    <th className="px-3 py-2">Marked by</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentAttendance.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="whitespace-nowrap px-3 py-2">{row.date}</td>
                                        <td className="px-3 py-2">
                                            <MarkStatusBadge status={row.status} />
                                        </td>
                                        <td className="px-3 py-2 text-slate-600">{row.remarks || '—'}</td>
                                        <td className="px-3 py-2 text-slate-600">{row.marked_by || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SideDrawer>

            <p className="mt-4 text-center text-sm text-slate-500">
                <Link href="/admin/attendance/reports" className="text-brand-700 hover:underline">
                    View attendance reports
                </Link>
            </p>
        </AdminLayout>
    );
}
