import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Interweave } from 'interweave'
import * as kit from '../../../../styles/kit'
import * as mcqsStyle from '../../../mcqs/mcqs.style'
import { alphabets } from '../../../mcqs/mcqs'
import { getCourse } from '../../../../data/sample'
import { TestResultState } from '../session/session'
import { FiRotateCcw, FiArrowRight, FiCheck, FiX, FiMinus } from "react-icons/fi";

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

const Results = () => {

    const navigate = useNavigate()
    const result = useLocation().state as TestResultState | null

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
    const percent = questions.length ? Math.round(correct / questions.length * 100) : 0
    const verdict = percent >= 80 ? 'Excellent work.' : percent >= 60 ? 'Solid. A little more practice.' : 'Keep going, you will get there.'

    return (
        <kit.Page>
            <kit.PageInner className='gap-10'>
                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 items-end'>
                    <div className='flex flex-col gap-3'>
                        <kit.Eyebrow>{course.code} · Test results</kit.Eyebrow>
                        <span className='font-display font-extrabold text-[80px] md:text-[112px] leading-[0.95] tracking-[-0.05em] text-onyx tabular-nums'>
                            <CountUp to={percent}/><span className='text-fog'>%</span>
                        </span>
                        <kit.PageTitle className='!text-[28px] md:!text-[34px]'>{verdict}</kit.PageTitle>
                        <div className='flex flex-wrap gap-3 pt-2'>
                            <kit.DarkButton type='button' onClick={()=>navigate('/test/session', { state : config })}>
                                <FiRotateCcw size={15}/> Retake test
                            </kit.DarkButton>
                            {
                                correct < questions.length ?
                                <kit.GhostButton type='button' onClick={()=>navigate(`/questions/${course.id}?status=mistakes`)}>
                                    Review mistakes <FiArrowRight size={15}/>
                                </kit.GhostButton>
                                :
                                <kit.GhostButton type='button' onClick={()=>navigate(`/questions/${course.id}`)}>
                                    Practice {course.name} <FiArrowRight size={15}/>
                                </kit.GhostButton>
                            }
                        </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                        <kit.Stat><kit.StatValue>{correct}/{questions.length}</kit.StatValue><kit.StatLabel>Correct</kit.StatLabel></kit.Stat>
                        <kit.Stat><kit.StatValue>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</kit.StatValue><kit.StatLabel>Time taken</kit.StatLabel></kit.Stat>
                        <kit.Stat><kit.StatValue>{questions.length - correct - skipped}</kit.StatValue><kit.StatLabel>Incorrect</kit.StatLabel></kit.Stat>
                        <kit.Stat><kit.StatValue>{skipped}</kit.StatValue><kit.StatLabel>Skipped</kit.StatLabel></kit.Stat>
                    </div>
                </div>

                <kit.Panel className='!p-6'>
                    <kit.PanelTitle>By topic</kit.PanelTitle>
                    <div className='flex flex-col gap-4'>
                        {
                            topics.map(([topic, score]) => {
                                const value = Math.round(score.correct / score.total * 100)
                                return (
                                    <div key={topic} className='grid grid-cols-[120px_1fr_64px] md:grid-cols-[180px_1fr_80px] items-center gap-4 text-[14px]'>
                                        <span className='font-semibold text-ink truncate'>{topic}</span>
                                        <kit.ProgressTrack height={8}>
                                            <kit.ProgressFill value={value} color={value >= 70 ? '#00c07a' : value >= 50 ? '#0091ff' : '#f0457a'}/>
                                        </kit.ProgressTrack>
                                        <span className='text-right text-muted tabular-nums'>{score.correct}/{score.total}</span>
                                    </div>
                                )
                            })
                        }
                    </div>
                </kit.Panel>

                <div className='flex flex-col gap-4'>
                    <kit.Title>Review answers</kit.Title>
                    {
                        questions.map((question, index) => {
                            const chosen = answers[question.id]
                            const isCorrect = chosen === question.answer
                            return (
                                <mcqsStyle.Card key={question.id}>
                                    <mcqsStyle.Meta>
                                        <mcqsStyle.Number>Q{index + 1}</mcqsStyle.Number>
                                        <span className={`inline-flex items-center gap-1 font-semibold ${chosen === undefined ? 'text-ash' : isCorrect ? 'text-brand-emerald' : 'text-[#f0457a]'}`}>
                                            {chosen === undefined ? <FiMinus size={13}/> : isCorrect ? <FiCheck size={13}/> : <FiX size={13}/>}
                                            {chosen === undefined ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                        <span>· {question.topic}</span>
                                    </mcqsStyle.Meta>
                                    <mcqsStyle.Prompt><Interweave content={question.question}/></mcqsStyle.Prompt>
                                    <mcqsStyle.Explanation>
                                        {
                                            chosen !== undefined && !isCorrect &&
                                            <span>Your answer: {alphabets[chosen].toUpperCase()}, {question.options[chosen]}</span>
                                        }
                                        <span><b>Correct answer:</b> {alphabets[question.answer].toUpperCase()}, {question.options[question.answer]}</span>
                                        {question.explanation && <Interweave content={question.explanation}/>}
                                    </mcqsStyle.Explanation>
                                </mcqsStyle.Card>
                            )
                        })
                    }
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Results
