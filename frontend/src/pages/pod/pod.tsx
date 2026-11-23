import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { useChallengeView } from '../../store/challenge'
import { loadResult } from '../test/engine'
import { TestConfigState } from '../test/pages/testConfig/testConfig'
import { FiArrowRight, FiClock, FiCheck, FiZap, FiAward } from "react-icons/fi";
import CourseIcon from '../../components/courseIcon/courseIcon'
import { PageHero } from '../../components/premium/premium'
import { useProgress, dayKey } from '../../store/progress'
import { toneOf, toneVar } from '../../styles/tone'

const untilMidnight = () => {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const total = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`
}

export const startChallenge = (navigate : ReturnType<typeof useNavigate>, courseID : string) => {
    const config : TestConfigState = { courseID, mode : 'challenge', count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false }
    navigate('/test/session', { state : config })
}

const Pod = () => {

    const navigate = useNavigate()
    const view = useChallengeView()
    const state = useProgress()
    const [countdown, setCountdown] = useState(untilMidnight)
    const done = view.result

    useEffect(()=>{
        const id = window.setInterval(() => setCountdown(untilMidnight()), 30000)
        return () => window.clearInterval(id)
    },[])

    const openResult = async () => {
        if(done?.testID){
            const result = await loadResult(done.testID).catch(() => null)
            if(result) return navigate('/test/results', { state : result })
        }
        navigate(`/questions/${view.course.id}${done?.missed ? '?status=mistakes' : ''}`)
    }

    const streak = view.streak
    const streakNote = streak.current === 0 ? 'Answer a question today to start a streak'
        : !streak.activeToday ? 'Practise today to keep it alive'
        : streak.current >= streak.best ? 'Your best streak yet'
        : `${streak.best - streak.current} more day${streak.best - streak.current === 1 ? '' : 's'} to beat your best`

    // This month as a small calendar: practised days filled, today outlined (LeetCode-style)
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const lead = (first.getDay() + 6) % 7
    const activeDays = new Set(state.activeDays)
    const key = (day : number) => dayKey(new Date(now.getFullYear(), now.getMonth(), day))
    const pinned = view.board.find((person) => person.you)
    const top = view.board.slice(0, 10)

    return (
        <main className='w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-10 md:pt-14 pb-24 flex flex-col gap-8'>
                <PageHero
                    tone='medium'
                    eyebrow={<span className='text-medium inline-flex items-center gap-2'><FiZap size={13} fill='currentColor'/> Daily challenge</span>}
                    title='Five questions. Every day.'
                    sub='The same set for everyone, new at midnight. Ranked by score, then speed.'
                    right={
                        <div className='flex items-center gap-4 shrink-0'>
                            <span className={`w-16 h-16 rounded-full inline-flex items-center justify-center ${streak.activeToday ? 'bg-medium/15 text-medium' : 'bg-white/[0.05] text-ink-4'}`} >
                                <FiZap size={26} fill={streak.activeToday ? 'currentColor' : 'none'}/>
                            </span>
                            <span className='flex flex-col'>
                                <span className='text-[30px] font-semibold tracking-[-0.04em] text-ink tabular-nums leading-none'>{streak.current}</span>
                                <span className='text-[12px] text-ink-3 mt-1'>day streak · best {Math.max(streak.best, streak.current)}</span>
                            </span>
                        </div>
                    }
                />

                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start'>
                    <div className='flex flex-col gap-6 min-w-0'>
                        <section className='relative overflow-hidden rounded-xl border border-line bg-surface shadow-card p-6 md:p-7 flex flex-col gap-6' aria-busy={!view.ready} aria-label="Today's challenge">
                            <div className='relative flex flex-wrap items-center justify-between gap-3'>
                                <span className='inline-flex items-center gap-2 text-[13px] text-ink-3'>
                                    {now.toLocaleDateString(undefined, { weekday : 'long', day : 'numeric', month : 'long' })}
                                </span>
                                <span className='inline-flex items-center gap-[6px] text-[13px] text-ink-3 tabular-nums'>
                                    <FiClock size={13}/> {done ? `Next set in ${countdown}` : `${countdown} left today`}
                                </span>
                            </div>
                            <div className='relative flex items-start gap-4'>
                                <CourseIcon course={view.course} size={56}/>
                                <div className='flex flex-col gap-1 min-w-0'>
                                    <span className='text-[13px] text-ink-3'>{view.course.code} · {view.count} questions · {view.minutes} min</span>
                                    <h2 className='text-[26px] md:text-[32px] font-semibold tracking-[-0.035em] leading-tight text-ink'>
                                        {done ? <>You scored <span className='tabular-nums'>{done.score}/{done.total}</span></> : view.title.replace(/\.$/, '')}
                                    </h2>
                                    <span className='text-[14px] text-ink-2'>
                                        {
                                            done ? (done.rank ? `Ranked #${done.rank} today. Come back tomorrow for a new set.` : 'Come back tomorrow for a new set.')
                                            : view.status === 'in_progress' ? 'You started this one. Finish before the clock runs out.'
                                            : 'Mixed difficulty, from recent past papers.'
                                        }
                                    </span>
                                </div>
                            </div>
                            <div className='relative flex flex-wrap items-center gap-4'>
                                {
                                    done ?
                                    <kit.SecondaryButton type='button' onClick={openResult}>
                                        {done.testID ? 'See your answers' : done.missed ? 'Review what you missed' : `Practise ${view.course.name}`} <FiArrowRight size={14}/>
                                    </kit.SecondaryButton>
                                    :
                                    <button type='button' disabled={!view.ready} onClick={()=>startChallenge(navigate, view.course.id)}
                                        className='h-10 px-5 inline-flex items-center gap-2 rounded-[5px] bg-medium text-[#1a1300] text-[14px] font-semibold hover:brightness-110 active:scale-[0.97] transition-[filter,transform] disabled:opacity-50'>
                                        {view.status === 'in_progress' ? 'Resume challenge' : 'Start challenge'} <FiArrowRight size={14}/>
                                    </button>
                                }
                                {
                                    view.recentPlayers.length > 0 &&
                                    <div className='flex items-center'>
                                        {view.recentPlayers.slice(0, 4).map((person, index) => (
                                            <kit.Avatar key={`${person.initials}${index}`} color={toneVar(toneOf(person.initials, person.color))} size={24}>{person.initials}</kit.Avatar>
                                        ))}
                                        <span className='ml-3 text-[13px] text-ink-3'>
                                            {view.players ? `${view.players.toLocaleString()} played today` : 'Same five for everyone'}
                                        </span>
                                    </div>
                                }
                            </div>
                        </section>

                        <section className='rounded-xl border border-line bg-surface shadow-card p-6 flex flex-col gap-5' aria-label='Streak'>
                            <div className='flex flex-wrap items-baseline justify-between gap-3'>
                                <div className='flex items-baseline gap-2'>
                                    <span className='text-[28px] font-semibold tracking-[-0.03em] text-ink tabular-nums leading-none'>{streak.current}</span>
                                    <span className='text-[14px] text-ink-2'>day streak</span>
                                </div>
                                <span className='text-[13px] text-ink-3'>{streakNote} · Best {Math.max(streak.best, streak.current)}</span>
                            </div>
                            <div className='grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-6 items-start'>
                                <div className='flex flex-col gap-2'>
                                    <span className='text-[12px] font-medium text-ink-3'>This week</span>
                                    <div className='grid grid-cols-7 gap-[6px]'>
                                        {streak.week.map((day) => (
                                            <div key={day.label} className='flex flex-col items-center gap-[6px]'>
                                                <span
                                                    className={`w-full max-w-[44px] aspect-square rounded-md flex items-center justify-center
                                                    ${day.active ? 'bg-tag-yellow-bg text-tag-yellow' : day.today ? 'border border-dashed border-tag-yellow/60 text-tag-yellow' : 'bg-subtle text-ink-4'}`}
                                                    aria-label={`${day.label}: ${day.active ? 'practised' : day.today ? 'today' : day.future ? 'upcoming' : 'missed'}`}
                                                >
                                                    {day.active ? <FiCheck size={15} strokeWidth={2.5}/> : day.today ? <FiZap size={14}/> : null}
                                                </span>
                                                <span className={`text-[11px] ${day.today ? 'font-semibold text-ink' : 'text-ink-3'}`}>{day.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className='flex flex-col gap-2' aria-label={now.toLocaleDateString(undefined, { month : 'long', year : 'numeric' })}>
                                    <span className='text-[12px] font-medium text-ink-3'>{now.toLocaleDateString(undefined, { month : 'long' })}</span>
                                    <div className='grid grid-cols-7 gap-[3px]'>
                                        {Array.from({ length : lead }).map((_, index) => <span key={`lead${index}`} className='w-[22px] h-[22px]'/>)}
                                        {Array.from({ length : daysInMonth }).map((_, index) => {
                                            const day = index + 1
                                            const isToday = day === now.getDate()
                                            const active = activeDays.has(key(day))
                                            return (
                                                <span key={day} title={key(day)}
                                                    className={`w-[22px] h-[22px] rounded-[5px] inline-flex items-center justify-center text-[10px] tabular-nums
                                                    ${active ? 'bg-tag-yellow text-white font-semibold' : day > now.getDate() ? 'text-ink-4' : 'text-ink-2'}
                                                    ${isToday ? 'ring-1 ring-ink ring-offset-1 ring-offset-surface' : ''}`}>
                                                    {day}
                                                </span>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className='flex flex-col gap-3' aria-label='Your recent challenges'>
                            <kit.Title>Recent</kit.Title>
                            {
                                view.recent.length === 0 ?
                                <kit.Empty className='!py-10'>
                                    <FiAward size={18}/>
                                    <span className='text-[15px] font-medium text-ink'>No challenges yet</span>
                                    <span className='text-[14px]'>Today's set takes about ten minutes.</span>
                                </kit.Empty>
                                :
                                <div className='rounded-xl border border-line bg-surface shadow-card overflow-hidden'>
                                    {view.recent.map((item) => (
                                        <div key={item.key} className='flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 text-[14px]'>
                                            <span className='w-[88px] shrink-0 text-ink-3'>{item.when}</span>
                                            <span className='flex-1 min-w-0 truncate text-ink'>{item.course}</span>
                                            <span className='hidden sm:block text-[13px] text-ink-3'>{item.note}</span>
                                            <kit.Tag tone={item.score === item.total ? 'green' : item.score >= item.total * 0.6 ? 'orange' : 'red'} className='tabular-nums'>{item.score}/{item.total}</kit.Tag>
                                        </div>
                                    ))}
                                </div>
                            }
                        </section>
                    </div>

                    <section className='rounded-xl border border-line bg-surface shadow-card lg:sticky lg:top-[74px] overflow-hidden' aria-label="This week's leaderboard">
                        <div className='flex items-center justify-between px-4 h-12 border-b border-line'>
                            <span className='text-[14px] font-medium text-ink'>This week</span>
                            <span className='text-[12px] text-ink-3'>Points</span>
                        </div>
                        {
                            view.board.length === 0 ?
                            <p className='px-4 py-6 text-[14px] text-ink-3 leading-[1.5]'>No one has played this week yet. Finish today's challenge to take the top spot.</p>
                            :
                            <ol className='flex flex-col py-1'>
                                {top.map((person) => (
                                    <li key={person.key} className={`relative flex items-center gap-3 px-4 h-12 ${person.you ? 'bg-accent-tint' : ''}`}>
                                        <span aria-hidden className='absolute left-0 inset-y-[10px] rounded-r-full bg-white/[0.04]' style={{ width : `${Math.round(person.score / Math.max(1, top[0]?.score ?? 1) * 100)}%` }}/>
                                        <span className={`relative w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-semibold tabular-nums ${person.rank === 1 ? 'bg-medium/20 text-medium' : person.rank === 2 ? 'bg-white/[0.1] text-ink' : person.rank === 3 ? 'bg-tag-brown/25 text-tag-brown' : 'text-ink-3'}`}>{person.rank}</span>
                                        <span className='relative'><kit.Avatar color={toneVar(toneOf(person.name, person.color))} size={26}>{person.initials}</kit.Avatar></span>
                                        <span className='relative flex-1 min-w-0 flex flex-col leading-tight'>
                                            <span className={`text-[14px] truncate ${person.you ? 'font-medium text-accent' : 'text-ink'}`}>{person.name}</span>
                                            {person.school && <span className='text-[11px] text-ink-3 truncate'>{person.school}</span>}
                                        </span>
                                        <span className='relative text-[13px] font-semibold text-ink tabular-nums'>{person.score.toLocaleString()}</span>
                                    </li>
                                ))}
                                {
                                    pinned && !top.includes(pinned) &&
                                    <li className='flex items-center gap-3 px-4 h-11 bg-accent-tint border-t border-line'>
                                        <span className='w-5 text-[12px] text-ink-3 tabular-nums'>{pinned.rank}</span>
                                        <kit.Avatar color={toneVar(toneOf(pinned.name, pinned.color))} size={24}>{pinned.initials}</kit.Avatar>
                                        <span className='flex-1 text-[14px] font-medium text-accent'>You</span>
                                        <span className='text-[13px] font-medium text-ink tabular-nums'>{pinned.score.toLocaleString()}</span>
                                    </li>
                                }
                            </ol>
                        }
                        <p className='px-4 py-3 border-t border-line text-[12px] leading-[1.5] text-ink-3'>
                            {view.you.rank === 1 ? "You're top of the board this week. " : view.you.rank ? `You're #${view.you.rank}. ` : ''}{view.scoring}
                        </p>
                    </section>
                </div>
        </main>
    )
}

export default Pod
