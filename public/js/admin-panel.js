document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
    const sidebarCloseTargets = document.querySelectorAll('[data-sidebar-close]');
    const userMenu = document.querySelector('[data-user-menu]');
    const userToggle = document.querySelector('[data-user-toggle]');
    const loading = document.querySelector('[data-loading]');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    const $ = window.jQuery;

    const initEnhancedSelects = (root = document) => {
        if (! $ || ! $.fn.select2) {
            return;
        }

        root.querySelectorAll('[data-enhanced-select]').forEach((select) => {
            const $select = $(select);

            if ($select.hasClass('select2-hidden-accessible')) {
                $select.select2('destroy');
            }

            $select.select2({
                width: '100%',
                placeholder: select.getAttribute('data-placeholder') || 'Select option',
                allowClear: select.getAttribute('data-allow-clear') === '1',
                dropdownParent: $(document.body),
                minimumResultsForSearch: 8,
            });
        });
    };

    initEnhancedSelects();

    const showLoading = (message) => {
        if (! loading) {
            return;
        }

        const label = loading.querySelector('p');
        if (label && typeof message === 'string' && message.trim() !== '') {
            label.textContent = message;
        } else if (label) {
            label.textContent = 'Please wait...';
        }

        loading.hidden = false;
        document.body.classList.add('is-loading');
    };

    const hideLoading = () => {
        if (! loading) {
            return;
        }

        loading.hidden = true;
        document.body.classList.remove('is-loading');
    };

    window.AdminLoading = { show: showLoading, hide: hideLoading };

    // Hide boot loader once the page is ready
    const hideBootLoader = () => hideLoading();
    if (document.readyState === 'complete') {
        hideBootLoader();
    } else {
        window.addEventListener('load', hideBootLoader, { once: true });
    }
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            hideLoading();
        }
    });

    const shouldIgnoreNavigation = (anchor) => {
        if (! anchor || anchor.hasAttribute('data-no-loading')) {
            return true;
        }

        const href = anchor.getAttribute('href') || '';
        if (! href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) {
            return true;
        }

        if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
            return true;
        }

        try {
            const url = new URL(href, window.location.origin);
            if (url.origin !== window.location.origin) {
                return true;
            }
        } catch (error) {
            return true;
        }

        return false;
    };

    document.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const anchor = event.target.closest('a[href]');
        if (! anchor || shouldIgnoreNavigation(anchor)) {
            return;
        }

        showLoading('Loading...');
    });

    document.addEventListener('submit', (event) => {
        const form = event.target;
        if (! (form instanceof HTMLFormElement)) {
            return;
        }

        if (form.hasAttribute('data-no-loading') || form.hasAttribute('data-ajax-form')) {
            return;
        }

        if (form.hasAttribute('data-confirm-delete')) {
            return;
        }

        // Validated forms: only show after validation passes (handled in admin-validation.js)
        if (form.matches('[data-validate], .admin-validate')) {
            return;
        }

        showLoading('Please wait...');
    });

    const clearFormErrors = (form) => {
        form.querySelectorAll('.is-invalid').forEach((input) => input.classList.remove('is-invalid'));
        form.querySelectorAll('.pos-image-area.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
        form.querySelectorAll('[data-error-for]').forEach((el) => {
            el.hidden = true;
            el.textContent = '';
        });
    };

    const showFormErrors = (form, errors = {}) => {
        Object.entries(errors).forEach(([field, messages]) => {
            const input = form.querySelector(`[name="${field}"]`);
            const errorEl = form.querySelector(`[data-error-for="${field}"]`);
            const message = Array.isArray(messages) ? messages[0] : messages;

            input?.classList.add('is-invalid');

            if (field === 'shop_logo') {
                input?.closest('[data-image-area]')?.classList.add('is-invalid');
            }

            if (errorEl) {
                errorEl.textContent = message;
                errorEl.hidden = false;
            }

            if (field === 'password') {
                const confirmInput = form.querySelector('[name="password_confirmation"]');
                const confirmError = form.querySelector('[data-error-for="password_confirmation"]');
                confirmInput?.classList.add('is-invalid');
                if (confirmError && /confirm/i.test(message)) {
                    confirmError.textContent = message;
                    confirmError.hidden = false;
                }
            }
        });
    };

    const syncEditors = (form) => {
        if (! $) {
            return;
        }

        $(form).find('[data-summernote]').each(function syncSummernote() {
            if ($(this).next('.note-editor').length) {
                $(this).val($(this).summernote('code'));
            }
        });
    };

    const sanitizeDecimalInput = (input) => {
        const raw = String(input.value || '');
        let cleaned = raw.replace(/[^\d.]/g, '');
        const parts = cleaned.split('.');

        if (parts.length > 1) {
            cleaned = parts.shift() + '.' + parts.join('').replace(/\./g, '');
        }

        if (cleaned !== raw) {
            const start = input.selectionStart;
            input.value = cleaned;
            if (typeof start === 'number') {
                const next = Math.max(0, start - (raw.length - cleaned.length));
                input.setSelectionRange(next, next);
            }
        }
    };

    const sanitizeIntegerInput = (input) => {
        const raw = String(input.value || '');
        const cleaned = raw.replace(/\D/g, '');

        if (cleaned !== raw) {
            const start = input.selectionStart;
            input.value = cleaned;
            if (typeof start === 'number') {
                const next = Math.max(0, start - (raw.length - cleaned.length));
                input.setSelectionRange(next, next);
            }
        }
    };

    const capitalizeFirstCharacter = (input) => {
        const value = String(input.value || '');
        if (! value) {
            return;
        }

        const next = value.charAt(0).toUpperCase() + value.slice(1);
        if (next === value) {
            return;
        }

        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = next;
        if (document.activeElement === input && typeof start === 'number' && typeof end === 'number') {
            input.setSelectionRange(start, end);
        }
    };

    document.addEventListener('input', (event) => {
        if (event.target.matches('[data-numeric-decimal]')) {
            sanitizeDecimalInput(event.target);
        }
        if (event.target.matches('[data-numeric-integer]')) {
            sanitizeIntegerInput(event.target);
        }
        if (event.target.matches('[data-capitalize-first]')) {
            capitalizeFirstCharacter(event.target);
        }
    });

    document.addEventListener('blur', (event) => {
        if (event.target.matches('[data-capitalize-first]')) {
            capitalizeFirstCharacter(event.target);
        }
    }, true);

    document.addEventListener('paste', (event) => {
        if (! event.target.matches('[data-numeric-decimal], [data-numeric-integer]')) {
            return;
        }

        event.preventDefault();
        const pasted = (event.clipboardData || window.clipboardData)?.getData('text') || '';
        const input = event.target;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        input.value = input.value.slice(0, start) + pasted + input.value.slice(end);

        if (input.matches('[data-numeric-decimal]')) {
            sanitizeDecimalInput(input);
        } else {
            sanitizeIntegerInput(input);
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    if ($) {
        $('[data-phone-mask]').each(function initPhoneMask() {
            const $input = $(this);

            if (! $input.val()) {
                $input.val('92');
            }

            $input.mask('00000-000-0000', {
                placeholder: '92000-000-0000',
            });

            const keepPhonePrefix = () => {
                const value = $input.val() || '';
                if (! value.startsWith('92')) {
                    $input.val('92');
                }
            };

            $input.on('keyup blur input', keepPhonePrefix);
            keepPhonePrefix();
        });

        $('[data-uppercase]').each(function initUppercase() {
            const $input = $(this);
            const toUpper = () => {
                const value = $input.val();
                if (typeof value === 'string' && value !== value.toUpperCase()) {
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    $input.val(value.toUpperCase());
                    if (document.activeElement === this && start != null && end != null) {
                        this.setSelectionRange(start, end);
                    }
                }
            };

            $input.on('input blur', toUpper);
            toUpper();
        });

        $('[data-summernote]').summernote({
            placeholder: 'Brief teaching background, strengths, and notes...',
            height: 180,
            toolbar: [
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['para', ['ul', 'ol']],
                ['insert', ['link']],
            ],
        });
    }

    document.querySelectorAll('[data-image-area]').forEach((area) => {
        const input = area.querySelector('[data-image-input]');
        const preview = area.querySelector('[data-image-preview]');
        const placeholder = area.querySelector('[data-image-placeholder]');
        const previewImage = area.querySelector('[data-image-preview-img]');

        area.addEventListener('click', () => input?.click());

        input?.addEventListener('change', () => {
            const file = input.files?.[0];
            if (! file || ! previewImage || ! preview || ! placeholder) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.src = event.target?.result || '';
                previewImage.alt = 'Shop logo preview';
                preview.hidden = false;
                placeholder.hidden = true;
                area.classList.add('has-image');
                area.classList.remove('is-invalid');
            };
            reader.readAsDataURL(file);
        });
    });

    sidebarToggle?.addEventListener('click', () => {
        body.classList.toggle('pos-sidebar-open');
    });

    sidebarCloseTargets.forEach((el) => {
        el.addEventListener('click', () => body.classList.remove('pos-sidebar-open'));
    });

    document.querySelectorAll('[data-submenu-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
            btn.closest('.pos-nav-item')?.classList.toggle('is-open');
        });
    });

    userToggle?.addEventListener('click', (event) => {
        event.stopPropagation();
        userMenu?.classList.toggle('is-open');
    });

    document.addEventListener('click', () => {
        userMenu?.classList.remove('is-open');
    });

    document.querySelectorAll('[data-ajax-form]').forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const submitBtn = form.querySelector('[data-submit-btn]');
            const successEl = document.querySelector('[data-form-success]');

            clearFormErrors(form);
            syncEditors(form);

            if (form.matches('[data-validate], .admin-validate') && window.AdminValidation) {
                if (! window.AdminValidation.validateForm(form)) {
                    submitBtn?.classList.remove('is-loading');
                    submitBtn?.removeAttribute('disabled');
                    return;
                }
            }

            if (successEl) {
                successEl.hidden = true;
                successEl.textContent = '';
            }

            const saleType = form.querySelector('[data-sale-type-input]')?.value || form.querySelector('#sale_type')?.value;
            if (saleType === 'cash') {
                const total = parseFloat(form.querySelector('[data-sale-total]')?.value || 0);
                const received = parseFloat(form.querySelector('[data-sale-received]')?.value || 0);

                if (Math.abs(total - received) > 0.001) {
                    if (typeof Swal !== 'undefined') {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Cash payment incomplete',
                            text: 'For cash sales, received amount must be equal to total amount.',
                            confirmButtonColor: '#3d8fd4',
                        });
                    } else {
                        alert('For cash sales, received amount must be equal to total amount.');
                    }
                    form.querySelector('[data-sale-received]')?.focus();
                    return;
                }
            }

            showLoading('Saving...');
            submitBtn?.setAttribute('disabled', 'disabled');

            let keepLoading = false;

            try {
                const response = await fetch(form.action, {
                    method: form.method || 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    body: new FormData(form),
                });

                const data = await response.json().catch(() => ({}));

                if (response.status === 422) {
                    const cashError = data.errors?.received_payment?.[0];
                    if (cashError && typeof Swal !== 'undefined') {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Cash payment incomplete',
                            text: cashError,
                            confirmButtonColor: '#0d9488',
                        });
                    }
                    showFormErrors(form, data.errors || {});
                    return;
                }

                if (! response.ok) {
                    const message = data.message || 'Something went wrong. Please try again.';
                    if (successEl) {
                        successEl.classList.remove('pos-alert-success');
                        successEl.classList.add('pos-alert-danger');
                        successEl.textContent = message;
                        successEl.hidden = false;
                    }
                    return;
                }

                if (successEl) {
                    successEl.classList.remove('pos-alert-danger');
                    successEl.classList.add('pos-alert-success');
                    successEl.textContent = data.message || 'Saved successfully.';
                    successEl.hidden = false;
                }

                if (data.redirect) {
                    keepLoading = true;
                    window.location.href = data.redirect;
                    return;
                }
            } catch (error) {
                if (successEl) {
                    successEl.classList.remove('pos-alert-success');
                    successEl.classList.add('pos-alert-danger');
                    successEl.textContent = 'Network error. Please try again.';
                    successEl.hidden = false;
                }
            } finally {
                if (! keepLoading) {
                    hideLoading();
                    submitBtn?.removeAttribute('disabled');
                }
            }
        });
    });

    const syncSelectableTable = (tableWrap) => {
        if (! tableWrap) {
            return;
        }

        const selectAll = tableWrap.querySelector('[data-select-all]');
        const rowChecks = Array.from(tableWrap.querySelectorAll('[data-row-check]'));
        const bulkBar = document.querySelector('[data-bulk-bar]');
        const bulkCount = document.querySelector('[data-bulk-count]');
        const bulkIds = document.querySelector('[data-bulk-ids]');
        const selected = rowChecks.filter((checkbox) => checkbox.checked);

        rowChecks.forEach((checkbox) => {
            checkbox.closest('[data-row]')?.classList.toggle('is-selected', checkbox.checked);
        });

        if (selectAll) {
            selectAll.checked = rowChecks.length > 0 && selected.length === rowChecks.length;
            selectAll.indeterminate = selected.length > 0 && selected.length < rowChecks.length;
        }

        if (bulkBar && bulkCount && bulkIds) {
            bulkCount.textContent = String(selected.length);
            bulkIds.innerHTML = selected
                .map((checkbox) => `<input type="hidden" name="ids[]" value="${checkbox.value}">`)
                .join('');
            bulkBar.hidden = selected.length === 0;
        }
    };

    document.addEventListener('change', (event) => {
        const selectAll = event.target.closest('[data-select-all]');
        if (selectAll) {
            const tableWrap = selectAll.closest('[data-selectable-table]');
            tableWrap?.querySelectorAll('[data-row-check]').forEach((checkbox) => {
                checkbox.checked = selectAll.checked;
            });
            syncSelectableTable(tableWrap);
            return;
        }

        if (event.target.matches('[data-row-check]')) {
            syncSelectableTable(event.target.closest('[data-selectable-table]'));
        }
    });

    document.querySelectorAll('[data-selectable-table]').forEach((tableWrap) => {
        syncSelectableTable(tableWrap);
    });

    document.querySelectorAll('[data-auto-search]').forEach((form) => {
        const input = form.querySelector('input[name="search"], input[type="search"]');
        let timer = null;

        form.addEventListener('submit', () => {
            showLoading('Searching...');
        });

        input?.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                showLoading('Searching...');
                form.requestSubmit ? form.requestSubmit() : form.submit();
            }, 400);
        });

        // Keep focus feeling after auto reload when searching
        if (input && document.activeElement !== input && input.value !== '') {
            const length = input.value.length;
            input.focus();
            input.setSelectionRange(length, length);
        }
    });

    document.querySelectorAll('[data-ajax-live-filters]').forEach((form) => {
        const targetSelector = form.dataset.resultsTarget || '[data-sales-results]';
        const results = document.querySelector(targetSelector);
        const pageInput = form.querySelector('[data-filter-page]');
        const perPageInput = form.querySelector('[data-filter-per-page]');
        const clearBtn = form.querySelector('[data-clear-filters]');
        let timer = null;
        let requestId = 0;

        if (! results) {
            return;
        }

        const hasActiveFilters = () => Array.from(form.querySelectorAll('[data-live-filter]')).some((field) => {
            return String(field.value || '').trim() !== '';
        });

        const syncClearButton = () => {
            if (clearBtn) {
                clearBtn.hidden = ! hasActiveFilters();
            }
        };

        const runSearch = async ({ resetPage = true } = {}) => {
            if (resetPage && pageInput) {
                pageInput.value = '1';
            }

            const params = new URLSearchParams(new FormData(form));
            // Drop empty filter values from the URL
            [...params.keys()].forEach((key) => {
                if (String(params.get(key) || '').trim() === '') {
                    params.delete(key);
                }
            });

            const url = `${form.action}?${params.toString()}`;
            const currentRequest = ++requestId;

            results.classList.add('is-filtering');

            try {
                const response = await fetch(url, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'text/html',
                    },
                });

                if (! response.ok) {
                    throw new Error('Search failed');
                }

                const html = await response.text();
                if (currentRequest !== requestId) {
                    return;
                }

                results.innerHTML = html;
                history.replaceState({}, '', url);
                syncSelectableTable(results);
                syncClearButton();

                const reportAmount = results.querySelector('[data-report-amount]')?.textContent;
                const reportQty = results.querySelector('[data-report-qty]')?.textContent;
                if (reportAmount) {
                    document.querySelectorAll('[data-report-total-amount]').forEach((el) => {
                        el.textContent = reportAmount;
                    });
                }
                if (reportQty) {
                    document.querySelectorAll('[data-report-total-qty]').forEach((el) => {
                        el.textContent = el.classList.contains('pos-report-widget-amount')
                            ? reportQty
                            : `${reportQty} qty`;
                    });
                }

                const invoiceTotal = results.querySelector('[data-invoice-amount-total]')?.textContent;
                const invoiceReceived = results.querySelector('[data-invoice-amount-received]')?.textContent;
                const invoiceRemaining = results.querySelector('[data-invoice-amount-remaining]')?.textContent;
                if (invoiceTotal) {
                    document.querySelectorAll('[data-invoice-total-amount]').forEach((el) => {
                        el.textContent = invoiceTotal;
                    });
                }
                if (invoiceReceived) {
                    document.querySelectorAll('[data-invoice-received-amount]').forEach((el) => {
                        el.textContent = invoiceReceived;
                    });
                }
                if (invoiceRemaining) {
                    document.querySelectorAll('[data-invoice-remaining-amount]').forEach((el) => {
                        el.textContent = invoiceRemaining;
                    });
                }
            } catch (error) {
                if (currentRequest === requestId) {
                    console.error(error);
                }
            } finally {
                if (currentRequest === requestId) {
                    results.classList.remove('is-filtering');
                }
            }
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            clearTimeout(timer);
            runSearch({ resetPage: true });
        });

        form.querySelectorAll('[data-live-filter]').forEach((field) => {
            const trigger = () => {
                clearTimeout(timer);
                timer = setTimeout(() => runSearch({ resetPage: true }), 350);
            };
            field.addEventListener('input', trigger);
            if (field.tagName === 'SELECT' || field.type === 'date') {
                field.addEventListener('change', trigger);
            }
        });

        clearBtn?.addEventListener('click', () => {
            form.querySelectorAll('[data-live-filter]').forEach((field) => {
                field.value = '';
            });
            if (pageInput) {
                pageInput.value = '1';
            }
            clearTimeout(timer);
            runSearch({ resetPage: true });
        });

        results.addEventListener('click', (event) => {
            const pageLink = event.target.closest('[data-sales-page]');
            if (! pageLink) {
                return;
            }

            event.preventDefault();
            try {
                const url = new URL(pageLink.href, window.location.origin);
                if (pageInput) {
                    pageInput.value = url.searchParams.get('page') || '1';
                }
                if (perPageInput && url.searchParams.get('per_page')) {
                    perPageInput.value = url.searchParams.get('per_page');
                }
            } catch (error) {
                return;
            }

            clearTimeout(timer);
            runSearch({ resetPage: false });
        });

        results.addEventListener('change', (event) => {
            if (! event.target.matches('[data-sales-per-page]')) {
                return;
            }

            if (perPageInput) {
                perPageInput.value = event.target.value;
            }
            if (pageInput) {
                pageInput.value = '1';
            }

            clearTimeout(timer);
            runSearch({ resetPage: false });
        });

        syncClearButton();
    });

    document.querySelectorAll('[data-permission-form]').forEach((form) => {
        const syncRow = (row) => {
            const view = row.querySelector('[data-perm-view]');
            const actions = row.querySelectorAll('[data-perm-action]');
            const enabled = !! view?.checked;

            actions.forEach((action) => {
                action.disabled = ! enabled;
                if (! enabled) {
                    action.checked = false;
                }
            });
        };

        form.querySelectorAll('[data-permission-row]').forEach((row) => {
            const view = row.querySelector('[data-perm-view]');
            view?.addEventListener('change', () => syncRow(row));
            syncRow(row);
        });
    });

    const UNIT_COMPATIBLE = {
        KG: ['KG', 'G'],
        G: ['G', 'KG'],
        LTR: ['LTR', 'ML'],
        ML: ['ML', 'LTR'],
        PCS: ['PCS'],
        PKT: ['PKT'],
        BOX: ['BOX'],
        DOZ: ['DOZ'],
    };
    const DECIMAL_UNITS = ['KG', 'G', 'LTR', 'ML'];

    const normalizeUnit = (unit) => String(unit || '').trim().toUpperCase();

    const allowedSaleUnits = (baseUnit) => {
        const base = normalizeUnit(baseUnit);
        return UNIT_COMPATIBLE[base] ? [...UNIT_COMPATIBLE[base]] : (base ? [base] : ['PCS']);
    };

    const allowsDecimalUnit = (unit) => DECIMAL_UNITS.includes(normalizeUnit(unit));

    const toBaseQuantity = (quantity, saleUnit, baseUnit) => {
        const qty = Number(quantity);
        const sale = normalizeUnit(saleUnit);
        const base = normalizeUnit(baseUnit);

        if (! Number.isFinite(qty) || qty < 0) {
            throw new Error('Invalid quantity');
        }

        if (! allowedSaleUnits(base).includes(sale)) {
            throw new Error(`Unit ${sale} is not compatible with ${base}`);
        }

        if (sale === base) {
            return qty;
        }
        if (base === 'KG' && sale === 'G') {
            return qty / 1000;
        }
        if (base === 'G' && sale === 'KG') {
            return qty * 1000;
        }
        if (base === 'LTR' && sale === 'ML') {
            return qty / 1000;
        }
        if (base === 'ML' && sale === 'LTR') {
            return qty * 1000;
        }

        return qty;
    };

    const calculateSaleLineTotal = (quantity, saleUnit, baseUnit, pricePerBaseUnit) => {
        const qty = Number(quantity);
        const price = Number(pricePerBaseUnit);

        if (! Number.isFinite(qty) || qty <= 0) {
            throw new Error('Quantity must be greater than zero');
        }
        if (! Number.isFinite(price) || price < 0) {
            throw new Error('Price cannot be negative');
        }
        if (! allowsDecimalUnit(saleUnit) && Math.abs(qty - Math.round(qty)) > 0.0001) {
            throw new Error(`Quantity for ${normalizeUnit(saleUnit)} must be a whole number`);
        }

        const baseQty = toBaseQuantity(qty, saleUnit, baseUnit);
        return Math.round((baseQty * price) * 100) / 100;
    };

    document.querySelectorAll('[data-sale-items]').forEach((wrap) => {
        const body = wrap.querySelector('[data-sale-items-body]');
        const template = document.querySelector('[data-sale-item-template]');
        const addBtn = wrap.querySelector('[data-add-sale-item]');
        const composer = wrap.querySelector('[data-cart-composer]');
        const composerName = wrap.querySelector('[data-composer-name]');
        const composerQty = wrap.querySelector('[data-composer-qty]');
        const composerAmount = wrap.querySelector('[data-composer-amount]');
        const composerUnit = wrap.querySelector('[data-composer-unit]');
        const composerProductId = wrap.querySelector('[data-composer-product-id]');
        const composerBaseUnit = wrap.querySelector('[data-composer-base-unit]');
        const composerPriceHint = wrap.querySelector('[data-composer-price-hint]');
        const composerError = wrap.querySelector('[data-composer-error]');
        const form = wrap.closest('form');
        const totalInput = form?.querySelector('[data-sale-total]');
        const totalDisplay = form?.querySelector('[data-sale-total-display]');
        const receivedInput = form?.querySelector('[data-sale-received]');
        const remainingInput = form?.querySelector('[data-sale-remaining]');
        const remainingDisplay = form?.querySelector('[data-sale-remaining-display]');
        const paidInput = form?.querySelector('[data-sale-paid]');
        const paidLabel = form?.querySelector('[data-sale-paid-label]');
        const typeInput = form?.querySelector('[data-sale-type-input]');
        const typeButtons = form?.querySelectorAll('[data-sale-type]');

        const money = (value) => Number(value || 0).toFixed(2);

        const setTextOrValue = (el, value) => {
            if (! el) {
                return;
            }
            if ('value' in el && el.tagName !== 'STRONG' && el.tagName !== 'SPAN') {
                el.value = value;
            } else {
                el.textContent = value;
            }
        };

        const syncEmptyState = () => {
            const hasRows = body.querySelectorAll('[data-sale-item-row]').length > 0;
            let empty = body.querySelector('[data-cart-empty]');

            if (! hasRows && ! empty) {
                body.insertAdjacentHTML('beforeend', '<div class="pos-cart-empty" data-cart-empty>No items yet. Add an item above.</div>');
            }

            if (hasRows && empty) {
                empty.remove();
            }
        };

        const reindexRows = () => {
            body.querySelectorAll('[data-sale-item-row]').forEach((row, index) => {
                row.querySelectorAll('input, select, textarea, [data-error-for]').forEach((el) => {
                    if (el.name) {
                        el.name = el.name.replace(/items\[\d+\]/, `items[${index}]`);
                    }
                    if (el.dataset.errorFor) {
                        el.dataset.errorFor = el.dataset.errorFor.replace(/items\.\d+\./, `items.${index}.`);
                    }
                });
            });
        };

        const fillUnitSelect = (selectEl, units, selected) => {
            if (! selectEl) {
                return;
            }
            const list = Array.isArray(units) && units.length ? units : ['PCS'];
            const current = normalizeUnit(selected || list[0]);
            selectEl.innerHTML = list.map((unit) => {
                const value = normalizeUnit(unit);
                return `<option value="${value}" ${value === current ? 'selected' : ''}>${value}</option>`;
            }).join('');
        };

        const syncComposerUnitHint = () => {
            const base = normalizeUnit(composerBaseUnit?.value || composerUnit?.value || 'PCS');
            if (composerPriceHint) {
                composerPriceHint.textContent = base ? `/${base}` : '';
            }
        };

        const recalc = () => {
            let total = 0;

            body.querySelectorAll('[data-sale-item-row]').forEach((row) => {
                const qty = parseFloat(row.querySelector('[data-item-qty]')?.value || 0);
                const amount = parseFloat(row.querySelector('[data-item-amount]')?.value || 0);
                const soldUnit = normalizeUnit(row.querySelector('[data-item-unit]')?.value || 'PCS');
                const baseUnit = normalizeUnit(row.querySelector('[data-item-base-unit]')?.value || soldUnit);
                const hint = row.querySelector('[data-item-price-hint]');
                if (hint) {
                    hint.textContent = `/${baseUnit}`;
                }

                let line = 0;
                try {
                    if (qty > 0 && amount >= 0) {
                        line = calculateSaleLineTotal(qty, soldUnit, baseUnit, amount);
                    }
                } catch (error) {
                    line = 0;
                }

                total += line;
                const lineEl = row.querySelector('[data-item-line-total]');
                if (lineEl) {
                    lineEl.textContent = money(line);
                }
                const lineInput = row.querySelector('[data-item-line-total-input]');
                if (lineInput) {
                    lineInput.value = money(line);
                }
            });

            if (totalInput) {
                totalInput.value = money(total);
            }
            if (totalDisplay) {
                totalDisplay.textContent = money(total);
            }

            const received = parseFloat(receivedInput?.value || 0);
            const remaining = Math.max(total - received, 0);

            if (remainingInput) {
                remainingInput.value = money(remaining);
            }
            if (remainingDisplay) {
                remainingDisplay.textContent = money(remaining);
            }

            const paid = remaining <= 0;
            if (paidInput) {
                paidInput.value = paid ? '1' : '0';
            }
            if (paidLabel) {
                setTextOrValue(paidLabel, paid ? 'Paid' : 'Due');
                paidLabel.classList.toggle('is-paid', paid);
            }

            syncEmptyState();
        };

        const creditCustomer = form?.querySelector('[data-credit-customer]');
        const accountSelect = form?.querySelector('[data-account-select]');
        const newAccountFields = form?.querySelector('[data-new-account-fields]');
        const customerName = form?.querySelector('[data-customer-name]');
        const customerPhone = form?.querySelector('[data-customer-phone]');
        const customerSector = form?.querySelector('[data-customer-sector]');
        const customerHouse = form?.querySelector('[data-customer-house]');

        const setCustomerReadonly = (readonly) => {
            [customerName, customerPhone, customerSector, customerHouse].forEach((input) => {
                if (! input) {
                    return;
                }
                input.readOnly = readonly;
                input.classList.toggle('is-readonly', readonly);
            });
        };

        const syncAccountFields = () => {
            const value = accountSelect?.value || '';
            const isExisting = value !== '' && value !== 'new';

            if (newAccountFields) {
                newAccountFields.hidden = false;
            }

            if (isExisting) {
                const option = accountSelect.options[accountSelect.selectedIndex];
                if (customerName) {
                    customerName.value = option.dataset.name || '';
                }
                if (customerPhone) {
                    customerPhone.value = option.dataset.phone || '92';
                }
                if (customerSector) {
                    customerSector.value = option.dataset.sector || '';
                }
                if (customerHouse) {
                    customerHouse.value = option.dataset.house || '';
                }
                setCustomerReadonly(true);
                return;
            }

            setCustomerReadonly(false);

            if (customerName) {
                customerName.value = '';
            }
            if (customerPhone) {
                customerPhone.value = '92';
                if ($ && $(customerPhone).data('mask')) {
                    $(customerPhone).val('92').trigger('input');
                }
            }
            if (customerSector) {
                customerSector.value = '';
            }
            if (customerHouse) {
                customerHouse.value = '';
            }
        };

        const syncCreditCustomer = () => {
            const isCredit = (typeInput?.value || 'cash') === 'credit';
            if (creditCustomer) {
                creditCustomer.hidden = ! isCredit;
            }
            if (isCredit) {
                syncAccountFields();
            }
        };

        const initAccountSelect2 = () => {
            if (! $ || ! accountSelect || ! $.fn.select2) {
                return;
            }

            const $select = $(accountSelect);

            if ($select.hasClass('select2-hidden-accessible')) {
                $select.select2('destroy');
            }

            $select.select2({
                width: '100%',
                placeholder: 'Search by house no, name, sector...',
                allowClear: true,
                dropdownParent: $(document.body),
                matcher(params, data) {
                    if ($.trim(params.term || '') === '') {
                        return data;
                    }

                    if (typeof data.text === 'undefined') {
                        return null;
                    }

                    const term = params.term.toLowerCase();
                    const text = String(data.text || '').toLowerCase();
                    const element = data.element;
                    const house = String(element?.getAttribute('data-house') || '').toLowerCase();
                    const name = String(element?.getAttribute('data-name') || '').toLowerCase();
                    const sector = String(element?.getAttribute('data-sector') || '').toLowerCase();
                    const phone = String(element?.getAttribute('data-phone') || '').toLowerCase();

                    if (
                        text.indexOf(term) > -1
                        || house.indexOf(term) > -1
                        || name.indexOf(term) > -1
                        || sector.indexOf(term) > -1
                        || phone.indexOf(term) > -1
                    ) {
                        return data;
                    }

                    return null;
                },
            });

            $select.off('change.posAccount').on('change.posAccount', syncAccountFields);
        };

        typeButtons?.forEach((btn) => {
            btn.addEventListener('click', () => {
                typeButtons.forEach((item) => item.classList.remove('is-active'));
                btn.classList.add('is-active');
                if (typeInput) {
                    typeInput.value = btn.dataset.saleType || 'cash';
                }
                syncCreditCustomer();
                if ((typeInput?.value || 'cash') === 'credit') {
                    initAccountSelect2();
                }
            });
        });

        accountSelect?.addEventListener('change', syncAccountFields);
        syncCreditCustomer();
        if ((typeInput?.value || 'cash') === 'credit') {
            initAccountSelect2();
        }

        const suggestWrap = wrap.querySelector('[data-product-suggest]');
        const suggestMenu = wrap.querySelector('[data-product-suggest-menu]');
        const productSearchUrl = composerName?.getAttribute('data-product-search-url') || '';
        let suggestItems = [];
        let suggestIndex = -1;
        let suggestTimer = null;
        let suggestRequestId = 0;

        const hideProductSuggest = () => {
            if (suggestMenu) {
                suggestMenu.hidden = true;
                suggestMenu.innerHTML = '';
            }
            suggestItems = [];
            suggestIndex = -1;
        };

        const escapeHtml = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const applyProductSuggestion = (product) => {
            if (! product) {
                return;
            }

            const baseUnit = normalizeUnit(product.unit || 'PCS');
            const units = Array.isArray(product.allowed_units) && product.allowed_units.length
                ? product.allowed_units.map(normalizeUnit)
                : allowedSaleUnits(baseUnit);

            if (composerName) {
                composerName.value = product.name || '';
            }
            if (composerAmount) {
                composerAmount.value = money(product.sale_price || 0);
            }
            if (composerProductId) {
                composerProductId.value = product.id || '';
            }
            if (composerBaseUnit) {
                composerBaseUnit.value = baseUnit;
            }
            if (composerQty) {
                composerQty.value = '1';
            }
            fillUnitSelect(composerUnit, units, baseUnit);
            syncComposerUnitHint();
            hideProductSuggest();
            composerQty?.focus();
            composerQty?.select();
        };

        const renderProductSuggest = (items) => {
            if (! suggestMenu) {
                return;
            }

            suggestItems = Array.isArray(items) ? items : [];
            suggestIndex = suggestItems.length ? 0 : -1;

            if (! suggestItems.length) {
                suggestMenu.innerHTML = '<div class="pos-product-suggest-empty">No products found</div>';
                suggestMenu.hidden = false;
                return;
            }

            suggestMenu.innerHTML = suggestItems.map((item, index) => {
                const meta = [item.brand, item.unit].filter(Boolean).join(' · ');
                return `
                    <button type="button" class="pos-product-suggest-item ${index === 0 ? 'is-active' : ''}" data-product-suggest-index="${index}">
                        <span>
                            <strong>${escapeHtml(item.name || '')}</strong>
                            ${meta ? `<span>${escapeHtml(meta)}</span>` : ''}
                        </span>
                        <em>${money(item.sale_price || 0)}${item.unit ? `/${escapeHtml(item.unit)}` : ''}</em>
                    </button>
                `;
            }).join('');
            suggestMenu.hidden = false;
        };

        const highlightSuggest = (index) => {
            if (! suggestMenu || ! suggestItems.length) {
                return;
            }

            suggestIndex = Math.max(0, Math.min(index, suggestItems.length - 1));
            suggestMenu.querySelectorAll('[data-product-suggest-index]').forEach((el) => {
                el.classList.toggle('is-active', Number(el.dataset.productSuggestIndex) === suggestIndex);
            });
        };

        const searchProducts = async (term) => {
            if (! productSearchUrl || ! suggestMenu) {
                return;
            }

            const query = term.trim();
            if (query.length < 1) {
                hideProductSuggest();
                return;
            }

            const requestId = ++suggestRequestId;

            try {
                const response = await fetch(`${productSearchUrl}?q=${encodeURIComponent(query)}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                });

                if (! response.ok) {
                    throw new Error('Product search failed');
                }

                const payload = await response.json();
                if (requestId !== suggestRequestId) {
                    return;
                }

                renderProductSuggest(payload.data || []);
            } catch (error) {
                if (requestId === suggestRequestId) {
                    hideProductSuggest();
                }
            }
        };

        const clearComposer = () => {
            if (composerName) {
                composerName.value = '';
            }
            if (composerQty) {
                composerQty.value = '1';
            }
            if (composerAmount) {
                composerAmount.value = '';
            }
            if (composerProductId) {
                composerProductId.value = '';
            }
            if (composerBaseUnit) {
                composerBaseUnit.value = 'PCS';
            }
            fillUnitSelect(composerUnit, ['PCS'], 'PCS');
            syncComposerUnitHint();
            if (composerError) {
                composerError.hidden = true;
                composerError.textContent = '';
            }
            hideProductSuggest();
            composerName?.focus();
        };

        const addComposerItem = () => {
            if (! template || ! body) {
                return;
            }

            const name = (composerName?.value || '').trim();
            const qty = parseFloat(composerQty?.value || 0);
            const amountRaw = (composerAmount?.value || '').trim();
            const amount = parseFloat(amountRaw);
            const soldUnit = normalizeUnit(composerUnit?.value || 'PCS');
            const baseUnit = normalizeUnit(composerBaseUnit?.value || soldUnit);
            const productId = (composerProductId?.value || '').trim();

            if (! name) {
                if (composerError) {
                    composerError.textContent = 'Please enter item name.';
                    composerError.hidden = false;
                }
                composerName?.focus();
                return;
            }

            if (! qty || qty <= 0) {
                if (composerError) {
                    composerError.textContent = 'Please enter a valid quantity.';
                    composerError.hidden = false;
                }
                composerQty?.focus();
                return;
            }

            if (amountRaw === '' || Number.isNaN(amount) || amount <= 0) {
                if (composerError) {
                    composerError.textContent = 'Please enter the price.';
                    composerError.hidden = false;
                }
                composerAmount?.focus();
                return;
            }

            let lineTotal = 0;
            try {
                lineTotal = calculateSaleLineTotal(qty, soldUnit, baseUnit, amount);
            } catch (error) {
                if (composerError) {
                    composerError.textContent = error.message || 'Invalid quantity or unit.';
                    composerError.hidden = false;
                }
                return;
            }

            const units = allowedSaleUnits(baseUnit);
            const unitOptions = units.map((unit) => (
                `<option value="${unit}" ${unit === soldUnit ? 'selected' : ''}>${unit}</option>`
            )).join('');

            const index = body.querySelectorAll('[data-sale-item-row]').length;
            const html = template.innerHTML
                .replaceAll('__INDEX__', String(index))
                .replaceAll('__NAME__', '')
                .replaceAll('__QTY__', String(qty))
                .replaceAll('__AMOUNT__', money(amount))
                .replaceAll('__PRODUCT_ID__', productId)
                .replaceAll('__BASE_UNIT__', baseUnit)
                .replaceAll('__UNIT_OPTIONS__', unitOptions);

            body.querySelector('[data-cart-empty]')?.remove();
            body.insertAdjacentHTML('beforeend', html);

            const row = body.querySelector('[data-sale-item-row]:last-child');
            const nameInput = row?.querySelector('input[name*="[item_name]"]');
            if (nameInput) {
                nameInput.value = name;
            }
            const lineInput = row?.querySelector('[data-item-line-total-input]');
            if (lineInput) {
                lineInput.value = money(lineTotal);
            }

            clearComposer();
            recalc();
        };

        fillUnitSelect(composerUnit, ['PCS'], 'PCS');
        syncComposerUnitHint();
        composerUnit?.addEventListener('change', syncComposerUnitHint);

        addBtn?.addEventListener('click', addComposerItem);

        composerName?.addEventListener('input', () => {
            clearTimeout(suggestTimer);
            suggestTimer = setTimeout(() => {
                searchProducts(composerName.value || '');
            }, 220);
        });

        composerName?.addEventListener('focus', () => {
            if ((composerName.value || '').trim().length >= 1) {
                searchProducts(composerName.value || '');
            }
        });

        suggestMenu?.addEventListener('mousedown', (event) => {
            const item = event.target.closest('[data-product-suggest-index]');
            if (! item) {
                return;
            }
            event.preventDefault();
            applyProductSuggestion(suggestItems[Number(item.dataset.productSuggestIndex)]);
        });

        document.addEventListener('click', (event) => {
            if (suggestWrap && ! suggestWrap.contains(event.target)) {
                hideProductSuggest();
            }
        });

        composer?.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown' && suggestItems.length && ! suggestMenu?.hidden) {
                event.preventDefault();
                highlightSuggest(suggestIndex + 1);
                return;
            }

            if (event.key === 'ArrowUp' && suggestItems.length && ! suggestMenu?.hidden) {
                event.preventDefault();
                highlightSuggest(suggestIndex - 1);
                return;
            }

            if (event.key === 'Escape') {
                hideProductSuggest();
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                if (! suggestMenu?.hidden && suggestIndex >= 0 && suggestItems[suggestIndex]) {
                    applyProductSuggestion(suggestItems[suggestIndex]);
                    return;
                }
                addComposerItem();
            }
        });

        body?.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-remove-sale-item]');
            if (! removeBtn) {
                return;
            }

            removeBtn.closest('[data-sale-item-row]')?.remove();
            reindexRows();
            recalc();
        });

        body?.addEventListener('input', (event) => {
            if (event.target.matches('[data-item-qty], [data-item-amount]')) {
                recalc();
            }
        });

        body?.addEventListener('change', (event) => {
            if (event.target.matches('[data-item-unit]')) {
                recalc();
            }
        });

        receivedInput?.addEventListener('input', recalc);
        recalc();
    });

    const saleItemsModal = document.querySelector('[data-sale-items-modal]');
    if (saleItemsModal) {
        const modalTitle = saleItemsModal.querySelector('[data-modal-title]');
        const modalSubtitle = saleItemsModal.querySelector('[data-modal-subtitle]');
        const modalBody = saleItemsModal.querySelector('[data-modal-items-body]');
        const modalTotal = saleItemsModal.querySelector('[data-modal-total]');
        const modalReceived = saleItemsModal.querySelector('[data-modal-received]');
        const modalRemaining = saleItemsModal.querySelector('[data-modal-remaining]');
        const modalTotalLabel = saleItemsModal.querySelector('[data-modal-total-label]');
        const modalReceivedLabel = saleItemsModal.querySelector('[data-modal-received-label]');
        const modalRemainingLabel = saleItemsModal.querySelector('[data-modal-remaining-label]');
        const paymentsWrap = saleItemsModal.querySelector('[data-modal-payments-wrap]');
        const paymentsBody = saleItemsModal.querySelector('[data-modal-payments-body]');
        const paymentsCount = saleItemsModal.querySelector('[data-modal-payments-count]');
        const modalFootTotal = saleItemsModal.querySelector('[data-modal-foot-total]');
        const receiptEl = document.querySelector('[data-modal-receipt]');
        const storeName = saleItemsModal.getAttribute('data-store-name') || 'POS';
        let currentReceipt = null;
        const money = (value) => Number(value || 0).toFixed(2);
        const escapeHtml = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const closeSaleItemsModal = () => {
            saleItemsModal.hidden = true;
            document.body.classList.remove('pos-modal-open');
        };

        const buildReceiptHtml = (receipt) => {
            const items = Array.isArray(receipt.items) ? receipt.items : [];
            const payments = Array.isArray(receipt.payments) ? receipt.payments : [];
            const isReturn = receipt.kind === 'return';
            const addressParts = [];
            if (receipt.sector) {
                addressParts.push(`Sector ${escapeHtml(receipt.sector)}`);
            }
            if (receipt.house) {
                addressParts.push(`House ${escapeHtml(receipt.house)}`);
            }

            const itemLines = items.length
                ? items.map((item) => {
                    const qtyLabel = item.qty_label || `${money(item.qty)}${item.unit ? ` ${item.unit}` : ''}`;
                    const priceLabel = item.price_label || money(item.price);
                    return `
                    <div class="pos-receipt-line">
                        <div class="pos-receipt-item-name">${escapeHtml(item.name || '—')}</div>
                        <div class="pos-receipt-item-row">
                            <span>${escapeHtml(qtyLabel)} @ ${escapeHtml(priceLabel)}</span>
                            <strong>${money(item.total)}</strong>
                        </div>
                    </div>
                `;
                }).join('')
                : `<p class="pos-receipt-empty">${isReturn ? 'No returned items' : 'No items'}</p>`;

            const paymentLines = payments.length
                ? `
                    <div class="pos-receipt-dash"></div>
                    <section class="pos-receipt-payments">
                        <p class="pos-receipt-section-title">Payments</p>
                        ${payments.map((payment) => `
                            <div class="pos-receipt-item-row">
                                <span>${escapeHtml(payment.date || '—')} · ${escapeHtml(payment.type || 'Cash')}</span>
                                <strong>${money(payment.amount)}</strong>
                            </div>
                        `).join('')}
                    </section>
                `
                : '';

            const totalsHtml = isReturn
                ? `
                    <div><span>Return total</span><strong>${money(receipt.total)}</strong></div>
                    <div><span>Refund</span><strong>${money(receipt.received)}</strong></div>
                `
                : `
                    <div><span>Total</span><strong>${money(receipt.total)}</strong></div>
                    <div><span>Received</span><strong>${money(receipt.received)}</strong></div>
                    <div class="is-balance"><span>Balance</span><strong>${money(receipt.remaining)}</strong></div>
                `;

            return `
                <header class="pos-receipt-head">
                    <strong>${escapeHtml(storeName)}</strong>
                    <span>${isReturn ? 'SALE RETURN' : 'SALE RECEIPT'}</span>
                    <p>${escapeHtml(receipt.receipt || receipt.invoice || '')}</p>
                </header>
                <div class="pos-receipt-dash"></div>
                <section class="pos-receipt-meta">
                    <div><span>Date</span><strong>${escapeHtml(receipt.date || '—')}</strong></div>
                    <div><span>Time</span><strong>${escapeHtml(receipt.time || '—')}</strong></div>
                    <div><span>Type</span><strong>${escapeHtml(receipt.type || '—')}</strong></div>
                    <div><span>Status</span><strong class="${receipt.status === 'PAID' || receipt.status === 'RETURNED' ? 'is-paid' : 'is-due'}">${escapeHtml(receipt.status || 'DUE')}</strong></div>
                    ${isReturn && receipt.sale_ref ? `<div><span>Sale</span><strong>${escapeHtml(receipt.sale_ref)}</strong></div>` : ''}
                    ${isReturn && receipt.reason ? `<div><span>Reason</span><strong>${escapeHtml(receipt.reason)}</strong></div>` : ''}
                </section>
                <div class="pos-receipt-dash"></div>
                <section class="pos-receipt-customer">
                    <div><span>Customer</span><strong>${escapeHtml(receipt.customer || 'Walk-in')}</strong></div>
                    ${receipt.phone ? `<div><span>Phone</span><strong>${escapeHtml(receipt.phone)}</strong></div>` : ''}
                    ${addressParts.length ? `<div><span>Address</span><strong>${addressParts.join(' · ')}</strong></div>` : ''}
                </section>
                <div class="pos-receipt-dash"></div>
                <section class="pos-receipt-items">${itemLines}</section>
                <div class="pos-receipt-dash"></div>
                <section class="pos-receipt-totals">${totalsHtml}</section>
                ${paymentLines}
                <div class="pos-receipt-dash"></div>
                <footer class="pos-receipt-foot">
                    <p>Thank you</p>
                </footer>
            `;
        };

        const renderPaymentsBreakup = (receipt) => {
            const payments = Array.isArray(receipt?.payments) ? receipt.payments : [];

            if (modalReceived) {
                modalReceived.textContent = money(receipt?.received || 0);
            }
            if (modalRemaining) {
                modalRemaining.textContent = money(receipt?.remaining || 0);
            }

            if (! paymentsWrap || ! paymentsBody) {
                return;
            }

            if (! payments.length) {
                paymentsWrap.hidden = true;
                paymentsBody.innerHTML = '';
                if (paymentsCount) {
                    paymentsCount.textContent = '';
                }
                return;
            }

            paymentsWrap.hidden = false;
            if (paymentsCount) {
                paymentsCount.textContent = `${payments.length}`;
            }
            paymentsBody.innerHTML = payments.map((payment) => `
                <div class="pos-payment-breakup-line">
                    <span>${escapeHtml(payment.date || '—')} · ${escapeHtml(payment.type || 'Cash')}</span>
                    <strong>${money(payment.amount)}</strong>
                </div>
            `).join('');
        };

        const openSaleItemsModal = (trigger) => {
            let receipt = null;
            try {
                receipt = JSON.parse(trigger.getAttribute('data-receipt') || 'null');
            } catch (error) {
                receipt = null;
            }

            currentReceipt = receipt;
            const items = Array.isArray(receipt?.items) ? receipt.items : [];
            const isReturn = receipt?.kind === 'return';
            const invoice = receipt?.invoice || (isReturn ? 'Return' : 'Invoice');
            const date = receipt?.date || '—';
            const total = receipt?.total || 0;

            if (modalTitle) {
                modalTitle.textContent = invoice;
            }
            if (modalSubtitle) {
                modalSubtitle.textContent = isReturn
                    ? `Return date ${date}${receipt?.sale_ref ? ` · ${receipt.sale_ref}` : ''}`
                    : `Sale date ${date}`;
            }
            if (modalTotalLabel) {
                modalTotalLabel.textContent = isReturn ? 'Return total' : 'Total';
            }
            if (modalReceivedLabel) {
                modalReceivedLabel.textContent = isReturn ? 'Refund' : 'Received';
            }
            if (modalRemainingLabel) {
                modalRemainingLabel.textContent = isReturn ? 'Balance' : 'Remaining';
            }
            if (modalTotal) {
                modalTotal.textContent = money(total);
            }
            if (modalFootTotal) {
                modalFootTotal.textContent = money(total);
            }
            if (modalBody) {
                if (! items.length) {
                    modalBody.innerHTML = `<p class="pos-invoice-sheet-empty">${isReturn ? 'No returned items.' : 'No items on this invoice.'}</p>`;
                } else {
                    modalBody.innerHTML = items.map((item) => `
                        <div class="pos-invoice-sheet-line">
                            <div class="pos-invoice-sheet-name">${escapeHtml(item.name || '—')}</div>
                            <div>${escapeHtml(item.qty_label || money(item.qty))}</div>
                            <div>${escapeHtml(item.price_label || money(item.price))}</div>
                            <div class="text-end">${money(item.total)}</div>
                        </div>
                    `).join('');
                }
            }

            renderPaymentsBreakup(receipt);

            if (receiptEl && receipt) {
                receiptEl.innerHTML = buildReceiptHtml(receipt);
            }

            saleItemsModal.hidden = false;
            document.body.classList.add('pos-modal-open');

            if (trigger.hasAttribute('data-open-payments') && paymentsWrap && ! paymentsWrap.hidden) {
                paymentsWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };

        const printSaleReceipt = () => {
            if (! currentReceipt || ! receiptEl) {
                return;
            }

            receiptEl.innerHTML = buildReceiptHtml(currentReceipt);
            document.body.classList.add('pos-printing-receipt');
            window.print();
            window.setTimeout(() => {
                document.body.classList.remove('pos-printing-receipt');
            }, 300);
        };

        document.addEventListener('click', (event) => {
            const openBtn = event.target.closest('[data-sale-items-open]');
            if (openBtn) {
                event.preventDefault();
                openSaleItemsModal(openBtn);
                return;
            }

            if (event.target.closest('[data-sale-items-print]')) {
                event.preventDefault();
                printSaleReceipt();
                return;
            }

            if (event.target.closest('[data-sale-items-close]')) {
                closeSaleItemsModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && ! saleItemsModal.hidden) {
                closeSaleItemsModal();
            }
        });
    }

    const customerDetailsModal = document.querySelector('[data-customer-details-modal]');
    if (customerDetailsModal) {
        const customerSubtitle = customerDetailsModal.querySelector('[data-customer-details-subtitle]');
        const customerAvatar = customerDetailsModal.querySelector('[data-customer-details-avatar]');
        const customerName = customerDetailsModal.querySelector('[data-customer-details-name]');
        const customerStatus = customerDetailsModal.querySelector('[data-customer-details-status]');
        const customerPhone = customerDetailsModal.querySelector('[data-customer-details-phone]');
        const customerSector = customerDetailsModal.querySelector('[data-customer-details-sector]');
        const customerHouse = customerDetailsModal.querySelector('[data-customer-details-house]');
        const customerType = customerDetailsModal.querySelector('[data-customer-details-type]');
        const customerAddress = customerDetailsModal.querySelector('[data-customer-details-address]');

        const closeCustomerDetailsModal = () => {
            customerDetailsModal.hidden = true;
            document.body.classList.remove('pos-modal-open');
        };

        const openCustomerDetailsModal = (trigger) => {
            let customer = null;
            try {
                customer = JSON.parse(trigger.getAttribute('data-customer') || 'null');
            } catch (error) {
                customer = null;
            }

            const name = customer?.name || 'Walk-in';
            const initial = String(name).trim().charAt(0).toUpperCase() || 'C';

            if (customerSubtitle) {
                customerSubtitle.textContent = customer?.invoice
                    ? `Invoice ${customer.invoice}`
                    : 'Customer profile';
            }
            if (customerAvatar) {
                customerAvatar.textContent = initial;
            }
            if (customerName) {
                customerName.textContent = name;
            }
            if (customerStatus) {
                customerStatus.textContent = customer?.status || '—';
                customerStatus.className = `pos-badge ${customer?.status_tone || 'paid'}`;
            }
            if (customerPhone) {
                customerPhone.textContent = customer?.phone || '—';
            }
            if (customerSector) {
                customerSector.textContent = customer?.sector || '—';
            }
            if (customerHouse) {
                customerHouse.textContent = customer?.house || '—';
            }
            if (customerType) {
                customerType.textContent = customer?.type || '—';
            }
            if (customerAddress) {
                customerAddress.textContent = customer?.address || '—';
            }

            customerDetailsModal.hidden = false;
            document.body.classList.add('pos-modal-open');
        };

        document.addEventListener('click', (event) => {
            const openBtn = event.target.closest('[data-customer-details-open]');
            if (openBtn) {
                event.preventDefault();
                openCustomerDetailsModal(openBtn);
                return;
            }

            if (event.target.closest('[data-customer-details-close]')) {
                closeCustomerDetailsModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && ! customerDetailsModal.hidden) {
                closeCustomerDetailsModal();
            }
        });
    }

    const receivePaymentModal = document.querySelector('[data-receive-payment-modal]');
    if (receivePaymentModal) {
        const receiveForm = receivePaymentModal.querySelector('[data-receive-payment-form]');
        const receiveSubtitle = receivePaymentModal.querySelector('[data-receive-subtitle]');
        const receiveTotal = receivePaymentModal.querySelector('[data-receive-total]');
        const receiveReceived = receivePaymentModal.querySelector('[data-receive-received]');
        const receiveDue = receivePaymentModal.querySelector('[data-receive-due]');
        const receiveAmount = receivePaymentModal.querySelector('[data-receive-amount]');
        const receiveDate = receivePaymentModal.querySelector('[data-receive-date]');
        const receiveSubmit = receivePaymentModal.querySelector('[data-receive-submit]');
        const money = (value) => Number(value || 0).toFixed(2);

        const closeReceivePaymentModal = () => {
            receivePaymentModal.hidden = true;
            document.body.classList.remove('pos-modal-open');
            clearFormErrors(receiveForm);
        };

        const openReceivePaymentModal = (trigger) => {
            const invoice = trigger.getAttribute('data-invoice') || 'Invoice';
            const total = trigger.getAttribute('data-total') || '0';
            const received = trigger.getAttribute('data-received') || '0';
            const remaining = trigger.getAttribute('data-remaining') || '0';
            const action = trigger.getAttribute('data-action') || '#';

            if (receiveForm) {
                receiveForm.action = action;
            }
            if (receiveSubtitle) {
                receiveSubtitle.textContent = `Against ${invoice}`;
            }
            if (receiveTotal) {
                receiveTotal.textContent = money(total);
            }
            if (receiveReceived) {
                receiveReceived.textContent = money(received);
            }
            if (receiveDue) {
                receiveDue.textContent = money(remaining);
            }
            if (receiveAmount) {
                receiveAmount.value = money(remaining);
            }
            if (receiveDate && ! receiveDate.value) {
                const now = new Date();
                const offset = now.getTimezoneOffset() * 60000;
                receiveDate.value = new Date(now.getTime() - offset).toISOString().slice(0, 10);
            }

            clearFormErrors(receiveForm);
            receivePaymentModal.hidden = false;
            document.body.classList.add('pos-modal-open');
            receiveAmount?.focus();
            receiveAmount?.select();
        };

        document.addEventListener('click', (event) => {
            const openBtn = event.target.closest('[data-receive-payment-open]');
            if (openBtn) {
                event.preventDefault();
                openReceivePaymentModal(openBtn);
                return;
            }

            if (event.target.closest('[data-receive-payment-close]')) {
                closeReceivePaymentModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && ! receivePaymentModal.hidden) {
                closeReceivePaymentModal();
            }
        });

        receiveForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearFormErrors(receiveForm);

            const amount = parseFloat(receiveAmount?.value || 0);
            const due = parseFloat(receiveDue?.textContent || 0);

            if (! amount || amount <= 0) {
                showFormErrors(receiveForm, { amount: ['Please enter a valid amount.'] });
                receiveAmount?.focus();
                return;
            }

            if (amount > due + 0.001) {
                showFormErrors(receiveForm, {
                    amount: [`Amount cannot exceed remaining balance of ${due.toFixed(2)}.`],
                });
                receiveAmount?.focus();
                return;
            }

            showLoading();
            receiveSubmit?.setAttribute('disabled', 'disabled');

            try {
                const response = await fetch(receiveForm.action, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    body: new FormData(receiveForm),
                });

                const data = await response.json().catch(() => ({}));

                if (response.status === 422) {
                    showFormErrors(receiveForm, data.errors || {});
                    if (typeof Swal !== 'undefined' && data.message) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Payment failed',
                            text: data.message,
                            confirmButtonColor: '#3d8fd4',
                        });
                    }
                    return;
                }

                if (! response.ok) {
                    if (typeof Swal !== 'undefined') {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Payment failed',
                            text: data.message || 'Something went wrong. Please try again.',
                            confirmButtonColor: '#3d8fd4',
                        });
                    }
                    return;
                }

                closeReceivePaymentModal();

                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Payment received',
                        text: data.message || 'Payment received successfully.',
                        confirmButtonColor: '#3d8fd4',
                        timer: 1600,
                        showConfirmButton: false,
                    });
                }

                window.location.reload();
            } catch (error) {
                if (typeof Swal !== 'undefined') {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Payment failed',
                        text: 'Something went wrong. Please try again.',
                        confirmButtonColor: '#3d8fd4',
                    });
                }
            } finally {
                hideLoading();
                receiveSubmit?.removeAttribute('disabled');
            }
        });
    }

    // Soft delete confirm
    document.querySelectorAll('form[data-confirm-delete]').forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const title = form.getAttribute('data-confirm-title') || 'Are you sure?';
            const text = form.getAttribute('data-confirm-text') || 'This action cannot be undone.';

            if (typeof Swal === 'undefined') {
                if (window.confirm(text)) {
                    form.submit();
                }
                return;
            }

            const result = await Swal.fire({
                icon: 'warning',
                title,
                text,
                showCancelButton: true,
                confirmButtonColor: '#d64545',
                cancelButtonColor: '#6e849c',
                confirmButtonText: 'Yes, delete',
            });

            if (result.isConfirmed) {
                showLoading('Deleting...');
                form.submit();
            }
        });
    });
});
