import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Inline search field + button. Debounces while typing and keeps other filters.
 */
export function ListingSearch({
    url,
    filters = {},
    param = 'search',
    defaultValue = '',
    placeholder = 'Search…',
    debounceMs = 400,
    className = '',
}) {
    const [value, setValue] = useState(defaultValue ?? '');
    const skipFirst = useRef(true);

    useEffect(() => {
        setValue(defaultValue ?? '');
    }, [defaultValue]);

    const visit = (term) => {
        const nextFilters = { ...filters, [param]: term.trim() || undefined };
        router.get(url, nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (skipFirst.current) {
            skipFirst.current = false;
            return undefined;
        }

        const timer = setTimeout(() => {
            const next = value.trim();
            const current = String(filters[param] ?? '').trim();
            if (next === current) return;
            visit(next);
        }, debounceMs);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <div className={`flex flex-nowrap items-center gap-2 ${className}`.trim()}>
            <div className="relative shrink-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            visit(value);
                        }
                    }}
                    placeholder={placeholder}
                    className="h-9 w-52 rounded-lg border-slate-300 pl-9 text-sm shadow-sm sm:w-60"
                />
            </div>
            <Button
                type="button"
                variant="secondary"
                className="h-9 shrink-0 rounded-lg px-3 text-xs font-semibold"
                onClick={() => visit(value)}
            >
                Search
            </Button>
        </div>
    );
}
