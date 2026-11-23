import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { Interweave } from 'interweave'
import { toast } from 'react-toastify'
import { FiSearch, FiPlus, FiFlag, FiX, FiTrash2, FiDatabase } from 'react-icons/fi'
import * as sample from '../../data/sample'
import * as api from '../../data/api'
import { useAdmin } from '../../context/admin'
import useLoad from '../../hooks/useLoad'
import { SampleNotice, SkeletonRows, EmptyState, Dialog } from '../../components/ui/ui'
import { DarkButton, GhostButton, FilterChip, Segmented, SegmentedItem, Eyebrow } from '../../styles/kit'
import {
    Screen, ScreenHeader, ScreenTitle, ScreenLead, Toolbar, SearchField, Select, TableWrap, Table, Th, Td, Tr,
    CourseDot, DifficultyPill, Muted, Mono, IconButton,
} from '../../styles/adminKit'
import { letters } from '../addQuestion/addQuestion'
import * as preview from '../addQuestion/addQuestion.style'

const slideIn = keyframes` from { transform : translateX(24px); opacity : 0; } to { transform : none; opacity : 1; } `

const Drawer = styled.aside.attrs({
    className : `Drawer fixed top-0 right-0 bottom-0 z-[1250] w-full sm:w-[460px] flex flex-col` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    border-left : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    box-shadow : ${({theme}) => theme.shadows.screenshot};
    animation : ${slideIn} 280ms cubic-bezier(0.32, 0.72, 0, 1);
    @media (prefers-reduced-motion : reduce) { animation : none; }
`

type DifficultyFilter = 'All' | sample.Difficulty

const QuestionBank = () => {
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const { added, flags, inScope } = useAdmin()
    const courses = useLoad(api.fetchCourses)

    const [query, setQuery] = useState(params.get('q') ?? '')
    const [search, setSearch] = useState(query)
    const [courseID, setCourseID] = useState('all')
    const [difficulty, setDifficulty] = useState<DifficultyFilter>('All')
    const [flaggedOnly, setFlaggedOnly] = useState(false)
    const [confirming, setConfirming] = useState<sample.Question>()
    const [page, setPage] = useState<api.QuestionPage>()
    const [loadingMore, setLoadingMore] = useState(false)
    const [fetched, setFetched] = useState<sample.Question>()

    useEffect(() => { setQuery(params.get('q') ?? '') }, [params])

    // Debounce typing before asking the server
    useEffect(() => {
        const timer = setTimeout(() => setSearch(query.trim()), 250)
        return () => clearTimeout(timer)
    }, [query])

    const filters : api.QuestionQuery = {
        search, courseID : courseID === 'all' ? undefined : courseID,
        difficulty : difficulty === 'All' ? undefined : difficulty, flagged : flaggedOnly || undefined,
    }

    useEffect(() => {
        let cancelled = false
        setPage(undefined)
        api.fetchQuestionPage(filters).then((result) => !cancelled && setPage(result))
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, courseID, difficulty, flaggedOnly])

    const loadMore = async () => {
        if (!page) return
        setLoadingMore(true)
        const more = await api.fetchQuestionPage({ ...filters, offset : page.items.length })
        setPage({ ...page, items : api.uniqueById([...page.items, ...more.items]) })
        setLoadingMore(false)
    }

    const openFlagsFor = (question : sample.Question) => {
        const counted = flags.filter((flag) => flag.questionID === question.id && flag.status === 'open').length
        return flags.length ? counted : question.flags
    }

    const filtersOnNow = Boolean(search) || courseID !== 'all' || difficulty !== 'All' || flaggedOnly
    // Questions saved this session only show while the list is unfiltered
    const results = api.uniqueById([...(filtersOnNow ? [] : added), ...(page?.items ?? [])])
    const total = (page?.total ?? 0) + (page?.live ? 0 : filtersOnNow ? 0 : added.length)

    const openID = params.get('open')
    const open = results.find((question) => question.id === openID) ?? (fetched?.id === openID ? fetched : undefined)
    const setOpen = (id? : string) => {
        const next = new URLSearchParams(params)
        if (id) next.set('open', id)
        else next.delete('open')
        setParams(next, { replace : true })
    }

    // Deep links can point at a question that isn't on the loaded page
    useEffect(() => {
        if (!openID || !page?.live || results.some((question) => question.id === openID)) return
        api.fetchQuestion(openID).then(setFetched).catch(() => toast.error('That question no longer exists.'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openID, page?.live])

    useEffect(() => {
        if (!open) return
        const onKey = (event : KeyboardEvent) => event.key === 'Escape' && setOpen()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    })

    const remove = async (question : sample.Question) => {
        setConfirming(undefined)
        try {
            if (page?.live && !question.id.startsWith('local-')) await api.deleteQuestion(question.id)
        } catch (error) {
            if (!api.isOffline(error)) return void toast.error(api.errorMessage(error))
        }
        setOpen()
        setPage((current) => current && { ...current, items : current.items.filter((item) => item.id !== question.id), total : current.total - 1 })
        toast.success('Question deleted.')
    }

    const filtersOn = filtersOnNow || Boolean(query)
    const clearFilters = () => {
        setQuery('')
        setCourseID('all')
        setDifficulty('All')
        setFlaggedOnly(false)
        setParams({}, { replace : true })
    }

    const course = (id : string) => courses.items.find((item) => item.id === id) ?? sample.getCourse(id)

    return (
        <Screen>
            <ScreenHeader>
                <div>
                    <ScreenTitle>Question bank</ScreenTitle>
                    <ScreenLead>Every question students can practise. Open one to check it against its flags or remove it.</ScreenLead>
                </div>
                <Toolbar>
                    {page && <SampleNotice live={page.live} />}
                    <DarkButton onClick={() => navigate('/addQuestions')}><FiPlus size={14} /> Add question</DarkButton>
                </Toolbar>
            </ScreenHeader>

            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <SearchField>
                    <FiSearch size={14} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search text, topic or author" aria-label="Search questions" />
                </SearchField>
                <Select value={courseID} onChange={(event) => setCourseID(event.target.value)} aria-label="Filter by course">
                    <option value="all">All courses</option>
                    {courses.items.filter((item) => inScope(item.id)).map((item) => <option key={item.id} value={item.id}>{item.code || item.name}</option>)}
                </Select>
                <Segmented>
                    {(['All', 'Easy', 'Medium', 'Hard'] as DifficultyFilter[]).map((level) => (
                        <SegmentedItem key={level} active={difficulty === level} onClick={() => setDifficulty(level)}>{level}</SegmentedItem>
                    ))}
                </Segmented>
                <FilterChip active={flaggedOnly} onClick={() => setFlaggedOnly(!flaggedOnly)}><FiFlag size={12} /> Flagged</FilterChip>
                <Mono className="lg:ml-auto tabular-nums">{page ? `${results.length} of ${total}` : '…'}</Mono>
            </div>

            <TableWrap className="max-h-[calc(100vh-260px)] overflow-y-auto">
                <Table>
                    <thead className="sticky top-0 z-[1]">
                        <tr>
                            <Th>Question</Th><Th>Course</Th><Th className="hidden md:table-cell">Topic</Th>
                            <Th className="hidden sm:table-cell">Difficulty</Th><Th className="text-right">Flags</Th>
                            <Th className="hidden lg:table-cell">Author</Th><Th className="hidden lg:table-cell">Added</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {!page ? <SkeletonRows columns={7} /> : results.map((question) => {
                            const info = course(question.courseID)
                            const count = openFlagsFor(question)
                            return (
                                <Tr key={question.id} clickable onClick={() => setOpen(question.id)} aria-selected={question.id === openID}
                                    className={question.id === openID ? '!bg-mist' : ''}>
                                    <Td className="max-w-[360px]"><span className="line-clamp-1">{sample.plainText(question.question)}</span></Td>
                                    <Td><span className="inline-flex items-center gap-2 whitespace-nowrap">{info && <CourseDot color={info.color} />}<Mono className="!text-ink">{info?.code || info?.name || '—'}</Mono></span></Td>
                                    <Td className="hidden md:table-cell whitespace-nowrap"><Muted>{question.topic || '—'}</Muted></Td>
                                    <Td className="hidden sm:table-cell"><DifficultyPill level={question.difficulty}>{question.difficulty}</DifficultyPill></Td>
                                    <Td className="text-right tabular-nums">{count > 0 ? <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#c2184f]"><FiFlag size={12} />{count}</span> : <Muted>0</Muted>}</Td>
                                    <Td className="hidden lg:table-cell whitespace-nowrap"><Muted>{question.author}</Muted></Td>
                                    <Td className="hidden lg:table-cell whitespace-nowrap"><Muted>{question.addedAt || '—'}</Muted></Td>
                                </Tr>
                            )
                        })}
                    </tbody>
                </Table>
                {page?.error && <div className="p-4"><EmptyState icon={FiDatabase} title="Couldn’t load questions" body={page.error} /></div>}
                {page && !page.error && results.length === 0 && (
                    <div className="p-4">
                        <EmptyState
                            icon={FiDatabase}
                            title={filtersOn ? 'No questions match' : 'No questions yet'}
                            body={filtersOn ? 'Try a different search or clear the filters.' : 'Questions you add show up here.'}
                            action={filtersOn
                                ? <GhostButton onClick={clearFilters}>Clear filters</GhostButton>
                                : <DarkButton onClick={() => navigate('/addQuestions')}><FiPlus size={14} /> Add question</DarkButton>}
                        />
                    </div>
                )}
            </TableWrap>
            {page && results.length < total && (
                <div className="flex justify-center">
                    <GhostButton onClick={loadMore} disabled={loadingMore} className="disabled:opacity-50">
                        {loadingMore ? 'Loading…' : `Load ${Math.min(api.PAGE_SIZE, total - results.length)} more`}
                    </GhostButton>
                </div>
            )}

            {open && (
                <>
                    <div className="fixed inset-0 z-[1240] bg-[rgba(9,12,29,0.16)]" onClick={() => setOpen()} />
                    <Drawer role="dialog" aria-label="Question details">
                        <div className="flex items-center justify-between gap-2 h-[56px] px-5 border-b border-bone shrink-0">
                            <Mono>#{open.id}</Mono>
                            <div className="flex items-center gap-1">
                                <IconButton danger aria-label="Delete question" title="Delete question" onClick={() => setConfirming(open)}><FiTrash2 size={15} /></IconButton>
                                <IconButton aria-label="Close" onClick={() => setOpen()}><FiX size={16} /></IconButton>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                            <div className="flex flex-wrap items-center gap-2">
                                {course(open.courseID) && <preview.Chip><CourseDot color={course(open.courseID)!.color} />{course(open.courseID)!.code || course(open.courseID)!.name}</preview.Chip>}
                                {open.topic && <preview.Chip>{open.topic}</preview.Chip>}
                                <DifficultyPill level={open.difficulty}>{open.difficulty}</DifficultyPill>
                                <Mono className="ml-auto">{open.year}</Mono>
                            </div>
                            <preview.PreviewQuestion><Interweave content={open.question} /></preview.PreviewQuestion>
                            <div className="flex flex-col gap-2">
                                {open.options.map((option, index) => (
                                    <preview.PreviewOption key={index} correct={open.answer === index}>
                                        <preview.PreviewLetter correct={open.answer === index}>{letters[index]}</preview.PreviewLetter>
                                        <span className="min-w-0 break-words"><Interweave content={option} /></span>
                                    </preview.PreviewOption>
                                ))}
                            </div>
                            {open.explanation && (
                                <preview.PreviewExplanation>
                                    <span className="font-semibold text-ink">Explanation</span>
                                    <Interweave content={open.explanation} />
                                </preview.PreviewExplanation>
                            )}
                            <div className="flex flex-col gap-2">
                                <Eyebrow>Flags</Eyebrow>
                                {flags.filter((flag) => flag.questionID === open.id).length === 0 ? <Muted>No one has flagged this question.</Muted> :
                                    flags.filter((flag) => flag.questionID === open.id).map((flag) => (
                                        <button key={flag.id} onClick={() => navigate(`/alerts/flags?flag=${flag.id}`)}
                                            className="text-left flex flex-col gap-1 p-3 rounded-[10px] border border-bone transition-colors duration-150 hover:bg-mist">
                                            <span className="flex items-center gap-2 text-[12px]">
                                                <span className="font-semibold text-ink">{flag.issue}</span>
                                                <Mono>· {flag.reporter} · {flag.status}</Mono>
                                            </span>
                                            <span className="text-[13px] text-muted line-clamp-2">{flag.comment}</span>
                                        </button>
                                    ))}
                            </div>
                            <Muted>Added by {open.author}{open.addedAt ? ` · ${open.addedAt}` : ''}</Muted>
                        </div>
                    </Drawer>
                </>
            )}

            <Dialog
                open={Boolean(confirming)}
                title="Delete this question?"
                description="Students will no longer see it, and its flags are closed. This can't be undone."
                onClose={() => setConfirming(undefined)}
                footer={<>
                    <GhostButton onClick={() => setConfirming(undefined)}>Cancel</GhostButton>
                    <DarkButton className="!bg-[#c2184f]" onClick={() => confirming && remove(confirming)}>Delete question</DarkButton>
                </>}
            >
                <span className="text-[14px] text-ink line-clamp-3">{confirming && sample.plainText(confirming.question)}</span>
            </Dialog>
        </Screen>
    )
}

export default QuestionBank
