import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'spin-reverse': 'spin 3s linear infinite reverse',
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
