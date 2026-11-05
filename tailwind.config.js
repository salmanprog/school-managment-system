import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', ...defaultTheme.fontFamily.sans],
                display: ['"Fraunces"', 'Georgia', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                brand: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
                ink: {
                    50: '#f3f6fb',
                    100: '#e4ebf5',
                    700: '#243b53',
                    800: '#162d46',
                    900: '#0b1f36',
                    950: '#071526',
                },
            },
            boxShadow: {
                soft: '0 10px 30px -12px rgba(11, 31, 54, 0.18)',
                panel: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
            },
            backgroundImage: {
                'edu-mesh':
                    'radial-gradient(ellipse 80% 60% at 10% 0%, rgba(20, 184, 166, 0.18), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 10%, rgba(56, 189, 248, 0.14), transparent 50%), linear-gradient(165deg, #f5f8fc 0%, #eef4f8 100%)',
            },
        },
    },
    plugins: [forms],
};
