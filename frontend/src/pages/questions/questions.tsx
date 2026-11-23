import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams, NavLink } from 'react-router-dom'
import { confirm } from '../../components/dialog/confirm'
import * as kit from '../../styles/kit'
import CourseIcon from '../../components/courseIcon/courseIcon'
import { Question, Difficulty } from '../../data/sample'
import { getCourse, fetchQuestions, useCatalog } from '../../data/catalog'
import { progress, useProgress, courseProgress } from '../../store/progress'
import { difficultyClass, difficultyShort } from '../mcqs/mcqs'
import { DailyCalendar, SolvedCard, StatusGlyph, acceptanceOf, plainText } from './parts'
import { FiSearch, FiBookmark, FiCheckCircle, FiClock, FiRotateCcw, FiShuffle, FiChevronDown, FiX, FiCalendar } from "react-icons/fi";
import { useChallengeView } from '../../store/challenge'

const difficulties : ('All' | Difficulty)[] = ['All', 'Easy', 'Medium', 'Hard']
const sorts = ['Default', 'Newest', 'Oldest', 'Hardest', 'Acceptance'] as const
const statuses = ['all', 'unanswered', 'mistakes', 'saved'] as const
type Status = typeof statuses[number]
const statusLabels : Record<Status, string> = { all : 'All', unanswered : 'Unanswered', mistakes : 'Mistakes', saved : 'Saved' }
const difficultyRank = { Easy : 0, Medium : 1, Hard : 2 }

// A quiet native select styled as a toolbar button
const Select = <T extends string,>({ label, value, options, onChange, format } : { label : string, value : T, options : readonly T[], onChange : (value : T) => void, format? : (value : T) => string }) => (
    <label className={`relative inline-flex items-center h-8 rounded-md text-[13px] transition-colors ${value !== options[0] ? 'bg-accent-tint text-accent' : 'bg-ink/[0.05] text-ink-2 hover:bg-ink/[0.08]'}`}>
        <span className='sr-only'>{label}</span>
        <select value={value} onChange={(e)=>onChange(e.target.value as T)} className='appearance-none bg-transparent h-full pl-3 pr-7 outline-none cursor-pointer'>
            {options.map((item) => <option key={item} value={item}>{format ? format(item) : item}</option>)}
        </select>
        <FiChevronDown size={13} className='absolute right-2 pointer-events-none'/>
    </label>
)

const Questions = () => {

    const navigate = useNavigate()
    const { courseID } = useParams()
    const state = useProgress()
    const { courses } = useCatalog()
    const challenge = useChallengeView()
    // /questions with no course opens the one you practised most recently
    const lastCourseID = Object.values(state.attempts).sort((a, b) => b.at - a.at)[0]?.courseID
    const course = getCourse(courseID ?? lastCourseID)
    const [params, setParams] = useSearchParams()
    const status : Status = (statuses as readonly string[]).includes(params.get('status') ?? '') ? params.get('status') as Status : 'all'

    const [data, setData] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState(() => params.get('q') ?? '')
    const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All')
    const [topic, setTopic] = useState('All')
    const [sort, setSort] = useState<typeof sorts[number]>('Default')

    useEffect(()=>{
        let active = true
        setLoading(true)
        setTopic(params.get('topic') ?? 'All')
        if(params.get('q') !== null) setSearch(params.get('q') ?? '')
        fetchQuestions(course.id).then((questions) => {
            if(!active) return
            setData(questions)
            setLoading(false)
        })
        return () => { active = false }
    // Deep links (?topic=, ?q=) apply when the course or link changes, not on every filter tweak
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[course.id, params.get('topic'), params.get('q')])

    const setStatus = (next : Status) => {
        const updated = new URLSearchParams(params)
        next === 'all' ? updated.delete('status') : updated.set('status', next)
        setParams(updated, { replace : true })
    }

    const matchesStatus = (question : Question, which : Status) => {
        const attempt = state.attempts[question.id]
        if(which === 'unanswered') return !attempt
        if(which === 'mistakes') return !!attempt && !attempt.correct
        if(which === 'saved') return !!state.saved[question.id]
        return true
    }

    // Stable numbering: the order questions sit in the bank, like problem numbers
    const numberOf = useMemo(() => new Map(data.map((question, index) => [question.id, index + 1])), [data])
    const topics = useMemo(() => {
        const counts = new Map<string, number>()
        data.forEach((question) => counts.set(question.topic, (counts.get(question.topic) ?? 0) + 1))
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    }, [data])

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase()
        return data
            .filter((question) => matchesStatus(question, status))
            .filter((question) => difficulty === 'All' || question.difficulty === difficulty)
            .filter((question) => topic === 'All' || question.topic === topic)
            .filter((question) => !term || plainText(question.question).toLowerCase().includes(term) || question.topic.toLowerCase().includes(term) || String(numberOf.get(question.id)) === term)
            .sort((a, b) => sort === 'Newest' ? b.year - a.year
                : sort === 'Oldest' ? a.year - b.year
                : sort === 'Hardest' ? difficultyRank[b.difficulty] - difficultyRank[a.difficulty]
                : sort === 'Acceptance' ? (acceptanceOf(a) ?? 101) - (acceptanceOf(b) ?? 101)
                : (numberOf.get(a.id) ?? 0) - (numberOf.get(b.id) ?? 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, search, difficulty, topic, sort, status, state.attempts, state.saved])

    const stats = courseProgress(state, course.id, data.length || course.questions)
    const solved = data.filter((question) => state.attempts[question.id]?.correct).length
    const filtersActive = !!search || difficulty !== 'All' || topic !== 'All' || status !== 'all' || sort !== 'Default'

    const clearFilters = () => {
        setSearch(''); setDifficulty('All'); setTopic('All'); setStatus('all'); setSort('Default')
    }

    const open = (question : Question) => navigate(`/questions/${course.id}/${question.id}${params.toString() ? `?${params.toString()}` : ''}`)

    const shuffle = () => {
        const pool = visible.filter((question) => !state.attempts[question.id])
        const pick = (pool.length ? pool : visible)[Math.floor(Math.random() * (pool.length ? pool.length : visible.length))]
        if(pick) open(pick)
    }

    const resetCourse = () => confirm({
        title : `Reset ${course.name}?`,
        content : 'This clears your answers for this course. Saved questions and test history stay.',
        okText : 'Reset progress',
        danger : true,
        onOk : () => progress.clearAttempts(course.id),
    })

    const mistakes = Object.values(state.attempts).filter((attempt) => !attempt.correct && attempt.courseID === course.id).length
    const saved = data.filter((question) => state.saved[question.id]).length

    const emptyCopy = status === 'saved' ? { icon : FiBookmark, title : 'No saved questions yet', text : 'Press S on any question to keep it here.' }
        : status === 'mistakes' ? { icon : FiCheckCircle, title : 'No mistakes to review', text : 'Questions you get wrong collect here.' }
        : status === 'unanswered' ? { icon : FiCheckCircle, title : `You've answered every ${course.name} question`, text : 'Review your mistakes or take a timed test.' }
        : { icon : FiSearch, title : 'No questions match', text : 'Try another topic or clear the filters.' }

    const libraryRow = (active : boolean) => `flex items-center gap-[10px] h-9 px-2 rounded-md text-[14px] transition-colors ${active ? 'bg-ink/[0.07] text-ink font-medium' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'}`

    return (
        <main className='w-full max-w-[1440px] mx-auto px-3 md:px-5 py-5 md:py-6 grid grid-cols-1 lg:grid-cols-[216px_minmax(0,1fr)] xl:grid-cols-[216px_minmax(0,1fr)_288px] gap-5 items-start'>

            {/* Library rail */}
            <aside className='hidden lg:flex flex-col gap-1 sticky top-[66px]' aria-label='Library'>
                <span className='px-2 pb-1 text-[12px] font-medium text-ink-3'>Courses</span>
                {courses.map((item) => {
                    const value = courseProgress(state, item.id, item.questions)
                    return (
                        <NavLink key={item.id} to={`/questions/${item.id}`} className={libraryRow(item.id === course.id && status === 'all')}>
                            <CourseIcon course={item} size={20}/>
                            <span className='flex-1 truncate'>{item.name}</span>
                            {value.answered > 0 && <span className='text-[11px] text-ink-3 tabular-nums'>{value.answered}/{item.questions}</span>}
                        </NavLink>
                    )
                })}
                <span className='px-2 pt-4 pb-1 text-[12px] font-medium text-ink-3'>My lists</span>
                <button type='button' onClick={()=>setStatus('mistakes')} className={libraryRow(status === 'mistakes')}>
                    <FiRotateCcw size={15} className='text-hard'/> <span className='flex-1 text-left'>Mistakes</span>
                    {mistakes > 0 && <span className='text-[11px] text-ink-3 tabular-nums'>{mistakes}</span>}
                </button>
                <button type='button' onClick={()=>setStatus('saved')} className={libraryRow(status === 'saved')}>
                    <FiBookmark size={15} className='text-accent'/> <span className='flex-1 text-left'>Saved</span>
                    {saved > 0 && <span className='text-[11px] text-ink-3 tabular-nums'>{saved}</span>}
                </button>
            </aside>

            {/* The list */}
            <section className='flex flex-col gap-4 min-w-0' aria-label={`${course.name} questions`}>
                <div className='flex flex-wrap items-center gap-3'>
                    <CourseIcon course={course} size={36}/>
                    <div className='flex flex-col min-w-0 flex-1'>
                        <h1 className='text-[20px] font-semibold tracking-[-0.02em] text-ink leading-tight truncate'>{course.name}</h1>
                        <span className='text-[12px] text-ink-3'>{course.code} · {data.length || course.questions} past questions{stats.answered ? ` · ${stats.accuracy}% right` : ''}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        {stats.answered > 0 && <kit.GhostButton type='button' className='!h-8' onClick={resetCourse}><FiRotateCcw size={13}/> Reset</kit.GhostButton>}
                        <kit.PrimaryButton type='button' className='!h-8' onClick={()=>navigate('/test/testconfig', { state : { courseID : course.id } })}>
                            <FiClock size={13}/> Timed test
                        </kit.PrimaryButton>
                    </div>
                </div>

                {/* Topics, with counts */}
                <div className='flex flex-wrap items-center gap-x-1 gap-y-1'>
                    {[['All', data.length] as [string, number], ...topics].map(([name, count]) => (
                        <button key={name} type='button' onClick={()=>setTopic(name)} aria-pressed={topic === name}
                            className={`h-7 px-[10px] rounded-full text-[13px] inline-flex items-center gap-[6px] transition-colors
                            ${topic === name ? 'bg-ink text-surface' : 'text-ink-2 hover:bg-ink/[0.06]'}`}>
                            {name === 'All' ? 'All topics' : name}
                            <span className={`text-[11px] tabular-nums ${topic === name ? 'opacity-70' : 'text-ink-4'}`}>{count}</span>
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className='flex flex-wrap items-center gap-2'>
                    <label className='relative flex-1 min-w-[180px] max-w-[300px]'>
                        <FiSearch size={14} className='absolute left-[10px] top-1/2 -translate-y-1/2 text-ink-3'/>
                        <input type='search' value={search} onChange={(e)=>setSearch(e.target.value)} placeholder='Search questions' aria-label='Search questions'
                            className='w-full h-8 rounded-md bg-ink/[0.05] focus:bg-surface focus:ring-1 focus:ring-accent/60 pl-8 pr-2 text-[13px] text-ink placeholder:text-ink-3 outline-none transition-colors'/>
                    </label>
                    <Select label='Status' value={status} options={statuses} onChange={setStatus} format={(value) => value === 'all' ? 'Status' : statusLabels[value]}/>
                    <Select label='Difficulty' value={difficulty} options={difficulties} onChange={setDifficulty} format={(value) => value === 'All' ? 'Difficulty' : value}/>
                    <Select label='Sort' value={sort} options={sorts} onChange={setSort} format={(value) => value === 'Default' ? 'Sort' : value}/>
                    {filtersActive && <button type='button' onClick={clearFilters} className='h-8 px-2 inline-flex items-center gap-1 rounded-md text-[13px] text-ink-3 hover:text-ink hover:bg-ink/[0.05]'><FiX size={13}/> Clear</button>}
                    <span className='ml-auto flex items-center gap-3'>
                        <span className='inline-flex items-center gap-2 text-[13px] text-ink-2 tabular-nums'>
                            <svg viewBox='0 0 20 20' className='w-[18px] h-[18px] -rotate-90' aria-hidden>
                                <circle cx='10' cy='10' r='8' fill='none' strokeWidth='2.5' stroke='rgb(var(--ink) / 0.1)'/>
                                <circle cx='10' cy='10' r='8' fill='none' strokeWidth='2.5' stroke='rgb(var(--success))' strokeLinecap='round' strokeDasharray={`${data.length ? 50.3 * solved / data.length : 0} 50.3`}/>
                            </svg>
                            {solved}/{data.length} Solved
                        </span>
                        <button type='button' onClick={shuffle} disabled={!visible.length} title='Pick one at random' aria-label='Random question'
                            className='w-8 h-8 inline-flex items-center justify-center rounded-full bg-ink/[0.05] text-ink-2 hover:bg-ink/[0.08] hover:text-ink transition-colors disabled:opacity-40'>
                            <FiShuffle size={14}/>
                        </button>
                    </span>
                </div>

                {/* Table */}
                {
                    loading ?
                    <div className='flex flex-col gap-[2px]' aria-busy='true'>
                        {Array.from({ length : 8 }).map((_, index) => <div key={index} className={`h-11 rounded-md ${index % 2 ? '' : 'bg-ink/[0.03]'} animate-pulse`}/>)}
                    </div>
                    : visible.length === 0 ?
                    <kit.Empty>
                        <emptyCopy.icon size={20}/>
                        <span className='text-[15px] font-medium text-ink'>{emptyCopy.title}</span>
                        <span className='text-[14px] max-w-[360px]'>{emptyCopy.text}</span>
                        {filtersActive && <kit.SecondaryButton type='button' className='mt-2' onClick={clearFilters}>Show all questions</kit.SecondaryButton>}
                    </kit.Empty>
                    :
                    <div role='table' aria-label='Questions' className='flex flex-col'>
                        <div role='row' className='hidden md:grid grid-cols-[28px_minmax(0,1fr)_140px_92px_64px_48px] gap-3 px-3 h-9 items-center text-[12px] text-ink-3'>
                            <span role='columnheader'><span className='sr-only'>Status</span></span>
                            <span role='columnheader'>Question</span>
                            <span role='columnheader'>Topic</span>
                            <span role='columnheader' className='text-right'>Acceptance</span>
                            <span role='columnheader'>Difficulty</span>
                            <span role='columnheader' className='text-right'>Year</span>
                        </div>
                        {/* Today's challenge pinned on top */}
                        {
                            status === 'all' && topic === 'All' && !search &&
                            <button type='button' role='row' onClick={()=>navigate('/challenges')}
                                className='grid grid-cols-[28px_minmax(0,1fr)_auto] md:grid-cols-[28px_minmax(0,1fr)_140px_92px_64px_48px] gap-3 px-3 h-11 items-center text-left rounded-md bg-ink/[0.035] hover:bg-ink/[0.06] transition-colors'>
                                <FiCalendar size={15} className='text-accent'/>
                                <span className='text-[14px] text-ink truncate'>Daily challenge · {challenge.course.name}</span>
                                <span className='hidden md:block text-[13px] text-ink-3'>{challenge.count} questions</span>
                                <span className='hidden md:block'/>
                                <span className='text-[13px] text-medium font-medium'>Mixed</span>
                                <span className='hidden md:block text-right text-[12px] text-ink-3'>{challenge.result ? 'Done' : 'Today'}</span>
                            </button>
                        }
                        {visible.map((question, index) => {
                            const attempt = state.attempts[question.id]
                            const acceptance = acceptanceOf(question)
                            return (
                                <button
                                    key={question.id}
                                    type='button'
                                    role='row'
                                    onClick={()=>open(question)}
                                    className={`group grid grid-cols-[28px_minmax(0,1fr)_auto] md:grid-cols-[28px_minmax(0,1fr)_140px_92px_64px_48px] gap-3 px-3 h-11 items-center text-left rounded-md transition-colors
                                    ${index % 2 ? 'bg-ink/[0.035]' : ''} hover:bg-ink/[0.07]`}
                                >
                                    <span role='cell' className='flex items-center'><StatusGlyph attempt={attempt}/></span>
                                    <span role='cell' className='flex items-center gap-2 min-w-0'>
                                        <span className='text-[14px] text-ink truncate group-hover:text-accent transition-colors'>
                                            <span className='tabular-nums'>{numberOf.get(question.id)}.</span> {plainText(question.question)}
                                        </span>
                                        {state.saved[question.id] && <FiBookmark size={12} className='text-accent shrink-0' fill='currentColor' aria-label='Saved'/>}
                                    </span>
                                    <span role='cell' className='hidden md:block text-[13px] text-ink-3 truncate'>{question.topic}</span>
                                    <span role='cell' className='hidden md:block text-right text-[13px] text-ink-2 tabular-nums'>{acceptance === null ? <span className='text-ink-4'>—</span> : `${acceptance}%`}</span>
                                    <span role='cell' className={`text-[13px] font-medium ${difficultyClass[question.difficulty]}`}>{difficultyShort[question.difficulty]}</span>
                                    <span role='cell' className='hidden md:block text-right text-[13px] text-ink-3 tabular-nums'>{question.year}</span>
                                </button>
                            )
                        })}
                    </div>
                }
            </section>

            {/* Right rail */}
            <aside className='hidden xl:flex flex-col gap-4 sticky top-[66px]' aria-label='Progress'>
                <DailyCalendar/>
                {!loading && <SolvedCard questions={data}/>}
            </aside>
        </main>
    )
}

export default Questions
