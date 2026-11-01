import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import { Interweave } from 'interweave'
import * as sessionStyle from './session.style'
import * as mcqsStyle from '../../../mcqs/mcqs.style'
import * as kit from '../../../../styles/kit'
import { alphabets } from '../../../mcqs/mcqs'
import { fetchQuestions, getCourse, Question } from '../../../../data/sample'
import { TestConfigState } from '../testConfig/testConfig'
import { FiClock, FiFlag, FiArrowLeft, FiArrowRight } from "react-icons/fi";

export interface TestResultState {
    config : TestConfigState
    questions : Question[]
    answers : Record<string, number>
    seconds : number
}

const formatTime = (total : number) => {
    const minutes = Math.floor(total / 60)
    const seconds = total % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const Session = () => {

    const navigate = useNavigate()
    const config = useLocation().state as TestConfigState | null

    const [questions, setQuestions] = useState<Question[]>([])
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [flags, setFlags] = useState<Record<string, boolean>>({})
    const [remaining, setRemaining] = useState((config?.minutes ?? 20) * 60)
    const submitted = useRef(false)

    useEffect(()=>{
        if(!config) return
        fetchQuestions(config.courseID).then((all) => {
            const pool = config.difficulty === 'Mixed' ? all : all.filter((question) => question.difficulty === config.difficulty)
            const source = pool.length > 0 ? pool : all
            setQuestions([...source].sort(() => Math.random() - 0.5).slice(0, config.count))
        })
    },[config])

    const submit = () => {
        if(submitted.current || !config) return
        submitted.current = true
        const result : TestResultState = { config, questions, answers, seconds : config.minutes * 60 - remaining }
        navigate('/test/results', { state : result, replace : true })
    }

    useEffect(()=>{
        if(!config) return
        const id = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
        return () => window.clearInterval(id)
    },[config])

    useEffect(()=>{
        if(remaining === 0 && questions.length > 0) submit()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[remaining])

    if(!config) return <Navigate to='/test/testconfig' replace/>

    const course = getCourse(config.courseID)
    const question = questions[current]
    const answeredCount = Object.keys(answers).length

    const confirmSubmit = () => {
        const unanswered = questions.length - answeredCount
        Modal.confirm({
            title : 'Submit your test?',
            content : unanswered > 0 ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}.` : 'You have answered every question.',
            okText : 'Submit',
            cancelText : 'Keep going',
            okButtonProps : { shape : 'round' },
            cancelButtonProps : { shape : 'round' },
            onOk : submit,
        })
    }

    const optionState = (index : number) : mcqsStyle.OptionState => {
        const chosen = answers[question.id]
        if(chosen === undefined || !config.instantFeedback) return 'idle'
        if(index === question.answer) return 'correct'
        if(index === chosen) return 'wrong'
        return 'muted'
    }

    const navState = (index : number) : sessionStyle.NavState => {
        const item = questions[index]
        if(index === current) return 'current'
        if(flags[item.id]) return 'flagged'
        if(answers[item.id] !== undefined) return 'answered'
        return 'empty'
    }

    return (
        <>
            <sessionStyle.Bar>
                <div className='w-full max-w-[1200px] flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 min-w-0'>
                        <span className='w-[10px] h-[10px] rounded-[3px] shrink-0' style={{ background : course.color }}/>
                        <span className='text-[14px] font-bold text-ink truncate'>{course.name}</span>
                        <span className='hidden sm:inline text-[13px] text-ash'>{answeredCount}/{questions.length} answered</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <sessionStyle.Timer low={remaining <= 60} aria-live='polite'>
                            <FiClock size={14}/> {formatTime(remaining)}
                        </sessionStyle.Timer>
                        <kit.DarkButton type='button' className='!py-2 !px-5' onClick={confirmSubmit}>Submit</kit.DarkButton>
                    </div>
                </div>
            </sessionStyle.Bar>
            <kit.Page className='!pt-[152px]'>
                <kit.PageInner>
                    <kit.ProgressTrack height={4}>
                        <kit.ProgressFill value={questions.length ? answeredCount / questions.length * 100 : 0} color='#202020'/>
                    </kit.ProgressTrack>
                    {
                        !question ?
                        <div className='h-[360px] rounded-[12px] bg-mist border border-bone animate-pulse'/>
                        :
                        <sessionStyle.Layout>
                            <mcqsStyle.Card className='!p-6 md:!p-8 gap-6'>
                                <div className='flex items-center justify-between'>
                                    <kit.Eyebrow>Question {current + 1} of {questions.length}</kit.Eyebrow>
                                    <mcqsStyle.Action 
                                        type='button'
                                        active={!!flags[question.id]}
                                        onClick={()=>setFlags({ ...flags, [question.id] : !flags[question.id] })}
                                    >
                                        <FiFlag size={14} fill={flags[question.id] ? 'currentColor' : 'none'}/> {flags[question.id] ? 'Flagged' : 'Flag'}
                                    </mcqsStyle.Action>
                                </div>
                                <mcqsStyle.Prompt className='md:!text-[20px]'>
                                    <Interweave content={question.question}/>
                                </mcqsStyle.Prompt>
                                <div className='flex flex-col gap-2'>
                                    {
                                        question.options.map((option, index) => {
                                            const selected = answers[question.id] === index
                                            const state = optionState(index)
                                            return (
                                                <mcqsStyle.Option
                                                    key={index}
                                                    type='button'
                                                    state={state}
                                                    style={selected && state === 'idle' ? { borderColor : '#202020', boxShadow : 'inset 0 0 0 1px #202020' } : undefined}
                                                    onClick={()=>{
                                                        if(config.instantFeedback && answers[question.id] !== undefined) return
                                                        setAnswers({ ...answers, [question.id] : index })
                                                    }}
                                                    aria-pressed={selected}
                                                >
                                                    <mcqsStyle.OptionKey state={state}>{alphabets[index].toUpperCase()}</mcqsStyle.OptionKey>
                                                    <Interweave content={option}/>
                                                </mcqsStyle.Option>
                                            )
                                        })
                                    }
                                </div>
                                <div className='flex items-center justify-between pt-2'>
                                    <kit.GhostButton type='button' disabled={current === 0} className='disabled:opacity-40' onClick={()=>setCurrent(current - 1)}>
                                        <FiArrowLeft size={15}/> Previous
                                    </kit.GhostButton>
                                    {
                                        current < questions.length - 1 ?
                                        <kit.DarkButton type='button' onClick={()=>setCurrent(current + 1)}>
                                            Next <FiArrowRight size={15}/>
                                        </kit.DarkButton>
                                        :
                                        <kit.DarkButton type='button' onClick={confirmSubmit}>
                                            Finish test <FiArrowRight size={15}/>
                                        </kit.DarkButton>
                                    }
                                </div>
                            </mcqsStyle.Card>
                            <kit.Panel className='lg:sticky lg:top-[152px]'>
                                <kit.PanelTitle>Questions</kit.PanelTitle>
                                <sessionStyle.NavGrid>
                                    {
                                        questions.map((item, index) => (
                                            <sessionStyle.NavCell 
                                                key={item.id}
                                                type='button'
                                                state={navState(index)}
                                                onClick={()=>setCurrent(index)}
                                                aria-label={`Question ${index + 1}`}
                                            >
                                                {index + 1}
                                            </sessionStyle.NavCell>
                                        ))
                                    }
                                </sessionStyle.NavGrid>
                                <div className='flex flex-wrap gap-x-4 gap-y-2'>
                                    <sessionStyle.Legend><sessionStyle.Swatch kind='answered'/>Answered</sessionStyle.Legend>
                                    <sessionStyle.Legend><sessionStyle.Swatch kind='flagged'/>Flagged</sessionStyle.Legend>
                                    <sessionStyle.Legend><sessionStyle.Swatch kind='current'/>Current</sessionStyle.Legend>
                                </div>
                            </kit.Panel>
                        </sessionStyle.Layout>
                    }
                </kit.PageInner>
            </kit.Page>
        </>
    )
}

export default Session
