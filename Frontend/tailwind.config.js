/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    DEFAULT: 'rgb(var(--color-brand-600))',
                    50: 'rgb(var(--color-brand-50))',
                    100: 'rgb(var(--color-brand-100))',
                    200: 'rgb(var(--color-brand-200))',
                    300: 'rgb(var(--color-brand-300))',
                    400: 'rgb(var(--color-brand-400))',
                    500: 'rgb(var(--color-brand-500))',
                    600: 'rgb(var(--color-brand-600))',
                    700: 'rgb(var(--color-brand-700))',
                    800: 'rgb(var(--color-brand-800))',
                    900: 'rgb(var(--color-brand-900))',
                    950: 'rgb(var(--color-brand-950))',
                },
                accent: {
                    DEFAULT: 'rgb(var(--color-accent-600))',
                    50: 'rgb(var(--color-accent-50))',
                    100: 'rgb(var(--color-accent-100))',
                    200: 'rgb(var(--color-accent-200))',
                    300: 'rgb(var(--color-accent-300))',
                    400: 'rgb(var(--color-accent-400))',
                    500: 'rgb(var(--color-accent-500))',
                    600: 'rgb(var(--color-accent-600))',
                    700: 'rgb(var(--color-accent-700))',
                    800: 'rgb(var(--color-accent-800))',
                    900: 'rgb(var(--color-accent-900))',
                    950: 'rgb(var(--color-accent-950))',
                }
            }
        },
    },
    plugins: [],
}
