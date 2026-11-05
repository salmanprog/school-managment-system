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
import { ListingSearch } from '@/Components/ListingSearch';
import { Button } from '@/Components/ui/Button';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useState } from 'react';

export default function Receipts({
    students,
    summary = { total: 0, paid: 0, unpaid: 0 },
    classSelected = false,
    filters,
    classOptions = [],
    monthOptions = [],
    yearOptions = [],
}) {
    const [classId, setClassId] = useState(filters.class_id || '');
    const [month, setMonth] = useState(filters.month || '');
    const [year, setYear] = useState(filters.year || '');

    const rows = students?.data || [];
    const isEmpty = !classSelected || rows.length === 0;

    const applyFilters = (next = {}) => {
        router.get(
            '/admin/fees/receipts',
            {
                ...filters,
                search: filters.search || undefined,
                class_id: (next.class_id !== undefined ? next.class_id : classId) || undefined,
                month: (next.month !== undefined ? next.month : month) || undefined,
                year: (next.year !== undefined ? next.year : year) || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AdminLayout title="Fee Records">
            <PageHeader
                title="Fee Records"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Fees' }, { label: 'Fee Records' }]}
            />

            <ListingCard
                title={classSelected ? 'Class students' : 'Fee records'}
                total={classSelected ? students?.total : undefined}
                filterHint={
                    classSelected
                        ? `${summary.paid} paid · ${summary.unpaid} unpaid`
                        : undefined
                }
                filters={filters}
                perPageUrl="/admin/fees/receipts"
                isEmpty={isEmpty}
                emptyTitle={classSelected ? 'No students found' : 'Select a class'}
                emptyDescription={
                    classSelected
                        ? 'No enrolled students match these filters.'
                        : 'Choose a class to see who has paid and who has not.'
                }
                paginator={classSelected ? students : undefined}
                toolbar={
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="w-44">
                            <Select2
                                value={classId}
                                onChange={(value) => {
                                    setClassId(value);
                                    applyFilters({ class_id: value });
                                }}
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
                        <div className="w-36">
                            <Select2
                                value={month}
                                onChange={(value) => {
                                    setMonth(value);
                                    applyFilters({ month: value });
                                }}
                                placeholder="Month"
                                searchThreshold={Infinity}
                            >
                                {monthOptions.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                        <div className="w-28">
                            <Select2
                                value={year}
                                onChange={(value) => {
                                    setYear(value);
                                    applyFilters({ year: value });
                                }}
                                placeholder="Year"
                                searchThreshold={Infinity}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </Select2>
                        </div>
                        {classSelected ? (
                            <ListingSearch
                                url="/admin/fees/receipts"
                                filters={filters}
                                defaultValue={filters.search}
                                placeholder="Student…"
                            />
                        ) : null}
                        {classSelected ? (
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-9 shrink-0"
                                onClick={() => {
                                    setClassId('');
                                    router.get('/admin/fees/receipts', {}, { preserveState: true, replace: true });
                                }}
                            >
                                Clear
                            </Button>
                        ) : null}
                    </div>
                }
            >
                {classSelected ? (
                    <DataTable>
                        <DataTableHead>
                            <Th>Student</Th>
                            <Th>Status</Th>
                            <Th>Receipt</Th>
                            <Th>Date</Th>
                            <Th>Amount</Th>
                            <Th>Method</Th>
                            <Th align="right">Actions</Th>
                        </DataTableHead>
                        <DataTableBody>
                            {rows.map((row) => (
                                <Tr key={row.id}>
                                    <Td>
                                        <p className="font-medium text-ink-900">{row.student_name}</p>
                                        <p className="font-mono text-xs text-slate-400">{row.admission_number}</p>
                                    </Td>
                                    <Td>
                                        <span
                                            className={
                                                row.paid
                                                    ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                                                    : 'inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200'
                                            }
                                        >
                                            {row.paid ? 'Paid' : 'Not paid'}
                                        </span>
                                    </Td>
                                    <Td className="font-semibold text-ink-900">
                                        {row.payment_number || '—'}
                                    </Td>
                                    <Td className="text-slate-600">{row.payment_date || '—'}</Td>
                                    <Td className="font-semibold text-ink-900">
                                        {row.amount != null ? Number(row.amount).toFixed(2) : '—'}
                                    </Td>
                                    <Td className="capitalize text-slate-600">
                                        {row.payment_method ? String(row.payment_method).replace('_', ' ') : '—'}
                                    </Td>
                                    <Td>
                                        {row.paid && row.payment_id ? (
                                            <RowActions>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    title="Print POS receipt"
                                                >
                                                    <a
                                                        href={`/admin/fees/receipts/${row.payment_id}/print`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </RowActions>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </DataTableBody>
                    </DataTable>
                ) : null}
            </ListingCard>
        </AdminLayout>
    );
}
