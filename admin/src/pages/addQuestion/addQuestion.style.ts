import styled from 'styled-components'
import { pressable } from '../../styles/kit'

export const OptionRow = styled.div.attrs({
    className : `OptionRow flex items-start gap-2 rounded-lg p-[6px]` as string
})<{correct : boolean}>`
    background : ${({theme, correct}) => correct ? theme.color.tag.greenBg : 'transparent'};
    transition : background 150ms ease;
    > .rich-field { flex : 1; min-width : 0; }
    > .IconButton { margin-top : 4px; }
`

export const LetterButton = styled.button.attrs({
    className : `LetterButton shrink-0 inline-flex items-center justify-center w-[32px] h-[32px] mt-[4px] rounded-md text-[13px] font-semibold` as string
})<{correct : boolean}>`
    color : ${({theme, correct}) => correct ? '#fff' : theme.color.ink2};
    background : ${({theme, correct}) => correct ? theme.color.tag.green : theme.color.surface};
    border : 1px solid ${({theme, correct}) => correct ? 'transparent' : theme.color.lineStrong};
    ${pressable}
    &:active:not(:disabled) { transform : scale(0.94); }
    @media (hover : hover) and (pointer : fine) {
        &:hover { border-color : ${({theme, correct}) => correct ? 'transparent' : theme.color.ink3}; }
    }
`

export const SaveBar = styled.div.attrs({
    className : `SaveBar sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-lg px-3 py-[10px]` as string
})`
    background : rgb(var(--surface) / 0.9);
    backdrop-filter : saturate(160%) blur(12px);
    -webkit-backdrop-filter : saturate(160%) blur(12px);
    box-shadow : ${({theme}) => theme.shadows.float};
`

export const Preview = styled.div.attrs({
    className : `Preview rounded-lg p-5 flex flex-col gap-4` as string
})`
    background : ${({theme}) => theme.color.surface};
    border : 1px solid ${({theme}) => theme.color.line};
    box-shadow : var(--card);
`

export const Chip = styled.span.attrs({
    className : `Chip inline-flex items-center gap-[6px] rounded-[4px] px-[6px] h-[22px] text-[12px] font-medium` as string
})`
    color : ${({theme}) => theme.color.ink2};
    background : ${({theme}) => theme.color.subtle};
`

export const PreviewQuestion = styled.div.attrs({
    className : `PreviewQuestion text-[16px] leading-[1.6] break-words` as string
})`
    font-weight : 500;
    color : ${({theme}) => theme.color.ink};
    img { max-width : 100%; border-radius : 8px; margin-top : 8px; }
`

export const PreviewOption = styled.div.attrs({
    className : `PreviewOption flex items-start gap-3 rounded-md px-3 py-[9px] text-[14px]` as string
})<{correct : boolean}>`
    color : ${({theme}) => theme.color.ink};
    background : ${({theme, correct}) => correct ? theme.color.tag.greenBg : theme.color.surface};
    border : 1px solid ${({theme, correct}) => correct ? 'transparent' : theme.color.line};
    transition : background 150ms ease, border-color 150ms ease;
`

export const PreviewLetter = styled.span.attrs({
    className : `PreviewLetter shrink-0 inline-flex items-center justify-center w-[22px] h-[22px] rounded-[5px] text-[12px] font-semibold` as string
})<{correct : boolean}>`
    color : ${({theme, correct}) => correct ? '#fff' : theme.color.ink3};
    background : ${({theme, correct}) => correct ? theme.color.tag.green : theme.color.subtle};
`

// Notion-style callout
export const PreviewExplanation = styled.div.attrs({
    className : `PreviewExplanation flex flex-col gap-1 rounded-md px-4 py-3 text-[14px] leading-[1.55]` as string
})`
    color : ${({theme}) => theme.color.ink2};
    background : ${({theme}) => theme.color.subtle};
`
