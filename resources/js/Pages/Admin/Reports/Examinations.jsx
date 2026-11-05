import { ReportShell } from '@/Components/reports/ReportShell';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Examinations({ rows, filters, filterOptions, examOptions }) {
    const [sessionId, setSessionId] = useState(filters.session_id ?? '');
    const [examId, setExamId] = useState(filters.exam_id ?? '');

    const apply = (e) => {
        e.preventDefault();
        router.get(
            '/admin/reports/examinations',
            {
                session_id: sessionId || undefined,
                exam_id: examId || undefined,
            },
            { preserveState: true },
        );
    };

    const enrichedSummary = useMemo(
        () => ({
            results: rows.length,
            published: rows.filter((row) => row.published_at && row.published_at !== '—').length,
        }),
        [rows],
    );

    const form = (
        <form
            noValidate
            onSubmit={apply}
            className="flex w-full min-w-0 flex-wrap items-end gap-2.5"
        >
            <div className="w-[180px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">Session</Label>
                <Select2
                    value={sessionId}
                    onChange={(value) => {
                        setSessionId(value);
                        setExamId('');
                    }}
                    searchThreshold={Infinity}
                >
                    {filterOptions.sessionOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                            {s.is_current ? ' (current)' : ''}
                        </option>
                    ))}
                </Select2>
            </div>
            <div className="w-[200px]">
                <Label className="mb-1 block text-xs font-medium text-slate-500">Exam</Label>
                <Select2
                    value={examId}
                    onChange={setExamId}
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
            <Button type="submit" size="sm" className="h-10 px-4">
                Apply
            </Button>
        </form>
    );

    return (
        <ReportShell
            title="Examination Reports"
            breadcrumbs={[
                { label: 'Admin', href: '/admin' },
                { label: 'Reports' },
                { label: 'Examinations' },
            ]}
            description="Browse published exam results by session and exam, then export when needed."
            summary={enrichedSummary}
            filtersForm={form}
            columns={[
                { key: 'exam_name', label: 'Exam' },
                {
                    key: 'student_name',
                    label: 'Student',
                    render: (value) => (
                        <span className="font-medium text-slate-900">{value || '—'}</span>
                    ),
                },
                {
                    key: 'class_name',
                    label: 'Class / Section',
                    render: (_value, row) => (
                        <span>
                            {row.class_name || '—'}
                            {row.section_name && row.section_name !== '—'
                                ? ` · ${row.section_name}`
                                : ''}
                        </span>
                    ),
                },
                {
                    key: 'percentage',
                    label: '%',
                    align: 'right',
                    headerClassName: 'w-[90px]',
                    className: 'tabular-nums font-semibold',
                },
                {
                    key: 'grade',
                    label: 'Grade',
                    align: 'center',
                    headerClassName: 'w-[90px]',
                    render: (value) => (
                        <Badge variant="muted" className="min-w-8 justify-center">
                            {value || '—'}
                        </Badge>
                    ),
                },
                {
                    key: 'published_at',
                    label: 'Published',
                    headerClassName: 'w-[120px]',
                    className: 'tabular-nums text-slate-600',
                },
            ]}
            rows={rows}
            exportPath="/admin/reports/examinations"
            query={filters}
            emptyTitle="No exam results found"
            emptyDescription="No published results match the selected session or exam."
        />
    );
}
