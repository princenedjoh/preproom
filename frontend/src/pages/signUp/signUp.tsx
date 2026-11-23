import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { toApiError } from '../../api/client'
import { signup } from '../../store/session'
import { AuthShell, AuthSwitch, Field, FormError, Spinner, isEmail } from '../../components/auth/auth'
import { notify } from '../../utils/notify'

const strength = (password : string) => {
    let score = 0
    if(password.length >= 8) score++
    if(password.length >= 12) score++
    if(/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if(/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++
    return score
}
const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['#f0457a', '#f0457a', '#fd9a46', '#0091ff', '#00c07a']

const SignUp = () => {

    const navigate = useNavigate()
    const [form, setForm] = useState({ firstName : '', lastName : '', email : '', password : '' })
    const [touched, setTouched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const set = (key : keyof typeof form) => (event : React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key] : event.target.value })

    const errors = {
        firstName : touched && !form.firstName.trim() ? 'Enter your first name' : null,
        lastName : touched && !form.lastName.trim() ? 'Enter your last name' : null,
        email : touched && !isEmail(form.email) ? 'Enter a valid email address' : null,
        password : touched && form.password.length < 8 ? 'Use at least 8 characters' : null,
    }
    const score = strength(form.password)

    const submit = async (event : FormEvent) => {
        event.preventDefault()
        setTouched(true)
        setError(null)
        if(!form.firstName.trim() || !form.lastName.trim() || !isEmail(form.email) || form.password.length < 8) return
        setLoading(true)
        const payload = { ...form, firstName : form.firstName.trim(), lastName : form.lastName.trim(), email : form.email.trim() }
        try {
            const user = await signup(payload)
            notify(`Welcome to PrepRoom, ${user.firstName}`)
            navigate('/today', { replace : true })
        } catch(failure) {
            const problem = toApiError(failure)
            setError(problem.code === 'conflict' ? 'An account with that email already exists. Try logging in instead.' : problem.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell
            title='Create your account'
            subtitle='Free past questions, timed tests and daily challenges.'
            footer={<AuthSwitch text='Already have an account?' to='/auth/login' label='Log in'/>}
        >
            <form className='flex flex-col gap-4' onSubmit={submit} noValidate>
                {error && <FormError>{error}</FormError>}
                <div className='grid grid-cols-2 gap-3'>
                    <Field label='First name' autoComplete='given-name' autoFocus value={form.firstName} onChange={set('firstName')} error={errors.firstName}/>
                    <Field label='Last name' autoComplete='family-name' value={form.lastName} onChange={set('lastName')} error={errors.lastName}/>
                </div>
                <Field label='Email' type='email' autoComplete='email' inputMode='email' placeholder='you@school.edu' value={form.email} onChange={set('email')} error={errors.email}/>
                <div className='flex flex-col gap-2'>
                    <Field label='Password' type='password' autoComplete='new-password' placeholder='At least 8 characters' value={form.password} onChange={set('password')} error={errors.password}/>
                    {
                        form.password && !errors.password &&
                        <div className='flex items-center gap-3' aria-live='polite'>
                            <div className='flex-1 grid grid-cols-4 gap-1'>
                                {[1, 2, 3, 4].map((step) => (
                                    <span key={step} className='h-[4px] rounded-full transition-colors duration-200' style={{ background : score >= step ? strengthColor[score] : '#eeeeee' }}/>
                                ))}
                            </div>
                            <span className='text-[12px] text-ash w-[60px] text-right'>{strengthLabel[score]}</span>
                        </div>
                    }
                </div>
                <kit.DarkButton type='submit' className='w-full h-[46px] mt-1' disabled={loading} aria-busy={loading}>
                    {loading ? <><Spinner/> Creating account</> : 'Create account'}
                </kit.DarkButton>
                <p className='text-[12px] leading-[1.5] text-ash text-center'>
                    By signing up you agree to our <Link to='/usage/terms' className='underline hover:text-ink'>Terms</Link> and <Link to='/usage/privacy' className='underline hover:text-ink'>Privacy Policy</Link>.
                </p>
            </form>
        </AuthShell>
    )
}

export default SignUp
