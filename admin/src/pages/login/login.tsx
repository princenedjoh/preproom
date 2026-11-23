import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { FiArrowRight, FiAlertCircle } from 'react-icons/fi'
import { Mark } from '../../components/brand/logo'
import * as api from '../../data/api'
import { useAdmin } from '../../context/admin'
import { PrimaryButton, Label, TextInput, Eyebrow, TextLink } from '../../styles/kit'

const Login = () => {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const next = params.get('next')?.startsWith('/') ? params.get('next')! : '/'
    const { session, refreshSession } = useAdmin()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [offline, setOffline] = useState(false)
    const [busy, setBusy] = useState(false)

    const submit = async (event : React.FormEvent) => {
        event.preventDefault()
        if (!email || !password) return setError('Enter your email and password.')
        setBusy(true)
        setError('')
        try {
            const user = await api.login(email, password)
            await refreshSession()
            if (user.role === 'student') setError('That’s a learner account. Admin access needs a staff invite.')
            else navigate(next, { replace : true })
        } catch (err) {
            setOffline(api.isOffline(err))
            setError(api.errorMessage(err))
        }
        setBusy(false)
    }

    if (session.state === 'live') return <Navigate to={next} replace />

    return (
        <main className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-canvas">
            <div className="w-full max-w-[400px] flex flex-col gap-6">
                <div className="flex items-center gap-2 justify-center">
                    <Mark size={24} />
                    <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">PrepRoom</span>
                    <span className="text-[13px] text-ink-3">Admin</span>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-5 rounded-xl bg-surface border border-line p-6 sm:p-8">
                    <div className="flex flex-col gap-1">
                        <Eyebrow>Admin</Eyebrow>
                        <h1 className="text-[24px] font-bold tracking-[-0.025em] text-ink leading-[1.2]">Sign in to manage PrepRoom</h1>
                    </div>
                    <Label>Email<TextInput type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@preproom.app" /></Label>
                    <Label>Password<TextInput type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></Label>
                    {error && (
                        <p role="alert" className="flex items-start gap-2 text-[13px] text-tag-red font-medium">
                            <FiAlertCircle size={15} className="mt-[1px] shrink-0" /> {error}
                        </p>
                    )}
                    <PrimaryButton type="submit" disabled={busy} className="w-full disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</PrimaryButton>
                    {offline && (
                        <TextLink type="button" className="self-center" onClick={async () => { await refreshSession(); navigate(next) }}>Continue with sample data <FiArrowRight size={14} /></TextLink>
                    )}
                </form>
                <p className="text-center text-[12px] text-ink-3">Admin access is by invitation. Ask a supervisor for an invite.</p>
            </div>
        </main>
    )
}

export default Login
