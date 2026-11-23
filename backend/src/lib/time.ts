// Calendar-day helpers. Days are YYYY-MM-DD strings in the user's timezone.

export const dayIn = (timezone : string, date = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone : timezone, year : 'numeric', month : '2-digit', day : '2-digit' }).format(date)

export const addDays = (day : string, delta : number) => {
    const date = new Date(`${day}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + delta)
    return date.toISOString().slice(0, 10)
}

// Monday of the week containing `day`
export const weekStart = (day : string) => {
    const weekday = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7
    return addDays(day, -weekday)
}

export const isValidTimezone = (timezone : string) => {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone : timezone })
        return true
    } catch {
        return false
    }
}

// Current run of consecutive active days. Today not being active yet does not break it.
export const currentStreak = (days : Set<string>, today : string) => {
    let cursor = days.has(today) ? today : addDays(today, -1)
    let count = 0
    while (days.has(cursor)) {
        count += 1
        cursor = addDays(cursor, -1)
    }
    return count
}

export const bestStreak = (days : Iterable<string>) => {
    const sorted = Array.from(new Set(days)).sort()
    let best = 0
    let run = 0
    let previous : string | null = null
    for (const day of sorted) {
        run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1
        best = Math.max(best, run)
        previous = day
    }
    return best
}
