import { TypographyBold, TypographySize } from "./style.types"

// Notion design language (ai-toolbox/design-systems/notion/DESIGN.md).
// Every colour is a CSS variable from tokens.css, so light/dark switch without re-rendering.
const v = (name : string, alpha? : number) => alpha === undefined ? `rgb(var(--${name}))` : `rgb(var(--${name}) / ${alpha})`

export const color = {
    canvas : v('canvas'),
    surface : v('surface'),
    subtle : v('subtle'),
    raised : v('raised'),
    line : v('line'),
    lineStrong : v('line-strong'),
    ink : v('ink'),
    ink2 : v('ink-2'),
    ink3 : v('ink-3'),
    ink4 : v('ink-4'),
    accent : v('accent'),
    accentHover : v('accent-hover'),
    accentTint : v('accent-tint'),
    onAccent : v('on-accent'),
    easy : v('easy'),
    medium : v('medium'),
    hard : v('hard'),
    success : v('success'),
    successSolid : v('success-solid'),
    frame : v('frame'),
    inverse : v('inverse'),
    onInverse : v('on-inverse'),
    ring : 'var(--ring)',
    hover : v('ink', 0.05),
    press : v('ink', 0.08),
    tag : {
        gray : v('tag-gray'), grayBg : v('tag-gray-bg'),
        brown : v('tag-brown'), brownBg : v('tag-brown-bg'),
        orange : v('tag-orange'), orangeBg : v('tag-orange-bg'),
        yellow : v('tag-yellow'), yellowBg : v('tag-yellow-bg'),
        green : v('tag-green'), greenBg : v('tag-green-bg'),
        blue : v('tag-blue'), blueBg : v('tag-blue-bg'),
        purple : v('tag-purple'), purpleBg : v('tag-purple-bg'),
        pink : v('tag-pink'), pinkBg : v('tag-pink-bg'),
        red : v('tag-red'), redBg : v('tag-red-bg'),
    },
    alpha : v,
}

const theme = {
    color,

    // Legacy keys, mapped onto the tokens so older components theme correctly
    colors : {
        main : { primary : color.ink, secondary : color.subtle },
        background : {
            dark : { black : color.inverse, primary : color.inverse, secondary : color.inverse, tetiary : color.lineStrong },
            light : { white : color.surface, primary : color.subtle, secondary : color.subtle, tetiary : color.subtle },
        },
        text : {
            light : { white : color.onInverse, primary : color.onInverse, secondary : color.ink4 },
            dark : { black : color.ink, primary : color.ink2, secondary : color.ink3, tetiary : color.ink4 },
        },
        border : {
            light : { white : color.surface, primary : color.line, secondary : color.lineStrong },
            dark : { black : color.ink, primary : color.lineStrong, secondary : color.ink3 },
        },
        buttons : { red : color.tag.red, green : color.tag.green },
        shades : { white : color.surface, black : color.ink },
        red : { red3 : color.tag.red },
        gray : { gray1 : color.ink, gray3 : color.ink2, gray5 : color.lineStrong },
    },

    colors2 : {
        main : { primary : color.ink },
        brand : {
            violet : color.tag.purple,
            blue : color.accent,
            mint : color.tag.greenBg,
            emerald : color.tag.green,
            teal : color.tag.green,
            onyx : color.ink,
            plaster : color.subtle,
        },
        gray : {
            gray1 : color.ink, gray2 : color.ink, gray3 : color.ink2, gray4 : color.ink3,
            gray5 : color.lineStrong, gray6 : color.line, gray7 : color.subtle, gray8 : color.subtle, gray9 : color.subtle,
        },
        blue : { blue1 : color.accent, blue2 : color.accent, blue3 : color.accent, blue4 : color.accent, blue5 : color.accentTint, blue6 : color.accentTint, blue7 : color.accentTint, blue8 : color.accentTint, blue9 : color.subtle },
        green : { green1 : color.tag.green, green2 : color.tag.green, green3 : color.tag.green, green4 : color.tag.green, green5 : color.tag.greenBg },
        red : { red1 : color.tag.red, red2 : color.tag.red, red3 : color.tag.red, red4 : color.tag.red, red5 : color.tag.redBg },
        orange : { orange1 : color.tag.orange, orange2 : color.tag.orange, orange3 : color.tag.orange, orange4 : color.tag.orange, orange5 : color.tag.orangeBg },
        violet : { violet1 : color.tag.purple, violet2 : color.tag.purple, violet3 : color.tag.purple, violet4 : color.tag.purple, violet5 : color.tag.purpleBg },
        shades : { white : color.surface, black : color.ink },
    },

    font : {
        sans : 'var(--font-sans)',
        serif : 'var(--font-serif)',
        mono : 'var(--font-mono)',
    },
    fonts : {
        display : 'var(--font-sans)',
        body : 'var(--font-sans)',
        serif : 'var(--font-serif)',
        mono : 'var(--font-mono)',
    },

    radius : { sm : 'var(--radius-sm)', md : 'var(--radius-md)', lg : 'var(--radius-lg)', xl : 'var(--radius-xl)', pill : '9999px' },
    borderRadius : { sm : 'var(--radius-md)', md : 'var(--radius-lg)', lg : 'var(--radius-xl)', pill : '9999px' },

    gradients : {
        darkFade : color.inverse,
    },

    shadows : {
        float : 'var(--shadow-float)',
        sm : 'var(--shadow-press)',
        subtle : 'var(--shadow-press)',
        screenshot : 'var(--shadow-float)',
    },

    motion : {
        ease : 'cubic-bezier(0.33, 1, 0.68, 1)',
        // Strong curves: ease-out for enter/press, in-out for on-screen movement, drawer for sheets
        easeOut : 'cubic-bezier(0.23, 1, 0.32, 1)',
        easeInOut : 'cubic-bezier(0.77, 0, 0.175, 1)',
        easeDrawer : 'cubic-bezier(0.32, 0.72, 0, 1)',
        duration : '0.45s',
        hover : '0.12s',
        press : '0.12s',
    },

    typography: {
        size: { xs: TypographySize.xs, sm: TypographySize.sm, sm2: TypographySize.sm2, md: TypographySize.md,
            md2 : TypographySize.md2, lg: TypographySize.lg, lg2 : TypographySize.lg,
            xl: TypographySize.xl, xxl: TypographySize.xxl, xl3: TypographySize.xl3 },
        bold: { sm: TypographyBold.sm, md: TypographyBold.md, md2: TypographyBold.md2, lg2: TypographyBold.lg2, lg: TypographyBold.lg },
      },

    spacing: { xs: "4px", sm: "12px", md: "16px", lg: "28px" },

    breakpoints: { xs: "600px", sm: "800px", md: "1000px", lg: "1200px", xl: "1400px" },
}

export default theme
