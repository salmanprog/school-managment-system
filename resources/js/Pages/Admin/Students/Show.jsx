import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/PaginationLinks';
import { StudentIdCard } from '@/Components/StudentIdCard';
import { EmptyState } from '@/Components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck,
    ClipboardList,
    FileText,
    FolderOpen,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    UserRound,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

const TABS = [
    { id: 'personal', label: 'Personal', icon: UserRound },
    { id: 'guardians', label: 'Guardians', icon: Users },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'fees', label: 'Fees', icon: ClipboardList },
    { id: 'exams', label: 'Exams', icon: BookOpen },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
];

export default function Show({
    student,
    guardian,
    guardians,
    enrollments,
    documents,
    current_enrollment,
    school,
    tab,
    tabData,
}) {
    const [panelKey, setPanelKey] = useState(tab);

    useEffect(() => {
        setPanelKey(tab);
    }, [tab]);

    const switchTab = (next) => {
        if (next === tab) return;
        router.get(`/admin/students/${student.id}`, { tab: next }, { preserveState: true, preserveScroll: true });
    };

    const classLabel = current_enrollment
        ? `${current_enrollment.class_name}${current_enrollment.section_name ? ` · ${current_enrollment.section_name}` : ''}`
        : null;

    return (
        <AdminLayout title={student.full_name}>
            <PageHeader
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Students', href: '/admin/students' },
                    { label: student.admission_number },
                ]}
            />

            <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-panel">
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <div className="flex flex-col justify-between gap-6 px-5 py-5 sm:px-7 sm:py-6">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                                    Student profile
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                                    <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[1.85rem]">
                                        {student.full_name}
                                    </h1>
                                    <StatusBadge status={student.status} />
                                </div>
                                {classLabel && (
                                    <p className="mt-1.5 text-sm text-slate-600">
                                        <span className="font-medium text-slate-800">{classLabel}</span>
                                        {current_enrollment?.session ? (
                                            <span className="text-slate-400"> · {current_enrollment.session}</span>
                                        ) : null}
                                    </p>
                                )}
                            </div>

                            <dl className="grid gap-3 sm:grid-cols-2">
                                <QuickFact label="Admission #" value={student.admission_number} mono />
                                <QuickFact
                                    label="Roll number"
                                    value={current_enrollment?.roll_number ?? '—'}
                                />
                                <QuickFact label="Date of birth" value={formatDate(student.date_of_birth)} />
                                <QuickFact label="Gender" value={student.gender} capitalize />
                                <QuickFact
                                    label="Primary guardian"
                                    value={guardian?.full_name ?? '—'}
                                />
                                <QuickFact
                                    label="Guardian phone"
                                    value={guardian?.phone ?? '—'}
                                />
                            </dl>
                        </div>

                        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 lg:border-l lg:border-t-0">
                            <StudentIdCard
                                student={student}
                                enrollment={current_enrollment}
                                school={school}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 px-2 sm:px-4">
                        <div
                            className="flex gap-1 overflow-x-auto scrollbar-thin"
                            role="tablist"
                            aria-label="Student profile sections"
                        >
                            {TABS.map((item) => {
                                const Icon = item.icon;
                                const active = tab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => switchTab(item.id)}
                                        className={cn(
                                            'relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm font-medium transition-colors duration-200',
                                            active
                                                ? 'text-teal-700'
                                                : 'text-slate-500 hover:text-slate-800',
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="whitespace-nowrap">{item.label}</span>
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-all duration-300',
                                                active ? 'bg-teal-600 opacity-100' : 'opacity-0',
                                            )}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel sm:p-6">
                    <div key={panelKey} role="tabpanel" className="animate-profile-tab">
                        {tab === 'personal' && (
                            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                                <DetailGroup title="Basic information" icon={UserRound}>
                                    <DetailRow label="Full name" value={student.full_name} />
                                    <DetailRow label="Admission number" value={student.admission_number} mono />
                                    <DetailRow label="Date of birth" value={formatDate(student.date_of_birth)} />
                                    <DetailRow label="Gender" value={student.gender} capitalize />
                                    <DetailRow label="Admission date" value={formatDate(student.admission_date)} />
                                    <DetailRow label="Status" value={<StatusBadge status={student.status} />} />
                                    <DetailRow
                                        label="Address"
                                        value={student.address || 'Not provided'}
                                        icon={MapPin}
                                    />
                                </DetailGroup>

                                <DetailGroup title="Primary guardian" icon={Users}>
                                    {guardian ? (
                                        <>
                                            <DetailRow label="Name" value={guardian.full_name} />
                                            <DetailRow
                                                label="Relationship"
                                                value={guardian.relationship || '—'}
                                                capitalize
                                            />
                                            <DetailRow
                                                label="Phone"
                                                value={guardian.phone || '—'}
                                                icon={Phone}
                                            />
                                            <DetailRow
                                                label="Email"
                                                value={guardian.email || 'Not provided'}
                                                icon={Mail}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-500">No primary guardian on record.</p>
                                    )}
                                </DetailGroup>
                            </div>
                        )}

                        {tab === 'guardians' && (
                            <ProfileTable
                                empty="No guardians linked to this student."
                                rows={guardians}
                                columns={[
                                    { key: 'full_name', label: 'Name' },
                                    { key: 'phone', label: 'Phone' },
                                    { key: 'email', label: 'Email' },
                                    {
                                        key: 'relationship',
                                        label: 'Relationship',
                                        render: (row) => (
                                            <span className="capitalize">{row.relationship || '—'}</span>
                                        ),
                                    },
                                    {
                                        key: 'is_primary',
                                        label: 'Primary',
                                        render: (row) => (row.is_primary ? 'Yes' : '—'),
                                    },
                                ]}
                            />
                        )}

                        {tab === 'academic' && (
                            <ProfileTable
                                empty="No enrollment history yet."
                                rows={enrollments}
                                columns={[
                                    { key: 'session', label: 'Session' },
                                    { key: 'class_name', label: 'Class' },
                                    { key: 'section_name', label: 'Section' },
                                    { key: 'roll_number', label: 'Roll' },
                                    {
                                        key: 'status',
                                        label: 'Status',
                                        render: (row) => <StatusBadge status={row.status} />,
                                    },
                                ]}
                            />
                        )}

                        {tab === 'attendance' && (
                            <ProfileTable
                                empty="No attendance records for the current enrollment."
                                rows={tabData.attendance}
                                columns={[
                                    { key: 'date', label: 'Date' },
                                    {
                                        key: 'status',
                                        label: 'Status',
                                        render: (row) => <StatusBadge status={row.status} />,
                                    },
                                    { key: 'remarks', label: 'Remarks' },
                                ]}
                            />
                        )}

                        {tab === 'fees' && (
                            <ProfileTable
                                empty="No fee invoices linked to the current enrollment."
                                rows={tabData.invoices}
                                columns={[
                                    { key: 'invoice_number', label: 'Invoice #' },
                                    { key: 'invoice_date', label: 'Date' },
                                    { key: 'total_amount', label: 'Amount' },
                                    {
                                        key: 'status',
                                        label: 'Status',
                                        render: (row) => <StatusBadge status={row.status} />,
                                    },
                                ]}
                            />
                        )}

                        {tab === 'exams' && (
                            <ProfileTable
                                empty="No exam marks recorded yet."
                                rows={tabData.exam_marks}
                                columns={[
                                    { key: 'exam', label: 'Exam' },
                                    { key: 'subject', label: 'Subject' },
                                    { key: 'obtained_marks', label: 'Marks' },
                                    {
                                        key: 'attendance_status',
                                        label: 'Attendance',
                                        render: (row) => (
                                            <span className="capitalize">
                                                {row.attendance_status || '—'}
                                            </span>
                                        ),
                                    },
                                ]}
                            />
                        )}

                        {tab === 'documents' && (
                            documents.length === 0 ? (
                                <EmptyState title="No documents uploaded" />
                            ) : (
                                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                    {documents.map((doc) => (
                                        <li
                                            key={doc.id}
                                            className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm transition-colors hover:bg-slate-50/80"
                                        >
                                            <span className="flex items-center gap-2 font-medium capitalize text-slate-800">
                                                <FileText className="h-4 w-4 text-teal-600" />
                                                {doc.document_type.replace('_', ' ')}
                                            </span>
                                            <span className="truncate text-slate-500">
                                                {doc.original_filename}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

function QuickFact({ label, value, mono = false, capitalize = false }) {
    return (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
            <dd
                className={cn(
                    'mt-0.5 truncate text-sm font-semibold text-slate-900',
                    mono && 'font-mono text-[12px]',
                    capitalize && 'capitalize',
                )}
            >
                {value ?? '—'}
            </dd>
        </div>
    );
}

function DetailGroup({ title, icon: Icon, children }) {
    return (
        <div>
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-white">
                    <Icon className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            </div>
            <dl className="space-y-0 divide-y divide-slate-100">{children}</dl>
        </div>
    );
}

function DetailRow({ label, value, capitalize = false, mono = false, icon: Icon }) {
    return (
        <div className="grid gap-1 py-2.5 sm:grid-cols-[150px_1fr] sm:items-center sm:gap-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                {Icon ? <Icon className="h-3.5 w-3.5 text-teal-600" /> : null}
                {label}
            </dt>
            <dd
                className={cn(
                    'text-sm font-medium text-slate-900',
                    capitalize && 'capitalize',
                    mono && 'font-mono text-[13px]',
                )}
            >
                {value ?? '—'}
            </dd>
        </div>
    );
}

function ProfileTable({ rows = [], columns, empty }) {
    if (!rows?.length) {
        return <EmptyState title={empty} />;
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-3">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => (
                        <tr key={row.id ?? index} className="transition-colors hover:bg-teal-50/30">
                            {columns.map((col) => (
                                <td key={col.key} className="px-4 py-3 text-slate-700">
                                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
