import { ListingSearch } from '@/Components/ListingSearch';
import { ReportShell } from '@/Components/reports/ReportShell';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function statusVariant(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'active') return 'success';
    if (value === 'inactive' || value === 'withdrawn' || value === 'alumni') return 'muted';
    if (value === 'suspended') return 'warning';
    return 'default';
}

export default function Students({ rows, filters, filterOptions, summary }) {
    const [sessionId, setSessionId] = useState(filters.session_id ?? '');
    const [classId, setClassId] = useState(filters.class_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const apply = (e) => {
        e.preventDefault();
        router.get(
            '/admin/reports/students',
            {
                ...filters,
                session_id: sessionId || undefined,
                class_id: classId || undefined,
                status: status || undefined,
            },
            { preserveState: true },
        );
    };

    const enrichedSummary = useMemo(() => {
        const active = rows.filter((row) => String(row.status).toLowerCase() === 'active').length;
        const withClass = rows.filter((row) => row.class_name && row.class_name !== '—').length;

        return {
            total: summary?.total ?? rows.length,
            active,
            assigned_class: withClass,
            unassigned: Math.max(0, (summary?.total ?? rows.length) - withClass),
        };
    }, [rows, summary]);

    const form = (
        <form
            noValidate
            onSubmit={apply}
            className="flex w-full min-w-0 flex-wrap items-end gap-2.5"
        >
            <div className="min-w-[220px] flex-1">
                <ListingSearch
                    url="/admin/reports/students"
                    filters={filters}
                    defaultValue={filters.search ?? ''}
                    placeholder="Search name or admission #…"
                />
            </div>
            <div className="w-[160px]">
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
            <div className="w-[140px]">
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
            <div className="w-[130px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">Status</Label>
                <Select2
                    value={status}
                    onChange={setStatus}
                    placeholder="All statuses"
                    allowClear
                    searchThreshold={Infinity}
                >
                    <option value="">All statuses</option>
                    {filterOptions.statusOptions.map((s) => (
                        <option key={s} value={s}>
                            {s}
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
            title="Student Reports"
            breadcrumbs={[
                { label: 'Admin', href: '/admin' },
                { label: 'Reports' },
                { label: 'Students' },
            ]}
            description="Review enrolled students by session and class, then export the filtered list."
            summary={enrichedSummary}
            filtersForm={form}
            columns={[
                {
                    key: 'admission_number',
                    label: 'Admission #',
                    mono: true,
                    headerClassName: 'w-[140px]',
                },
                {
                    key: 'full_name',
                    label: 'Student',
                    render: (value, row) => (
                        <div className="min-w-0">
                            <p className="font-medium text-slate-900">{value || '—'}</p>
                            {row.guardian_phone && row.guardian_phone !== '—' ? (
                                <p className="mt-0.5 text-xs text-slate-500">{row.guardian_phone}</p>
                            ) : null}
                        </div>
                    ),
                },
                {
                    key: 'class_name',
                    label: 'Class / Section',
                    render: (_value, row) => (
                        <span className="text-slate-800">
                            {row.class_name || '—'}
                            {row.section_name && row.section_name !== '—'
                                ? ` · ${row.section_name}`
                                : ''}
                        </span>
                    ),
                },
                {
                    key: 'roll_number',
                    label: 'Roll #',
                    align: 'center',
                    headerClassName: 'w-[90px]',
                    className: 'tabular-nums',
                },
                {
                    key: 'guardian_name',
                    label: 'Guardian',
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
            exportPath="/admin/reports/students"
            query={filters}
            emptyTitle="No students found"
            emptyDescription="No students match the selected session, class, or search."
        />
    );
}
