import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch } from 'antd'
import { confirm } from '../../components/dialog/confirm'
import * as kit from '../../styles/kit'
import ThemeSwitch from '../../components/shell/themeSwitch'
import CourseIcon from '../../components/courseIcon/courseIcon'
import { toneOf, toneVar } from '../../styles/tone'
import { plainText } from '../questions/parts'
import TestHistory from '../../components/testHistory/testHistory'
import { useCatalog, getQuestion, getCourse, fetchQuestions } from '../../data/catalog'
import { progress, getProgress, useProgress, summarize, courseProgress, initialsOf, ProfileInfo, dayKey, relativeDay } from '../../store/progress'
import { notify } from '../../utils/notify'
import { logout as endSession, useSession, updateUser } from '../../store/session'
import { FiEdit2, FiLogOut, FiTrash2 } from "react-icons/fi";

const tabs = ['Overview', 'Settings'] as const

const Profile = () => {

    const navigate = useNavigate()
    const { courses } = useCatalog()
    const state = useProgress()
    const stats = summarize(state)
    const session = useSession()
    const signedIn = session.status === 'user'
    const [tab, setTab] = useState<typeof tabs[number]>('Overview')
    const [recentTab, setRecentTab] = useState<'Answers' | 'Tests'>('Answers')
    const [form, setForm] = useState<ProfileInfo>(state.profile)
    const dirty = JSON.stringify(form) !== JSON.stringify(state.profile)
    const lastProfile = useRef(state.profile)
    useEffect(()=>{
        // Pick up server data after login, unless the learner is mid-edit
        if(lastProfile.current !== state.profile && JSON.stringify(form) === JSON.stringify(lastProfile.current)) setForm(state.profile)
        lastProfile.current = state.profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[state.profile])

    // Load the question text for recent answers (the catalog caches per course)
    const practised = Array.from(new Set(Object.values(state.attempts).map((attempt) => attempt.courseID))).join(',')
    useEffect(() => { practised.split(',').filter(Boolean).forEach((id) => { fetchQuestions(id) }) }, [practised])

    const save = (event : FormEvent) => {
        event.preventDefault()
        if(!form.name.trim()) return
        progress.setProfile({ ...form, name : form.name.trim() })
        if(signedIn) updateUser({ name : form.name.trim() })
        notify('Profile saved')
    }

    const logout = () => {
        endSession().then(() => { notify('Logged out'); navigate('/') })
    }

    const clearData = () => {
        confirm({
            title : 'Clear your progress?',
            content : 'This removes your answers, saved questions, test history and streak from this device. It cannot be undone.',
            okText : 'Clear everything',
            cancelText : 'Cancel',
            danger : true,
            onOk : () => {
                progress.reset()
                setForm(getProgress().profile)
                notify('Progress cleared')
            },
        })
    }

    // Activity by day over the last ~6 months, from answers and finished tests
    const counts = new Map<string, number>()
    Object.values(state.attempts).forEach((attempt) => { const key = dayKey(new Date(attempt.at)); counts.set(key, (counts.get(key) ?? 0) + 1) })
    state.tests.forEach((run) => { const key = dayKey(new Date(run.at)); counts.set(key, (counts.get(key) ?? 0) + run.total) })
    state.activeDays.forEach((key) => { if(!counts.has(key)) counts.set(key, 1) })
    const weeks = 26
    const end = new Date(); end.setHours(0, 0, 0, 0)
    const start = new Date(end); start.setDate(end.getDate() - end.getDay() - (weeks - 1) * 7)
    const cells = Array.from({ length : weeks * 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date })
    const level = (value : number) => value === 0 ? 0 : value < 3 ? 1 : value < 6 ? 2 : value < 12 ? 3 : 4
    const activeTotal = Array.from(counts.entries()).filter(([key]) => key >= dayKey(start)).length
    const recent = Object.entries(state.attempts).sort((a, b) => b[1].at - a[1].at).slice(0, 8)
    const allQuestions = courses.reduce((sum, course) => sum + course.questions, 0)
    const solved = Object.values(state.attempts).filter((attempt) => attempt.correct).length
    const name = state.profile.name || session.user?.name || ''
    const r = 40, c = 2 * Math.PI * r

    return (
        <main className='w-full max-w-[1200px] mx-auto px-3 md:px-5 py-5 md:py-6 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 items-start'>
            {/* Identity */}
            <aside className='rounded-lg bg-surface border border-line p-4 flex flex-col gap-4 lg:sticky lg:top-[66px]'>
                <div className='flex items-center gap-3'>
                    <span className='w-[72px] h-[72px] rounded-lg inline-flex items-center justify-center text-[24px] font-semibold text-white shrink-0'
                        style={{ background : name ? toneVar(toneOf(name, session.user?.color)) : 'rgb(var(--ink-4))' }}>
                        {initialsOf(name || 'You')}
                    </span>
                    <div className='flex flex-col min-w-0'>
                        <span className='text-[17px] font-semibold text-ink truncate'>{name || 'Your profile'}</span>
                        <span className='text-[13px] text-ink-3 truncate'>{signedIn ? session.user?.email : 'Guest · this device'}</span>
                    </div>
                </div>
                <kit.SecondaryButton type='button' className='w-full !bg-success/10 !border-success/30 !text-success' onClick={()=>setTab(tab === 'Settings' ? 'Overview' : 'Settings')}>
                    {tab === 'Settings' ? 'Back to profile' : 'Edit profile'}
                </kit.SecondaryButton>
                <dl className='flex flex-col gap-2 text-[13px]'>
                    {[
                        ['Programme', state.profile.program],
                        ['School', state.profile.school],
                        ['Level', state.profile.year],
                    ].filter(([, value]) => value).map(([label, value]) => (
                        <div key={label} className='flex justify-between gap-3'><dt className='text-ink-3'>{label}</dt><dd className='text-ink-2 text-right truncate'>{value}</dd></div>
                    ))}
                </dl>
                <div className='h-px bg-line'/>
                <div className='flex flex-col gap-2'>
                    <span className='text-[13px] font-medium text-ink'>Stats</span>
                    {[
                        ['Answered', stats.solved],
                        ['Accuracy', stats.solved ? `${stats.accuracy}%` : '—'],
                        ['Tests taken', stats.tests],
                        ['Streak', `${stats.streak} day${stats.streak === 1 ? '' : 's'} · best ${stats.best}`],
                    ].map(([label, value]) => (
                        <div key={label as string} className='flex justify-between text-[13px]'><span className='text-ink-3'>{label}</span><span className='text-ink tabular-nums'>{value}</span></div>
                    ))}
                </div>
                <div className='h-px bg-line'/>
                <div className='flex flex-col gap-2'>
                    <span className='text-[13px] font-medium text-ink'>Courses</span>
                    {courses.map((course) => {
                        const value = courseProgress(state, course.id, course.questions)
                        return (
                            <button key={course.id} type='button' onClick={()=>navigate(`/questions/${course.id}`)} className='flex items-center gap-2 text-[13px] text-left rounded px-1 -mx-1 py-[2px] hover:bg-ink/[0.04]'>
                                <CourseIcon course={course} size={18}/>
                                <span className='flex-1 truncate text-ink-2'>{course.name}</span>
                                <span className='text-ink-3 tabular-nums'>{value.answered}</span>
                            </button>
                        )
                    })}
                </div>
            </aside>

            {
                tab === 'Overview' ?
                <div className='flex flex-col gap-4 min-w-0'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <section className='rounded-lg bg-surface border border-line p-4 flex items-center gap-5' aria-label='Solved'>
                            <div className='relative w-[112px] h-[112px] shrink-0'>
                                <svg viewBox='0 0 100 100' className='w-full h-full -rotate-90'>
                                    <circle cx='50' cy='50' r={r} fill='none' strokeWidth='5' stroke='rgb(var(--ink) / 0.08)'/>
                                    <circle cx='50' cy='50' r={r} fill='none' strokeWidth='5' strokeLinecap='round' stroke='rgb(var(--success))' strokeDasharray={`${allQuestions ? c * solved / allQuestions : 0} ${c}`}/>
                                </svg>
                                <span className='absolute inset-0 flex flex-col items-center justify-center'>
                                    <span className='text-[24px] font-semibold text-ink tabular-nums tracking-[-0.03em] leading-none'>{solved}<span className='text-[13px] text-ink-3'>/{allQuestions}</span></span>
                                    <span className='text-[11px] text-ink-3 mt-1'>Solved</span>
                                </span>
                            </div>
                            <div className='flex flex-col gap-2 flex-1'>
                                {courses.slice(0, 3).map((course) => {
                                    const value = courseProgress(state, course.id, course.questions)
                                    return (
                                        <div key={course.id} className='flex flex-col gap-1'>
                                            <div className='flex justify-between text-[12px]'><span className='text-ink-2 truncate'>{course.name}</span><span className='text-ink tabular-nums'>{value.answered}<span className='text-ink-3'>/{course.questions}</span></span></div>
                                            <kit.ProgressTrack height={3}><kit.ProgressFill value={value.percent} color={toneVar(toneOf(course.id, course.color))}/></kit.ProgressTrack>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                        <section className='rounded-lg bg-surface border border-line p-4 flex flex-col gap-3' aria-label='Badges'>
                            <span className='text-[13px] text-ink-3'>Milestones</span>
                            <div className='grid grid-cols-3 gap-2'>
                                {[
                                    { label : 'First answer', earned : stats.solved >= 1, tone : 'blue' as const, value : '1' },
                                    { label : '50 answered', earned : stats.solved >= 50, tone : 'purple' as const, value : '50' },
                                    { label : '7-day streak', earned : stats.best >= 7, tone : 'yellow' as const, value : '7d' },
                                    { label : 'First test', earned : stats.tests >= 1, tone : 'green' as const, value : 'T1' },
                                    { label : 'Perfect test', earned : state.tests.some((run) => run.total > 0 && run.score === run.total), tone : 'orange' as const, value : '100' },
                                    { label : '30-day streak', earned : stats.best >= 30, tone : 'red' as const, value : '30d' },
                                ].map((badge) => (
                                    <div key={badge.label} className={`flex flex-col items-center gap-1 rounded-md py-2 ${badge.earned ? '' : 'opacity-35 grayscale'}`} title={badge.earned ? `Earned: ${badge.label}` : `Locked: ${badge.label}`}>
                                        <span className='w-10 h-10 rounded-lg inline-flex items-center justify-center text-[12px] font-bold tabular-nums'
                                            style={{ color : toneVar(badge.tone), background : `rgb(var(--tag-${badge.tone}-bg))` }}>{badge.value}</span>
                                        <span className='text-[11px] text-ink-3 text-center leading-tight'>{badge.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <section className='rounded-lg bg-surface border border-line p-4 flex flex-col gap-3 overflow-hidden' aria-label='Activity'>
                        <div className='flex flex-wrap items-baseline justify-between gap-2'>
                            <span className='text-[14px] text-ink'><b className='font-semibold tabular-nums'>{Array.from(counts.values()).reduce((a, b) => a + b, 0)}</b> <span className='text-ink-3'>answers in the past six months</span></span>
                            <span className='text-[12px] text-ink-3'>Active days <b className='font-medium text-ink tabular-nums'>{activeTotal}</b> · Max streak <b className='font-medium text-ink tabular-nums'>{stats.best}</b></span>
                        </div>
                        <div className='overflow-x-auto' style={{ scrollbarWidth : 'none' }}>
                            <div className='grid grid-flow-col gap-[3px] w-max' style={{ gridTemplateRows : 'repeat(7, 12px)' }}>
                                {cells.map((date) => {
                                    const key = dayKey(date)
                                    const value = counts.get(key) ?? 0
                                    const future = date > end
                                    return <span key={key} title={`${value} on ${date.toDateString()}`}
                                        className={`w-[12px] h-[12px] rounded-[3px] ${future ? 'opacity-0' : ''}`}
                                        style={{ background : value ? `rgb(var(--success) / ${[0, 0.3, 0.5, 0.75, 1][level(value)]})` : 'rgb(var(--ink) / 0.07)' }}/>
                                })}
                            </div>
                        </div>
                        <div className='flex items-center justify-end gap-1 text-[11px] text-ink-3'>
                            Less {[0, 1, 2, 3, 4].map((step) => <span key={step} className='w-[10px] h-[10px] rounded-[2px]' style={{ background : step ? `rgb(var(--success) / ${[0, 0.3, 0.5, 0.75, 1][step]})` : 'rgb(var(--ink) / 0.07)' }}/>)} More
                        </div>
                    </section>

                    <section className='rounded-lg bg-surface border border-line p-4 flex flex-col gap-2' aria-label='Recent'>
                        <div className='flex items-center gap-1 -mx-1'>
                            {(['Answers', 'Tests'] as const).map((item) => (
                                <button key={item} type='button' onClick={()=>setRecentTab(item)} className={`h-8 px-3 rounded-md text-[13px] transition-colors ${recentTab === item ? 'bg-ink/[0.07] text-ink font-medium' : 'text-ink-3 hover:text-ink'}`}>{item === 'Answers' ? 'Recent answers' : 'Tests'}</button>
                            ))}
                        </div>
                        {
                            recentTab === 'Tests' ? <TestHistory compact limit={8}/>
                            : recent.length === 0 ?
                            <p className='text-[14px] text-ink-3 py-6 text-center'>No answers yet. <button type='button' className='text-accent' onClick={()=>navigate('/questions')}>Start practising</button></p>
                            :
                            <div className='flex flex-col'>
                                {recent.map(([id, attempt], index) => {
                                    const question = getQuestion(id)
                                    return (
                                        <button key={id} type='button' onClick={()=>navigate(`/questions/${getCourse(attempt.courseID).id}/${id}`)}
                                            className={`flex items-center gap-3 h-11 px-3 rounded-md text-left text-[14px] hover:bg-ink/[0.06] ${index % 2 ? '' : 'bg-ink/[0.03]'}`}>
                                            <span className='flex-1 min-w-0 truncate text-ink'>{question ? plainText(question.question) : `${getCourse(attempt.courseID).code} · ${attempt.topic}`}</span>
                                            <span className={`text-[12px] font-medium ${attempt.correct ? 'text-success' : 'text-hard'}`}>{attempt.correct ? 'Correct' : 'Wrong'}</span>
                                            <span className='w-[84px] text-right text-[12px] text-ink-3'>{relativeDay(attempt.at)}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        }
                    </section>
                </div>
                :
                <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 items-start'>
                    <kit.Panel>
                        <kit.PanelTitle><FiEdit2 size={14}/> Profile</kit.PanelTitle>
                        <form className='flex flex-col gap-4' onSubmit={save}>
                            <kit.Label>Full name
                                <kit.TextInput required autoComplete='name' value={form.name} onChange={(e)=>setForm({ ...form, name : e.target.value })}/>
                            </kit.Label>
                            <kit.Label>Programme
                                <kit.TextInput value={form.program} onChange={(e)=>setForm({ ...form, program : e.target.value })}/>
                            </kit.Label>
                            <div className='grid grid-cols-2 gap-3'>
                                <kit.Label>School<kit.TextInput value={form.school} onChange={(e)=>setForm({ ...form, school : e.target.value })}/></kit.Label>
                                <kit.Label>Level<kit.TextInput value={form.year} onChange={(e)=>setForm({ ...form, year : e.target.value })}/></kit.Label>
                            </div>
                            <div className='flex items-center gap-2'>
                                <kit.PrimaryButton type='submit' disabled={!dirty || !form.name.trim()}>Save changes</kit.PrimaryButton>
                                {dirty && <kit.GhostButton type='button' onClick={()=>setForm(state.profile)}>Discard</kit.GhostButton>}
                            </div>
                        </form>
                    </kit.Panel>
                    <div className='flex flex-col gap-4'>
                        <kit.Panel>
                            <kit.PanelTitle>Appearance</kit.PanelTitle>
                            <ThemeSwitch wide/>
                        </kit.Panel>
                        <kit.Panel>
                            <kit.PanelTitle>Notifications</kit.PanelTitle>
                            {
                                ([
                                    ['dailyReminder', 'Daily challenge reminder'],
                                    ['replies', 'Replies to my comments'],
                                    ['weeklyReport', 'Weekly progress email'],
                                ] as const).map(([key, label]) => (
                                    <label key={key} className='flex items-center justify-between gap-3 text-[14px] text-ink-2 cursor-pointer'>
                                        {label}
                                        <Switch size='small' checked={state.prefs[key]} onChange={(value)=>progress.setPrefs({ [key] : value })}/>
                                    </label>
                                ))
                            }
                        </kit.Panel>
                        <kit.Panel>
                            <kit.PanelTitle>{signedIn ? 'Account' : 'Data on this device'}</kit.PanelTitle>
                            <span className='text-[14px] text-ink-2 leading-[1.5]'>
                                {signedIn ? <>Signed in as <b className='font-medium text-ink'>{session.user?.email}</b>. Your progress syncs to your account.</>
                                    : 'You are not logged in, so your progress is stored only in this browser. Log in to keep it across devices.'}
                            </span>
                            <div className='flex flex-wrap gap-2'>
                                {
                                    signedIn ?
                                    <kit.SecondaryButton type='button' onClick={logout}><FiLogOut size={14}/> Log out</kit.SecondaryButton>
                                    :
                                    <>
                                        <kit.PrimaryButton type='button' onClick={()=>navigate('/auth/login', { state : { from : '/profile' } })}>Log in</kit.PrimaryButton>
                                        <kit.GhostButton type='button' className='!text-hard' onClick={clearData}><FiTrash2 size={14}/> Clear my data</kit.GhostButton>
                                    </>
                                }
                            </div>
                        </kit.Panel>
                    </div>
                </div>
            }
        </main>
    )
}

export default Profile
