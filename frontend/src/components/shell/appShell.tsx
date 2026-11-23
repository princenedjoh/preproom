import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { FiSearch, FiBell, FiMenu, FiX, FiUser, FiLogOut, FiLogIn, FiZap, FiChevronDown } from 'react-icons/fi'
import { Mark } from '../brand/logo'
import CommandPalette, { useCommandPalette } from '../commandPalette/commandPalette'
import { useNotifications } from '../../store/notifications'
import { useProgress, summarize, initialsOf } from '../../store/progress'
import { useSession, logout } from '../../store/session'
import { toneOf, toneVar } from '../../styles/tone'
import { notify } from '../../utils/notify'
import "react-toastify/dist/ReactToastify.css"
import "../reactToastify/toastifyCustomStyles.css"

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export const links = [
    { label : 'Today', to : '/today', match : (p : string) => p.startsWith('/today') },
    { label : 'Questions', to : '/questions', match : (p : string) => p.startsWith('/questions') },
    { label : 'Tests', to : '/test/testconfig', match : (p : string) => p.startsWith('/test') },
    { label : 'Challenge', to : '/challenges', match : (p : string) => p.startsWith('/challenges') },
]

const menuItem = 'flex items-center gap-3 h-9 px-2 rounded-md text-[14px] text-ink-2 hover:bg-ink/[0.05] hover:text-ink transition-colors'

// The account menu: who you are, theme, and the way out
export const AccountMenu = () => {
    const navigate = useNavigate()
    const session = useSession()
    const state = useProgress()
    const [open, setOpen] = useState(false)
    const box = useRef<HTMLDivElement>(null)
    const name = session.user?.name || state.profile.name
    const signedIn = session.status === 'user'
    const avatar = name ? toneVar(toneOf(name, session.user?.color)) : 'rgb(var(--ink-4))'

    useEffect(() => {
        if(!open) return
        const onDown = (event : PointerEvent) => { if(!box.current?.contains(event.target as Node)) setOpen(false) }
        const onKey = (event : KeyboardEvent) => { if(event.key === 'Escape') setOpen(false) }
        window.addEventListener('pointerdown', onDown)
        window.addEventListener('keydown', onKey)
        return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey) }
    }, [open])

    return (
        <div className='relative' ref={box}>
            <button type='button' onClick={()=>setOpen(!open)} aria-haspopup='menu' aria-expanded={open} aria-label='Account'
                className='flex items-center gap-1 h-8 pl-[3px] pr-1 rounded-full hover:bg-ink/[0.06] transition-colors'>
                <span className='w-[26px] h-[26px] rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white' style={{ background : avatar }}>
                    {name ? initialsOf(name) : <FiUser size={13}/>}
                </span>
                <FiChevronDown size={13} className='text-ink-3'/>
            </button>
            {
                open &&
                <div role='menu' className='absolute right-0 top-[calc(100%+6px)] w-[260px] rounded-lg bg-surface border border-line shadow-float p-2 flex flex-col gap-1 origin-top-right animate-[pop_140ms_var(--ease-out)] z-50'>
                    <div className='flex items-center gap-3 px-2 py-2'>
                        <span className='w-9 h-9 rounded-full inline-flex items-center justify-center text-[12px] font-semibold text-white shrink-0' style={{ background : avatar }}>
                            {name ? initialsOf(name) : <FiUser size={15}/>}
                        </span>
                        <span className='flex flex-col min-w-0 leading-tight'>
                            <span className='text-[14px] font-medium text-ink truncate'>{name || 'Guest'}</span>
                            <span className='text-[12px] text-ink-3 truncate'>{signedIn ? session.user?.email : 'Progress saved on this device'}</span>
                        </span>
                    </div>
                    <div className='h-px bg-line my-1'/>
                    <button role='menuitem' type='button' onClick={()=>{ setOpen(false); navigate('/profile') }} className={menuItem}>
                        <FiUser size={15}/> Profile and settings
                    </button>
                    {
                        signedIn ?
                        <button role='menuitem' type='button' onClick={async ()=>{ setOpen(false); await logout(); notify('Logged out'); navigate('/') }} className={menuItem}>
                            <FiLogOut size={15}/> Log out
                        </button>
                        :
                        <button role='menuitem' type='button' onClick={()=>{ setOpen(false); navigate('/auth/login') }} className={menuItem}>
                            <FiLogIn size={15}/> Log in to sync
                        </button>
                    }
                </div>
            }
        </div>
    )
}

// Streak: a bolt and the day count, lit once you've practised today
export const StreakChip = () => {
    const navigate = useNavigate()
    const stats = summarize(useProgress())
    return (
        <button type='button' onClick={()=>navigate('/challenges')} aria-label={`${stats.streak}-day streak`}
            title={stats.activeToday ? `${stats.streak}-day streak` : 'Practise today to keep your streak'}
            className={`flex items-center gap-1 h-8 px-2 rounded-md text-[13px] font-medium tabular-nums hover:bg-ink/[0.06] transition-colors ${stats.activeToday ? 'text-medium' : 'text-ink-3'}`}>
            <FiZap size={15} fill={stats.activeToday ? 'currentColor' : 'none'}/> {stats.streak}
        </button>
    )
}

export const NavIcons = ({ onSearch } : { onSearch : () => void }) => {
    const navigate = useNavigate()
    const unread = useNotifications().filter((item) => item.unread).length
    return (
        <>
            <button type='button' onClick={onSearch}
                className='hidden md:flex items-center gap-2 h-8 w-[200px] px-[10px] rounded-md bg-ink/[0.05] text-[13px] text-ink-3 hover:bg-ink/[0.08] transition-colors'>
                <FiSearch size={14}/> <span className='flex-1 text-left'>Search</span>
                <span className='font-mono text-[11px] text-ink-4'>{isMac ? '⌘K' : 'Ctrl K'}</span>
            </button>
            <button type='button' onClick={onSearch} aria-label='Search' className='md:hidden w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-ink/[0.06]'>
                <FiSearch size={16}/>
            </button>
            <button type='button' onClick={()=>navigate('/notification')} aria-label={unread ? `Inbox, ${unread} unread` : 'Inbox'}
                className='relative w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-ink/[0.06] transition-colors'>
                <FiBell size={16}/>
                {unread > 0 && <span className='absolute top-[6px] right-[6px] w-[7px] h-[7px] rounded-full bg-hard ring-2 ring-surface'/>}
            </button>
            <StreakChip/>
        </>
    )
}

// App frame: a slim top bar with the sections, full-width pages below
const AppShell = () => {
    const path = useLocation().pathname
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [paletteOpen, setPaletteOpen] = useCommandPalette()

    useEffect(() => { setMenuOpen(false) }, [path])

    return (
        <div className='min-h-screen bg-canvas'>
            <ToastContainer/>
            <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>
            <header className='sticky top-0 z-30 h-[50px] bg-surface border-b border-line'>
                <div className='h-full max-w-[1440px] mx-auto px-3 md:px-5 flex items-center gap-1'>
                    <button type='button' className='lg:hidden w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-2 hover:bg-ink/[0.06]' onClick={()=>setMenuOpen(!menuOpen)} aria-label='Menu' aria-expanded={menuOpen}>
                        {menuOpen ? <FiX size={18}/> : <FiMenu size={18}/>}
                    </button>
                    <button type='button' onClick={()=>navigate('/today')} className='flex items-center gap-2 h-8 px-1 mr-3 rounded-md' aria-label='PrepRoom home'>
                        <Mark size={22}/>
                        <span className='hidden sm:inline text-[15px] font-semibold tracking-[-0.02em] text-ink'>PrepRoom</span>
                    </button>
                    <nav className='hidden lg:flex items-center h-full' aria-label='Main'>
                        {links.map((link) => {
                            const active = link.match(path)
                            return (
                                <NavLink key={link.to} to={link.to} aria-current={active ? 'page' : undefined}
                                    className={`relative h-full flex items-center px-3 text-[14px] transition-colors ${active ? 'text-ink font-medium' : 'text-ink-3 hover:text-ink'}`}>
                                    {link.label}
                                    {active && <span className='absolute left-3 right-3 bottom-0 h-[2px] rounded-full bg-ink'/>}
                                </NavLink>
                            )
                        })}
                    </nav>
                    <div className='ml-auto flex items-center gap-1'>
                        <NavIcons onSearch={()=>setPaletteOpen(true)}/>
                        <span className='w-px h-5 bg-line mx-1'/>
                        <AccountMenu/>
                    </div>
                </div>
                {
                    menuOpen &&
                    <nav className='lg:hidden absolute inset-x-0 top-[50px] bg-surface border-b border-line shadow-float px-3 py-2 flex flex-col animate-[fade_120ms_ease-out]' aria-label='Main'>
                        {links.map((link) => (
                            <NavLink key={link.to} to={link.to} className={`h-11 flex items-center px-2 rounded-md text-[15px] ${link.match(path) ? 'text-ink font-medium bg-ink/[0.05]' : 'text-ink-2'}`}>{link.label}</NavLink>
                        ))}
                        <NavLink to='/notification' className='h-11 flex items-center px-2 rounded-md text-[15px] text-ink-2'>Inbox</NavLink>
                        <NavLink to='/profile' className='h-11 flex items-center px-2 rounded-md text-[15px] text-ink-2'>Profile</NavLink>
                    </nav>
                }
            </header>
            <Outlet/>
        </div>
    )
}

export default AppShell
