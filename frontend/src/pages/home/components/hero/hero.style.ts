import styled from "styled-components";

export const Main = styled.div.attrs({
   className : ` Main w-full grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] 
   gap-14 lg:gap-12 items-center pt-12 md:pt-20 pb-16 md:pb-24`
})``

export const Copy = styled.div.attrs({
   className : ` Copy flex flex-col items-start gap-6`
})``

export const Announcement = styled.span.attrs({
   className : ` Announcement inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-[13px] font-medium`
})`
   color : ${({theme}) => theme.colors2.gray.gray3};
   border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Badge = styled.span.attrs({
   className : ` Badge rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase`
})`
   letter-spacing : 0.06em;
   color : ${({theme}) => theme.colors.text.light.white};
   background : ${({theme}) => theme.colors2.brand.violet};
`

export const Checks = styled.ul.attrs({
   className : ` Checks flex flex-col gap-[10px]`
})``

export const Check = styled.li.attrs({
   className : ` Check flex items-start gap-[10px] text-[15px] md:text-[16px] leading-[1.45]`
})`
   color : ${({theme}) => theme.colors2.gray.gray3};
   b { color : ${({theme}) => theme.colors.main.primary}; font-weight : 700; }
   svg { color : ${({theme}) => theme.colors2.brand.blue}; flex-shrink : 0; margin-top : 3px; }
`

export const Actions = styled.div.attrs({
   className : ` Actions flex flex-wrap items-center gap-3 pt-1`
})``

export const Tags = styled.div.attrs({
   className : ` Tags flex flex-wrap gap-2`
})``

export const Visual = styled.div.attrs({
   className : ` Visual w-full lg:pr-6`
})``
