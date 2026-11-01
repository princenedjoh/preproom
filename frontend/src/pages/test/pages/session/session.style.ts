import styled from "styled-components";

export const Bar = styled.div.attrs({
   className : ` Bar fixed top-[64px] left-0 w-full z-10 flex justify-center px-4 md:px-6 h-[56px]` as string
})`
   background : ${({theme}) => `${theme.colors.background.light.white}e6`};
   backdrop-filter : blur(12px);
   border-bottom : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Timer = styled.span.attrs({
   className : ` Timer inline-flex items-center gap-2 rounded-full px-3 py-[6px] text-[14px] font-semibold tabular-nums` as string
})<{low? : boolean}>`
   font-family : ${({theme}) => theme.fonts.mono};
   color : ${({theme, low}) => low ? theme.colors2.red.red2 : theme.colors.main.primary};
   background : ${({theme, low}) => low ? theme.colors2.red.red5 : theme.colors.background.light.primary};
   border : ${({theme, low}) => `1px solid ${low ? theme.colors2.red.red4 : theme.colors.border.light.primary}`};
`

export const Layout = styled.div.attrs({
   className : ` Layout grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start` as string
})``

export const NavGrid = styled.div.attrs({
   className : ` NavGrid grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-5 gap-2` as string
})``

export type NavState = 'current' | 'answered' | 'flagged' | 'empty'

export const NavCell = styled.button.attrs({
   className : ` NavCell h-[38px] rounded-[9px] text-[13px] font-semibold relative` as string
})<{state : NavState}>`
   font-family : ${({theme}) => theme.fonts.mono};
   color : ${({theme, state}) => state === 'answered' ? theme.colors.text.light.white : theme.colors.main.primary};
   background : ${({theme, state}) => state === 'answered' ? theme.colors.main.primary : theme.colors.background.light.white};
   border : ${({theme, state}) => state === 'current' ? `2px solid ${theme.colors2.brand.blue}`
      : state === 'flagged' ? `2px solid ${theme.colors2.brand.violet}` : `1px solid ${theme.colors.border.light.primary}`};
   transition : background ${({theme}) => theme.motion.hover} ease;
   &:hover { background : ${({theme, state}) => state === 'answered' ? theme.colors2.gray.gray2 : theme.colors.background.light.primary}; }
`

export const Legend = styled.span.attrs({
   className : ` Legend inline-flex items-center gap-2 text-[12px]` as string
})`
   color : ${({theme}) => theme.colors2.gray.gray3};
`

export const Swatch = styled.span.attrs({
   className : ` Swatch w-[12px] h-[12px] rounded-[4px]` as string
})<{kind : NavState}>`
   background : ${({theme, kind}) => kind === 'answered' ? theme.colors.main.primary : theme.colors.background.light.white};
   border : ${({theme, kind}) => kind === 'current' ? `2px solid ${theme.colors2.brand.blue}`
      : kind === 'flagged' ? `2px solid ${theme.colors2.brand.violet}` : `1px solid ${theme.colors.border.light.primary}`};
`
