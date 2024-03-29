import styled from "styled-components";

export const Main = styled.div.attrs({
    className : `Main text-xs w-[100%] h-[70px]
    backdrop-filter backdrop-blur-sm flex justify-center items-center z-10`
})`
    color : ${({theme}) => theme.colors.text.dark.primary};
`

export const Outlet = styled.div.attrs({
    className : `realtive `
})``

export const Logo = styled.div.attrs({
    className : `Logo flex gap-1 mr-[120px] cursor-pointer`
})``

export const LogoText = styled.div.attrs({
    className : `LogoText font-bold text-sm`
})`
    color : ${({theme}) => theme.colors.main.primary};
`

export const LogoImg = styled.img.attrs({
    className : `LogoImg w-[25px]`
})``

export const Right = styled.div.attrs({
    className : `w-full flex justify-between h-full items-center`
})``

export const SearchBar = styled.div.attrs({
    className : `w-[400px] h-[30px] rounded-full flex justify-center items-center px-[15px] py-[6px]`
})`
     background : ${({theme}) => theme.colors.background.light.primary};
`

export const Naivgations = styled.div.attrs({
    className : `flex h-full items-center`
})``

export const Navigation = styled.div.attrs({
    className : `Navigation h-full flex items-center gap-5 `
})``

export const NavigationContainer = styled.div.attrs({
    className : `NavigationContainer font-semibold cursor-pointer hover:scale-[0.95]
    px-[11px] py-[5px] rounded-full`
})<{active : boolean}>
`
    color : ${({theme, active}) => active? theme.colors.text.light.white : theme.colors.text.dark.primary};
    background : ${({theme, active}) => active? theme.colors.main.primary : 'none'};
    &:hover {
        background : ${({theme, active}) => !active && theme.colors.background.light.primary}
    }
`

export const ThemeSwicher = styled.div.attrs({
    className : `ThemeSwicher cursor-pointer flex items-center w-[50px] h-[20px] 
    shadow-[inset_0px_0px_3.52632px_rgba(0,0,0,0.09)] rounded-full mr-[20px]`
})`
    background : ${({theme}) => theme.colors.background.light.primary};
`

export const SwitcherButton = styled.div.attrs({
    className : `SwitcherButton ml-[5px] w-[15px] h-[15px] bg-black rounded-full 
    shadow-[0px_3.52632px_3.52632px_rgba(0,0,0,0.25)] duration-300 cursor-pointer hover:opacity-[0.8]`
})<{themeSwitcher? : boolean}>
`
    background : ${({theme}) => theme.colors.main.primary};
    transform : ${({themeSwitcher}) => themeSwitcher? `translate(170%)` : 'translate(0)'};
`

export const Profile = styled.div.attrs({
    className : `h-full flex items-center hover:scale-[0.95] mt-[-3px] cursor-pointer`
})``

export const Menu = styled.div.attrs({
   className : ` Menu flex gap-1 h-[20px] items-center `
})``

export const SearchIcon = styled.div.attrs({
    className : `cursor-pointer`
})``

export const SearchInput = styled.input.attrs({
    className : `w-full h-full mr-[10px] placeholder:text-xs outline-none text-xs`
})`
   background : ${({theme}) => theme.colors.background.light.primary};
`

export const CourseSearch = styled.div.attrs({
   className : ` CourseSearch w-[200px] h-[300px] p-[10px] rounded-[5px] duration-300 absolute 
   top-[30px] right-0 flex flex-col gap-[10px] shadow-xl overflow-scroll`
})<{visible? : boolean}>`
    display : ${({visible}) => visible ? 'flex' : 'none'};
    border : ${({theme}) => `0.5px solid ${theme.colors2.main.primary}1a`};
    background : ${({theme}) => theme.colors2.shades.white};
`