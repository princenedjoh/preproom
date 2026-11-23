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
import { FiList, FiChevronLeft, FiChevronRight, FiShuffle, FiBookmark, FiFlag, FiLink, FiMessageCircle, FiFileText, FiBookOpen, FiLock, FiCheck, FiX, FiRotateCcw, FiClock, FiUploadCloud, FiEdit3, FiChevronDown, FiTag, FiSearch } from 'react-icons/fi'

interface Stats { attempts : number, correctRate : number, options : number[] }
type Tab = 'question' | 'explanation' | 'discussion' | 'notes'

const NOTES_KEY = 'preproom.notes.v1'
const readNotes = () : Record<string, string> => { try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}') } catch { return {} } }

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
    const [drawer, setDrawer] = useState(false)
    const [drawerSearch, setDrawerSearch] = useState('')
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ similar : true })
    const [notes, setNotes] = useState<Record<string, string>>(readNotes)

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
        status === 'mistakes' ? (state.attempts[item.id] && !state.attempts[item.id].correct) || item.id === questionID
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

    const saveNote = (text : string) => {
        if(!question) return
        const next = { ...notes, [question.id] : text }
        if(!text.trim()) delete next[question.id]
        setNotes(next)
        try { localStorage.setItem(NOTES_KEY, JSON.stringify(next)) } catch { /* private mode */ }
    }

    useEffect(() => {
        if(!drawer) return
        const onKey = (event : KeyboardEvent) => { if(event.key === 'Escape') setDrawer(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [drawer])

    const similar = useMemo(() => {
        if(!list || !question) return []
        const same = list.filter((item) => item.topic === question.topic && item.id !== question.id)
        return (same.length ? same : list.filter((item) => item.id !== question.id)).slice(0, 6)
    }, [list, question])

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
        <div className='h-[100dvh] flex flex-col bg-frame overflow-hidden'>
            <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>

            {/* Workspace bar */}
            <header className='h-12 shrink-0 flex items-center gap-1 px-2 md:px-3'>
                <Link to='/today' aria-label='PrepRoom home' className='w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-ink/[0.06]'><Mark size={20}/></Link>
                <button type='button' onClick={()=>setDrawer(true)} aria-haspopup='dialog' className='h-8 px-2 inline-flex items-center gap-2 rounded-md text-[14px] font-medium text-ink hover:bg-ink/[0.06] min-w-0'>
                    <FiList size={15} className='text-ink-3 shrink-0'/> <span className='truncate max-w-[22vw]'>{course.name}</span>
                </button>
                <kit.IconButton type='button' aria-label='Previous question ([)' title='Previous  [' disabled={position <= 0} onClick={()=>go(order[position - 1])}><FiChevronLeft size={17}/></kit.IconButton>
                <kit.IconButton type='button' aria-label='Next question (])' title='Next  ]' disabled={position < 0 || position >= order.length - 1} onClick={()=>go(order[position + 1])}><FiChevronRight size={17}/></kit.IconButton>
                <kit.IconButton type='button' aria-label='Random question' title='Random question' onClick={shuffle}><FiShuffle size={14}/></kit.IconButton>

                <div className='flex-1 flex justify-center'>
                    {
                        question && (
                            answered ?
                            <button type='button' onClick={retry} className='h-8 px-4 inline-flex items-center gap-2 rounded-[5px] bg-ink/[0.08] hover:bg-ink/[0.12] text-[14px] font-medium text-ink-2 transition-colors active:scale-[0.97]'>
                                <FiRotateCcw size={13}/> Try again
                            </button>
                            :
                            <button type='button' onClick={submit} disabled={picked === null} title={`Submit  ${isMac ? '⌘' : 'Ctrl'}↵`}
                                className='h-8 px-4 inline-flex items-center gap-2 rounded-[5px] bg-ink/[0.08] hover:bg-ink/[0.12] text-success text-[14px] font-semibold transition-[background-color,transform,opacity] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed'>
                                <FiUploadCloud size={15} strokeWidth={2.25}/> Submit
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
                        <span className='w-px h-4 bg-line'/>
                        <button type='button' role='tab' aria-selected={tab === 'notes'} className={tabClass(tab === 'notes')} onClick={()=>setTab('notes')}>
                            <FiEdit3 size={13} className='text-tag-purple'/> Notes {question && notes[question.id] && <span className='w-[6px] h-[6px] rounded-full bg-tag-purple'/>}
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
                                    <div className='flex gap-8 pt-4 mt-2 border-t border-line text-[12px] text-ink-3'>
                                        <span>Answered <b className='block text-[14px] font-medium text-ink tabular-nums'>{(question.acceptance ?? question.stats)?.attempts.toLocaleString()}</b></span>
                                        <span>Acceptance rate <b className='block text-[14px] font-medium text-ink tabular-nums'>{acceptance}%</b></span>
                                    </div>
                                }
                                <div className='flex flex-col border-t border-line mt-2'>
                                    {[
                                        { key : 'topics', icon : FiTag, label : 'Topics', body : (
                                            <div className='flex flex-wrap gap-[6px]'>
                                                <Link to={`/questions/${course.id}?topic=${encodeURIComponent(question.topic)}`} className='h-6 px-2 rounded-full bg-ink/[0.06] hover:bg-ink/[0.1] inline-flex items-center text-[12px] text-ink-2'>{question.topic}</Link>
                                                {question.institution && <span className='h-6 px-2 rounded-full bg-ink/[0.06] inline-flex items-center text-[12px] text-ink-2'>{question.institution} {question.year}</span>}
                                            </div>
                                        ) },
                                        { key : 'similar', icon : FiList, label : 'Similar questions', body : (
                                            <div className='flex flex-col'>
                                                {similar.map((item) => (
                                                    <button key={item.id} type='button' onClick={()=>go(item)} className='flex items-center gap-3 h-9 text-left text-[14px] text-ink hover:text-accent transition-colors'>
                                                        <span className='flex-1 min-w-0 truncate'>{(list?.indexOf(item) ?? 0) + 1}. {plainText(item.question)}</span>
                                                        <span className={`text-[12px] font-medium ${difficultyClass[item.difficulty]}`}>{item.difficulty}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) },
                                    ].map((section) => (
                                        <div key={section.key} className='border-b border-line'>
                                            <button type='button' aria-expanded={!!openSections[section.key]} onClick={()=>setOpenSections({ ...openSections, [section.key] : !openSections[section.key] })}
                                                className='w-full h-11 flex items-center gap-2 text-[14px] text-ink'>
                                                <section.icon size={14} className='text-ink-3'/> {section.label}
                                                <FiChevronDown size={15} className={`ml-auto text-ink-3 transition-transform duration-200 ${openSections[section.key] ? 'rotate-180' : ''}`}/>
                                            </button>
                                            {openSections[section.key] && <div className='pb-3 animate-[fade_160ms_ease-out]'>{section.body}</div>}
                                        </div>
                                    ))}
                                </div>
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
                            : tab === 'notes' ?
                            <div className='flex flex-col gap-2 h-full'>
                                <span className='text-[12px] text-ink-3'>Private to you, kept on this device.</span>
                                <textarea
                                    value={notes[question.id] ?? ''}
                                    onChange={(e)=>saveNote(e.target.value)}
                                    placeholder='Write down the trick, the formula, or why you got it wrong…'
                                    className='flex-1 min-h-[240px] w-full rounded-md bg-ink/[0.04] focus:bg-surface focus:ring-1 focus:ring-accent/60 p-3 text-[14px] leading-[1.6] text-ink placeholder:text-ink-4 outline-none resize-none'
                                />
                            </div>
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
            {/* Question list drawer */}
            <div className={`fixed inset-0 z-40 ${drawer ? '' : 'pointer-events-none'}`} aria-hidden={!drawer}>
                <div className={`absolute inset-0 transition-opacity duration-200 ${drawer ? 'opacity-100' : 'opacity-0'}`} style={{ background : 'var(--scrim)' }} onClick={()=>setDrawer(false)}/>
                <div role='dialog' aria-label={`${course.name} questions`}
                    className='absolute inset-y-0 left-0 w-[540px] max-w-[92vw] bg-surface shadow-float flex flex-col transition-transform duration-300 ease-drawer'
                    style={{ transform : drawer ? 'none' : 'translateX(-102%)' }}>
                    <div className='h-14 shrink-0 flex items-center gap-3 px-5 border-b border-line'>
                        <Link to={`/questions/${course.id}`} className='flex items-center gap-1 text-[18px] font-semibold text-ink hover:text-accent'>{course.name} <FiChevronRight size={17}/></Link>
                        <span className='ml-auto text-[13px] text-ink-2 tabular-nums'>{(list ?? []).filter((item) => state.attempts[item.id]?.correct).length}/{list?.length ?? 0} Solved</span>
                        <kit.IconButton type='button' aria-label='Close' onClick={()=>setDrawer(false)}><FiX size={17}/></kit.IconButton>
                    </div>
                    <div className='px-4 py-3'>
                        <label className='relative block'>
                            <FiSearch size={14} className='absolute left-[10px] top-1/2 -translate-y-1/2 text-ink-3'/>
                            <input value={drawerSearch} onChange={(e)=>setDrawerSearch(e.target.value)} placeholder='Search questions' aria-label='Search questions'
                                className='w-full h-8 rounded-md bg-ink/[0.05] focus:bg-surface focus:ring-1 focus:ring-accent/60 pl-8 pr-2 text-[13px] text-ink placeholder:text-ink-3 outline-none'/>
                        </label>
                    </div>
                    <div className='flex-1 min-h-0 overflow-y-auto px-4 pb-4' data-lenis-prevent>
                        {(list ?? []).map((item, index) => ({ item, index })).filter(({ item }) => !drawerSearch.trim() || plainText(item.question).toLowerCase().includes(drawerSearch.trim().toLowerCase()) || item.topic.toLowerCase().includes(drawerSearch.trim().toLowerCase())).map(({ item, index }, row) => {
                            const current = item.id === questionID
                            const mark = state.attempts[item.id]
                            return (
                                <button key={item.id} type='button' onClick={()=>{ setDrawer(false); go(item) }}
                                    className={`w-full h-10 flex items-center gap-3 px-3 rounded-md text-left text-[14px] transition-colors
                                    ${current ? 'bg-ink/[0.1] text-ink font-medium' : row % 2 ? 'hover:bg-ink/[0.07]' : 'bg-stripe hover:bg-ink/[0.07]'}`}>
                                    <span className='w-4 shrink-0'>{mark ? (mark.correct ? <FiCheck size={14} strokeWidth={2.75} className='text-success'/> : <span className='block w-[10px] h-[10px] rounded-full border-2 border-medium'/>) : null}</span>
                                    <span className='flex-1 min-w-0 truncate'>{index + 1}. {plainText(item.question)}</span>
                                    <span className={`text-[12px] font-medium ${difficultyClass[item.difficulty]}`}>{item.difficulty === 'Medium' ? 'Med.' : item.difficulty}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
            {question && reporting && <ReportDialog question={question} open={reporting} onClose={()=>setReporting(false)} onReported={()=>setReported(true)}/>}
        </div>
    )
}

export default QuestionPage
