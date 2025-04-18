
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				neon: {
					purple: '#b026ff',
					blue: '#00f6ff',
					pink: '#ff00ea',
					green: '#00ff9d',
					orange: '#FF5722',
					red: '#F44336',
				},
				primary: {
					DEFAULT: 'hsl(24, 95%, 53%)', // Orange
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(24, 95%, 53%)', // Orange
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'glow': {
					'0%, 100%': { 
						textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #F44336, 0 0 20px #F44336, 0 0 25px #F44336, 0 0 30px #F44336, 0 0 35px #F44336'
					},
					'50%': { 
						textShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #FF5722, 0 0 40px #FF5722, 0 0 50px #FF5722, 0 0 60px #FF5722, 0 0 70px #FF5722'
					}
				},
				'flicker': {
					'0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
						opacity: '0.99',
						filter: 'drop-shadow(0 0 1px rgba(255, 87, 34, 0.7)) drop-shadow(0 0 5px rgba(255, 87, 34, 0.5)) drop-shadow(0 0 15px rgba(255, 87, 34, 0.5))'
					},
					'20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
						opacity: '0.4',
						filter: 'none'
					}
				},
				'fadeIn': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'buttonPulse': {
					'0%, 100%': { 
						boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.4)' 
					},
					'50%': { 
						boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'glow': 'glow 2s ease-in-out infinite',
				'flicker': 'flicker 3s linear infinite',
				'fadeIn': 'fadeIn 0.5s ease-in',
				'button-pulse': 'buttonPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			boxShadow: {
				'neon-purple': '0 0 5px #b026ff, 0 0 20px rgba(176, 38, 255, 0.5)',
				'neon-blue': '0 0 5px #00f6ff, 0 0 20px rgba(0, 246, 255, 0.5)',
				'neon-pink': '0 0 5px #ff00ea, 0 0 20px rgba(255, 0, 234, 0.5)',
				'neon-green': '0 0 5px #00ff9d, 0 0 20px rgba(0, 255, 157, 0.5)',
				'neon-orange': '0 0 5px #FF5722, 0 0 20px rgba(255, 87, 34, 0.5)',
				'neon-red': '0 0 5px #F44336, 0 0 20px rgba(244, 67, 54, 0.5)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
