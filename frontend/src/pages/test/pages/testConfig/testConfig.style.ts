import styled from "styled-components";
import { pressable } from "../../../../styles/kit";
import { color } from "../../../../styles/theme";

export const Layout = styled.div.attrs({
   className : `Layout grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start` as string
})``

export const Mode = styled.button.attrs({
   className : `Mode relative overflow-hidden flex flex-col items-start gap-2 rounded-xl p-5 text-left w-full` as string
})<{active? : boolean}>`
   background : ${color.surface};
   border : 1px solid ${({active}) => active ? color.alpha('accent', 0.55) : color.line};
   box-shadow : ${({active}) => active ? `var(--card), 0 0 0 1px ${color.alpha('accent', 0.25)}` : 'var(--card)'};
   ${pressable}
   &:active:not(:disabled) { transform : scale(0.985); }
   @media (hover : hover) and (pointer : fine) {
      &:hover { border-color : ${({active}) => active ? color.alpha('accent', 0.6) : color.lineStrong}; }
   }
`

// Settings read as a property list: label on the left, control on the right
export const Field = styled.div.attrs({
   className : `Field grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] items-start sm:items-center gap-2 sm:gap-4 py-3` as string
})`
   & + & { border-top : 1px solid ${color.line}; }
`

export const FieldLabel = styled.span.attrs({
   className : `FieldLabel text-[14px]` as string
})`
   color : ${color.ink3};
`

export const Summary = styled.div.attrs({
   className : `Summary rounded-xl p-5 flex flex-col gap-5 lg:sticky lg:top-[74px]` as string
})`
   background : ${color.surface};
   border : 1px solid ${color.line};
   box-shadow : var(--card);
`

export const SummaryRow = styled.div.attrs({
   className : `SummaryRow flex items-center justify-between text-[14px]` as string
})`
   color : ${color.ink3};
   b { color : ${color.ink}; font-weight : 500; }
`

export const Table = styled.div.attrs({
   className : `Table w-full rounded-xl overflow-hidden` as string
})`
   border : 1px solid ${color.line};
   background : ${color.surface};
   box-shadow : var(--card);
`

export const TableRow = styled.div.attrs({
   className : `TableRow grid grid-cols-[1fr_auto] md:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_auto] items-center gap-4 px-4 py-3 text-[14px]` as string
})<{head? : boolean}>`
   color : ${({head}) => head ? color.ink3 : color.ink};
   font-size : ${({head}) => head ? '12px' : '14px'};
   & + & { border-top : 1px solid ${color.line}; }
`
