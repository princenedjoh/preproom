import styled from "styled-components";

export const Main = styled.div.attrs({
    className : ` Main w-full min-h-screen flex items-center flex-col pt-[128px] pb-16 px-4 gap-6`
})`
    color : ${({theme}) => theme.colors.text.dark.primary};
    background : ${({theme}) => theme.colors.background.light.white};
`

export const Container = styled.form.attrs({
   className : ` Container flex flex-col w-full max-w-[360px] gap-3 items-center`
})``

export const Head = styled.div.attrs({
   className : ` Head flex flex-col w-full max-w-[360px] items-center gap-3 text-center`
})``

export const Avatar = styled.img.attrs({
    className : ` Avatar w-[44px] mb-2`
 })``

 export const Title = styled.h1.attrs({
    className : ` Title text-[34px] leading-[1.15]`
 })`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 700;
    letter-spacing : -0.035em;
    color : ${({theme}) => theme.colors2.brand.onyx};
 `

 export const Subtitle = styled.p.attrs({
    className : ` Subtitle text-[15px]`
 })`
    color : ${({theme}) => theme.colors2.gray.gray3};
 `
 
 export const HaveAnAccount = styled.div.attrs({
    className : ` HaveAnAccount w-full max-w-[360px] h-[52px] flex gap-1
    rounded-[12px] text-[14px] justify-center items-center`
 })`
     color : ${({theme}) => theme.colors2.gray.gray3};
     border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
 `

 export const Link = styled.div.attrs({
    className : ` Link font-bold cursor-pointer hover:underline`
 })`
   color : ${({theme}) => theme.colors2.brand.blue};
 `

 export const Terms = styled.div.attrs({
    className : ` Terms cursor-pointer flex gap-5 w-full max-w-[360px] justify-center text-[13px]`
 })`
    color : ${({theme}) => theme.colors2.gray.gray4};
    a:hover { color : ${({theme}) => theme.colors.main.primary}; }
 `

 export const InputContainer = styled.div.attrs({
    className : ` InputContainer w-full h-[44px] rounded-[9px]
    flex items-center px-[15px] py-[5px] text-[14px]`
 })`
   background : ${({theme}) => theme.colors.background.light.primary};
 `

 export const Submit = styled.button.attrs({
   className : ` Submit w-full h-[44px] rounded-full mt-2
   flex items-center px-[15px] text-[14px] justify-center
   cursor-pointer font-bold hover:opacity-[0.85] gap-2`
})`
  color : ${({theme}) => theme.colors.text.light.white};
  background : ${({theme}) => theme.colors.main.primary} !important;
  transition : opacity ${({theme}) => theme.motion.hover} ease;
`

 export const InputFlex = styled.div.attrs({
   className : ` InputFlex flex justify-between w-full`
})``

export const InputValue = styled.input.attrs({
   className : ` InputValue outline-none w-full`
})`
   background : ${({theme}) => theme.colors.background.light.primary};
`

export const InputFlexLeft = styled.div.attrs({
   className : ` InputFlexLeft flex gap-2 h-full items-center w-full`
})``

export const InputFlexRight = styled.div.attrs({
   className : ` InputFlexRight `
})``

export const NameHere = styled.div.attrs({
   className : ` NameHere `
})``
