import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Interweave } from 'interweave'
import { toast } from 'react-toastify'
import { FiCheck, FiX, FiCheckCircle, FiArrowRight, FiCornerUpLeft } from 'react-icons/fi'
import * as sample from '../../data/sample'
import { useAdmin } from '../../context/admin'
import { EmptyState } from '../../components/ui/ui'
import { DarkButton, GhostButton, Segmented, SegmentedItem, Panel, Eyebrow, Kbd } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, CourseDot, DifficultyPill, Muted, Mono, CountBadge } from '../../styles/adminKit'
import { letters } from '../addQuestion/addQuestion'
import * as preview from '../addQuestion/addQuestion.style'

const tabs : { status : sample.FlagStatus, label : string }[] = [
    { status : 'open', label : 'Open' },
    { status : 'resolved', label : 'Resolved' },
    { status : 'dismissed', label : 'Dismissed' },
]

const issueTone : Record<sample.FlagIssue, string> = {
    'Wrong answer' : 'bg-[#ffe3ec] text-[#7a0f2f]',
    'Typo' : 'bg-mercury text-muted',
    'Unclear question' : 'bg-[#fff0e3] text-[#7a3d07]',
    'Duplicate' : 'bg-[#efebfe] text-[#4a2fd0]',
    'Missing explanation' : 'bg-[#e6f3ff] text-[#005fa8]',
}

const Flags = () => {
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const { flags, setFlagStatus } = useAdmin()
    const [tab, setTab] = useState<sample.FlagStatus>('open')
    // Answers changed by accepting a suggestion, keyed by question
    const [answers, setAnswers] = useState<Record<string, number>>({})

    const list = flags.filter((flag) => flag.status === tab)
    const selectedID = params.get('flag')
    const selected = flags.find((flag) => flag.id === selectedID && flag.status === tab) ?? list[0]

    // Deep links can point at a flag in another tab
    useEffect(() => {
        const linked = flags.find((flag) => flag.id === selectedID)
        if (linked && linked.status !== tab) setTab(linked.status)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedID])

    const select = (id? : string) => setParams(id ? { flag : id } : {}, { replace : true })

    const act = (flag : sample.Flag, status : sample.FlagStatus, message : string) => {
        const index = list.findIndex((item) => item.id === flag.id)
        const next = list[index + 1] ?? list[index - 1]
        setFlagStatus(flag.id, status)
        select(next && next.id !== flag.id ? next.id : undefined)
        sample.api.patch('/flags/update', { id : flag.id, status }).catch(() => undefined)
        toast.success(message, {
            closeButton : ({ closeToast }) => (
                <button className="text-[13px] font-bold text-brand-blue px-2" onClick={(event) => {
                    setFlagStatus(flag.id, flag.status)
                    select(flag.id)
                    closeToast(event)
                }}>Undo</button>
            ),
        })
    }

    const accept = (flag : sample.Flag) => {
        if (flag.suggestedAnswer === undefined) return
        setAnswers({ ...answers, [flag.questionID] : flag.suggestedAnswer })
        act(flag, 'resolved', `Answer changed to ${letters[flag.suggestedAnswer]} and flag resolved.`)
    }

    // j / k to move, r to resolve, d to dismiss
    useEffect(() => {
        const onKey = (event : KeyboardEvent) => {
            if ((event.target as HTMLElement)?.closest('input, textarea, select, [contenteditable="true"]') || event.metaKey || event.ctrlKey) return
            const index = list.findIndex((item) => item.id === selected?.id)
            if (event.key === 'j' && list[index + 1]) select(list[index + 1].id)
            if (event.key === 'k' && list[index - 1]) select(list[index - 1].id)
            if (selected && tab === 'open' && event.key === 'r') act(selected, 'resolved', 'Flag resolved.')
            if (selected && tab === 'open' && event.key === 'd') act(selected, 'dismissed', 'Flag dismissed.')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    })

    const question = sample.getQuestion(selected?.questionID)
    const course = sample.getCourse(question?.courseID)
    const currentAnswer = question ? answers[question.id] ?? question.answer : undefined

    return (
        <Screen>
            <ScreenHeader>
                <div>
                    <ScreenTitle>Flags</ScreenTitle>
                    <ScreenLead>Students flag questions they think are wrong or unclear. Check each one against the question and decide.</ScreenLead>
                </div>
                <div className="hidden md:flex items-center gap-3 text-[12px] text-ash">
                    <span className="flex items-center gap-1"><Kbd>J</Kbd><Kbd>K</Kbd> move</span>
                    <span className="flex items-center gap-1"><Kbd>R</Kbd> resolve</span>
                    <span className="flex items-center gap-1"><Kbd>D</Kbd> dismiss</span>
                </div>
            </ScreenHeader>

            <Segmented className="w-fit">
                {tabs.map((item) => {
                    const count = flags.filter((flag) => flag.status === item.status).length
                    return (
                        <SegmentedItem key={item.status} active={tab === item.status} onClick={() => { setTab(item.status); select() }}
                            className="inline-flex items-center gap-2">
                            {item.label}
                            <span className="text-[11px] tabular-nums text-ash">{count}</span>
                        </SegmentedItem>
                    )
                })}
            </Segmented>

            {list.length === 0 ? (
                <EmptyState icon={FiCheckCircle}
                    title={tab === 'open' ? 'All caught up' : `No ${tab} flags`}
                    body={tab === 'open' ? 'There are no open flags. New ones from students land here.' : undefined} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
                    <div className="flex flex-col gap-2" role="listbox" aria-label={`${tab} flags`}>
                        {list.map((flag) => {
                            const item = sample.getQuestion(flag.questionID)
                            const active = flag.id === selected?.id
                            return (
                                <button key={flag.id} role="option" aria-selected={active} onClick={() => select(flag.id)}
                                    className={`text-left flex flex-col gap-2 p-4 rounded-[12px] border transition-[background,border-color] duration-150
                                        ${active ? 'bg-white border-ink shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-white border-bone hover:bg-mist'}`}>
                                    <span className="flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-[2px] text-[11px] font-semibold ${issueTone[flag.issue]}`}>{flag.issue}</span>
                                        <Mono className="ml-auto whitespace-nowrap">{flag.raisedAt}</Mono>
                                    </span>
                                    <span className="text-[13px] text-ink line-clamp-2 leading-[1.45]">{item ? sample.plainText(item.question) : 'Question removed'}</span>
                                    <span className="text-[12px] text-ash">{flag.reporter} · {sample.getCourse(item?.courseID)?.code}</span>
                                </button>
                            )
                        })}
                    </div>

                    {selected && (
                        <Panel className="!p-0 overflow-hidden lg:sticky lg:top-[80px]">
                            <div className="flex flex-col gap-3 p-5 border-b border-bone bg-mist">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`rounded-full px-2 py-[2px] text-[11px] font-semibold ${issueTone[selected.issue]}`}>{selected.issue}</span>
                                    <Muted>raised by <strong className="text-ink font-semibold">{selected.reporter}</strong> · {selected.raisedAt}</Muted>
                                    {selected.status !== 'open' && <CountBadge tone="ink" className="!uppercase !px-2">{selected.status}</CountBadge>}
                                </div>
                                <p className="text-[14px] leading-[1.55] text-ink">“{selected.comment}”</p>
                                {selected.suggestedAnswer !== undefined && (
                                    <Muted>Suggests <strong className="text-brand-blue">option {letters[selected.suggestedAnswer]}</strong> is correct.</Muted>
                                )}
                            </div>

                            {question ? (
                                <div className="flex flex-col gap-4 p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Eyebrow>The question</Eyebrow>
                                        {course && <preview.Chip className="ml-auto"><CourseDot color={course.color} />{course.code}</preview.Chip>}
                                        <DifficultyPill level={question.difficulty}>{question.difficulty}</DifficultyPill>
                                    </div>
                                    <preview.PreviewQuestion><Interweave content={question.question} /></preview.PreviewQuestion>
                                    <div className="flex flex-col gap-2">
                                        {question.options.map((option, index) => {
                                            const suggested = selected.suggestedAnswer === index && currentAnswer !== index
                                            return (
                                                <preview.PreviewOption key={index} correct={currentAnswer === index}
                                                    className={suggested ? '!border-brand-blue !border-dashed' : ''}>
                                                    <preview.PreviewLetter correct={currentAnswer === index}>{letters[index]}</preview.PreviewLetter>
                                                    <span className="min-w-0 break-words flex-1"><Interweave content={option} /></span>
                                                    {currentAnswer === index && <Mono className="!text-[#005c3a]">current</Mono>}
                                                    {suggested && <Mono className="!text-brand-blue">suggested</Mono>}
                                                </preview.PreviewOption>
                                            )
                                        })}
                                    </div>
                                    {question.explanation && (
                                        <preview.PreviewExplanation>
                                            <span className="font-semibold text-ink">Explanation</span>
                                            <Interweave content={question.explanation} />
                                        </preview.PreviewExplanation>
                                    )}
                                </div>
                            ) : <div className="p-5"><Muted>This question has been deleted.</Muted></div>}

                            <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-t border-bone">
                                <GhostButton onClick={() => navigate(`/questions?open=${selected.questionID}`)}>Open in bank <FiArrowRight size={14} /></GhostButton>
                                <div className="flex-1" />
                                {selected.status === 'open' ? (
                                    <>
                                        <GhostButton onClick={() => act(selected, 'dismissed', 'Flag dismissed.')}><FiX size={14} /> Dismiss</GhostButton>
                                        {selected.suggestedAnswer !== undefined && selected.suggestedAnswer !== currentAnswer && (
                                            <GhostButton onClick={() => accept(selected)}>Use option {letters[selected.suggestedAnswer]}</GhostButton>
                                        )}
                                        <DarkButton onClick={() => act(selected, 'resolved', 'Flag resolved.')}><FiCheck size={14} /> Resolve</DarkButton>
                                    </>
                                ) : (
                                    <GhostButton onClick={() => act(selected, 'open', 'Flag reopened.')}><FiCornerUpLeft size={14} /> Reopen</GhostButton>
                                )}
                            </div>
                        </Panel>
                    )}
                </div>
            )}
        </Screen>
    )
}

export default Flags
