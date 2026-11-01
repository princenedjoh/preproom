import styled from "styled-components";

export const Layout = styled.div.attrs({
    className : `Layout grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start` as string
})``

export const Rail = styled.aside.attrs({
    className : `Rail flex flex-col gap-4 lg:sticky lg:top-[88px]` as string
})``

export const Toolbar = styled.div.attrs({
    className : `Toolbar flex flex-col gap-3` as string
})``

export const Search = styled.div.attrs({
    className : `Search relative w-full md:max-w-[360px]` as string
})`
    svg {
        position : absolute;
        left : 14px;
        top : 50%;
        transform : translateY(-50%);
        color : ${({theme}) => theme.colors2.gray.gray4};
    }
    input { padding-left : 38px; }
`

export const ChipRow = styled.div.attrs({
    className : `ChipRow flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap` as string
})`
    scrollbar-width : none;
    &::-webkit-scrollbar { display : none; }
`

export const SettingRow = styled.div.attrs({
    className : `SettingRow flex items-center justify-between gap-3 text-[14px]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray2};
`
