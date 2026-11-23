import { useCallback, useEffect, useRef, useState } from 'react'

// Fetch-on-mount with a small shared cache: shows the last value instantly when you
// come back to a screen, refetches in the background, and again when the tab regains focus.
const cache = new Map<string, unknown>()

export const useRemote = <T,>(key : string | null, fetcher : () => Promise<T>) => {
    const [data, setData] = useState<T | undefined>(() => key ? cache.get(key) as T | undefined : undefined)
    const [error, setError] = useState<unknown>(null)
    const [loading, setLoading] = useState(!!key && !cache.has(key))
    const latest = useRef(fetcher)
    latest.current = fetcher

    const refresh = useCallback(() => {
        if(!key) return Promise.resolve()
        return latest.current()
            .then((value) => { cache.set(key, value); setData(value); setError(null) })
            .catch(setError)
            .finally(() => setLoading(false))
    },[key])

    useEffect(()=>{
        if(!key){ setData(undefined); setLoading(false); return }
        setData(cache.get(key) as T | undefined)
        setLoading(!cache.has(key))
        refresh()
        const onFocus = () => { if(document.visibilityState === 'visible') refresh() }
        document.addEventListener('visibilitychange', onFocus)
        return () => document.removeEventListener('visibilitychange', onFocus)
    },[key, refresh])

    return { data, error, loading, refresh }
}

export const invalidate = (prefix : string) => {
    Array.from(cache.keys()).forEach((key) => { if(key.startsWith(prefix)) cache.delete(key) })
}
