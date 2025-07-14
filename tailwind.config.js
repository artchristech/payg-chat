/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Tahoma', 'Verdana', 'Arial', 'sans-serif'],
      },
      colors: {
        // Semantic color system using CSS variables
        app: 'var(--color-app)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-active': 'var(--color-surface-active)',
        border: 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-text': 'var(--color-primary-text)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-text': 'var(--color-accent-text)',
        error: 'var(--color-error)',
        'error-bg': 'var(--color-error-bg)',
        'error-text': 'var(--color-error-text)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        'input-bg': 'var(--color-input-bg)',
        'input-border': 'var(--color-input-border)',
        'input-focus': 'var(--color-input-focus)',
        'button-secondary': 'var(--color-button-secondary)',
        'button-secondary-hover': 'var(--color-button-secondary-hover)',
        'button-secondary-text': 'var(--color-button-secondary-text)',
      },
    },
  },
  plugins: [],
};
