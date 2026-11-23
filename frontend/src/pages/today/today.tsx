import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { getCourse, getQuestion, useCatalog } from '../../data/catalog'
import { useProgress, summarize, courseProgress, weakTopics, dayKey, relativeDay } from '../../store/progress'
import { useChallengeView } from '../../store/challenge'
import { useStudy, orderCourses } from '../../store/study'
import { startChallenge as beginChallenge } from '../pod/pod'
import CourseIcon from '../../components/courseIcon/courseIcon'
import { PageHero, Surface, Ring, CountUp, DayBars } from '../../components/premium/premium'
import { toneOf } from '../../styles/tone'
import { FiArrowRight, FiBookmark, FiRotateCcw, FiCheck, FiClock, FiZap, FiTarget, FiSettings, FiPlay, FiTrendingUp } from 'react-icons/fi'

const greeting = () => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

const untilMidnight = () => {
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0)
    const total = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000))
    return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map((part) => String(part).padStart(2, '0'))
}

const accuracyTone = (value : number) => value >= 70 ? 'text-success' : value >= 50 ? 'text-medium' : 'text-hard'

// Home for a returning student: where you are, what's next, and how the week is going
const Today = () => {

    const navigate = useNavigate()
    const catalog = useCatalog()
    const study = useStudy()
    const courses = orderCourses(catalog.courses, study.courses)
    const state = useProgress()
    const stats = summarize(state)
    const firstName = state.profile.name.trim().split(' ')[0]
    const [clock, setClock] = useState(untilMidnight)

    useEffect(() => {
        const id = window.setInterval(() => setClock(untilMidnight()), 1000)
        return () => window.clearInterval(id)
    }, [])

    const attempts = Object.entries(state.attempts).sort((a, b) => b[1].at - a[1].at)
    const lastCourse = attempts.length ? getCourse(attempts[0][1].courseID) : null
    const last = lastCourse ? courseProgress(state, lastCourse.id, lastCourse.questions) : null
    const mistakes = attempts.filter(([, attempt]) => !attempt.correct)
    const savedCount = Object.keys(state.saved).length
    const weak = weakTopics(state).slice(0, 4)

    const challenge = useChallengeView()
    const done = challenge.result
    const streak = challenge.streak
    const startChallenge = () => beginChallenge(navigate, challenge.course.id)

    const today = dayKey()
    const doneToday = Object.values(state.attempts).filter((attempt) => dayKey(new Date(attempt.at)) === today).length
    const goalShare = Math.min(1, doneToday / Math.max(1, study.goal))
    const needsSetup = !study.onboarded && (!state.profile.school || !study.courses.length)

    // The last 14 days of practice, oldest first
    const days = Array.from({ length : 14 }, (_, index) => {
        const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (13 - index))
        const key = dayKey(date)
        const onDay = Object.values(state.attempts).filter((attempt) => dayKey(new Date(attempt.at)) === key)
        return { label : date.toLocaleDateString(undefined, { weekday : 'narrow' }), total : onDay.length, correct : onDay.filter((attempt) => attempt.correct).length, today : key === today }
    })
    const fortnight = days.reduce((sum, day) => sum + day.total, 0)
    const fortnightRight = days.reduce((sum, day) => sum + day.correct, 0)

    const openSaved = () => {
        const first = Object.entries(state.saved).sort((a, b) => b[1] - a[1])[0]
        const course = first && getQuestion(first[0])?.courseID
        navigate(`/questions/${course ?? courses[0].id}?status=saved`)
    }

    const subline = !attempts.length ? 'Pick a course and answer your first question. Everything you do is saved here.'
        : stats.activeToday ? `You've practised today${stats.streak > 1 ? `, ${stats.streak} days in a row` : ''}. Keep the momentum.`
        : stats.streak > 0 ? `Answer one question today to keep your ${stats.streak}-day streak alive.`
        : 'Welcome back. Pick up where you left off.'

    return (
        <main className='w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-10 md:pt-14 pb-24 flex flex-col gap-8'>
            {
                needsSetup &&
                <div className='flex flex-wrap items-center gap-3 rounded-xl border border-accent/25 bg-accent-tint/60 px-4 py-3 shadow-edge'>
                    <FiSettings size={16} className='text-accent shrink-0'/>
                    <span className='flex-1 min-w-[200px] text-[14px] text-ink'>Tell us your school and courses, and PrepRoom puts your papers first. It takes 30 seconds.</span>
                    <kit.PrimaryButton type='button' className='!h-8' onClick={()=>navigate('/welcome')}>Set up</kit.PrimaryButton>
                </div>
            }

            <PageHero
                eyebrow={new Date().toLocaleDateString(undefined, { weekday : 'long', month : 'long', day : 'numeric' })}
                title={<>{greeting()}{firstName ? <>, <span className='text-ink-2'>{firstName}</span></> : ''}</>}
                sub={subline}
                right={
                    <div className='flex items-center gap-6 shrink-0'>
                        <button type='button' onClick={()=>navigate('/welcome')} className='flex items-center gap-3 text-left group' aria-label={`Daily goal: ${doneToday} of ${study.goal}`}>
                            <Ring value={goalShare} size={64} stroke={5}>
                                <span className='text-[17px] font-semibold text-ink tabular-nums'>{doneToday}</span>
                                <span className='text-[10px] text-ink-3 mt-[2px]'>/ {study.goal}</span>
                            </Ring>
                            <span className='flex flex-col'>
                                <span className='text-[13px] font-medium text-ink'>{goalShare >= 1 ? 'Goal reached' : 'Daily goal'}</span>
                                <span className='text-[12px] text-ink-3 group-hover:text-ink-2'>Change</span>
                            </span>
                        </button>
                        <span className='w-px h-12 bg-line'/>
                        <button type='button' onClick={()=>navigate('/challenges')} className='flex items-center gap-3 text-left'>
                            <span className={`w-16 h-16 rounded-full inline-flex items-center justify-center ${stats.activeToday ? 'bg-medium/15 text-medium' : 'bg-white/[0.05] text-ink-4'}`} >
                                <FiZap size={26} fill={stats.activeToday ? 'currentColor' : 'none'}/>
                            </span>
                            <span className='flex flex-col'>
                                <span className='text-[22px] font-semibold text-ink tabular-nums leading-none'>{stats.streak}</span>
                                <span className='text-[12px] text-ink-3 mt-1'>day streak</span>
                            </span>
                        </button>
                    </div>
                }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4'>
                {/* Continue */}
                {
                    lastCourse && last ?
                    <Surface className='overflow-hidden p-6 md:p-7 flex flex-col gap-7'>
                        <div className='relative flex items-start gap-5'>
                            <CourseIcon course={lastCourse} size={56}/>
                            <div className='flex flex-col gap-1 min-w-0 flex-1'>
                                <span className='text-[12px] font-medium text-ink-3 uppercase tracking-[0.08em]'>Continue · {lastCourse.code}</span>
                                <h2 className='text-[26px] font-semibold tracking-[-0.03em] text-ink leading-tight truncate'>{lastCourse.name}</h2>
                                <span className='text-[13px] text-ink-3'>Last answered {relativeDay(attempts[0][1].at).toLowerCase()} · {attempts[0][1].topic}</span>
                            </div>
                            <Ring value={last.percent / 100} size={76} stroke={6}>
                                <span className='text-[18px] font-semibold text-ink tabular-nums'>{last.percent}<span className='text-[11px] text-ink-3'>%</span></span>
                            </Ring>
                        </div>
                        <div className='relative grid grid-cols-3 gap-px rounded-lg overflow-hidden bg-line'>
                            {[
                                ['Answered', `${last.answered}/${lastCourse.questions}`],
                                ['Accuracy', last.answered ? `${last.accuracy}%` : '—'],
                                ['To go', `${Math.max(0, lastCourse.questions - last.answered)}`],
                            ].map(([label, value]) => (
                                <div key={label} className='bg-surface px-4 py-3 flex flex-col gap-1'>
                                    <span className='text-[12px] text-ink-3'>{label}</span>
                                    <span className='text-[18px] font-semibold text-ink tabular-nums'>{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className='relative flex flex-wrap gap-2'>
                            <kit.PrimaryButton type='button' className='!h-10 !px-5' onClick={()=>navigate(`/questions/${lastCourse.id}${last.percent < 100 ? '?status=unanswered' : ''}`)}>
                                <FiPlay size={13} fill='currentColor'/> {last.percent < 100 ? 'Continue practising' : 'Review the course'}
                            </kit.PrimaryButton>
                            <kit.SecondaryButton type='button' className='!h-10' onClick={()=>navigate('/test/testconfig', { state : { courseID : lastCourse.id } })}>
                                <FiClock size={14}/> Timed test
                            </kit.SecondaryButton>
                            <kit.GhostButton type='button' className='!h-10' onClick={()=>navigate(`/plan/${lastCourse.id}`)}>Study plan</kit.GhostButton>
                        </div>
                    </Surface>
                    :
                    <Surface className='p-6 flex flex-col gap-4'>
                        <h2 className='text-[18px] font-semibold text-ink'>Start with a course</h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                            {courses.map((course) => (
                                <button key={course.id} type='button' onClick={()=>navigate(`/questions/${course.id}`)}
                                    className='group flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05] hover:border-line-strong active:scale-[0.98] transition-[background-color,border-color,transform] duration-150'>
                                    <CourseIcon course={course} size={36}/>
                                    <span className='flex flex-col flex-1 min-w-0'>
                                        <span className='text-[14px] font-medium text-ink truncate'>{course.name}</span>
                                        <span className='text-[12px] text-ink-3'>{course.code} · {course.questions} questions</span>
                                    </span>
                                    <FiArrowRight size={14} className='text-ink-4 group-hover:text-ink-2 group-hover:translate-x-[2px] transition-transform'/>
                                </button>
                            ))}
                        </div>
                    </Surface>
                }

                {/* Today's challenge */}
                <Surface className='overflow-hidden p-6 md:p-7 flex flex-col gap-5 justify-between'>
                    <div className='relative flex items-center justify-between'>
                        <span className='inline-flex items-center gap-2 text-[13px] font-medium text-medium'><FiZap size={14} fill='currentColor'/> Daily challenge</span>
                        {done ? <span className='inline-flex items-center gap-1 text-[12px] font-medium text-success'><FiCheck size={13} strokeWidth={3}/> Done</span>
                            : <span className='text-[12px] text-ink-3'>{challenge.count} questions · {challenge.minutes} min</span>}
                    </div>
                    {
                        done ?
                        <div className='relative flex flex-col gap-2'>
                            <span className='text-[52px] font-semibold leading-none tracking-[-0.05em] text-ink tabular-nums'>{done.score}<span className='text-ink-4'>/{done.total}</span></span>
                            <span className='text-[14px] text-ink-2'>{done.rank ? `Ranked #${done.rank} today. ` : ''}A new set lands in {clock[0]}h {clock[1]}m.</span>
                        </div>
                        :
                        <div className='relative flex flex-col gap-4'>
                            <div className='flex items-center gap-3'>
                                <CourseIcon course={challenge.course} size={40}/>
                                <span className='flex flex-col min-w-0'>
                                    <span className='text-[18px] font-semibold tracking-[-0.02em] text-ink truncate'>{challenge.course.name}</span>
                                    <span className='text-[13px] text-ink-3'>{challenge.players ? `${challenge.players.toLocaleString()} played today` : 'The same five for everyone'}</span>
                                </span>
                            </div>
                            <div className='flex items-baseline gap-1 font-mono tabular-nums text-ink' aria-label={`Closes in ${clock[0]} hours ${clock[1]} minutes`}>
                                {clock.map((part, index) => (
                                    <span key={index} className='flex items-baseline'>
                                        <span className='text-[30px] font-semibold tracking-[-0.02em] rounded-md bg-white/[0.05] px-2 py-[2px]'>{part}</span>
                                        {index < 2 && <span className='text-[20px] text-ink-4 px-[2px]'>:</span>}
                                    </span>
                                ))}
                                <span className='ml-2 text-[12px] text-ink-3 font-sans'>left</span>
                            </div>
                        </div>
                    }
                    <div className='relative flex flex-col gap-2'>
                        <div className='grid grid-cols-7 gap-1'>
                            {streak.week.map((day) => (
                                <div key={day.label} className='flex flex-col items-center gap-1'>
                                    <span className={`w-full h-[6px] rounded-full ${day.active ? 'bg-medium' : day.today ? 'bg-medium/25' : 'bg-white/[0.06]'}`} />
                                    <span className={`text-[10px] ${day.today ? 'text-ink font-semibold' : 'text-ink-4'}`}>{day.label[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {
                        done ?
                        <kit.SecondaryButton type='button' className='relative self-start !h-10' onClick={()=>navigate('/challenges')}>See the leaderboard <FiArrowRight size={14}/></kit.SecondaryButton>
                        :
                        <button type='button' disabled={!challenge.ready} onClick={startChallenge}
                            className='relative self-start h-10 px-5 inline-flex items-center gap-2 rounded-[5px] bg-medium text-[#1a1300] text-[14px] font-semibold hover:brightness-110 active:scale-[0.97] transition-[filter,transform] disabled:opacity-50'>
                            {challenge.status === 'in_progress' ? 'Resume' : 'Start'} challenge <FiArrowRight size={14}/>
                        </button>
                    }
                </Surface>
            </div>

            {/* The fortnight + stats */}
            <Surface className='p-6 md:p-7 grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8'>
                <div className='flex flex-col gap-4'>
                    <div className='flex items-baseline justify-between gap-3'>
                        <span className='inline-flex items-center gap-2 text-[14px] font-medium text-ink'><FiTrendingUp size={15} className='text-ink-3'/> Last 14 days</span>
                        <span className='text-[12px] text-ink-3 tabular-nums'><b className='text-ink font-medium'>{fortnight}</b> answered · <b className='text-success font-medium'>{fortnightRight}</b> right</span>
                    </div>
                    <DayBars days={days} height={92}/>
                </div>
                <div className='grid grid-cols-2 gap-px rounded-lg overflow-hidden bg-line self-start'>
                    {[
                        { label : 'Questions answered', value : stats.solved, suffix : '' },
                        { label : 'Accuracy', value : stats.solved ? stats.accuracy : 0, suffix : stats.solved ? '%' : '' },
                        { label : 'Tests taken', value : stats.tests, suffix : '' },
                        { label : 'Best streak', value : stats.best, suffix : 'd' },
                    ].map((item) => (
                        <div key={item.label} className='bg-surface px-4 py-4 flex flex-col gap-2'>
                            <span className='text-[12px] text-ink-3'>{item.label}</span>
                            <span className='text-[28px] font-semibold tracking-[-0.04em] text-ink tabular-nums leading-none'>
                                {item.label === 'Accuracy' && !stats.solved ? '—' : <><CountUp to={item.value}/><span className='text-[16px] text-ink-3'>{item.suffix}</span></>}
                            </span>
                        </div>
                    ))}
                </div>
            </Surface>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 items-start'>
                <Surface className='p-5 flex flex-col gap-3'>
                    <span className='inline-flex items-center gap-2 text-[14px] font-medium text-ink'><FiTarget size={15} className='text-hard'/> Focus areas</span>
                    {
                        weak.length === 0 ?
                        <span className='text-[14px] text-ink-3 leading-[1.5]'>{attempts.length ? 'Nothing to fix yet. Every topic you have tried is solid.' : 'Topics you find hard show up here once you start answering.'}</span>
                        :
                        <div className='flex flex-col gap-1 -mx-2'>
                            {weak.map((item) => (
                                <button key={`${item.courseID}:${item.topic}`} type='button' onClick={()=>navigate(`/questions/${item.courseID}?topic=${encodeURIComponent(item.topic)}`)}
                                    className='flex flex-col gap-2 text-left rounded-md px-2 py-2 hover:bg-white/[0.04] transition-colors'>
                                    <span className='flex items-center justify-between gap-3 text-[14px]'>
                                        <span className='text-ink truncate'>{item.topic} <span className='text-[12px] text-ink-4'>{getCourse(item.courseID).code}</span></span>
                                        <span className={`text-[13px] font-medium tabular-nums ${accuracyTone(item.accuracy)}`}>{item.accuracy}%</span>
                                    </span>
                                    <span className='h-[4px] rounded-full bg-white/[0.06] overflow-hidden'>
                                        <span className='block h-full rounded-full' style={{ width : `${Math.max(4, item.accuracy)}%`, background : `rgb(var(--${item.accuracy >= 70 ? 'success' : item.accuracy >= 50 ? 'medium' : 'hard'}))` }}/>
                                    </span>
                                </button>
                            ))}
                        </div>
                    }
                </Surface>

                <Surface className='p-5 flex flex-col gap-3'>
                    <span className='text-[14px] font-medium text-ink'>Review</span>
                    {[
                        { icon : FiRotateCcw, label : 'Mistakes', note : mistakes.length ? 'Try them again while they are fresh' : 'Nothing to redo yet', count : mistakes.length, run : () => mistakes[0] && navigate(`/questions/${mistakes[0][1].courseID}?status=mistakes`), tone : 'hard' },
                        { icon : FiBookmark, label : 'Saved', note : savedCount ? 'Kept for revision' : 'Press S on a question to keep it', count : savedCount, run : openSaved, tone : 'accent' },
                    ].map((item) => (
                        <button key={item.label} type='button' disabled={!item.count} onClick={item.run}
                            className='flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-3 text-left enabled:hover:bg-white/[0.05] enabled:hover:border-line-strong transition-colors disabled:cursor-default'>
                            <span className='w-9 h-9 rounded-md inline-flex items-center justify-center' style={{ color : `rgb(var(--${item.tone}))`, background : `rgb(var(--${item.tone}) / 0.12)` }}><item.icon size={16}/></span>
                            <span className='flex flex-col flex-1 min-w-0'>
                                <span className='text-[14px] font-medium text-ink'>{item.label}</span>
                                <span className='text-[12px] text-ink-3 truncate'>{item.note}</span>
                            </span>
                            <span className='text-[20px] font-semibold text-ink tabular-nums'>{item.count}</span>
                        </button>
                    ))}
                </Surface>

                <Surface className='p-5 flex flex-col gap-3'>
                    <div className='flex items-center justify-between'>
                        <span className='text-[14px] font-medium text-ink'>Recent tests</span>
                        <kit.TextLink type='button' className='!text-[13px]' onClick={()=>navigate('/test/testconfig')}>All tests <FiArrowRight size={13}/></kit.TextLink>
                    </div>
                    {
                        state.tests.length === 0 ?
                        <div className='flex flex-col items-start gap-3 py-2'>
                            <span className='text-[14px] text-ink-3'>Timed tests show up here with your score.</span>
                            <kit.SecondaryButton type='button' onClick={()=>navigate('/test/testconfig')}><FiClock size={14}/> Set up a test</kit.SecondaryButton>
                        </div>
                        :
                        <div className='flex flex-col -mx-2'>
                            {state.tests.slice(0, 4).map((run) => {
                                const pct = run.total ? Math.round(run.score / run.total * 100) : 0
                                return (
                                    <button key={run.id} type='button' onClick={()=>navigate(`/questions/${run.courseID}${run.missed.length ? '?status=mistakes' : ''}`)}
                                        className='flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-white/[0.04] transition-colors'>
                                        <Ring value={pct / 100} size={36} stroke={3} tone={pct >= 70 ? 'success' : pct >= 50 ? 'medium' : 'hard'}>
                                            <span className='text-[10px] font-semibold text-ink tabular-nums'>{pct}</span>
                                        </Ring>
                                        <span className='flex flex-col flex-1 min-w-0'>
                                            <span className='text-[14px] text-ink truncate'>{run.title}</span>
                                            <span className='text-[12px] text-ink-3'>{relativeDay(run.at)} · {run.score}/{run.total}</span>
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    }
                </Surface>
            </div>

            {/* Courses */}
            <section className='flex flex-col gap-4' aria-label='Your courses'>
                <div className='flex items-baseline justify-between'>
                    <h2 className='text-[20px] font-semibold tracking-[-0.02em] text-ink'>{study.courses.length ? 'Your courses' : 'Courses'}</h2>
                    <kit.TextLink type='button' className='!text-[13px]' onClick={()=>navigate('/questions')}>Question bank <FiArrowRight size={13}/></kit.TextLink>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {courses.map((course) => {
                        const value = courseProgress(state, course.id, course.questions)
                        const tone = toneOf(course.id, course.color)
                        return (
                            <Surface key={course.id} as='button' type='button' onClick={()=>navigate(`/questions/${course.id}`)}
                                className='group overflow-hidden p-5 flex flex-col gap-5 text-left hover:border-line-strong active:scale-[0.99] transition-[border-color,transform] duration-150'>
                                <div className='relative flex items-start justify-between gap-3'>
                                    <CourseIcon course={course} size={40}/>
                                    <Ring value={value.percent / 100} size={44} stroke={4} tone={tone}>
                                        <span className='text-[11px] font-semibold text-ink tabular-nums'>{value.percent}%</span>
                                    </Ring>
                                </div>
                                <div className='relative flex flex-col gap-1'>
                                    <span className='text-[16px] font-semibold tracking-[-0.01em] text-ink'>{course.name}</span>
                                    <span className='text-[12px] text-ink-3 tabular-nums'>{course.code} · {value.answered}/{course.questions} answered{value.answered ? ` · ${value.accuracy}% right` : ''}</span>
                                </div>
                            </Surface>
                        )
                    })}
                </div>
            </section>
        </main>
    )
}

export default Today
