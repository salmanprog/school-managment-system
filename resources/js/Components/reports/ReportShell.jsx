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
import AdminLayout from '@/Layouts/AdminLayout';
import { Download } from 'lucide-react';

function buildExportUrl(path, query = {}) {
    const params = new URLSearchParams();

    Object.entries({ ...query, export: '1' }).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        params.set(key, String(value));
    });

    const qs = params.toString();
    return qs ? `${path}?${qs}` : `${path}?export=1`;
}

export function ReportShell({
    title,
    breadcrumbs,
    description = 'Filter the list, then export to Excel when you need a spreadsheet copy.',
    summary,
    filtersForm,
    columns,
    rows,
    exportPath,
    query = {},
    emptyTitle = 'No records found',
    emptyDescription = 'Try adjusting your filters or search terms.',
}) {
    const exportExcel = () => {
        window.location.href = buildExportUrl(exportPath, query);
    };

    const isEmpty = rows.length === 0;
    const summaryEntries = summary ? Object.entries(summary) : [];

    return (
        <AdminLayout title={title}>
            <PageHeader title={title} breadcrumbs={breadcrumbs} description={description} />

            {summaryEntries.length > 0 ? (
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {summaryEntries.map(([key, value]) => (
                        <div
                            key={key}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70"
                        >
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                {key.replace(/_/g, ' ')}
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            ) : null}

            <ListingCard
                title="Results"
                total={rows.length}
                filterHint="in this report"
                isEmpty={isEmpty}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
                toolbar={
                    <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0 flex-1">{filtersForm}</div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 self-end"
                            onClick={exportExcel}
                        >
                            <Download className="mr-1.5 h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                }
            >
                <DataTable minWidth="880px">
                    <DataTableHead>
                        {columns.map((col) => (
                            <Th key={col.key} className={col.headerClassName} align={col.align}>
                                {col.label}
                            </Th>
                        ))}
                    </DataTableHead>
                    <DataTableBody>
                        {rows.map((row, idx) => (
                            <Tr key={row.id ?? row.admission_number ?? idx}>
                                {columns.map((col) => {
                                    const value = row[col.key];
                                    const content = col.render
                                        ? col.render(value, row, idx)
                                        : value ?? '—';

                                    return (
                                        <Td
                                            key={col.key}
                                            align={col.align}
                                            mono={col.mono}
                                            className={col.className}
                                        >
                                            {content}
                                        </Td>
                                    );
                                })}
                            </Tr>
                        ))}
                    </DataTableBody>
                </DataTable>
            </ListingCard>
        </AdminLayout>
    );
}
