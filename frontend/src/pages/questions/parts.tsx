import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheck, FiChevronLeft, FiChevronRight, FiZap } from 'react-icons/fi'
import { Question } from '../../data/sample'
import { Attempt, dayKey, useProgress } from '../../store/progress'
import { useChallengeView } from '../../store/challenge'
import { startChallenge } from '../pod/pod'

export const plainText = (html : string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

// Share of first attempts that were right; only shown with enough answers to mean something
export const acceptanceOf = (question : Question) => {
    const source = question.acceptance ?? question.stats
    return source && source.attempts >= 5 && source.correctRate !== null ? Math.round(source.correctRate * 100) : null
}

// Solved / attempted / untouched, the way a problem list marks rows
export const StatusGlyph = ({ attempt } : { attempt? : Attempt }) => {
    if(!attempt) return <span className='w-4 h-4 inline-block' aria-label='Not answered'/>
    return attempt.correct
        ? <FiCheck size={16} strokeWidth={2.75} className='text-success' aria-label='Solved'/>
        : <span className='w-4 h-4 inline-flex items-center justify-center' aria-label='Attempted'>
            <span className='w-[11px] h-[11px] rounded-full border-2 border-medium'/>
          </span>
}

const untilMidnight = () => {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const total = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000))
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Month calendar with today's challenge, practised days marked; browse back through months
export const DailyCalendar = () => {
    const navigate = useNavigate()
    const state = useProgress()
    const view = useChallengeView()
    const [left, setLeft] = useState(untilMidnight)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        const id = window.setInterval(() => setLeft(untilMidnight()), 1000)
        return () => window.clearInterval(id)
    }, [])

    const now = new Date()
    const month = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const lead = month.getDay()
    const active = new Set(state.activeDays)
    const today = dayKey()
    const done = !!view.result

    return (
        <section className='rounded-lg bg-surface border border-line p-4 flex flex-col gap-3' aria-label='Daily challenge calendar'>
            <div className='flex items-center gap-2'>
                <span className='text-[14px] font-medium text-ink'>{offset === 0 ? `Day ${now.getDate()}` : month.toLocaleDateString(undefined, { month : 'long', year : 'numeric' })}</span>
                {offset === 0 && <span className='text-[12px] text-ink-3 font-mono tabular-nums'>{left} left</span>}
                <span className='ml-auto flex'>
                    <button type='button' aria-label='Previous month' onClick={()=>setOffset(offset - 1)} className='w-6 h-6 inline-flex items-center justify-center rounded text-ink-3 hover:bg-ink/[0.06] hover:text-ink'><FiChevronLeft size={15}/></button>
                    <button type='button' aria-label='Next month' disabled={offset === 0} onClick={()=>setOffset(offset + 1)} className='w-6 h-6 inline-flex items-center justify-center rounded text-ink-3 hover:bg-ink/[0.06] hover:text-ink disabled:opacity-30'><FiChevronRight size={15}/></button>
                </span>
            </div>
            <div className='grid grid-cols-7 gap-y-1 text-center'>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => <span key={index} className='text-[11px] text-ink-3 h-6 leading-6'>{label}</span>)}
                {Array.from({ length : lead }).map((_, index) => <span key={`l${index}`}/>)}
                {Array.from({ length : days }).map((_, index) => {
                    const date = new Date(month.getFullYear(), month.getMonth(), index + 1)
                    const key = dayKey(date)
                    const isToday = key === today
                    const practised = active.has(key)
                    const future = key > today
                    return (
                        <span key={key} className='flex items-center justify-center'>
                            <button
                                type='button'
                                disabled={!isToday}
                                onClick={()=> done ? navigate('/challenges') : startChallenge(navigate, view.course.id)}
                                title={isToday ? (done ? "Today's challenge: done" : "Start today's challenge") : practised ? 'Practised' : undefined}
                                className={`relative w-7 h-7 rounded-full text-[12px] tabular-nums inline-flex items-center justify-center transition-transform
                                ${isToday ? (done ? 'bg-success text-white font-semibold' : 'bg-success text-white font-semibold enabled:hover:scale-110 enabled:active:scale-95') : future ? 'text-ink-4' : 'text-ink-2'}`}
                            >
                                {index + 1}
                                {practised && !isToday && <span className='absolute bottom-[2px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-success'/>}
                            </button>
                        </span>
                    )
                })}
            </div>
            <button
                type='button'
                onClick={()=> done ? navigate('/challenges') : startChallenge(navigate, view.course.id)}
                className='flex items-center gap-3 rounded-md bg-ink/[0.04] hover:bg-ink/[0.07] px-3 py-2 text-left transition-colors'
            >
                <FiZap size={15} className='text-medium shrink-0' fill={done ? 'currentColor' : 'none'}/>
                <span className='flex flex-col min-w-0 flex-1 leading-tight'>
                    <span className='text-[13px] font-medium text-ink truncate'>{done ? `Done · ${view.result?.score}/${view.result?.total}` : "Today's challenge"}</span>
                    <span className='text-[12px] text-ink-3 truncate'>{view.course.name} · {view.count} questions</span>
                </span>
                <span className='text-[12px] font-medium text-accent shrink-0'>{done ? 'Board' : 'Start'}</span>
            </button>
        </section>
    )
}

// Solved ring with a difficulty breakdown, like a problem tracker's progress card
export const SolvedCard = ({ questions } : { questions : Question[] }) => {
    const state = useProgress()
    const solved = questions.filter((question) => state.attempts[question.id]?.correct)
    const attempted = questions.filter((question) => state.attempts[question.id] && !state.attempts[question.id].correct).length
    const share = questions.length ? solved.length / questions.length : 0
    const r = 40, c = 2 * Math.PI * r
    const rows = (['Easy', 'Medium', 'Hard'] as const).map((level) => ({
        level,
        total : questions.filter((question) => question.difficulty === level).length,
        solved : solved.filter((question) => question.difficulty === level).length,
    }))
    const tone = { Easy : 'easy', Medium : 'medium', Hard : 'hard' } as const

    return (
        <section className='rounded-lg bg-surface border border-line p-4 flex items-center gap-5' aria-label='Solved'>
            <div className='relative w-[96px] h-[96px] shrink-0'>
                <svg viewBox='0 0 100 100' className='w-full h-full -rotate-90'>
                    <circle cx='50' cy='50' r={r} fill='none' strokeWidth='6' stroke='rgb(var(--ink) / 0.08)'/>
                    <circle cx='50' cy='50' r={r} fill='none' strokeWidth='6' strokeLinecap='round' stroke='rgb(var(--success))'
                        strokeDasharray={`${c * share} ${c}`} style={{ transition : 'stroke-dasharray 600ms var(--ease-out)' }}/>
                </svg>
                <span className='absolute inset-0 flex flex-col items-center justify-center leading-none'>
                    <span className='text-[22px] font-semibold text-ink tabular-nums tracking-[-0.03em]'>{solved.length}<span className='text-[13px] text-ink-3'>/{questions.length}</span></span>
                    <span className='text-[11px] text-ink-3 mt-1'>Solved</span>
                </span>
            </div>
            <div className='flex flex-col gap-[6px] flex-1 min-w-0'>
                {attempted > 0 && <span className='text-[11px] text-ink-3 px-1'>{attempted} attempted, not yet solved</span>}
                {rows.map((row) => (
                    <div key={row.level} className='flex items-center justify-between rounded-md bg-ink/[0.04] px-3 h-9 text-[12px]'>
                        <span className={`font-medium text-${tone[row.level]}`}>{row.level === 'Medium' ? 'Med.' : row.level}</span>
                        <span className='text-ink tabular-nums font-medium'>{row.solved}<span className='text-ink-3'>/{row.total}</span></span>
                    </div>
                ))}
            </div>
        </section>
    )
}
