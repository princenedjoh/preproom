import styled from "styled-components";

export const Layout = styled.div.attrs({
   className : ` Layout grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start` as string
})``

export const Mode = styled.button.attrs({
   className : ` Mode flex flex-col items-start gap-2 rounded-[12px] p-5 text-left w-full` as string
})<{active? : boolean}>`
   background : ${({theme}) => theme.colors.background.light.white};
   border : ${({theme, active}) => `1px solid ${active ? theme.colors.main.primary : theme.colors.border.light.primary}`};
   box-shadow : ${({theme, active}) => active ? `inset 0 0 0 1px ${theme.colors.main.primary}` : 'none'};
   transition : border-color ${({theme}) => theme.motion.hover} ease;
   &:hover { border-color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray5}; }
`

export const Field = styled.div.attrs({
   className : ` Field flex flex-col items-start gap-2` as string
})``

export const FieldLabel = styled.span.attrs({
   className : ` FieldLabel text-[13px] font-semibold` as string
})`
   color : ${({theme}) => theme.colors.main.primary};
`

export const Summary = styled.div.attrs({
   className : ` Summary rounded-[12px] p-6 flex flex-col gap-5 lg:sticky lg:top-[88px]` as string
})`
   background : ${({theme}) => theme.colors.background.light.primary};
   border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const SummaryRow = styled.div.attrs({
   className : ` SummaryRow flex items-center justify-between text-[14px]` as string
})`
   color : ${({theme}) => theme.colors2.gray.gray3};
   b { color : ${({theme}) => theme.colors.main.primary}; font-weight : 600; }
`

export const Table = styled.div.attrs({
   className : ` Table w-full rounded-[12px] overflow-hidden` as string
})`
   border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const TableRow = styled.div.attrs({
   className : ` TableRow grid grid-cols-[1fr_auto] md:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_auto] items-center gap-4 px-5 py-4 text-[14px]` as string
})<{head? : boolean}>`
   color : ${({theme, head}) => head ? theme.colors2.gray.gray4 : theme.colors.main.primary};
   background : ${({theme, head}) => head ? theme.colors.background.light.primary : theme.colors.background.light.white};
   font-size : ${({head}) => head ? '12px' : '14px'};
   & + & { border-top : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`}; }
`
