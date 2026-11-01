import { TypographyBold, TypographySize } from "./style.types"

// Tokens follow the ClickUp-style DESIGN.md: white canvas, near-black ink for
// primary actions, grayscale everywhere else and colour used only for status / brand moments.
const theme = {
    colors : {
        main : {
            primary : '#202020',
            secondary : '#f8f9fa'
        },
        background : {
            dark : {
                black : "#090c1d",
                primary : "#111111",
                secondary : "#202020",
                tetiary : '#d4d4d4'
            },
            light : {
                white : '#ffffff',
                primary : '#f8f9fa',
                secondary : '#eeeeee',
                tetiary : '#e9ebf0'
            }
        },
        text : {
            light : {
                white : '#ffffff',
                primary : '#eeeeee',
                secondary : '#b3b3b3'
            },
            dark : {
                black : "#202020",
                primary : "#646464",
                secondary : "#838383",
                tetiary : '#b3b3b3'
            }
        },
        border : {
            light : {
                white : '#ffffff',
                primary : "#e8e8e8",
                secondary : '#d4d4d4'
            },
            dark : {
                black : "#202020",
                primary : "#2a2a2a",
                secondary : "#646464"
            }
        },
        buttons : {
            red : '#f0457a',
            green : '#00c07a'
        }
    },

    colors2 : {
        main : {
            primary : "#202020"
        },

        brand : {
            violet : "#6647f0",
            blue : "#0091ff",
            mint : "#6ee7b7",
            emerald : "#00c07a",
            teal : "#16c0a4",
            onyx : "#090c1d",
            plaster : "#e9ebf0",
        },

        gray : {
            gray1 : "#202020",
            gray2 : "#2a2a2a",
            gray3 : "#646464",
            gray4 : "#838383",
            gray5 : "#d4d4d4",
            gray6 : "#e8e8e8",
            gray7 : "#eeeeee",
            gray8 : "#f8f9fa",
            gray9 : "#f8f9fa",
        },

        blue : {
            blue1 : "#00335a",
            blue2 : "#005fa8",
            blue3 : "#0091ff",
            blue4 : "#7cc4ff",
            blue5 : "#cfe8ff",
            blue6 : "#e6f3ff",
            blue7 : "#f2f9ff",
            blue8 : "#f8fbff",
            blue9 : "#f8f9fa",
        },

        green : {
            green1 : "#005c3a",
            green2 : "#00a368",
            green3 : "#00c07a",
            green4 : "#6ee7b7",
            green5 : "#dcfaee",
        },

        red : {
            red1 : "#7a0f2f",
            red2 : "#c2184f",
            red3 : "#f0457a",
            red4 : "#f9a3bd",
            red5 : "#ffe3ec",
        },

        orange : {
            orange1 : "#7a3d07",
            orange2 : "#c66a12",
            orange3 : "#fd9a46",
            orange4 : "#ffcba6",
            orange5 : "#fff0e3",
        },

        violet : {
            violet1 : "#2a1a72",
            violet2 : "#4a2fd0",
            violet3 : "#6647f0",
            violet4 : "#b7a8f8",
            violet5 : "#efebfe",
        },

        shades : {
            white : "#ffffff",
            black : "#202020"
        }
    },

    fonts : {
        display : `'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif`,
        body : `'Inter', ui-sans-serif, system-ui, sans-serif`,
        mono : `'Sometype Mono', 'JetBrains Mono', ui-monospace, monospace`,
    },

    gradients : {
        rainbowConic : `conic-gradient(from 90deg, rgb(125, 91, 231) 19%, rgb(188, 63, 218) 28%, rgb(250, 36, 206) 37%, rgb(251, 73, 165) 45%, rgb(252, 109, 123) 52%, rgb(253, 132, 97) 55%, rgb(253, 154, 70) 58%, rgb(246, 135, 198) 65%, rgb(163, 160, 224) 80%, rgb(79, 185, 250) 95%, rgb(0, 145, 255) 100%)`,
        primary : `linear-gradient(83deg, rgb(64, 221, 255) -5%, rgb(118, 18, 250) 51%, rgb(250, 18, 227) 125%)`,
        darkFade : `linear-gradient(rgb(17, 17, 17) 24%, rgb(0, 0, 0))`,
    },

    shadows : {
        sm : `rgba(13, 21, 48, 0.04) 0px 4px 4px 0px`,
        subtle : `rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px`,
        screenshot : `rgba(13, 21, 48, 0.08) 0px 40px 80px -20px, rgba(13, 21, 48, 0.06) 0px 12px 24px -8px`,
    },

    motion : {
        ease : 'cubic-bezier(0.33, 1, 0.68, 1)',
        duration : '0.45s',
        hover : '0.15s',
    },

    typography: {
        size: { xs: TypographySize.xs, sm: TypographySize.sm, sm2: TypographySize.sm2, md: TypographySize.md,
            md2 : TypographySize.md2, lg: TypographySize.lg, lg2 : TypographySize.lg,
            xl: TypographySize.xl, xxl: TypographySize.xxl, xl3: TypographySize.xl3 },
        bold: { sm: TypographyBold.sm, md: TypographyBold.md, md2: TypographyBold.md2, lg2: TypographyBold.lg2, lg: TypographyBold.lg },
      },

    spacing: {
        xs: "4px",
        sm: "12px",
        md: "16px",
        lg: "28px",
    },

    borderRadius: {
        sm: "9px",
        md: "12px",
        lg: "20px",
        pill: "9999px",
    },

    breakpoints: {
        xs: "600px",
        sm: "800px",
        md: "1000px",
        lg: "1200px",
        xl: "1400px",
    },
}

export default theme
