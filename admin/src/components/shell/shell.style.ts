import styled from 'styled-components'

export const SIDEBAR_WIDTH = 248

export const Frame = styled.div.attrs({
    className : `Frame min-h-screen w-full` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
`

export const Sidebar = styled.aside.attrs({
    className : `Sidebar fixed top-0 left-0 bottom-0 z-[1200] flex flex-col` as string
})<{open : boolean}>`
    width : ${SIDEBAR_WIDTH}px;
    background : ${({theme}) => theme.colors.background.light.primary};
    border-right : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    transition : transform 280ms cubic-bezier(0.32, 0.72, 0, 1);

    @media (max-width : 1023px) {
        transform : ${({open}) => open ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH + 1}px)`};
        box-shadow : ${({open, theme}) => open ? theme.shadows.screenshot : 'none'};
        transition-duration : ${({open}) => open ? '280ms' : '200ms'};
    }
`

export const Scrim = styled.div.attrs({
    className : `Scrim fixed inset-0 z-[1150] lg:hidden` as string
})<{open : boolean}>`
    background : rgba(9, 12, 29, 0.28);
    opacity : ${({open}) => open ? 1 : 0};
    pointer-events : ${({open}) => open ? 'auto' : 'none'};
    transition : opacity 240ms cubic-bezier(0.23, 1, 0.32, 1);
`

export const Brand = styled.button.attrs({
    className : `Brand flex items-center gap-2 h-[56px] px-4 shrink-0 w-full text-left` as string
})`
    img { width : 24px; }
    span.word {
        font-family : ${({theme}) => theme.fonts.display};
        font-weight : 800;
        font-size : 16px;
        letter-spacing : -0.03em;
        color : ${({theme}) => theme.colors.main.primary};
    }
`

export const AdminTag = styled.span.attrs({
    className : `AdminTag uppercase text-[9px] rounded-full px-[7px] py-[2px]` as string
})`
    font-family : ${({theme}) => theme.fonts.mono};
    letter-spacing : 0.08em;
    color : ${({theme}) => theme.colors2.violet.violet2};
    background : ${({theme}) => theme.colors2.violet.violet5};
`

export const Nav = styled.nav.attrs({
    className : `Nav flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-5` as string
})``

export const SectionLabel = styled.span.attrs({
    className : `SectionLabel block uppercase text-[10px] px-2 mb-1` as string
})`
    font-family : ${({theme}) => theme.fonts.mono};
    letter-spacing : 0.08em;
    color : ${({theme}) => theme.colors2.gray.gray4};
`

export const NavLink = styled.button.attrs({
    className : `NavLink w-full flex items-center gap-[10px] h-[32px] px-2 rounded-[8px] text-[13.5px] text-left` as string
})<{active : boolean}>`
    font-weight : ${({active}) => active ? 600 : 500};
    color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray2};
    background : ${({theme, active}) => active ? theme.colors.background.light.white : 'transparent'};
    box-shadow : ${({theme, active}) => active ? theme.shadows.subtle : 'none'};
    transition : background 150ms ease, color 150ms ease;
    svg { color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray4}; flex-shrink : 0; }

    @media (hover : hover) and (pointer : fine) {
        &:hover { background : ${({theme, active}) => active ? theme.colors.background.light.white : 'rgba(0, 0, 0, 0.04)'}; }
    }
`

export const Account = styled.div.attrs({
    className : `Account flex items-center gap-[10px] mx-3 mb-3 p-2 rounded-[10px]` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Content = styled.div.attrs({
    className : `Content min-h-screen flex flex-col lg:pl-[248px]` as string
})``

export const Header = styled.header.attrs({
    className : `Header sticky top-0 z-[1100] h-[56px] flex items-center gap-3 px-4 md:px-8` as string
})`
    background : rgba(255, 255, 255, 0.86);
    backdrop-filter : saturate(180%) blur(12px);
    border-bottom : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
`

export const Crumbs = styled.div.attrs({
    className : `Crumbs flex items-center gap-2 text-[13px] min-w-0` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray4};
    strong { color : ${({theme}) => theme.colors.main.primary}; font-weight : 600; white-space : nowrap; }
`

export const HeaderSearch = styled.form.attrs({
    className : `HeaderSearch hidden md:flex items-center gap-2 h-[34px] rounded-full pl-3 pr-[6px] w-[260px]` as string
})`
    color : ${({theme}) => theme.colors2.gray.gray4};
    background : ${({theme}) => theme.colors.background.light.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    transition : border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
    &:focus-within {
        background : ${({theme}) => theme.colors.background.light.white};
        border-color : ${({theme}) => theme.colors2.brand.blue};
        box-shadow : 0 0 0 3px rgba(0, 145, 255, 0.12);
    }
    input {
        flex : 1;
        min-width : 0;
        outline : none;
        background : transparent;
        font-size : 13px;
        color : ${({theme}) => theme.colors.main.primary};
    }
    input::placeholder { color : ${({theme}) => theme.colors2.gray.gray4}; }
`
