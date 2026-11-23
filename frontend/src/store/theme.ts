import { useSyncExternalStore } from 'react'

// PrepRoom is dark-only. The light tokens stay in tokens.css, but nothing switches to them.
export type ThemeChoice = 'dark'
export type Resolved = 'dark'

const snapshot = { choice : 'dark' as ThemeChoice, resolved : 'dark' as Resolved }
if(typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', 'dark')

export const useTheme = () => useSyncExternalStore(() => () => {}, () => snapshot)
