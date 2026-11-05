import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const base = {
    buttonsStyling: false,
    reverseButtons: true,
    customClass: {
        popup: 'sms-swal-popup',
        title: 'sms-swal-title',
        htmlContainer: 'sms-swal-text',
        actions: 'sms-swal-actions',
        confirmButton: 'sms-swal-confirm',
        cancelButton: 'sms-swal-cancel',
        denyButton: 'sms-swal-deny',
    },
};

/**
 * Confirm dialog (SweetAlert2). Returns true when the user confirms.
 */
export async function confirmAction({
    title = 'Are you sure?',
    text = 'This action cannot be undone.',
    confirmText = 'Yes, delete',
    cancelText = 'Cancel',
    icon = 'warning',
} = {}) {
    const result = await Swal.fire({
        ...base,
        icon,
        title,
        text,
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
    });

    return Boolean(result.isConfirmed);
}

/** Shortcut for delete confirmations. */
export async function confirmDelete(itemLabel = 'this record') {
    return confirmAction({
        title: 'Delete?',
        text: `Are you sure you want to delete ${itemLabel}? This cannot be undone.`,
        confirmText: 'Yes, delete',
        cancelText: 'Cancel',
        icon: 'warning',
    });
}

export async function showSuccess(title, text = '') {
    return Swal.fire({
        ...base,
        icon: 'success',
        title,
        text,
        timer: 1800,
        showConfirmButton: false,
    });
}

export async function showError(title, text = '') {
    return Swal.fire({
        ...base,
        icon: 'error',
        title,
        text,
        confirmButtonText: 'OK',
    });
}

export { Swal };
