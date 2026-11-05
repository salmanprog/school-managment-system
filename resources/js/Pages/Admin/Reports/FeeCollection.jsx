import { ReportShell } from '@/Components/reports/ReportShell';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const METHOD_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank transfer' },
    { value: 'card', label: 'Card' },
    { value: 'online', label: 'Online' },
    { value: 'cheque', label: 'Cheque' },
];

function methodLabel(value) {
    return METHOD_OPTIONS.find((m) => m.value === value)?.label || value || '—';
}

function methodVariant(value) {
    if (value === 'cash') return 'success';
    if (value === 'online' || value === 'card') return 'default';
    if (value === 'cheque') return 'warning';
    return 'muted';
}

export default function FeeCollection({ rows, filters, summary }) {
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? '');

    const apply = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        router.get(
            '/admin/reports/fee-collection',
            {
                date_from: fd.get('date_from') || undefined,
                date_to: fd.get('date_to') || undefined,
                payment_method: paymentMethod || undefined,
            },
            { preserveState: true },
        );
    };

    const enrichedSummary = useMemo(() => {
        const cashTotal = rows
            .filter((row) => row.payment_method === 'cash')
            .reduce((sum, row) => sum + Number(row.amount_raw || 0), 0);
        const average =
            rows.length > 0
                ? rows.reduce((sum, row) => sum + Number(row.amount_raw || 0), 0) / rows.length
                : 0;

        return {
            total_collected: summary?.total ?? '0.00',
            payments: rows.length,
            cash: cashTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            avg_payment: average.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        };
    }, [rows, summary]);

    const form = (
        <form
            noValidate
            onSubmit={apply}
            className="flex w-full min-w-0 flex-wrap items-end gap-2.5"
        >
            <div className="w-[150px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">From</Label>
                <Input
                    type="date"
                    name="date_from"
                    defaultValue={filters.date_from}
                    className="h-10"
                />
            </div>
            <div className="w-[150px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">To</Label>
                <Input
                    type="date"
                    name="date_to"
                    defaultValue={filters.date_to}
                    className="h-10"
                />
            </div>
            <div className="w-[160px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">Method</Label>
                <Select2
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    placeholder="All methods"
                    allowClear
                    searchThreshold={Infinity}
                >
                    <option value="">All methods</option>
                    {METHOD_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                            {m.label}
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
            title="Fee Collection Reports"
            breadcrumbs={[
                { label: 'Admin', href: '/admin' },
                { label: 'Reports' },
                { label: 'Fee Collection' },
            ]}
            description="Track completed fee payments by date range and payment method, then export the list."
            summary={enrichedSummary}
            filtersForm={form}
            columns={[
                {
                    key: 'payment_number',
                    label: 'Payment #',
                    mono: true,
                    headerClassName: 'w-[150px]',
                },
                {
                    key: 'payment_date',
                    label: 'Date',
                    headerClassName: 'w-[120px]',
                    className: 'tabular-nums text-slate-700',
                },
                {
                    key: 'student_name',
                    label: 'Student',
                    render: (value) => (
                        <span className="font-medium text-slate-900">{value || '—'}</span>
                    ),
                },
                {
                    key: 'amount',
                    label: 'Amount',
                    align: 'right',
                    headerClassName: 'w-[120px]',
                    className: 'tabular-nums font-semibold text-slate-900',
                },
                {
                    key: 'payment_method',
                    label: 'Method',
                    headerClassName: 'w-[130px]',
                    render: (value) => (
                        <Badge variant={methodVariant(value)}>{methodLabel(value)}</Badge>
                    ),
                },
                {
                    key: 'received_by',
                    label: 'Received by',
                    headerClassName: 'w-[140px]',
                },
            ]}
            rows={rows}
            exportPath="/admin/reports/fee-collection"
            query={filters}
            emptyTitle="No payments found"
            emptyDescription="No completed payments match the selected date range or method."
        />
    );
}
