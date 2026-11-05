import { Label } from '@/Components/ui/Label';
import { cn } from '@/lib/utils';

export function FormField({ label, error, hint, children, className = '', htmlFor, required = false }) {
    return (
        <div className={cn('space-y-1.5', className)}>
            {label && (
                <Label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700" required={required}>
                    {label}
                </Label>
            )}
            {children}
            {hint && ! error && <p className="text-xs text-slate-500">{hint}</p>}
            {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        </div>
    );
}
