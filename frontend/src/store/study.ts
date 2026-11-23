import { useSyncExternalStore } from 'react'

// Study setup from onboarding: the courses you're taking and a daily goal. Kept on this device.
export interface StudySetup {
    courses : string[]      // course slugs, in the order picked
    goal : number           // questions a day
    onboarded : boolean
}

const KEY = 'preproom.study.v1'
const listeners = new Set<() => void>()
const read = () : StudySetup => {
    try { return { courses : [], goal : 10, onboarded : false, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
    catch { return { courses : [], goal : 10, onboarded : false } }
}
let state = read()

export const setStudy = (patch : Partial<StudySetup>) => {
    state = { ...state, ...patch }
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
    listeners.forEach((listener) => listener())
}

export const getStudy = () => state
export const useStudy = () => useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    () => state,
)

// Your courses first, then the rest in catalog order
export const orderCourses = <T extends { id : string }>(courses : T[], picked : string[]) =>
    [...courses].sort((a, b) => {
        const ia = picked.indexOf(a.id), ib = picked.indexOf(b.id)
        return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)
    })
