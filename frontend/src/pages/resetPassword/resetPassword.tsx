import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { api, toApiError } from '../../api/client'
import { boot } from '../../store/session'
import { AuthShell, Field, FormError, Spinner } from '../../components/auth/auth'
import { notify } from '../../utils/notify'
import { FiAlertCircle } from 'react-icons/fi'

// Password reset, and accepting a staff invite (same link with &invite=1)
const ResetPassword = () => {

    const navigate = useNavigate()
    const [params] = useSearchParams()
    const token = params.get('token') ?? ''
    const [info, setInfo] = useState<{ purpose : 'reset' | 'invite', email : string, firstName : string } | null>(null)
    const [invalid, setInvalid] = useState<string | null>(null)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [touched, setTouched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(()=>{
        if(!token){ setInvalid('This link is missing its token. Request a new one.'); return }
        api.get('/auth/token', { params : { token } })
            .then(({ data }) => setInfo(data))
            .catch((failure) => {
                const problem = toApiError(failure)
                setInvalid(problem.status === 410 ? 'This link has expired or was already used. Request a new one.' : problem.message)
            })
    },[token])

    const invite = info?.purpose === 'invite'
    const errors = {
        password : touched && password.length < 8 ? 'Use at least 8 characters' : null,
        confirm : touched && confirm !== password ? "Passwords don't match" : null,
    }

    const submit = async (event : FormEvent) => {
        event.preventDefault()
        setTouched(true)
        setError(null)
        if(password.length < 8 || confirm !== password) return
        setLoading(true)
        try {
            await api.post('/auth/reset', { token, password })
            await boot()
            notify(invite ? 'Welcome to the PrepRoom team' : 'Password updated')
            navigate('/today', { replace : true })
        } catch(failure) {
            setError(toApiError(failure).message)
        } finally {
            setLoading(false)
        }
    }

    if(invalid){
        return (
            <AuthShell title='Link not valid' subtitle={invalid}>
                <div className='flex flex-col items-center gap-4'>
                    <kit.IconTile className='!w-14 !h-14'><FiAlertCircle size={22}/></kit.IconTile>
                    <kit.DarkButton type='button' onClick={()=>navigate('/auth/forgot')}>Request a new link</kit.DarkButton>
                </div>
            </AuthShell>
        )
    }

    return (
        <AuthShell
            title={invite ? `Welcome, ${info?.firstName ?? ''}` : 'Choose a new password'}
            subtitle={!info ? 'Checking your link…' : invite ? `Set a password for ${info.email} to join the PrepRoom team.` : `For ${info.email}. You'll be signed out on other devices.`}
        >
            <form className='flex flex-col gap-4' onSubmit={submit} noValidate>
                {error && <FormError>{error}</FormError>}
                <Field label='New password' type='password' autoComplete='new-password' autoFocus disabled={!info}
                    value={password} onChange={(e)=>setPassword(e.target.value)} error={errors.password} hint='At least 8 characters'/>
                <Field label='Confirm password' type='password' autoComplete='new-password' disabled={!info}
                    value={confirm} onChange={(e)=>setConfirm(e.target.value)} error={errors.confirm}/>
                <kit.DarkButton type='submit' className='w-full h-[46px]' disabled={!info || loading} aria-busy={loading}>
                    {loading ? <><Spinner/> Saving</> : invite ? 'Set password and continue' : 'Update password'}
                </kit.DarkButton>
            </form>
        </AuthShell>
    )
}

export default ResetPassword
