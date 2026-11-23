import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { FiMenu, FiX, FiMoon, FiSun, FiArrowRight } from 'react-icons/fi'
import { Wordmark } from '../brand/logo'
import SmoothScroll, { getLenis } from '../smoothScroll/smoothScroll'
import { useSession } from '../../store/session'
import { toggleTheme, useTheme } from '../../store/theme'
import * as kit from '../../styles/kit'
import "react-toastify/dist/ReactToastify.css"
import "../reactToastify/toastifyCustomStyles.css"

const links = [
    { label : 'Product', to : '/#product' },
    { label : 'Daily challenge', to : '/#challenge' },
    { label : 'About', to : '/about' },
]

// Marketing and auth pages: a slim translucent bar over the paper canvas
const SiteShell = ({ bare = false } : { bare? : boolean }) => {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const session = useSession()
    const { resolved } = useTheme()
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const signedIn = session.status === 'user'

    useEffect(() => { setOpen(false) }, [pathname])
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive : true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])
    useEffect(() => {
        const lenis = getLenis()
        open ? lenis?.stop() : lenis?.start()
        document.body.style.overflow = open ? 'hidden' : ''
    }, [open])

    return (
        <div className='min-h-screen bg-canvas'>
            <ToastContainer/>
            <SmoothScroll/>
            <header className={`fixed top-0 inset-x-0 z-30 h-[60px] flex justify-center px-4 md:px-6 transition-[background-color,border-color] duration-200
                ${scrolled || open ? 'bg-canvas/80 backdrop-blur-xl border-b border-line' : 'border-b border-transparent'}`}>
                <div className='w-full max-w-[1200px] flex items-center gap-6'>
                    <Link to='/' aria-label='PrepRoom home' className='rounded-md'><Wordmark/></Link>
                    {
                        !bare &&
                        <nav className='hidden md:flex items-center gap-1'>
                            {links.map((link) => (
                                <Link key={link.label} to={link.to} className='px-3 h-8 inline-flex items-center rounded-md text-[14px] text-ink-2 hover:text-ink hover:bg-ink/[0.04] transition-colors'>
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    }
                    <div className='ml-auto flex items-center gap-1'>
                        <kit.IconButton type='button' onClick={toggleTheme} aria-label={resolved === 'dark' ? 'Use light theme' : 'Use dark theme'} title='Theme'>
                            {resolved === 'dark' ? <FiSun size={16}/> : <FiMoon size={16}/>}
                        </kit.IconButton>
                        {
                            signedIn ?
                            <kit.PrimaryButton type='button' className='ml-1' onClick={()=>navigate('/today')}>Open PrepRoom <FiArrowRight size={15}/></kit.PrimaryButton>
                            :
                            <div className='hidden sm:flex items-center gap-1 ml-1'>
                                <kit.GhostButton type='button' onClick={()=>navigate('/auth/login')}>Log in</kit.GhostButton>
                                <kit.PrimaryButton type='button' onClick={()=>navigate('/auth/signup')}>Get PrepRoom free</kit.PrimaryButton>
                            </div>
                        }
                        {
                            !bare && !signedIn &&
                            <kit.IconButton type='button' className='sm:hidden' onClick={()=>setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
                                {open ? <FiX size={18}/> : <FiMenu size={18}/>}
                            </kit.IconButton>
                        }
                    </div>
                </div>
            </header>
            {
                open &&
                <div className='sm:hidden fixed inset-x-0 top-[60px] bottom-0 z-20 bg-canvas px-4 pt-4 pb-8 flex flex-col gap-1'>
                    {links.map((link) => (
                        <Link key={link.label} to={link.to} onClick={()=>setOpen(false)} className='h-12 flex items-center justify-between border-b border-line text-[17px] font-medium text-ink'>
                            {link.label} <FiArrowRight size={16} className='text-ink-3'/>
                        </Link>
                    ))}
                    <div className='grid grid-cols-2 gap-2 mt-auto'>
                        <kit.SecondaryButton type='button' className='!h-11' onClick={()=>navigate('/auth/login')}>Log in</kit.SecondaryButton>
                        <kit.PrimaryButton type='button' className='!h-11' onClick={()=>navigate('/auth/signup')}>Sign up</kit.PrimaryButton>
                    </div>
                </div>
            }
            <Outlet/>
        </div>
    )
}

export default SiteShell
