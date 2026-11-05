import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import AppProviders from '@/Components/AppProviders';

const appName = import.meta.env.VITE_APP_NAME || 'SMS';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <AppProviders>
                <App {...props} />
            </AppProviders>,
        );
    },
    progress: {
        color: '#0d9488',
        showSpinner: false,
        delay: 180,
    },
});
