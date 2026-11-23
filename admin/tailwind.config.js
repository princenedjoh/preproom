/** @type {import('tailwindcss').Config} */
// Colours come from src/styles/tokens.css (Notion design language, light + dark).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
const tags = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red']

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
          canvas : v('canvas'),
          surface : v('surface'),
          subtle : v('subtle'),
          raised : v('raised'),
          line : { DEFAULT : v('line'), strong : v('line-strong') },
          ink : { DEFAULT : v('ink'), 2 : v('ink-2'), 3 : v('ink-3'), 4 : v('ink-4') },
          accent : { DEFAULT : v('accent'), hover : v('accent-hover'), tint : v('accent-tint') },
          'on-accent' : v('on-accent'),
          easy : v('easy'),
          medium : v('medium'),
          hard : v('hard'),
          success : v('success'),
          inverse : v('inverse'),
          'on-inverse' : v('on-inverse'),
          tag : Object.fromEntries(tags.flatMap((t) => [[t, v(`tag-${t}`)], [`${t}-bg`, v(`tag-${t}-bg`)]])),

          // Legacy names from the ClickUp pass, mapped onto the tokens
          onyx : v('ink'),
          carbon : v('ink'),
          muted : v('ink-2'),
          ash : v('ink-3'),
          fog : v('ink-4'),
          cloud : v('line-strong'),
          bone : v('line'),
          mercury : v('line'),
          mist : v('subtle'),
          plaster : v('subtle'),
          brand : {
            violet : v('tag-purple'),
            blue : v('accent'),
            mint : v('tag-green-bg'),
            emerald : v('tag-green'),
            teal : v('tag-green'),
          },
        },
        fontFamily : {
          display : ['var(--font-sans)'],
          sans : ['var(--font-sans)'],
          serif : ['var(--font-serif)'],
          mono : ['var(--font-mono)'],
        },
        borderRadius : {
          sm : 'var(--radius-sm)',
          md : 'var(--radius-md)',
          lg : 'var(--radius-lg)',
          xl : 'var(--radius-xl)',
          card : 'var(--radius-lg)',
          'card-lg' : 'var(--radius-xl)',
          input : 'var(--radius-md)',
        },
        boxShadow : {
          float : 'var(--shadow-float)',
          press : 'var(--shadow-press)',
        },
        maxWidth : {
          page : '1200px',
        },
        transitionTimingFunction :{
          'out' : 'var(--ease-out)',
          'in-out' : 'var(--ease-in-out)',
          'drawer' : 'var(--ease-drawer)',
          'settle' : 'cubic-bezier(0.33, 1, 0.68, 1)',
        }
      },
    },
    plugins: [],
  }
