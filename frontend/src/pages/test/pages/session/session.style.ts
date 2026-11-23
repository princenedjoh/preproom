import styled from "styled-components";
import { color } from "../../../../styles/theme";

export const Bar = styled.div.attrs({
   className : `Bar fixed top-0 left-0 w-full z-20 flex justify-center px-3 md:px-6 h-[56px] backdrop-blur-xl` as string
})`
   background : ${color.alpha('canvas', 0.85)};
   border-bottom : 1px solid ${color.line};
`

export const Timer = styled.span.attrs({
   className : `Timer inline-flex items-center gap-2 rounded-md px-[10px] h-8 text-[14px] font-medium tabular-nums` as string
})<{low? : boolean}>`
   font-family : var(--font-mono);
   color : ${({low}) => low ? color.tag.red : color.ink};
   background : ${({low}) => low ? color.tag.redBg : color.subtle};
   transition : background 200ms ease, color 200ms ease;
`

export const Layout = styled.div.attrs({
   className : `Layout grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_248px] gap-6 items-start` as string
})``

export const NavGrid = styled.div.attrs({
   className : `NavGrid grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-[6px]` as string
})``

export type NavState = 'current' | 'answered' | 'flagged' | 'empty'

export const NavCell = styled.button.attrs({
   className : `NavCell h-9 rounded-md text-[13px] font-medium relative tabular-nums` as string
})<{state : NavState, flagged? : boolean, answered? : boolean}>`
   font-family : var(--font-mono);
   color : ${({answered}) => answered ? color.accent : color.ink3};
   background : ${({answered}) => answered ? color.accentTint : 'transparent'};
   border : 1px solid ${({state, answered}) => state === 'current' ? color.ink : answered ? color.alpha('accent', 0.25) : color.line};
   box-shadow : ${({state}) => state === 'current' ? `inset 0 0 0 1px ${color.ink}` : 'none'};
   transition : background 120ms ease, border-color 120ms ease;
   &::after {
      content : '';
      display : ${({flagged}) => flagged ? 'block' : 'none'};
      position : absolute; top : 4px; right : 4px; width : 6px; height : 6px; border-radius : 9999px;
      background : ${color.tag.orange};
   }
   @media (hover : hover) and (pointer : fine) {
      &:hover { border-color : ${({state}) => state === 'current' ? color.ink : color.lineStrong}; }
   }
`

export const Legend = styled.span.attrs({
   className : `Legend inline-flex items-center gap-2 text-[12px]` as string
})`
   color : ${color.ink3};
`

export const Swatch = styled.span.attrs({
   className : `Swatch w-[10px] h-[10px] rounded-[3px] relative` as string
})<{kind : NavState}>`
   background : ${({kind}) => kind === 'answered' ? color.accentTint : kind === 'flagged' ? color.tag.orange : 'transparent'};
   border : 1px solid ${({kind}) => kind === 'answered' ? color.alpha('accent', 0.4) : kind === 'current' ? color.ink : kind === 'flagged' ? color.tag.orange : color.line};
   border-radius : ${({kind}) => kind === 'flagged' ? '9999px' : '3px'};
`
