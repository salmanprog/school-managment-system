import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { cn } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { CalendarDays, Check, FileSpreadsheet, Layers } from 'lucide-react';

export default function Generate({ sessionOptions, classOptions, categoryOptions }) {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);

    const { data, setData, post, processing, errors } = useForm({
        academic_session_id: String(sessionOptions.find((s) => s.is_current)?.id || sessionOptions[0]?.id || ''),
        class_id: '',
        billing_period: month,
        invoice_date: today,
        due_date: today,
        fee_category_ids: [],
    });

    const selectedClass = classOptions.find((c) => String(c.id) === String(data.class_id));
    const selectedCount = data.fee_category_ids.length;

    const toggleCategory = (id) => {
        const ids = data.fee_category_ids.includes(id)
            ? data.fee_category_ids.filter((x) => x !== id)
            : [...data.fee_category_ids, id];
        setData('fee_category_ids', ids);
    };

    const selectAllCategories = () => {
        setData(
            'fee_category_ids',
            categoryOptions.map((c) => c.id),
        );
    };

    const clearCategories = () => {
        setData('fee_category_ids', []);
    };

    const submit = (e) => {
        e.preventDefault();
        post('/admin/fees/generate', { preserveScroll: true });
    };

    return (
        <AdminLayout title="Generate Invoices">
            <PageHeader
                title="Generate Fees"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Fees', href: '/admin/fees/collect' },
                    { label: 'Generate' },
                ]}
                description="Create this period’s fees for a class. Then return to Collect Fees to take payment."
                action={{ label: 'Back to collect', href: '/admin/fees/collect', showPlus: false }}
            />

            <form noValidate onSubmit={submit} className="space-y-5">
                {errors.generate && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errors.generate}
                    </div>
                )}

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="space-y-5">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                                        <Layers className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle>Billing scope</CardTitle>
                                        <CardDescription>
                                            Choose the session and class that should receive invoices.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label required>Academic session</Label>
                                        <Select2
                                            value={data.academic_session_id}
                                            onChange={(value) => setData('academic_session_id', value)}
                                            invalid={Boolean(errors.academic_session_id)}
                                        >
                                            {sessionOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                    {s.is_current ? ' (current)' : ''}
                                                </option>
                                            ))}
                                        </Select2>
                                        {errors.academic_session_id && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.academic_session_id}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label required>Class</Label>
                                        <Select2
                                            value={data.class_id}
                                            onChange={(value) => setData('class_id', value)}
                                            placeholder="Select class"
                                            invalid={Boolean(errors.class_id)}
                                        >
                                            <option value="">Select class</option>
                                            {classOptions.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </Select2>
                                        {errors.class_id && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.class_id}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                        <CalendarDays className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle>Period & dates</CardTitle>
                                        <CardDescription>
                                            Billing period labels invoices; invoice and due dates control payment timing.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="sm:col-span-1">
                                        <Label required>Billing period</Label>
                                        <Input
                                            value={data.billing_period}
                                            onChange={(e) => setData('billing_period', e.target.value)}
                                            placeholder="2026-10"
                                            className={cn(errors.billing_period && 'border-rose-400')}
                                        />
                                        <p className="mt-1.5 text-xs text-slate-500">
                                            Monthly: <span className="font-medium text-slate-700">YYYY-MM</span>
                                            <br />
                                            One-time: <span className="font-medium text-slate-700">admission-2026</span>
                                        </p>
                                        {errors.billing_period && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.billing_period}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label required>Invoice date</Label>
                                        <Input
                                            type="date"
                                            value={data.invoice_date}
                                            onChange={(e) => setData('invoice_date', e.target.value)}
                                            className={cn(errors.invoice_date && 'border-rose-400')}
                                        />
                                        {errors.invoice_date && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.invoice_date}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label required>Due date</Label>
                                        <Input
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                            className={cn(errors.due_date && 'border-rose-400')}
                                        />
                                        {errors.due_date && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.due_date}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle>Fee categories</CardTitle>
                                        <CardDescription>
                                            Leave empty to include all active structures for the class. Or pick specific
                                            categories.
                                        </CardDescription>
                                    </div>
                                </div>
                                {categoryOptions.length > 0 && (
                                    <div className="mt-3 flex gap-2 sm:mt-0">
                                        <Button type="button" variant="outline" size="sm" onClick={selectAllCategories}>
                                            Select all
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={clearCategories}>
                                            Clear
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {categoryOptions.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                        No fee categories found. Add categories under Fees Management first.
                                    </p>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {categoryOptions.map((c) => {
                                            const selected = data.fee_category_ids.includes(c.id);
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(c.id)}
                                                    className={cn(
                                                        'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                                                        selected
                                                            ? 'border-teal-300 bg-teal-50/70 ring-1 ring-teal-200'
                                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                                                            selected
                                                                ? 'border-teal-600 bg-teal-600 text-white'
                                                                : 'border-slate-300 bg-white text-transparent',
                                                        )}
                                                    >
                                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-medium text-ink-900">
                                                            {c.name}
                                                        </span>
                                                        <span className="mt-0.5 block text-xs capitalize text-slate-500">
                                                            {String(c.recurrence_type || '').replace('_', ' ')}
                                                        </span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden">
                            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</p>
                                <p className="mt-1 font-display text-lg font-semibold text-ink-900">Ready to generate</p>
                            </div>
                            <CardContent className="space-y-4">
                                <dl className="space-y-3 text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-slate-500">Session</dt>
                                        <dd className="text-right font-medium text-ink-900">
                                            {sessionOptions.find((s) => String(s.id) === String(data.academic_session_id))
                                                ?.name || '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-slate-500">Class</dt>
                                        <dd className="text-right font-medium text-ink-900">
                                            {selectedClass?.name || 'Not selected'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-slate-500">Period</dt>
                                        <dd className="text-right font-medium text-ink-900">
                                            {data.billing_period || '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-slate-500">Invoice date</dt>
                                        <dd className="text-right font-medium text-ink-900">{data.invoice_date || '—'}</dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-slate-500">Due date</dt>
                                        <dd className="text-right font-medium text-ink-900">{data.due_date || '—'}</dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3 border-t border-slate-100 pt-3">
                                        <dt className="text-slate-500">Categories</dt>
                                        <dd className="text-right font-medium text-ink-900">
                                            {selectedCount === 0 ? 'All applicable' : `${selectedCount} selected`}
                                        </dd>
                                    </div>
                                </dl>

                                <Button type="submit" className="w-full" disabled={processing || !data.class_id}>
                                    {processing ? 'Generating…' : 'Generate fees'}
                                </Button>
                                <p className="text-center text-xs text-slate-500">
                                    Or{' '}
                                    <Link href="/admin/fees/collect" className="font-medium text-teal-700 hover:underline">
                                        go to Collect Fees
                                    </Link>
                                </p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}
