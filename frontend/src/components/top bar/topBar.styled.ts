import styled from "styled-components";
import { pressable } from "../../styles/kit";

export const Main = styled.div.attrs({
    className : `Main w-full h-[64px] fixed top-0 left-0
    backdrop-filter backdrop-blur-md flex justify-center items-center z-20 px-4 md:px-6` as string
})`
    color : ${({theme}) => theme.colors.text.dark.primary};
    border-bottom : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    background : rgba(255, 255, 255, 0.72);
    backdrop-filter : blur(20px) saturate(180%);
    -webkit-backdrop-filter : blur(20px) saturate(180%);
    @media (prefers-reduced-transparency : reduce) { background : #ffffff; backdrop-filter : none; }
`

export const SearchTrigger = styled.button.attrs({
    className : `SearchTrigger inline-flex items-center gap-2 rounded-full h-9 px-[10px] lg:px-3 text-[13px] font-medium` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray3};
    background : ${({theme}) => theme.colors.background.light.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover { color : ${({theme}) => theme.colors.main.primary}; border-color : ${({theme}) => theme.colors2.gray.gray5}; }
    }
`

export const Inner = styled.div.attrs({
    className : `Inner w-full max-w-[1200px] flex items-center justify-between gap-4` as string
})``

export const Outlet = styled.div.attrs({
    className : `realtive ` as string
})``

export const Logo = styled.div.attrs({
    className : `Logo flex items-center gap-2 mr-4 md:mr-8 cursor-pointer shrink-0` as string
})``

export const LogoText = styled.div.attrs({
    className : `LogoText text-[18px] tracking-[-0.03em]` as string
})`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : 800;
    color : ${({theme}) => theme.colors.main.primary};
`

export const LogoImg = styled.img.attrs({
    className : `LogoImg w-[26px]` as string
})``

export const Right = styled.div.attrs({
    className : `w-full flex justify-between h-full items-center` as string
})``

export const SearchBar = styled.div.attrs({
    className : `w-[400px] h-[30px] rounded-full flex justify-center items-center px-[15px] py-[6px]` as string
})`
     background : ${({theme}) => theme.colors.background.light.primary};
`

export const Naivgations = styled.div.attrs({
    className : `flex h-full items-center` as string
})``

export const Navigation = styled.div.attrs({
    className : `Navigation h-full hidden md:flex items-center gap-1` as string
})``

export const NavigationContainer = styled.div.attrs({
    className : `NavigationContainer flex gap-[5px] items-center justify-center
    cursor-pointer px-[14px] py-[6px] rounded-full` as string
})<{active : boolean}>
`
    font-size : 14px;
    font-weight : ${({active}) => active ? 600 : 500};
    color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray3};
    background : ${({active}) => active ? 'rgba(0, 0, 0, 0.06)' : 'none'};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover {
            color : ${({theme}) => theme.colors.main.primary};
            background : ${({active}) => active ? 'rgba(0, 0, 0, 0.06)' : 'rgba(0, 0, 0, 0.04)'};
        }
    }
`

export const AuthButton = styled.button.attrs({
    className : `AuthButton rounded-full text-[14px] font-bold whitespace-nowrap` as string
})<{filled? : boolean}>`
    padding : ${({filled}) => filled ? '9px 18px' : '8px 16px'};
    color : ${({theme, filled}) => filled ? theme.colors.text.light.white : theme.colors.main.primary};
    background : ${({theme, filled}) => filled ? theme.colors.main.primary : 'transparent'};
    border : ${({theme, filled}) => filled ? 'none' : `1px solid ${theme.colors.border.light.primary}`};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover {
            opacity : ${({filled}) => filled ? 0.86 : 1};
            background : ${({filled}) => filled ? undefined : 'rgba(0, 0, 0, 0.04)'};
        }
    }
`

export const ThemeSwicher = styled.div.attrs({
    className : `ThemeSwicher cursor-pointer flex items-center w-[50px] h-[20px] 
    shadow-[inset_0px_0px_3.52632px_rgba(0,0,0,0.09)] rounded-full mr-[20px]` as string
})`
    background : ${({theme}) => theme.colors.background.light.primary};
`

export const SwitcherButton = styled.div.attrs({
    className : `SwitcherButton ml-[5px] w-[15px] h-[15px] bg-black rounded-full 
    shadow-[0px_3.52632px_3.52632px_rgba(0,0,0,0.25)] duration-300 cursor-pointer hover:opacity-[0.8]` as string
})<{themeSwitcher? : boolean}>
`
    background : ${({theme}) => theme.colors.main.primary};
    transform : ${({themeSwitcher}) => themeSwitcher? `translate(170%)` : 'translate(0)'};
`

export const Profile = styled.div.attrs({
    className : `h-full flex items-center hover:scale-[0.95] mt-[-3px] cursor-pointer` as string
})``

export const Menu = styled.div.attrs({
    className : ` Menu flex gap-1 h-[20px] items-center ` as string
})``

export const SearchIcon = styled.div.attrs({
    className : `cursor-pointer` as string
})``

export const SearchInput = styled.input.attrs({
    className : `w-full h-full mr-[10px] placeholder:text-xs outline-none text-xs` as string
})`
   background : ${({theme}) => theme.colors.background.light.primary};
`

export const CourseSearch = styled.div.attrs({
   className : ` CourseSearch w-[240px] h-[320px] p-[12px] rounded-[12px] duration-300 absolute 
   top-[34px] right-0 flex flex-col gap-[10px] overflow-auto` as string
})<{visible? : boolean}>`
    transform-origin : top right;
    opacity : ${({visible}) => visible ? 1 : 0};
    transform : ${({visible}) => visible ? 'scale(1)' : 'scale(0.96) translateY(-4px)'};
    visibility : ${({visible}) => visible ? 'visible' : 'hidden'};
    pointer-events : ${({visible}) => visible ? 'auto' : 'none'};
    transition : ${({visible}) => visible
        ? 'opacity 180ms cubic-bezier(0.23, 1, 0.32, 1), transform 180ms cubic-bezier(0.23, 1, 0.32, 1), visibility 0s'
        : 'opacity 120ms ease-out, transform 120ms ease-out, visibility 0s 120ms'};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    background : ${({theme}) => theme.colors2.shades.white};
    box-shadow : ${({theme}) => theme.shadows.screenshot};
`

export const MenuButton = styled.button.attrs({
    className : `MenuButton md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full` as string
})`
    color : ${({theme}) => theme.colors.main.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    ${pressable}
`

export const MobileMenu = styled.div.attrs({
    className : `MobileMenu md:hidden fixed left-0 right-0 top-[64px] bottom-0 z-20 flex flex-col gap-2 px-4 pt-4 pb-8` as string
})<{open : boolean}>`
    background : ${({theme}) => theme.colors.background.light.white};
    opacity : ${({open}) => open ? 1 : 0};
    transform : ${({open}) => open ? 'translateY(0)' : 'translateY(-8px)'};
    pointer-events : ${({open}) => open ? 'auto' : 'none'};
    transition : opacity 0.24s cubic-bezier(0.23, 1, 0.32, 1), transform 0.24s cubic-bezier(0.23, 1, 0.32, 1);
`

export const MobileLink = styled.button.attrs({
    className : `MobileLink flex items-center justify-between w-full py-4 text-left text-[22px]` as string
})<{active? : boolean}>`
    font-family : ${({theme}) => theme.fonts.display};
    font-weight : ${({active}) => active ? 700 : 600};
    letter-spacing : -0.02em;
    color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray3};
    border-bottom : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`
