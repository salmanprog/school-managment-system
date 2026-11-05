import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/Button';
import { EmptyState } from '@/Components/ui/EmptyState';
import { Label } from '@/Components/ui/Label';
import { Select2 } from '@/Components/ui/Select2';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { ArrowRight, CheckSquare, GraduationCap, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function Index({ eligibleStudents, filters, sessionOptions, classOptions }) {
    const [selected, setSelected] = useState([]);
    const [sourceSessionId, setSourceSessionId] = useState(filters.source_session_id || '');
    const [sourceClassId, setSourceClassId] = useState(filters.source_class_id || '');
    const [sourceErrors, setSourceErrors] = useState({});
    const [submitError, setSubmitError] = useState('');

    const promotionForm = useForm({
        action: 'promote',
        student_ids: [],
        source_session_id: filters.source_session_id || '',
        source_class_id: filters.source_class_id || '',
        target_session_id: '',
        target_class_id: '',
    });

    const sourceSessionName = useMemo(
        () => sessionOptions.find((s) => String(s.id) === String(sourceSessionId))?.name,
        [sessionOptions, sourceSessionId],
    );
    const sourceClassName = useMemo(
        () => classOptions.find((c) => String(c.id) === String(sourceClassId))?.name,
        [classOptions, sourceClassId],
    );

    const allSelected =
        eligibleStudents.length > 0 && selected.length === eligibleStudents.length;

    const loadStudents = (e) => {
        e.preventDefault();

        const nextErrors = {};
        if (!sourceSessionId) {
            nextErrors.source_session_id = 'Please select a session.';
        }
        if (!sourceClassId) {
            nextErrors.source_class_id = 'Please select a class.';
        }

        if (Object.keys(nextErrors).length > 0) {
            setSourceErrors(nextErrors);
            return;
        }

        setSourceErrors({});
        router.get(
            '/admin/promotions',
            {
                source_session_id: sourceSessionId,
                source_class_id: sourceClassId,
            },
            { preserveState: true },
        );
        setSelected([]);
    };

    const toggle = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelected([]);
        } else {
            setSelected(eligibleStudents.map((s) => s.student_id));
        }
    };

    const submitPromotion = (e) => {
        e.preventDefault();
        setSubmitError('');

        const action = promotionForm.data.action || 'promote';
        const targetSessionId = String(promotionForm.data.target_session_id || '');
        const targetClassId = String(promotionForm.data.target_class_id || '');
        const sourceSessionIdValue = String(filters.source_session_id || sourceSessionId || '');
        const sourceClassIdValue = String(filters.source_class_id || sourceClassId || '');

        if (selected.length === 0) {
            const message = 'Please select at least one student.';
            setSubmitError(message);
            toast.error(message);
            return;
        }

        if (!sourceSessionIdValue || !sourceClassIdValue) {
            const message = 'Load a source class before processing promotions.';
            setSubmitError(message);
            toast.error(message);
            return;
        }

        if (action !== 'graduate') {
            if (!targetSessionId) {
                const message = 'Please select a target session.';
                setSubmitError(message);
                toast.error(message);
                return;
            }
            if (!targetClassId) {
                const message = 'Please select a target class.';
                setSubmitError(message);
                toast.error(message);
                return;
            }
        }

        const payload = {
            action,
            student_ids: selected.map((id) => Number(id)),
            source_session_id: Number(sourceSessionIdValue),
            source_class_id: Number(sourceClassIdValue),
            target_session_id: action === 'graduate' ? null : Number(targetSessionId),
            target_class_id: action === 'graduate' ? null : Number(targetClassId),
        };

        promotionForm.clearErrors();
        promotionForm.setData({
            ...promotionForm.data,
            ...payload,
            student_ids: payload.student_ids,
        });

        router.post('/admin/promotions', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setSelected([]);
                setSubmitError('');
            },
            onError: (errors) => {
                const message =
                    errors.student_ids ||
                    errors.target_session_id ||
                    errors.target_class_id ||
                    errors.source_class_id ||
                    errors.source_section_id ||
                    errors.target_section_id ||
                    errors.action ||
                    Object.values(errors)[0];
                const text = typeof message === 'string' ? message : 'Unable to process promotion.';
                setSubmitError(text);
                toast.error(text);
            },
            onFinish: () => {
                promotionForm.setData('student_ids', []);
            },
        });
    };

    const actionLabel =
        promotionForm.data.action === 'repeat'
            ? 'Repeat'
            : promotionForm.data.action === 'graduate'
              ? 'Graduate'
              : 'Promote';

    return (
        <AdminLayout title="Promotions">
            <PageHeader
                title="Student Promotions"
                breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Student Management' }]}
                description="Select a source class, choose students, then promote, repeat, or graduate them."
            />

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-panel">
                <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-white to-sky-50/50 px-5 py-4 sm:px-6">
                    <div className="mb-4 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                            <Users className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">1. Source class</h2>
                            <p className="text-xs text-slate-500">Load students from the class you want to process</p>
                        </div>
                    </div>

                    <form
                        noValidate
                        onSubmit={loadStudents}
                        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                    >
                        <div>
                            <Label className="mb-1.5 block text-xs text-slate-500" required>
                                Session
                            </Label>
                            <Select2
                                value={sourceSessionId}
                                onChange={(value) => {
                                    setSourceSessionId(value);
                                    setSourceErrors((prev) => ({ ...prev, source_session_id: undefined }));
                                }}
                                invalid={Boolean(sourceErrors.source_session_id)}
                            >
                                {sessionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </Select2>
                            {sourceErrors.source_session_id && (
                                <p className="mt-1 text-xs text-rose-600">{sourceErrors.source_session_id}</p>
                            )}
                        </div>
                        <div>
                            <Label className="mb-1.5 block text-xs text-slate-500" required>
                                Class
                            </Label>
                            <Select2
                                value={sourceClassId}
                                onChange={(value) => {
                                    setSourceClassId(value);
                                    setSourceErrors((prev) => ({ ...prev, source_class_id: undefined }));
                                }}
                                placeholder="Select class"
                                invalid={Boolean(sourceErrors.source_class_id)}
                            >
                                <option value="">Select class</option>
                                {classOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select2>
                            {sourceErrors.source_class_id && (
                                <p className="mt-1 text-xs text-rose-600">{sourceErrors.source_class_id}</p>
                            )}
                        </div>
                        <Button type="submit" className="sm:min-w-[140px]">
                            Load students
                        </Button>
                    </form>

                    {filters.source_class_id && (
                        <p className="mt-3 text-xs text-slate-500">
                            Showing eligible students from{' '}
                            <span className="font-semibold text-slate-700">
                                {sourceClassName || 'selected class'}
                            </span>
                            {sourceSessionName ? (
                                <>
                                    {' '}
                                    · <span className="font-semibold text-slate-700">{sourceSessionName}</span>
                                </>
                            ) : null}
                        </p>
                    )}
                </div>

                <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 border-b border-slate-100 lg:border-b-0 lg:border-r">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 sm:px-6">
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                                    <CheckSquare className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">2. Select students</h2>
                                    <p className="text-xs text-slate-500">
                                        {eligibleStudents.length} eligible · {selected.length} selected
                                    </p>
                                </div>
                            </div>
                            {eligibleStudents.length > 0 && (
                                <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                                    {allSelected ? 'Clear all' : 'Select all'}
                                </Button>
                            )}
                        </div>

                        {eligibleStudents.length === 0 ? (
                            <div className="px-5 py-12 sm:px-6">
                                <EmptyState
                                    title={
                                        filters.source_class_id
                                            ? 'No eligible students found'
                                            : 'Choose a source class'
                                    }
                                    description={
                                        filters.source_class_id
                                            ? 'There are no active enrollments for this class in the selected session.'
                                            : 'Pick a session and class above, then load students to begin.'
                                    }
                                />
                            </div>
                        ) : (
                            <ul className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto scrollbar-thin">
                                {eligibleStudents.map((s) => {
                                    const checked = selected.includes(s.student_id);
                                    return (
                                        <li key={s.student_id}>
                                            <label
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-3 px-5 py-3.5 transition-colors sm:px-6',
                                                    checked ? 'bg-teal-50/70' : 'hover:bg-slate-50/80',
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggle(s.student_id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                                />
                                                <span
                                                    className={cn(
                                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                                        checked
                                                            ? 'bg-teal-600 text-white'
                                                            : 'bg-slate-100 text-slate-600',
                                                    )}
                                                >
                                                    {s.full_name?.charAt(0) || '?'}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium text-slate-900">
                                                        {s.full_name}
                                                    </span>
                                                    <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                                        <span className="font-mono">{s.admission_number}</span>
                                                        <span>Roll {s.roll_number ?? '—'}</span>
                                                    </span>
                                                </span>
                                                {checked && (
                                                    <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-teal-700 sm:inline">
                                                        Selected
                                                    </span>
                                                )}
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <aside className="bg-slate-50/50">
                        <div className="border-b border-slate-100 px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                                    <GraduationCap className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">3. Promotion action</h2>
                                    <p className="text-xs text-slate-500">Apply to selected students</p>
                                </div>
                            </div>
                        </div>

                        <form noValidate onSubmit={submitPromotion} className="space-y-4 p-5">
                            <div className="rounded-xl border border-teal-100 bg-white px-3.5 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Selection summary
                                </p>
                                <p className="mt-1 text-2xl font-semibold tabular-nums text-teal-800">
                                    {selected.length}
                                    <span className="ml-1 text-sm font-medium text-slate-500">
                                        of {eligibleStudents.length}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <Label className="mb-1.5 block" required>
                                    Action
                                </Label>
                                <select
                                    value={promotionForm.data.action}
                                    onChange={(e) => promotionForm.setData('action', e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                >
                                    <option value="promote">Promote</option>
                                    <option value="repeat">Repeat class</option>
                                    <option value="graduate">Graduate</option>
                                </select>
                            </div>

                            {promotionForm.data.action !== 'graduate' && (
                                <>
                                    <div>
                                        <Label className="mb-1.5 block" required>
                                            Target session
                                        </Label>
                                        <select
                                            value={promotionForm.data.target_session_id}
                                            onChange={(e) =>
                                                promotionForm.setData('target_session_id', e.target.value)
                                            }
                                            className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                        >
                                            <option value="">Select session</option>
                                            {sessionOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                        {promotionForm.errors.target_session_id && (
                                            <p className="mt-1 text-xs text-rose-600">
                                                {promotionForm.errors.target_session_id}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="mb-1.5 block" required>
                                            Target class
                                        </Label>
                                        <select
                                            value={promotionForm.data.target_class_id ?? ''}
                                            onChange={(e) =>
                                                promotionForm.setData('target_class_id', e.target.value)
                                            }
                                            className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                        >
                                            <option value="">Select class</option>
                                            {classOptions.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        {promotionForm.errors.target_class_id && (
                                            <p className="mt-1 text-xs text-rose-600">
                                                {promotionForm.errors.target_class_id}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {promotionForm.errors.student_ids && (
                                <p className="text-xs text-rose-600">{promotionForm.errors.student_ids}</p>
                            )}
                            {promotionForm.errors.action && (
                                <p className="text-xs text-rose-600">{promotionForm.errors.action}</p>
                            )}
                            {submitError && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                                    {submitError}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={selected.length === 0}
                            >
                                {actionLabel} {selected.length} student
                                {selected.length === 1 ? '' : 's'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </form>
                    </aside>
                </div>
            </div>
        </AdminLayout>
    );
}
