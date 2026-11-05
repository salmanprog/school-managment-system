import { cn } from '@/lib/utils';

export function StudentIdCard({ student, enrollment, school }) {
    const classLine = enrollment
        ? [enrollment.class_name, enrollment.section_name].filter(Boolean).join(' · ')
        : '—';

    return (
        <aside className="mx-auto w-full max-w-[280px]" aria-label="Student identity card">
            <div className="overflow-hidden rounded-xl border border-teal-800/15 bg-white shadow-md shadow-teal-900/10">
                <div className="relative bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 px-3.5 py-2.5 text-white">
                    <div className="relative flex items-center gap-2">
                        {school?.logo_url ? (
                            <img
                                src={school.logo_url}
                                alt=""
                                className="h-8 w-8 rounded-md bg-white/95 object-contain p-0.5"
                            />
                        ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-xs font-bold">
                                {(school?.name || 'C').charAt(0)}
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100">
                                Student ID
                            </p>
                            <p className="truncate text-xs font-semibold leading-tight">
                                {school?.name || 'Campus'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2.5 px-3.5 py-3">
                    {student.photo_url ? (
                        <img
                            src={student.photo_url}
                            alt=""
                            className="h-[76px] w-[62px] shrink-0 rounded-md object-cover ring-1 ring-teal-100"
                        />
                    ) : (
                        <div className="flex h-[76px] w-[62px] shrink-0 items-center justify-center rounded-md bg-teal-50 text-xl font-bold text-teal-700 ring-1 ring-teal-100">
                            {(student.full_name || '?').charAt(0)}
                        </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                Name
                            </p>
                            <p className="truncate text-xs font-bold text-slate-900">
                                {student.full_name}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                    Class
                                </p>
                                <p className="truncate text-[11px] font-semibold text-slate-800">
                                    {classLine}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                    Roll
                                </p>
                                <p className="truncate text-[11px] font-semibold text-slate-800">
                                    {enrollment?.roll_number ?? '—'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                Admission #
                            </p>
                            <p className="truncate font-mono text-[10px] font-semibold text-teal-800">
                                {student.admission_number}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/90 px-3.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                Session
                            </p>
                            <p className="text-[11px] font-semibold text-slate-700">
                                {enrollment?.session ?? '—'}
                            </p>
                        </div>
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                student.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200 text-slate-600',
                            )}
                        >
                            {student.status || '—'}
                        </span>
                    </div>
                    <div
                        aria-hidden
                        className="mt-2 flex h-4 items-end gap-[2px] overflow-hidden opacity-60"
                    >
                        {Array.from({ length: 26 }).map((_, i) => (
                            <span
                                key={i}
                                className="w-[2.5px] rounded-sm bg-slate-700"
                                style={{ height: `${40 + ((i * 17) % 60)}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
