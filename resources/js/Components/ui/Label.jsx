import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export function Label({ className, required = false, children, ...props }) {
    return (
        <LabelPrimitive.Root
            className={cn('text-sm font-medium text-slate-700', className)}
            {...props}
        >
            {children}
            {required && <span className="ml-0.5 text-rose-600" aria-hidden="true">*</span>}
        </LabelPrimitive.Root>
    );
}
