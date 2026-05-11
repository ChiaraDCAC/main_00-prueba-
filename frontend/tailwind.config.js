/** @type {import('tailwindcss').Config} */
//
// SISTEMA DE DISE\u00d1O DCaC
// Tokens definidos en: ../../Agents/Agents/Design/tokens.json
// Reglas:              ../../Agents/Agents/Design/Condiciones de dise\u00f1o.md
//
// Paletas DCaC disponibles como utilidades de Tailwind:
//   brand         \u2014 azul de marca DCaC (#3179a7 = brand-500)
//   positive      \u2014 verde DCaC (#54a22b = positive-500)
//   negative      \u2014 rojo DCaC (#e76162 = negative-500)
//   warning       \u2014 amarillo DCaC (#b29b0e = warning-500)
//   notice        \u2014 naranja DCaC (#e45a00 = notice-500)
//   neutral       \u2014 grises DCaC
//
// Cada paleta tiene shades 50-900 + DEFAULT.
// Reglas de uso (extracto de Condiciones de dise\u00f1o.md):
//  - Color cumple funci\u00f3n SEM\u00c1NTICA (errores=negative, \u00e9xito=positive,
//    alertas=warning/notice, marca=brand). NO decorativa.
//  - Sin gradientes.
//  - Contraste m\u00ednimo 4:1.
//
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Brand DCaC (azul de marca) ──────────────────────────
        brand: {
          50:  '#eaf2f6',
          100: '#bfd5e4',
          200: '#a0c1d7',
          300: '#75a5c4',
          400: '#5a94b9',
          500: '#3179a7',
          600: '#2d6e98',
          700: '#235677',
          800: '#1b435c',
          900: '#153346',
          DEFAULT: '#3179a7',
        },
        // ── Positive (verde DCaC, \u00e9xito) ───────────────────────
        positive: {
          50:  '#eef6ea',
          100: '#cae2bd',
          200: '#b0d49d',
          300: '#8cc171',
          400: '#76b555',
          500: '#54a22b',
          600: '#4c9327',
          700: '#3c731f',
          800: '#2e5918',
          900: '#234412',
          DEFAULT: '#54a22b',
        },
        // ── Negative (rojo DCaC, error) ─────────────────────────
        negative: {
          50:  '#fdefef',
          100: '#f8cece',
          200: '#f4b6b7',
          300: '#ef9596',
          400: '#ec8181',
          500: '#e76162',
          600: '#d25859',
          700: '#a44546',
          800: '#7f3536',
          900: '#612929',
          DEFAULT: '#e76162',
        },
        // ── Warning (amarillo DCaC, alerta general) ─────────────
        warning: {
          50:  '#f7f5e7',
          100: '#e7e0b4',
          200: '#dcd190',
          300: '#cbbc5e',
          400: '#c1af3e',
          500: '#b29b0e',
          600: '#a28d0d',
          700: '#7e6e0a',
          800: '#625508',
          900: '#4b4106',
          DEFAULT: '#b29b0e',
        },
        // ── Notice (naranja DCaC, llamada de atenci\u00f3n) ──────────
        notice: {
          50:  '#fcefe6',
          100: '#f7ccb0',
          200: '#f3b38a',
          300: '#ed9054',
          400: '#e97b33',
          500: '#e45a00',
          600: '#cf5200',
          700: '#a24000',
          800: '#7d3200',
          900: '#602600',
          DEFAULT: '#e45a00',
        },
        // ── Neutrales DCaC ──────────────────────────────────────
        neutral: {
          100: '#f8f8f8',
          200: '#ededed',
          300: '#d2d2d2',
          400: '#c0c0c0',
          500: '#a4a4a4',
          600: '#888888',
          700: '#666666',
          800: '#555555',
        },
        // ── Compat con shadcn (mantiene API existente) ──────────
        primary: {
          '50': '#eaf2f6',  // Re-mapeado a DCaC brand para que utilidades
          '100': '#bfd5e4', // primary-* existentes apunten a tokens correctos
          '200': '#a0c1d7',
          '300': '#75a5c4',
          '400': '#5a94b9',
          '500': '#3179a7',
          '600': '#2d6e98',
          '700': '#235677',
          '800': '#1b435c',
          '900': '#153346',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
