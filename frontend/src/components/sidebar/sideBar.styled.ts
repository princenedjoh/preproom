import styled, { keyframes } from "styled-components";

export const Main = styled.div.attrs({
    className : `Main fixed w-[300px] mr-[30px] h-screen text-xs overflow-y-auto`
})`
    color : ${({theme}) => theme.colors.text.dark.primary};
    border-right : ${({theme}) => `3px solid ${theme.colors.border.light.primary}`};
`

export const MainContainer = styled.div.attrs({
    className : `MainContainer flex fixed left-[0] top-[50px] w-full h-screen overflow-y-scroll`
})``

export const Profile = styled.div.attrs({
    className : `Profile cursor-pointer mb-[5px] gap-1 pl-[50px] h-[80px] flex items-center w-full`
})`
    background : ${({theme}) => theme.colors.background.light.primary};
`

export const ProfleImg = styled.div.attrs({
    className : `ProfleImg`
})``

export const ProfileInfo = styled.div.attrs({
    className : `ProfileInfo w-full pr-[50px] flex justify-center`
})<{loggedIn : boolean}>
`
    flex-direction : ${({loggedIn}) => loggedIn ? "column" : "row"};
`

export const Login = styled.div.attrs({
    className : `Login rounded-full w-[100px] flex items-center pb-[7px] pt-[6px] 
    font-semibold justify-center cursor-pointer duration-300 hover:opacity-[0.9]
    hover:scale-[0.95]`
})`
    color : ${({theme}) => theme.colors.background.light.white};
    border : ${({theme}) => `1px solid ${theme.colors.main.primary}`};
    background : ${({theme}) => theme.colors.main.primary};
`


export const name = styled.div.attrs({
    className : `text-sm font-semibold`
})``

export const email = styled.div.attrs({
    className : `email mt-[-2px]`
})``

export const Branches = styled.div.attrs({
    className : `Branches `
})``

export const BranchInfo = styled.div.attrs({
    className : `BranchInfo pl-[50px] py-[13px] flex items-center justify-between`
})<{active? : boolean}>
`
    background : ${({theme, active}) => active && theme.colors.background.light.primary};
`

export const Branch = styled.div.attrs({
    className : `Branch overflow-hidden duration-300 ease-in-out cursor-pointer flex flex-col`
})<{active? : boolean, height : number}>
`
    max-height : ${({active, height}) => active && height ? `${height}px` : "43px"};
    border-bottom : ${({theme}) => `3px solid ${theme.colors.border.light.primary}`};
`

export const BranchIcon = styled.div.attrs({
    className : `BranchIcon w-[17px] h-[17px] mr-[5px] flex justify-center items-center rounded-full`
})``

export const BranchLeft = styled.div.attrs({
    className : `BranchLeft flex `
})``

export const BranchButton = styled.div.attrs({
    className : `BranchButton mr-[20px] duration-300`
})<{active : boolean}>
`
    transform : ${({active}) => active ? "rotate(90deg)" : "rotate(0)"};
`

export const BranchName = styled.div.attrs({
    className : `BranchName font-bold `
})``

export const Programs = styled.div.attrs({
    className : `Programs flex flex-col text-[11px] font-semibold`
})``

export const Program = styled.div.attrs({
    className : `Program pl-[70px] py-[10px] cursor-pointer `
})`
    &:hover{
        color : ${({theme}) => theme.colors.text.dark.black};
        background : ${({theme}) => theme.colors.background.light.primary};
    }
`

export const CoursesContainer = styled.div.attrs({
    className : `CoursesContainer fixed left-[330px] rounded-[10px] 
    backdrop-filter backdrop-blur-lg font-semibold
    top-[68px] w-[300px] min-h-[85%] shadow-lg text-xs`
})`
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    color : ${({theme}) => theme.colors.text.dark.primary};
    background : ${({theme}) => `${theme.colors.background.light.white}b3`};
`

export const Courses = styled.div.attrs({
    className : `Courses py-[20px]`
})``

export const CourseTitle = styled.div.attrs({
    className : `CourseTitle px-[20px] text-base font-bold cursor-default`
})`
    color : ${({theme}) => theme.colors.main.primary};
`

export const Course = styled.div.attrs({
    className : `Course px-[20px] py-[10px] cursor-pointer`
})`
        &:hover{
        color : ${({theme}) => theme.colors.text.dark.black};
        background : ${({theme}) => theme.colors.background.light.primary};
    }
`