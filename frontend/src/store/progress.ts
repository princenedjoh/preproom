import { useSyncExternalStore } from 'react'
import { getQuestion, getCourse } from '../data/catalog'

// The learner's own progress, kept on this device so the app works end to end
// without the backend: answers, saved questions, finished tests, streak days,
// notification read state and profile settings.

export interface Attempt {
    choice : number
    correct : boolean
    courseID : string
    topic : string
    at : number
}

export interface TestRun {
    id : string
    courseID : string
    mode : string
    title : string
    score : number
    total : number
    seconds : number
    at : number
    missed : string[]
}

export interface Prefs {
    dailyReminder : boolean
    replies : boolean
    weeklyReport : boolean
}

export interface ProfileInfo {
    name : string
    program : string
    school : string
    year : string
}

export interface ProgressState {
    version : 1
    attempts : Record<string, Attempt>
    saved : Record<string, number>
    tests : TestRun[]
    activeDays : string[]
    read : Record<string, true>
    prefs : Prefs
    profile : ProfileInfo
}

const KEY = 'preproom.progress.v1'

const initial : ProgressState = {
    version : 1,
    attempts : {},
    saved : {},
    tests : [],
    activeDays : [],
    read : {},
    prefs : { dailyReminder : true, replies : true, weeklyReport : false },
    // Empty until the learner fills it in or logs in
    profile : { name : '', program : '', school : '', year : '' },
}

const load = () : ProgressState => {
    try {
        const raw = window.localStorage.getItem(KEY)
        if(!raw) return initial
        const parsed = JSON.parse(raw)
        if(parsed?.version !== 1) return initial
        return { ...initial, ...parsed, prefs : { ...initial.prefs, ...parsed.prefs }, profile : { ...initial.profile, ...parsed.profile } }
    } catch {
        return initial
    }
}

let state : ProgressState = load()
const listeners = new Set<() => void>()

const commit = (next : ProgressState) => {
    state = next
    try { window.localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode or full storage: keep in memory */ }
    listeners.forEach((listener) => listener())
}

const subscribe = (listener : () => void) => {
    listeners.add(listener)
    // Keep several open tabs in sync
    const onStorage = (event : StorageEvent) => {
        if(event.key !== KEY) return
        state = load()
        listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
    }
}

export const useProgress = () => useSyncExternalStore(subscribe, () => state)
export const getProgress = () => state

/* Dates */

export const dayKey = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
}

const markActive = (days : string[]) => {
    const today = dayKey()
    return days.includes(today) ? days : [...days, today].slice(-400)
}

export const streakOf = (days : string[]) => {
    const set = new Set(days)
    const cursor = new Date()
    // A streak survives until the end of today even if today has no activity yet
    if(!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    let count = 0
    while(set.has(dayKey(cursor))){
        count += 1
        cursor.setDate(cursor.getDate() - 1)
    }
    return count
}

export const bestStreakOf = (days : string[]) => {
    const sorted = Array.from(new Set(days)).sort()
    let best = 0
    let run = 0
    let previous : number | null = null
    sorted.forEach((day) => {
        const time = new Date(day).getTime()
        run = previous !== null && time - previous === 86400000 ? run + 1 : 1
        best = Math.max(best, run)
        previous = time
    })
    return best
}

/* Server sync: set by the session when someone is logged in */

export interface RemoteSync {
    answer(questionID : string, choice : number) : void
    save(questionID : string, saved : boolean) : void
    clearAttempts(courseID : string) : void
    markRead(ids : string[] | null) : void
    setPrefs(prefs : Partial<Prefs>) : void
    setProfile(profile : Partial<ProfileInfo>) : void
}
let remote : RemoteSync | null = null
export const setRemote = (next : RemoteSync | null) => { remote = next }
export const isSynced = () => remote !== null

/* Actions */

export const progress = {
    answer(questionID : string, attempt : Omit<Attempt, 'at'>){
        commit({
            ...state,
            attempts : { ...state.attempts, [questionID] : { ...attempt, at : Date.now() } },
            activeDays : markActive(state.activeDays),
        })
        remote?.answer(questionID, attempt.choice)
    },
    clearAttempt(questionID : string){
        const attempts = { ...state.attempts }
        delete attempts[questionID]
        commit({ ...state, attempts })
    },
    clearAttempts(courseID : string){
        const attempts = Object.fromEntries(Object.entries(state.attempts).filter(([, attempt]) => attempt.courseID !== courseID))
        commit({ ...state, attempts })
        remote?.clearAttempts(courseID)
    },
    toggleSave(questionID : string){
        const saved = { ...state.saved }
        const next = !saved[questionID]
        if(next) saved[questionID] = Date.now()
        else delete saved[questionID]
        commit({ ...state, saved })
        remote?.save(questionID, next)
    },
    // Answered test questions also count as attempts, so misses show up under Mistakes
    recordTest(run : Omit<TestRun, 'id' | 'at'>, answered : Record<string, Omit<Attempt, 'at'>> = {}){
        const at = Date.now()
        const entry : TestRun = { ...run, id : `t${at}`, at }
        const attempts = { ...state.attempts }
        Object.entries(answered).forEach(([questionID, attempt]) => { attempts[questionID] = { ...attempt, at } })
        commit({ ...state, attempts, tests : [entry, ...state.tests].slice(0, 100), activeDays : markActive(state.activeDays) })
        return entry
    },
    markRead(ids : string[]){
        const read = { ...state.read }
        ids.forEach((id) => { read[id] = true })
        commit({ ...state, read })
        remote?.markRead(ids)
    },
    setPrefs(prefs : Partial<Prefs>){
        commit({ ...state, prefs : { ...state.prefs, ...prefs } })
        remote?.setPrefs(prefs)
    },
    setProfile(profile : Partial<ProfileInfo>){
        commit({ ...state, profile : { ...state.profile, ...profile } })
        remote?.setProfile(profile)
    },
    // A test graded by the server: add it to history without re-sending anything
    addTest(run : TestRun, answered : Record<string, Omit<Attempt, 'at'>> = {}){
        const attempts = { ...state.attempts }
        Object.entries(answered).forEach(([questionID, attempt]) => { attempts[questionID] = { ...attempt, at : run.at } })
        commit({ ...state, attempts, tests : [run, ...state.tests.filter((test) => test.id !== run.id)].slice(0, 100), activeDays : markActive(state.activeDays) })
    },
    // Replace local progress with the account's, after logging in
    hydrate(next : Pick<ProgressState, 'attempts' | 'saved' | 'tests' | 'activeDays'> & { prefs? : Prefs, profile? : ProfileInfo }){
        commit({ ...initial, ...next, read : state.read, prefs : next.prefs ?? state.prefs, profile : next.profile ?? state.profile })
    },
    reset(){
        commit(initial)
    },
}

/* Derived */

export const initialsOf = (name : string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'PR'

export const summarize = (current : ProgressState) => {
    const attempts = Object.values(current.attempts)
    const correct = attempts.filter((attempt) => attempt.correct).length
    return {
        solved : attempts.length,
        accuracy : attempts.length ? Math.round(correct / attempts.length * 100) : 0,
        tests : current.tests.length,
        streak : streakOf(current.activeDays),
        best : bestStreakOf(current.activeDays),
        activeToday : current.activeDays.includes(dayKey()),
    }
}

export const relativeDay = (time : number) => {
    const days = Math.round((new Date(dayKey()).getTime() - new Date(dayKey(new Date(time))).getTime()) / 86400000)
    if(days <= 0) return 'Today'
    if(days === 1) return 'Yesterday'
    if(days < 7) return `${days} days ago`
    return new Date(time).toLocaleDateString(undefined, { month : 'short', day : 'numeric' })
}

export const courseProgress = (current : ProgressState, courseID : string, total : number) => {
    const attempts = Object.values(current.attempts).filter((attempt) => attempt.courseID === courseID)
    const correct = attempts.filter((attempt) => attempt.correct).length
    return {
        answered : attempts.length,
        correct,
        percent : total ? Math.min(100, Math.round(attempts.length / total * 100)) : 0,
        accuracy : attempts.length ? Math.round(correct / attempts.length * 100) : 0,
    }
}

// Topics where the learner gets most wrong, across practice and tests
export const weakTopics = (current : ProgressState) => {
    const byTopic : Record<string, { courseID : string, correct : number, total : number }> = {}
    Object.values(current.attempts).forEach((attempt) => {
        const key = `${attempt.courseID}:${attempt.topic}`
        byTopic[key] = byTopic[key] ?? { courseID : attempt.courseID, correct : 0, total : 0 }
        byTopic[key].total += 1
        if(attempt.correct) byTopic[key].correct += 1
    })
    return Object.entries(byTopic)
        .map(([key, value]) => ({ topic : key.split(':').slice(1).join(':'), ...value, accuracy : Math.round(value.correct / value.total * 100) }))
        .filter((item) => item.accuracy < 100)
        .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
}

/* Daily challenge: the same course and questions for everyone on a given day */

const hash = (text : string) => {
    let value = 2166136261
    for(let index = 0; index < text.length; index++){
        value ^= text.charCodeAt(index)
        value = Math.imul(value, 16777619)
    }
    return value >>> 0
}

export const seededShuffle = <T,>(items : T[], seed : string) => {
    let state = hash(seed) || 1
    const random = () => {
        state ^= state << 13; state ^= state >>> 17; state ^= state << 5
        return (state >>> 0) / 4294967296
    }
    const copy = [...items]
    for(let index = copy.length - 1; index > 0; index--){
        const swap = Math.floor(random() * (index + 1))
        ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
    }
    return copy
}

export const dailyIndex = (count : number, day = dayKey()) => hash(`course:${day}`) % count

export const challengeToday = (current : ProgressState) =>
    current.tests.find((run) => run.mode === 'challenge' && dayKey(new Date(run.at)) === dayKey())

export const weekPoints = (current : ProgressState) => {
    const monday = new Date()
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    return current.tests
        .filter((run) => run.at >= monday.getTime())
        .reduce((sum, run) => sum + run.score * (run.mode === 'challenge' ? 40 : 10), 0)
}

// The course to open for "Saved" or "Mistakes": wherever the most recent one lives
export const reviewLink = (kind : 'saved' | 'mistakes', current : ProgressState = state) => {
    const courseID = kind === 'saved'
        ? Object.entries(current.saved).sort((a, b) => b[1] - a[1]).map(([id]) => getQuestion(id)?.courseID).find(Boolean)
        : Object.values(current.attempts).filter((attempt) => !attempt.correct).sort((a, b) => b.at - a.at)[0]?.courseID
    return `/questions/${getCourse(courseID).id}?status=${kind}`
}
