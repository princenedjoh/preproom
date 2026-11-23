import { notifications as seeded, Notification } from '../data/sample'
import { ProgressState, useProgress, relativeDay, summarize, dayKey } from './progress'

export type AppNotification = Notification & { route : string }

const routes : Record<Notification['kind'], string> = {
    reply : '/questions', challenge : '/challenges', streak : '/challenges', result : '/test/testconfig', system : '/questions',
}

const groupFor = (time : number) : Notification['group'] => {
    const days = Math.round((new Date(dayKey()).getTime() - new Date(dayKey(new Date(time))).getTime()) / 86400000)
    return days <= 0 ? 'Today' : days < 7 ? 'This week' : 'Earlier'
}

// Real events from your own activity, newest first, followed by the sample inbox
export const buildNotifications = (state : ProgressState) : AppNotification[] => {
    const fromTests : AppNotification[] = state.tests.slice(0, 5).map((run) => ({
        id : `run-${run.id}`,
        kind : 'result',
        title : run.mode === 'challenge' ? 'Daily challenge scored' : 'Test graded',
        body : `You scored ${run.score}/${run.total} on ${run.title}.${run.missed.length ? ` ${run.missed.length} to review.` : ' Perfect score.'}`,
        time : relativeDay(run.at) === 'Today' ? new Date(run.at).toLocaleTimeString([], { hour : 'numeric', minute : '2-digit' }) : relativeDay(run.at),
        group : groupFor(run.at),
        unread : !state.read[`run-${run.id}`],
        route : `/questions/${run.courseID}${run.missed.length ? '?status=mistakes' : ''}`,
    }))

    const { streak } = summarize(state)
    const streakNote : AppNotification[] = streak >= 3 ? [{
        id : `streak-${streak}`,
        kind : 'streak',
        title : `You reached a ${streak}-day streak`,
        body : 'Answer a question every day to keep it going.',
        time : 'Today',
        group : 'Today',
        unread : !state.read[`streak-${streak}`],
        route : '/challenges',
    }] : []

    const sample : AppNotification[] = seeded.map((item) => ({ ...item, unread : item.unread && !state.read[item.id], route : routes[item.kind] }))
    return [...streakNote, ...fromTests, ...sample]
}

export const useNotifications = () => buildNotifications(useProgress())
