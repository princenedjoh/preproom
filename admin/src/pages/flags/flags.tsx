import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Interweave } from 'interweave'
import { toast } from 'react-toastify'
import { FiCheck, FiX, FiCheckCircle, FiArrowRight, FiCornerUpLeft } from 'react-icons/fi'
import * as sample from '../../data/sample'
import { useAdmin } from '../../context/admin'
import { EmptyState } from '../../components/ui/ui'
import SegmentedControl from '../../components/ui/segmented'
import { PrimaryButton, SecondaryButton, GhostButton, Panel, Eyebrow, Kbd, Tag } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, CourseDot, DifficultyLabel, Muted, Mono, issueTone } from '../../styles/adminKit'
import { letters } from '../addQuestion/addQuestion'
import * as preview from '../addQuestion/addQuestion.style'

const tabs : { status : sample.FlagStatus, label : string }[] = [
    { status : 'open', label : 'Open' },
    { status : 'resolved', label : 'Resolved' },
    { status : 'dismissed', label : 'Dismissed' },
]


const Flags = () => {
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const { flags, setFlagStatus } = useAdmin()
    const [tab, setTab] = useState<sample.FlagStatus>('open')

    // The API sends a snapshot of the question with each flag; sample flags look it up
    const questionFor = (flag? : sample.Flag) => {
        if (flag?.question) return { id : flag.questionID, ...flag.question, explanation : '', difficulty : undefined as sample.Difficulty | undefined }
        const local = sample.getQuestion(flag?.questionID)
        return local && { ...local, courseCode : sample.getCourse(local.courseID)?.code ?? '' }
    }

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

    const act = async (flag : sample.Flag, status : sample.FlagStatus, message : string, applyAnswer? : number) => {
        const index = list.findIndex((item) => item.id === flag.id)
        const next = list[index + 1] ?? list[index - 1]
        try {
            await setFlagStatus(flag.id, status, applyAnswer)
        } catch {
            return
        }
        select(next && next.id !== flag.id ? next.id : undefined)
        toast.success(message, {
            closeButton : applyAnswer !== undefined ? undefined : ({ closeToast }) => (
                <button className="text-[13px] font-bold text-accent px-2" onClick={(event) => {
                    setFlagStatus(flag.id, flag.status).then(() => select(flag.id), () => undefined)
                    closeToast(event)
                }}>Undo</button>
            ),
        })
    }

    const accept = (flag : sample.Flag) => {
        if (flag.suggestedAnswer === undefined || flag.suggestedAnswer === null) return
        act(flag, 'resolved', `Answer changed to ${letters[flag.suggestedAnswer]} and flag resolved.`, flag.suggestedAnswer)
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

    const question = questionFor(selected)
    const currentAnswer = question?.answer

    return (
        <Screen>
            <ScreenHeader>
                <div>
                    <ScreenTitle>Flags</ScreenTitle>
                    <ScreenLead>Students flag questions they think are wrong or unclear. Check each one against the question and decide.</ScreenLead>
                </div>
                <div className="hidden md:flex items-center gap-3 text-[12px] text-ink-3">
                    <span className="flex items-center gap-1"><Kbd>J</Kbd><Kbd>K</Kbd> move</span>
                    <span className="flex items-center gap-1"><Kbd>R</Kbd> resolve</span>
                    <span className="flex items-center gap-1"><Kbd>D</Kbd> dismiss</span>
                </div>
            </ScreenHeader>

            <SegmentedControl
                aria-label="Flag status"
                className="w-fit"
                value={tab}
                onChange={(status) => { setTab(status); select() }}
                options={tabs.map((item) => ({
                    value : item.status,
                    label : <span className="inline-flex items-center gap-2">{item.label}<span className="text-[11px] tabular-nums text-ink-3">{flags.filter((flag) => flag.status === item.status).length}</span></span>,
                }))}
            />

            {list.length === 0 ? (
                <EmptyState icon={FiCheckCircle}
                    title={tab === 'open' ? 'All caught up' : `No ${tab} flags`}
                    body={tab === 'open' ? 'There are no open flags. New ones from students land here.' : undefined} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
                    <div className="flex flex-col rounded-lg border border-line bg-surface overflow-hidden" role="listbox" aria-label={`${tab} flags`}>
                        {list.map((flag) => {
                            const item = questionFor(flag)
                            const active = flag.id === selected?.id
                            return (
                                <button key={flag.id} role="option" aria-selected={active} onClick={() => select(flag.id)}
                                    className={`relative text-left flex flex-col gap-[6px] px-4 py-3 border-t border-line first:border-t-0 transition-colors duration-150
                                        ${active ? 'bg-accent-tint' : 'hover:bg-ink/[0.03]'}`}>
                                    {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent" />}
                                    <span className="flex items-center gap-2">
                                        <Tag tone={issueTone(flag.issue)}>{flag.issue}</Tag>
                                        <Mono className="ml-auto whitespace-nowrap">{flag.raisedAt}</Mono>
                                    </span>
                                    <span className="text-[14px] text-ink line-clamp-2 leading-[1.45]">{item ? sample.plainText(item.question) : 'Question removed'}</span>
                                    <span className="text-[12px] text-ink-3">{flag.reporter} · {item?.courseCode}</span>
                                </button>
                            )
                        })}
                    </div>

                    {selected && (
                        <Panel className="!p-0 overflow-hidden lg:sticky lg:top-[80px]">
                            <div className="flex flex-col gap-3 p-5 border-b border-line">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag tone={issueTone(selected.issue)}>{selected.issue}</Tag>
                                    <Muted>raised by <strong className="text-ink font-medium">{selected.reporter}</strong> · {selected.raisedAt}</Muted>
                                    {selected.status !== 'open' && <Tag tone={selected.status === 'resolved' ? 'green' : 'gray'} className="capitalize">{selected.status}</Tag>}
                                </div>
                                <blockquote className="text-[15px] leading-[1.55] text-ink border-l-[3px] border-ink pl-3">{selected.comment}</blockquote>
                                {selected.suggestedAnswer !== undefined && selected.suggestedAnswer !== null && (
                                    <Muted>Suggests <strong className="text-accent">option {letters[selected.suggestedAnswer]}</strong> is correct.</Muted>
                                )}
                            </div>

                            {question ? (
                                <div className="flex flex-col gap-4 p-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Eyebrow>The question</Eyebrow>
                                        {question.courseCode && <preview.Chip className="ml-auto"><CourseDot color={sample.getCourse(question.courseID)?.color ?? '#888'} />{question.courseCode}</preview.Chip>}
                                        {question.difficulty && <DifficultyLabel level={question.difficulty} />}
                                    </div>
                                    <preview.PreviewQuestion><Interweave content={question.question} /></preview.PreviewQuestion>
                                    <div className="flex flex-col gap-2">
                                        {question.options.map((option, index) => {
                                            const suggested = selected.suggestedAnswer === index && currentAnswer !== index
                                            return (
                                                <preview.PreviewOption key={index} correct={currentAnswer === index}
                                                    className={suggested ? '!border-accent !border-dashed' : ''}>
                                                    <preview.PreviewLetter correct={currentAnswer === index}>{letters[index]}</preview.PreviewLetter>
                                                    <span className="min-w-0 break-words flex-1"><Interweave content={option} /></span>
                                                    {currentAnswer === index && <Mono className="!text-tag-green">current</Mono>}
                                                    {suggested && <Mono className="!text-accent">suggested</Mono>}
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

                            <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-t border-line">
                                <GhostButton className="-ml-2" onClick={() => navigate(`/questions?open=${selected.questionID}`)}>Open in bank <FiArrowRight size={14} /></GhostButton>
                                <div className="flex-1" />
                                {selected.status === 'open' ? (
                                    <>
                                        <SecondaryButton onClick={() => act(selected, 'dismissed', 'Flag dismissed.')}><FiX size={14} /> Dismiss</SecondaryButton>
                                        {selected.suggestedAnswer !== undefined && selected.suggestedAnswer !== null && selected.suggestedAnswer !== currentAnswer && (
                                            <SecondaryButton onClick={() => accept(selected)}>Use option {letters[selected.suggestedAnswer]}</SecondaryButton>
                                        )}
                                        <PrimaryButton onClick={() => act(selected, 'resolved', 'Flag resolved.')}><FiCheck size={14} /> Resolve</PrimaryButton>
                                    </>
                                ) : (
                                    <SecondaryButton onClick={() => act(selected, 'open', 'Flag reopened.')}><FiCornerUpLeft size={14} /> Reopen</SecondaryButton>
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
