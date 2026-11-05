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
import { ListingSearch } from '@/Components/ListingSearch';
import { Button } from '@/Components/ui/Button';
import { Select2 } from '@/Components/ui/Select2';
import { Link, router } from '@inertiajs/react';
import { Eye, FileDown } from 'lucide-react';
import { useState } from 'react';

export default function Index({ invoices, sessionOptions, filters, statusOptions }) {
    const [status, setStatus] = useState(filters.status || '');
    const [sessionId, setSessionId] = useState(filters.session_id || '');

    const onFilter = (e) => {
        e.preventDefault();
        router.get(
            '/admin/fees/invoices',
            {
                ...filters,
                status: status || undefined,
                session_id: sessionId || undefined,
            },
            { preserveState: true },
        );
    };

    const isEmpty = invoices.data.length === 0;
    const hasFilters = filters.search || filters.status || filters.session_id;

    return (
        <AdminLayout title="Invoices">
            <PageHeader
                title="Invoices"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Fees' }, { label: 'Invoices' }]}
                description="Create class invoices, then collect payments from Collect Fees."
                action={{ label: 'Generate invoices', href: '/admin/fees/generate' }}
            />

            <ListingCard
                title="All invoices"
                total={invoices.total}
                filterHint={hasFilters ? 'matching filters' : undefined}
                filters={filters}
                perPageUrl="/admin/fees/invoices"
                isEmpty={isEmpty}
                emptyTitle="No invoices"
                emptyDescription="Generate invoices for students or adjust your filters."
                paginator={invoices}
                toolbar={
                    <div className="flex flex-nowrap items-end gap-2">
                        <ListingSearch
                            url="/admin/fees/invoices"
                            filters={filters}
                            defaultValue={filters.search}
                            placeholder="Invoice or student…"
                        />
                        <form noValidate onSubmit={onFilter} className="flex flex-nowrap items-end gap-2">
                            <Select2 value={status} onChange={setStatus} placeholder="All statuses" allowClear>
                                <option value="">All statuses</option>
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s.replace('_', ' ')}
                                    </option>
                                ))}
                            </Select2>
                            <Select2 value={sessionId} onChange={setSessionId} placeholder="All sessions" allowClear>
                                <option value="">All sessions</option>
                                {sessionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </Select2>
                            <Button type="submit" variant="secondary" className="shrink-0">
                                Filter
                            </Button>
                        </form>
                    </div>
                }
            >
                <DataTable minWidth="800px">
                    <DataTableHead>
                        <Th>Invoice</Th>
                        <Th>Student</Th>
                        <Th>Class</Th>
                        <Th>Period</Th>
                        <Th>Total</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {invoices.data.map((row) => (
                            <Tr key={row.id}>
                                <Td className="font-medium text-slate-900">{row.invoice_number}</Td>
                                <Td>
                                    <span className="text-slate-900">{row.student_name}</span>
                                    <div className="text-xs text-slate-500">{row.admission_number}</div>
                                </Td>
                                <Td className="text-slate-600">{row.class_name}</Td>
                                <Td className="text-slate-600">{row.billing_period}</Td>
                                <Td className="font-medium text-slate-900">{row.total_amount.toFixed(2)}</Td>
                                <Td>
                                    <StatusBadge status={row.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button type="button" variant="ghost" size="icon" asChild title="View invoice">
                                            <Link href={`/admin/fees/invoices/${row.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Download PDF"
                                            onClick={() => {
                                                const url = `/admin/fees/invoices/${row.id}/pdf`;
                                                const anchor = document.createElement('a');
                                                anchor.href = url;
                                                anchor.setAttribute('download', `invoice-${row.invoice_number || row.id}.pdf`);
                                                document.body.appendChild(anchor);
                                                anchor.click();
                                                anchor.remove();
                                            }}
                                        >
                                            <FileDown className="h-4 w-4" />
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
