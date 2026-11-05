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
import { Eye } from 'lucide-react';

export default function Pending({ invoices, sessionOptions, filters }) {
    const isEmpty = invoices.data.length === 0;

    return (
        <AdminLayout title="Pending Fees">
            <PageHeader
                title="Pending Fees"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Fees' }, { label: 'Pending' }]}
                action={{ label: 'Collect payment', href: '/admin/fees/collect', showPlus: false }}
            />

            <ListingCard
                title="Outstanding invoices"
                total={invoices.total}
                filterHint={filters.search ? `matching “${filters.search}”` : undefined}
                filters={filters}
                perPageUrl="/admin/fees/pending"
                isEmpty={isEmpty}
                emptyTitle="No pending fees"
                emptyDescription="All invoices are settled, or try adjusting your filters."
                paginator={invoices}
                toolbar={
                    <div className="flex flex-nowrap items-end gap-2">
                        <Select2
                            value={filters.session_id || ''}
                            onChange={(value) =>
                                router.get('/admin/fees/pending', { ...filters, session_id: value }, { preserveState: true })
                            }
                        >
                            {sessionOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Select2>
                        <ListingSearch
                            url="/admin/fees/pending"
                            filters={filters}
                            defaultValue={filters.search}
                            placeholder="Search…"
                        />
                    </div>
                }
            >
                <DataTable>
                    <DataTableHead>
                        <Th>Invoice</Th>
                        <Th>Student</Th>
                        <Th>Due</Th>
                        <Th>Balance</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {invoices.data.map((row) => (
                            <Tr key={row.id}>
                                <Td className="font-mono text-xs text-slate-600">{row.invoice_number}</Td>
                                <Td>
                                    <p className="font-medium text-ink-900">{row.student_name}</p>
                                    <p className="font-mono text-xs text-slate-400">{row.admission_number}</p>
                                </Td>
                                <Td className="text-slate-600">{row.due_date}</Td>
                                <Td className="font-semibold text-ink-900">{Number(row.balance_due).toFixed(2)}</Td>
                                <Td>
                                    <StatusBadge status={row.status} />
                                </Td>
                                <Td>
                                    <RowActions>
                                        <Button variant="ghost" size="icon" asChild title="View invoice">
                                            <Link href={`/admin/fees/invoices/${row.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
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
