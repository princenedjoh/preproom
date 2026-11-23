import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Switch, Modal } from 'antd'
import * as questionsStyled from './questions.styled'
import * as kit from '../../styles/kit'
import Mcqs from '../mcqs/mcqs'
import SegmentedControl from '../../components/UI/segmented/segmented'
import { courses, getCourse, fetchQuestions, Question, Difficulty } from '../../data/sample'
import { progress, useProgress, courseProgress } from '../../store/progress'
import { FiSearch, FiSliders, FiTrendingUp, FiArrowRight, FiCommand, FiBookmark, FiCheckCircle } from "react-icons/fi";

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

    const topics = useMemo(() => ['All', ...Array.from(new Set(data.map((question) => question.topic)))], [data])

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase()
        return data
            .filter((question) => matchesStatus(question, status))
            .filter((question) => difficulty === 'All' || question.difficulty === difficulty)
            .filter((question) => topic === 'All' || question.topic === topic)
            .filter((question) => !term || question.question.toLowerCase().includes(term) || question.topic.toLowerCase().includes(term))
            .sort((a, b) => sort === 'Newest' ? b.year - a.year
                : sort === 'Oldest' ? a.year - b.year
                : difficultyRank[b.difficulty] - difficultyRank[a.difficulty])
    // Status membership is frozen while answering so a card doesn't vanish the moment it is answered
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, search, difficulty, topic, sort, status])

    const stats = courseProgress(state, course.id, data.length || course.questions)
    const filtersActive = search || difficulty !== 'All' || topic !== 'All' || status !== 'all'

    const clearFilters = () => {
        setSearch('')
        setDifficulty('All')
        setTopic('All')
        setStatus('all')
    }

    const resetCourse = () => {
        Modal.confirm({
            title : `Reset ${course.name}?`,
            content : 'This clears your answers for this course on this device. Saved questions and test history stay.',
            okText : 'Reset progress',
            cancelText : 'Cancel',
            okButtonProps : { shape : 'round', danger : true },
            cancelButtonProps : { shape : 'round' },
            onOk : () => progress.clearAttempts(course.id),
        })
    }

    const emptyCopy = status === 'saved' ? { icon : FiBookmark, title : 'No saved questions yet', text : 'Press Save on any question to keep it here for revision.' }
        : status === 'mistakes' ? { icon : FiCheckCircle, title : 'No mistakes to review', text : 'Questions you get wrong will collect here.' }
        : status === 'unanswered' ? { icon : FiCheckCircle, title : `You've answered every ${course.name} question`, text : 'Review your mistakes or take a timed test.' }
        : { icon : FiSearch, title : 'No questions match your filters', text : 'Try a different topic or difficulty.' }

    return (
        <kit.Page>
            <kit.PageInner>
                <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                    <div className='flex flex-col gap-2'>
                        <kit.Eyebrow>{course.code} · Past questions</kit.Eyebrow>
                        <kit.PageTitle>{course.name}</kit.PageTitle>
                        <kit.Body>{course.questions} questions from past papers, grouped by topic and difficulty.</kit.Body>
                    </div>
                    <kit.DarkButton type='button' onClick={()=>navigate('/test/testconfig', { state : { courseID : course.id } })}>
                        Take a timed test <FiArrowRight size={16}/>
                    </kit.DarkButton>
                </div>

                <questionsStyled.ChipRow role='tablist' aria-label='Courses'>
                    {
                        courses.map((item) => (
                            <kit.FilterChip
                                key={item.id}
                                type='button'
                                role='tab'
                                aria-selected={item.id === course.id}
                                active={item.id === course.id}
                                onClick={()=>navigate(`/questions/${item.id}${status !== 'all' ? `?status=${status}` : ''}`)}
                            >
                                <span className='w-[8px] h-[8px] rounded-[3px]' style={{ background : item.color }}/>
                                {item.name}
                            </kit.FilterChip>
                        ))
                    }
                </questionsStyled.ChipRow>

                <questionsStyled.Layout>
                    <div className='flex flex-col gap-4 min-w-0'>
                        <questionsStyled.Toolbar>
                            <SegmentedControl
                                aria-label='Show'
                                className='self-start'
                                value={status}
                                onChange={setStatus}
                                options={statuses.map((which) => ({
                                    value : which,
                                    label : <span className='inline-flex items-center gap-[6px]'>
                                        {statusLabels[which]}
                                        <span className='font-mono text-[11px] text-ash tabular-nums'>{loading ? '–' : counts[which]}</span>
                                    </span>
                                }))}
                            />
                            <div className='flex flex-col md:flex-row gap-3 md:items-center md:justify-between'>
                                <questionsStyled.Search>
                                    <FiSearch size={15}/>
                                    <kit.TextInput
                                        type='search'
                                        value={search}
                                        onChange={(e)=>setSearch(e.target.value)}
                                        placeholder='Search questions or topics'
                                        aria-label='Search questions'
                                    />
                                </questionsStyled.Search>
                                <SegmentedControl aria-label='Difficulty' value={difficulty} onChange={setDifficulty} options={difficulties}/>
                            </div>
                            <questionsStyled.ChipRow>
                                <kit.Eyebrow className='self-center shrink-0 mr-1'>Topics</kit.Eyebrow>
                                {
                                    topics.map((item) => (
                                        <kit.FilterChip key={item} type='button' active={topic === item} onClick={()=>setTopic(item)}>
                                            {item}
                                        </kit.FilterChip>
                                    ))
                                }
                            </questionsStyled.ChipRow>
                        </questionsStyled.Toolbar>

                        {
                            loading ?
                            <div className='flex flex-col gap-3' aria-busy='true'>
                                {[0,1,2].map((item) => <div key={item} className='h-[220px] rounded-[12px] bg-mist border border-bone animate-pulse'/>)}
                            </div>
                            : visible.length === 0 ?
                            <kit.Empty>
                                <emptyCopy.icon size={22}/>
                                <span className='text-[15px] font-semibold text-ink'>{emptyCopy.title}</span>
                                <span className='text-[14px] max-w-[360px]'>{emptyCopy.text}</span>
                                {
                                    filtersActive &&
                                    <kit.GhostButton type='button' className='mt-1' onClick={clearFilters}>
                                        Show all questions
                                    </kit.GhostButton>
                                }
                            </kit.Empty>
                            :
                            <>
                                <span className='text-[13px] text-ash' aria-live='polite'>
                                    Showing {visible.length} of {data.length} question{data.length === 1 ? '' : 's'}
                                </span>
                                <Mcqs questions={visible} revealAll={revealAll}/>
                            </>
                        }
                    </div>

                    <questionsStyled.Rail>
                        <kit.Panel>
                            <kit.PanelTitle><FiTrendingUp size={15}/> Your progress</kit.PanelTitle>
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='flex flex-col'>
                                    <kit.StatValue className='!text-[28px]'>{stats.answered}<span className='text-fog text-[18px]'>/{data.length || course.questions}</span></kit.StatValue>
                                    <kit.StatLabel>Answered</kit.StatLabel>
                                </div>
                                <div className='flex flex-col'>
                                    <kit.StatValue className='!text-[28px]'>{stats.answered ? `${stats.accuracy}%` : '–'}</kit.StatValue>
                                    <kit.StatLabel>Accuracy</kit.StatLabel>
                                </div>
                            </div>
                            <div className='flex flex-col gap-2'>
                                <div className='flex justify-between text-[12px] text-ash'>
                                    <span>Course progress</span><span className='tabular-nums'>{stats.percent}%</span>
                                </div>
                                <kit.ProgressTrack><kit.ProgressFill value={stats.percent} color={course.color}/></kit.ProgressTrack>
                            </div>
                            {
                                stats.answered > 0 &&
                                <button type='button' onClick={resetCourse} className='self-start text-[12px] text-ash hover:text-ink transition-colors'>
                                    Reset progress
                                </button>
                            }
                        </kit.Panel>

                        <kit.Panel>
                            <kit.PanelTitle><FiSliders size={15}/> View</kit.PanelTitle>
                            <questionsStyled.SettingRow>
                                Show all answers
                                <Switch size='small' checked={revealAll} onChange={setRevealAll}/>
                            </questionsStyled.SettingRow>
                            <div className='flex flex-col gap-2'>
                                <span className='text-[13px] text-muted'>Sort by</span>
                                <SegmentedControl aria-label='Sort by' fullWidth value={sort} onChange={setSort} options={sorts}/>
                            </div>
                        </kit.Panel>

                        <kit.Panel className='hidden lg:flex'>
                            <kit.PanelTitle><FiCommand size={15}/> Shortcuts</kit.PanelTitle>
                            <div className='flex flex-col gap-2 text-[13px] text-muted'>
                                {[
                                    [['J', 'K'], 'Next / previous question'],
                                    [['1', '4'], 'Pick an answer'],
                                    [['S'], 'Save question'],
                                    [['R'], 'Try again'],
                                    [['⌘', 'K'], 'Jump anywhere'],
                                ].map(([keys, label]) => (
                                    <div key={label as string} className='flex items-center justify-between gap-3'>
                                        <span>{label}</span>
                                        <span className='flex gap-1'>{(keys as string[]).map((key) => <kit.Kbd key={key}>{key}</kit.Kbd>)}</span>
                                    </div>
                                ))}
                            </div>
                        </kit.Panel>
                    </questionsStyled.Rail>
                </questionsStyled.Layout>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Questions
