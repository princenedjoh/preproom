import styled from "styled-components";

export const Window = styled.div.attrs({
   className : ` Window relative w-full rounded-[16px] overflow-hidden text-left`
})`
   background : ${({theme}) => theme.colors.background.light.white};
   border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
   box-shadow : ${({theme}) => theme.shadows.screenshot};
`

export const Chrome = styled.div.attrs({
   className : ` Chrome flex items-center gap-2 px-4 h-[36px]`
})`
   background : ${({theme}) => theme.colors.background.light.primary};
   border-bottom : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Dot = styled.span.attrs({
   className : ` Dot w-[9px] h-[9px] rounded-full`
})`
   background : ${({theme}) => theme.colors2.gray.gray5};
`

export const Address = styled.span.attrs({
   className : ` Address mx-auto text-[11px] px-3 py-[2px] rounded-full`
})`
   font-family : ${({theme}) => theme.fonts.mono};
   color : ${({theme}) => theme.colors2.gray.gray4};
   background : ${({theme}) => theme.colors.background.light.white};
   border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Sidebar = styled.div.attrs({
   className : ` Sidebar hidden sm:flex flex-col gap-1 w-[170px] shrink-0 p-3`
})`
   border-right : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const SideItem = styled.div.attrs({
   className : ` SideItem flex items-center gap-2 rounded-[8px] px-2 py-[6px] text-[12px]`
})<{active? : boolean}>`
   font-weight : ${({active}) => active ? 600 : 500};
   color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray3};
   background : ${({active}) => active ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
`

export const CourseDot = styled.span.attrs({
   className : ` CourseDot w-[8px] h-[8px] rounded-[3px] shrink-0`
})<{color : string}>`
   background : ${({color}) => color};
`

export const Row = styled.div.attrs({
   className : ` Row flex items-center gap-3 px-3 py-[9px] text-[12px]`
})`
   color : ${({theme}) => theme.colors.main.primary};
   border-bottom : ${({theme}) => `1px solid ${theme.colors2.gray.gray7}`};
`

export const Progress = styled.div.attrs({
   className : ` Progress h-[6px] w-full rounded-full overflow-hidden`
})`
   background : ${({theme}) => theme.colors2.gray.gray7};
`

export const ProgressFill = styled.div.attrs({
   className : ` ProgressFill h-full rounded-full`
})<{value : number}>`
   width : ${({value}) => value}%;
   background : ${({theme}) => theme.colors2.brand.emerald};
`

export const FloatingCard = styled.div.attrs({
   className : ` FloatingCard absolute hidden md:flex flex-col gap-2 w-[250px] p-4 rounded-[12px]
   right-4 xl:right-[-28px] bottom-[-64px] text-left`
})`
   background : ${({theme}) => theme.colors.background.light.white};
   border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
   box-shadow : ${({theme}) => theme.shadows.screenshot};
`

export const Option = styled.div.attrs({
   className : ` Option flex items-center gap-2 rounded-[8px] px-2 py-[6px] text-[12px]`
})<{correct? : boolean}>`
   color : ${({theme}) => theme.colors.main.primary};
   background : ${({theme, correct}) => correct ? theme.colors2.green.green5 : theme.colors.background.light.primary};
   border : ${({theme, correct}) => `1px solid ${correct ? theme.colors2.brand.mint : theme.colors.border.light.primary}`};
`

export const OptionKey = styled.span.attrs({
   className : ` OptionKey w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[10px] font-bold shrink-0`
})<{correct? : boolean}>`
   color : ${({theme, correct}) => correct ? theme.colors.text.light.white : theme.colors2.gray.gray3};
   background : ${({theme, correct}) => correct ? theme.colors2.brand.emerald : theme.colors.background.light.white};
   border : ${({theme, correct}) => correct ? 'none' : `1px solid ${theme.colors.border.light.primary}`};
`
