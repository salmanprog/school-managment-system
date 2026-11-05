import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
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
import { Label } from '@/Components/ui/Label';
import { Modal } from '@/Components/ui/Modal';
import { Select2 } from '@/Components/ui/Select2';
import { router, useForm, usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { Fragment, useState } from 'react';

export default function Index({
    exams,
    classOptions = [],
    results,
    sessionOptions,
    filters,
    marksReadyCount = 0,
    school = null,
}) {
    const { errors } = usePage().props;
    const [viewRow, setViewRow] = useState(null);
    const calcForm = useForm({
        exam_id: filters.exam_id || '',
        session_id: filters.session_id || '',
        class_id: filters.class_id || '',
        publish: false,
    });

    const applyFilters = (next = {}) => {
        router.get(
            '/admin/exams/results',
            {
                session_id:
                    next.session_id !== undefined
                        ? next.session_id || undefined
                        : filters.session_id || undefined,
                exam_id:
                    next.exam_id !== undefined
                        ? next.exam_id || undefined
                        : filters.exam_id || undefined,
                class_id:
                    next.class_id !== undefined
                        ? next.class_id || undefined
                        : filters.class_id || undefined,
                per_page: filters.per_page || undefined,
            },
            { preserveState: true },
        );
    };

    const calculate = (publish) => {
        calcForm.transform(() => ({
            exam_id: filters.exam_id,
            session_id: filters.session_id || undefined,
            class_id: filters.class_id || undefined,
            publish,
        }));
        calcForm.post('/admin/exams/results/calculate', { preserveScroll: true });
    };

    const isEmpty = !results || results.data.length === 0;

    let emptyDescription = 'Select session, exam, and class to view students.';
    if (filters.session_id && !filters.exam_id) {
        emptyDescription = 'Select an exam to continue.';
    } else if (filters.exam_id && !filters.class_id) {
        emptyDescription = 'Select a class to show all students.';
    } else if (filters.exam_id && filters.class_id) {
        emptyDescription =
            marksReadyCount > 0
                ? 'No students found for this class.'
                : 'No students enrolled in this class for the selected session.';
    }

    const filterHint = [filters.exam_id && 'exam', filters.class_id && 'class']
        .filter(Boolean)
        .join(' · ');

    return (
        <AdminLayout title="Results">
            <PageHeader
                title="Exam Results"
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Exams' },
                    { label: 'Results' },
                ]}
            />

            <ListingCard
                title="Result summaries"
                total={results?.total ?? 0}
                filterHint={filterHint ? `for selected ${filterHint}` : undefined}
                filters={filters}
                perPageUrl="/admin/exams/results"
                isEmpty={isEmpty}
                emptyTitle="No results"
                emptyDescription={emptyDescription}
                paginator={results ?? undefined}
                toolbar={
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-44">
                            <Label className="mb-1 block text-xs font-medium text-slate-500">
                                Session
                            </Label>
                            <Select2
                                value={filters.session_id || ''}
                                onChange={(value) =>
                                    applyFilters({
                                        session_id: value || '',
                                        exam_id: '',
                                        class_id: '',
                                    })
                                }
                                searchThreshold={Infinity}
                            >
                                {sessionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                        {s.is_current ? ' (current)' : ''}
                                    </option>
                                ))}
                            </Select2>
                        </div>

                        {filters.session_id ? (
                            <div className="w-56">
                                <Label className="mb-1 block text-xs font-medium text-slate-500">
                                    Exam
                                </Label>
                                <Select2
                                    value={filters.exam_id || ''}
                                    onChange={(value) =>
                                        applyFilters({
                                            exam_id: value || '',
                                            class_id: '',
                                        })
                                    }
                                    placeholder="Select exam"
                                    allowClear
                                    searchThreshold={Infinity}
                                >
                                    <option value="">Select exam</option>
                                    {exams.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.name}
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                        ) : null}

                        {filters.exam_id ? (
                            <div className="w-44">
                                <Label className="mb-1 block text-xs font-medium text-slate-500">
                                    Class
                                </Label>
                                <Select2
                                    value={filters.class_id || ''}
                                    onChange={(value) =>
                                        applyFilters({ class_id: value || '' })
                                    }
                                    placeholder="Select class"
                                    allowClear
                                    searchThreshold={Infinity}
                                >
                                    <option value="">Select class</option>
                                    {classOptions.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select2>
                            </div>
                        ) : null}

                        {filters.exam_id && filters.class_id ? (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => calculate(false)}
                                    disabled={calcForm.processing}
                                >
                                    Calculate
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => calculate(true)}
                                    disabled={calcForm.processing}
                                >
                                    Calculate &amp; publish
                                </Button>
                            </div>
                        ) : null}
                    </div>
                }
            >
                <DataTable minWidth="920px">
                    <DataTableHead>
                        <Th>Roll</Th>
                        <Th>Student</Th>
                        <Th>Class</Th>
                        <Th>Total</Th>
                        <Th>Obtained</Th>
                        <Th>%</Th>
                        <Th>Grade</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                    </DataTableHead>
                    <DataTableBody>
                        {(results?.data || []).map((row) => (
                            <Tr key={row.id}>
                                <Td className="tabular-nums text-slate-600">
                                    {row.roll_number ?? '—'}
                                </Td>
                                <Td>
                                    <span className="font-medium text-slate-900">
                                        {row.student_name}
                                    </span>
                                    <div className="text-xs text-slate-500">
                                        {row.admission_number}
                                    </div>
                                </Td>
                                <Td className="text-slate-600">{row.class_name}</Td>
                                <Td className="text-slate-600">
                                    {row.has_result ? row.total_marks.toFixed(2) : '—'}
                                </Td>
                                <Td className="text-slate-600">
                                    {row.has_result ? row.obtained_marks.toFixed(2) : '—'}
                                </Td>
                                <Td className="text-slate-600">
                                    {row.has_result ? row.percentage.toFixed(2) : '—'}
                                </Td>
                                <Td className="text-slate-600">{row.grade ?? '—'}</Td>
                                <Td className="capitalize text-slate-600">
                                    {row.result_status ?? (row.has_result ? '—' : 'Pending')}
                                </Td>
                                <Td align="right">
                                    <RowActions>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="View student result"
                                            onClick={() => setViewRow(row)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </RowActions>
                                </Td>
                            </Tr>
                        ))}
                    </DataTableBody>
                </DataTable>
            </ListingCard>

            {(errors?.calculate || calcForm.errors?.exam_id) && (
                <p className="mt-3 text-sm text-rose-600">
                    {errors?.calculate || calcForm.errors?.exam_id}
                </p>
            )}

            <Modal
                open={Boolean(viewRow)}
                onClose={() => setViewRow(null)}
                title="Grade Card"
                size="sheet"
                compactHeader
                bodyClassName="bg-slate-100/80"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => window.print()}
                        >
                            Print
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setViewRow(null)}>
                            Close
                        </Button>
                    </div>
                }
            >
                {viewRow ? (
                    <div className="grade-card-sheet relative mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col border-2 border-slate-800 bg-white text-[11px] leading-snug text-slate-900 shadow-sm print:shadow-none">
                        <div className="grade-card-watermark pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.12]">
                            <div className="flex flex-col items-center">
                                {school?.logo_url ? (
                                    <img
                                        src={school.logo_url}
                                        alt=""
                                        className="h-52 w-52 object-contain"
                                    />
                                ) : (
                                    <div className="grade-card-watermark-fallback flex h-48 w-48 items-center justify-center rounded-full border-4 border-slate-700 text-6xl font-bold text-slate-700">
                                        {(school?.name || 'C').charAt(0)}
                                    </div>
                                )}
                                <p className="mt-3 max-w-[20rem] text-center font-display text-3xl font-bold uppercase tracking-wide text-slate-800">
                                    {school?.name || 'Campus School'}
                                </p>
                            </div>
                        </div>

                        <div className="grade-card-sheet-inner relative z-10 flex min-h-0 flex-1 flex-col">
                            <div className="grid grid-cols-2 border-b-2 border-slate-800 text-[10px] font-semibold uppercase tracking-wide">
                                <div className="border-r-2 border-slate-800 px-2 py-1.5">
                                    Admission No:{' '}
                                    <span className="font-mono normal-case tracking-normal">
                                        {viewRow.admission_number || '—'}
                                    </span>
                                </div>
                                <div className="px-2 py-1.5 text-right">
                                    Roll No:{' '}
                                    <span className="tabular-nums normal-case tracking-normal">
                                        {viewRow.roll_number ?? '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="grade-card-brand border-b-2 border-slate-800 px-3 py-3">
                                <div className="flex items-center gap-3">
                                    {school?.logo_url ? (
                                        <img
                                            src={school.logo_url}
                                            alt=""
                                            className="h-14 w-14 shrink-0 rounded-full border border-slate-300 bg-white object-contain p-0.5"
                                        />
                                    ) : (
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-slate-800 text-lg font-bold">
                                            {(school?.name || 'C').charAt(0)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1 text-center">
                                        <p className="grade-card-school-name font-display text-lg font-bold uppercase tracking-wide">
                                            {school?.name || 'Campus School'}
                                        </p>
                                        <p className="text-[11px] text-slate-600">
                                            Academic Session {viewRow.session_name || '—'}
                                        </p>
                                        <p className="mt-1.5 inline-block border border-slate-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]">
                                            Grade Card
                                        </p>
                                    </div>
                                    <div className="hidden h-14 w-14 shrink-0 sm:block" />
                                </div>
                            </div>

                            <table className="grade-card-info w-full border-collapse border-b-2 border-slate-800">
                                <tbody>
                                    {[
                                        [
                                            ['Name of Examination', viewRow.exam_name || '—'],
                                            [
                                                'Class / Section',
                                                `${viewRow.class_name || '—'}${viewRow.section_name ? ` · ${viewRow.section_name}` : ''}`,
                                            ],
                                        ],
                                        [
                                            ['Student Name', viewRow.student_name || '—'],
                                            ['Gender', viewRow.gender || '—'],
                                        ],
                                        [
                                            [
                                                'Guardian',
                                                viewRow.guardian_name
                                                    ? `${viewRow.guardian_name}${viewRow.guardian_relationship ? ` (${viewRow.guardian_relationship})` : ''}`
                                                    : '—',
                                            ],
                                            ['Date of Birth', viewRow.date_of_birth || '—'],
                                        ],
                                        [
                                            ['Registration No.', viewRow.admission_number || '—'],
                                            ['Session', viewRow.session_name || '—'],
                                        ],
                                    ].map((pair, rowIndex) => (
                                        <tr
                                            key={rowIndex}
                                            className="border-b border-slate-400 last:border-b-0"
                                        >
                                            {pair.map(([label, value]) => (
                                                <Fragment key={`${rowIndex}-${label}`}>
                                                    <td className="w-[18%] border-r border-slate-400 bg-slate-50 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                                        {label}
                                                    </td>
                                                    <td className="w-[27%] border-r border-slate-400 px-2 py-2 font-semibold capitalize text-slate-900">
                                                        {value}
                                                    </td>
                                                </Fragment>
                                            ))}
                                            {rowIndex === 0 ? (
                                                <td
                                                    rowSpan={4}
                                                    className="w-[18%] bg-slate-50 p-2 align-middle"
                                                >
                                                    <div className="flex h-full flex-col items-center justify-center gap-1">
                                                        {viewRow.photo_url ? (
                                                            <img
                                                                src={viewRow.photo_url}
                                                                alt=""
                                                                className="h-[100px] w-[80px] border border-slate-500 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-[100px] w-[80px] items-center justify-center border border-dashed border-slate-500 bg-white text-2xl font-bold text-slate-400">
                                                                {(viewRow.student_name || '?').charAt(
                                                                    0,
                                                                )}
                                                            </div>
                                                        )}
                                                        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                                            Photo
                                                        </span>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="grade-card-marks relative flex-1">
                                <table className="relative min-w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-800 bg-slate-100 text-[10px] font-bold uppercase tracking-wide">
                                            <th className="w-10 border-r border-slate-400 px-1.5 py-2 text-center">
                                                #
                                            </th>
                                            <th className="w-20 border-r border-slate-400 px-1.5 py-2 text-center">
                                                Code
                                            </th>
                                            <th className="border-r border-slate-400 px-2 py-2 text-left">
                                                Subject
                                            </th>
                                            <th className="border-r border-slate-400 px-1.5 py-2 text-center">
                                                Max
                                            </th>
                                            <th className="border-r border-slate-400 px-1.5 py-2 text-center">
                                                Pass
                                            </th>
                                            <th className="px-1.5 py-2 text-center">
                                                Obtained
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(viewRow.subject_marks || []).length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-3 py-8 text-center text-slate-500"
                                                >
                                                    No subject marks found for this student.
                                                </td>
                                            </tr>
                                        ) : (
                                            viewRow.subject_marks.map((item, index) => {
                                                const absent =
                                                    item.entered &&
                                                    item.attendance_status === 'absent';
                                                const obtained = absent
                                                    ? null
                                                    : item.entered
                                                      ? item.obtained_marks
                                                      : null;

                                                return (
                                                    <tr
                                                        key={item.schedule_id}
                                                        className="border-b border-slate-300"
                                                    >
                                                        <td className="border-r border-slate-300 px-1.5 py-2 text-center tabular-nums">
                                                            {index + 1}
                                                        </td>
                                                        <td className="border-r border-slate-300 px-1.5 py-2 text-center font-mono text-[11px]">
                                                            {item.subject_code || '—'}
                                                        </td>
                                                        <td className="border-r border-slate-300 px-2 py-2 font-medium">
                                                            {item.subject_name}
                                                        </td>
                                                        <td className="border-r border-slate-300 px-1.5 py-2 text-center tabular-nums">
                                                            {item.total_marks}
                                                        </td>
                                                        <td className="border-r border-slate-300 px-1.5 py-2 text-center tabular-nums">
                                                            {item.passing_marks}
                                                        </td>
                                                        <td className="px-1.5 py-2 text-center tabular-nums font-semibold">
                                                            {absent
                                                                ? 'AB'
                                                                : obtained !== null &&
                                                                    obtained !== undefined
                                                                  ? obtained
                                                                  : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grade-card-footer mt-auto border-t-2 border-slate-800">
                                <div className="grid border-b-2 border-slate-800 sm:grid-cols-2">
                                    <div className="border-b border-slate-800 sm:border-b-0 sm:border-r-2">
                                        <div className="border-b border-slate-800 bg-slate-100 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide">
                                            Current Exam Performance
                                        </div>
                                        <div className="grid grid-cols-3 text-center">
                                            <div className="border-r border-slate-300 px-1.5 py-2.5">
                                                <p className="text-[9px] font-semibold uppercase text-slate-500">
                                                    Total
                                                </p>
                                                <p className="text-sm font-bold tabular-nums">
                                                    {viewRow.has_result
                                                        ? viewRow.total_marks.toFixed(0)
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="border-r border-slate-300 px-1.5 py-2.5">
                                                <p className="text-[9px] font-semibold uppercase text-slate-500">
                                                    Obtained
                                                </p>
                                                <p className="text-sm font-bold tabular-nums">
                                                    {viewRow.has_result
                                                        ? viewRow.obtained_marks.toFixed(0)
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="px-1.5 py-2.5">
                                                <p className="text-[9px] font-semibold uppercase text-slate-500">
                                                    %
                                                </p>
                                                <p className="text-sm font-bold tabular-nums">
                                                    {viewRow.has_result
                                                        ? viewRow.percentage.toFixed(2)
                                                        : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="border-b border-slate-800 bg-slate-100 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide">
                                            Result Summary
                                        </div>
                                        <div className="grid grid-cols-2 text-center">
                                            <div className="border-r border-slate-300 px-1.5 py-2.5">
                                                <p className="text-[9px] font-semibold uppercase text-slate-500">
                                                    Grade
                                                </p>
                                                <p className="text-lg font-bold">
                                                    {viewRow.has_result
                                                        ? viewRow.grade || '—'
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="px-1.5 py-2.5">
                                                <p className="text-[9px] font-semibold uppercase text-slate-500">
                                                    Status
                                                </p>
                                                <p className="text-lg font-bold uppercase">
                                                    {viewRow.has_result
                                                        ? viewRow.result_status || '—'
                                                        : 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid text-[11px] sm:grid-cols-2">
                                    <div className="space-y-2 border-b border-slate-800 px-2.5 py-3 sm:border-b-0 sm:border-r-2">
                                        <p>
                                            <span className="font-semibold uppercase tracking-wide text-slate-500">
                                                Date of Result:{' '}
                                            </span>
                                            {viewRow.published_at
                                                ? String(viewRow.published_at).slice(0, 10)
                                                : '—'}
                                        </p>
                                        <p>
                                            <span className="font-semibold uppercase tracking-wide text-slate-500">
                                                Verified by:{' '}
                                            </span>
                                            Examination Office
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end justify-end px-2.5 py-3 text-right">
                                        <div className="mb-6 h-6 w-40 border-b border-dashed border-slate-400" />
                                        <p className="text-[10px] font-bold uppercase tracking-wide">
                                            Controller of Examinations
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </AdminLayout>
    );
}
