import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
    {
        variants: {
            variant: {
                default: 'bg-brand-50 text-brand-700',
                success: 'bg-emerald-50 text-emerald-700',
                warning: 'bg-amber-50 text-amber-700',
                danger: 'bg-rose-50 text-rose-700',
                muted: 'bg-slate-100 text-slate-600',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

export function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
