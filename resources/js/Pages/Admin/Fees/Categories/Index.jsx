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

const emptyForm = { name: '', code: '', recurrence_type: 'monthly', status: 'active' };

export default function Index({ categories, filters, statusOptions, recurrenceOptions }) {
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
        setData({ name: row.name, code: row.code, recurrence_type: row.recurrence_type, status: row.status });
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
        if (editing) put(`/admin/fees/categories/${editing.id}`, opts);
        else post('/admin/fees/categories', opts);
    };

    const isEmpty = categories.data.length === 0;
    const filterHint = filters.search ? `matching “${filters.search}”` : undefined;

    return (
        <AdminLayout title="Fee Categories">
            <PageHeader
                title="Fee Categories"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Fees' }, { label: 'Categories' }]}
                action={{ label: 'Add category', onClick: openCreate }}
            />

            <ListingCard
                title="All categories"
                total={categories.total}
                filterHint={filterHint}
                filters={filters}
                perPageUrl="/admin/fees/categories"
                isEmpty={isEmpty}
                emptyTitle={filters.search ? 'No categories found' : 'No categories yet'}
                emptyDescription={
                    filters.search
                        ? 'Try a different search term or clear the filter.'
                        : 'Create fee categories to define billing types.'
                }
                emptyAction={
                    !filters.search ? (
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Add category
                        </Button>
                    ) : null
                }
                paginator={categories}
                toolbar={
                    <ListingSearch
                        url="/admin/fees/categories"
                        filters={filters}
                        defaultValue={filters.search}
                        placeholder="Search…"
                    />
                }
            >
                <DataTable>
                    <DataTableHead>
                        <Th>Name</Th>
                        <Th>Code</Th>
                        <Th>Recurrence</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {categories.data.map((row) => (
                            <Tr key={row.id}>
                                <Td className="font-medium text-slate-900">{row.name}</Td>
                                <Td className="text-slate-600">{row.code}</Td>
                                <Td className="text-slate-600">{row.recurrence_type.replace('_', ' ')}</Td>
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
                                            title="Edit category"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={async () => {
                                                if (await confirmDelete('this category')) {
                                                    router.delete(`/admin/fees/categories/${row.id}`, { preserveScroll: true });
                                                }
                                            }}
                                            title="Delete category"
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
                title={`${editing ? 'Edit' : 'New'} category`}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="fee-category-form" disabled={processing}>
                            Save
                        </Button>
                    </div>
                }
            >
                <form id="fee-category-form" noValidate onSubmit={submit} className="space-y-3">
                    <div>
                        <Label required>Name</Label>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                        <Label required>Code</Label>
                        <Input value={data.code} onChange={(e) => setData('code', e.target.value)} />
                        {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                    </div>
                    <div>
                        <Label required>Recurrence</Label>
                        <Select2
                            value={data.recurrence_type}
                            onChange={(value) => setData('recurrence_type', value)}
                            searchThreshold={Infinity}
                        >
                            {recurrenceOptions.map((o) => (
                                <option key={o} value={o}>
                                    {o.replace('_', ' ')}
                                </option>
                            ))}
                        </Select2>
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
