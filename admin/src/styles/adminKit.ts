import styled from "styled-components";
import { Difficulty } from "../data/sample";

// Admin-only primitives layered on the shared kit (kit.ts mirrors the user app).

export const Screen = styled.main.attrs({
    className : `Screen w-full max-w-[1200px] mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-20 flex flex-col gap-6` as string
})``

export const ScreenHeader = styled.div.attrs({
    className : `ScreenHeader flex flex-wrap items-end justify-between gap-4` as string
})``

export const ScreenTitle = styled.h1.attrs({
    className : `ScreenTitle text-[26px] md:text-[30px] leading-[1.15]` as string
})`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 700;
    letter-spacing : -0.035em;
    color : ${({theme}) => theme.colors2.brand.onyx};
`

export const ScreenLead = styled.p.attrs({
    className : `ScreenLead text-[14px] leading-[1.55] mt-1 max-w-[560px]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray3};
`

export const Toolbar = styled.div.attrs({
    className : `Toolbar flex flex-wrap items-center gap-2` as string
})``

export const SearchField = styled.label.attrs({
    className : `SearchField flex items-center gap-2 h-[36px] rounded-full px-3 w-full sm:w-[260px]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray4};
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    transition : border-color ${({theme}) => theme.motion.hover} ease, box-shadow ${({theme}) => theme.motion.hover} ease;
    &:focus-within {
        border-color : ${({theme}) => theme.colors2.brand.blue};
        box-shadow : 0 0 0 3px rgba(0, 145, 255, 0.12);
    }
    input {
        width : 100%;
        outline : none;
        font-size : 13px;
        background : transparent;
        color : ${({theme}) => theme.colors.main.primary};
    }
    input::placeholder { color : ${({theme}) => theme.colors2.gray.gray4}; }
`

export const Select = styled.select.attrs({
    className : `Select h-[36px] rounded-full pl-3 pr-8 text-[13px] font-semibold outline-none cursor-pointer appearance-none` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray2};
    background : ${({theme}) => theme.colors.background.light.white} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23838383' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 12px center;
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const IconButton = styled.button.attrs({
    className : `IconButton relative inline-flex items-center justify-center w-[34px] h-[34px] rounded-full shrink-0` as string
})<{danger? : boolean}>`
    color : ${({theme}) => theme.colors2.gray.gray3};
    transition : background ${({theme}) => theme.motion.hover} ease, color ${({theme}) => theme.motion.hover} ease;
    &:hover {
        background : ${({danger}) => danger ? 'rgba(240, 69, 122, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
        color : ${({theme, danger}) => danger ? theme.colors2.red.red2 : theme.colors.main.primary};
    }
`

export const CountBadge = styled.span.attrs({
    className : `CountBadge inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-[5px] text-[10px] font-bold leading-none` as string
})<{tone? : 'ink' | 'red'}>`
    color : ${({theme}) => theme.colors.text.light.white};
    background : ${({theme, tone}) => tone === 'red' ? theme.colors2.red.red3 : theme.colors.main.primary};
`

export const DifficultyPill = styled.span.attrs({
    className : `DifficultyPill inline-flex items-center rounded-full whitespace-nowrap text-[11px] font-semibold px-[9px] py-[2px]` as string
})<{level : Difficulty}>`
    color : ${({theme, level}) => ({ Easy : theme.colors2.green.green1, Medium : theme.colors2.orange.orange1, Hard : theme.colors2.red.red1 })[level]};
    background : ${({theme, level}) => ({ Easy : theme.colors2.green.green5, Medium : theme.colors2.orange.orange5, Hard : theme.colors2.red.red5 })[level]};
`

export const CourseDot = styled.span.attrs({
    className : `CourseDot inline-block w-2 h-2 rounded-full shrink-0` as string
})<{color : string}>`
    background : ${({color}) => color};
`

/* Tables */

export const TableWrap = styled.div.attrs({
    className : `TableWrap w-full rounded-[12px] overflow-x-auto` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Table = styled.table.attrs({
    className : `Table w-full text-left border-collapse` as string
})``

export const Th = styled.th.attrs({
    className : `Th uppercase text-[10px] font-medium px-4 py-[10px] whitespace-nowrap` as string
})`
    font-family : ${({theme}) => theme.fonts.mono};
    letter-spacing : 0.08em;
    color : ${({theme}) => theme.colors2.gray.gray4};
    background : ${({theme}) => theme.colors.background.light.primary};
    border-bottom : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Td = styled.td.attrs({
    className : `Td text-[14px] px-4 py-3 align-middle` as string
})`
    color : ${({theme}) => theme.colors.main.primary};
`

export const Tr = styled.tr.attrs({
    className : `Tr` as string
})<{clickable? : boolean}>`
    cursor : ${({clickable}) => clickable ? 'pointer' : 'default'};
    transition : background ${({theme}) => theme.motion.hover} ease;
    & + & td { border-top : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`}; }
    &:hover { background : ${({theme}) => theme.colors.background.light.primary}; }
`

export const Muted = styled.span.attrs({
    className : `Muted text-[13px]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray3};
`

export const Mono = styled.span.attrs({
    className : `Mono text-[12px]` as string
})`
    font-family : ${({theme}) => theme.fonts.mono};
    color : ${({theme}) => theme.colors2.gray.gray3};
`
