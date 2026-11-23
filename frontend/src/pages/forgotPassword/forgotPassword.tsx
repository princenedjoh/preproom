import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { AuthShell, Field, isEmail } from '../../components/auth/auth'
import { FiArrowLeft, FiMail } from "react-icons/fi";

const ForgotPassword = () => {

    const [email, setEmail] = useState('')
    const [touched, setTouched] = useState(false)
    const [sent, setSent] = useState(false)

    const submit = (event : FormEvent) => {
        event.preventDefault()
        setTouched(true)
        if(isEmail(email)) setSent(true)
    }

    return (
        <AuthShell
            title={sent ? 'Check your email' : 'Reset your password'}
            subtitle={sent ? `If an account exists for ${email.trim()}, we sent a link to reset your password.` : 'Enter the email you signed up with and we’ll send you a reset link.'}
            footer={<Link to='/auth/login' className='inline-flex items-center gap-1 text-[14px] font-semibold text-muted hover:text-ink'><FiArrowLeft size={14}/> Back to log in</Link>}
        >
            {
                sent ?
                <div className='flex flex-col items-center gap-4'>
                    <kit.IconTile className='!w-14 !h-14'><FiMail size={22}/></kit.IconTile>
                    <button type='button' onClick={()=>setSent(false)} className='text-[13px] font-semibold text-brand-blue hover:underline'>Use a different email</button>
                </div>
                :
                <form className='flex flex-col gap-4' onSubmit={submit} noValidate>
                    <Field label='Email' type='email' autoComplete='email' inputMode='email' autoFocus placeholder='you@school.edu'
                        value={email} onChange={(e)=>setEmail(e.target.value)} error={touched && !isEmail(email) ? 'Enter a valid email address' : null}/>
                    <kit.DarkButton type='submit' className='w-full h-[46px]'>Send reset link</kit.DarkButton>
                </form>
            }
        </AuthShell>
    )
}

export default ForgotPassword
