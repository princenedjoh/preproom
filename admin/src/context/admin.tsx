import { createContext, useContext, useState, ReactNode } from 'react'
import * as sample from '../data/sample'

// Admin-wide state that more than one screen reads: the flags queue and
// notifications drive sidebar badges, and newly saved questions show up
// in the question bank and overview without a refetch.

interface AdminState {
    flags : sample.Flag[]
    setFlagStatus : (id : string, status : sample.FlagStatus) => void
    notifications : sample.AdminNotification[]
    markRead : (id? : string) => void
    added : sample.Question[]
    addQuestion : (question : sample.Question) => void
    openFlags : number
    unread : number
}

const AdminContext = createContext<AdminState | null>(null)

export const AdminProvider = ({ children } : { children : ReactNode }) => {
    const [flags, setFlags] = useState(sample.flags)
    const [notifications, setNotifications] = useState(sample.notifications)
    const [added, setAdded] = useState<sample.Question[]>([])

    const setFlagStatus = (id : string, status : sample.FlagStatus) =>
        setFlags((current) => current.map((flag) => flag.id === id ? { ...flag, status } : flag))

    const markRead = (id? : string) =>
        setNotifications((current) => current.map((item) => !id || item.id === id ? { ...item, read : true } : item))

    const addQuestion = (question : sample.Question) => setAdded((current) => [question, ...current])

    return (
        <AdminContext.Provider value={{
            flags, setFlagStatus, notifications, markRead, added, addQuestion,
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
