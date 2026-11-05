import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/PaginationLinks';
import {
    DataTable,
    DataTableBody,
    DataTableHead,
    ListingCard,
    RowActions,
    Td,
    Th,
    Tr,
} from '@/Components/ListingCard';
import { ListingSearch } from '@/Components/ListingSearch';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { stripHtml } from '@/lib/stripHtml';
import { confirmDelete } from '@/lib/swal';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

const RichTextEditor = lazy(() =>
    import('@/Components/ui/RichTextEditor').then((mod) => ({ default: mod.RichTextEditor })),
);

const emptyForm = { name: '', code: '', description: '', status: 'active' };

export default function Index({ subjects, filters, statusOptions }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(emptyForm);

    const openCreate = () => {
        reset();
        clearErrors();
        setEditing(null);
        setData(emptyForm);
        setDrawerOpen(true);
    };

    const openEdit = (row) => {
        clearErrors();
        setEditing(row);
        setData({
            name: row.name,
            code: row.code,
            description: row.description ?? '',
            status: row.status,
        });
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setEditing(null);
        reset();
        clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeDrawer };
        if (editing) {
            put(`/admin/subjects/${editing.id}`, opts);
        } else {
            post('/admin/subjects', opts);
        }
    };

    const destroy = async (id) => {
        if (await confirmDelete('this subject')) {
            router.delete(`/admin/subjects/${id}`, { preserveScroll: true });
        }
    };

    const isEmpty = subjects.data.length === 0;
    const filterHint = filters.search ? `matching “${filters.search}”` : undefined;

    return (
        <AdminLayout title="Subjects">
            <PageHeader
                title="Subjects"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'School Setup' }, { label: 'Subjects' }]}
                action={{ label: 'Add subject', onClick: openCreate }}
            />

            <ListingCard
                title="All subjects"
                total={subjects.total}
                filterHint={filterHint}
                filters={filters}
                perPageUrl="/admin/subjects"
                isEmpty={isEmpty}
                emptyTitle={filters.search ? 'No subjects found' : 'No subjects yet'}
                emptyDescription={
                    filters.search
                        ? 'Try a different search term or clear the filter.'
                        : 'Add subjects to build your curriculum catalog.'
                }
                emptyAction={
                    !filters.search ? (
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Add subject
                        </Button>
                    ) : null
                }
                paginator={subjects}
                toolbar={
                    <ListingSearch
                        url="/admin/subjects"
                        filters={filters}
                        defaultValue={filters.search}
                        placeholder="Search name or code…"
                    />
                }
            >
                <DataTable>
                    <DataTableHead>
                        <Th>Name</Th>
                        <Th>Code</Th>
                        <Th>Description</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {subjects.data.map((row) => (
                            <Tr key={row.id}>
                                <Td className="font-semibold text-ink-900">{row.name}</Td>
                                <Td mono>{row.code}</Td>
                                <Td className="max-w-xs truncate text-slate-600">
                                    {stripHtml(row.description) || '—'}
                                </Td>
                                <Td>
                                    <StatusBadge status={row.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(row)}
                                            title="Edit subject"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={() => destroy(row.id)}
                                            title="Delete subject"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </RowActions>
                                </Td>
                            </Tr>
                        ))}
                    </DataTableBody>
                </DataTable>
            </ListingCard>

            <SideDrawer
                open={drawerOpen}
                onClose={closeDrawer}
                title={editing ? 'Edit subject' : 'Add subject'}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="subject-form" disabled={processing}>
                            {editing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                }
            >
                <form id="subject-form" noValidate onSubmit={submit} className="space-y-4">
                    <Field label="Name" required error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    </Field>
                    <Field label="Code" required error={errors.code}>
                        <Input value={data.code} onChange={(e) => setData('code', e.target.value)} />
                    </Field>
                    <Field label="Description" error={errors.description}>
                        <Suspense
                            fallback={
                                <div className="min-h-[160px] animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
                            }
                        >
                            <RichTextEditor
                                key={editing?.id ?? 'create'}
                                value={data.description}
                                onChange={(html) => setData('description', html)}
                                placeholder="Optional subject description…"
                                invalid={Boolean(errors.description)}
                            />
                        </Suspense>
                    </Field>
                    <Field label="Status" error={errors.status}>
                        <Select2
                            value={data.status}
                            onChange={(value) => setData('status', value)}
                            invalid={Boolean(errors.status)}
                            searchThreshold={Infinity}
                        >
                            {statusOptions.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </Select2>
                    </Field>
                </form>
            </SideDrawer>
        </AdminLayout>
    );
}

function Field({ label, error, children, required = false }) {
    return (
        <div>
            <Label className="mb-1.5 block" required={required}>
                {label}
            </Label>
            {children}
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
    );
}
