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
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { FileDown } from 'lucide-react';

export default function Index({
    reportCards,
    examOptions,
    classOptions = [],
    sessionOptions,
    filters,
}) {
    const isEmpty = reportCards.data.length === 0;
    const hasFilters = filters.exam_id || filters.class_id || filters.search;

    const applyFilters = (next = {}) => {
        router.get(
            '/admin/exams/report-cards',
            {
                session_id:
                    next.session_id !== undefined
                        ? next.session_id || undefined
                        : filters.session_id || undefined,
                exam_id:
                    next.exam_id !== undefined
                        ? next.exam_id || undefined
                        : filters.exam_id || undefined,
                class_id:
                    next.class_id !== undefined
                        ? next.class_id || undefined
                        : filters.class_id || undefined,
                search:
                    next.search !== undefined
                        ? next.search || undefined
                        : filters.search || undefined,
                per_page: filters.per_page || undefined,
            },
            { preserveState: true },
        );
    };

    return (
        <AdminLayout title="Report Cards">
            <PageHeader
                title="Report Cards"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Exams' },
                    { label: 'Report cards' },
                ]}
            />

            <ListingCard
                title="Published report cards"
                total={reportCards.total}
                filterHint={hasFilters ? 'matching filters' : undefined}
                filters={filters}
                perPageUrl="/admin/exams/report-cards"
                isEmpty={isEmpty}
                emptyTitle="No published report cards"
                emptyDescription="Publish results to make report cards available."
                paginator={reportCards}
                toolbar={
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-44">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Session
                            </Label>
                            <Select2
                                value={filters.session_id || ''}
                                onChange={(value) =>
                                    applyFilters({
                                        session_id: value || '',
                                        exam_id: '',
                                        class_id: '',
                                    })
                                }
                                searchThreshold={Infinity}
                            >
                                {sessionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                        {s.is_current ? ' (current)' : ''}
                                    </option>
                                ))}
                            </Select2>
                        </div>

                        <div className="w-56">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Exam
                            </Label>
                            <Select2
                                value={filters.exam_id || ''}
                                onChange={(value) =>
                                    applyFilters({
                                        exam_id: value || '',
                                        class_id: '',
                                    })
                                }
                                placeholder="All exams"
                                allowClear
                                searchThreshold={Infinity}
                            >
                                <option value="">All exams</option>
                                {examOptions.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </Select2>
                        </div>

                        <div className="w-44">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Class
                            </Label>
                            <Select2
                                value={filters.class_id || ''}
                                onChange={(value) =>
                                    applyFilters({ class_id: value || '' })
                                }
                                placeholder="All classes"
                                allowClear
                                searchThreshold={Infinity}
                            >
                                <option value="">All classes</option>
                                {classOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select2>
                        </div>

                        <ListingSearch
                            url="/admin/exams/report-cards"
                            filters={filters}
                            defaultValue={filters.search}
                            placeholder="Student…"
                        />
                    </div>
                }
            >
                <DataTable minWidth="800px">
                    <DataTableHead>
                        <Th>Student</Th>
                        <Th>Exam</Th>
                        <Th>Class</Th>
                        <Th>%</Th>
                        <Th>Grade</Th>
                        <Th>Published</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {reportCards.data.map((row) => (
                            <Tr key={row.id}>
                                <Td>
                                    <span className="font-medium text-slate-900">
                                        {row.student_name}
                                    </span>
                                    <div className="text-xs text-slate-500">
                                        {row.admission_number}
                                    </div>
                                </Td>
                                <Td className="text-slate-600">{row.exam_name}</Td>
                                <Td className="text-slate-600">{row.class_name}</Td>
                                <Td className="text-slate-600">
                                    {row.percentage.toFixed(2)}
                                </Td>
                                <Td className="text-slate-600">{row.grade ?? '—'}</Td>
                                <Td className="text-slate-600">{row.published_at}</Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            title="Download PDF"
                                        >
                                            <a href={`/admin/exams/report-cards/${row.id}/pdf`}>
                                                <FileDown className="h-4 w-4" />
                                            </a>
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
