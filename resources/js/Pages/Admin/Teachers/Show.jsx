import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/PaginationLinks';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { EmptyState } from '@/Components/ui/EmptyState';
import { Link } from '@inertiajs/react';

function Item({ label, value }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 text-slate-900">{value || '—'}</dd>
        </div>
    );
}

export default function Show({ teacher, assignments }) {
    return (
        <AdminLayout title={teacher.full_name}>
            <PageHeader
                title={teacher.full_name}
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Teachers', href: '/admin/teachers' },
                    { label: teacher.employee_number },
                ]}
                action={{ label: 'Edit', href: `/admin/teachers/${teacher.id}/edit` }}
            />

            <div className="mb-6 flex flex-wrap items-start gap-4">
                {teacher.photo_url ? (
                    <img src={teacher.photo_url} alt="" className="h-20 w-20 rounded-xl object-cover shadow-sm" />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-700">
                        {teacher.full_name?.charAt(0)}
                    </div>
                )}
                <div>
                    <p className="font-mono text-sm text-slate-500">{teacher.employee_number}</p>
                    <StatusBadge status={teacher.status} />
                    <p className="mt-2 text-sm text-slate-600">
                        Joined {teacher.joining_date}
                        {teacher.specialization ? ` · ${teacher.specialization}` : ''}
                    </p>
                </div>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                        <Item label="Email" value={teacher.email} />
                        <Item label="Phone" value={teacher.phone} />
                        <Item label="Qualification" value={teacher.qualification} />
                        <Item label="Specialization" value={teacher.specialization} />
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Class assignments</CardTitle>
                    <Button variant="secondary" size="sm" asChild>
                        <Link href="/admin/teacher-assignments">Manage assignments</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {assignments.length === 0 ? (
                        <EmptyState title="No assignments" description="Assign this teacher to sections and subjects." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Session</th>
                                        <th className="px-4 py-3">Class</th>
                                        <th className="px-4 py-3">Section</th>
                                        <th className="px-4 py-3">Subject</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {assignments.map((a) => (
                                        <tr key={a.id}>
                                            <td className="px-4 py-3">{a.session}</td>
                                            <td className="px-4 py-3">{a.class_name}</td>
                                            <td className="px-4 py-3">{a.section_name}</td>
                                            <td className="px-4 py-3">
                                                {a.subject_name}
                                                {a.subject_code ? (
                                                    <span className="ml-1 font-mono text-xs text-slate-500">({a.subject_code})</span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
