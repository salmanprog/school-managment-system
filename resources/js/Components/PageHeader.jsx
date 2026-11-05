import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { Plus } from 'lucide-react';

export function PageHeader({ title, breadcrumbs = [], description, action }) {
    const actionContent = action ? (
        <>
            {action.showPlus !== false && (action.href || action.onClick) && <Plus className="h-4 w-4" />}
            {action.label}
        </>
    ) : null;

    return (
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                {breadcrumbs.length > 0 && (
                    <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                                {index > 0 && <span className="text-slate-300">/</span>}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="font-medium text-slate-500 transition hover:text-teal-700">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="font-semibold text-slate-700">{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}
                {title ? (
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
                ) : null}
                {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
            </div>
            {action && (
                action.href ? (
                    <Button asChild>
                        <Link href={action.href}>{actionContent}</Link>
                    </Button>
                ) : (
                    <Button onClick={action.onClick}>{actionContent}</Button>
                )
            )}
        </div>
    );
}
