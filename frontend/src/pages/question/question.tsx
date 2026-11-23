import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { Interweave } from 'interweave'
import * as kit from '../../styles/kit'
import { Mark } from '../../components/brand/logo'
import CourseIcon from '../../components/courseIcon/courseIcon'
import CommandPalette, { useCommandPalette } from '../../components/commandPalette/commandPalette'
import { AccountMenu, NavIcons } from '../../components/shell/appShell'
import Thread from '../../components/questionExtras/thread'
import ReportDialog from '../../components/questionExtras/reportDialog'
import { Question } from '../../data/sample'
import { getCourse, fetchQuestions, catalogSource } from '../../data/catalog'
import { progress, useProgress, relativeDay } from '../../store/progress'
import { useSession } from '../../store/session'
import { api } from '../../api/client'
import { useRemote } from '../../api/useRemote'
import { notify } from '../../utils/notify'
import { alphabets, optionFromKey, difficultyClass } from '../mcqs/mcqs'
import { acceptanceOf, plainText } from '../questions/parts'
import { FiList, FiChevronLeft, FiChevronRight, FiShuffle, FiBookmark, FiFlag, FiLink, FiMessageCircle, FiFileText, FiBookOpen, FiLock, FiCheck, FiX, FiRotateCcw, FiClock } from 'react-icons/fi'

interface Stats { attempts : number, correctRate : number, options : number[] }
type Tab = 'question' | 'explanation' | 'discussion'

const SPLIT_KEY = 'preproom.split'
const readSplit = () => { try { const value = Number(localStorage.getItem(SPLIT_KEY)); return value >= 30 && value <= 70 ? value : 52 } catch { return 52 } }
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const tabClass = (active : boolean) => `h-9 px-2 inline-flex items-center gap-[6px] text-[13px] rounded-md transition-colors ${active ? 'text-ink font-medium' : 'text-ink-3 hover:text-ink hover:bg-ink/[0.05]'}`

// One question, worked like a problem: read on the left, answer on the right, submit, see how you did
const QuestionPage = () => {

    const navigate = useNavigate()
    const { courseID, questionID } = useParams()
    const [params] = useSearchParams()
    const course = getCourse(courseID)
    const state = useProgress()
    const signedIn = useSession().status === 'user'
    const online = catalogSource() === 'api'
    const [paletteOpen, setPaletteOpen] = useCommandPalette()

    const [list, setList] = useState<Question[] | null>(null)
    const [tab, setTab] = useState<Tab>('question')
    const [picked, setPicked] = useState<number | null>(null)
    const [split, setSplit] = useState(readSplit)
    const [discussions, setDiscussions] = useState(0)
    const [reporting, setReporting] = useState(false)
    const [reported, setReported] = useState(false)
    const body = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let active = true
        fetchQuestions(course.id).then((questions) => { if(active) setList(questions) })
        return () => { active = false }
    }, [course.id])

    const question = list?.find((item) => item.id === questionID)
    const number = list && question ? list.indexOf(question) + 1 : 0
    const status = params.get('status')
    // Prev / next walk the list you came from (respecting a Mistakes or Saved view)
    const order = useMemo(() => (list ?? []).filter((item) =>
        status === 'mistakes' ? state.attempts[item.id] && !state.attempts[item.id].correct || item.id === questionID
        : status === 'saved' ? state.saved[item.id] || item.id === questionID
        : status === 'unanswered' ? !state.attempts[item.id] || item.id === questionID
        : true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, status, questionID])
    const position = order.findIndex((item) => item.id === questionID)
    const go = useCallback((item? : Question) => { if(item) navigate(`/questions/${course.id}/${item.id}${params.toString() ? `?${params}` : ''}`) }, [navigate, course.id, params])

    const attempt = question ? state.attempts[question.id] : undefined
    const answered = !!attempt
    const saved = question ? !!state.saved[question.id] : false

    useEffect(() => { setPicked(null); setTab('question'); setReported(false); setDiscussions(question?.discussions ?? 0) }, [questionID, question?.discussions])
    useEffect(() => { body.current?.scrollTo({ top : 0 }) }, [questionID])

    const embedded = question?.stats
    const fetched = useRemote<Stats>(question && answered && signedIn && online && !embedded ? `qstats:${question.id}:${attempt?.at}` : null,
        () => api.get(`/questions/${question!.id}/stats`).then((r) => r.data)).data
    const stats = answered ? (fetched ?? embedded) : undefined
    const share = (index : number) => stats && stats.attempts >= 5 && stats.options?.[index] !== undefined ? Math.round(stats.options[index] * 100) : null

    const submit = useCallback(() => {
        if(!question || answered || picked === null) return
        progress.answer(question.id, { choice : picked, correct : picked === question.answer, courseID : question.courseID, topic : question.topic })
    }, [question, answered, picked])

    const retry = useCallback(() => { if(question){ progress.clearAttempt(question.id); setPicked(null) } }, [question])
    const toggleSave = useCallback(() => {
        if(!question) return
        progress.toggleSave(question.id)
        notify(saved ? 'Removed from saved' : 'Saved for later')
    }, [question, saved])

    // Keys: 1–4 / A–D pick, ⌘↵ submit, [ ] previous / next, S save, R retry
    useEffect(() => {
        const onKey = (event : KeyboardEvent) => {
            const target = event.target
            if(target instanceof Element && target.closest('input, textarea, [contenteditable="true"], [role="dialog"], [role="alertdialog"]')) return
            if(!question) return
            if((event.metaKey || event.ctrlKey) && event.key === 'Enter'){ event.preventDefault(); answered ? retry() : submit(); return }
            if(event.metaKey || event.ctrlKey || event.altKey) return
            const index = optionFromKey(event.key, question.options.length)
            if(index !== null && !answered){ event.preventDefault(); setPicked(index); return }
            if(event.key === 'Enter' && picked !== null && !answered){ event.preventDefault(); submit() }
            else if(event.key === ']'){ event.preventDefault(); go(order[position + 1]) }
            else if(event.key === '['){ event.preventDefault(); go(order[position - 1]) }
            else if(event.key.toLowerCase() === 's'){ event.preventDefault(); toggleSave() }
            else if(event.key.toLowerCase() === 'r' && answered){ event.preventDefault(); retry() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [question, answered, picked, submit, retry, toggleSave, go, order, position])

    // Drag the divider to resize the panes
    const startDrag = (event : React.PointerEvent<HTMLDivElement>) => {
        const host = event.currentTarget.parentElement
        if(!host) return
        event.currentTarget.setPointerCapture(event.pointerId)
        const rect = host.getBoundingClientRect()
        const move = (e : PointerEvent) => setSplit(Math.min(70, Math.max(30, (e.clientX - rect.left) / rect.width * 100)))
        const up = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            document.body.style.cursor = ''
            setSplit((value) => { try { localStorage.setItem(SPLIT_KEY, String(Math.round(value))) } catch { /* */ } return value })
        }
        document.body.style.cursor = 'col-resize'
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
    }

    const shuffle = () => {
        const pool = (list ?? []).filter((item) => !state.attempts[item.id] && item.id !== questionID)
        go(pool[Math.floor(Math.random() * pool.length)] ?? list?.[Math.floor(Math.random() * (list?.length ?? 0))])
    }

    const copyLink = () => {
        navigator.clipboard?.writeText(window.location.href).then(() => notify('Link copied'), () => notify('Could not copy the link'))
    }

    const optionState = (index : number) => !answered ? (picked === index ? 'picked' : 'idle')
        : index === question!.answer ? 'correct' : index === attempt!.choice ? 'wrong' : 'muted'

    const acceptance = question ? acceptanceOf(question) : null

    return (
        <div className='h-[100dvh] flex flex-col bg-canvas overflow-hidden'>
            <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>

            {/* Workspace bar */}
            <header className='h-12 shrink-0 flex items-center gap-1 px-2 md:px-3'>
                <Link to='/today' aria-label='PrepRoom home' className='w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-ink/[0.06]'><Mark size={20}/></Link>
                <Link to={`/questions/${course.id}${params.toString() ? `?${params}` : ''}`} className='h-8 px-2 inline-flex items-center gap-2 rounded-md text-[14px] font-medium text-ink hover:bg-ink/[0.06] min-w-0'>
                    <FiList size={15} className='text-ink-3 shrink-0'/> <span className='truncate max-w-[22vw]'>{course.name}</span>
                </Link>
                <kit.IconButton type='button' aria-label='Previous question ([)' title='Previous  [' disabled={position <= 0} onClick={()=>go(order[position - 1])}><FiChevronLeft size={17}/></kit.IconButton>
                <kit.IconButton type='button' aria-label='Next question (])' title='Next  ]' disabled={position < 0 || position >= order.length - 1} onClick={()=>go(order[position + 1])}><FiChevronRight size={17}/></kit.IconButton>
                <kit.IconButton type='button' aria-label='Random question' title='Random question' onClick={shuffle}><FiShuffle size={14}/></kit.IconButton>

                <div className='flex-1 flex justify-center'>
                    {
                        question && (
                            answered ?
                            <button type='button' onClick={retry} className='h-8 px-4 inline-flex items-center gap-2 rounded-md bg-ink/[0.06] hover:bg-ink/[0.1] text-[13px] font-medium text-ink transition-colors active:scale-[0.97]'>
                                <FiRotateCcw size={13}/> Try again
                            </button>
                            :
                            <button type='button' onClick={submit} disabled={picked === null} title={`Submit  ${isMac ? '⌘' : 'Ctrl'}↵`}
                                className='h-8 px-5 inline-flex items-center gap-2 rounded-md bg-success text-white text-[13px] font-semibold hover:brightness-110 transition-[filter,transform,opacity] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed'>
                                <FiCheck size={14} strokeWidth={2.75}/> Submit
                            </button>
                        )
                    }
                </div>

                <div className='flex items-center gap-1'>
                    <kit.SecondaryButton type='button' className='!h-8 !px-3 !text-[13px] hidden md:inline-flex' onClick={()=>navigate('/test/testconfig', { state : { courseID : course.id } })}><FiClock size={13}/> Timed test</kit.SecondaryButton>
                    <NavIcons onSearch={()=>setPaletteOpen(true)}/>
                    <AccountMenu/>
                </div>
            </header>

            {/* Panes */}
            <div className='flex-1 min-h-0 flex flex-col md:flex-row gap-0 md:gap-0 px-2 pb-2 overflow-y-auto md:overflow-hidden'>
                {/* Left: the question */}
                <section className='md:h-full min-h-0 flex flex-col rounded-lg bg-surface border border-line overflow-hidden' style={{ flexBasis : `${split}%` }} aria-label='Question'>
                    <div className='h-10 shrink-0 flex items-center gap-1 px-2 border-b border-line bg-ink/[0.02]' role='tablist'>
                        <button type='button' role='tab' aria-selected={tab === 'question'} className={tabClass(tab === 'question')} onClick={()=>setTab('question')}><FiFileText size={14} className='text-accent'/> Question</button>
                        <span className='w-px h-4 bg-line'/>
                        <button type='button' role='tab' aria-selected={tab === 'explanation'} className={tabClass(tab === 'explanation')} onClick={()=>setTab('explanation')}>
                            {answered ? <FiBookOpen size={14} className='text-medium'/> : <FiLock size={13}/>} Explanation
                        </button>
                        {
                            online && <>
                                <span className='w-px h-4 bg-line'/>
                                <button type='button' role='tab' aria-selected={tab === 'discussion'} className={tabClass(tab === 'discussion')} onClick={()=>setTab('discussion')}>
                                    <FiMessageCircle size={14} className='text-easy'/> Discussion {discussions > 0 && <span className='text-ink-3 tabular-nums'>{discussions}</span>}
                                </button>
                            </>
                        }
                    </div>

                    <div ref={body} className='flex-1 min-h-0 overflow-y-auto px-5 py-5' data-lenis-prevent>
                        {
                            !list ? <div className='flex flex-col gap-3'><div className='h-7 w-2/3 rounded bg-ink/[0.06] animate-pulse'/><div className='h-24 rounded bg-ink/[0.04] animate-pulse'/></div>
                            : !question ?
                            <kit.Empty><span className='text-[15px] font-medium text-ink'>This question isn't in {course.name}</span><Link className='text-accent text-[14px]' to={`/questions/${course.id}`}>Back to the list</Link></kit.Empty>
                            : tab === 'question' ?
                            <article className='flex flex-col gap-4'>
                                <h1 className='text-[20px] font-semibold tracking-[-0.015em] text-ink leading-snug'>
                                    {number}. {question.topic}
                                    {attempt && <span className={`ml-2 align-middle inline-flex items-center gap-1 text-[12px] font-medium ${attempt.correct ? 'text-success' : 'text-medium'}`}>{attempt.correct ? <><FiCheck size={13} strokeWidth={2.75}/> Solved</> : 'Attempted'}</span>}
                                </h1>
                                <div className='flex flex-wrap items-center gap-[6px]'>
                                    <span className={`h-6 px-2 rounded-full bg-ink/[0.05] inline-flex items-center text-[12px] font-medium ${difficultyClass[question.difficulty]}`}>{question.difficulty}</span>
                                    <span className='h-6 px-2 rounded-full bg-ink/[0.05] inline-flex items-center text-[12px] text-ink-2'>{question.year} paper</span>
                                    {question.institution && <span className='h-6 px-2 rounded-full bg-ink/[0.05] inline-flex items-center text-[12px] text-ink-2'>{question.institution}</span>}
                                    <span className='h-6 px-2 rounded-full bg-ink/[0.05] inline-flex items-center gap-1 text-[12px] text-ink-2'><CourseIcon course={course} size={14}/> {course.code}</span>
                                </div>
                                <div className='text-[15px] leading-[1.7] text-ink [&_p]:mb-3 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-ink/[0.06] [&_code]:rounded [&_code]:px-1'>
                                    <Interweave content={question.question}/>
                                </div>
                                {
                                    acceptance !== null &&
                                    <div className='flex gap-6 pt-3 mt-2 border-t border-line text-[12px] text-ink-3'>
                                        <span>Acceptance <b className='block text-[14px] font-medium text-ink tabular-nums'>{acceptance}%</b></span>
                                        <span>Answered <b className='block text-[14px] font-medium text-ink tabular-nums'>{(question.acceptance ?? question.stats)?.attempts.toLocaleString()}</b></span>
                                    </div>
                                }
                            </article>
                            : tab === 'explanation' ?
                            (
                                answered ?
                                <article className='flex flex-col gap-3'>
                                    <h2 className='text-[16px] font-semibold text-ink'>Answer: {alphabets[question.answer].toUpperCase()}</h2>
                                    <div className='text-[15px] leading-[1.7] text-ink-2'><Interweave content={question.options[question.answer]}/></div>
                                    {question.explanation ? <div className='text-[15px] leading-[1.7] text-ink'><Interweave content={question.explanation}/></div> : <p className='text-[14px] text-ink-3'>No written explanation for this one yet. Ask in the discussion.</p>}
                                </article>
                                :
                                <kit.Empty className='!border-0'>
                                    <FiLock size={18}/>
                                    <span className='text-[15px] font-medium text-ink'>Answer first</span>
                                    <span className='text-[14px] max-w-[280px]'>The explanation unlocks after you submit, so it can't nudge your answer.</span>
                                </kit.Empty>
                            )
                            :
                            <Thread questionID={question.id} onCount={setDiscussions}/>
                        }
                    </div>

                    {
                        question &&
                        <div className='h-10 shrink-0 flex items-center gap-1 px-2 border-t border-line'>
                            <button type='button' onClick={toggleSave} aria-pressed={saved} title='Save  S' className={`h-7 px-2 inline-flex items-center gap-[6px] rounded-md text-[12px] transition-colors hover:bg-ink/[0.05] ${saved ? 'text-accent' : 'text-ink-3 hover:text-ink'}`}>
                                <FiBookmark size={13} fill={saved ? 'currentColor' : 'none'}/> {saved ? 'Saved' : 'Save'}
                            </button>
                            {online && <button type='button' onClick={()=>setTab('discussion')} className='h-7 px-2 inline-flex items-center gap-[6px] rounded-md text-[12px] text-ink-3 hover:text-ink hover:bg-ink/[0.05]'><FiMessageCircle size={13}/> {discussions}</button>}
                            <button type='button' onClick={copyLink} className='h-7 px-2 inline-flex items-center gap-[6px] rounded-md text-[12px] text-ink-3 hover:text-ink hover:bg-ink/[0.05]'><FiLink size={13}/> Share</button>
                            {
                                online &&
                                <button type='button' disabled={reported} onClick={()=> signedIn ? setReporting(true) : navigate('/auth/login', { state : { from : window.location.pathname } })}
                                    className='ml-auto h-7 px-2 inline-flex items-center gap-[6px] rounded-md text-[12px] text-ink-3 hover:text-ink hover:bg-ink/[0.05] disabled:opacity-50'>
                                    <FiFlag size={13}/> {reported ? 'Reported' : 'Report'}
                                </button>
                            }
                        </div>
                    }
                </section>

                {/* Divider */}
                <div onPointerDown={startDrag} role='separator' aria-orientation='vertical' aria-valuenow={Math.round(split)} aria-label='Resize panes'
                    className='hidden md:flex w-2 shrink-0 cursor-col-resize items-center justify-center group'>
                    <span className='w-[3px] h-8 rounded-full bg-transparent group-hover:bg-accent/60 transition-colors'/>
                </div>

                {/* Right: answer sheet and result */}
                <section className='md:h-full min-h-0 flex-1 flex flex-col gap-2 mt-2 md:mt-0' aria-label='Answer'>
                    <div className='flex-1 min-h-0 flex flex-col rounded-lg bg-surface border border-line overflow-hidden'>
                        <div className='h-10 shrink-0 flex items-center gap-2 px-3 border-b border-line bg-ink/[0.02] text-[13px] font-medium text-ink'>
                            <FiCheck size={14} className='text-success'/> Answer
                            <span className='ml-auto text-[12px] font-normal text-ink-3 hidden lg:inline'>
                                <kit.Kbd>1</kit.Kbd>–<kit.Kbd>{question?.options.length ?? 4}</kit.Kbd> choose · <kit.Kbd>{isMac ? '⌘' : 'Ctrl'}</kit.Kbd><kit.Kbd>↵</kit.Kbd> submit
                            </span>
                        </div>
                        <div className='flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2' role='radiogroup' aria-label='Options' data-lenis-prevent>
                            {
                                question?.options.map((option, index) => {
                                    const s = optionState(index)
                                    const pct = answered ? share(index) : null
                                    return (
                                        <button
                                            key={index}
                                            type='button'
                                            role='radio'
                                            aria-checked={answered ? attempt?.choice === index : picked === index}
                                            disabled={answered}
                                            onClick={()=>setPicked(index)}
                                            className={`relative w-full flex items-center gap-3 rounded-md border px-3 min-h-[52px] py-2 text-left text-[15px] leading-[1.45] overflow-hidden transition-[background-color,border-color,transform] duration-100 enabled:active:scale-[0.99]
                                            ${s === 'picked' ? 'border-accent bg-accent-tint' : s === 'correct' ? 'border-success/50 bg-success/10' : s === 'wrong' ? 'border-hard/50 bg-hard/10' : s === 'muted' ? 'border-line text-ink-3' : 'border-line hover:border-line-strong hover:bg-ink/[0.03]'}`}
                                        >
                                            {pct !== null && <span className='absolute inset-y-0 left-0 bg-ink/[0.04]' style={{ width : `${pct}%` }} aria-hidden/>}
                                            <span className={`relative w-7 h-7 rounded-md shrink-0 inline-flex items-center justify-center font-mono text-[12px] font-medium
                                                ${s === 'picked' ? 'bg-accent text-on-accent' : s === 'correct' ? 'bg-success text-white' : s === 'wrong' ? 'bg-hard text-white' : 'bg-ink/[0.06] text-ink-3'}`}>
                                                {alphabets[index].toUpperCase()}
                                            </span>
                                            <span className='relative flex-1 min-w-0'><Interweave content={option}/></span>
                                            {pct !== null && <span className='relative text-[12px] text-ink-3 tabular-nums'>{pct}%</span>}
                                            {s === 'correct' && <FiCheck className='relative text-success shrink-0' size={17} strokeWidth={2.75}/>}
                                            {s === 'wrong' && <FiX className='relative text-hard shrink-0' size={17} strokeWidth={2.75}/>}
                                        </button>
                                    )
                                })
                            }
                        </div>
                    </div>

                    {/* Result console */}
                    <div className='shrink-0 rounded-lg bg-surface border border-line overflow-hidden' aria-live='polite'>
                        <div className='h-10 flex items-center gap-2 px-3 border-b border-line bg-ink/[0.02] text-[13px] font-medium text-ink'>
                            <FiFileText size={14} className='text-success'/> Result
                        </div>
                        <div className='px-4 py-4 min-h-[96px] flex flex-col justify-center gap-2'>
                            {
                                !question ? null
                                : !answered ?
                                <span className='text-[14px] text-ink-3'>{picked === null ? 'Pick an option, then submit.' : <>Ready: <b className='font-medium text-ink'>{alphabets[picked].toUpperCase()}</b>. Press Submit or <kit.Kbd>↵</kit.Kbd>.</>}</span>
                                :
                                <>
                                    <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
                                        <span className={`text-[20px] font-semibold tracking-[-0.02em] ${attempt!.correct ? 'text-success' : 'text-hard'}`}>{attempt!.correct ? 'Correct' : 'Wrong answer'}</span>
                                        <span className='text-[13px] text-ink-3'>Answered {relativeDay(attempt!.at).toLowerCase()}</span>
                                    </div>
                                    <div className='flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-3'>
                                        <span>Your answer <b className='font-medium text-ink'>{alphabets[attempt!.choice].toUpperCase()}</b></span>
                                        {!attempt!.correct && <span>Correct answer <b className='font-medium text-success'>{alphabets[question.answer].toUpperCase()}</b></span>}
                                        {stats && stats.attempts >= 5 && <span><b className='font-medium text-ink tabular-nums'>{Math.round(stats.correctRate * 100)}%</b> of students got this right</span>}
                                    </div>
                                    <div className='flex gap-2 pt-1'>
                                        <kit.SecondaryButton type='button' className='!h-8 !text-[13px]' onClick={()=>setTab('explanation')}><FiBookOpen size={13}/> Explanation</kit.SecondaryButton>
                                        {position < order.length - 1 && <kit.PrimaryButton type='button' className='!h-8 !text-[13px]' onClick={()=>go(order[position + 1])}>Next question <FiChevronRight size={14}/></kit.PrimaryButton>}
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </section>
            </div>
            {question && reporting && <ReportDialog question={question} open={reporting} onClose={()=>setReporting(false)} onReported={()=>setReported(true)}/>}
        </div>
    )
}

export default QuestionPage
