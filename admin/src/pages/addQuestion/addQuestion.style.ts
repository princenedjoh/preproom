import styled from 'styled-components'

export const OptionRow = styled.div.attrs({
    className : `OptionRow flex items-start gap-2 rounded-[12px] p-[6px]` as string
})<{correct : boolean}>`
    background : ${({theme, correct}) => correct ? theme.colors2.green.green5 : 'transparent'};
    transition : background 150ms ease;
    > .rich-field { flex : 1; min-width : 0; }
    > .IconButton { margin-top : 5px; }
`

export const LetterButton = styled.button.attrs({
    className : `LetterButton shrink-0 inline-flex items-center justify-center w-[34px] h-[34px] mt-[5px] rounded-full text-[13px] font-bold` as string
})<{correct : boolean}>`
    font-family : ${({theme}) => theme.fonts.mono};
    color : ${({theme, correct}) => correct ? theme.colors.text.light.white : theme.colors2.gray.gray2};
    background : ${({theme, correct}) => correct ? theme.colors2.brand.emerald : theme.colors.background.light.white};
    border : ${({theme, correct}) => `1px solid ${correct ? theme.colors2.brand.emerald : theme.colors.border.light.primary}`};
    transition : background 150ms ease, border-color 150ms ease, color 150ms ease, transform 120ms ease;
    &:active { transform : scale(0.94); }
    @media (hover : hover) and (pointer : fine) {
        &:hover { border-color : ${({theme, correct}) => correct ? theme.colors2.brand.emerald : theme.colors.main.primary}; }
    }
`

export const SaveBar = styled.div.attrs({
    className : `SaveBar sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-[14px] px-4 py-3` as string
})`
    background : rgba(255, 255, 255, 0.92);
    backdrop-filter : saturate(180%) blur(12px);
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    box-shadow : ${({theme}) => theme.shadows.screenshot};
`

export const Preview = styled.div.attrs({
    className : `Preview rounded-[16px] p-5 flex flex-col gap-4` as string
})`
    background : ${({theme}) => theme.colors.background.light.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Chip = styled.span.attrs({
    className : `Chip inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[12px] font-semibold` as string
})`
    color : ${({theme}) => theme.colors.main.primary};
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const PreviewQuestion = styled.div.attrs({
    className : `PreviewQuestion text-[16px] leading-[1.5] break-words` as string
})`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 600;
    letter-spacing : -0.01em;
    color : ${({theme}) => theme.colors2.brand.onyx};
    img { max-width : 100%; border-radius : 8px; margin-top : 8px; }
`

export const PreviewOption = styled.div.attrs({
    className : `PreviewOption flex items-start gap-3 rounded-[10px] px-3 py-[10px] text-[14px]` as string
})<{correct : boolean}>`
    color : ${({theme}) => theme.colors.main.primary};
    background : ${({theme, correct}) => correct ? theme.colors2.green.green5 : theme.colors.background.light.white};
    border : ${({theme, correct}) => `1px solid ${correct ? theme.colors2.brand.mint : theme.colors.border.light.primary}`};
    transition : background 150ms ease, border-color 150ms ease;
`

export const PreviewLetter = styled.span.attrs({
    className : `PreviewLetter shrink-0 inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[11px] font-bold` as string
})<{correct : boolean}>`
    font-family : ${({theme}) => theme.fonts.mono};
    color : ${({theme, correct}) => correct ? theme.colors.text.light.white : theme.colors2.gray.gray3};
    background : ${({theme, correct}) => correct ? theme.colors2.brand.emerald : theme.colors.background.light.primary};
`

export const PreviewExplanation = styled.div.attrs({
    className : `PreviewExplanation flex flex-col gap-1 rounded-[10px] p-3 text-[13px] leading-[1.55]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray3};
    background : ${({theme}) => theme.colors.background.light.white};
    border-left : ${({theme}) => `3px solid ${theme.colors2.brand.blue}`};
`
