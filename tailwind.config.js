/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Tahoma', 'Verdana', 'Arial', 'sans-serif'],
        'mono': ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            code: {
              color: 'inherit',
              backgroundColor: 'transparent',
              fontWeight: '400',
              fontSize: '0.875rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'transparent',
              color: 'inherit',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
            },
            blockquote: {
              color: 'inherit',
              borderLeftColor: 'inherit',
              fontStyle: 'italic',
            },
            h1: {
              color: 'inherit',
              fontWeight: '600',
            },
            h2: {
              color: 'inherit',
              fontWeight: '600',
            },
            h3: {
              color: 'inherit',
              fontWeight: '600',
            },
            h4: {
              color: 'inherit',
              fontWeight: '600',
            },
            strong: {
              color: 'inherit',
              fontWeight: '600',
            },
            em: {
              color: 'inherit',
            },
            table: {
              fontSize: '0.875rem',
            },
            th: {
              color: 'inherit',
              fontWeight: '600',
            },
            td: {
              color: 'inherit',
            },
          },
        },
      },
    },
  },
  keyframes: {
    gradient: {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
    pulseSlow: {
      '0%, 100%': { transform: 'scale(1)', opacity: '1' },
      '50%': { transform: 'scale(1.02)', opacity: '0.95' },
    }
  },
  animation: {
    gradient: 'gradient 6s ease-in-out infinite',
    pulseSlow: 'pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
