import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      colors: {
        paper: {
          bg: '#F8F6F0',
          card: '#F4F1E8',
          hover: '#EFECE2',
          active: '#E2E5F0',
          border: '#E6E2D6',
        },
        brand: {
          navy: '#1E3A8A',
          navyHover: '#172E6E',
        },
      },
    },
  },
  plugins: [],
};

export default config;
