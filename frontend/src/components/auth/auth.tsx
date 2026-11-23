import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import * as kit from '../../styles/kit'
import { Mark } from '../brand/logo'
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'

const spin = keyframes`to { transform : rotate(360deg); }`

export const Spinner = styled.span.attrs({ className : 'inline-block w-[15px] h-[15px] rounded-full' as string, 'aria-hidden' : true })`
    border : 2px solid rgba(255, 255, 255, 0.35);
    border-top-color : #ffffff;
    animation : ${spin} 600ms linear infinite;
`

// Shared frame for login, sign-up and password reset: one card on the canvas
export const AuthShell = ({ title, subtitle, children, footer } : { title : string, subtitle : string, children : ReactNode, footer? : ReactNode }) => (
    <main className='w-full min-h-screen flex flex-col items-center gap-5 pt-[96px] md:pt-[120px] pb-16 px-4 bg-canvas'>
        <div className='w-full max-w-[400px] rounded-lg bg-surface border border-line shadow-[0_2px_10px_rgb(0_0_0/0.04)] px-6 py-8 md:px-8 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2 text-center'>
                <Link to='/' aria-label='PrepRoom home' className='mb-2'><Mark size={40}/></Link>
                <h1 className='text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink'>{title}</h1>
                <p className='text-[14px] text-ink-3'>{subtitle}</p>
            </div>
            <div className='w-full'>{children}</div>
        </div>
        {footer}
        <nav className='flex gap-5 text-[12px] text-ink-3'>
            <Link to='/usage/terms' className='hover:text-ink'>Terms</Link>
            <Link to='/usage/privacy' className='hover:text-ink'>Privacy</Link>
            <Link to='/contact' className='hover:text-ink'>Contact</Link>
        </nav>
    </main>
)

export const AuthSwitch = ({ text, to, label } : { text : string, to : string, label : string }) => (
    <div className='w-full max-w-[400px] flex gap-1 text-[14px] justify-center items-center text-ink-3'>
        {text} <Link to={to} className='font-medium text-accent hover:underline'>{label}</Link>
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
            <label htmlFor={fieldID} className='text-[13px] font-medium text-ink-2'>{label}</label>
            <div className='relative'>
                <kit.TextInput
                    id={fieldID}
                    type={isPassword && visible ? 'text' : type}
                    aria-invalid={!!error}
                    aria-describedby={error || hint ? `${fieldID}-note` : undefined}
                    className={`${isPassword ? '!pr-11' : ''} ${error ? '!border-hard' : ''}`}
                    {...props}
                />
                {
                    isPassword &&
                    <button
                        type='button'
                        onClick={()=>setVisible(!visible)}
                        aria-label={visible ? 'Hide password' : 'Show password'}
                        className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-ink/[0.05] transition-colors'
                    >
                        {visible ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
                    </button>
                }
            </div>
            {
                (error || hint) &&
                <span id={`${fieldID}-note`} className={`text-[12px] ${error ? 'text-hard flex items-center gap-1' : 'text-ink-3'}`}>
                    {error && <FiAlertCircle size={12}/>}{error ?? hint}
                </span>
            }
        </div>
    )
}

export const FormError = ({ children } : { children : ReactNode }) => (
    <div role='alert' className='flex items-start gap-2 rounded-md bg-hard/10 border border-hard/25 px-3 py-[10px] text-[13px] leading-[1.45] text-hard'>
        <FiAlertCircle size={14} className='mt-[2px] shrink-0'/> <span>{children}</span>
    </div>
)

export const isEmail = (value : string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
