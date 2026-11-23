import { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FiMenu, FiSearch, FiBell, FiLogOut, FiChevronRight, FiLock, FiSidebar, FiChevronsUp, FiX } from 'react-icons/fi'
import { useAdmin } from '../../context/admin'
import { PrimaryButton, Kbd } from '../../styles/kit'
import { IconButton } from '../../styles/adminKit'
import { PersonAvatar, EmptyState, Skeleton } from '../ui/ui'
import { Menu, MenuItem, MenuDivider, MenuLabel } from '../ui/menu'
import ThemeSwitch from './themeSwitch'
import { Mark } from '../brand/logo'
import CommandMenu from './commandMenu'
import { navSections, isActive, currentNav } from './nav'

// Same frame as the student app (frontend/src/components/shell/appShell.tsx):
// a quiet sidebar on the canvas, the page on an inset sheet, ⌘\ to collapse,
// and a drawer on phones.

const COLLAPSE_KEY = 'preproom.admin.sidebar.collapsed'
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false } }

const rowClass = (active : boolean) => `group w-full flex items-center gap-[10px] h-[30px] px-2 rounded-md text-[14px] text-left transition-colors duration-100
    ${active ? 'bg-ink/[0.06] text-ink font-medium' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'}`

const Sidebar = ({ onCollapse, onSearch } : { onCollapse? : () => void, onSearch : () => void }) => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { openFlags, unread, user, can, session, signOut } = useAdmin()
    const [menu, setMenu] = useState(false)
    const closeMenu = useCallback(() => setMenu(false), [])

    const sections = navSections.filter((section) => section.title !== 'People' || can.managePeople)
    const badge = (kind? : 'flags' | 'unread') => kind === 'flags' ? openFlags : kind === 'unread' ? unread : 0
    const email = session.state === 'live' ? session.user.email : undefined

    return (
        <nav aria-label="Admin" className="flex flex-col h-full w-full">
            <div className="flex items-center gap-2 px-3 h-[52px] shrink-0">
                <button type="button" onClick={() => navigate('/')} className="flex items-center gap-[10px] min-w-0 flex-1 h-8 px-1 -ml-1 rounded-md hover:bg-ink/[0.04] transition-colors">
                    <Mark size={20} />
                    <span className="flex items-baseline gap-[6px] min-w-0">
                        <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink truncate">PrepRoom</span>
                        <span className="text-[12px] text-ink-3">Admin</span>
                    </span>
                </button>
                {onCollapse && (
                    <button type="button" onClick={onCollapse} aria-label="Collapse sidebar" title={`Collapse sidebar (${isMac ? '⌘' : 'Ctrl'}\\)`}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-3 hover:bg-ink/[0.06] hover:text-ink transition-colors">
                        <FiSidebar size={15} />
                    </button>
                )}
            </div>

            <div className="px-2">
                <button type="button" onClick={onSearch} className={rowClass(false)}>
                    <FiSearch size={16} className="text-ink-3" />
                    <span className="flex-1">Search</span>
                    <span className="text-[11px] text-ink-4 font-mono">{isMac ? '⌘K' : 'Ctrl K'}</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3">
                {sections.map((section, index) => (
                    <div key={section.title ?? index} className="flex flex-col gap-[1px]">
                        {section.title && <div className="px-2 pt-5 pb-1 text-[12px] font-medium text-ink-3">{section.title}</div>}
                        {section.items.map((item) => {
                            const count = badge(item.badge)
                            const active = isActive(item.path, pathname)
                            return (
                                <button key={item.path} type="button" className={rowClass(active)} aria-current={active ? 'page' : undefined}
                                    onClick={() => navigate(item.path)}>
                                    <item.icon size={16} className={active ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2'} />
                                    <span className="flex-1 truncate">{item.label}</span>
                                    {count > 0 && (
                                        <span className={`text-[11px] font-medium tabular-nums px-[6px] rounded-full leading-[18px]
                                            ${item.badge === 'flags' ? 'bg-tag-red-bg text-tag-red' : 'text-ink-3'}`}>{count}</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>

            <div className="relative shrink-0 border-t border-line px-2 py-2">
                <button type="button" className={`${rowClass(menu)} !h-10`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((value) => !value)}>
                    <PersonAvatar name={user?.name ?? '?'} color={user?.color ?? '#888'} size={24} />
                    <span className="flex flex-col min-w-0 flex-1 leading-tight">
                        <span className="truncate text-[13px] font-medium text-ink">{user?.name}</span>
                        <span className="truncate text-[12px] text-ink-3">{user?.role}</span>
                    </span>
                    <FiChevronsUp size={14} className="text-ink-3" />
                </button>
                <Menu open={menu} onClose={closeMenu} side="top" className="!left-2 !right-2">
                    {email && <div className="px-2 pt-[6px] pb-1 text-[12px] text-ink-3 truncate">{email}</div>}
                    <MenuLabel>Theme</MenuLabel>
                    <div className="px-1 pb-1"><ThemeSwitch wide /></div>
                    <MenuDivider />
                    <MenuItem role="menuitem" onClick={() => { closeMenu(); signOut().then(() => navigate('/login', { replace : true })) }}>
                        <FiLogOut size={14} /> Log out
                    </MenuItem>
                </Menu>
            </div>
        </nav>
    )
}

const Shell = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { pathname } = location
    const { unread, session, signOut } = useAdmin()
    const [collapsed, setCollapsed] = useState(readCollapsed)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [palette, setPalette] = useState(false)
    const closePalette = useCallback(() => setPalette(false), [])
    const current = currentNav(pathname)

    // Close the drawer on navigation, and start new screens at the top
    useEffect(() => {
        setMobileOpen(false)
        window.scrollTo(0, 0)
    }, [pathname])

    useEffect(() => {
        try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch { /* private mode */ }
    }, [collapsed])

    useEffect(() => { document.body.style.overflow = mobileOpen ? 'hidden' : '' }, [mobileOpen])

    // ⌘K (or "/" when not typing) opens search; ⌘\ collapses the sidebar
    useEffect(() => {
        const onKey = (event : KeyboardEvent) => {
            const typing = (event.target as HTMLElement)?.closest('input, textarea, select, [contenteditable="true"]')
            if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
                event.preventDefault()
                setPalette((value) => !value)
            }
            if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
                event.preventDefault()
                setCollapsed((value) => !value)
            }
            if (event.key === 'Escape') setMobileOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const logOut = async () => {
        await signOut()
        navigate('/login', { replace : true })
    }

    if (session.state === 'checking') return (
        <div className="min-h-screen flex items-center justify-center bg-canvas" aria-busy="true" aria-label="Loading">
            <div className="w-[220px] flex flex-col gap-3"><Skeleton height={14} width="60%" /><Skeleton height={10} /><Skeleton height={10} width="80%" /></div>
        </div>
    )
    if (session.state === 'signedOut') return <Navigate to={`/login?next=${encodeURIComponent(pathname + location.search)}`} replace />
    if (session.state === 'forbidden') return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-canvas">
            <div className="w-full max-w-[440px]">
                <EmptyState icon={FiLock} title="This account can't use the admin"
                    body={`${session.user.email} is a learner account. Ask an administrator for a staff invite, or sign in with a staff account.`}
                    action={<PrimaryButton onClick={logOut}>Sign in with another account</PrimaryButton>} />
            </div>
        </div>
    )

    const openSearch = () => { setMobileOpen(false); setPalette(true) }

    return (
        <div className="min-h-screen bg-canvas">
            {/* Desktop sidebar */}
            <aside
                className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[248px] bg-canvas transition-transform duration-300 ease-drawer"
                style={{ transform : collapsed ? 'translateX(-100%)' : 'none' }}
                aria-hidden={collapsed}
                {...(collapsed ? { inert : '' } as any : {})}
            >
                <Sidebar onCollapse={() => setCollapsed(true)} onSearch={openSearch} />
            </aside>

            {/* Phone drawer */}
            <div className={`lg:hidden fixed inset-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
                <div className={`absolute inset-0 bg-[rgb(15_15_15/0.4)] transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setMobileOpen(false)} />
                <div className="absolute inset-y-0 left-0 w-[286px] max-w-[86vw] bg-canvas shadow-float transition-transform duration-300 ease-drawer"
                    style={{ transform : mobileOpen ? 'none' : 'translateX(-100%)' }}>
                    <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"
                        className="absolute right-2 top-[10px] w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-3 hover:bg-ink/[0.06] z-10">
                        <FiX size={16} />
                    </button>
                    <Sidebar onSearch={openSearch} />
                </div>
            </div>

            {/* The page sits on an inset sheet */}
            <div className={`transition-[padding] duration-300 ease-drawer lg:py-2 lg:pr-2 ${collapsed ? 'lg:pl-2' : 'lg:pl-[248px]'}`}>
                <div className="bg-surface min-h-screen lg:min-h-[calc(100vh-16px)] lg:rounded-xl lg:border lg:border-line flex flex-col">
                    <header className="sticky top-0 lg:top-2 z-20 h-[48px] flex items-center gap-2 px-3 md:px-4 bg-surface/85 backdrop-blur-xl border-b border-line lg:rounded-t-xl">
                        <IconButton className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                            <FiMenu size={17} />
                        </IconButton>
                        {collapsed && (
                            <IconButton className="hidden lg:inline-flex" aria-label="Expand sidebar" title={`Expand sidebar (${isMac ? '⌘' : 'Ctrl'}\\)`} onClick={() => setCollapsed(false)}>
                                <FiSidebar size={15} />
                            </IconButton>
                        )}
                        <div className="flex items-center gap-[6px] text-[14px] min-w-0 text-ink-3">
                            {current?.section && <><span className="hidden sm:inline">{current.section}</span><FiChevronRight className="hidden sm:inline text-ink-4" size={13} /></>}
                            <strong className="text-ink font-medium truncate">{current?.label ?? 'Not found'}</strong>
                        </div>
                        <div className="flex-1" />
                        <button type="button" onClick={() => setPalette(true)}
                            className="hidden md:flex items-center gap-2 h-[30px] w-[240px] rounded-md pl-[10px] pr-[5px] text-[13px] text-ink-3 bg-canvas border border-line hover:border-line-strong hover:text-ink-2 transition-colors">
                            <FiSearch size={13} />
                            <span className="flex-1 text-left">Search…</span>
                            <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
                        </button>
                        <IconButton className="md:hidden" aria-label="Search" onClick={() => setPalette(true)}>
                            <FiSearch size={16} />
                        </IconButton>
                        <IconButton aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => navigate('/alerts/notification')}>
                            <FiBell size={16} />
                            {unread > 0 && <span className="absolute top-[6px] right-[6px] w-[7px] h-[7px] rounded-full bg-accent ring-2 ring-surface" />}
                        </IconButton>
                    </header>
                    <Outlet />
                </div>
            </div>

            <CommandMenu open={palette} onClose={closePalette} />
            <ToastContainer position="top-right" style={{ top : 60 }} hideProgressBar closeOnClick autoClose={3200} icon={false} />
        </div>
    )
}

export default Shell
