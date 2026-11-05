import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/PaginationLinks';
import {
    DataTable,
    DataTableBody,
    DataTableHead,
    ListingCard,
    Td,
    Th,
    Tr,
} from '@/Components/ListingCard';
import { ListingSearch } from '@/Components/ListingSearch';
import { Button } from '@/Components/ui/Button';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ enrollments, filters, sessionOptions, classOptions, statusOptions }) {
    const [sessionId, setSessionId] = useState(filters.session_id || '');
    const [classId, setClassId] = useState(filters.class_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            '/admin/enrollments',
            {
                ...filters,
                session_id: sessionId || undefined,
                class_id: classId || undefined,
                status: status || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filterToolbar = (
        <div className="flex flex-nowrap items-end gap-2">
            <ListingSearch
                url="/admin/enrollments"
                filters={filters}
                defaultValue={filters.search}
                placeholder="Search student…"
            />
            <form noValidate onSubmit={applyFilters} className="flex flex-nowrap items-end gap-2">
            <div>
                <Label className="mb-1 block text-xs text-slate-500">Session</Label>
                <Select2 value={sessionId} onChange={setSessionId} placeholder="Current" allowClear>
                    <option value="">Current</option>
                    {sessionOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </Select2>
            </div>
            <div>
                <Label className="mb-1 block text-xs text-slate-500">Class</Label>
                <Select2 value={classId} onChange={setClassId} placeholder="All" allowClear>
                    <option value="">All</option>
                    {classOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select2>
            </div>
            <div>
                <Label className="mb-1 block text-xs text-slate-500">Status</Label>
                <Select2 value={status} onChange={setStatus} placeholder="All" allowClear>
                    <option value="">All</option>
                    {statusOptions.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </Select2>
            </div>
            <Button type="submit" variant="secondary">
                Filter
            </Button>
        </form>
        </div>
    );

    return (
        <AdminLayout title="Enrollments">
            <PageHeader
                title="Student Enrollments"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Student Management' }]}
            />

            <ListingCard
                title="All enrollments"
                total={enrollments.total}
                filters={filters}
                perPageUrl="/admin/enrollments"
                toolbar={filterToolbar}
                isEmpty={enrollments.data.length === 0}
                emptyTitle="No enrollments found"
                emptyDescription="Adjust your filters to find enrollment records."
                paginator={enrollments}
            >
                <DataTable minWidth="880px">
                    <DataTableHead>
                        <Th>Student</Th>
                        <Th>Session</Th>
                        <Th>Class</Th>
                        <Th>Roll</Th>
                        <Th>Status</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {enrollments.data.map((row) => (
                            <Tr key={row.id}>
                                <Td>
                                    {row.student ? (
                                        <Link href={`/admin/students/${row.student.id}`} className="font-medium text-brand-700 hover:underline">
                                            {row.student.full_name}
                                        </Link>
                                    ) : (
                                        '—'
                                    )}
                                    <div className="font-mono text-xs text-slate-400">{row.student?.admission_number}</div>
                                </Td>
                                <Td>{row.session_name}</Td>
                                <Td>{row.class_name}</Td>
                                <Td>{row.roll_number ?? '—'}</Td>
                                <Td>
                                    <StatusBadge status={row.status} />
                                </Td>
                            </Tr>
                        ))}
                    </DataTableBody>
                </DataTable>
            </ListingCard>
        </AdminLayout>
    );
}
