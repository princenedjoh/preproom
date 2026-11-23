import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CourseIcon from '../../components/courseIcon/courseIcon'
import { confirm } from '../../components/dialog/confirm'
import * as kit from '../../styles/kit'
import Mcqs from '../mcqs/mcqs'
import SegmentedControl from '../../components/UI/segmented/segmented'
import { Question, Difficulty } from '../../data/sample'
import { getCourse, fetchQuestions, useCatalog } from '../../data/catalog'
import { progress, useProgress, courseProgress } from '../../store/progress'
import { FiSearch, FiBookmark, FiCheckCircle, FiClock, FiEye, FiEyeOff, FiRotateCcw } from "react-icons/fi";

const difficulties : ('All' | Difficulty)[] = ['All', 'Easy', 'Medium', 'Hard']
const sorts = ['Newest', 'Oldest', 'Hardest'] as const
const statuses = ['all', 'unanswered', 'mistakes', 'saved'] as const
type Status = typeof statuses[number]
const statusLabels : Record<Status, string> = { all : 'All', unanswered : 'Unanswered', mistakes : 'Mistakes', saved : 'Saved' }
const difficultyRank = { Easy : 0, Medium : 1, Hard : 2 }

const Questions = () => {

    const navigate = useNavigate()
    const { courseID } = useParams()
    const state = useProgress()
    useCatalog()
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
    const [sort, setSort] = useState<typeof sorts[number]>('Newest')
    const [revealAll, setRevealAll] = useState(false)
    const [schools, setSchools] = useState<string[]>([])

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

    const counts = useMemo(() => Object.fromEntries(statuses.map((which) =>
        [which, data.filter((question) => matchesStatus(question, which)).length])) as Record<Status, number>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, state])

    const institutions = useMemo(() => Array.from(new Set(data.map((question) => question.institution).filter(Boolean) as string[])).sort(), [data])
    const toggleSchool = (school : string) => setSchools(schools.includes(school) ? schools.filter((item) => item !== school) : [...schools, school])

    const topics = useMemo(() => ['All', ...Array.from(new Set(data.map((question) => question.topic)))], [data])

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase()
        return data
            .filter((question) => matchesStatus(question, status))
            .filter((question) => difficulty === 'All' || question.difficulty === difficulty)
            .filter((question) => topic === 'All' || question.topic === topic)
            .filter((question) => schools.length === 0 || schools.includes(question.institution ?? ''))
            .filter((question) => !term || question.question.toLowerCase().includes(term) || question.topic.toLowerCase().includes(term))
            .sort((a, b) => sort === 'Newest' ? b.year - a.year
                : sort === 'Oldest' ? a.year - b.year
                : difficultyRank[b.difficulty] - difficultyRank[a.difficulty])
    // Status membership is frozen while answering so a card doesn't vanish the moment it is answered
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, search, difficulty, topic, sort, status, schools])

    const stats = courseProgress(state, course.id, data.length || course.questions)
    const filtersActive = search || difficulty !== 'All' || topic !== 'All' || status !== 'all' || schools.length > 0

    const clearFilters = () => {
        setSearch('')
        setDifficulty('All')
        setTopic('All')
        setStatus('all')
        setSchools([])
    }

    const resetCourse = () => {
        confirm({
            title : `Reset ${course.name}?`,
            content : 'This clears your answers for this course on this device. Saved questions and test history stay.',
            okText : 'Reset progress',
            cancelText : 'Cancel',
            danger : true,
            onOk : () => progress.clearAttempts(course.id),
        })
    }

    const emptyCopy = status === 'saved' ? { icon : FiBookmark, title : 'No saved questions yet', text : 'Press Save on any question to keep it here for revision.' }
        : status === 'mistakes' ? { icon : FiCheckCircle, title : 'No mistakes to review', text : 'Questions you get wrong will collect here.' }
        : status === 'unanswered' ? { icon : FiCheckCircle, title : `You've answered every ${course.name} question`, text : 'Review your mistakes or take a timed test.' }
        : { icon : FiSearch, title : 'No questions match your filters', text : 'Try a different topic or difficulty.' }

    const years = data.map((question) => question.year)
    const span = years.length ? (Math.min(...years) === Math.max(...years) ? `${Math.min(...years)}` : `${Math.min(...years)}–${Math.max(...years)}`) : '—'
    const topicCount = (name : string) => name === 'All' ? data.filter((question) => matchesStatus(question, status)).length : data.filter((question) => question.topic === name && matchesStatus(question, status)).length

    return (
        <kit.Page>
            <div className='w-full max-w-[780px] flex flex-col gap-7'>
                <header className='flex flex-col gap-5 pt-2'>
                    <CourseIcon course={course} size={44}/>
                    <div className='flex flex-col gap-1'>
                        <kit.PageTitle>{course.name}</kit.PageTitle>
                        <span className='text-[14px] text-ink-3'>{course.code} · Past questions</span>
                    </div>
                    {/* Page properties, the way Notion lists them under a title */}
                    <dl className='grid grid-cols-[120px_minmax(0,1fr)] gap-y-[6px] text-[14px]'>
                        <dt className='text-ink-3'>Progress</dt>
                        <dd className='flex items-center gap-3 min-w-0'>
                            <span className='w-[140px] max-w-[40%]'><kit.ProgressTrack height={4}><kit.ProgressFill value={stats.percent}/></kit.ProgressTrack></span>
                            <span className='text-ink-2 tabular-nums'>{stats.answered} of {data.length || course.questions} answered</span>
                        </dd>
                        <dt className='text-ink-3'>Accuracy</dt>
                        <dd className='text-ink-2 tabular-nums'>{stats.answered ? `${stats.accuracy}%` : 'No answers yet'}</dd>
                        <dt className='text-ink-3'>Papers</dt>
                        <dd className='text-ink-2 tabular-nums'>{span}{institutions.length ? ` · ${institutions.join(', ')}` : ''}</dd>
                    </dl>
                    <div className='flex flex-wrap items-center gap-2'>
                        <kit.PrimaryButton type='button' onClick={()=>navigate('/test/testconfig', { state : { courseID : course.id } })}>
                            <FiClock size={14}/> Timed test
                        </kit.PrimaryButton>
                        <kit.SecondaryButton type='button' onClick={()=>setRevealAll(!revealAll)} aria-pressed={revealAll}>
                            {revealAll ? <FiEyeOff size={14}/> : <FiEye size={14}/>} {revealAll ? 'Hide answers' : 'Show all answers'}
                        </kit.SecondaryButton>
                        {
                            stats.answered > 0 &&
                            <kit.GhostButton type='button' onClick={resetCourse}><FiRotateCcw size={14}/> Reset</kit.GhostButton>
                        }
                    </div>
                </header>

                {/* View bar: status tabs on the left, search and refine on the right */}
                <div className='flex flex-col gap-3 sticky top-[52px] lg:top-2 z-10 bg-surface/90 backdrop-blur-xl -mx-4 px-4 md:-mx-8 md:px-8 pt-2'>
                    <div className='flex items-center gap-3 border-b border-line'>
                        <div role='tablist' aria-label='Show' className='flex items-center gap-1 overflow-x-auto -mb-px' style={{ scrollbarWidth : 'none' }}>
                            {statuses.map((which) => (
                                <button
                                    key={which}
                                    type='button'
                                    role='tab'
                                    aria-selected={status === which}
                                    onClick={()=>setStatus(which)}
                                    className={`h-9 px-2 inline-flex items-center gap-[6px] text-[14px] whitespace-nowrap border-b-2 transition-colors
                                    ${status === which ? 'border-ink text-ink font-medium' : 'border-transparent text-ink-3 hover:text-ink'}`}
                                >
                                    {statusLabels[which]}
                                    <span className='text-[12px] text-ink-4 tabular-nums'>{loading ? '' : counts[which]}</span>
                                </button>
                            ))}
                        </div>
                        <div className='ml-auto flex items-center gap-1 pb-1'>
                            <label className='relative hidden sm:block'>
                                <FiSearch size={14} className='absolute left-[10px] top-1/2 -translate-y-1/2 text-ink-3'/>
                                <input
                                    type='search'
                                    value={search}
                                    onChange={(e)=>setSearch(e.target.value)}
                                    placeholder='Search'
                                    aria-label='Search questions'
                                    className='h-8 w-[150px] focus:w-[220px] rounded-md bg-transparent hover:bg-ink/[0.04] focus:bg-subtle pl-8 pr-2 text-[13px] text-ink placeholder:text-ink-3 outline-none transition-[width,background-color] duration-200 ease-out'
                                />
                            </label>
                            <select
                                value={sort}
                                onChange={(e)=>setSort(e.target.value as typeof sorts[number])}
                                aria-label='Sort by'
                                className='h-8 rounded-md bg-transparent hover:bg-ink/[0.04] px-2 text-[13px] text-ink-2 outline-none cursor-pointer'
                            >
                                {sorts.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className='flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-3' style={{ scrollbarWidth : 'none' }}>
                        <div className='shrink-0'><SegmentedControl aria-label='Difficulty' value={difficulty} onChange={setDifficulty} options={difficulties}/></div>
                        <span className='w-px h-5 bg-line shrink-0 mx-1'/>
                        {topics.map((item) => (
                            <kit.FilterChip key={item} type='button' className='shrink-0' active={topic === item} aria-pressed={topic === item} onClick={()=>setTopic(item)}>
                                {item === 'All' ? 'All topics' : item}
                                <span className={`text-[11px] tabular-nums ${topic === item ? 'text-accent/70' : 'text-ink-4'}`}>{loading ? '' : topicCount(item)}</span>
                            </kit.FilterChip>
                        ))}
                        {institutions.length > 1 && <span className='w-px h-5 bg-line shrink-0 mx-1'/>}
                        {institutions.length > 1 && institutions.map((school) => (
                            <kit.FilterChip key={school} type='button' active={schools.includes(school)} aria-pressed={schools.includes(school)} onClick={()=>toggleSchool(school)}>{school}</kit.FilterChip>
                        ))}
                    </div>
                </div>

                <div className='sm:hidden -mt-3'>
                    <kit.TextInput type='search' value={search} onChange={(e)=>setSearch(e.target.value)} placeholder='Search questions or topics' aria-label='Search questions'/>
                </div>

                {
                    loading ?
                    <div className='flex flex-col gap-3' aria-busy='true'>
                        {[0,1,2].map((item) => <div key={item} className='h-[240px] rounded-lg bg-subtle animate-pulse'/>)}
                    </div>
                    : visible.length === 0 ?
                    <kit.Empty>
                        <emptyCopy.icon size={20}/>
                        <span className='text-[15px] font-medium text-ink'>{emptyCopy.title}</span>
                        <span className='text-[14px] max-w-[360px]'>{emptyCopy.text}</span>
                        {
                            filtersActive &&
                            <kit.SecondaryButton type='button' className='mt-2' onClick={clearFilters}>
                                Show all questions
                            </kit.SecondaryButton>
                        }
                    </kit.Empty>
                    :
                    <div className='flex flex-col gap-3'>
                        <div className='flex items-center justify-between text-[12px] text-ink-3' aria-live='polite'>
                            <span>{visible.length === data.length ? `${data.length} questions` : `${visible.length} of ${data.length} questions`}</span>
                            <span className='hidden lg:flex items-center gap-3'>
                                <span className='flex items-center gap-1'><kit.Kbd>J</kit.Kbd><kit.Kbd>K</kit.Kbd> move</span>
                                <span className='flex items-center gap-1'><kit.Kbd>1</kit.Kbd>–<kit.Kbd>4</kit.Kbd> answer</span>
                                <span className='flex items-center gap-1'><kit.Kbd>S</kit.Kbd> save</span>
                            </span>
                        </div>
                        <Mcqs questions={visible} revealAll={revealAll}/>
                    </div>
                }
            </div>
        </kit.Page>
    )
}

export default Questions
