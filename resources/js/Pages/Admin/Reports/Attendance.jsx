import { ReportShell } from '@/Components/reports/ReportShell';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function Attendance({ rows, filters, filterOptions }) {
    const [sessionId, setSessionId] = useState(filters.session_id ?? '');
    const [classId, setClassId] = useState(filters.class_id ?? '');

    const apply = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        router.get(
            '/admin/reports/attendance',
            {
                date_from: fd.get('date_from'),
                date_to: fd.get('date_to'),
                session_id: sessionId || undefined,
                class_id: classId || undefined,
            },
            { preserveState: true },
        );
    };

    const form = (
        <form noValidate onSubmit={apply} className="flex flex-wrap items-end gap-2">
            <div>
                <Label className="mb-1 block text-xs text-slate-500">From</Label>
                <Input type="date" name="date_from" defaultValue={filters.date_from} className="h-10" />
            </div>
            <div>
                <Label className="mb-1 block text-xs text-slate-500">To</Label>
                <Input type="date" name="date_to" defaultValue={filters.date_to} className="h-10" />
            </div>
            <div>
                <Label className="mb-1 block text-xs text-slate-500">Session</Label>
                <Select2 value={sessionId} onChange={setSessionId}>
                    {filterOptions.sessionOptions.map((s) => (
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
                    {filterOptions.classOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </Select2>
            </div>
            <Button type="submit">Apply</Button>
        </form>
    );

    return (
        <ReportShell
            title="Attendance Reports"
            breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }, { label: 'Attendance' }]}
            filtersForm={form}
            columns={[
                { key: 'date', label: 'Date' },
                { key: 'class_name', label: 'Class' },
                { key: 'marked', label: 'Marked' },
                { key: 'present_pct', label: 'Present %' },
            ]}
            rows={rows}
            exportPath="/admin/reports/attendance"
            query={filters}
        />
    );
}
