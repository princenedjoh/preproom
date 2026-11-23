import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import * as kit from '../../styles/kit'
import CourseIcon from '../../components/courseIcon/courseIcon'
import { Question } from '../../data/sample'
import { getCourse, fetchQuestions, useCatalog, catalogSource } from '../../data/catalog'
import { useProgress, courseProgress } from '../../store/progress'
import { difficultyClass } from '../mcqs/mcqs'
import { StatusGlyph, plainText } from '../questions/parts'
import { FiPlay, FiBookOpen, FiAward, FiChevronLeft, FiCheck } from 'react-icons/fi'

const levelOrder = { Easy : 0, Medium : 1, Hard : 2 }

// A course as a study plan: every question grouped by topic, easiest first, with a badge at the end
const Plan = () => {

    const navigate = useNavigate()
    const { courseID } = useParams()
    const course = getCourse(courseID)
    const { courses } = useCatalog()
    const state = useProgress()
    const [questions, setQuestions] = useState<Question[] | null>(null)
    const [showTags, setShowTags] = useState(false)

    useEffect(() => {
        let active = true
        setQuestions(null)
        fetchQuestions(course.id).then((items) => { if(active) setQuestions(items) })
        return () => { active = false }
    }, [course.id])

    const numberOf = useMemo(() => new Map((questions ?? []).map((question, index) => [question.id, index + 1])), [questions])
    const groups = useMemo(() => {
        const byTopic = new Map<string, Question[]>()
        ;(questions ?? []).forEach((question) => byTopic.set(question.topic, [...(byTopic.get(question.topic) ?? []), question]))
        return Array.from(byTopic.entries())
            .map(([topic, items]) => [topic, [...items].sort((a, b) => levelOrder[a.difficulty] - levelOrder[b.difficulty])] as const)
            .sort((a, b) => Math.min(...a[1].map((q) => levelOrder[q.difficulty])) - Math.min(...b[1].map((q) => levelOrder[q.difficulty])))
    }, [questions])

    const ordered = groups.flatMap(([, items]) => items)
    const solved = ordered.filter((question) => state.attempts[question.id]?.correct).length
    const next = ordered.find((question) => !state.attempts[question.id]?.correct)
    const total = ordered.length
    const complete = total > 0 && solved === total
    const years = (questions ?? []).map((question) => question.year)
    const open = (question : Question) => navigate(`/questions/${course.id}/${question.id}`)

    return (
        <main className='w-full max-w-[1200px] mx-auto px-3 md:px-5 py-5 md:py-6 flex flex-col gap-6'>
            <div className='flex items-center justify-between'>
                <kit.IconButton type='button' aria-label='Back to questions' onClick={()=>navigate(`/questions/${course.id}`)}><FiChevronLeft size={18}/></kit.IconButton>
            </div>

            <header className='flex flex-col sm:flex-row sm:items-center gap-6 px-2'>
                <CourseIcon course={course} size={112}/>
                <div className='flex flex-col gap-3'>
                    <span className='inline-flex items-center gap-[6px] text-[13px] text-ink-3'><FiBookOpen size={13}/> Study plan · {course.code}</span>
                    <h1 className='text-[28px] font-semibold tracking-[-0.02em] text-ink leading-tight'>{course.name}</h1>
                    <div className='flex flex-wrap items-center gap-4'>
                        <button type='button' disabled={!questions} onClick={()=> next ? open(next) : ordered[0] && open(ordered[0])}
                            className='h-9 px-4 inline-flex items-center gap-2 rounded-full bg-ink text-surface text-[14px] font-medium hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] disabled:opacity-40'>
                            <FiPlay size={13} fill='currentColor'/> {solved === 0 ? 'Start' : complete ? 'Review' : 'Continue'}
                        </button>
                        {
                            total > 0 &&
                            <span className='flex items-center gap-3 text-[13px] text-ink-2 tabular-nums'>
                                <span className='w-[160px]'><kit.ProgressTrack height={6}><kit.ProgressFill value={solved / total * 100} color='rgb(var(--success))'/></kit.ProgressTrack></span>
                                {solved}/{total} solved
                            </span>
                        }
                    </div>
                </div>
            </header>

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_270px] gap-6 items-start'>
                <section className='flex flex-col gap-4 min-w-0' aria-label='Questions by topic'>
                    <label className='self-end inline-flex items-center gap-2 text-[13px] text-ink-2 cursor-pointer select-none'>
                        <input type='checkbox' checked={showTags} onChange={(e)=>setShowTags(e.target.checked)} className='accent-[rgb(var(--accent))]'/> Show paper details
                    </label>
                    {
                        !questions ?
                        Array.from({ length : 3 }).map((_, index) => <div key={index} className='h-[180px] rounded-lg bg-ink/[0.04] animate-pulse'/>)
                        :
                        groups.map(([topic, items]) => {
                            const done = items.filter((question) => state.attempts[question.id]?.correct).length
                            return (
                                <div key={topic} className='rounded-lg border border-line overflow-hidden bg-surface'>
                                    <div className='h-10 px-4 flex items-center justify-between bg-ink/[0.04] text-[13px]'>
                                        <span className='font-medium text-ink'>{topic}</span>
                                        <span className={`tabular-nums ${done === items.length ? 'text-success font-medium' : 'text-ink-3'}`}>{done === items.length ? <span className='inline-flex items-center gap-1'><FiCheck size={13} strokeWidth={2.75}/> Done</span> : `${done}/${items.length}`}</span>
                                    </div>
                                    {items.map((question) => (
                                        <button key={question.id} type='button' onClick={()=>open(question)}
                                            className='group w-full grid grid-cols-[24px_minmax(0,1fr)_auto_64px] items-center gap-3 px-4 h-12 text-left border-t border-line hover:bg-ink/[0.03] transition-colors'>
                                            <StatusGlyph attempt={state.attempts[question.id]}/>
                                            <span className='flex flex-col min-w-0'>
                                                <span className='text-[14px] font-medium text-ink truncate group-hover:text-accent transition-colors'>{numberOf.get(question.id)}. {plainText(question.question)}</span>
                                                {showTags && <span className='text-[12px] text-ink-3'>{question.year}{question.institution ? ` · ${question.institution}` : ''}</span>}
                                            </span>
                                            <span className={`hidden sm:inline-flex items-center gap-1 text-[13px] ${state.attempts[question.id] ? 'text-ink-2' : 'text-ink-4'}`}><FiBookOpen size={13}/> Explanation</span>
                                            <span className={`text-right text-[13px] font-medium ${difficultyClass[question.difficulty]}`}>{question.difficulty}</span>
                                        </button>
                                    ))}
                                </div>
                            )
                        })
                    }
                </section>

                <aside className='flex flex-col gap-6 lg:sticky lg:top-[66px]'>
                    <div className='flex flex-col gap-2'>
                        <h2 className='text-[18px] font-semibold text-ink'>Summary</h2>
                        <ul className='flex flex-col gap-1 text-[13px] text-ink-2 list-disc pl-4'>
                            <li>{total || course.questions} past questions in {groups.length || '…'} topics</li>
                            {years.length > 0 && <li>Papers from {Math.min(...years)} to {Math.max(...years)}</li>}
                            <li>Easiest first within each topic</li>
                            <li>About {Math.max(1, Math.round((total || course.questions) * 1.5 / 10) * 10)} minutes in total</li>
                            {catalogSource() === 'api' && <li>Explanations unlock as you answer</li>}
                        </ul>
                    </div>
                    <div className='flex flex-col gap-3'>
                        <h2 className='text-[18px] font-semibold text-ink'>Award</h2>
                        <div className={`flex items-center gap-3 ${complete ? '' : 'opacity-60'}`}>
                            <span className='relative w-14 h-14 shrink-0'>
                                <CourseIcon course={course} size={56}/>
                                <span className={`absolute -right-1 -bottom-1 w-6 h-6 rounded-full inline-flex items-center justify-center ring-2 ring-canvas ${complete ? 'bg-success-solid text-white' : 'bg-ink/[0.15] text-ink-3'}`}><FiAward size={13}/></span>
                            </span>
                            <span className='flex flex-col'>
                                <span className='text-[14px] font-medium text-ink'>{course.name}</span>
                                <span className='text-[12px] text-ink-3'>{complete ? 'Earned. Every question solved.' : 'Solve every question to earn the badge.'}</span>
                            </span>
                        </div>
                    </div>
                    <div className='flex flex-col gap-3'>
                        <h2 className='text-[18px] font-semibold text-ink'>Related</h2>
                        {courses.filter((item) => item.id !== course.id).slice(0, 4).map((item) => {
                            const value = courseProgress(state, item.id, item.questions)
                            return (
                                <Link key={item.id} to={`/plan/${item.id}`} className='flex items-center gap-3 group'>
                                    <CourseIcon course={item} size={36}/>
                                    <span className='flex flex-col min-w-0'>
                                        <span className='text-[14px] font-medium text-ink truncate group-hover:text-accent transition-colors'>{item.name}</span>
                                        <span className='text-[12px] text-ink-3'>{item.questions} questions{value.answered ? ` · ${value.answered} done` : ''}</span>
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </aside>
            </div>
        </main>
    )
}

export default Plan
