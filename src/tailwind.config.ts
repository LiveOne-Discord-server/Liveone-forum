
import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "vote-bounce": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" }
        },
        "vote-like-color": {
          "0%": { color: "inherit" },
          "100%": { color: "rgb(34, 197, 94)" } // green-500
        },
        "vote-dislike-color": {
          "0%": { color: "inherit" },
          "100%": { color: "rgb(239, 68, 68)" } // red-500
        },
        "glow": {
          "0%": { 
            "text-shadow": "0 0 5px rgb(255, 122, 50, 0.3), 0 0 15px rgb(255, 122, 50, 0.2), 0 0 25px rgb(255, 122, 50, 0.1)" 
          },
          "50%": { 
            "text-shadow": "0 0 10px rgb(255, 122, 50, 0.5), 0 0 20px rgb(255, 122, 50, 0.3), 0 0 30px rgb(255, 122, 50, 0.2)" 
          },
          "100%": { 
            "text-shadow": "0 0 5px rgb(255, 122, 50, 0.3), 0 0 15px rgb(255, 122, 50, 0.2), 0 0 25px rgb(255, 122, 50, 0.1)" 
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "vote-bounce": "vote-bounce 0.4s ease-in-out",
        "vote-like": "vote-like-color 0.4s ease-in-out forwards",
        "vote-dislike": "vote-dislike-color 0.4s ease-in-out forwards",
        "glow": "glow 2s ease-in-out infinite"
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
