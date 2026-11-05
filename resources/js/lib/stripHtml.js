/** Strip HTML tags for compact table / list display. */
export function stripHtml(html) {
    if (!html) {
        return '';
    }

    if (typeof document === 'undefined') {
        return String(html)
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
}
