import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { IconType } from 'react-icons'
import { FiSearch, FiSun, FiBookOpen, FiClock, FiAward, FiInbox, FiBookmark, FiRotateCcw, FiMenu, FiX, FiChevronsLeft, FiLogIn, FiSidebar } from 'react-icons/fi'
import { Mark } from '../brand/logo'
import ThemeSwitch from './themeSwitch'
import CommandPalette, { useCommandPalette } from '../commandPalette/commandPalette'
import { useCatalog } from '../../data/catalog'
import { useNotifications } from '../../store/notifications'
import { useProgress, summarize, courseProgress, initialsOf, reviewLink } from '../../store/progress'
import { useSession } from '../../store/session'
import { toneOf, toneVar } from '../../styles/tone'
import CourseIcon from '../courseIcon/courseIcon'
import { getLenis } from '../smoothScroll/smoothScroll'
import "react-toastify/dist/ReactToastify.css"
import "../reactToastify/toastifyCustomStyles.css"

const COLLAPSE_KEY = 'preproom.sidebar.collapsed'
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false } }

interface RowProps {
    to : string
    icon : IconType
    label : string
    count? : number | string
    countTone? : 'accent' | 'quiet'
    match? : (path : string) => boolean
}

const rowClass = (active : boolean) => `group flex items-center gap-[10px] h-[30px] px-2 rounded-md text-[14px] transition-colors duration-100
    ${active ? 'bg-ink/[0.06] text-ink font-medium' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'}`

const Row = ({ to, icon : Icon, label, count, countTone = 'quiet', match } : RowProps) => {
    const path = useLocation().pathname
    const active = match ? match(path) : path.startsWith(to)
    return (
        <NavLink to={to} className={rowClass(active)} aria-current={active ? 'page' : undefined}>
            <Icon size={16} className={active ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2'}/>
            <span className='flex-1 truncate'>{label}</span>
            {
                count !== undefined && count !== 0 &&
                <span className={`text-[11px] font-medium tabular-nums px-[6px] rounded-full leading-[18px]
                ${countTone === 'accent' ? 'bg-accent text-on-accent' : 'text-ink-3'}`}>{count}</span>
            }
        </NavLink>
    )
}

const SectionLabel = ({ children } : { children : React.ReactNode }) => (
    <div className='px-2 pt-5 pb-1 text-[12px] font-medium text-ink-3'>{children}</div>
)

const Sidebar = ({ onCollapse, onNavigate } : { onCollapse? : () => void, onNavigate? : () => void }) => {
    const navigate = useNavigate()
    const path = useLocation().pathname
    const session = useSession()
    const state = useProgress()
    const { courses } = useCatalog()
    const notifications = useNotifications()
    const unread = notifications.filter((item) => item.unread).length
    const stats = summarize(state)
    const saved = Object.keys(state.saved).length
    const mistakes = Object.values(state.attempts).filter((attempt) => !attempt.correct).length
    const [, setPalette] = useCommandPalette()
    const user = session.user
    const name = user?.name || state.profile.name
    const program = (user?.program || state.profile.program || '').replace(/^(BSc|BA|BEng|MSc|BEd)\s+/, '')

    return (
        <nav aria-label='App' className='flex flex-col h-full w-full' onClick={(event) => {
            if((event.target as HTMLElement).closest('a')) onNavigate?.()
        }}>
            <div className='flex items-center gap-2 px-3 h-[52px] shrink-0'>
                <button type='button' onClick={()=>{ navigate('/today'); onNavigate?.() }} className='flex items-center gap-[10px] min-w-0 flex-1 h-8 px-1 -ml-1 rounded-md hover:bg-ink/[0.04] transition-colors'>
                    <Mark size={20}/>
                    <span className='flex flex-col items-start min-w-0 leading-tight'>
                        <span className='text-[14px] font-semibold tracking-[-0.01em] text-ink truncate'>PrepRoom</span>
                    </span>
                </button>
                {
                    onCollapse &&
                    <button type='button' onClick={onCollapse} title={`Collapse sidebar (${isMac ? '⌘' : 'Ctrl'} \\)`} aria-label='Collapse sidebar'
                        className='w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-3 hover:bg-ink/[0.06] hover:text-ink transition-colors'>
                        <FiChevronsLeft size={16}/>
                    </button>
                }
            </div>

            <div className='px-2'>
                <button type='button' onClick={()=>{ setPalette(true); onNavigate?.() }} className={`${rowClass(false)} w-full`}>
                    <FiSearch size={16} className='text-ink-3'/>
                    <span className='flex-1 text-left'>Search</span>
                    <span className='text-[11px] text-ink-4 font-mono'>{isMac ? '⌘K' : 'Ctrl K'}</span>
                </button>
                <Row to='/today' icon={FiSun} label='Today'/>
                <Row to='/questions' icon={FiBookOpen} label='Questions' match={(p) => p.startsWith('/questions') && !/status=/.test(window.location.search)}/>
                <Row to='/test/testconfig' icon={FiClock} label='Tests' match={(p) => p.startsWith('/test')}/>
                <Row to='/challenges' icon={FiAward} label='Daily challenge' count={stats.streak ? `${stats.streak}d` : undefined}/>
                <Row to='/notification' icon={FiInbox} label='Inbox' count={unread} countTone='accent'/>
            </div>

            <div className='flex-1 overflow-y-auto px-2 pb-3' data-lenis-prevent>
                <SectionLabel>Review</SectionLabel>
                <Row to={reviewLink('mistakes', state)} icon={FiRotateCcw} label='Mistakes' count={mistakes}
                    match={() => path.startsWith('/questions') && window.location.search.includes('status=mistakes')}/>
                <Row to={reviewLink('saved', state)} icon={FiBookmark} label='Saved' count={saved}
                    match={() => path.startsWith('/questions') && window.location.search.includes('status=saved')}/>

                <SectionLabel>Courses</SectionLabel>
                {
                    courses.map((course) => {
                        const done = courseProgress(state, course.id, course.questions)
                        const active = path === `/questions/${course.id}` && !window.location.search.includes('status=')
                        return (
                            <NavLink key={course.id} to={`/questions/${course.id}`} className={rowClass(active)} title={`${course.code} · ${course.name}`}>
                                <CourseIcon course={course} size={18}/>
                                <span className='flex-1 truncate'>{course.name}</span>
                                {done.answered > 0 && <span className='text-[11px] text-ink-4 tabular-nums'>{done.percent}%</span>}
                            </NavLink>
                        )
                    })
                }
            </div>

            <div className='shrink-0 border-t border-line px-2 py-2 flex flex-col gap-2'>
                <ThemeSwitch wide/>
                {
                    session.status === 'user' || name ?
                    <NavLink to='/profile' className={`${rowClass(path.startsWith('/profile'))} !h-10`}>
                        <span className='w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white shrink-0'
                            style={{ background : toneVar(toneOf(name || 'you', user?.color)) }}>
                            {initialsOf(name || 'You')}
                        </span>
                        <span className='flex flex-col min-w-0 leading-tight'>
                            <span className='truncate text-[13px] font-medium text-ink'>{name || 'Your profile'}</span>
                            <span className='truncate text-[12px] text-ink-3'>{session.status === 'user' ? (program || user?.email) : 'Saved on this device'}</span>
                        </span>
                    </NavLink>
                    :
                    <NavLink to='/auth/login' className={rowClass(false)}>
                        <FiLogIn size={16} className='text-ink-3'/>
                        <span className='flex-1'>Log in to sync</span>
                    </NavLink>
                }
            </div>
        </nav>
    )
}

// Notion-style app frame: a quiet sidebar, the page on paper, and a slim header on phones
const AppShell = () => {
    const location = useLocation()
    const [collapsed, setCollapsed] = useState(readCollapsed)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [paletteOpen, setPaletteOpen] = useCommandPalette()

    useEffect(() => { setMobileOpen(false) }, [location.pathname, location.search])

    useEffect(() => {
        try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch { /* private mode */ }
    }, [collapsed])

    useEffect(() => {
        const onKey = (event : KeyboardEvent) => {
            if((event.metaKey || event.ctrlKey) && event.key === '\\'){
                event.preventDefault()
                setCollapsed((value) => !value)
            }
            if(event.key === 'Escape') setMobileOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        const lenis = getLenis()
        mobileOpen ? lenis?.stop() : lenis?.start()
        document.body.style.overflow = mobileOpen ? 'hidden' : ''
    }, [mobileOpen])

    return (
        <div className='min-h-screen bg-canvas'>
            <ToastContainer/>
            <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>

            {/* Desktop sidebar */}
            <aside
                className='hidden lg:flex fixed inset-y-0 left-0 z-30 w-[248px] bg-canvas border-r border-line transition-transform duration-300 ease-drawer'
                style={{ transform : collapsed ? 'translateX(-100%)' : 'none' }}
                aria-hidden={collapsed}
                {...(collapsed ? { inert : '' } as any : {})}
            >
                <Sidebar onCollapse={()=>setCollapsed(true)}/>
            </aside>

            {/* Phone / tablet header */}
            <header className='lg:hidden sticky top-0 z-30 h-[52px] flex items-center gap-2 px-3 border-b border-line bg-canvas/85 backdrop-blur-xl'>
                <button type='button' onClick={()=>setMobileOpen(true)} aria-label='Open menu' aria-expanded={mobileOpen}
                    className='w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-ink/[0.06]'>
                    <FiMenu size={18}/>
                </button>
                <span className='flex items-center gap-2 flex-1'><Mark size={20}/><span className='text-[15px] font-semibold tracking-[-0.01em]'>PrepRoom</span></span>
                <button type='button' onClick={()=>setPaletteOpen(true)} aria-label='Search'
                    className='w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-ink/[0.06]'>
                    <FiSearch size={17}/>
                </button>
            </header>

            {/* Phone drawer */}
            <div className={`lg:hidden fixed inset-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
                <div className={`absolute inset-0 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background : 'var(--scrim)' }} onClick={()=>setMobileOpen(false)}/>
                <div className='absolute inset-y-0 left-0 w-[286px] max-w-[86vw] bg-canvas shadow-float transition-transform duration-300 ease-drawer'
                    style={{ transform : mobileOpen ? 'none' : 'translateX(-104%)' }}>
                    <button type='button' onClick={()=>setMobileOpen(false)} aria-label='Close menu'
                        className='absolute right-2 top-[10px] w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-3 hover:bg-ink/[0.06] z-10'>
                        <FiX size={17}/>
                    </button>
                    {mobileOpen && <Sidebar onNavigate={()=>setMobileOpen(false)}/>}
                </div>
            </div>

            {/* Re-open control when collapsed */}
            {
                collapsed &&
                <button type='button' onClick={()=>setCollapsed(false)} title={`Show sidebar (${isMac ? '⌘' : 'Ctrl'} \\)`} aria-label='Show sidebar'
                    className='hidden lg:inline-flex fixed left-3 top-3 z-30 w-8 h-8 items-center justify-center rounded-md text-ink-3 bg-canvas/80 backdrop-blur hover:bg-ink/[0.06] hover:text-ink transition-colors'>
                    <FiSidebar size={16}/>
                </button>
            }

            {/* The page sits on an inset panel, like a sheet laid on the desk */}
            <div className={`transition-[padding] duration-300 ease-drawer lg:py-2 lg:pr-2 ${collapsed ? 'lg:pl-2' : 'lg:pl-[248px]'}`}>
                <div className='bg-surface min-h-[calc(100vh-52px)] lg:min-h-[calc(100vh-16px)] lg:rounded-xl lg:border lg:border-line'>
                    <Outlet/>
                </div>
            </div>
        </div>
    )
}

export default AppShell
