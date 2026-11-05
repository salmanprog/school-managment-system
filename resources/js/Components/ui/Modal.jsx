import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/Components/ui/Button';

export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'lg',
    className,
    bodyClassName,
    compactHeader = false,
}) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const isSheet = size === 'sheet';

    const sizeClass =
        size === 'sm'
            ? 'max-w-md'
            : size === 'md'
              ? 'max-w-xl'
              : size === 'xl'
                ? 'max-w-4xl'
                : size === 'sheet'
                  ? 'max-w-[210mm]'
                  : 'max-w-2xl';

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center',
                isSheet ? 'p-2 sm:p-3' : 'p-4',
                isSheet && 'print:static print:block print:h-auto print:p-0',
            )}
        >
            <button
                type="button"
                aria-label="Close modal"
                className="grade-card-no-print absolute inset-0 bg-slate-900/45 print:hidden"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    'relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl',
                    isSheet ? 'max-h-[96vh]' : 'max-h-[min(88vh,44rem)]',
                    isSheet &&
                        'print:max-h-none print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none',
                    sizeClass,
                    className,
                )}
            >
                <div
                    className={cn(
                        'grade-card-no-print flex items-start justify-between gap-3 border-b border-slate-100 print:hidden',
                        compactHeader || isSheet ? 'px-3 py-2' : 'px-5 py-4',
                    )}
                >
                    <div className="min-w-0">
                        {title ? (
                            <h2
                                className={cn(
                                    'font-display font-semibold tracking-tight text-ink-900',
                                    compactHeader || isSheet ? 'text-base' : 'text-lg',
                                )}
                            >
                                {title}
                            </h2>
                        ) : null}
                        {description ? (
                            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                        ) : null}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={onClose} title="Close">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div
                    className={cn(
                        'min-h-0 flex-1',
                        isSheet ? 'overflow-y-auto px-3 py-2' : 'overflow-y-auto px-5 py-4',
                        isSheet && 'print:overflow-visible print:p-0',
                        bodyClassName,
                    )}
                >
                    {children}
                </div>
                {footer ? (
                    <div
                        className={cn(
                            'grade-card-no-print border-t border-slate-100 print:hidden',
                            isSheet || compactHeader ? 'px-3 py-2' : 'px-5 py-3',
                        )}
                    >
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body,
    );
}
