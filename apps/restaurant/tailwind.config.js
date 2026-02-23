/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: { sans: ['Inter', 'sans-serif'] },
            colors: {
                brand: {
                    50: '#faf5ff',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7e22ce',
                },
            },
        },
    },
    plugins: [],
}
