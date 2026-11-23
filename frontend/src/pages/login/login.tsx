import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { toApiError } from '../../api/client'
import { login } from '../../store/session'
import { AuthShell, AuthSwitch, Field, FormError, Spinner, isEmail } from '../../components/auth/auth'
import { notify } from '../../utils/notify'
import { FiArrowRight } from 'react-icons/fi'

const Login = () => {

    const navigate = useNavigate()
    const from = (useLocation().state as { from? : string } | null)?.from ?? '/today'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [touched, setTouched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const emailError = touched && !isEmail(email) ? 'Enter a valid email address' : null
    const passwordError = touched && !password ? 'Enter your password' : null

    const submit = async (event : FormEvent) => {
        event.preventDefault()
        setTouched(true)
        setError(null)
        if(!isEmail(email) || !password) return
        setLoading(true)
        try {
            const user = await login(email.trim(), password)
            notify(`Welcome back, ${user.firstName}`)
            navigate(from, { replace : true })
        } catch(failure) {
            const problem = toApiError(failure)
            setError(problem.code === 'invalid_credentials' ? "That email and password don't match. Check them and try again."
                : problem.status === null ? "We couldn't reach PrepRoom. Check your connection, or keep practising without an account."
                : problem.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell
            title='Log in to PrepRoom'
            subtitle='Welcome back. Pick up where you left off.'
            footer={<AuthSwitch text='New to PrepRoom?' to='/auth/signup' label='Sign up'/>}
        >
            <form className='flex flex-col gap-4' onSubmit={submit} noValidate>
                {error && <FormError>{error}</FormError>}
                <Field label='Email' type='email' autoComplete='email' inputMode='email' placeholder='you@school.edu' autoFocus
                    value={email} onChange={(e)=>setEmail(e.target.value)} error={emailError}/>
                <Field label='Password' type='password' autoComplete='current-password' placeholder='Your password'
                    value={password} onChange={(e)=>setPassword(e.target.value)} error={passwordError}/>
                <Link to='/auth/forgot' className='self-end -mt-1 text-[13px] font-medium text-ink-3 hover:text-ink'>Forgot password?</Link>
                <kit.PrimaryButton type='submit' className='w-full !h-10' disabled={loading} aria-busy={loading}>
                    {loading ? <><Spinner/> Logging in</> : 'Log in'}
                </kit.PrimaryButton>
                <button type='button' onClick={()=>navigate('/today')} className='inline-flex items-center justify-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors'>
                    Continue without an account <FiArrowRight size={13}/>
                </button>
            </form>
        </AuthShell>
    )
}

export default Login
