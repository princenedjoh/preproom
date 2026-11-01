/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      screens : {
        'xs' : '390px',
        'sm' : '640px',
        'md' : '768px',
        'lg' : '1024px',
        'xl' : '1280px',
      },
      extend: {
        colors : {
          ink : '#202020',
          onyx : '#090c1d',
          carbon : '#2a2a2a',
          muted : '#646464',
          ash : '#838383',
          fog : '#b3b3b3',
          cloud : '#d4d4d4',
          bone : '#e8e8e8',
          mist : '#f8f9fa',
          plaster : '#e9ebf0',
          mercury : '#eeeeee',
          brand : {
            violet : '#6647f0',
            blue : '#0091ff',
            mint : '#6ee7b7',
            emerald : '#00c07a',
            teal : '#16c0a4',
          }
        },
        fontFamily : {
          display : ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          sans : ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          mono : ['"Sometype Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        },
        borderRadius : {
          card : '12px',
          'card-lg' : '20px',
          input : '9px',
        },
        maxWidth : {
          page : '1200px',
        },
        transitionTimingFunction :{
          'ease-bounce' : 'cubic-bezier(0.24,0.24,0.51,1.47)',
          'settle' : 'cubic-bezier(0.33, 1, 0.68, 1)',
        }
      },
    },
    plugins: [],
  }
