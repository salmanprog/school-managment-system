import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
    return (
        <div
            className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-panel', className)}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }) {
    return (
        <div
            className={cn('flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:px-6', className)}
            {...props}
        />
    );
}

export function CardTitle({ className, ...props }) {
    return <h3 className={cn('font-display text-lg font-semibold tracking-tight text-ink-900', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
    return <p className={cn('text-sm text-slate-500', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
    return <div className={cn('p-5 sm:p-6', className)} {...props} />;
}
