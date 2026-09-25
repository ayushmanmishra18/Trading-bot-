/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#06080C',
        panel: '#0C1017',
        panel2: '#101623',
        line: 'rgba(255,255,255,0.08)',
        mist: '#8B93A7',
        fog: '#C7CEDD',
        mint: '#3DF5A6',
        amber: '#FFB224',
        coral: '#FF5C5C',
        vio: '#8B7CFF'
      },
      fontFamily: {
        disp: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      keyframes: {
        tape: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
        rise: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        drift: { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(30px,-20px)' } }
      },
      animation: {
        tape: 'tape 40s linear infinite',
        blink: 'blink 1.6s ease-in-out infinite',
        rise: 'rise .5s ease both',
        drift: 'drift 14s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
