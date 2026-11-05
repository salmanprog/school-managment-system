import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'bg-gradient-to-br from-teal-600 to-sky-700 text-white shadow-sm shadow-teal-700/20 hover:from-teal-500 hover:to-sky-600',
                secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
                outline: 'border border-slate-300 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-800',
                ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                danger: 'bg-rose-600 text-white hover:bg-rose-700',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 rounded-lg px-3 text-xs',
                lg: 'h-11 px-6',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
