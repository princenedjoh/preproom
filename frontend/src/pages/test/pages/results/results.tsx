import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Interweave } from 'interweave'
import * as kit from '../../../../styles/kit'
import * as mcqsStyle from '../../../mcqs/mcqs.style'
import { alphabets } from '../../../mcqs/mcqs'
import { getCourse } from '../../../../data/catalog'
import { TestResultState } from '../session/session'
import SegmentedControl from '../../../../components/UI/segmented/segmented'
import CourseIcon from '../../../../components/courseIcon/courseIcon'
import { FiRotateCcw, FiArrowRight, FiCheck, FiX, FiMinus, FiAward } from "react-icons/fi";

// The score counts up once on arrival: a rare, earned moment, so it can take a little longer
const CountUp = ({ to } : { to : number }) => {
    const [value, setValue] = useState(0)
    useEffect(()=>{
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ setValue(to); return }
        let frame = 0
        const start = performance.now()
        const duration = 900
        const step = (now : number) => {
            const t = Math.min(1, (now - start) / duration)
            setValue(Math.round(to * (1 - Math.pow(1 - t, 4))))
            if(t < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    },[to])
    return <>{value}</>
}

type Filter = 'all' | 'wrong' | 'skipped'

const Results = () => {

    const navigate = useNavigate()
    const result = useLocation().state as TestResultState | null
    const [filter, setFilter] = useState<Filter>('all')

    const topics = useMemo(() => {
        if(!result) return []
        const byTopic : Record<string, { correct : number, total : number }> = {}
        result.questions.forEach((question) => {
            byTopic[question.topic] = byTopic[question.topic] ?? { correct : 0, total : 0 }
            byTopic[question.topic].total += 1
            if(result.answers[question.id] === question.answer) byTopic[question.topic].correct += 1
        })
        return Object.entries(byTopic).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    }, [result])

    if(!result) return <Navigate to='/test/testconfig' replace/>

    const { config, questions, answers, seconds } = result
    const course = getCourse(config.courseID)
    const correct = questions.filter((question) => answers[question.id] === question.answer).length
    const skipped = questions.filter((question) => answers[question.id] === undefined).length
    const wrong = questions.length - correct - skipped
    const percent = questions.length ? Math.round(correct / questions.length * 100) : 0
    const verdict = percent >= 80 ? 'Excellent work.' : percent >= 60 ? 'Solid. A little more practice and it sticks.' : 'A good place to start. Review the misses below.'
    const clock = (total : number) => `${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, '0')}`
    const tone = (value : number) : kit.Tone => value >= 70 ? 'green' : value >= 50 ? 'orange' : 'red'

    const shown = questions.map((question, index) => ({ question, index })).filter(({ question }) =>
        filter === 'all' ? true : filter === 'skipped' ? answers[question.id] === undefined : answers[question.id] !== undefined && answers[question.id] !== question.answer)

    const kpis = [
        { label : 'Score', value : <>{correct}<span className='text-ink-4'>/{questions.length}</span></> },
        ...(config.mode === 'challenge' && result.rank ? [{ label : 'Rank today', value : <>#{result.rank}</> }] : []),
        { label : 'Time', value : clock(seconds) },
        { label : 'Per question', value : questions.length ? `${Math.round(seconds / questions.length)}s` : '–' },
        { label : 'Incorrect', value : wrong },
        { label : 'Skipped', value : skipped },
    ]

    return (
        <kit.Page>
            <kit.PageInner className='gap-10 max-w-[880px]'>
                <header className='flex flex-col gap-4 pt-2'>
                    <span className='inline-flex items-center gap-2 text-[13px] text-ink-3'>
                        <CourseIcon course={course} size={20}/> {result.title ?? `${course.name} test`}
                    </span>
                    <div className='flex items-end gap-5 flex-wrap'>
                        <span className='text-[72px] md:text-[88px] font-semibold leading-[0.9] tracking-[-0.055em] text-ink tabular-nums'>
                            <CountUp to={percent}/><span className='text-ink-4'>%</span>
                        </span>
                        <p className='text-[17px] leading-[1.45] text-ink-2 max-w-[340px] pb-2'>{verdict}</p>
                    </div>
                    <div className='flex flex-wrap gap-2 pt-1'>
                        {
                            config.mode === 'challenge' ?
                            <kit.PrimaryButton type='button' onClick={()=>navigate('/challenges')}>
                                <FiAward size={14}/> {result.rank ? `#${result.rank} today · Leaderboard` : 'See the leaderboard'}
                            </kit.PrimaryButton>
                            :
                            <kit.PrimaryButton type='button' onClick={()=>navigate('/test/session', { state : config })}>
                                <FiRotateCcw size={14}/> Retake
                            </kit.PrimaryButton>
                        }
                        {
                            correct < questions.length ?
                            <kit.SecondaryButton type='button' onClick={()=>navigate(`/questions/${course.id}?status=mistakes`)}>
                                Practise your mistakes <FiArrowRight size={14}/>
                            </kit.SecondaryButton>
                            :
                            <kit.SecondaryButton type='button' onClick={()=>navigate(`/questions/${course.id}`)}>
                                Practise {course.name} <FiArrowRight size={14}/>
                            </kit.SecondaryButton>
                        }
                        <kit.GhostButton type='button' onClick={()=>navigate('/test/testconfig')}>New test</kit.GhostButton>
                    </div>
                </header>

                <section className='grid grid-cols-2 sm:grid-cols-3 md:grid-flow-col md:auto-cols-fr rounded-lg border border-line overflow-hidden' aria-label='Summary'>
                    {kpis.map((item) => (
                        <div key={item.label} className='flex flex-col gap-2 p-4 border-line [&:not(:first-child)]:md:border-l border-b md:border-b-0'>
                            <kit.StatLabel>{item.label}</kit.StatLabel>
                            <span className='text-[24px] font-semibold tracking-[-0.03em] text-ink tabular-nums leading-none'>{item.value}</span>
                        </div>
                    ))}
                </section>

                <section className='flex flex-col gap-3' aria-label='By topic'>
                    <div className='flex items-baseline justify-between'>
                        <kit.Title>By topic</kit.Title>
                        <span className='text-[12px] text-ink-3'>Weakest first</span>
                    </div>
                    <div className='rounded-lg border border-line overflow-hidden'>
                        {
                            topics.map(([topic, score]) => {
                                const value = Math.round(score.correct / score.total * 100)
                                return (
                                    <button
                                        key={topic}
                                        type='button'
                                        onClick={()=>navigate(`/questions/${course.id}?topic=${encodeURIComponent(topic)}`)}
                                        className='w-full grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[200px_minmax(0,1fr)_56px_64px] items-center gap-4 px-4 py-3 text-left text-[14px] border-b border-line last:border-0 hover:bg-ink/[0.03] transition-colors'
                                    >
                                        <span className='text-ink truncate'>{topic}</span>
                                        <span className='hidden md:block'><kit.ProgressTrack height={4}><kit.ProgressFill value={value} color={`rgb(var(--tag-${tone(value)}))`}/></kit.ProgressTrack></span>
                                        <span className='hidden md:block text-right text-ink-3 tabular-nums'>{score.correct}/{score.total}</span>
                                        <span className='text-right'><kit.Tag tone={tone(value)} className='tabular-nums'>{value}%</kit.Tag></span>
                                    </button>
                                )
                            })
                        }
                    </div>
                </section>

                <section className='flex flex-col gap-4' aria-label='Review answers'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                        <kit.Title>Review answers</kit.Title>
                        <SegmentedControl aria-label='Show' value={filter} onChange={setFilter} options={[
                            { value : 'all', label : `All ${questions.length}` },
                            { value : 'wrong', label : `Incorrect ${wrong}` },
                            { value : 'skipped', label : `Skipped ${skipped}` },
                        ]}/>
                    </div>
                    {
                        shown.length === 0 ?
                        <kit.Empty className='!py-10'><FiCheck size={18}/><span className='text-[14px]'>{filter === 'wrong' ? 'Nothing wrong. Every answer was right.' : 'You answered every question.'}</span></kit.Empty>
                        :
                        shown.map(({ question, index }) => {
                            const chosen = answers[question.id]
                            const isCorrect = chosen === question.answer
                            return (
                                <mcqsStyle.Card key={question.id} className='!pb-5'>
                                    <mcqsStyle.Meta>
                                        <mcqsStyle.Number>Q{index + 1}</mcqsStyle.Number>
                                        <span className='text-ink-4'>·</span>
                                        <span className='text-ink-2'>{question.topic}</span>
                                        <span className={`ml-auto inline-flex items-center gap-1 font-medium ${chosen === undefined ? 'text-ink-3' : isCorrect ? 'text-tag-green' : 'text-tag-red'}`}>
                                            {chosen === undefined ? <FiMinus size={13}/> : isCorrect ? <FiCheck size={13}/> : <FiX size={13}/>}
                                            {chosen === undefined ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </mcqsStyle.Meta>
                                    <mcqsStyle.Prompt><Interweave content={question.question}/></mcqsStyle.Prompt>
                                    <mcqsStyle.Options>
                                        {question.options.map((option, optionIndex) => {
                                            const state : mcqsStyle.OptionState = optionIndex === question.answer ? 'correct' : optionIndex === chosen ? 'wrong' : 'muted'
                                            return (
                                                <mcqsStyle.Option as='div' key={optionIndex} state={state} aria-label={`${alphabets[optionIndex].toUpperCase()}${state === 'correct' ? ', correct answer' : state === 'wrong' ? ', your answer' : ''}`}>
                                                    <mcqsStyle.OptionKey state={state}>{alphabets[optionIndex].toUpperCase()}</mcqsStyle.OptionKey>
                                                    <span className='flex-1 min-w-0'><Interweave content={option}/></span>
                                                    {optionIndex === chosen && <span className='text-[12px] text-ink-3 shrink-0'>Your answer</span>}
                                                    {state === 'correct' && <FiCheck className='text-tag-green shrink-0' size={16} strokeWidth={2.5}/>}
                                                    {state === 'wrong' && <FiX className='text-tag-red shrink-0' size={16} strokeWidth={2.5}/>}
                                                </mcqsStyle.Option>
                                            )
                                        })}
                                    </mcqsStyle.Options>
                                    {question.explanation && <mcqsStyle.Explanation><span className='label'>Explanation</span><Interweave content={question.explanation}/></mcqsStyle.Explanation>}
                                </mcqsStyle.Card>
                            )
                        })
                    }
                </section>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Results
