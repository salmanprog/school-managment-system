import { PaginationLinks } from '@/Components/PaginationLinks';
import { EmptyState } from '@/Components/ui/EmptyState';
import { Card, CardContent } from '@/Components/ui/Card';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

/**
 * CRM-style listing shell: toolbar, dense data table, pagination footer.
 */
export function ListingCard({
    title = 'All records',
    total = 0,
    filterHint,
    toolbar,
    isEmpty = false,
    emptyTitle = 'No records found',
    emptyDescription = 'Try adjusting your filters or create a new record.',
    emptyAction,
    paginator,
    filters = {},
    perPageUrl,
    children,
    className,
}) {
    const countLabel = `${total} ${total === 1 ? 'record' : 'records'}${filterHint ? ` ${filterHint}` : ''}`;
    const showFooter = !isEmpty && paginator;
    const currentPerPage = Number(filters.per_page || paginator?.per_page || 10);

    return (
        <Card className={cn('overflow-hidden shadow-sm ring-1 ring-slate-200/80', className)}>
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold tracking-tight text-ink-900">{title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{countLabel}</p>
                </div>
                {toolbar && (
                    <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
                        {toolbar}
                    </div>
                )}
            </div>

            <CardContent className="p-0">
                {isEmpty ? (
                    <div className="p-6">
                        <EmptyState title={emptyTitle} description={emptyDescription} />
                        {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
                    </div>
                ) : (
                    children
                )}

                {showFooter && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>
                                Showing{' '}
                                <span className="font-semibold text-slate-700">{paginator.from ?? 0}</span>
                                –
                                <span className="font-semibold text-slate-700">{paginator.to ?? 0}</span> of{' '}
                                <span className="font-semibold text-slate-700">{paginator.total ?? total}</span>
                            </span>
                            {perPageUrl && (
                                <label className="inline-flex items-center gap-1.5">
                                    <span>Rows</span>
                                    <select
                                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 shadow-sm"
                                        value={currentPerPage}
                                        onChange={(e) => {
                                            router.get(
                                                perPageUrl,
                                                { ...filters, per_page: e.target.value, page: 1 },
                                                { preserveState: true, preserveScroll: true, replace: true },
                                            );
                                        }}
                                    >
                                        {[10, 25, 50, 100].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </div>
                        <PaginationLinks links={paginator.links ?? []} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function DataTable({ children, minWidth = '760px', className }) {
    return (
        <div className="overflow-x-auto">
            <table
                className={cn(
                    'w-full border-collapse text-left text-[13px] text-slate-700',
                    className,
                )}
                style={{ minWidth }}
            >
                {children}
            </table>
        </div>
    );
}

export function DataTableHead({ children }) {
    return (
        <thead>
            <tr className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {children}
            </tr>
        </thead>
    );
}

export function Th({ children, className, align = 'left', sortKey, filters, sortUrl }) {
    const active = filters?.sort === sortKey;
    const dir = filters?.dir === 'desc' ? 'desc' : 'asc';

    const content = sortKey && sortUrl ? (
        <button
            type="button"
            className="inline-flex items-center gap-1 transition hover:text-teal-700"
            onClick={() => {
                const nextDir = active && dir === 'asc' ? 'desc' : 'asc';
                router.get(
                    sortUrl,
                    { ...filters, sort: sortKey, dir: nextDir, page: 1 },
                    { preserveState: true, preserveScroll: true, replace: true },
                );
            }}
        >
            <span>{children}</span>
            {active ? (
                dir === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
            )}
        </button>
    ) : (
        children
    );

    return (
        <th
            className={cn(
                'whitespace-nowrap border border-slate-200 bg-slate-100 px-4 py-2.5',
                align === 'right' && 'text-right',
                className,
            )}
        >
            {content}
        </th>
    );
}

export function DataTableBody({ children }) {
    return <tbody>{children}</tbody>;
}

export function Tr({ children, className, ...props }) {
    return (
        <tr
            className={cn(
                'group bg-white transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-teal-50/50',
                className,
            )}
            {...props}
        >
            {children}
        </tr>
    );
}

export function Td({ children, className, align = 'left', mono = false }) {
    return (
        <td
            className={cn(
                'border border-slate-200 px-4 py-2.5 align-middle',
                align === 'right' && 'text-right',
                mono && 'font-mono text-xs text-slate-600',
                className,
            )}
        >
            {children}
        </td>
    );
}

export function RowActions({ children }) {
    return (
        <div className="flex items-center justify-end gap-0.5 opacity-70 transition group-hover:opacity-100">
            {children}
        </div>
    );
}
