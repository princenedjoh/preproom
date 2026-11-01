import styled from "styled-components";

export const Main = styled.footer.attrs({
   className : ` Main w-full flex justify-center px-4 md:px-6 bottom-0`
})<{rigid? : boolean}>
`
    color : ${({theme}) => theme.colors2.gray.gray3};
    background : ${({theme}) => theme.colors.background.light.white};
    border-top : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    position : ${({rigid}) => rigid? `absolute` : 'static'};
`

export const MainWrap = styled.div.attrs({
    className : ` MainWrap w-full max-w-[1200px] flex flex-col gap-12 pt-14 pb-8`
 })``

export const Columns = styled.div.attrs({
    className : ` Columns grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10`
 })``

export const Brand = styled.div.attrs({
    className : ` Brand col-span-2 md:col-span-1 flex flex-col items-start gap-4 max-w-[300px]`
 })``

export const Column = styled.div.attrs({
    className : ` Column flex flex-col gap-3`
 })``

export const ColumnTitle = styled.span.attrs({
    className : ` ColumnTitle uppercase text-[10px] mb-1`
 })`
    font-family : ${({theme}) => theme.fonts.mono};
    letter-spacing : 0.08em;
    color : ${({theme}) => theme.colors2.gray.gray4};
 `

export const FooterLink = styled.button.attrs({
    className : ` FooterLink text-left text-[14px] w-fit`
 })`
    color : ${({theme}) => theme.colors2.gray.gray3};
    transition : color ${({theme}) => theme.motion.hover} ease;
    &:hover { color : ${({theme}) => theme.colors.main.primary}; }
 `

export const Bottom = styled.div.attrs({
    className : ` Bottom flex flex-col-reverse sm:flex-row gap-4 sm:items-center justify-between pt-6 text-[13px]`
 })`
    border-top : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
 `

export const Socials = styled.div.attrs({
   className : ` socials flex gap-1`
})``

export const Rights = styled.div.attrs({
   className : ` Rights `
})`
    color : ${({theme}) => theme.colors2.gray.gray4};
`

export const LogoIcon = styled.img.attrs({
   className : ` LogoIcon w-[110px] cursor-pointer`
})``
