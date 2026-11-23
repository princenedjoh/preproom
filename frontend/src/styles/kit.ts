import styled, { css } from "styled-components";
import { color } from "./theme";

// Notion design language: warm paper canvas, hairline borders, one blue, quiet tags.
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
    &:focus-visible { outline : none; box-shadow : 0 0 0 3px ${color.ring}; }
    &:disabled { opacity : 0.4; cursor : not-allowed; }
`

const hover = (rules : string) => `
    @media (hover : hover) and (pointer : fine) {
        &:hover:not(:disabled) { ${rules} }
    }
`

export const Section = styled.section.attrs({
    className : `Section w-full flex justify-center px-4 md:px-6` as string
})<{band? : boolean}>`
    background : ${({band}) => band ? color.surface : 'transparent'};
`

export const Container = styled.div.attrs({
    className : `Container w-full max-w-[1200px]` as string
})``

/* Type */

export const Eyebrow = styled.span.attrs({
    className : `Eyebrow inline-flex items-center gap-[6px] text-[12px] md:text-[13px] font-medium` as string
})<{light? : boolean}>`
    color : ${({light}) => light ? color.onInverse : color.ink3};
    opacity : ${({light}) => light ? 0.6 : 1};
`

export const Display = styled.h1.attrs({
    className : `Display text-[44px] sm:text-[60px] lg:text-[72px] leading-[1.02]` as string
})`
    font-weight : 700;
    letter-spacing : -0.045em;
    color : ${color.ink};
    text-wrap : balance;
`

export const Heading = styled.h2.attrs({
    className : `Heading text-[30px] md:text-[42px] leading-[1.08]` as string
})<{light? : boolean}>`
    font-weight : 700;
    letter-spacing : -0.035em;
    color : ${({light}) => light ? color.onInverse : color.ink};
    text-wrap : balance;
`

export const Title = styled.h3.attrs({
    className : `Title text-[17px] leading-[1.35]` as string
})<{light? : boolean}>`
    font-weight : 600;
    letter-spacing : -0.012em;
    color : ${({light}) => light ? color.onInverse : color.ink};
`

export const Lead = styled.p.attrs({
    className : `Lead text-[16px] md:text-[18px] leading-[1.55]` as string
})<{light? : boolean}>`
    color : ${({light}) => light ? color.onInverse : color.ink2};
    opacity : ${({light}) => light ? 0.7 : 1};
    text-wrap : pretty;
`

export const Body = styled.p.attrs({
    className : `Body text-[14px] md:text-[15px] leading-[1.55]` as string
})<{light? : boolean}>`
    color : ${({light}) => light ? color.onInverse : color.ink2};
    text-wrap : pretty;
`

/* Buttons: 8px rounded rectangles. Primary is the single blue; the rest stay quiet. */

const buttonBase = `inline-flex items-center justify-center gap-2 rounded-md text-[14px] font-medium whitespace-nowrap h-9 px-4 select-none`

export const PrimaryButton = styled.button.attrs({
    className : `PrimaryButton ${buttonBase}` as string
})`
    color : ${color.onAccent};
    background : ${color.accent};
    box-shadow : var(--shadow-press);
    ${pressable}
    ${hover(`background : ${color.accentHover};`)}
`

// Historical name: every "dark" CTA is now the primary blue
export const DarkButton = PrimaryButton

export const SecondaryButton = styled.button.attrs({
    className : `SecondaryButton ${buttonBase}` as string
})`
    color : ${color.ink};
    background : ${color.surface};
    border : 1px solid ${color.lineStrong};
    ${pressable}
    ${hover(`background : ${color.subtle};`)}
`

export const LightButton = SecondaryButton

export const GhostButton = styled.button.attrs({
    className : `GhostButton ${buttonBase} !px-3` as string
})`
    color : ${color.ink2};
    background : transparent;
    ${pressable}
    ${hover(`background : ${color.hover}; color : ${color.ink};`)}
`

export const IconButton = styled.button.attrs({
    className : `IconButton inline-flex items-center justify-center rounded-md w-8 h-8 shrink-0` as string
})<{active? : boolean}>`
    color : ${({active}) => active ? color.ink : color.ink3};
    background : ${({active}) => active ? color.hover : 'transparent'};
    ${pressable}
    ${hover(`background : ${color.hover}; color : ${color.ink};`)}
`

/* Tags */

export type Tone = 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export const Tag = styled.span.attrs({
    className : `Tag inline-flex items-center gap-1 rounded-[4px] whitespace-nowrap text-[12px] font-medium leading-[20px] px-[6px]` as string
})<{tone? : Tone}>`
    color : ${({tone}) => color.tag[tone ?? 'gray']};
    background : ${({tone}) => color.tag[`${tone ?? 'gray'}Bg` as keyof typeof color.tag]};
`

const statusTone = { done : 'green', progress : 'orange', review : 'red', todo : 'gray' } as const

export const StatusPill = styled(Tag).attrs<{status : keyof typeof statusTone}>(({status}) => ({
    tone : statusTone[status],
}))<{status : keyof typeof statusTone}>``

export const TagPill = styled.span.attrs({
    className : `TagPill inline-flex items-center gap-[6px] rounded-md text-[13px] font-medium px-[10px] h-8` as string
})<{active? : boolean}>`
    color : ${({active}) => active ? color.accent : color.ink2};
    background : ${({active}) => active ? color.accentTint : color.subtle};
`

/* Surfaces */

export const Card = styled.div.attrs({
    className : `Card rounded-lg p-5 md:p-6 flex flex-col gap-3` as string
})`
    background : ${color.surface};
    border : 1px solid ${color.line};
`

export const IconTile = styled.span.attrs({
    className : `IconTile inline-flex items-center justify-center w-9 h-9 rounded-md shrink-0` as string
})<{light? : boolean, tone? : Tone}>`
    color : ${({tone}) => tone ? color.tag[tone] : color.ink2};
    background : ${({tone}) => tone ? color.tag[`${tone}Bg` as keyof typeof color.tag] : color.subtle};
`

export const Avatar = styled.span.attrs({
    className : `Avatar inline-flex items-center justify-center rounded-full shrink-0
    text-[10px] font-semibold` as string
})<{color : string, size? : number, ring? : string}>`
    width : ${({size}) => size ?? 24}px;
    height : ${({size}) => size ?? 24}px;
    color : #ffffff;
    background : ${(props) => props.color};
    box-shadow : 0 0 0 2px ${({ring}) => ring ?? color.surface};
    & + & { margin-left : -6px; }
`

export const TextLink = styled.button.attrs({
    className : `TextLink inline-flex items-center gap-1 text-[14px] font-medium w-fit` as string
})`
    color : ${color.accent};
    ${pressable}
    svg { transition : transform ${({theme}) => theme.motion.hover} ${({theme}) => theme.motion.easeOut}; }
    @media (hover : hover) and (pointer : fine) {
        &:hover svg { transform : translateX(2px); }
    }
`

/* App screens */

export const Page = styled.main.attrs({
    className : `Page w-full flex justify-center px-4 md:px-8 pt-6 md:pt-10 pb-20 md:pb-28 min-h-screen` as string
})<{band? : boolean}>``

export const PageInner = styled.div.attrs({
    className : `PageInner w-full max-w-[1080px] flex flex-col gap-8` as string
})``

export const PageTitle = styled.h1.attrs({
    className : `PageTitle text-[28px] md:text-[34px] leading-[1.15]` as string
})`
    font-weight : 700;
    letter-spacing : -0.03em;
    color : ${color.ink};
    text-wrap : balance;
`

export const Panel = styled.div.attrs({
    className : `Panel rounded-lg p-5 flex flex-col gap-4` as string
})`
    background : ${color.surface};
    border : 1px solid ${color.line};
`

export const PanelTitle = styled.div.attrs({
    className : `PanelTitle flex items-center gap-2 text-[13px] font-semibold` as string
})`
    color : ${color.ink};
    svg { color : ${color.ink3}; }
`

export const Segmented = styled.div.attrs({
    className : `Segmented inline-flex items-center gap-[2px] rounded-md p-[3px] max-w-full overflow-x-auto` as string
})`
    background : ${color.subtle};
`

export const SegmentedItem = styled.button.attrs({
    className : `SegmentedItem rounded-[6px] px-3 h-7 text-[13px] whitespace-nowrap` as string
})<{active? : boolean}>`
    font-weight : 500;
    color : ${({active}) => active ? color.ink : color.ink3};
    background : ${({active}) => active ? color.raised : 'transparent'};
    box-shadow : ${({active}) => active ? 'var(--shadow-press)' : 'none'};
    transition : background ${({theme}) => theme.motion.hover} ease, color ${({theme}) => theme.motion.hover} ease;
    &:hover { color : ${color.ink}; }
`

export const FilterChip = styled.button.attrs({
    className : `FilterChip inline-flex items-center gap-[6px] rounded-full px-3 h-8 text-[13px] font-medium whitespace-nowrap` as string
})<{active? : boolean}>`
    color : ${({active}) => active ? color.accent : color.ink2};
    background : ${({active}) => active ? color.accentTint : color.surface};
    border : 1px solid ${({active}) => active ? color.alpha('accent', 0.3) : color.line};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover { background : ${({active}) => active ? color.accentTint : color.subtle}; color : ${({active}) => active ? color.accent : color.ink}; }
    }
`

export const ProgressTrack = styled.div.attrs({
    className : `ProgressTrack w-full rounded-full overflow-hidden` as string
})<{height? : number}>`
    height : ${({height}) => height ?? 6}px;
    background : ${color.subtle};
`

export const ProgressFill = styled.div.attrs({
    className : `ProgressFill h-full rounded-full` as string
})<{value : number, color? : string}>`
    width : ${({value}) => Math.max(0, Math.min(100, value))}%;
    background : ${(props) => props.color ?? color.accent};
    transition : width 0.6s cubic-bezier(0.23, 1, 0.32, 1);
`

export const Stat = styled.div.attrs({
    className : `Stat flex flex-col gap-1 rounded-lg p-4 md:p-5` as string
})`
    background : ${color.surface};
    border : 1px solid ${color.line};
`

export const StatValue = styled.span.attrs({
    className : `StatValue text-[28px] leading-none` as string
})`
    font-weight : 650;
    letter-spacing : -0.035em;
    font-variant-numeric : tabular-nums;
    color : ${color.ink};
`

export const StatLabel = styled.span.attrs({
    className : `StatLabel text-[13px]` as string
})`
    color : ${color.ink3};
`

export const Empty = styled.div.attrs({
    className : `Empty flex flex-col items-center justify-center text-center gap-2 rounded-lg px-6 py-14` as string
})`
    border : 1px dashed ${color.lineStrong};
    color : ${color.ink3};
`

export const Kbd = styled.kbd.attrs({
    className : `Kbd inline-flex items-center justify-center rounded-[4px] px-[5px] min-w-[18px] h-[18px] text-[11px] font-medium` as string
})`
    font-family : var(--font-mono);
    color : ${color.ink3};
    background : ${color.surface};
    border : 1px solid ${color.line};
    border-bottom-width : 2px;
`

export const TextInput = styled.input.attrs({
    className : `TextInput w-full h-10 rounded-md px-3 text-[14px] outline-none` as string
})`
    color : ${color.ink};
    background : ${color.surface};
    border : 1px solid ${color.lineStrong};
    transition : border-color ${({theme}) => theme.motion.hover} ease, box-shadow ${({theme}) => theme.motion.hover} ease;
    &::placeholder { color : ${color.ink4}; }
    &:focus {
        border-color : ${color.accent};
        box-shadow : 0 0 0 3px ${color.alpha('accent', 0.15)};
    }
`

export const Label = styled.label.attrs({
    className : `Label flex flex-col gap-[6px] text-[13px] font-medium w-full` as string
})`
    color : ${color.ink2};
`

export const Divider = styled.hr.attrs({
    className : `Divider w-full border-0 h-px` as string
})`
    background : ${color.line};
`
