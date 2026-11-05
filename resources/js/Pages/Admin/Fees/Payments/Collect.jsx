import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { cn } from '@/lib/utils';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Banknote, CalendarDays, Layers, UserRound, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

export default function Collect({
    classOptions = [],
    studentOptions = [],
    pendingInvoices = [],
    paidMonths = [],
    classFeeAmount = 0,
    filters,
    paymentMethods,
}) {
    const today = new Date().toISOString().slice(0, 10);
    const { flash } = usePage().props;
    const openedReceiptRef = useRef(null);
    const autoFilledForRef = useRef('');

    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: filters.student_id || '',
        payment_date: today,
        amount: '',
        payment_method: 'cash',
        transaction_reference: '',
        allocations: [],
    });

    const classId = filters.class_id || '';
    const sessionId = filters.session_id || '';

    const pendingTotal = useMemo(
        () => pendingInvoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0),
        [pendingInvoices],
    );

    const suggestedAmount = useMemo(() => {
        if (pendingTotal > 0) {
            return pendingTotal;
        }

        return Number(classFeeAmount || 0);
    }, [pendingTotal, classFeeAmount]);

    const monthAlreadyPaid = useMemo(() => {
        const yearMonth = String(data.payment_date || '').slice(0, 7);
        if (!yearMonth) {
            return null;
        }

        return paidMonths.find((row) => row.year_month === yearMonth) || null;
    }, [paidMonths, data.payment_date]);

    const selectedClass = classOptions.find((c) => String(c.id) === String(classId));
    const selectedStudent = studentOptions.find((s) => String(s.id) === String(data.student_id));

    useEffect(() => {
        const receiptId = flash?.print_receipt_id;
        if (!receiptId || openedReceiptRef.current === receiptId) {
            return;
        }

        openedReceiptRef.current = receiptId;
        window.open(`/admin/fees/receipts/${receiptId}/print`, 'fee-pos-receipt', 'width=420,height=720');

        reset();
        setData({
            student_id: '',
            payment_date: today,
            amount: '',
            payment_method: 'cash',
            transaction_reference: '',
            allocations: [],
        });

        router.get('/admin/fees/collect', {}, { replace: true, preserveState: false, preserveScroll: true });
    }, [flash?.print_receipt_id, reset, setData, today]);

    // Auto-fill amount from class fee setup (or pending balance) when student is selected.
    useEffect(() => {
        const studentKey = String(data.student_id || '');
        if (!studentKey || suggestedAmount <= 0) {
            return;
        }

        const fillKey = `${studentKey}:${suggestedAmount.toFixed(2)}`;
        if (autoFilledForRef.current === fillKey) {
            return;
        }

        autoFilledForRef.current = fillKey;
        setData('amount', suggestedAmount.toFixed(2));
    }, [data.student_id, suggestedAmount, setData]);

    const reloadCollect = (next = {}) => {
        router.get(
            '/admin/fees/collect',
            {
                session_id: sessionId || undefined,
                class_id: next.class_id !== undefined ? next.class_id || undefined : classId || undefined,
                student_id:
                    next.student_id !== undefined ? next.student_id || undefined : data.student_id || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const onClassChange = (value) => {
        autoFilledForRef.current = '';
        setData({ ...data, student_id: '', amount: '' });
        reloadCollect({ class_id: value, student_id: '' });
    };

    const onStudentChange = (id) => {
        autoFilledForRef.current = '';
        setData({ ...data, student_id: id, amount: '' });
        reloadCollect({ student_id: id });
    };

    const fillSuggestedAmount = () => {
        if (suggestedAmount > 0) {
            setData('amount', String(suggestedAmount.toFixed(2)));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        // allocations stay empty → server auto-applies payment to pending fees.
        post('/admin/fees/collect', { preserveScroll: true });
    };

    return (
        <AdminLayout title="Collect Fees">
            <PageHeader
                title="Collect Fees"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Fees' }, { label: 'Collect' }]}
                description="Select class and student, enter the amount, then record payment."
            />

            <form noValidate onSubmit={submit} className="space-y-5">
                {errors.collect && (
                    <div
                        role="alert"
                        className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-sm"
                    >
                        Payment was not recorded: {errors.collect}
                    </div>
                )}

                {!errors.collect && monthAlreadyPaid && (
                    <div
                        role="alert"
                        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm"
                    >
                        Fee for {monthAlreadyPaid.month_label} already received ({monthAlreadyPaid.payment_number}
                        , {Number(monthAlreadyPaid.amount).toFixed(2)}). Only one payment is allowed per month.
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
                                        <CardTitle>Class & student</CardTitle>
                                        <CardDescription>
                                            Choose a class, then select the student who is paying.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label required>Class</Label>
                                        <Select2
                                            value={classId}
                                            onChange={onClassChange}
                                            placeholder="Select class"
                                        >
                                            <option value="">Select class</option>
                                            {classOptions.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </Select2>
                                    </div>
                                    <div>
                                        <Label required>Student</Label>
                                        <Select2
                                            value={data.student_id}
                                            onChange={onStudentChange}
                                            placeholder={classId ? 'Select student' : 'Select class first'}
                                            disabled={!classId}
                                            invalid={Boolean(errors.student_id)}
                                        >
                                            <option value="">
                                                {classId ? 'Select student' : 'Select class first'}
                                            </option>
                                            {studentOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </Select2>
                                        {classId && studentOptions.length === 0 && (
                                            <p className="mt-1.5 text-xs text-amber-700">
                                                No enrolled students found in this class for the current session.
                                            </p>
                                        )}
                                        {errors.student_id && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.student_id}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                                        <WalletCards className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle>Payment</CardTitle>
                                        <CardDescription>Enter amount and payment method.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label required>Payment date</Label>
                                        <Input
                                            type="date"
                                            value={data.payment_date}
                                            onChange={(e) => setData('payment_date', e.target.value)}
                                            className={cn(errors.payment_date && 'border-rose-400')}
                                        />
                                        {errors.payment_date && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.payment_date}</p>
                                        )}
                                    </div>
                                    <div>
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <Label required>Amount</Label>
                                            {data.student_id && suggestedAmount > 0 && (
                                                <button
                                                    type="button"
                                                    className="text-xs font-medium text-teal-700 hover:underline"
                                                    onClick={fillSuggestedAmount}
                                                >
                                                    Use fee {suggestedAmount.toFixed(2)}
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder="0.00"
                                            className={cn(errors.amount && 'border-rose-400')}
                                        />
                                        {errors.amount && (
                                            <p className="mt-1 text-sm text-rose-600">{errors.amount}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label required>Method</Label>
                                        <Select2
                                            value={data.payment_method}
                                            onChange={(value) => setData('payment_method', value)}
                                            searchThreshold={Infinity}
                                        >
                                            {paymentMethods.map((m) => (
                                                <option key={m} value={m}>
                                                    {m.replace('_', ' ')}
                                                </option>
                                            ))}
                                        </Select2>
                                    </div>
                                    <div>
                                        <Label>Reference (optional)</Label>
                                        <Input
                                            value={data.transaction_reference}
                                            onChange={(e) => setData('transaction_reference', e.target.value)}
                                            placeholder="Txn / cheque no."
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden">
                            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</p>
                                <p className="mt-1 font-display text-lg font-semibold text-ink-900">Payment</p>
                            </div>
                            <CardContent className="space-y-4">
                                <dl className="space-y-3 text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-slate-500">Class</dt>
                                        <dd className="text-right font-medium text-ink-900">
                                            {selectedClass?.name || 'Not selected'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="inline-flex items-center gap-1.5 text-slate-500">
                                            <UserRound className="h-3.5 w-3.5" />
                                            Student
                                        </dt>
                                        <dd className="max-w-[11rem] text-right font-medium text-ink-900">
                                            {selectedStudent?.label || 'Not selected'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="inline-flex items-center gap-1.5 text-slate-500">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            Date
                                        </dt>
                                        <dd className="font-medium text-ink-900">{data.payment_date || '—'}</dd>
                                    </div>
                                    {data.student_id ? (
                                        <>
                                            <div className="flex items-start justify-between gap-3">
                                                <dt className="text-slate-500">Class fee</dt>
                                                <dd className="font-medium tabular-nums text-ink-900">
                                                    {Number(classFeeAmount || 0).toFixed(2)}
                                                </dd>
                                            </div>
                                            {pendingTotal > 0 ? (
                                                <div className="flex items-start justify-between gap-3">
                                                    <dt className="text-slate-500">Pending due</dt>
                                                    <dd className="font-medium tabular-nums text-ink-900">
                                                        {pendingTotal.toFixed(2)}
                                                    </dd>
                                                </div>
                                            ) : null}
                                        </>
                                    ) : null}
                                    <div className="flex items-start justify-between gap-3 border-t border-slate-100 pt-3">
                                        <dt className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                                            <Banknote className="h-3.5 w-3.5" />
                                            Paying now
                                        </dt>
                                        <dd className="text-base font-semibold tabular-nums text-ink-900">
                                            {Number(data.amount || 0).toFixed(2)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-slate-500">Method</dt>
                                        <dd className="font-medium capitalize text-ink-900">
                                            {String(data.payment_method || '').replace('_', ' ')}
                                        </dd>
                                    </div>
                                </dl>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={
                                        processing ||
                                        !data.student_id ||
                                        !data.amount ||
                                        Boolean(monthAlreadyPaid)
                                    }
                                >
                                    {processing
                                        ? 'Saving…'
                                        : monthAlreadyPaid
                                          ? 'Already paid this month'
                                          : 'Received Payment'}
                                </Button>
                                <p className="text-center text-xs text-slate-500">
                                    After payment, open{' '}
                                    <Link href="/admin/fees/receipts" className="font-medium text-teal-700 hover:underline">
                                        Fee Records
                                    </Link>
                                    .
                                </p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}
