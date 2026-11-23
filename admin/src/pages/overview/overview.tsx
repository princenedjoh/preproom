import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiFlag, FiArrowUpRight, FiCheckCircle } from 'react-icons/fi'
import * as sample from '../../data/sample'
import { useAdmin } from '../../context/admin'
import * as api from '../../data/api'
import { Eyebrow, PrimaryButton, SecondaryButton, Panel, PanelTitle, Stat, StatValue, StatLabel, ProgressTrack, ProgressFill, TextLink, Tag } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, Toolbar, TableWrap, Table, Th, Td, Tr, CourseDot, DifficultyLabel, Muted, Mono, issueTone } from '../../styles/adminKit'
import { SampleNotice, SkeletonRows, EmptyState, Skeleton } from '../../components/ui/ui'

const COVERAGE_TARGET = 200

const greeting = () => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

const today = new Date().toLocaleDateString(undefined, { weekday : 'long', day : 'numeric', month : 'long' })

const ActivityChart = ({ values } : { values : number[] }) => {
    const max = Math.max(...values, 1)
    const total = values.reduce((sum, value) => sum + value, 0)
    const thisWeek = values.slice(-7).reduce((sum, value) => sum + value, 0)
    const lastWeek = values.slice(0, 7).reduce((sum, value) => sum + value, 0)
    const change = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0
    const day = (offset : number) => {
        const date = new Date()
        date.setDate(date.getDate() - (values.length - 1 - offset))
        return date.toLocaleDateString(undefined, { weekday : 'short', day : 'numeric' })
    }

    return (
        <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-end gap-6 flex-wrap">
                <div className="flex flex-col">
                    <span className="text-[28px] font-semibold tracking-[-0.03em] text-ink tabular-nums leading-none">{thisWeek}</span>
                    <Muted>this week</Muted>
                </div>
                <span className={`text-[12px] font-medium rounded-[4px] px-[6px] h-[20px] inline-flex items-center ${change >= 0 ? 'bg-tag-green-bg text-tag-green' : 'bg-tag-red-bg text-tag-red'}`}>
                    {change >= 0 ? '+' : ''}{change}% vs last week
                </span>
                <Mono className="ml-auto">{total} in 14 days</Mono>
            </div>
            <div className="flex items-end gap-[6px] flex-1 min-h-[140px]" role="img"
                aria-label={`Questions added per day over the last 14 days: ${values.join(', ')}`}>
                {values.map((value, index) => (
                    <div key={index} className="group relative flex-1 h-full flex items-end" title={`${day(index)}: ${value} questions`}>
                        <div
                            className={`w-full rounded-[4px] transition-[background] duration-150 ${index >= values.length - 7 ? 'bg-accent' : 'bg-ink/10'} group-hover:bg-accent-hover`}
                            style={{ height : `${Math.max(4, (value / max) * 100)}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-between">
                <Mono>{day(0)}</Mono>
                <Mono>{day(values.length - 1)}</Mono>
            </div>
        </div>
    )
}

const Overview = () => {
    const navigate = useNavigate()
    const { flags, openFlags, added, user } = useAdmin()
    const [data, setData] = useState<{ overview : api.Overview, live : boolean }>()

    useEffect(() => { api.fetchOverview().then(setData) }, [])

    const overview = data?.overview
    const loading = !data
    const recent = api.uniqueById([...added, ...(overview?.recentQuestions ?? [])]).slice(0, 6)
    // The API already counts questions saved while live
    const extra = data?.live ? 0 : added.length
    const courses = overview?.courses ?? []
    const queue = flags.filter((flag) => flag.status === 'open').slice(0, 4)
    const resolved = flags.filter((flag) => flag.status === 'resolved').length
    const courseInfo = (id : string) => courses.find((course) => course.id === id) ?? sample.getCourse(id)

    const stats = [
        { label : 'Questions in the bank', value : ((overview?.questions.total ?? 0) + extra).toLocaleString(), note : `+${(overview?.questions.week ?? 0) + extra} this week` },
        { label : 'Courses covered', value : courses.length, note : `${courses.reduce((sum, course) => sum + course.testsThisWeek, 0)} tests taken this week` },
        { label : 'Open flags', value : openFlags, note : openFlags > 0 ? 'Waiting for review' : `${resolved} resolved`, alert : openFlags > 0 },
        { label : 'Learners active', value : overview?.learners.activeThisWeek ?? 0, note : `of ${(overview?.learners.total ?? 0).toLocaleString()} this week` },
    ]

    return (
        <Screen>
            <ScreenHeader>
                <div>
                    <Eyebrow>{today}</Eyebrow>
                    <ScreenTitle className="mt-1">{greeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}</ScreenTitle>
                    <ScreenLead>Here is what changed in the question bank and what needs your attention.</ScreenLead>
                </div>
                <Toolbar>
                    {data && <SampleNotice live={data.live} />}
                    <SecondaryButton onClick={() => navigate('/alerts/flags')}><FiFlag size={14} /> Review flags</SecondaryButton>
                    <PrimaryButton onClick={() => navigate('/addQuestions')}><FiPlus size={14} /> Add question</PrimaryButton>
                </Toolbar>
            </ScreenHeader>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat) => (
                    <Stat key={stat.label}>
                        <StatLabel>{stat.label}</StatLabel>
                        {loading ? <Skeleton height={34} width="40%" /> : <StatValue className="tabular-nums mt-1">{stat.value}</StatValue>}
                        <span className={`text-[12px] mt-1 ${stat.alert ? 'text-tag-red font-semibold' : 'text-ink-3'}`}>{stat.note}</span>
                    </Stat>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Panel className="lg:col-span-2">
                    <PanelTitle>Questions added</PanelTitle>
                    {overview ? <ActivityChart values={overview.weeklyActivity} /> : <Skeleton height={180} />}
                </Panel>
                <Panel>
                    <div className="flex items-center justify-between">
                        <PanelTitle>Flag queue</PanelTitle>
                        <TextLink onClick={() => navigate('/alerts/flags')}>Open <FiArrowUpRight size={14} /></TextLink>
                    </div>
                    {queue.length === 0 ? (
                        <EmptyState icon={FiCheckCircle} title="Queue is clear" body="No open flags right now." />
                    ) : (
                        <div className="flex flex-col">
                            {queue.map((flag) => {
                                const text = flag.question?.question ?? sample.getQuestion(flag.questionID)?.question
                                const code = flag.question?.courseCode ?? sample.getCourse(sample.getQuestion(flag.questionID)?.courseID)?.code
                                return (
                                    <button key={flag.id} onClick={() => navigate(`/alerts/flags?flag=${flag.id}`)}
                                        className="text-left flex flex-col gap-[6px] py-3 px-2 -mx-2 border-t border-line first:border-t-0 rounded-md transition-colors duration-150 hover:bg-ink/[0.04]">
                                        <div className="flex items-center gap-x-2 flex-wrap">
                                            <Tag tone={issueTone(flag.issue)}>{flag.issue}</Tag>
                                            <Mono className="whitespace-nowrap">{code} · {flag.raisedAt}</Mono>
                                        </div>
                                        <span className="text-[13px] text-ink line-clamp-2 leading-[1.45]">{text ? sample.plainText(text) : 'Question removed'}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </Panel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <PanelTitle>Recently added</PanelTitle>
                        <TextLink onClick={() => navigate('/questions')}>Question bank <FiArrowUpRight size={14} /></TextLink>
                    </div>
                    <TableWrap>
                        <Table>
                            <thead><tr><Th>Question</Th><Th>Course</Th><Th className="hidden sm:table-cell">Difficulty</Th><Th className="hidden md:table-cell">Added</Th></tr></thead>
                            <tbody>
                                {loading ? <SkeletonRows columns={4} rows={5} /> : recent.map((question) => {
                                    const course = courseInfo(question.courseID)
                                    return (
                                        <Tr key={question.id} clickable onClick={() => navigate(`/questions?open=${question.id}`)}>
                                            <Td className="max-w-[320px]"><span className="line-clamp-1">{sample.plainText(question.question)}</span></Td>
                                            <Td><span className="inline-flex items-center gap-2 whitespace-nowrap">{course && <CourseDot color={course.color} />}<Mono className="!text-ink">{course?.code ?? '—'}</Mono></span></Td>
                                            <Td className="hidden sm:table-cell"><DifficultyLabel level={question.difficulty} /></Td>
                                            <Td className="hidden md:table-cell whitespace-nowrap"><Muted>{question.addedAt || 'Just now'}</Muted></Td>
                                        </Tr>
                                    )
                                })}
                            </tbody>
                        </Table>
                    </TableWrap>
                </div>
                <Panel>
                    <PanelTitle>Coverage by course</PanelTitle>
                    <Muted className="-mt-2">Target is {COVERAGE_TARGET} questions per course.</Muted>
                    <div className="flex flex-col gap-4">
                        {[...courses].sort((a, b) => a.total - b.total).map((course) => (
                            <div key={course.id} className="flex flex-col gap-[6px]">
                                <div className="flex items-center justify-between gap-2 text-[13px]">
                                    <span className="flex items-center gap-2 min-w-0"><CourseDot color={course.color} /><span className="truncate font-medium">{course.name}</span></span>
                                    <Mono className="tabular-nums">{course.total}</Mono>
                                </div>
                                <ProgressTrack>
                                    <ProgressFill value={(course.total / COVERAGE_TARGET) * 100} color={course.total < COVERAGE_TARGET / 4 ? 'rgb(var(--tag-red))' : undefined} />
                                </ProgressTrack>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </Screen>
    )
}

export default Overview
