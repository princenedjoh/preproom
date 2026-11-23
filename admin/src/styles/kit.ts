import styled, { css } from "styled-components";

// Every pressable element: instant scale feedback on press, hover only on real pointers,
// and a visible ring for keyboard focus.
export const pressable = css`
    transition :
        transform ${({theme}) => theme.motion.press} ${({theme}) => theme.motion.easeOut},
        background-color ${({theme}) => theme.motion.hover} ease,
        border-color ${({theme}) => theme.motion.hover} ease,
        color ${({theme}) => theme.motion.hover} ease,
        opacity ${({theme}) => theme.motion.hover} ease,
        box-shadow ${({theme}) => theme.motion.hover} ease;
    -webkit-tap-highlight-color : transparent;
    &:active:not(:disabled) { transform : scale(0.97); }
    &:focus-visible { outline : none; box-shadow : 0 0 0 3px rgba(0, 145, 255, 0.35); }
    &:disabled { opacity : 0.4; cursor : not-allowed; }
`

// Shared design-system primitives (DESIGN.md): pills, display type, cards, status chips

export const Section = styled.section.attrs({
    className : `Section w-full flex justify-center px-4 md:px-6` as string
})<{band? : boolean}>`
    background : ${({theme, band}) => band ? theme.colors2.brand.plaster : 'transparent'};
`

export const Container = styled.div.attrs({
    className : `Container w-full max-w-[1200px]` as string
})``

export const Eyebrow = styled.span.attrs({
    className : `Eyebrow inline-block uppercase text-[10px] md:text-[12px]` as string
})<{light? : boolean}>`
    font-family : ${({theme}) => theme.fonts.mono};
    letter-spacing : 0.08em;
    color : ${({theme, light}) => light ? theme.colors.text.light.secondary : theme.colors2.gray.gray4};
`

export const Display = styled.h1.attrs({
    className : `Display text-[44px] sm:text-[60px] lg:text-[64px] xl:text-[72px] leading-[1.05]` as string
})`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 800;
    letter-spacing : -0.04em;
    color : ${({theme}) => theme.colors2.brand.onyx};
`

export const Heading = styled.h2.attrs({
    className : `Heading text-[34px] md:text-[48px] leading-[1.1]` as string
})<{light? : boolean}>`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 700;
    letter-spacing : -0.035em;
    color : ${({theme, light}) => light ? theme.colors.text.light.white : theme.colors2.brand.onyx};
`

export const Title = styled.h3.attrs({
    className : `Title text-[20px] leading-[1.3]` as string
})<{light? : boolean}>`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 700;
    letter-spacing : -0.02em;
    color : ${({theme, light}) => light ? theme.colors.text.light.white : theme.colors.main.primary};
`

export const Lead = styled.p.attrs({
    className : `Lead text-[16px] md:text-[18px] leading-[1.55]` as string
})<{light? : boolean}>`
    letter-spacing : -0.01em;
    color : ${({theme, light}) => light ? theme.colors.text.light.secondary : theme.colors2.gray.gray3};
`

export const Body = styled.p.attrs({
    className : `Body text-[14px] md:text-[15px] leading-[1.55]` as string
})<{light? : boolean}>`
    color : ${({theme, light}) => light ? theme.colors.text.light.secondary : theme.colors2.gray.gray3};
`

export const DarkButton = styled.button.attrs({
    className : `DarkButton inline-flex items-center justify-center gap-2 rounded-full
    text-[14px] font-bold whitespace-nowrap px-6 py-3` as string
})`
    color : ${({theme}) => theme.colors.text.light.white};
    background : ${({theme}) => theme.colors.main.primary};
    border : none;
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover:not(:disabled) { opacity : 0.86; }
    }
`

export const LightButton = styled(DarkButton)`
    color : ${({theme}) => theme.colors.main.primary};
    background : ${({theme}) => theme.colors.background.light.white};
`

export const GhostButton = styled.button.attrs({
    className : `GhostButton inline-flex items-center justify-center gap-2 rounded-full
    text-[14px] font-bold whitespace-nowrap px-5 py-[11px]` as string
})`
    color : ${({theme}) => theme.colors.main.primary};
    background : transparent;
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover:not(:disabled) { background : rgba(0, 0, 0, 0.04); }
    }
`

export const TagPill = styled.span.attrs({
    className : `TagPill inline-flex items-center gap-[6px] rounded-full text-[14px] font-bold px-4 py-2` as string
})<{active? : boolean}>`
    color : ${({theme, active}) => active ? theme.colors2.brand.blue : theme.colors.main.primary};
    background : ${({theme}) => theme.colors.background.light.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const StatusPill = styled.span.attrs({
    className : `StatusPill inline-flex items-center rounded-full uppercase whitespace-nowrap
    text-[10px] font-semibold px-[9px] py-[3px]` as string
})<{status : 'done' | 'progress' | 'review' | 'todo'}>`
    letter-spacing : 0.04em;
    color : ${({theme, status}) => status === 'done' ? theme.colors2.green.green1
        : status === 'todo' ? theme.colors2.gray.gray3 : theme.colors.text.light.white};
    background : ${({theme, status}) => ({
        done : theme.colors2.brand.mint,
        progress : theme.colors2.brand.blue,
        review : theme.colors2.red.red3,
        todo : theme.colors2.gray.gray7,
    })[status]};
`

export const Card = styled.div.attrs({
    className : `Card rounded-[12px] p-6 md:p-7 flex flex-col gap-3` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const IconTile = styled.span.attrs({
    className : `IconTile inline-flex items-center justify-center w-10 h-10 rounded-full` as string
})<{light? : boolean}>`
    color : ${({theme, light}) => light ? theme.colors.text.light.white : theme.colors.main.primary};
    background : ${({theme, light}) => light ? 'rgba(255, 255, 255, 0.08)' : theme.colors.background.light.primary};
    border : ${({theme, light}) => light ? '1px solid rgba(255, 255, 255, 0.12)' : `1px solid ${theme.colors.border.light.primary}`};
`

export const Avatar = styled.span.attrs({
    className : `Avatar inline-flex items-center justify-center rounded-full shrink-0
    text-[10px] font-bold` as string
})<{color : string, size? : number, ring? : string}>`
    width : ${({size}) => size ?? 24}px;
    height : ${({size}) => size ?? 24}px;
    color : ${({theme}) => theme.colors.text.light.white};
    background : ${({color}) => color};
    border : ${({ring}) => `2px solid ${ring ?? '#ffffff'}`};
    & + & { margin-left : -8px; }
`

export const TextLink = styled.button.attrs({
    className : `TextLink inline-flex items-center gap-1 text-[14px] font-bold w-fit` as string
})`
    color : ${({theme}) => theme.colors2.brand.blue};
    ${pressable}
    svg { transition : transform ${({theme}) => theme.motion.hover} ${({theme}) => theme.motion.easeOut}; }
    @media (hover : hover) and (pointer : fine) {
        &:hover svg { transform : translateX(3px); }
    }
`

/* App screens */

export const Page = styled.main.attrs({
    className : `Page w-full flex justify-center px-4 md:px-6 pt-[96px] pb-20 md:pb-28 min-h-screen` as string
})<{band? : boolean}>`
    background : ${({theme, band}) => band ? theme.colors.background.light.primary : theme.colors.background.light.white};
`

export const PageInner = styled.div.attrs({
    className : `PageInner w-full max-w-[1200px] flex flex-col gap-8` as string
})``

export const PageTitle = styled.h1.attrs({
    className : `PageTitle text-[34px] md:text-[42px] leading-[1.1]` as string
})`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 700;
    letter-spacing : -0.035em;
    color : ${({theme}) => theme.colors2.brand.onyx};
`

export const Panel = styled.div.attrs({
    className : `Panel rounded-[12px] p-5 flex flex-col gap-4` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const PanelTitle = styled.div.attrs({
    className : `PanelTitle flex items-center gap-2 text-[14px] font-bold` as string
})`
    color : ${({theme}) => theme.colors.main.primary};
    svg { color : ${({theme}) => theme.colors2.gray.gray4}; }
`

export const Segmented = styled.div.attrs({
    className : `Segmented inline-flex items-center gap-1 rounded-full p-1 max-w-full overflow-x-auto` as string
})`
    background : ${({theme}) => theme.colors.background.light.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const SegmentedItem = styled.button.attrs({
    className : `SegmentedItem rounded-full px-4 py-[6px] text-[13px] whitespace-nowrap` as string
})<{active? : boolean}>`
    font-weight : ${({active}) => active ? 700 : 500};
    color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray3};
    background : ${({theme, active}) => active ? theme.colors.background.light.white : 'transparent'};
    box-shadow : ${({theme, active}) => active ? theme.shadows.subtle : 'none'};
    transition : background ${({theme}) => theme.motion.hover} ease, color ${({theme}) => theme.motion.hover} ease;
    &:hover { color : ${({theme}) => theme.colors.main.primary}; }
`

export const FilterChip = styled.button.attrs({
    className : `FilterChip inline-flex items-center gap-[6px] rounded-full px-3 py-[6px] text-[13px] font-semibold whitespace-nowrap` as string
})<{active? : boolean}>`
    color : ${({theme, active}) => active ? theme.colors.text.light.white : theme.colors2.gray.gray2};
    background : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors.background.light.white};
    border : ${({theme, active}) => `1px solid ${active ? theme.colors.main.primary : theme.colors.border.light.primary}`};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover { background : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors.background.light.primary}; }
    }
`

export const ProgressTrack = styled.div.attrs({
    className : `ProgressTrack w-full rounded-full overflow-hidden` as string
})<{height? : number}>`
    height : ${({height}) => height ?? 6}px;
    background : ${({theme}) => theme.colors2.gray.gray7};
`

export const ProgressFill = styled.div.attrs({
    className : `ProgressFill h-full rounded-full` as string
})<{value : number, color? : string}>`
    width : ${({value}) => Math.max(0, Math.min(100, value))}%;
    background : ${({theme, color}) => color ?? theme.colors2.brand.emerald};
    transition : width 0.6s cubic-bezier(0.23, 1, 0.32, 1);
`

export const Stat = styled.div.attrs({
    className : `Stat flex flex-col gap-1 rounded-[12px] p-5` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const StatValue = styled.span.attrs({
    className : `StatValue text-[34px] leading-none` as string
})`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 700;
    letter-spacing : -0.04em;
    font-variant-numeric : tabular-nums;
    color : ${({theme}) => theme.colors2.brand.onyx};
`

export const StatLabel = styled.span.attrs({
    className : `StatLabel text-[13px]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray3};
`

export const Empty = styled.div.attrs({
    className : `Empty flex flex-col items-center justify-center text-center gap-3 rounded-[12px] px-6 py-14` as string
})`
    border : ${({theme}) => `1px dashed ${theme.colors2.gray.gray5}`};
    color : ${({theme}) => theme.colors2.gray.gray3};
`

export const Kbd = styled.kbd.attrs({
    className : `Kbd inline-flex items-center justify-center rounded-[6px] px-[6px] min-w-[20px] h-[20px] text-[11px]` as string
})`
    font-family : ${({theme}) => theme.fonts.mono};
    color : ${({theme}) => theme.colors2.gray.gray3};
    background : ${({theme}) => theme.colors.background.light.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const TextInput = styled.input.attrs({
    className : `TextInput w-full h-[44px] rounded-[9px] px-4 text-[14px] outline-none` as string
})`
    color : ${({theme}) => theme.colors.main.primary};
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    transition : border-color ${({theme}) => theme.motion.hover} ease, box-shadow ${({theme}) => theme.motion.hover} ease;
    &::placeholder { color : ${({theme}) => theme.colors2.gray.gray4}; }
    &:focus {
        border-color : ${({theme}) => theme.colors2.brand.blue};
        box-shadow : 0 0 0 3px rgba(0, 145, 255, 0.12);
    }
`

export const Label = styled.label.attrs({
    className : `Label flex flex-col gap-2 text-[13px] font-semibold w-full` as string
})`
    color : ${({theme}) => theme.colors.main.primary};
`
