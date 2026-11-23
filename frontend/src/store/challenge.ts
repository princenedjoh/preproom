import { api } from '../api/client'
import { useRemote } from '../api/useRemote'
import { useCatalog, getCourse } from '../data/catalog'
import { leaderboard as sampleBoard } from '../data/sample'
import { useSession } from './session'
import { useProgress, summarize, dayKey, dailyIndex, challengeToday, weekPoints, initialsOf, relativeDay } from './progress'

// One shape for the daily challenge screen, from the server when signed in and
// from on-device progress otherwise.

export interface ChallengeView {
    ready : boolean
    synced : boolean
    course : { id : string, code : string, name : string, color : string }
    title : string
    minutes : number
    count : number
    players : number | null
    recentPlayers : { initials : string, color : string }[]
    status : 'not_started' | 'in_progress' | 'done'
    result : { score : number, total : number, rank : number | null, testID : string | null, missed : number } | null
    streak : { current : number, best : number, activeToday : boolean, week : { label : string, active : boolean, today : boolean, future : boolean }[] }
    board : { key : string, rank : number, initials : string, name : string, school : string, score : number, color : string, you : boolean }[]
    you : { rank : number | null, score : number }
    recent : { key : string, when : string, score : number, total : number, course : string, note : string }[]
    scoring : string
}

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const labelOf = (day : string) => labels[(new Date(`${day}T12:00:00`).getDay() + 6) % 7]

export const useChallengeView = () : ChallengeView => {
    const session = useSession()
    const synced = session.status === 'user'
    const { courses } = useCatalog()
    const state = useProgress()

    const today = useRemote(synced ? 'challenge:today' : null, () => api.get('/challenges/today').then((r) => r.data))
    const board = useRemote(synced ? 'challenge:board' : null, () => api.get('/challenges/leaderboard', { params : { period : 'week', limit : 8 } }).then((r) => r.data))
    const streak = useRemote(synced ? 'challenge:streak' : null, () => api.get('/challenges/streak').then((r) => r.data))
    const recent = useRemote(synced ? 'challenge:recent' : null, () => api.get('/challenges/recent', { params : { limit : 4 } }).then((r) => r.data))

    if(synced && today.data){
        const t = today.data
        const course = getCourse(t.course.slug)
        return {
            ready : true,
            synced,
            course : { id : course.id, code : t.course.code, name : t.course.name, color : t.course.color },
            title : t.title,
            minutes : t.minutes,
            count : t.questionCount,
            players : t.players,
            recentPlayers : t.recentPlayers ?? [],
            status : t.me?.status ?? 'not_started',
            result : t.me?.status === 'done' ? { score : t.me.score, total : t.questionCount, rank : t.me.rank, testID : t.me.testID, missed : t.questionCount - t.me.score } : null,
            streak : {
                current : streak.data?.current ?? 0,
                best : streak.data?.best ?? 0,
                activeToday : streak.data?.activeToday ?? false,
                week : (streak.data?.week ?? []).map((day : any) => ({ label : labelOf(day.day), active : day.active, today : day.isToday, future : day.future })),
            },
            board : (board.data?.entries ?? []).map((entry : any) => ({
                key : entry.userID, rank : entry.rank, initials : entry.initials, name : entry.isMe ? 'You' : entry.name, school : entry.school ?? '', score : entry.score, color : entry.color, you : entry.isMe,
            })),
            you : { rank : board.data?.me?.rank ?? null, score : board.data?.me?.score ?? 0 },
            recent : (recent.data?.items ?? []).map((item : any) => ({
                key : item.testID, when : relativeDay(new Date(`${item.day}T12:00:00`).getTime()), score : item.score, total : item.total,
                course : item.courseName, note : item.rank ? `Ranked #${item.rank} that day` : 'Not ranked',
            })),
            scoring : 'Each correct answer scores 100, plus up to 50 for speed.',
        }
    }

    // On this device
    const stats = summarize(state)
    const course = courses[dailyIndex(courses.length)]
    const done = challengeToday(state)
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const you = { initials : initialsOf(state.profile.name || 'You'), name : 'You', school : state.profile.school, score : weekPoints(state), color : '#202020', you : true }
    const ranked = [...sampleBoard.map((person) => ({ ...person, you : false })), you].sort((a, b) => b.score - a.score)
    return {
        ready : !synced || !today.loading,
        synced : false,
        course,
        title : `${course.name}.`,
        minutes : 10,
        count : 5,
        players : null,
        recentPlayers : sampleBoard.slice(0, 4),
        status : done ? 'done' : 'not_started',
        result : done ? { score : done.score, total : done.total, rank : null, testID : null, missed : done.missed.length } : null,
        streak : {
            current : stats.streak, best : stats.best, activeToday : stats.activeToday,
            week : labels.map((label, index) => {
                const date = new Date(monday)
                date.setDate(monday.getDate() + index)
                const key = dayKey(date)
                return { label, active : state.activeDays.includes(key), today : key === dayKey(), future : key > dayKey() }
            }),
        },
        board : ranked.map((person, index) => ({ key : person.you ? 'you' : person.initials, rank : index + 1, initials : person.initials, name : person.name, school : person.school, score : person.score, color : person.color, you : person.you })),
        you : { rank : ranked.findIndex((person) => person.you) + 1, score : you.score },
        recent : state.tests.filter((run) => run.mode === 'challenge').slice(0, 4).map((run) => ({
            key : run.id, when : relativeDay(run.at), score : run.score, total : run.total, course : run.title.replace('Daily challenge · ', ''), note : `${run.score * 40} points`,
        })),
        scoring : 'Challenges score 40 points per correct answer, practice tests 10. Log in to compete on the real board.',
    }
}
