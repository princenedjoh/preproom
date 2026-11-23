import { useSyncExternalStore } from 'react'

// Light / dark / follow the system. The choice lives in localStorage "preproom-theme"
// (shared contract with admin); public/index.html applies it before first paint.

export type ThemeChoice = 'light' | 'dark' | 'system'
export type Resolved = 'light' | 'dark'

const KEY = 'preproom-theme'
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null
const listeners = new Set<() => void>()

const read = () : ThemeChoice => {
    try {
        const saved = localStorage.getItem(KEY)
        return saved === 'light' || saved === 'dark' ? saved : 'system'
    } catch { return 'system' }
}

let choice : ThemeChoice = read()
const resolve = (next : ThemeChoice) : Resolved => next === 'system' ? (media?.matches ? 'dark' : 'light') : next
let snapshot = { choice, resolved : resolve(choice) }

const apply = (animate : boolean) => {
    const root = document.documentElement
    const resolved = resolve(choice)
    // Cross-fade colours only for a deliberate switch, never on load
    if(animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        root.classList.add('theme-transition')
        window.setTimeout(() => root.classList.remove('theme-transition'), 220)
    }
    root.setAttribute('data-theme', resolved)
    snapshot = { choice, resolved }
    listeners.forEach((listener) => listener())
}

media?.addEventListener('change', () => { if(choice === 'system') apply(true) })
window.addEventListener('storage', (event) => {
    if(event.key === KEY){ choice = read(); apply(false) }
})

export const setTheme = (next : ThemeChoice) => {
    choice = next
    try { localStorage.setItem(KEY, next) } catch { /* private mode */ }
    apply(true)
}

export const toggleTheme = () => setTheme(snapshot.resolved === 'dark' ? 'light' : 'dark')

export const useTheme = () => useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    () => snapshot,
)
