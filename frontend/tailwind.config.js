/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        card: "var(--card)",
        text: "var(--text)",
        primary: "var(--primary)",
        error: "var(--error)",
      },
    },
  },
  plugins: [],
}
