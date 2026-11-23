import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { toast } from 'react-toastify'
import * as sample from '../data/sample'
import * as api from '../data/api'

// Admin-wide state: who is signed in (and what they may do), plus the flags
// queue and notifications that drive sidebar badges across screens.

export type Session =
    | { state : 'checking' }
    | { state : 'signedOut' }
    | { state : 'forbidden', user : api.StaffUser }   // a learner account
    | { state : 'live', user : api.StaffUser }
    | { state : 'offline' }                           // API unreachable: sample data

interface AdminState {
    session : Session
    refreshSession : () => Promise<void>
    signOut : () => Promise<void>
    user? : { name : string, role : string, color : string }
    can : { managePeople : boolean, editCatalog : boolean }
    flags : sample.Flag[]
    flagsLive : boolean
    setFlagStatus : (id : string, status : sample.FlagStatus, applyAnswer? : number) => Promise<void>
    notifications : sample.AdminNotification[]
    markRead : (id? : string) => void
    added : sample.Question[]
    addQuestion : (question : sample.Question) => void
    openFlags : number
    unread : number
}

const AdminContext = createContext<AdminState | null>(null)

const roleLabel = { student : 'Learner', moderator : 'Moderator', supervisor : 'Supervisor', admin : 'Administrator' }

export const AdminProvider = ({ children } : { children : ReactNode }) => {
    const [session, setSession] = useState<Session>({ state : 'checking' })
    const [flags, setFlags] = useState<sample.Flag[]>([])
    const [flagsLive, setFlagsLive] = useState(true)
    const [notifications, setNotifications] = useState<sample.AdminNotification[]>([])
    const [added, setAdded] = useState<sample.Question[]>([])

    const refreshSession = useCallback(async () => {
        try {
            const user = await api.me()
            setSession(user.role === 'student' ? { state : 'forbidden', user } : { state : 'live', user })
        } catch (error) {
            setSession(api.isOffline(error) ? { state : 'offline' } : { state : 'signedOut' })
        }
    }, [])

    useEffect(() => { refreshSession() }, [refreshSession])

    // Load the shared lists once we know whether we're live or on sample data
    useEffect(() => {
        if (session.state !== 'live' && session.state !== 'offline') return
        api.fetchFlags().then((result) => { setFlags(result.items); setFlagsLive(result.live) })
        api.fetchNotifications().then((result) => setNotifications(result.items))
    }, [session.state])

    const signOut = async () => {
        await api.logout().catch(() => undefined)
        setSession({ state : 'signedOut' })
        setFlags([])
        setNotifications([])
        setAdded([])
    }

    const setFlagStatus = async (id : string, status : sample.FlagStatus, applyAnswer? : number) => {
        const before = flags
        setFlags((current) => current.map((flag) => flag.id !== id ? flag : {
            ...flag, status,
            question : flag.question && applyAnswer !== undefined ? { ...flag.question, answer : applyAnswer } : flag.question,
        }))
        if (!flagsLive) return
        try {
            await api.updateFlag(id, { status, applyAnswer })
        } catch (error) {
            setFlags(before)
            toast.error(api.errorMessage(error))
            throw error
        }
    }

    const markRead = (id? : string) => {
        setNotifications((current) => current.map((item) => !id || item.id === id ? { ...item, read : true } : item))
        if (session.state === 'live') api.markNotificationsRead(id ? [id] : undefined).catch(() => undefined)
    }

    const addQuestion = (question : sample.Question) => setAdded((current) => [question, ...current])

    const role = session.state === 'live' ? session.user.role : 'admin'
    const user = session.state === 'live'
        ? { name : session.user.name, role : roleLabel[session.user.role], color : session.user.color }
        : session.state === 'offline' ? { name : 'Sample admin', role : 'Offline preview', color : '#838383' } : undefined

    return (
        <AdminContext.Provider value={{
            session, refreshSession, signOut, user,
            can : { managePeople : role === 'admin', editCatalog : role === 'admin' || role === 'supervisor' },
            flags, flagsLive, setFlagStatus, notifications, markRead, added, addQuestion,
            openFlags : flags.filter((flag) => flag.status === 'open').length,
            unread : notifications.filter((item) => !item.read).length,
        }}>
            {children}
        </AdminContext.Provider>
    )
}

export const useAdmin = () => {
    const context = useContext(AdminContext)
    if (!context) throw new Error('useAdmin must be used inside AdminProvider')
    return context
}
