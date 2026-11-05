import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery-mask-plugin';
import { Input } from '@/Components/ui/Input';

const PHONE_MASK = '00000-000-0000';

/**
 * Phone input with jQuery Mask Plugin.
 * Format: 92000-000-0000
 */
export function PhoneInput({ value = '', onChange, invalid = false, id, name, placeholder = '92000-000-0000', className, disabled }) {
    const inputRef = useRef(null);

    useEffect(() => {
        const el = inputRef.current;
        if (! el) {
            return undefined;
        }

        const $el = $(el);
        $el.mask(PHONE_MASK, {
            placeholder: '_____-___-____',
            clearIfNotMatch: false,
        });

        const handle = () => {
            onChange?.($el.val() ?? '');
        };

        $el.on('input.phoneMask change.phoneMask blur.phoneMask', handle);

        if (value) {
            $el.val(value).trigger('input');
        }

        return () => {
            $el.off('.phoneMask');
            if ($el.data('mask')) {
                $el.unmask();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const el = inputRef.current;
        if (! el) {
            return;
        }
        const current = $(el).val() ?? '';
        if (String(value ?? '') !== current) {
            $(el).val(value ?? '');
        }
    }, [value]);

    return (
        <Input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            inputMode="numeric"
            autoComplete="tel"
            placeholder={placeholder}
            invalid={invalid}
            disabled={disabled}
            className={className}
            defaultValue={value ?? ''}
            onChange={() => {
                /* handled by jQuery mask listeners */
            }}
        />
    );
}

export const phoneMaskPattern = PHONE_MASK;
