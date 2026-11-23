import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FiMenu, FiSearch, FiBell, FiPlus, FiLogOut, FiChevronRight, FiLock } from 'react-icons/fi'
import { logos } from '../../assets'
import { useAdmin } from '../../context/admin'
import { DarkButton, Kbd } from '../../styles/kit'
import { IconButton, CountBadge } from '../../styles/adminKit'
import { PersonAvatar, EmptyState, Skeleton } from '../ui/ui'
import { navSections, isActive, currentNav } from './nav'
import * as s from './shell.style'

const Shell = () => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { openFlags, unread, session, user, can, signOut } = useAdmin()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const search = useRef<HTMLInputElement>(null)

    const current = currentNav(pathname)

    // Close the mobile drawer on navigation, and scroll new screens to the top
    useEffect(() => {
        setOpen(false)
        window.scrollTo(0, 0)
    }, [pathname])

    // ⌘K / Ctrl+K focuses search, "/" too when not typing
    useEffect(() => {
        const onKey = (event : KeyboardEvent) => {
            const typing = (event.target as HTMLElement)?.closest('input, textarea, [contenteditable="true"]')
            if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
                event.preventDefault()
                search.current?.focus()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const go = (path : string) => navigate(path)
    const logOut = async () => {
        await signOut()
        navigate('/login', { replace : true })
    }

    if (session.state === 'checking') return (
        <div className="min-h-screen flex items-center justify-center" aria-busy="true" aria-label="Loading">
            <div className="w-[220px] flex flex-col gap-3"><Skeleton height={14} width="60%" /><Skeleton height={10} /><Skeleton height={10} width="80%" /></div>
        </div>
    )
    if (session.state === 'signedOut') return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
    if (session.state === 'forbidden') return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-[440px]">
                <EmptyState icon={FiLock} title="This account can't use the admin"
                    body={`${session.user.email} is a learner account. Ask an administrator for a staff invite, or sign in with a staff account.`}
                    action={<DarkButton onClick={logOut}>Sign in with another account</DarkButton>} />
            </div>
        </div>
    )

    const sections = navSections.filter((section) => section.title !== 'People' || can.managePeople)
    const badge = (kind? : 'flags' | 'unread') => kind === 'flags' ? openFlags : kind === 'unread' ? unread : 0

    return (
        <s.Frame>
            <s.Scrim open={open} onClick={() => setOpen(false)} />
            <s.Sidebar open={open} aria-label="Admin navigation">
                <s.Brand onClick={() => go('/')}>
                    <img src={logos.logoMark} alt="" />
                    <span className="word">PrepRoom</span>
                    <s.AdminTag>Admin</s.AdminTag>
                </s.Brand>
                <s.Nav>
                    {sections.map((section, index) => (
                        <div key={section.title ?? index} className="flex flex-col gap-[2px]">
                            {section.title && <s.SectionLabel>{section.title}</s.SectionLabel>}
                            {section.items.map((item) => {
                                const count = badge(item.badge)
                                const active = isActive(item.path, pathname)
                                return (
                                    <s.NavLink
                                        key={item.path}
                                        active={active}
                                        aria-current={active ? 'page' : undefined}
                                        onClick={() => go(item.path)}
                                    >
                                        <item.icon size={15} />
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {count > 0 && <CountBadge tone={item.badge === 'flags' ? 'red' : 'ink'}>{count}</CountBadge>}
                                    </s.NavLink>
                                )
                            })}
                        </div>
                    ))}
                </s.Nav>
                <s.Account>
                    <PersonAvatar name={user?.name ?? '?'} color={user?.color ?? '#838383'} size={30} />
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-semibold text-ink truncate">{user?.name}</span>
                        <span className="text-[11px] text-ash">{user?.role}</span>
                    </div>
                    <IconButton aria-label="Log out" title="Log out" onClick={logOut}>
                        <FiLogOut size={14} />
                    </IconButton>
                </s.Account>
            </s.Sidebar>

            <s.Content>
                <s.Header>
                    <IconButton className="lg:hidden -ml-2" aria-label="Open navigation" onClick={() => setOpen(true)}>
                        <FiMenu size={18} />
                    </IconButton>
                    <s.Crumbs>
                        {current?.section && <><span className="hidden sm:inline">{current.section}</span><FiChevronRight className="hidden sm:inline" size={12} /></>}
                        <strong>{current?.label ?? 'Not found'}</strong>
                    </s.Crumbs>
                    <div className="flex-1" />
                    <s.HeaderSearch
                        role="search"
                        onSubmit={(event) => {
                            event.preventDefault()
                            navigate(`/questions?q=${encodeURIComponent(query.trim())}`)
                            search.current?.blur()
                        }}
                    >
                        <FiSearch size={14} />
                        <input
                            ref={search}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search questions"
                            aria-label="Search questions"
                        />
                        <Kbd>⌘K</Kbd>
                    </s.HeaderSearch>
                    <IconButton className="md:hidden" aria-label="Search questions" onClick={() => go('/questions')}>
                        <FiSearch size={16} />
                    </IconButton>
                    <IconButton aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => go('/alerts/notification')}>
                        <FiBell size={16} />
                        {unread > 0 && <span className="absolute top-[7px] right-[8px] w-[7px] h-[7px] rounded-full bg-brand-blue ring-2 ring-white" />}
                    </IconButton>
                    {pathname.toLowerCase() !== '/addquestions' && (
                        <DarkButton className="!px-4 !py-[8px] !text-[13px]" onClick={() => go('/addQuestions')}>
                            <FiPlus size={14} /> <span className="hidden sm:inline">New question</span>
                        </DarkButton>
                    )}
                </s.Header>
                <Outlet />
            </s.Content>
            <ToastContainer position="top-right" style={{ top : 68 }} hideProgressBar closeOnClick autoClose={3000} />
        </s.Frame>
    )
}

export default Shell
