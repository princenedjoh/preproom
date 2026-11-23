import styled, { keyframes } from "styled-components";
import { pressable } from "../../styles/kit";
import { color } from "../../styles/theme";

const reveal = keyframes`
    from { opacity : 0; transform : translateY(-3px); }
    to { opacity : 1; transform : translateY(0); }
`

// A question reads like a printed exam paper: serif prompt, lettered options in one column,
// and the verdict shown as marks and a slim strip rather than colour-filled cards.
export const Card = styled.article.attrs({
    className : `Card rounded-lg px-5 pt-5 pb-3 md:px-7 md:pt-6 flex flex-col gap-5` as string
})`
    background : ${color.surface};
    border : 1px solid ${color.line};
    transition : border-color 120ms ease, box-shadow 120ms ease;
    outline : none;
    scroll-margin-top : 72px;
    &:focus-visible, &[data-focused='true'] {
        border-color : ${color.alpha('accent', 0.45)};
        box-shadow : 0 0 0 3px ${color.alpha('accent', 0.12)};
    }
`

export const Meta = styled.div.attrs({
    className : `Meta flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]` as string
})`
    color : ${color.ink3};
`

export const Number = styled.span.attrs({
    className : `Number text-[12px] font-medium` as string
})`
    font-family : var(--font-mono);
    color : ${color.ink3};
`

export const Prompt = styled.div.attrs({
    className : `Prompt text-[16px] md:text-[17px] leading-[1.6]` as string
})`
    font-weight : 400;
    color : ${color.ink};
    text-wrap : pretty;
    sup, sub { line-height : 0; }
`

export const Options = styled.div.attrs({
    className : `Options flex flex-col gap-[6px]` as string
})``

export type OptionState = 'idle' | 'correct' | 'wrong' | 'muted'

export const Option = styled.button.attrs({
    className : `Option group/option flex items-center gap-3 rounded-md pl-2 pr-3 min-h-[44px] py-2 text-left text-[15px] leading-[1.45]` as string
})<{state : OptionState}>`
    color : ${({state}) => state === 'muted' ? color.ink3 : color.ink};
    background : ${({state}) => state === 'correct' ? color.alpha('tag-green-bg', 0.55) : state === 'wrong' ? color.alpha('tag-red-bg', 0.55) : 'transparent'};
    border : 1px solid ${({state}) => state === 'correct' ? color.alpha('tag-green', 0.35) : state === 'wrong' ? color.alpha('tag-red', 0.35) : color.line};
    cursor : ${({state}) => state === 'idle' ? 'pointer' : 'default'};
    ${pressable}
    &:active:not(:disabled) { transform : ${({state}) => state === 'idle' ? 'scale(0.99)' : 'none'}; }
    @media (hover : hover) and (pointer : fine) {
        &:hover {
            background : ${({state}) => state === 'idle' ? color.hover : undefined};
            border-color : ${({state}) => state === 'idle' ? color.lineStrong : undefined};
        }
    }
    .mark { margin-left : auto; flex-shrink : 0; }
`

export const OptionKey = styled.span.attrs({
    className : `OptionKey w-[26px] h-[26px] rounded-[6px] inline-flex items-center justify-center text-[12px] font-medium shrink-0` as string
})<{state : OptionState}>`
    font-family : var(--font-mono);
    color : ${({state}) => state === 'correct' ? color.tag.green : state === 'wrong' ? color.tag.red : color.ink3};
    background : ${({state}) => state === 'correct' || state === 'wrong' ? color.surface : color.subtle};
    transition : background 120ms ease, color 120ms ease;
`

export const Verdict = styled.div.attrs({
    className : `Verdict flex flex-wrap items-center gap-x-5 gap-y-1 pl-3 py-[2px] text-[13px]` as string
})<{correct : boolean | null}>`
    border-left : 2px solid ${({correct}) => correct === null ? color.ink4 : correct ? color.tag.green : color.tag.red};
    color : ${color.ink3};
    animation : ${reveal} 200ms var(--ease-out);
    b { font-weight : 600; color : ${({correct}) => correct === null ? color.ink : correct ? color.tag.green : color.tag.red}; font-size : 14px; }
    strong { font-weight : 600; color : ${color.ink}; }
    @media (prefers-reduced-motion : reduce) { animation : none; }
`

export const Explanation = styled.div.attrs({
    className : `Explanation rounded-md px-4 py-3 flex flex-col gap-1 text-[14px] leading-[1.6]` as string
})`
    color : ${color.ink2};
    background : ${color.subtle};
    animation : ${reveal} 200ms var(--ease-out);
    .label { font-size : 12px; font-weight : 500; color : ${color.ink3}; }
    @media (prefers-reduced-motion : reduce) { animation : none; }
`

export const Footer = styled.div.attrs({
    className : `Footer flex flex-wrap items-center justify-between gap-2 border-t pt-2` as string
})`
    border-color : ${color.line};
`

export const Action = styled.button.attrs({
    className : `Action inline-flex items-center gap-[6px] rounded-md px-2 h-8 text-[13px] font-medium` as string
})<{active? : boolean}>`
    color : ${({active}) => active ? color.accent : color.ink3};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover:not(:disabled) {
            color : ${({active}) => active ? color.accent : color.ink};
            background : ${color.hover};
        }
    }
`
