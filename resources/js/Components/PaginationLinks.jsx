import { Link } from '@inertiajs/react';
import { Badge } from '@/Components/ui/Badge';
import { cn } from '@/lib/utils';

export function PaginationLinks({ links = [] }) {
    const pageLinks = links.filter((link) => {
        const label = String(link.label ?? '');
        return !/previous|next|«|»|&laquo;|&raquo;/i.test(label);
    });

    if (pageLinks.length <= 1) return null;

    return (
        <nav className="flex flex-wrap items-center gap-1">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveState
                        preserveScroll
                        className={cn(
                            'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2.5 text-xs font-medium',
                            link.active
                                ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-slate-100 px-2.5 text-xs text-slate-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}

export function StatusBadge({ status }) {
    const variant =
        status === 'active' ? 'success' : status === 'inactive' ? 'muted' : 'default';
    return (
        <Badge variant={variant} className="capitalize">
            {status?.replace('_', ' ') ?? '—'}
        </Badge>
    );
}
