import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

function AppStatusBadge({ status }) {
    const variant =
        status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : status === 'pending' ? 'warning' : 'muted';
    return (
        <Badge variant={variant} className="capitalize">
            {status}
        </Badge>
    );
}

export default function Show({ application, classOptions, canApprove, canReject }) {
    const [rejectOpen, setRejectOpen] = useState(false);

    const defaultClassId =
        application.requested_class_id?.toString() ?? application.requested_class?.id?.toString() ?? classOptions[0]?.id?.toString() ?? '';

    const approveForm = useForm({
        class_id: defaultClassId,
        guardian_relationship: 'parent',
    });

    const rejectForm = useForm({ rejection_reason: '' });

    const submitApprove = (e) => {
        e.preventDefault();
        approveForm.post(`/admin/admissions/${application.id}/approve`);
    };

    const submitReject = (e) => {
        e.preventDefault();
        rejectForm.post(`/admin/admissions/${application.id}/reject`, {
            onSuccess: () => setRejectOpen(false),
        });
    };

    return (
        <AdminLayout title={`Admission ${application.application_number}`}>
            <PageHeader
                title={application.application_number}
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Admissions', href: '/admin/admissions' },
                    { label: application.application_number },
                ]}
                description={`${application.first_name} ${application.last_name}`}
                action={
                    application.student
                        ? { label: 'View student', href: `/admin/students/${application.student.id}` }
                        : undefined
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Admission details</CardTitle>
                        <AppStatusBadge status={application.status} />
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
                        <Detail label="Applicant" value={`${application.first_name} ${application.last_name}`} />
                        <Detail label="Date of birth" value={application.date_of_birth} />
                        <Detail label="Gender" value={application.gender} />
                        <Detail label="Requested class" value={application.requested_class?.name ?? '—'} />
                        <Detail label="Admission date" value={application.application_date} />
                        <Detail label="Previous school" value={application.previous_school ?? '—'} />
                        <Detail label="Guardian" value={application.guardian_name} />
                        <Detail label="Guardian phone" value={application.guardian_phone} />
                        <Detail label="Guardian email" value={application.guardian_email ?? '—'} />
                        <Detail label="Address" value={application.address ?? '—'} className="sm:col-span-2" />
                        {application.rejection_reason && (
                            <Detail label="Rejection reason" value={application.rejection_reason} className="sm:col-span-2" />
                        )}
                        {application.reviewer && (
                            <Detail label="Reviewed by" value={application.reviewer.name} />
                        )}
                    </CardContent>
                </Card>

                {canApprove && classOptions.length === 0 && (
                    <Card>
                        <CardContent className="pt-6 text-sm text-amber-700">
                            No active classes are available. Add classes under School Setup before approving.
                        </CardContent>
                    </Card>
                )}

                {canApprove && classOptions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Approve admission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form noValidate onSubmit={submitApprove} className="space-y-4">
                                <div>
                                    <Label className="mb-1.5 block" required>
                                        Class
                                    </Label>
                                    <Select2
                                        value={approveForm.data.class_id}
                                        onChange={(value) => approveForm.setData('class_id', value)}
                                        placeholder="Select class"
                                        invalid={Boolean(approveForm.errors.class_id)}
                                    >
                                        <option value="">Select class</option>
                                        {classOptions.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </Select2>
                                    {approveForm.errors.class_id && (
                                        <p className="mt-1 text-xs text-rose-600">{approveForm.errors.class_id}</p>
                                    )}
                                </div>
                                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                    Roll number will be assigned automatically for the selected class.
                                </p>
                                <Button type="submit" className="w-full" disabled={approveForm.processing}>
                                    Approve & create student
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {canReject && (
                    <Card className={canApprove && classOptions.length > 0 ? 'lg:col-span-3' : ''}>
                        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                            <p className="text-sm text-slate-600">Reject this admission if it does not meet admission criteria.</p>
                            <Button type="button" variant="danger" onClick={() => setRejectOpen(true)}>
                                Reject admission
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <SideDrawer
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                title="Reject admission"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="reject-form" variant="danger" disabled={rejectForm.processing}>
                            Confirm reject
                        </Button>
                    </div>
                }
            >
                <form id="reject-form" noValidate onSubmit={submitReject} className="space-y-4">
                    <div>
                        <Label className="mb-1.5 block" required>
                            Reason
                        </Label>
                        <textarea
                            className="min-h-[100px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            value={rejectForm.data.rejection_reason}
                            onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                        />
                        {rejectForm.errors.rejection_reason && (
                            <p className="mt-1 text-xs text-rose-600">{rejectForm.errors.rejection_reason}</p>
                        )}
                    </div>
                </form>
            </SideDrawer>

            <div className="mt-4">
                <Button variant="outline" asChild>
                    <Link href="/admin/admissions">Back to list</Link>
                </Button>
            </div>
        </AdminLayout>
    );
}

function Detail({ label, value, className = '' }) {
    return (
        <div className={className}>
            <dt className="text-xs font-medium uppercase text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-slate-800">{value}</dd>
        </div>
    );
}
