import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import * as kit from '../../styles/kit'
import { logos } from '../../assets'
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'

const spin = keyframes`to { transform : rotate(360deg); }`

export const Spinner = styled.span.attrs({ className : 'inline-block w-[15px] h-[15px] rounded-full' as string, 'aria-hidden' : true })`
    border : 2px solid rgba(255, 255, 255, 0.35);
    border-top-color : #ffffff;
    animation : ${spin} 600ms linear infinite;
`

// Shared frame for login, sign-up and password reset
export const AuthShell = ({ title, subtitle, children, footer } : { title : string, subtitle : string, children : ReactNode, footer? : ReactNode }) => (
    <main className='w-full min-h-screen flex flex-col items-center gap-6 pt-[112px] md:pt-[128px] pb-16 px-4 bg-white'>
        <div className='flex flex-col w-full max-w-[380px] items-center gap-3 text-center'>
            <Link to='/' aria-label='PrepRoom home'><img src={logos.logoMark} alt='' className='w-[44px] mb-2'/></Link>
            <h1 className='font-display font-bold text-[32px] md:text-[34px] leading-[1.15] tracking-[-0.035em] text-onyx'>{title}</h1>
            <p className='text-[15px] text-muted'>{subtitle}</p>
        </div>
        <div className='w-full max-w-[380px]'>{children}</div>
        {footer}
        <nav className='flex gap-5 text-[13px] text-ash'>
            <Link to='/usage/terms' className='hover:text-ink'>Terms</Link>
            <Link to='/usage/privacy' className='hover:text-ink'>Privacy</Link>
            <Link to='/contact' className='hover:text-ink'>Contact</Link>
        </nav>
    </main>
)

export const AuthSwitch = ({ text, to, label } : { text : string, to : string, label : string }) => (
    <div className='w-full max-w-[380px] h-[52px] flex gap-1 rounded-[12px] text-[14px] justify-center items-center text-muted border border-bone'>
        {text} <Link to={to} className='font-bold text-brand-blue hover:underline'>{label}</Link>
    </div>
)

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label : string
    hint? : string
    error? : string | null
}

export const Field = ({ label, hint, error, type, id, ...props } : FieldProps) => {
    const [visible, setVisible] = useState(false)
    const isPassword = type === 'password'
    const fieldID = id ?? `field-${label.toLowerCase().replace(/\W+/g, '-')}`
    return (
        <div className='flex flex-col gap-2 w-full'>
            <label htmlFor={fieldID} className='text-[13px] font-semibold text-ink'>{label}</label>
            <div className='relative'>
                <kit.TextInput
                    id={fieldID}
                    type={isPassword && visible ? 'text' : type}
                    aria-invalid={!!error}
                    aria-describedby={error || hint ? `${fieldID}-note` : undefined}
                    className={`${isPassword ? '!pr-11' : ''} ${error ? '!border-[#f0457a]' : ''}`}
                    {...props}
                />
                {
                    isPassword &&
                    <button
                        type='button'
                        onClick={()=>setVisible(!visible)}
                        aria-label={visible ? 'Hide password' : 'Show password'}
                        className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full text-ash hover:text-ink hover:bg-black/[0.04] transition-colors'
                    >
                        {visible ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
                    </button>
                }
            </div>
            {
                (error || hint) &&
                <span id={`${fieldID}-note`} className={`text-[12px] ${error ? 'text-[#d9365f] flex items-center gap-1' : 'text-ash'}`}>
                    {error && <FiAlertCircle size={12}/>}{error ?? hint}
                </span>
            }
        </div>
    )
}

export const FormError = ({ children } : { children : ReactNode }) => (
    <div role='alert' className='flex items-start gap-2 rounded-[9px] bg-[#fff1f4] border border-[#ffd3de] px-3 py-[10px] text-[13px] leading-[1.45] text-[#b42850]'>
        <FiAlertCircle size={14} className='mt-[2px] shrink-0'/> <span>{children}</span>
    </div>
)

export const isEmail = (value : string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
