import styled, { css } from "styled-components";
import { Difficulty } from "../data/sample";
import { pressable, PrimaryButton, Tag, Tone } from "./kit";
import { toneOf, toneVar } from "./tone";

// Admin-only primitives layered on the shared kit. Notion's database views are
// the reference: hairline tables, plain headers, small rectangular tags.

export const Screen = styled.main.attrs({
    className : `Screen w-full max-w-[1200px] mx-auto px-4 md:px-10 pt-6 md:pt-10 pb-24 flex flex-col gap-6` as string
})``

export const ScreenHeader = styled.div.attrs({
    className : `ScreenHeader flex flex-wrap items-end justify-between gap-4` as string
})``

export const ScreenTitle = styled.h1.attrs({
    className : `ScreenTitle text-[28px] md:text-[32px] leading-[1.15] font-bold` as string
})`
    letter-spacing : -0.025em;
    color : ${({theme}) => theme.color.ink};
`

export const ScreenLead = styled.p.attrs({
    className : `ScreenLead text-[14px] leading-[1.55] mt-[6px] max-w-[580px]` as string
})`
    color : ${({theme}) => theme.color.ink2};
`

export const Toolbar = styled.div.attrs({
    className : `Toolbar flex flex-wrap items-center gap-2` as string
})``

const field = css`
    height : 32px;
    border-radius : ${({theme}) => theme.radius.md};
    font-size : 13px;
    color : ${({theme}) => theme.color.ink};
    background : ${({theme}) => theme.color.surface};
    border : 1px solid ${({theme}) => theme.color.line};
    transition : border-color ${({theme}) => theme.motion.hover} ease, box-shadow ${({theme}) => theme.motion.hover} ease, background ${({theme}) => theme.motion.hover} ease;
`

export const SearchField = styled.label.attrs({
    className : `SearchField flex items-center gap-2 px-[10px] w-full sm:w-[260px]` as string
})`
    ${field}
    color : ${({theme}) => theme.color.ink3};
    &:focus-within {
        border-color : ${({theme}) => theme.color.accent};
        box-shadow : 0 0 0 3px ${({theme}) => theme.color.ring};
    }
    input {
        width : 100%;
        outline : none;
        font-size : 13px;
        background : transparent;
        color : ${({theme}) => theme.color.ink};
    }
    input::placeholder { color : ${({theme}) => theme.color.ink4}; }
`

// Native select; the chevron is drawn with currentColor so it follows the theme
export const Select = styled.select.attrs({
    className : `Select pl-[10px] pr-8 font-medium outline-none cursor-pointer appearance-none` as string
})`
    ${field}
    color : ${({theme}) => theme.color.ink2};
    background-image : url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat : no-repeat;
    background-position : right 10px center;
    &:focus-visible { border-color : ${({theme}) => theme.color.accent}; box-shadow : 0 0 0 3px ${({theme}) => theme.color.ring}; }
    @media (hover : hover) and (pointer : fine) { &:hover { background-color : ${({theme}) => theme.color.subtle}; } }
    option { background : ${({theme}) => theme.color.surface}; color : ${({theme}) => theme.color.ink}; }
`

export const IconButton = styled.button.attrs({
    className : `IconButton relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-md shrink-0` as string
})<{danger? : boolean}>`
    color : ${({theme}) => theme.color.ink3};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover:not(:disabled) {
            background : ${({theme, danger}) => danger ? theme.color.tag.redBg : theme.color.hover};
            color : ${({theme, danger}) => danger ? theme.color.tag.red : theme.color.ink};
        }
    }
`

export const CountBadge = styled.span.attrs({
    className : `CountBadge inline-flex items-center justify-center rounded-[4px] min-w-[18px] h-[18px] px-[5px] text-[11px] font-semibold leading-none tabular-nums` as string
})<{tone? : 'ink' | 'red'}>`
    color : ${({theme, tone}) => tone === 'red' ? theme.color.tag.red : theme.color.ink3};
    background : ${({theme, tone}) => tone === 'red' ? theme.color.tag.redBg : theme.color.subtle};
`

export const difficultyTone : Record<Difficulty, Tone> = { Easy : 'green', Medium : 'orange', Hard : 'red' }

export const DifficultyPill = styled(Tag).attrs<{level : Difficulty}>(({level}) => ({ tone : difficultyTone[level] }))<{level : Difficulty}>``

// Destructive confirm (delete / remove) — only ever inside a confirmation dialog
export const DangerButton = styled(PrimaryButton)`
    background : ${({theme}) => theme.color.tag.red};
    box-shadow : none;
    @media (hover : hover) and (pointer : fine) { &:hover:not(:disabled) { background : ${({theme}) => theme.color.tag.red}; filter : brightness(1.08); } }
`

export const CourseDot = styled.span.attrs({
    className : `CourseDot inline-block w-2 h-2 rounded-[2px] shrink-0` as string
})<{color : string}>`
    background : ${({color}) => toneVar(toneOf(color, color))};
`

/* Tables: hairline rows on a surface, quiet headers */

export const TableWrap = styled.div.attrs({
    className : `TableWrap w-full rounded-lg overflow-x-auto` as string
})`
    background : ${({theme}) => theme.color.surface};
    border : 1px solid ${({theme}) => theme.color.line};
`

export const Table = styled.table.attrs({
    className : `Table w-full text-left border-collapse` as string
})``

export const Th = styled.th.attrs({
    className : `Th text-[12px] font-medium px-4 h-[36px] whitespace-nowrap` as string
})`
    color : ${({theme}) => theme.color.ink3};
    border-bottom : 1px solid ${({theme}) => theme.color.line};
`

export const Td = styled.td.attrs({
    className : `Td text-[14px] px-4 py-[10px] align-middle` as string
})`
    color : ${({theme}) => theme.color.ink};
`

export const Tr = styled.tr.attrs({
    className : `Tr` as string
})<{clickable? : boolean}>`
    cursor : ${({clickable}) => clickable ? 'pointer' : 'default'};
    transition : background ${({theme}) => theme.motion.hover} ease;
    & + & td { border-top : 1px solid ${({theme}) => theme.color.line}; }
    @media (hover : hover) and (pointer : fine) { &:hover { background : ${({theme}) => theme.color.hover}; } }
`

export const Muted = styled.span.attrs({
    className : `Muted text-[13px]` as string
})`
    color : ${({theme}) => theme.color.ink3};
`

export const Mono = styled.span.attrs({
    className : `Mono text-[12px] tabular-nums` as string
})`
    color : ${({theme}) => theme.color.ink3};
`

// Flag issue types each get one tag colour, used on Overview and Flags
export const issueTone = (issue : string) : Tone => ({
    'Wrong answer' : 'red',
    'Typo' : 'gray',
    'Unclear question' : 'orange',
    'Duplicate' : 'purple',
    'Missing explanation' : 'blue',
} as Record<string, Tone>)[issue] ?? 'gray'
