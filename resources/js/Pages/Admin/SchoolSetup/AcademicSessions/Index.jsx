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
import { Badge } from '@/Components/ui/Badge';
import { ListingSearch } from '@/Components/ListingSearch';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { confirmDelete } from '@/lib/swal';
import { router, useForm } from '@inertiajs/react';
import { CalendarRange, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

const emptyForm = {
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
    status: 'active',
};

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Index({ sessions, filters, statusOptions }) {
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

    const openEdit = (session) => {
        clearErrors();
        setEditing(session);
        setData({
            name: session.name,
            start_date: session.start_date,
            end_date: session.end_date,
            is_current: session.is_current,
            status: session.status,
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
        if (editing) {
            put(`/admin/academic-sessions/${editing.id}`, {
                preserveScroll: true,
                onSuccess: closeDrawer,
            });
        } else {
            post('/admin/academic-sessions', {
                preserveScroll: true,
                onSuccess: closeDrawer,
            });
        }
    };

    const setCurrent = (id) => {
        router.post(`/admin/academic-sessions/${id}/set-current`, {}, { preserveScroll: true });
    };

    const destroy = async (id) => {
        if (await confirmDelete('this academic session')) {
            router.delete(`/admin/academic-sessions/${id}`, { preserveScroll: true });
        }
    };

    const isEmpty = sessions.data.length === 0;
    const filterHint = filters.search ? `matching “${filters.search}”` : undefined;

    return (
        <AdminLayout title="Academic Sessions">
            <PageHeader
                title="Academic Sessions"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'School Setup' },
                    { label: 'Sessions' },
                ]}
                action={{ label: 'New session', onClick: openCreate }}
            />

            <ListingCard
                title="All sessions"
                total={sessions.total}
                filterHint={filterHint}
                filters={filters}
                perPageUrl="/admin/academic-sessions"
                isEmpty={isEmpty}
                emptyTitle={filters.search ? 'No sessions found' : 'No sessions yet'}
                emptyDescription={
                    filters.search
                        ? 'Try a different search term or clear the filter.'
                        : 'Create an academic session to start the school year.'
                }
                emptyAction={
                    !filters.search ? (
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            New session
                        </Button>
                    ) : null
                }
                paginator={sessions}
                toolbar={
                    <ListingSearch
                        url="/admin/academic-sessions"
                        filters={filters}
                        defaultValue={filters.search}
                        placeholder="Search sessions…"
                    />
                }
            >
                <DataTable>
                    <DataTableHead>
                        <Th>Session</Th>
                        <Th>Period</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {sessions.data.map((session) => (
                            <Tr key={session.id}>
                                <Td>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                                            <CalendarRange className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-ink-900">{session.name}</span>
                                                {session.is_current && (
                                                    <Badge variant="success" className="gap-1">
                                                        <Star className="h-3 w-3 fill-current" />
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">Academic year session</p>
                                        </div>
                                    </div>
                                </Td>
                                <Td>
                                    <div className="text-slate-700">
                                        <span className="font-medium">{formatDate(session.start_date)}</span>
                                        <span className="mx-1.5 text-slate-300">–</span>
                                        <span className="font-medium">{formatDate(session.end_date)}</span>
                                    </div>
                                </Td>
                                <Td>
                                    <StatusBadge status={session.status} />
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        {!session.is_current && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setCurrent(session.id)}
                                                title="Set as current session"
                                            >
                                                <Star className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(session)}
                                            title="Edit session"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {!session.is_current && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                onClick={() => destroy(session.id)}
                                                title="Delete session"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
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
                title={editing ? 'Edit session' : 'New session'}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeDrawer}>
                            Cancel
                        </Button>
                        <Button type="submit" form="session-form" disabled={processing}>
                            {editing ? 'Update' : 'Create'}
                        </Button>
                    </div>
                }
            >
                <form id="session-form" noValidate onSubmit={submit} className="space-y-4">
                    <Field label="Name" required error={errors.name}>
                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Start date" required error={errors.start_date}>
                            <Input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                            />
                        </Field>
                        <Field label="End date" required error={errors.end_date}>
                            <Input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                            />
                        </Field>
                    </div>
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
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={data.is_current}
                            onChange={(e) => setData('is_current', e.target.checked)}
                            className="rounded border-slate-300"
                        />
                        Set as current session
                    </label>
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
