import { useEffect, useState } from 'react'
import { Loaded } from '../data/sample'

// Loads a list once and keeps it editable locally, so screens can add and
// remove rows optimistically while the API catches up.
const useLoad = <T,>(fetcher : () => Promise<Loaded<T>>) => {
    const [items, setItems] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [live, setLive] = useState(true)

    useEffect(() => {
        let cancelled = false
        fetcher().then((result) => {
            if (cancelled) return
            setItems(result.items)
            setLive(result.live)
            setLoading(false)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { items, setItems, loading, live }
}

export default useLoad
