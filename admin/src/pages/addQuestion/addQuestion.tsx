import { useMemo, useState } from 'react'
import { Select as AntSelect, Switch } from 'antd'
import { Interweave } from 'interweave'
import { toast } from 'react-toastify'
import { FiPlus, FiTrash2, FiCheck, FiEye, FiEyeOff, FiCircle, FiCheckCircle, FiRotateCcw } from 'react-icons/fi'
import * as sample from '../../data/sample'
import { useAdmin } from '../../context/admin'
import useLoad from '../../hooks/useLoad'
import RichField from '../../components/richField/richField'
import { SampleNotice } from '../../components/ui/ui'
import { DarkButton, GhostButton, Panel, PanelTitle, Segmented, SegmentedItem, Label, Eyebrow } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, Toolbar, IconButton, DifficultyPill, CourseDot, Muted, Mono } from '../../styles/adminKit'
import * as s from './addQuestion.style'

export const letters = 'ABCDEFGHIJ'.split('')
const MAX_OPTIONS = 6
const years = Array.from({ length : 12 }, (_, index) => new Date().getFullYear() - index)

const blankOptions = () => ['', '', '', '']

const AddQuestion = () => {
    const { added, addQuestion } = useAdmin()
    const programs = useLoad(sample.fetchPrograms)
    const courses = useLoad(sample.fetchCourses)
    const topics = useLoad(sample.fetchTopics)

    const [courseID, setCourseID] = useState<string>()
    const [programIDs, setProgramIDs] = useState<string[]>([])
    const [topic, setTopic] = useState<string>()
    const [difficulty, setDifficulty] = useState<sample.Difficulty>('Medium')
    const [year, setYear] = useState(years[0])
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState<string[]>(blankOptions)
    const [answer, setAnswer] = useState<number>()
    const [explanation, setExplanation] = useState('')
    const [keepContext, setKeepContext] = useState(true)
    const [reveal, setReveal] = useState(true)
    const [attempted, setAttempted] = useState(false)
    const [saving, setSaving] = useState(false)
    // Bumped after a save to remount the Quill editors with empty content
    const [formKey, setFormKey] = useState(0)

    const course = courses.items.find((item) => item.id === courseID)
    const courseTopics = topics.items.filter((item) => item.courseID === courseID)
    const filled = options.filter((option) => option.trim().length > 0)

    const checks = useMemo(() => [
        { label : 'Course selected', ok : Boolean(courseID) },
        { label : 'Question written', ok : question.length > 0 },
        { label : 'At least two options', ok : filled.length >= 2 },
        { label : 'Correct option marked', ok : answer !== undefined && options[answer]?.length > 0 },
    ], [courseID, question, filled.length, answer, options])
    const ready = checks.every((check) => check.ok)

    const chooseCourse = (id : string) => {
        setCourseID(id)
        setTopic(undefined)
        const programID = courses.items.find((item) => item.id === id)?.programID
        if (programID && !programIDs.includes(programID)) setProgramIDs([...programIDs, programID])
    }

    const updateOption = (index : number, value : string) =>
        setOptions((current) => current.map((option, position) => position === index ? value : option))

    const removeOption = (index : number) => {
        setOptions((current) => current.filter((_, position) => position !== index))
        if (answer === index) setAnswer(undefined)
        else if (answer !== undefined && answer > index) setAnswer(answer - 1)
        setFormKey((key) => key + 1)
    }

    const reset = (keep : boolean) => {
        setQuestion('')
        setOptions(blankOptions())
        setAnswer(undefined)
        setExplanation('')
        setAttempted(false)
        if (!keep) {
            setCourseID(undefined)
            setProgramIDs([])
            setTopic(undefined)
            setDifficulty('Medium')
        }
        setFormKey((key) => key + 1)
    }

    const save = async () => {
        setAttempted(true)
        if (!ready || answer === undefined) {
            toast.error('Finish the checklist before saving.')
            return
        }
        setSaving(true)
        const kept = options.filter((option) => option.length > 0)
        const correct = kept.indexOf(options[answer])
        const topicID = topics.items.find((item) => item.courseID === courseID && item.name === topic)?.id
        let live = true
        try {
            await sample.api.post('/questions/add', {
                question,
                possibleAnswers : kept,
                answer : options[answer],
                explanation,
                difficulty,
                year,
                programsID : programIDs,
                coursesID : courseID ? [courseID] : [],
                topicsID : topicID ? [topicID] : [],
                topicName : topicID ? undefined : topic,
            })
        } catch {
            live = false
        }
        addQuestion({
            id : `local-${Date.now()}`, question, options : kept, answer : correct, explanation,
            courseID : courseID ?? '', topic : topic ?? '', difficulty, year,
            author : 'You', addedAt : 'Just now', flags : 0,
        })
        setSaving(false)
        if (live) toast.success('Question saved.')
        else toast.warn("Couldn't reach the API, so the question is kept in this session only.")
        reset(keepContext)
    }

    const invalid = (ok : boolean) => attempted && !ok

    return (
        <Screen>
            <ScreenHeader>
                <div>
                    <ScreenTitle>Add question</ScreenTitle>
                    <ScreenLead>Write the question, mark the correct option and explain it. Students see exactly what the preview shows.</ScreenLead>
                </div>
                <Toolbar>
                    <SampleNotice live={courses.live && topics.live} />
                    {added.length > 0 && <Mono>{added.length} added this session</Mono>}
                </Toolbar>
            </ScreenHeader>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                <div className="flex flex-col gap-4" key={formKey}>
                    <Panel>
                        <PanelTitle>Where it belongs</PanelTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Label as="div">
                                Course
                                <AntSelect
                                    showSearch
                                    placeholder="Choose a course"
                                    value={courseID}
                                    onChange={chooseCourse}
                                    loading={courses.loading}
                                    status={invalid(Boolean(courseID)) ? 'error' : undefined}
                                    optionFilterProp="label"
                                    options={courses.items.map((item) => ({ value : item.id, label : item.code ? `${item.code} · ${item.name}` : item.name }))}
                                />
                            </Label>
                            <Label as="div">
                                Topic
                                <AntSelect
                                    showSearch
                                    allowClear
                                    placeholder={courseID ? 'Choose or type a new topic' : 'Choose a course first'}
                                    disabled={!courseID}
                                    value={topic}
                                    onChange={setTopic}
                                    onSearch={(text) => text && setTopic(text)}
                                    options={[
                                        ...courseTopics.map((item) => ({ value : item.name, label : item.name })),
                                        ...(topic && !courseTopics.some((item) => item.name === topic) ? [{ value : topic, label : `New topic: ${topic}` }] : []),
                                    ]}
                                />
                            </Label>
                            <Label as="div" className="sm:col-span-2">
                                Programs
                                <AntSelect
                                    mode="multiple"
                                    placeholder="Programs that take this course"
                                    value={programIDs}
                                    onChange={setProgramIDs}
                                    optionFilterProp="label"
                                    maxTagCount="responsive"
                                    options={programs.items.map((item) => ({ value : item.id, label : item.name }))}
                                />
                            </Label>
                            <Label as="div">
                                Difficulty
                                <Segmented className="w-fit">
                                    {(['Easy', 'Medium', 'Hard'] as sample.Difficulty[]).map((level) => (
                                        <SegmentedItem key={level} type="button" active={difficulty === level} onClick={() => setDifficulty(level)}>{level}</SegmentedItem>
                                    ))}
                                </Segmented>
                            </Label>
                            <Label as="div">
                                Exam year
                                <AntSelect value={year} onChange={setYear} options={years.map((value) => ({ value, label : String(value) }))} />
                            </Label>
                        </div>
                    </Panel>

                    <Panel>
                        <div className="flex items-center justify-between">
                            <PanelTitle>Question</PanelTitle>
                            <Muted>Select text to format it</Muted>
                        </div>
                        <RichField label="Question" value={question} onChange={setQuestion} minHeight={120}
                            placeholder="e.g. What is the worst-case time complexity of binary search?" invalid={invalid(question.length > 0)} />
                    </Panel>

                    <Panel>
                        <div className="flex items-center justify-between">
                            <PanelTitle>Options</PanelTitle>
                            <Muted>Click a letter to mark the correct one</Muted>
                        </div>
                        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Correct option">
                            {options.map((option, index) => (
                                <s.OptionRow key={index} correct={answer === index}>
                                    <s.LetterButton
                                        type="button"
                                        role="radio"
                                        aria-checked={answer === index}
                                        aria-label={`Mark option ${letters[index]} as correct`}
                                        correct={answer === index}
                                        onClick={() => setAnswer(index)}
                                    >
                                        {answer === index ? <FiCheck size={14} strokeWidth={3} /> : letters[index]}
                                    </s.LetterButton>
                                    <RichField label={`Option ${letters[index]}`} value={option} onChange={(value) => updateOption(index, value)}
                                        placeholder={`Option ${letters[index]}`} />
                                    <IconButton danger type="button" aria-label={`Remove option ${letters[index]}`}
                                        disabled={options.length <= 2} className="disabled:opacity-30 disabled:pointer-events-none"
                                        onClick={() => removeOption(index)}>
                                        <FiTrash2 size={14} />
                                    </IconButton>
                                </s.OptionRow>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <GhostButton type="button" disabled={options.length >= MAX_OPTIONS} className="disabled:opacity-40"
                                onClick={() => setOptions([...options, ''])}>
                                <FiPlus size={14} /> Add option
                            </GhostButton>
                            {invalid(answer !== undefined) && <span className="text-[12px] font-semibold text-[#c2184f]">Mark the correct option</span>}
                        </div>
                    </Panel>

                    <Panel>
                        <div className="flex items-center justify-between">
                            <PanelTitle>Explanation</PanelTitle>
                            <Muted>Optional, but students love it</Muted>
                        </div>
                        <RichField label="Explanation" value={explanation} onChange={setExplanation} minHeight={88}
                            placeholder="Why is the correct option right, and why are the others wrong?" />
                    </Panel>

                    <s.SaveBar>
                        <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer mr-auto">
                            <Switch size="small" checked={keepContext} onChange={setKeepContext} />
                            Keep course and topic for the next question
                        </label>
                        <GhostButton type="button" onClick={() => reset(false)}><FiRotateCcw size={14} /> Clear</GhostButton>
                        <DarkButton type="button" onClick={save} disabled={saving} className="disabled:opacity-60">
                            {saving ? 'Saving…' : 'Save question'}
                        </DarkButton>
                    </s.SaveBar>
                </div>

                <aside className="flex flex-col gap-4 lg:sticky lg:top-[80px]">
                    <s.Preview>
                        <div className="flex items-center justify-between">
                            <Eyebrow>Student preview</Eyebrow>
                            <IconButton type="button" onClick={() => setReveal(!reveal)} aria-label={reveal ? 'Hide answer' : 'Reveal answer'} title={reveal ? 'Hide answer' : 'Reveal answer'}>
                                {reveal ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            </IconButton>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {course ? <s.Chip><CourseDot color={course.color} />{course.code || course.name}</s.Chip> : <s.Chip>No course</s.Chip>}
                            {topic && <s.Chip>{topic}</s.Chip>}
                            <DifficultyPill level={difficulty}>{difficulty}</DifficultyPill>
                            <Mono className="ml-auto">{year}</Mono>
                        </div>
                        <s.PreviewQuestion>
                            {question ? <Interweave content={question} /> : <span className="text-fog">Your question appears here.</span>}
                        </s.PreviewQuestion>
                        <div className="flex flex-col gap-2">
                            {options.map((option, index) => option && (
                                <s.PreviewOption key={index} correct={reveal && answer === index}>
                                    <s.PreviewLetter correct={reveal && answer === index}>{letters[index]}</s.PreviewLetter>
                                    <span className="min-w-0 break-words"><Interweave content={option} /></span>
                                </s.PreviewOption>
                            ))}
                            {filled.length === 0 && <span className="text-[13px] text-fog">Options appear here.</span>}
                        </div>
                        {reveal && explanation && (
                            <s.PreviewExplanation>
                                <span className="font-semibold text-ink">Explanation</span>
                                <Interweave content={explanation} />
                            </s.PreviewExplanation>
                        )}
                    </s.Preview>

                    <Panel>
                        <PanelTitle>Ready to save</PanelTitle>
                        <ul className="flex flex-col gap-2">
                            {checks.map((check) => (
                                <li key={check.label} className={`flex items-center gap-2 text-[13px] ${check.ok ? 'text-ink' : invalid(check.ok) ? 'text-[#c2184f]' : 'text-ash'}`}>
                                    {check.ok ? <FiCheckCircle size={15} className="text-brand-emerald" /> : <FiCircle size={15} />}
                                    {check.label}
                                </li>
                            ))}
                        </ul>
                    </Panel>

                    {added.length > 0 && (
                        <Panel>
                            <PanelTitle>Added this session</PanelTitle>
                            <div className="flex flex-col">
                                {added.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 py-2 border-t border-bone first:border-t-0 first:pt-0">
                                        <CourseDot color={sample.getCourse(item.courseID)?.color ?? '#838383'} />
                                        <span className="text-[13px] truncate flex-1">{sample.plainText(item.question)}</span>
                                        <DifficultyPill level={item.difficulty}>{item.difficulty}</DifficultyPill>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}
                </aside>
            </div>
        </Screen>
    )
}

export default AddQuestion
