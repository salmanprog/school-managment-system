/**
 * Admin panel validation helper.
 * Disables native HTML5 tooltips and shows field-level messages.
 */
(function (window, document) {
    'use strict';

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const defaultMessages = {
        required: 'This field is required.',
        email: 'Please enter a valid email address.',
        min: 'Please enter at least :min characters.',
        max: 'Please enter no more than :max characters.',
        match: 'Fields do not match.',
    };

    function parseRules(input) {
        const raw = (input.getAttribute('data-rules') || '').trim();
        if (! raw) {
            return [];
        }

        return raw.split('|').map((rule) => {
            const [name, param] = rule.split(':');
            return { name: name.trim(), param: param ? param.trim() : null };
        }).filter((rule) => rule.name);
    }

    function messageFor(input, rule) {
        const customKey = `data-msg-${rule.name}`;
        const custom = input.getAttribute(customKey);
        if (custom) {
            return custom.replace(':min', rule.param || '').replace(':max', rule.param || '');
        }

        if (rule.name === 'min') {
            return defaultMessages.min.replace(':min', rule.param || '');
        }
        if (rule.name === 'max') {
            return defaultMessages.max.replace(':max', rule.param || '');
        }

        return defaultMessages[rule.name] || defaultMessages.required;
    }

    function getValue(input) {
        if (input.type === 'checkbox') {
            return input.checked ? '1' : '';
        }
        return String(input.value || '').trim();
    }

    function validateInput(input) {
        const rules = parseRules(input);
        const value = getValue(input);

        for (const rule of rules) {
            if (rule.name === 'required' && value === '') {
                return messageFor(input, rule);
            }
            if (rule.name === 'email' && value !== '' && ! EMAIL_PATTERN.test(value)) {
                return messageFor(input, rule);
            }
            if (rule.name === 'min' && value !== '' && value.length < Number(rule.param || 0)) {
                return messageFor(input, rule);
            }
            if (rule.name === 'max' && value !== '' && value.length > Number(rule.param || 0)) {
                return messageFor(input, rule);
            }
            if (rule.name === 'confirmed') {
                const other = document.getElementById(rule.param || `${input.id}_confirmation`);
                if (other && value !== String(other.value || '').trim()) {
                    return messageFor(input, { name: 'match', param: null });
                }
            }
        }

        return null;
    }

    function clearError(input) {
        input.classList.remove('is-invalid');
        const wrap = input.closest('[data-field]') || input.parentElement;
        const errorEl = wrap?.querySelector('[data-error]') || document.querySelector(`[data-error-for="${input.name}"]`);
        if (errorEl) {
            errorEl.hidden = true;
            errorEl.textContent = '';
        }
    }

    function showError(input, message) {
        input.classList.add('is-invalid');
        const wrap = input.closest('[data-field]') || input.parentElement;
        let errorEl = wrap?.querySelector('[data-error]') || document.querySelector(`[data-error-for="${input.name}"]`);

        if (! errorEl && wrap) {
            errorEl = document.createElement('div');
            errorEl.className = 'pos-error';
            errorEl.setAttribute('data-error', '');
            wrap.appendChild(errorEl);
        }

        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = message;
        }
    }

    function validateForm(form) {
        let firstInvalid = null;
        let valid = true;

        form.querySelectorAll('[data-rules]').forEach((input) => {
            const message = validateInput(input);
            if (message) {
                valid = false;
                showError(input, message);
                if (! firstInvalid) {
                    firstInvalid = input;
                }
            } else {
                clearError(input);
            }
        });

        if (firstInvalid) {
            firstInvalid.focus();
        }

        return valid;
    }

    function bindForm(form) {
        if (form.dataset.validationBound === '1') {
            return;
        }

        form.setAttribute('novalidate', 'novalidate');
        form.dataset.validationBound = '1';

        form.querySelectorAll('[data-rules]').forEach((input) => {
            input.removeAttribute('required');
            input.addEventListener('input', () => clearError(input));
            input.addEventListener('blur', () => {
                const message = validateInput(input);
                if (message) {
                    showError(input, message);
                } else {
                    clearError(input);
                }
            });
        });

        form.addEventListener('submit', (event) => {
            if (! validateForm(form)) {
                event.preventDefault();
                event.stopPropagation();

                const submitBtn = form.querySelector('[type="submit"]');
                if (submitBtn) {
                    submitBtn.classList.remove('is-loading');
                    submitBtn.disabled = false;
                }
                return;
            }

            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn && ! submitBtn.classList.contains('is-loading')) {
                submitBtn.classList.add('is-loading');
            }

            // Non-ajax validated forms show global loader; ajax forms handle their own
            if (! form.hasAttribute('data-ajax-form') && window.AdminLoading) {
                window.AdminLoading.show('Saving...');
            }
        });
    }

    function init(root = document) {
        root.querySelectorAll('form[data-validate], form.admin-validate').forEach(bindForm);
    }

    document.addEventListener('DOMContentLoaded', () => init());

    window.AdminValidation = {
        init,
        validateForm,
        bindForm,
    };
})(window, document);
