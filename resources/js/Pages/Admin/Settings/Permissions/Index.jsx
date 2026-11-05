import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { ListingCard } from '@/Components/ListingCard';
import { Badge } from '@/Components/ui/Badge';

export default function Index({ groupedPermissions }) {
    const total = groupedPermissions.reduce((sum, group) => sum + group.permissions.length, 0);

    return (
        <AdminLayout title="Permissions">
            <PageHeader
                title="Permissions"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }, { label: 'Permissions' }]}
            />

            <ListingCard
                title="Registered permissions"
                total={total}
                isEmpty={groupedPermissions.length === 0}
                emptyTitle="No permissions"
                emptyDescription="Permissions will appear after roles are seeded."
            >
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:px-6">
                    {groupedPermissions.map((group) => (
                        <div
                            key={group.group}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <h3 className="font-display text-sm font-semibold capitalize text-ink-900">
                                    {group.group}
                                </h3>
                                <Badge variant="muted">{group.permissions.length}</Badge>
                            </div>
                            <ul className="space-y-1.5">
                                {group.permissions.map((perm) => (
                                    <li key={perm} className="font-mono text-xs text-slate-600">
                                        {perm}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </ListingCard>
        </AdminLayout>
    );
}
