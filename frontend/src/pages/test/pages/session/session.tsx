import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Interweave } from 'interweave'
import * as sessionStyle from './session.style'
import * as mcqsStyle from '../../../mcqs/mcqs.style'
import { confirm } from '../../../../components/dialog/confirm'
import * as kit from '../../../../styles/kit'
import { alphabets, optionFromKey } from '../../../mcqs/mcqs'
import { Question } from '../../../../data/sample'
import { getCourse } from '../../../../data/catalog'
import { Run, TestError, startTest, submitTest, autosave, loadResult } from '../../engine'
import { notify } from '../../../../utils/notify'
import { TestConfigState } from '../testConfig/testConfig'
import { FiClock, FiFlag, FiArrowLeft, FiArrowRight, FiAlertCircle, FiX, FiCheck } from "react-icons/fi";
import CourseIcon from '../../../../components/courseIcon/courseIcon'

export type { TestResultState } from '../../engine'

// An in-progress test survives a refresh: the run (questions, deadline, server id),
// answers, flags and position. Server tests are also autosaved remotely.
const DRAFT_KEY = 'preproom.test.draft'
interface Draft {
    run : Run
    answers : Record<string, number>
    flags : Record<string, boolean>
    current : number
}
// With no config (opened from the address bar or a restored tab) any unexpired draft resumes
const readDraft = (config : TestConfigState | null) : Draft | null => {
    try {
        const draft = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? 'null') as Draft | null
        if(!draft?.run || draft.run.deadline <= Date.now()) return null
        if(config && JSON.stringify(draft.run.config) !== JSON.stringify(config)) return null
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

    const [run, setRun] = useState<Run | null>(draft?.run ?? null)
    const [problem, setProblem] = useState<string | null>(null)
    const [current, setCurrent] = useState(draft?.current ?? 0)
    const [answers, setAnswers] = useState<Record<string, number>>(draft?.answers ?? {})
    const [flags, setFlags] = useState<Record<string, boolean>>(draft?.flags ?? {})
    const [remaining, setRemaining] = useState(() => draft ? Math.max(0, Math.round((draft.run.deadline - Date.now()) / 1000)) : (routed?.minutes ?? 20) * 60)
    const [submitting, setSubmitting] = useState(false)
    const submitted = useRef(false)
    const started = useRef(false)

    const config = run?.config ?? routed ?? null
    const questions = useMemo(() => run?.questions ?? [], [run])

    useEffect(()=>{
        if(draft || !routed || started.current) return
        started.current = true
        startTest(routed)
            .then((next) => {
                setRun(next)
                setAnswers(next.answers)
                setRemaining(Math.max(0, Math.round((next.deadline - Date.now()) / 1000)))
            })
            .catch(async (error) => {
                // Today's challenge already played: show that result instead
                if(error instanceof TestError && error.problem.code === 'already_played' && error.testID){
                    const result = await loadResult(error.testID).catch(() => null)
                    if(result) return navigate('/test/results', { state : result, replace : true })
                }
                setProblem(error instanceof TestError ? error.problem.message : 'We could not start this test. Please try again.')
            })
    },[draft, routed, navigate])

    useEffect(()=>{
        if(!run || submitted.current) return
        const next : Draft = { run, answers, flags, current }
        try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next)) } catch {}
    },[run, answers, flags, current])

    // Server autosave, a moment after the last change
    useEffect(()=>{
        if(!run?.id || submitted.current) return
        const id = window.setTimeout(() => autosave(run, answers), 800)
        return () => window.clearTimeout(id)
    },[run, answers])

    const submit = useCallback(async () => {
        if(submitted.current || !run) return
        submitted.current = true
        setSubmitting(true)
        try {
            const result = await submitTest(run, answers)
            clearDraft()
            navigate('/test/results', { state : result, replace : true })
        } catch {
            submitted.current = false
            setSubmitting(false)
            notify("Couldn't submit. Your answers are saved here, so try again in a moment.")
        }
    },[run, answers, navigate])

    // Timer reads the wall clock, so it stays correct when the tab is throttled in the background
    useEffect(()=>{
        if(!run) return
        const tick = () => setRemaining(Math.max(0, Math.round((run.deadline - Date.now()) / 1000)))
        tick()
        const id = window.setInterval(tick, 500)
        return () => window.clearInterval(id)
    },[run])

    useEffect(()=>{
        if(remaining === 0 && questions.length > 0) submit()
    },[remaining, questions.length, submit])

    // Leaving mid-test asks first; the draft also restores the test on refresh
    useEffect(()=>{
        const warn = (event : BeforeUnloadEvent) => {
            if(submitted.current || !run) return
            event.preventDefault()
            event.returnValue = ''
        }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    },[run])

    const choose = useCallback((question : Question, index : number) => {
        if(!config) return
        if(config.instantFeedback && answers[question.id] !== undefined) return
        setAnswers((previous) => ({ ...previous, [question.id] : index }))
    },[config, answers])

    const confirmRef = useRef<() => void>(() => {})

    useEffect(()=>{
        const onKey = (event : KeyboardEvent) => {
            const target = event.target
            if(event.metaKey || event.ctrlKey || event.altKey || (target instanceof Element && target.closest('input, textarea, .ant-modal, [role="alertdialog"]')) || document.querySelector('[role="alertdialog"]')) return
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

    if(problem){
        return (
            <kit.Page>
                <kit.PageInner className='items-center text-center pt-16 !gap-4'>
                    <kit.IconTile tone='red' className='!w-12 !h-12'><FiAlertCircle size={20}/></kit.IconTile>
                    <kit.PageTitle className='!text-[26px]'>This test couldn't start</kit.PageTitle>
                    <kit.Lead className='max-w-[440px]'>{problem}</kit.Lead>
                    <kit.DarkButton type='button' onClick={()=>navigate('/test/testconfig', { replace : true })}>Back to test setup</kit.DarkButton>
                </kit.PageInner>
            </kit.Page>
        )
    }

    if(!config) return <Navigate to='/test/testconfig' replace/>

    const course = getCourse(config.courseID)
    const question = questions[current]
    const answeredCount = Object.keys(answers).length

    const confirmSubmit = () => {
        const unanswered = questions.length - answeredCount
        if(submitting) return
        confirm({
            title : 'Submit your test?',
            content : unanswered > 0 ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}.` : 'You have answered every question.',
            okText : 'Submit',
            cancelText : 'Keep going',
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

    const answeredShare = questions.length ? answeredCount / questions.length * 100 : 0

    return (
        <>
            <sessionStyle.Bar>
                <div className='w-full max-w-[1120px] flex items-center gap-3'>
                    <kit.IconButton type='button' aria-label='Leave test (your answers are kept)' title='Leave · answers are kept' onClick={()=>navigate('/test/testconfig')}>
                        <FiX size={17}/>
                    </kit.IconButton>
                    <div className='flex items-center gap-2 min-w-0 flex-1'>
                        <CourseIcon course={course} size={22}/>
                        <span className='text-[14px] font-medium text-ink truncate'>{run?.title ?? course.name}</span>
                    </div>
                    <span className='hidden md:inline text-[13px] text-ink-3 tabular-nums'>{current + 1} / {questions.length}</span>
                    <sessionStyle.Timer low={remaining <= 60} aria-live={remaining <= 60 ? 'polite' : 'off'} aria-label={`Time left ${formatTime(remaining)}`}>
                        <FiClock size={13}/> {formatTime(remaining)}
                    </sessionStyle.Timer>
                    <kit.SecondaryButton type='button' className='!h-8' onClick={confirmSubmit}>Submit</kit.SecondaryButton>
                </div>
                <span className='absolute left-0 bottom-[-1px] h-[2px] bg-accent transition-[width] duration-500 ease-out' style={{ width : `${answeredShare}%` }} aria-hidden/>
            </sessionStyle.Bar>
            <kit.Page className='!pt-[88px] md:!pt-[104px]'>
                <div className='w-full max-w-[1120px]'>
                    {
                        !question ?
                        <div className='h-[360px] rounded-lg bg-subtle animate-pulse'/>
                        :
                        <sessionStyle.Layout>
                            <mcqsStyle.Card className='!pb-5 md:!px-10 md:!pt-9 md:!pb-7 !gap-6' key={question.id}>
                                <div className='flex items-center justify-between'>
                                    <span className='text-[13px] text-ink-3'>Question <b className='font-medium text-ink tabular-nums'>{current + 1}</b> of {questions.length}{question.topic ? ` · ${question.topic}` : ''}</span>
                                    <mcqsStyle.Action
                                        type='button'
                                        active={!!flags[question.id]}
                                        className={flags[question.id] ? '!text-tag-orange' : ''}
                                        onClick={()=>setFlags({ ...flags, [question.id] : !flags[question.id] })}
                                        aria-pressed={!!flags[question.id]}
                                    >
                                        <FiFlag size={14} fill={flags[question.id] ? 'currentColor' : 'none'}/> {flags[question.id] ? 'Flagged' : 'Flag'}
                                    </mcqsStyle.Action>
                                </div>
                                <mcqsStyle.Prompt className='md:!text-[21px]'>
                                    <Interweave content={question.question}/>
                                </mcqsStyle.Prompt>
                                <mcqsStyle.Options role='radiogroup' aria-label='Options'>
                                    {
                                        question.options.map((option, index) => {
                                            const selected = answers[question.id] === index
                                            const state = optionState(index)
                                            const picked = selected && state === 'idle'
                                            return (
                                                <mcqsStyle.Option
                                                    key={index}
                                                    type='button'
                                                    role='radio'
                                                    aria-checked={selected}
                                                    state={state}
                                                    className={picked ? '!border-accent/50 !bg-accent-tint' : ''}
                                                    onClick={()=>choose(question, index)}
                                                >
                                                    <mcqsStyle.OptionKey state={state} className={picked ? '!bg-accent !text-on-accent' : ''}>{alphabets[index].toUpperCase()}</mcqsStyle.OptionKey>
                                                    <span className='flex-1 min-w-0'><Interweave content={option}/></span>
                                                    {state === 'correct' && <FiCheck className='text-tag-green shrink-0' size={16} strokeWidth={2.5}/>}
                                                    {state === 'wrong' && <FiX className='text-tag-red shrink-0' size={16} strokeWidth={2.5}/>}
                                                </mcqsStyle.Option>
                                            )
                                        })
                                    }
                                </mcqsStyle.Options>
                                {
                                    config.instantFeedback && answers[question.id] !== undefined &&
                                    <div className='flex flex-col gap-3' key={question.id}>
                                        <mcqsStyle.Verdict correct={answers[question.id] === question.answer}>
                                            <b>{answers[question.id] === question.answer ? 'Correct' : 'Incorrect'}</b>
                                            <span>Answer <strong>{alphabets[question.answer].toUpperCase()}</strong></span>
                                        </mcqsStyle.Verdict>
                                        {question.explanation && <mcqsStyle.Explanation><span className='label'>Explanation</span><Interweave content={question.explanation}/></mcqsStyle.Explanation>}
                                    </div>
                                }
                                <div className='flex items-center justify-between border-t border-line pt-4 mt-1'>
                                    <kit.GhostButton type='button' disabled={current === 0} onClick={()=>setCurrent(current - 1)}>
                                        <FiArrowLeft size={15}/> Previous
                                    </kit.GhostButton>
                                    {
                                        current < questions.length - 1 ?
                                        <kit.PrimaryButton type='button' onClick={()=>setCurrent(current + 1)}>
                                            Next <FiArrowRight size={15}/>
                                        </kit.PrimaryButton>
                                        :
                                        <kit.PrimaryButton type='button' onClick={confirmSubmit}>
                                            Finish test <FiArrowRight size={15}/>
                                        </kit.PrimaryButton>
                                    }
                                </div>
                            </mcqsStyle.Card>
                            <aside className='flex flex-col gap-4 lg:sticky lg:top-[104px]' aria-label='Question navigator'>
                                <div className='flex items-baseline justify-between'>
                                    <span className='text-[13px] font-medium text-ink'>Questions</span>
                                    <span className='text-[12px] text-ink-3 tabular-nums'>{answeredCount} of {questions.length} answered</span>
                                </div>
                                <sessionStyle.NavGrid>
                                    {
                                        questions.map((item, index) => (
                                            <sessionStyle.NavCell
                                                key={item.id}
                                                type='button'
                                                state={navState(index)}
                                                answered={answers[item.id] !== undefined}
                                                flagged={!!flags[item.id]}
                                                onClick={()=>setCurrent(index)}
                                                aria-label={`Question ${index + 1}${answers[item.id] !== undefined ? ', answered' : ''}${flags[item.id] ? ', flagged' : ''}`}
                                                aria-current={index === current ? 'step' : undefined}
                                            >
                                                {index + 1}
                                            </sessionStyle.NavCell>
                                        ))
                                    }
                                </sessionStyle.NavGrid>
                                <div className='flex flex-wrap gap-x-4 gap-y-2'>
                                    <sessionStyle.Legend><sessionStyle.Swatch kind='answered'/>Answered</sessionStyle.Legend>
                                    <sessionStyle.Legend><sessionStyle.Swatch kind='flagged'/>Flagged</sessionStyle.Legend>
                                </div>
                                <div className='hidden lg:flex flex-col gap-2 pt-3 border-t border-line text-[12px] text-ink-3'>
                                    <span className='flex items-center justify-between'>Answer <span className='flex gap-1'><kit.Kbd>1</kit.Kbd><kit.Kbd>{question.options.length}</kit.Kbd></span></span>
                                    <span className='flex items-center justify-between'>Previous / next <span className='flex gap-1'><kit.Kbd>←</kit.Kbd><kit.Kbd>→</kit.Kbd></span></span>
                                    <span className='flex items-center justify-between'>Flag <kit.Kbd>F</kit.Kbd></span>
                                </div>
                            </aside>
                        </sessionStyle.Layout>
                    }
                </div>
            </kit.Page>
        </>
    )
}

export default Session
