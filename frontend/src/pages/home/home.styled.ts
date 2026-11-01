import styled from "styled-components";

export const Main = styled.div.attrs({
    className : `Main w-full flex flex-col items-center pt-[64px] overflow-x-clip` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
`

export * from '../../styles/kit'
