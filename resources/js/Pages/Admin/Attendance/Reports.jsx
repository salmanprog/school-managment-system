import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { EmptyState } from '@/Components/ui/EmptyState';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function Reports({ reportRows, reportMeta, filters, sessionOptions, classOptions }) {
    const [sessionId, setSessionId] = useState(filters.session_id || '');
    const [classId, setClassId] = useState(filters.class_id || '');

    const applyFilters = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        router.get(
            '/admin/attendance/reports',
            {
                session_id: sessionId || undefined,
                class_id: classId || undefined,
                date_from: fd.get('date_from'),
                date_to: fd.get('date_to'),
            },
            { preserveState: true },
        );
    };

    const printReport = () => {
        window.print();
    };

    return (
        <AdminLayout title="Attendance Reports">
            <PageHeader
                title="Attendance Reports"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Attendance' }]}
                description="Percentage uses present/late=1, half-day/excused=0.5, absent=0 over marked days."
                action={{ label: 'Print / export', onClick: printReport }}
            />

            <Card className="mb-6 print:hidden">
                <CardContent className="pt-5">
                    <form noValidate onSubmit={applyFilters} className="flex flex-wrap items-end gap-2">
                        <div>
                            <Label className="mb-1 block text-xs text-slate-500">Session</Label>
                            <Select2 value={sessionId} onChange={setSessionId}>
                                {sessionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs text-slate-500" required>
                                Class
                            </Label>
                            <Select2 value={classId} onChange={setClassId} placeholder="Select class">
                                <option value="">Select class</option>
                                {classOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs text-slate-500">From</Label>
                            <Input type="date" name="date_from" defaultValue={filters.date_from} />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs text-slate-500">To</Label>
                            <Input type="date" name="date_to" defaultValue={filters.date_to} />
                        </div>
                        <Button type="submit" variant="secondary">
                            Generate
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card id="attendance-report-table">
                <CardHeader>
                    <CardTitle className="text-base">
                        {reportMeta.session_name ?? 'Session'} · {reportMeta.date_from} to {reportMeta.date_to}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {reportRows.length === 0 ? (
                        <EmptyState
                            className="print:hidden"
                            title="No data"
                            description="Select session and class to generate the report."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="border px-3 py-2">Roll</th>
                                        <th className="border px-3 py-2">Student</th>
                                        <th className="border px-3 py-2">Class</th>
                                        <th className="border px-3 py-2 text-right">Marked</th>
                                        <th className="border px-3 py-2 text-right">P</th>
                                        <th className="border px-3 py-2 text-right">A</th>
                                        <th className="border px-3 py-2 text-right">Late</th>
                                        <th className="border px-3 py-2 text-right">½</th>
                                        <th className="border px-3 py-2 text-right">Exc</th>
                                        <th className="border px-3 py-2 text-right">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportRows.map((row) => (
                                        <tr key={row.student_enrollment_id} className="even:bg-slate-50/50">
                                            <td className="border px-3 py-2 font-mono">{row.roll_number ?? '—'}</td>
                                            <td className="border px-3 py-2">
                                                <span className="font-medium">{row.student_name}</span>
                                                <span className="ml-1 text-xs text-slate-500">{row.admission_number}</span>
                                            </td>
                                            <td className="border px-3 py-2">{row.class_name}</td>
                                            <td className="border px-3 py-2 text-right">{row.marked_days}</td>
                                            <td className="border px-3 py-2 text-right">{row.present}</td>
                                            <td className="border px-3 py-2 text-right">{row.absent}</td>
                                            <td className="border px-3 py-2 text-right">{row.late}</td>
                                            <td className="border px-3 py-2 text-right">{row.half_day}</td>
                                            <td className="border px-3 py-2 text-right">{row.excused}</td>
                                            <td className="border px-3 py-2 text-right font-semibold">
                                                {row.percentage != null ? `${row.percentage}%` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
