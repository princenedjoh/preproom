import * as topBarStyle from './topBar.styled'
import {logos} from '../../assets/index'
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from 'antd';
import { FaBell } from 'react-icons/fa'
import Cookies from "universal-cookie"
import { ToastContainer } from 'react-toastify'
import { AppTypography, ClickableTab } from '../../styles/global'
import { TypographySize } from '../../styles/style.types'
import theme from '../../styles/theme'
import { HiFire } from "react-icons/hi";
import { IoMdArrowDropdown } from "react-icons/io";
import Chip from '@mui/material/Chip';
import Input from '../../components/UI/input/input'
import { FiSearch, FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import { RiMapPinUserFill } from 'react-icons/ri'
import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import SwipeableTemporaryDrawer from './components/drawer'
import CommandPalette, { useCommandPalette } from '../commandPalette/commandPalette'
import { getLenis } from '../smoothScroll/smoothScroll'
import { useNotifications } from '../../store/notifications'
import { useProgress, summarize } from '../../store/progress'
import "react-toastify/dist/ReactToastify.css"
import "../reactToastify/toastifyCustomStyles.css"

const cookie = new Cookies()

const programs = [
    'Computer Science', 'Computer Engineering', 'Electrical Engineering', 'Mechanical Engineering',
    'Biochemistry', 'Economics', 'Mathematics', 'Physics', 'Pharmacy', 'Medicine',
]

const navigations = [
    { name : 'Today', route : '/today', match : 'today' },
    { name : 'Questions', route : '/questions', match : 'questions' },
    { name : 'Tests', route : '/test/testconfig', match : 'test' },
    { name : 'Challenges', route : '/challenges', match : 'challenges' },
]

export const LogoText = () => {
    return (
        <topBarStyle.LogoText>
            PrepRoom
        </topBarStyle.LogoText>
    )
}

const TopBar = () => {

    const navigate = useNavigate()
    const location = useLocation().pathname
    const currentTab = location.split('/')[1].toLowerCase()
    const hasSession = !!cookie.get("jwtToken")
    const unread = useNotifications().filter((item) => item.unread).length
    const progressState = useProgress()
    const { streak } = summarize(progressState)

    const [searchValue, setSearchValue] = useState('')
    const [program, setProgram] = useState(progressState.profile.program.replace(/^(BSc|BA|BEng|MSc)\s+/, ''))
    const [courseVisibility, setCourseVisibility] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [paletteOpen, setPaletteOpen] = useCommandPalette()
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

    useEffect(()=>{
        setMenuOpen(false)
    },[location])

    useEffect(()=>{
        const lenis = getLenis()
        menuOpen ? lenis?.stop() : lenis?.start()
        document.body.style.overflow = menuOpen ? 'hidden' : ''
    },[menuOpen])

    const handleChangeCourse = (name : string) => {
        setCourseVisibility(false)
        setProgram(name)
    }

    const filteredPrograms = programs.filter((item) => item.toLowerCase().includes(searchValue.trim().toLowerCase()))

  return (
    <>
      <ToastContainer/>
      <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>
      <topBarStyle.Main>
        <topBarStyle.Inner>
            <div className='flex items-center'>
                <topBarStyle.Logo onClick={()=>navigate('/')}>
                    <topBarStyle.LogoImg src = {logos.logoMark} alt=''/>
                    <LogoText />
                </topBarStyle.Logo>
                <topBarStyle.Navigation>
                    {
                        navigations.map((navigationMap) => (
                            <Link to={navigationMap.route} key={navigationMap.name}>
                                <topBarStyle.NavigationContainer active={currentTab === navigationMap.match}>
                                    {navigationMap.name}
                                </topBarStyle.NavigationContainer>
                            </Link>
                        ))
                    }
                </topBarStyle.Navigation>
            </div>
            <ClickAwayListener onClickAway={()=>setCourseVisibility(false)}>
                <div className='flex items-center gap-[6px]'>
                    <topBarStyle.SearchTrigger type='button' onClick={()=>setPaletteOpen(true)} aria-label='Search'>
                        <FiSearch size={14}/>
                        <span className='hidden lg:inline'>Search</span>
                        <kbd className='hidden lg:inline font-mono text-[11px] text-ash ml-3'>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
                    </topBarStyle.SearchTrigger>
                    <div className='hidden lg:flex flex-col relative'>
                        <Chip 
                            size='small'
                            onClick={()=>{setCourseVisibility(!courseVisibility)}}
                            deleteIcon={<IoMdArrowDropdown />} 
                            onDelete={()=>setCourseVisibility(!courseVisibility)}
                            label={
                            <AppTypography textColor={theme.colors2.gray.gray2}>
                                {program}
                            </AppTypography>
                            } 
                        />
                        <topBarStyle.CourseSearch visible={courseVisibility} data-lenis-prevent>
                            <AppTypography
                                font='mono'
                                size={TypographySize.xs}
                                textColor={theme.colors2.gray.gray4}
                                style={{ letterSpacing : '0.08em', textTransform : 'uppercase' }}
                            >
                                Programmes
                            </AppTypography>
                            <Input
                                PreIcon={FiSearch}
                                value={searchValue}
                                setState={setSearchValue}
                                background={theme.colors.background.light.primary}
                                border='none'
                                type='text'
                                placeholder='Search programmes'
                            />
                            <div className='flex flex-col'>
                                {
                                    filteredPrograms.map((item) => (
                                        <ClickableTab
                                            key={item}
                                            onClick={()=>handleChangeCourse(item)}
                                            radius='8px'
                                            padding='9px 10px'
                                            style={{ width : '100%' }}
                                        >
                                            <AppTypography 
                                                size={TypographySize.sm2}
                                                textColor={item === program ? theme.colors.main.primary : theme.colors2.gray.gray3}
                                                bold={item === program ? '600' as any : undefined}
                                            >
                                                {item}
                                            </AppTypography>
                                        </ClickableTab>
                                    ))
                                }
                                {
                                    filteredPrograms.length === 0 &&
                                    <AppTypography textColor={theme.colors2.gray.gray4} style={{ padding : '9px 10px' }}>No programmes found</AppTypography>
                                }
                            </div>
                        </topBarStyle.CourseSearch>
                    </div>
                    <Badge count={unread} dot color={theme.colors2.brand.violet}>
                        <ClickableTab 
                            padding='8px'
                            aria-label='Notifications'
                            onClick={()=>navigate('/notification')}>
                            <FaBell color={theme.colors2.gray.gray3} size={'15px'} />
                        </ClickableTab>
                    </Badge>
                    <div className='hidden sm:flex'>
                        <Badge count={streak} size='small' color={theme.colors2.brand.violet}>
                            <ClickableTab padding='8px' aria-label='Streak' onClick={()=>navigate('/challenges')}>
                                <HiFire color={theme.colors2.orange.orange3} size={'18px'} />
                            </ClickableTab>
                        </Badge>
                    </div>
                    <SwipeableTemporaryDrawer hasSession={hasSession}>
                        <ClickableTab padding='8px' aria-label='Account'>
                            <RiMapPinUserFill color={theme.colors2.gray.gray3} size={'18px'} />
                        </ClickableTab>
                    </SwipeableTemporaryDrawer>
                    {
                        !hasSession &&
                        <div className='hidden md:flex items-center gap-2 ml-[6px]'>
                            <topBarStyle.AuthButton type='button' onClick={()=>navigate('/auth/login')}>
                                Log in
                            </topBarStyle.AuthButton>
                            <topBarStyle.AuthButton type='button' filled onClick={()=>navigate('/auth/signup')}>
                                Sign up
                            </topBarStyle.AuthButton>
                        </div>
                    }
                    <topBarStyle.MenuButton 
                        type='button'
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                        onClick={()=>setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <FiX size={18}/> : <FiMenu size={18}/>}
                    </topBarStyle.MenuButton>
                </div>
            </ClickAwayListener>
        </topBarStyle.Inner>
      </topBarStyle.Main>
      <topBarStyle.MobileMenu open={menuOpen} aria-hidden={!menuOpen}>
        {
            navigations.map((navigationMap) => (
                <topBarStyle.MobileLink
                    key={navigationMap.name}
                    type='button'
                    active={currentTab === navigationMap.match}
                    onClick={()=>navigate(navigationMap.route)}
                >
                    {navigationMap.name} <FiArrowRight size={18}/>
                </topBarStyle.MobileLink>
            ))
        }
        <topBarStyle.MobileLink type='button' active={currentTab === 'profile'} onClick={()=>navigate('/profile')}>
            Profile <FiArrowRight size={18}/>
        </topBarStyle.MobileLink>
        {
            !hasSession &&
            <div className='grid grid-cols-2 gap-3 mt-auto'>
                <topBarStyle.AuthButton type='button' className='!py-3' onClick={()=>navigate('/auth/login')}>Log in</topBarStyle.AuthButton>
                <topBarStyle.AuthButton type='button' filled className='!py-3' onClick={()=>navigate('/auth/signup')}>Sign up</topBarStyle.AuthButton>
            </div>
        }
      </topBarStyle.MobileMenu>
      <Outlet/>
    </>
  )
}

export default TopBar
