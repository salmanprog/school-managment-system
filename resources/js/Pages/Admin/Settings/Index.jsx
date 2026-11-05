import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Link } from '@inertiajs/react';

export default function Index({ setting }) {
    return (
        <AdminLayout title="Settings">
            <PageHeader
                title="General Settings"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>School profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                    {setting ? (
                        <>
                            <p>
                                <span className="font-medium text-slate-800">Name:</span> {setting.school_name}
                            </p>
                            <p>
                                <span className="font-medium text-slate-800">Currency:</span> {setting.currency}
                            </p>
                            <p>
                                <span className="font-medium text-slate-800">Timezone:</span> {setting.timezone}
                            </p>
                        </>
                    ) : (
                        <p>No school settings record found yet.</p>
                    )}
                    <Link href="/admin/school-profile" className="inline-block text-brand-700 hover:underline">
                        Open school profile editor →
                    </Link>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
