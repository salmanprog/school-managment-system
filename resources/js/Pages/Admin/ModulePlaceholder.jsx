import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { EmptyState } from '@/Components/ui/EmptyState';

export default function ModulePlaceholder({ title, description, breadcrumbs = [], phase }) {
    return (
        <AdminLayout title={title}>
            <PageHeader title={title} breadcrumbs={breadcrumbs} description={description} />
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        {phase ? `Module scaffold — ${phase}` : 'Module page'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        title={`${title} is ready for data`}
                        description="This route is live. Connect records using the module CRUD once data is available."
                    />
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
