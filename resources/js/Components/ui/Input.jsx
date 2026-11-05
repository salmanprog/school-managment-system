import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input({ className, type = 'text', invalid = false, ...props }, ref) {
    return (
        <input
            ref={ref}
            type={type}
            className={cn(
                'flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
                invalid
                    ? 'border-rose-400 focus-visible:ring-rose-400'
                    : 'border-slate-300 focus-visible:ring-teal-500',
                className,
            )}
            {...props}
        />
    );
});
