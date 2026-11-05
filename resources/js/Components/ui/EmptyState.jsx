import { GraduationCap } from 'lucide-react';

export function EmptyState({
    title = 'No records found',
    description = 'Try adjusting your filters or create a new record.',
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
        </div>
    );
}
