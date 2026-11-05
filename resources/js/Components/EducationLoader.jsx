import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const messages = [
    'Opening your classroom…',
    'Gathering student records…',
    'Preparing the timetable…',
    'Loading academic insights…',
];

export default function EducationLoader({ show = false, message }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (! show) {
            return undefined;
        }
        setIndex(0);
        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 2200);
        return () => window.clearInterval(id);
    }, [show]);

    const label = message || messages[index];

    return (
        <div
            className={cn(
                'edu-loader fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-200',
                show ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
            )}
            aria-live="polite"
            aria-busy={show}
            role="status"
        >
            <div className="edu-loader__backdrop absolute inset-0" />
            <div className="edu-loader__card relative mx-4 flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/40 bg-white/95 px-8 py-10 text-center shadow-2xl shadow-slate-900/15 backdrop-blur">
                <div className="edu-loader__orbit relative flex h-20 w-20 items-center justify-center">
                    <span className="edu-loader__ring absolute inset-0 rounded-full" />
                    <span className="edu-loader__ring edu-loader__ring--delay absolute inset-2 rounded-full" />
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-lg shadow-teal-600/30">
                        <BookOpen className="edu-loader__icon h-7 w-7" strokeWidth={2.2} />
                    </div>
                </div>
                <div>
                    <p className="font-display text-lg font-semibold tracking-tight text-slate-900">School Management</p>
                    <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
                <div className="edu-loader__dots flex items-center gap-1.5">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        </div>
    );
}
