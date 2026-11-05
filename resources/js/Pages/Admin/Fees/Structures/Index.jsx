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
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { confirmDelete } from '@/lib/swal';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const emptyForm = {
    academic_session_id: '',
    class_id: '',
    amount: '',
    effective_from: '',
    status: 'active',
};

export default function Index({ structures, sessionOptions, classOptions, filters, statusOptions }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm(emptyForm);

    const onFilter = (key, value) => {
        router.get('/admin/fees/structures', { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const openCreate = () => {
        reset();
        clearErrors();
        setEditing(null);
        setData({
            ...emptyForm,
            academic_session_id: filters.session_id || String(sessionOptions.find((s) => s.is_current)?.id || ''),
        });
        setDrawerOpen(true);
    };

    const openEdit = (row) => {
        clearErrors();
        setEditing(row);
        setData({
            academic_session_id: String(row.academic_session_id),
            class_id: String(row.class_id),
            amount: String(row.amount),
            effective_from: row.effective_from,
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
        if (editing) put(`/admin/fees/structures/${editing.id}`, opts);
        else post('/admin/fees/structures', opts);
    };

    const isEmpty = structures.data.length === 0;
    const hasFilters = filters.session_id || filters.class_id;

    return (
        <AdminLayout title="Fee Structures">
            <PageHeader
                title="Fee Setup"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Fees' }, { label: 'Setup' }]}
                description="One fee amount per class for each session. Edit an existing row to change the amount."
                action={{ label: 'Add fee amount', onClick: openCreate }}
            />

            <ListingCard
                title="All structures"
                total={structures.total}
                filterHint={hasFilters ? 'matching filters' : undefined}
                filters={filters}
                perPageUrl="/admin/fees/structures"
                isEmpty={isEmpty}
                emptyTitle="No structures"
                emptyDescription="Define the fee amount for each class and session."
                emptyAction={
                    <Button type="button" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add structure
                    </Button>
                }
                paginator={structures}
                toolbar={
                    <div className="flex flex-nowrap items-end gap-2">
                        <Select2
                            value={filters.session_id || ''}
                            onChange={(value) => onFilter('session_id', value)}
                            placeholder="All sessions"
                            allowClear
                        >
                            <option value="">All sessions</option>
                            {sessionOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Select2>
                        <Select2
                            value={filters.class_id || ''}
                            onChange={(value) => onFilter('class_id', value)}
                            placeholder="All classes"
                            allowClear
                        >
                            <option value="">All classes</option>
                            {classOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select2>
                    </div>
                }
            >
                <DataTable minWidth="720px">
                    <DataTableHead>
                        <Th>Session</Th>
                        <Th>Class</Th>
                        <Th>Amount</Th>
                        <Th>Effective</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {structures.data.map((row) => (
                            <Tr key={row.id}>
                                <Td className="text-slate-600">{row.session_name}</Td>
                                <Td className="text-slate-600">{row.class_name}</Td>
                                <Td className="font-medium text-slate-900">
                                    {Number(row.amount || 0).toFixed(2)}
                                </Td>
                                <Td className="text-slate-600">{row.effective_from}</Td>
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
                                            title="Edit structure"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={async () => {
                                                if (await confirmDelete('this structure')) {
                                                    router.delete(`/admin/fees/structures/${row.id}`, {
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
                                            title="Delete structure"
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
                title={`${editing ? 'Edit' : 'New'} structure`}
                size="lg"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="fee-structure-form" disabled={processing}>
                            Save
                        </Button>
                    </div>
                }
            >
                <form id="fee-structure-form" noValidate onSubmit={submit} className="space-y-3">
                    <div>
                        <Label required>Session</Label>
                        <Select2
                            value={data.academic_session_id}
                            onChange={(value) => setData('academic_session_id', value)}
                            placeholder="Select"
                        >
                            <option value="">Select</option>
                            {sessionOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Select2>
                    </div>
                    <div>
                        <Label required>Class</Label>
                        <Select2
                            value={data.class_id}
                            onChange={(value) => setData('class_id', value)}
                            placeholder="Select"
                        >
                            <option value="">Select</option>
                            {classOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select2>
                    </div>
                    <div>
                        <Label required>Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label required>Effective from</Label>
                        <Input
                            type="date"
                            value={data.effective_from}
                            onChange={(e) => setData('effective_from', e.target.value)}
                        />
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
                    {(errors.class_id || errors.amount || errors.academic_session_id) && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {errors.class_id || errors.amount || errors.academic_session_id}
                        </div>
                    )}
                </form>
            </SideDrawer>
        </AdminLayout>
    );
}
