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
import { confirmDelete } from '@/lib/swal';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const emptyForm = { name: '', status: 'active' };

export default function Index({ types, filters, statusOptions }) {
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
        setData({ name: row.name, status: row.status || 'active' });
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
        if (editing) put(`/admin/exam-types/${editing.id}`, opts);
        else post('/admin/exam-types', opts);
    };

    const isEmpty = types.data.length === 0;

    return (
        <AdminLayout title="Exam Types">
            <PageHeader
                title="Exam Types"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Examinations' },
                    { label: 'Exam Types' },
                ]}
                action={{ label: 'Add type', onClick: openCreate }}
            />

            <ListingCard
                title="All exam types"
                total={types.total}
                filterHint={filters.search ? `matching “${filters.search}”` : undefined}
                filters={filters}
                perPageUrl="/admin/exam-types"
                isEmpty={isEmpty}
                emptyTitle="No exam types"
                emptyDescription="Add types such as Midterm, Final, or Test."
                emptyAction={
                    <Button type="button" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add type
                    </Button>
                }
                paginator={types}
                toolbar={
                    <ListingSearch
                        url="/admin/exam-types"
                        filters={filters}
                        defaultValue={filters.search}
                        placeholder="Search type…"
                    />
                }
            >
                <DataTable>
                    <DataTableHead>
                        <Th>Name</Th>
                        <Th>Used in exams</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {types.data.map((row) => (
                            <Tr key={row.id}>
                                <Td className="font-semibold text-ink-900">{row.name}</Td>
                                <Td className="tabular-nums text-slate-600">{row.exams_count || 0}</Td>
                                <Td>
                                    <StatusBadge status={row.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Edit type"
                                            onClick={() => openEdit(row)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                                            title={
                                                row.can_delete
                                                    ? 'Delete type'
                                                    : 'Cannot delete — used by an exam'
                                            }
                                            disabled={!row.can_delete}
                                            onClick={async () => {
                                                if (!row.can_delete) {
                                                    return;
                                                }
                                                if (await confirmDelete('this exam type')) {
                                                    router.delete(`/admin/exam-types/${row.id}`, {
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
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
                title={`${editing ? 'Edit' : 'New'} exam type`}
                size="sm"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="exam-type-form" disabled={processing}>
                            {processing ? 'Saving…' : 'Save type'}
                        </Button>
                    </div>
                }
            >
                <form id="exam-type-form" noValidate onSubmit={submit} className="space-y-4">
                    <div>
                        <Label required>Name</Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Midterm"
                        />
                        {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name}</p>}
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select2
                            value={data.status}
                            onChange={(value) => setData('status', value)}
                            searchThreshold={Infinity}
                        >
                            {statusOptions.map((o) => (
                                <option key={o} value={o}>
                                    {o}
                                </option>
                            ))}
                        </Select2>
                    </div>
                </form>
            </SideDrawer>
        </AdminLayout>
    );
}
