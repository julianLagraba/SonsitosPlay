import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#222230',
        },
        accent: {
          DEFAULT: '#b3242e',
          hover: '#c9343e',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(179, 36, 46, 0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(179, 36, 46, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
