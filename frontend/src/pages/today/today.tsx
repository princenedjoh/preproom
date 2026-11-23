import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { getCourse, getQuestion, useCatalog } from '../../data/catalog'
import { useProgress, summarize, courseProgress, weakTopics, dayKey } from '../../store/progress'
import { useChallengeView } from '../../store/challenge'
import { startChallenge as beginChallenge } from '../pod/pod'
import TestHistory from '../../components/testHistory/testHistory'
import CourseIcon from '../../components/courseIcon/courseIcon'
import { useStudy, orderCourses } from '../../store/study'
import { FiArrowRight, FiBookmark, FiRotateCcw, FiCheck, FiClock, FiZap, FiTarget, FiSettings } from 'react-icons/fi'

const greeting = () => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

const accuracyTone = (value : number) : kit.Tone => value >= 70 ? 'green' : value >= 50 ? 'orange' : 'red'

// Home for a returning student: pick up where you left off, today's challenge, what to fix next
const Today = () => {

    const navigate = useNavigate()
    const catalog = useCatalog()
    const study = useStudy()
    const courses = orderCourses(catalog.courses, study.courses)
    const state = useProgress()
    const stats = summarize(state)
    const firstName = state.profile.name.trim().split(' ')[0]

    const attempts = Object.entries(state.attempts).sort((a, b) => b[1].at - a[1].at)
    const lastCourse = attempts.length ? getCourse(attempts[0][1].courseID) : null
    const last = lastCourse ? courseProgress(state, lastCourse.id, lastCourse.questions) : null

    const mistakes = attempts.filter(([, attempt]) => !attempt.correct)
    const savedCount = Object.keys(state.saved).length
    const weak = weakTopics(state).slice(0, 4)

    const challenge = useChallengeView()
    const done = challenge.result
    const todayCourse = challenge.course
    const streak = challenge.streak
    const startChallenge = () => beginChallenge(navigate, todayCourse.id)
    const mistakesCourse = mistakes.length ? mistakes[0][1].courseID : null

    const openSaved = () => {
        const first = Object.entries(state.saved).sort((a, b) => b[1] - a[1])[0]
        const course = first && getQuestion(first[0])?.courseID
        navigate(`/questions/${course ?? courses[0].id}?status=saved`)
    }

    const today = dayKey()
    const doneToday = Object.values(state.attempts).filter((attempt) => dayKey(new Date(attempt.at)) === today).length
    const goalShare = Math.min(1, doneToday / Math.max(1, study.goal))
    const needsSetup = !study.onboarded && (!state.profile.school || !study.courses.length)

    const subline = !attempts.length ? 'Pick a course and answer your first question. Everything you do is saved here.'
        : stats.activeToday ? `You've practised today${stats.streak > 1 ? `, ${stats.streak} days in a row` : ''}. Nice.`
        : stats.streak > 0 ? `Answer one question today to keep your ${stats.streak}-day streak.`
        : 'Welcome back. Pick up where you left off.'

    return (
        <kit.Page>
            <kit.PageInner>
                {
                    needsSetup &&
                    <div className='flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent-tint px-4 py-3'>
                        <FiSettings size={16} className='text-accent shrink-0'/>
                        <span className='flex-1 min-w-[200px] text-[14px] text-ink'>Tell us your school and courses, and PrepRoom puts your papers first. It takes 30 seconds.</span>
                        <kit.PrimaryButton type='button' className='!h-8' onClick={()=>navigate('/welcome')}>Set up</kit.PrimaryButton>
                    </div>
                }
                <header className='flex flex-col gap-2 pt-2'>
                    <kit.Eyebrow>{new Date().toLocaleDateString(undefined, { weekday : 'long', month : 'long', day : 'numeric' })}</kit.Eyebrow>
                    <kit.PageTitle>{greeting()}{firstName ? `, ${firstName}` : ''}</kit.PageTitle>
                    <kit.Body>{subline}</kit.Body>
                </header>
                <section className='flex items-center gap-4 rounded-lg bg-surface border border-line px-4 py-3' aria-label='Daily goal'>
                    <span className='relative w-11 h-11 shrink-0'>
                        <svg viewBox='0 0 44 44' className='w-full h-full -rotate-90'>
                            <circle cx='22' cy='22' r='18' fill='none' strokeWidth='4' stroke='rgb(var(--ink) / 0.08)'/>
                            <circle cx='22' cy='22' r='18' fill='none' strokeWidth='4' strokeLinecap='round' stroke='rgb(var(--success))' strokeDasharray={`${113.1 * goalShare} 113.1`} style={{ transition : 'stroke-dasharray 600ms var(--ease-out)' }}/>
                        </svg>
                        <FiTarget size={15} className={`absolute inset-0 m-auto ${goalShare >= 1 ? 'text-success' : 'text-ink-3'}`}/>
                    </span>
                    <span className='flex flex-col flex-1 min-w-0'>
                        <span className='text-[14px] font-medium text-ink'>{goalShare >= 1 ? 'Daily goal reached' : 'Daily goal'}</span>
                        <span className='text-[13px] text-ink-3 tabular-nums'>{doneToday} of {study.goal} questions today</span>
                    </span>
                    <button type='button' onClick={()=>navigate('/welcome')} className='text-[13px] text-ink-3 hover:text-ink'>Change</button>
                </section>

                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-4'>
                    {
                        lastCourse && last ?
                        <section className='rounded-lg bg-surface border border-line p-6 flex flex-col gap-6 justify-between' aria-label='Continue'>
                            <div className='flex items-start gap-4'>
                                <CourseIcon course={lastCourse} size={44}/>
                                <div className='flex flex-col gap-1 min-w-0'>
                                    <kit.Eyebrow>Continue · {lastCourse.code}</kit.Eyebrow>
                                    <h2 className='text-[22px] font-semibold tracking-[-0.02em] text-ink leading-tight truncate'>{lastCourse.name}</h2>
                                </div>
                            </div>
                            <div className='flex flex-col gap-3'>
                                <div className='flex items-baseline justify-between text-[13px] tabular-nums'>
                                    <span className='text-ink-2'><b className='font-semibold text-ink'>{last.answered}</b> of {lastCourse.questions} answered</span>
                                    <span className='text-ink-3'>{last.accuracy}% right</span>
                                </div>
                                <kit.ProgressTrack height={4}><kit.ProgressFill value={last.percent}/></kit.ProgressTrack>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                <kit.PrimaryButton type='button' onClick={()=>navigate(`/questions/${lastCourse.id}${last.percent < 100 ? '?status=unanswered' : ''}`)}>
                                    {last.percent < 100 ? 'Continue practising' : 'Review the course'} <FiArrowRight size={15}/>
                                </kit.PrimaryButton>
                                <kit.SecondaryButton type='button' onClick={()=>navigate('/test/testconfig', { state : { courseID : lastCourse.id } })}>
                                    <FiClock size={14}/> Timed test
                                </kit.SecondaryButton>
                            </div>
                        </section>
                        :
                        <section className='rounded-lg bg-surface border border-line p-5 flex flex-col gap-3' aria-label='Start with a course'>
                            <kit.PanelTitle>Start with a course</kit.PanelTitle>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-1'>
                                {
                                    courses.map((course) => (
                                        <button
                                            key={course.id}
                                            type='button'
                                            onClick={()=>navigate(`/questions/${course.id}`)}
                                            className='group flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-ink/[0.04] active:scale-[0.98] transition-[background-color,transform] duration-100'
                                        >
                                            <CourseIcon course={course} size={32}/>
                                            <span className='flex flex-col flex-1 min-w-0'>
                                                <span className='text-[14px] font-medium text-ink truncate'>{course.name}</span>
                                                <span className='text-[12px] text-ink-3'>{course.code} · {course.questions} questions</span>
                                            </span>
                                            <FiArrowRight size={14} className='text-ink-4 group-hover:text-ink-2 group-hover:translate-x-[2px] transition-transform'/>
                                        </button>
                                    ))
                                }
                            </div>
                        </section>
                    }

                    <section className='rounded-lg bg-surface border border-line p-6 flex flex-col gap-5 justify-between' aria-label='Daily challenge'>
                        <div className='flex items-center justify-between gap-3'>
                            <kit.PanelTitle><FiZap size={14}/> Daily challenge</kit.PanelTitle>
                            {
                                done ? <kit.Tag tone='green'><FiCheck size={12}/> Done</kit.Tag>
                                : <span className='text-[12px] text-ink-3'>{challenge.count} questions · {challenge.minutes} min</span>
                            }
                        </div>
                        {
                            done ?
                            <div className='flex flex-col gap-1'>
                                <span className='text-[40px] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums'>{done.score}<span className='text-ink-4'>/{done.total}</span></span>
                                <span className='text-[13px] text-ink-2'>{done.rank ? `Ranked #${done.rank} today. ` : ''}A new set lands at midnight.</span>
                            </div>
                            :
                            <div className='flex items-center gap-3'>
                                <CourseIcon course={todayCourse} size={36}/>
                                <div className='flex flex-col min-w-0'>
                                    <span className='text-[17px] font-semibold tracking-[-0.015em] text-ink truncate'>{todayCourse.name}</span>
                                    <span className='text-[13px] text-ink-3'>Same five for everyone today</span>
                                </div>
                            </div>
                        }

                        <div className='flex flex-col gap-2'>
                            <div className='flex items-center justify-between text-[12px]'>
                                <span className='text-ink-2'><b className='font-semibold text-ink tabular-nums'>{streak.current}</b>-day streak</span>
                                <span className='text-ink-3'>Best {Math.max(streak.best, streak.current)}</span>
                            </div>
                            <div className='grid grid-cols-7 gap-1' role='list' aria-label='This week'>
                                {streak.week.map((day) => (
                                    <div key={day.label} role='listitem' className='flex flex-col items-center gap-1' aria-label={`${day.label}: ${day.active ? 'practised' : day.future ? 'upcoming' : day.today ? 'today' : 'missed'}`}>
                                        <span className={`w-full h-[6px] rounded-full ${day.active ? 'bg-tag-yellow' : day.today ? 'bg-tag-yellow/30' : 'bg-subtle'}`}/>
                                        <span className={`text-[10px] ${day.today ? 'text-ink font-semibold' : 'text-ink-4'}`}>{day.label[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {
                            done ?
                            <kit.SecondaryButton type='button' className='self-start' onClick={()=>navigate('/challenges')}>See the leaderboard <FiArrowRight size={14}/></kit.SecondaryButton>
                            :
                            <kit.PrimaryButton type='button' className='self-start' disabled={!challenge.ready} onClick={startChallenge}>{challenge.status === 'in_progress' ? 'Resume' : 'Start'} challenge <FiArrowRight size={14}/></kit.PrimaryButton>
                        }
                    </section>
                </div>

                <section className='grid grid-cols-2 md:grid-cols-4 rounded-lg bg-surface border border-line overflow-hidden' aria-label='Your numbers'>
                    {[
                        { label : 'Questions answered', value : stats.solved },
                        { label : 'Accuracy', value : stats.solved ? `${stats.accuracy}%` : '—' },
                        { label : 'Tests taken', value : stats.tests },
                        { label : 'Best streak', value : `${stats.best}d` },
                    ].map((item, index) => (
                        <div key={item.label} className={`flex flex-col gap-2 p-5 ${index % 2 ? 'border-l border-line' : ''} ${index > 1 ? 'border-t md:border-t-0 border-line' : ''} ${index === 2 ? 'md:border-l' : ''}`}>
                            <kit.StatLabel>{item.label}</kit.StatLabel>
                            <kit.StatValue>{item.value}</kit.StatValue>
                        </div>
                    ))}
                </section>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 items-start'>
                    <kit.Panel>
                        <kit.PanelTitle>Focus areas</kit.PanelTitle>
                        {
                            weak.length === 0 ?
                            <span className='text-[14px] text-ink-3 leading-[1.5]'>
                                {attempts.length ? 'Nothing to fix yet. Every topic you have tried is solid.' : 'Topics you find hard show up here once you start answering.'}
                            </span>
                            :
                            <div className='flex flex-col -mx-2'>
                                {
                                    weak.map((item) => (
                                        <button
                                            key={`${item.courseID}:${item.topic}`}
                                            type='button'
                                            onClick={()=>navigate(`/questions/${item.courseID}?topic=${encodeURIComponent(item.topic)}`)}
                                            className='flex items-center gap-3 text-left rounded-md px-2 py-2 hover:bg-ink/[0.04] transition-colors'
                                        >
                                            <span className='flex flex-col flex-1 min-w-0'>
                                                <span className='text-[14px] text-ink truncate'>{item.topic}</span>
                                                <span className='text-[12px] text-ink-3 tabular-nums'>{getCourse(item.courseID).code} · {item.correct} of {item.total} right</span>
                                            </span>
                                            <kit.Tag tone={accuracyTone(item.accuracy)} className='tabular-nums'>{item.accuracy}%</kit.Tag>
                                        </button>
                                    ))
                                }
                            </div>
                        }
                    </kit.Panel>

                    <kit.Panel>
                        <kit.PanelTitle>Review</kit.PanelTitle>
                        <div className='flex flex-col -mx-2'>
                            {[
                                { icon : FiRotateCcw, label : 'Mistakes', note : mistakes.length ? `${mistakes.length} to try again${mistakesCourse ? ` · latest in ${getCourse(mistakesCourse).code}` : ''}` : 'Nothing to redo yet', count : mistakes.length,
                                    run : () => mistakesCourse && navigate(`/questions/${mistakesCourse}?status=mistakes`), tone : 'red' as const },
                                { icon : FiBookmark, label : 'Saved', note : savedCount ? 'Kept for revision' : 'Press S on a question to keep it', count : savedCount, run : openSaved, tone : 'blue' as const },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    type='button'
                                    disabled={!item.count}
                                    onClick={item.run}
                                    className='flex items-center gap-3 rounded-md px-2 py-2 text-left enabled:hover:bg-ink/[0.04] transition-colors disabled:cursor-default'
                                >
                                    <kit.IconTile tone={item.count ? item.tone : undefined}><item.icon size={15}/></kit.IconTile>
                                    <span className='flex flex-col flex-1 min-w-0'>
                                        <span className='text-[14px] text-ink'>{item.label}</span>
                                        <span className='text-[12px] text-ink-3 truncate'>{item.note}</span>
                                    </span>
                                    {item.count > 0 && <span className='text-[13px] text-ink-2 tabular-nums'>{item.count}</span>}
                                </button>
                            ))}
                        </div>
                    </kit.Panel>

                    <kit.Panel>
                        <div className='flex items-center justify-between'>
                            <kit.PanelTitle>Recent tests</kit.PanelTitle>
                            {state.tests.length > 3 && <kit.TextLink type='button' className='!text-[13px]' onClick={()=>navigate('/test/testconfig')}>All tests <FiArrowRight size={13}/></kit.TextLink>}
                        </div>
                        <TestHistory compact limit={3}/>
                    </kit.Panel>
                </div>

                {
                    attempts.length > 0 &&
                    <section className='flex flex-col gap-3' aria-label='Your courses'>
                        <kit.Title>Courses</kit.Title>
                        <div className='rounded-lg bg-surface border border-line overflow-hidden'>
                            <div className='hidden md:grid grid-cols-[minmax(0,1fr)_200px_110px_90px] gap-4 px-4 h-9 items-center border-b border-line text-[12px] text-ink-3'>
                                <span>Course</span><span>Progress</span><span className='text-right'>Answered</span><span className='text-right'>Accuracy</span>
                            </div>
                            {
                                courses.map((course) => {
                                    const value = courseProgress(state, course.id, course.questions)
                                    return (
                                        <button
                                            key={course.id}
                                            type='button'
                                            onClick={()=>navigate(`/questions/${course.id}`)}
                                            className='w-full grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_200px_110px_90px] gap-4 px-4 py-3 items-center text-left border-b border-line last:border-0 hover:bg-ink/[0.03] transition-colors'
                                        >
                                            <span className='flex items-center gap-3 min-w-0'>
                                                <CourseIcon course={course} size={24}/>
                                                <span className='text-[14px] text-ink truncate'>{course.name}</span>
                                                <span className='hidden sm:inline text-[12px] text-ink-3 shrink-0'>{course.code}</span>
                                            </span>
                                            <span className='hidden md:block'><kit.ProgressTrack height={4}><kit.ProgressFill value={value.percent}/></kit.ProgressTrack></span>
                                            <span className='text-[13px] text-ink-2 tabular-nums text-right'>{value.answered}/{course.questions}</span>
                                            <span className='hidden md:block text-right'>{value.answered ? <kit.Tag tone={accuracyTone(value.accuracy)} className='tabular-nums'>{value.accuracy}%</kit.Tag> : <span className='text-ink-4 text-[13px]'>—</span>}</span>
                                        </button>
                                    )
                                })
                            }
                        </div>
                    </section>
                }
            </kit.PageInner>
        </kit.Page>
    )
}

export default Today
