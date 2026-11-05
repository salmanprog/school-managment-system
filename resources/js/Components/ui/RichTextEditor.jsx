import { useEffect, useId, useRef, useState } from 'react';
import $ from 'jquery';
import iconsUrl from 'trumbowyg/dist/ui/icons.svg?url';
import 'trumbowyg/dist/ui/trumbowyg.min.css';
import { cn } from '@/lib/utils';

const SIMPLE_BTNS = [
    ['viewHTML'],
    ['formatting'],
    ['strong', 'em', 'underline'],
    ['link'],
    ['unorderedList', 'orderedList'],
    ['removeformat'],
];

let trumbowygLoader = null;

function loadTrumbowyg() {
    if (!trumbowygLoader) {
        window.$ = window.jQuery = $;
        trumbowygLoader = import('trumbowyg/dist/trumbowyg.min.js').then(() => {
            if (typeof $.fn.trumbowyg !== 'function') {
                throw new Error('Trumbowyg failed to attach to jQuery.');
            }
            $.trumbowyg.svgPath = iconsUrl;
        });
    }

    return trumbowygLoader;
}

/**
 * jQuery Trumbowyg editor with a simple toolbar.
 * Loads on demand so listing pages stay stable.
 */
export function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Write something…',
    disabled = false,
    invalid = false,
    className,
    id,
}) {
    const textareaRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const valueRef = useRef(value);
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) {
            return undefined;
        }

        let active = true;
        const $el = $(el);

        loadTrumbowyg()
            .then(() => {
                if (!active || !textareaRef.current) {
                    return;
                }

                $el.trumbowyg({
                    svgPath: iconsUrl,
                    btns: SIMPLE_BTNS,
                    autogrow: true,
                    removeformatPasted: true,
                    disabled,
                });

                $el.trumbowyg('html', valueRef.current || '');

                $el.on('tbwchange.smsEditor tbwblur.smsEditor', () => {
                    onChangeRef.current?.(normalizeEmpty($el.trumbowyg('html')));
                });

                setReady(true);
            })
            .catch((error) => {
                console.error(error);
                if (active) {
                    setFailed(true);
                }
            });

        return () => {
            active = false;
            $el.off('.smsEditor');
            if (typeof $.fn.trumbowyg === 'function' && $el.data('trumbowyg')) {
                $el.trumbowyg('destroy');
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!ready || failed) {
            return;
        }

        const el = textareaRef.current;
        if (!el) {
            return;
        }

        const $el = $(el);
        if (!$el.data('trumbowyg')) {
            return;
        }

        const current = normalizeEmpty($el.trumbowyg('html'));
        const next = normalizeEmpty(value || '');
        if (current !== next) {
            $el.trumbowyg('html', value || '');
        }
    }, [value, ready, failed]);

    useEffect(() => {
        if (!ready || failed) {
            return;
        }

        const el = textareaRef.current;
        if (!el) {
            return;
        }

        const $el = $(el);
        if (!$el.data('trumbowyg')) {
            return;
        }

        $el.trumbowyg(disabled ? 'disable' : 'enable');
    }, [disabled, ready, failed]);

    if (failed) {
        return (
            <textarea
                id={fieldId}
                className={cn(
                    'flex min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm',
                    invalid && 'border-rose-400',
                    className,
                )}
                value={value || ''}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
            />
        );
    }

    return (
        <div
            className={cn(
                'sms-rich-text',
                invalid && 'sms-rich-text--invalid',
                !ready && 'min-h-[140px] animate-pulse rounded-lg bg-slate-50',
                className,
            )}
        >
            <textarea
                ref={textareaRef}
                id={fieldId}
                defaultValue={value || ''}
                placeholder={placeholder}
            />
        </div>
    );
}

function normalizeEmpty(html) {
    if (!html) {
        return '';
    }
    const plain = String(html)
        .replace(/<br\s*\/?>/gi, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/<p>\s*<\/p>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    return plain === '' ? '' : html;
}

export { stripHtml } from '@/lib/stripHtml';
