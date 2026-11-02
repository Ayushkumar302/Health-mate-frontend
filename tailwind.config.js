/** @type {import('tailwindcss').Config} */
// every color is a CSS variable (see src/index.css) so light and dark theme switch automatically
const token = name => `hsl(var(--${name}) / <alpha-value>)`;

export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  	},
  	extend: {
  		fontFamily: {
  			sans: ['"Plus Jakarta Sans"', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// legacy names used across the app, now theme aware
  			primaryColor: token('primary'),
  			yellowColor: token('brand-amber'),
  			purpleColor: token('brand-violet'),
  			irisBlueColor: token('brand-cyan'),
  			headingColor: token('foreground'),
  			textColor: token('muted-foreground'),
  			smallTextColor: token('muted-foreground'),

  			brand: {
  				teal: token('primary'),
  				cyan: token('brand-cyan'),
  				violet: token('brand-violet'),
  				amber: token('brand-amber'),
  				rose: token('brand-rose'),
  			},
  			success: token('success'),
  			highlight: token('highlight'),
  			background: token('background'),
  			foreground: token('foreground'),
  			card: {
  				DEFAULT: token('card'),
  				foreground: token('card-foreground')
  			},
  			popover: {
  				DEFAULT: token('popover'),
  				foreground: token('popover-foreground')
  			},
  			primary: {
  				DEFAULT: token('primary'),
  				foreground: token('primary-foreground')
  			},
  			secondary: {
  				DEFAULT: token('secondary'),
  				foreground: token('secondary-foreground')
  			},
  			muted: {
  				DEFAULT: token('muted'),
  				foreground: token('muted-foreground')
  			},
  			accent: {
  				DEFAULT: token('accent'),
  				foreground: token('accent-foreground')
  			},
  			destructive: {
  				DEFAULT: token('destructive'),
  				foreground: token('destructive-foreground')
  			},
  			border: token('border'),
  			input: token('input'),
  			ring: token('ring'),
  		},
  		boxShadow: {
  			panelShadow: '0 20px 50px -24px hsl(var(--shadow-color) / 0.28)',
  			soft: '0 10px 30px -12px hsl(var(--shadow-color) / 0.18)',
  			glow: '0 18px 40px -18px hsl(var(--shadow-color) / 0.35)',
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
  			float: {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-12px)' }
  			},
  			aurora: {
  				'0%, 100%': { transform: 'translate(0, 0) scale(1)' },
  				'33%': { transform: 'translate(6%, -8%) scale(1.1)' },
  				'66%': { transform: 'translate(-6%, 6%) scale(0.95)' }
  			},
  			marquee: {
  				from: { transform: 'translateX(0)' },
  				to: { transform: 'translateX(-50%)' }
  			},
  			shimmer: {
  				from: { backgroundPosition: '200% 0' },
  				to: { backgroundPosition: '-200% 0' }
  			},
  			'gradient-x': {
  				'0%, 100%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' }
  			},
  			pulse_line: {
  				from: { strokeDashoffset: '300' },
  				to: { strokeDashoffset: '0' }
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			float: 'float 6s ease-in-out infinite',
  			'float-slow': 'float 8s ease-in-out infinite',
  			aurora: 'aurora 18s ease-in-out infinite',
  			marquee: 'marquee 40s linear infinite',
  			shimmer: 'shimmer 2s linear infinite',
  			'gradient-x': 'gradient-x 6s ease infinite',
  			'pulse-line': 'pulse_line 2.4s linear infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
