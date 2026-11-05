import { Children, useEffect, useId, useRef } from 'react';
import $ from 'jquery';
import { cn } from '@/lib/utils';

/**
 * jQuery Select2 wrapper for React forms / drawers.
 * Select2 is initialized globally in bootstrap.js.
 */
export function Select2({
    value = '',
    onChange,
    children,
    options,
    placeholder = 'Select…',
    allowClear = false,
    disabled = false,
    invalid = false,
    className,
    id,
    name,
    searchThreshold = 0,
}) {
    const selectRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const el = selectRef.current;
        if (!el) {
            return undefined;
        }

        if (typeof $.fn.select2 !== 'function') {
            console.error('Select2 is not available on jQuery. Check bootstrap.js.');
            return undefined;
        }

        const $el = $(el);
        const $parent = $el.closest('[role="dialog"]').length
            ? $el.closest('[role="dialog"]')
            : $(document.body);

        if ($el.hasClass('select2-hidden-accessible')) {
            $el.off('.select2Sms');
            $el.select2('destroy');
        }

        $el.select2({
            width: '100%',
            placeholder,
            allowClear,
            disabled,
            dropdownParent: $parent,
            minimumResultsForSearch: Number.isFinite(searchThreshold) ? searchThreshold : Infinity,
        });

        const syncDropdownWidth = () => {
            // Dropdown is inserted after open; wait a tick so width styles apply.
            window.requestAnimationFrame(() => {
                const containerWidth =
                    $el.next('.select2-container').outerWidth() || $el.parent().outerWidth() || 0;
                const minWidth = Math.max(containerWidth, 180);
                $('.select2-container--open .select2-dropdown').css({
                    width: `${minWidth}px`,
                    minWidth: `${minWidth}px`,
                });
            });
        };

        const emitChange = () => {
            onChangeRef.current?.($el.val() ?? '');
        };

        $el.on('select2:open.select2Sms', syncDropdownWidth);
        $el.on('change.select2Sms select2:select.select2Sms select2:clear.select2Sms', emitChange);

        const next = value === undefined || value === null ? '' : String(value);
        // Set value without notifying React (avoids wiping parent state on init).
        $el.val(next).trigger('change.select2');

        return () => {
            $el.off('.select2Sms');
            if ($el.hasClass('select2-hidden-accessible')) {
                $el.select2('destroy');
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [placeholder, allowClear, searchThreshold, optionsKey(options, children)]);

    useEffect(() => {
        const el = selectRef.current;
        if (!el || typeof $.fn.select2 !== 'function') {
            return;
        }

        const $el = $(el);
        if (!$el.hasClass('select2-hidden-accessible')) {
            return;
        }

        const next = value === undefined || value === null ? '' : String(value);
        if (String($el.val() ?? '') !== next) {
            $el.val(next).trigger('change.select2');
        }
    }, [value]);

    useEffect(() => {
        const el = selectRef.current;
        if (!el || typeof $.fn.select2 !== 'function') {
            return;
        }

        const $el = $(el);
        if (!$el.hasClass('select2-hidden-accessible')) {
            return;
        }

        $el.prop('disabled', Boolean(disabled));
    }, [disabled]);

    const optionNodes = options
        ? options.map((opt) => (
              <option key={`${opt.value}`} value={opt.value}>
                  {opt.label}
              </option>
          ))
        : children;

    return (
        <div className={cn('sms-select2', invalid && 'sms-select2--invalid', className)}>
            <select
                ref={selectRef}
                id={fieldId}
                name={name}
                disabled={disabled}
                defaultValue={value ?? ''}
                className="w-full"
            >
                {optionNodes}
            </select>
        </div>
    );
}

function optionsKey(options, children) {
    if (Array.isArray(options)) {
        return options.map((o) => `${o.value}:${o.label}`).join('|');
    }
    return String(Children.count(children));
}
