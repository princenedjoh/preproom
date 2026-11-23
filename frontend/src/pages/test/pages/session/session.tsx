import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import { Interweave } from 'interweave'
import * as sessionStyle from './session.style'
import * as mcqsStyle from '../../../mcqs/mcqs.style'
import * as kit from '../../../../styles/kit'
import { alphabets, optionFromKey } from '../../../mcqs/mcqs'
import { fetchQuestions, getCourse, Question } from '../../../../data/sample'
import { progress, seededShuffle, dayKey } from '../../../../store/progress'
import { TestConfigState } from '../testConfig/testConfig'
import { FiClock, FiFlag, FiArrowLeft, FiArrowRight } from "react-icons/fi";

export interface TestResultState {
    config : TestConfigState
    questions : Question[]
    answers : Record<string, number>
    seconds : number
    runID? : string
}

// An in-progress test survives a refresh: questions, answers, flags and the deadline
const DRAFT_KEY = 'preproom.test.draft'
interface Draft {
    config : TestConfigState
    questionIDs : string[]
    questions : Question[]
    answers : Record<string, number>
    flags : Record<string, boolean>
    current : number
    deadline : number
}
// With no config (opened from the address bar or a restored tab) any unexpired draft resumes
const readDraft = (config : TestConfigState | null) : Draft | null => {
    try {
        const draft = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null
        if(!draft || draft.deadline <= Date.now()) return null
        if(config && JSON.stringify(draft.config) !== JSON.stringify(config)) return null
        return draft
    } catch { return null }
}
const clearDraft = () => { try { window.sessionStorage.removeItem(DRAFT_KEY) } catch {} }

const formatTime = (total : number) => {
    const minutes = Math.floor(total / 60)
    const seconds = total % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const Session = () => {

    const navigate = useNavigate()
    const routed = useLocation().state as TestConfigState | null
    const [draft] = useState(() => readDraft(routed))
    const config = routed ?? draft?.config ?? null

    const [questions, setQuestions] = useState<Question[]>(draft?.questions ?? [])
    const [current, setCurrent] = useState(draft?.current ?? 0)
    const [answers, setAnswers] = useState<Record<string, number>>(draft?.answers ?? {})
    const [flags, setFlags] = useState<Record<string, boolean>>(draft?.flags ?? {})
    const [deadline] = useState(() => draft?.deadline ?? Date.now() + (config?.minutes ?? 20) * 60000)
    const [remaining, setRemaining] = useState(() => Math.max(0, Math.round((deadline - Date.now()) / 1000)))
    const submitted = useRef(false)

    useEffect(()=>{
        if(!config || draft) return
        fetchQuestions(config.courseID).then((all) => {
            const pool = config.year ? all.filter((question) => question.year === config.year)
                : config.difficulty === 'Mixed' ? all : all.filter((question) => question.difficulty === config.difficulty)
            const source = pool.length > 0 ? pool : all
            const ordered = config.mode === 'challenge' ? seededShuffle(source, `challenge:${dayKey()}`)
                : config.year ? source
                : seededShuffle(source, `${Date.now()}`)
            setQuestions(ordered.slice(0, config.count))
        })
    },[config, draft])

    useEffect(()=>{
        if(!config || questions.length === 0 || submitted.current) return
        const next : Draft = { config, questionIDs : questions.map((question) => question.id), questions, answers, flags, current, deadline }
        try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next)) } catch {}
    },[config, questions, answers, flags, current, deadline])

    const submit = useCallback(() => {
        if(submitted.current || !config) return
        submitted.current = true
        clearDraft()
        const seconds = Math.min(config.minutes * 60, Math.round((Date.now() - (deadline - config.minutes * 60000)) / 1000))
        const score = questions.filter((question) => answers[question.id] === question.answer).length
        const course = getCourse(config.courseID)
        const run = progress.recordTest({
            courseID : config.courseID,
            mode : config.mode,
            title : config.mode === 'challenge' ? `Daily challenge · ${course.name}`
                : config.year ? `${course.name} · ${config.year} paper`
                : `${course.name} · ${config.difficulty === 'Mixed' ? 'Mixed practice' : config.difficulty}`,
            score,
            total : questions.length,
            seconds,
            missed : questions.filter((question) => answers[question.id] !== question.answer).map((question) => question.id),
        }, Object.fromEntries(questions.filter((question) => answers[question.id] !== undefined).map((question) => [question.id, {
            choice : answers[question.id],
            correct : answers[question.id] === question.answer,
            courseID : question.courseID,
            topic : question.topic,
        }])))
        const result : TestResultState = { config, questions, answers, seconds, runID : run.id }
        navigate('/test/results', { state : result, replace : true })
    },[config, deadline, questions, answers, navigate])

    // Timer reads the wall clock, so it stays correct when the tab is throttled in the background
    useEffect(()=>{
        if(!config) return
        const tick = () => setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)))
        const id = window.setInterval(tick, 500)
        return () => window.clearInterval(id)
    },[config, deadline])

    useEffect(()=>{
        if(remaining === 0 && questions.length > 0) submit()
    },[remaining, questions.length, submit])

    // Leaving mid-test asks first; the draft also restores the test on refresh
    useEffect(()=>{
        const warn = (event : BeforeUnloadEvent) => {
            if(submitted.current) return
            event.preventDefault()
            event.returnValue = ''
        }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    },[])

    const choose = useCallback((question : Question, index : number) => {
        if(!config) return
        if(config.instantFeedback && answers[question.id] !== undefined) return
        setAnswers((previous) => ({ ...previous, [question.id] : index }))
    },[config, answers])

    const confirmRef = useRef<() => void>(() => {})

    useEffect(()=>{
        const onKey = (event : KeyboardEvent) => {
            const target = event.target
            if(event.metaKey || event.ctrlKey || event.altKey || (target instanceof Element && target.closest('input, textarea, .ant-modal'))) return
            const question = questions[current]
            if(!question) return
            const index = optionFromKey(event.key, question.options.length)
            if(index !== null){ event.preventDefault(); choose(question, index); return }
            if(event.key === 'ArrowRight' || event.key.toLowerCase() === 'n'){ event.preventDefault(); setCurrent((value) => Math.min(questions.length - 1, value + 1)) }
            else if(event.key === 'ArrowLeft' || event.key.toLowerCase() === 'p'){ event.preventDefault(); setCurrent((value) => Math.max(0, value - 1)) }
            else if(event.key.toLowerCase() === 'f'){ event.preventDefault(); setFlags((previous) => ({ ...previous, [question.id] : !previous[question.id] })) }
            else if(event.key === 'Enter' && current === questions.length - 1){ event.preventDefault(); confirmRef.current() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    },[questions, current, choose])

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
    confirmRef.current = confirmSubmit

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
                                                    onClick={()=>choose(question, index)}
                                                    aria-pressed={selected}
                                                >
                                                    <mcqsStyle.OptionKey state={state} style={selected && state === 'idle' ? { background : '#202020', color : '#ffffff', borderColor : '#202020' } : undefined}>{alphabets[index].toUpperCase()}</mcqsStyle.OptionKey>
                                                    <Interweave content={option}/>
                                                </mcqsStyle.Option>
                                            )
                                        })
                                    }
                                </div>
                                {
                                    config.instantFeedback && answers[question.id] !== undefined &&
                                    <mcqsStyle.Explanation key={question.id}>
                                        <span>
                                            <b>{answers[question.id] === question.answer ? 'Correct. ' : 'Not quite. '}</b>
                                            The answer is {alphabets[question.answer].toUpperCase()}.
                                        </span>
                                        {question.explanation && <Interweave content={question.explanation}/>}
                                    </mcqsStyle.Explanation>
                                }
                                <div className='flex items-center justify-between pt-2'>
                                    <kit.GhostButton type='button' disabled={current === 0} onClick={()=>setCurrent(current - 1)}>
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
                                <div className='hidden lg:flex flex-col gap-2 pt-1 text-[12px] text-ash'>
                                    <span className='flex items-center justify-between'>Answer <span className='flex gap-1'><kit.Kbd>1</kit.Kbd><kit.Kbd>{question.options.length}</kit.Kbd></span></span>
                                    <span className='flex items-center justify-between'>Previous / next <span className='flex gap-1'><kit.Kbd>←</kit.Kbd><kit.Kbd>→</kit.Kbd></span></span>
                                    <span className='flex items-center justify-between'>Flag <kit.Kbd>F</kit.Kbd></span>
                                </div>
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
