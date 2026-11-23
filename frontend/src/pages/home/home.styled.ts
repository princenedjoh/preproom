import styled from "styled-components";

export const Main = styled.div.attrs({
    className : `Main w-full flex flex-col items-center pt-[64px] overflow-x-clip` as string
})`
    background : ${({theme}) => theme.color.canvas};
`

export * from '../../styles/kit'
