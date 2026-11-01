import styled from "styled-components";

export const Card = styled.article.attrs({
    className : ` Card rounded-[12px] p-5 md:p-6 flex flex-col gap-4` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    transition : border-color ${({theme}) => theme.motion.hover} ease;
    &:hover { border-color : ${({theme}) => theme.colors2.gray.gray5}; }
`

export const Meta = styled.div.attrs({
    className : ` Meta flex flex-wrap items-center gap-2 text-[12px]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray4};
`

export const Number = styled.span.attrs({
    className : ` Number text-[12px] mr-1` as string
})`
    font-family : ${({theme}) => theme.fonts.mono};
    color : ${({theme}) => theme.colors2.gray.gray4};
`

export const Prompt = styled.div.attrs({
    className : ` Prompt text-[16px] md:text-[17px] leading-[1.5] font-semibold` as string
})`
    letter-spacing : -0.01em;
    color : ${({theme}) => theme.colors.main.primary};
`

export const Options = styled.div.attrs({
    className : ` Options grid grid-cols-1 sm:grid-cols-2 gap-2` as string
})``

export type OptionState = 'idle' | 'correct' | 'wrong' | 'muted'

export const Option = styled.button.attrs({
    className : ` Option flex items-center gap-3 rounded-[9px] px-3 py-[10px] text-left text-[14px]` as string
})<{state : OptionState}>`
    color : ${({theme, state}) => state === 'muted' ? theme.colors2.gray.gray4 : theme.colors.main.primary};
    background : ${({theme, state}) => ({
        idle : theme.colors.background.light.white,
        correct : theme.colors2.green.green5,
        wrong : theme.colors2.red.red5,
        muted : theme.colors.background.light.primary,
    })[state]};
    border : ${({theme, state}) => `1px solid ${({
        idle : theme.colors.border.light.primary,
        correct : theme.colors2.brand.mint,
        wrong : theme.colors2.red.red4,
        muted : theme.colors.border.light.primary,
    })[state]}`};
    cursor : ${({state}) => state === 'idle' ? 'pointer' : 'default'};
    transition : background ${({theme}) => theme.motion.hover} ease, border-color ${({theme}) => theme.motion.hover} ease;
    &:hover {
        border-color : ${({theme, state}) => state === 'idle' ? theme.colors2.gray.gray5 : undefined};
        background : ${({theme, state}) => state === 'idle' ? theme.colors.background.light.primary : undefined};
    }
`

export const OptionKey = styled.span.attrs({
    className : ` OptionKey w-[24px] h-[24px] rounded-full inline-flex items-center justify-center text-[11px] font-bold shrink-0` as string
})<{state : OptionState}>`
    color : ${({theme, state}) => state === 'correct' || state === 'wrong' ? theme.colors.text.light.white : theme.colors2.gray.gray3};
    background : ${({theme, state}) => state === 'correct' ? theme.colors2.brand.emerald
        : state === 'wrong' ? theme.colors2.red.red3 : theme.colors.background.light.white};
    border : ${({theme, state}) => state === 'correct' || state === 'wrong' ? 'none' : `1px solid ${theme.colors.border.light.primary}`};
`

export const Explanation = styled.div.attrs({
    className : ` Explanation rounded-[9px] p-4 flex flex-col gap-1 text-[14px] leading-[1.55]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray3};
    background : ${({theme}) => theme.colors.background.light.primary};
    b { color : ${({theme}) => theme.colors.main.primary}; }
`

export const Footer = styled.div.attrs({
    className : ` Footer flex flex-wrap items-center justify-between gap-2 pt-1` as string
})``

export const Action = styled.button.attrs({
    className : ` Action inline-flex items-center gap-[6px] rounded-full px-3 py-[6px] text-[13px] font-semibold` as string
})<{active? : boolean}>`
    color : ${({theme, active}) => active ? theme.colors2.brand.violet : theme.colors2.gray.gray3};
    transition : background ${({theme}) => theme.motion.hover} ease, color ${({theme}) => theme.motion.hover} ease;
    &:hover {
        color : ${({theme, active}) => active ? theme.colors2.brand.violet : theme.colors.main.primary};
        background : rgba(0, 0, 0, 0.04);
    }
`
