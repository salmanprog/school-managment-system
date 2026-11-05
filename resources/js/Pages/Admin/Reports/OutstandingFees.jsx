import { ReportShell } from '@/Components/reports/ReportShell';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function statusVariant(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'paid') return 'success';
    if (value === 'partial') return 'warning';
    if (value === 'overdue' || value === 'unpaid') return 'danger';
    return 'muted';
}

export default function OutstandingFees({ rows, filters, filterOptions, summary }) {
    const [sessionId, setSessionId] = useState(filters.session_id ?? '');
    const [classId, setClassId] = useState(filters.class_id ?? '');

    const apply = (e) => {
        e.preventDefault();
        router.get(
            '/admin/reports/outstanding-fees',
            {
                session_id: sessionId || undefined,
                class_id: classId || undefined,
            },
            { preserveState: true },
        );
    };

    const enrichedSummary = useMemo(
        () => ({
            total_balance: summary?.total_balance ?? '0.00',
            invoices: rows.length,
        }),
        [rows, summary],
    );

    const form = (
        <form
            noValidate
            onSubmit={apply}
            className="flex w-full min-w-0 flex-wrap items-end gap-2.5"
        >
            <div className="w-[180px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">Session</Label>
                <Select2 value={sessionId} onChange={setSessionId} searchThreshold={Infinity}>
                    {filterOptions.sessionOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                            {s.is_current ? ' (current)' : ''}
                        </option>
                    ))}
                </Select2>
            </div>
            <div className="w-[160px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">Class</Label>
                <Select2
                    value={classId}
                    onChange={setClassId}
                    placeholder="All classes"
                    allowClear
                    searchThreshold={Infinity}
                >
                    <option value="">All classes</option>
                    {filterOptions.classOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select2>
            </div>
            <Button type="submit" size="sm" className="h-10 px-4">
                Apply
            </Button>
        </form>
    );

    return (
        <ReportShell
            title="Outstanding Fees"
            breadcrumbs={[
                { label: 'Admin', href: '/admin' },
                { label: 'Reports' },
                { label: 'Outstanding Fees' },
            ]}
            description="Review unpaid and partially paid invoices by session and class."
            summary={enrichedSummary}
            filtersForm={form}
            columns={[
                {
                    key: 'invoice_number',
                    label: 'Invoice #',
                    mono: true,
                    headerClassName: 'w-[140px]',
                },
                {
                    key: 'student_name',
                    label: 'Student',
                    render: (value) => (
                        <span className="font-medium text-slate-900">{value || '—'}</span>
                    ),
                },
                { key: 'class_name', label: 'Class', headerClassName: 'w-[120px]' },
                {
                    key: 'due_date',
                    label: 'Due',
                    headerClassName: 'w-[110px]',
                    className: 'tabular-nums',
                },
                {
                    key: 'total_amount',
                    label: 'Total',
                    align: 'right',
                    className: 'tabular-nums',
                },
                {
                    key: 'paid_amount',
                    label: 'Paid',
                    align: 'right',
                    className: 'tabular-nums',
                },
                {
                    key: 'balance',
                    label: 'Balance',
                    align: 'right',
                    className: 'tabular-nums font-semibold text-slate-900',
                },
                {
                    key: 'status',
                    label: 'Status',
                    headerClassName: 'w-[110px]',
                    render: (value) => (
                        <Badge variant={statusVariant(value)} className="capitalize">
                            {value || '—'}
                        </Badge>
                    ),
                },
            ]}
            rows={rows}
            exportPath="/admin/reports/outstanding-fees"
            query={filters}
            emptyTitle="No outstanding invoices"
            emptyDescription="No unpaid invoices match the selected session or class."
        />
    );
}
