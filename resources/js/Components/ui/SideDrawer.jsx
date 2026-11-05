import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

const SIZE_CLASS = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
};

/**
 * Right-side CRUD drawer with a slow slide-in / slide-out animation.
 */
export function SideDrawer({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    className,
}) {
    const titleId = useId();
    const [mounted, setMounted] = useState(open);
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            const frame = requestAnimationFrame(() => {
                requestAnimationFrame(() => setEntered(true));
            });
            return () => cancelAnimationFrame(frame);
        }

        setEntered(false);
        const timer = setTimeout(() => setMounted(false), 550);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!mounted) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [mounted, onClose]);

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-50" role="presentation">
            <button
                type="button"
                aria-label="Close drawer"
                className={cn(
                    'absolute inset-0 bg-slate-900/40 transition-opacity duration-[550ms] ease-out',
                    entered ? 'opacity-100' : 'opacity-0',
                )}
                onClick={onClose}
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                    'absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl',
                    'transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
                    SIZE_CLASS[size] ?? SIZE_CLASS.md,
                    entered ? 'translate-x-0' : 'translate-x-full',
                    className,
                )}
            >
                <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                            {title}
                        </h2>
                        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

                {footer ? (
                    <footer className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-5 py-4">{footer}</footer>
                ) : null}
            </aside>
        </div>,
        document.body,
    );
}
