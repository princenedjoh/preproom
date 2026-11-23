import { useSyncExternalStore } from 'react'
import { api, toApiError, isOffline } from '../api/client'
import { loadCatalog, slugOf, getCourse } from '../data/catalog'
import { progress, setRemote, TestRun, Prefs, ProfileInfo } from './progress'
import { notify } from '../utils/notify'

// Who is using the app. 'offline' means the API couldn't be reached, so the app
// runs on device-only progress until it can.

export interface User {
    id : string
    email : string
    firstName : string
    lastName : string
    name : string
    initials : string
    color : string
    role : 'student' | 'moderator' | 'supervisor' | 'admin'
    program : string | null
    school : string | null
    level : string | null
    timezone : string
    prefs : Prefs
}

interface SessionState {
    status : 'loading' | 'guest' | 'user' | 'offline'
    user : User | null
}

let state : SessionState = { status : 'loading', user : null }
const listeners = new Set<() => void>()
const set = (next : SessionState) => { state = next; listeners.forEach((listener) => listener()) }
const subscribe = (listener : () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

export const useSession = () => useSyncExternalStore(subscribe, () => state)
export const getSession = () => state

/* Server sync for the progress store: optimistic locally, then sent in the background */

const quietly = (request : Promise<unknown>, failure : string) => {
    request.catch((error) => {
        const problem = toApiError(error)
        if(problem.status === 401){ signedOut(); return }
        notify(problem.status === null ? `${failure}. You're offline, so it's only saved on this device.` : problem.message)
    })
}

const remote = {
    answer : (questionID : string, choice : number) => quietly(api.post(`/questions/${questionID}/attempts`, { choice }), "Couldn't save your answer"),
    save : (questionID : string, saved : boolean) => quietly(saved ? api.put(`/questions/${questionID}/save`) : api.delete(`/questions/${questionID}/save`), "Couldn't update saved questions"),
    clearAttempts : (courseID : string) => quietly(api.delete('/me/attempts', { params : { courseID : getCourse(courseID).uuid ?? courseID } }), "Couldn't reset progress"),
    markRead : (ids : string[] | null) => quietly(api.post('/notifications/read', ids ? { ids } : {}), "Couldn't update notifications"),
    setPrefs : (prefs : Partial<Prefs>) => quietly(api.patch('/me/prefs', prefs), "Couldn't save your preferences"),
    setProfile : (profile : Partial<ProfileInfo>) => {
        const { year, ...rest } = profile
        quietly(api.patch('/me', { ...rest, ...(year !== undefined ? { level : year } : {}) }), "Couldn't save your profile")
    },
}

export const toTestRun = (record : any) : TestRun => ({
    id : record.id,
    courseID : slugOf(record.courseID),
    mode : record.mode === 'practice' ? 'mcqs' : record.mode,
    title : record.title,
    score : record.score ?? 0,
    total : record.total ?? 0,
    seconds : record.seconds ?? 0,
    at : typeof record.at === 'number' ? record.at : new Date(record.submittedAt ?? record.at).getTime(),
    missed : record.missed ?? [],
})

const hydrate = async (user : User) => {
    await loadCatalog()
    const { data } = await api.get('/me/progress')
    const attempts = Object.fromEntries(Object.entries(data.attempts ?? {}).map(([id, attempt] : [string, any]) =>
        [id, { ...attempt, courseID : slugOf(attempt.courseID) }]))
    progress.hydrate({
        attempts,
        saved : data.saved ?? {},
        tests : (data.tests ?? []).map(toTestRun),
        activeDays : data.activeDays ?? [],
        prefs : user.prefs,
        profile : { name : user.name, program : user.program ?? '', school : user.school ?? '', year : user.level ?? '' },
    })
}

const signedIn = async (user : User) => {
    setRemote(remote)
    set({ status : 'user', user })
    try { await hydrate(user) } catch { /* keep local progress; screens still work */ }
}

const signedOut = () => {
    setRemote(null)
    set({ status : 'guest', user : null })
}

export const boot = async () => {
    try {
        const { data } = await api.get('/auth/me')
        await signedIn(data.user)
    } catch(error) {
        if(isOffline(error)) set({ status : 'offline', user : null })
        else signedOut()
    }
}

export const login = async (email : string, password : string) => {
    const { data } = await api.post('/auth/login', { email, password })
    await signedIn(data.user)
    return data.user as User
}

export const signup = async (payload : { firstName : string, lastName : string, email : string, password : string }) => {
    const { data } = await api.post('/auth/signup', payload)
    await signedIn(data.user)
    return data.user as User
}

export const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* cookie expires anyway */ }
    signedOut()
    progress.reset()
}

export const updateUser = (user : Partial<User>) => {
    if(state.user) set({ ...state, user : { ...state.user, ...user } })
}
