import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Switch } from 'antd'
import * as testConfigStyle from './testConfig.style'
import * as kit from '../../../../styles/kit'
import { Difficulty, Question } from '../../../../data/sample'
import { getCourse, useCatalog, fetchQuestions, fetchPapers } from '../../../../data/catalog'
import TestHistory from '../../../../components/testHistory/testHistory'
import SegmentedControl from '../../../../components/UI/segmented/segmented'
import CourseIcon from '../../../../components/courseIcon/courseIcon'
import { useStudy, orderCourses, getStudy } from '../../../../store/study'
import { PageHero } from '../../../../components/premium/premium'
import { useProgress } from '../../../../store/progress'
import { FiArrowRight, FiFlag, FiLayers, FiFileText, FiZap, FiAlertCircle, FiClock } from "react-icons/fi";

export interface TestConfigState {
    courseID : string
    mode : string
    count : number
    minutes : number
    difficulty : 'Mixed' | Difficulty
    instantFeedback : boolean
    year? : number
}

const modes = [
    { id : 'mcqs', icon : FiLayers, tone : 'blue', title : 'Practice test', text : 'A fresh mix at the difficulty you choose.' },
    { id : 'paper', icon : FiFileText, tone : 'brown', title : 'Past paper', text : 'Sit a whole paper exactly as it was set.' },
    { id : 'challenge', icon : FiZap, tone : 'yellow', title : 'Challenge', text : 'Five questions, ranked against everyone.' },
]

const perQuestion = (seconds : number) => seconds < 90 ? `${Math.round(seconds)}s` : `${Math.floor(seconds / 60)}m${Math.round(seconds % 60) ? ` ${Math.round(seconds % 60)}s` : ''}`

const counts = [5, 10, 20, 30]
const durations = [10, 20, 30, 45]
const difficulties : TestConfigState['difficulty'][] = ['Mixed', 'Easy', 'Medium', 'Hard']

const TestConfig = () => {

    const navigate = useNavigate()
    const incoming = (useLocation().state ?? {}) as Partial<TestConfigState>

    const catalog = useCatalog()
    const state = useProgress()
    const courses = orderCourses(catalog.courses, useStudy().courses)
    const [config, setConfig] = useState<TestConfigState>({
        courseID : getCourse(incoming.courseID ?? getStudy().courses[0]).id,
        mode : 'mcqs',
        count : 10,
        minutes : 20,
        difficulty : 'Mixed',
        instantFeedback : false,
    })
    const [inCourse, setInCourse] = useState<Question[] | null>(null)
    const [years, setYears] = useState<number[]>([])

    useEffect(()=>{
        let active = true
        setInCourse(null)
        Promise.all([fetchQuestions(config.courseID), fetchPapers(config.courseID)]).then(([questions, papers]) => {
            if(!active) return
            setInCourse(questions)
            setYears(papers.length ? papers : Array.from(new Set(questions.map((question) => question.year))).sort((a, b) => b - a))
        })
        return () => { active = false }
    },[config.courseID])

    const update = (patch : Partial<TestConfigState>) => setConfig((previous) => ({ ...previous, ...patch }))
    const course = getCourse(config.courseID)
    const year = config.year && years.includes(config.year) ? config.year : years[0]
    const isPaper = config.mode === 'paper'
    const isChallenge = config.mode === 'challenge'

    // What will actually be asked, so the summary never over-promises
    const loaded = inCourse ?? []
    const pool = isPaper ? loaded.filter((question) => question.year === year)
        : config.difficulty === 'Mixed' ? loaded : loaded.filter((question) => question.difficulty === config.difficulty)
    const available = pool.length || loaded.length
    const asked = isPaper ? available : Math.min(config.count, available)

    const chooseMode = (mode : string) => {
        if(mode === 'challenge') update({ mode, count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false })
        else if(mode === 'paper') update({ mode, difficulty : 'Mixed' })
        else update({ mode })
    }

    const start = () => {
        const final : TestConfigState = isPaper ? { ...config, year, count : available } : { ...config, year : undefined }
        navigate('/test/session', { state : final })
    }

    return (
        <main className='w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-10 md:pt-14 pb-24 flex flex-col gap-10'>
                <PageHero
                    tone='accent'
                    eyebrow={<><FiClock size={13}/> Exam conditions</>}
                    title='Tests'
                    sub='Pick a course and the rules. The clock starts when you press Start, and you can flag questions to come back to.'
                    right={
                        <div className='flex items-center gap-px rounded-xl overflow-hidden border border-line bg-line shadow-card shrink-0'>
                            {[
                                ['Taken', String(state.tests.length)],
                                ['Average', state.tests.length ? `${Math.round(state.tests.reduce((sum, run) => sum + (run.total ? run.score / run.total : 0), 0) / state.tests.length * 100)}%` : '—'],
                                ['Best', state.tests.length ? `${Math.max(...state.tests.map((run) => run.total ? Math.round(run.score / run.total * 100) : 0))}%` : '—'],
                            ].map(([label, value]) => (
                                <div key={label} className='bg-surface px-5 py-3 flex flex-col gap-1 min-w-[96px]'>
                                    <span className='text-[12px] text-ink-3'>{label}</span>
                                    <span className='text-[22px] font-semibold tracking-[-0.03em] text-ink tabular-nums leading-none'>{value}</span>
                                </div>
                            ))}
                        </div>
                    }
                />

                <testConfigStyle.Layout>
                    <div className='flex flex-col gap-6 min-w-0'>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3' role='radiogroup' aria-label='Kind of test'>
                            {
                                modes.map((mode) => (
                                    <testConfigStyle.Mode
                                        key={mode.id}
                                        type='button'
                                        role='radio'
                                        active={config.mode === mode.id}
                                        onClick={()=>chooseMode(mode.id)}
                                        aria-checked={config.mode === mode.id}
                                    >
                                        <kit.IconTile tone={mode.tone as kit.Tone} className='relative !w-11 !h-11 !rounded-lg'><mode.icon size={19}/></kit.IconTile>
                                        <span className='relative text-[16px] font-semibold tracking-[-0.01em] text-ink pt-2'>{mode.title}</span>
                                        <span className='relative text-[13px] leading-[1.5] text-ink-3'>{mode.text}</span>
                                    </testConfigStyle.Mode>
                                ))
                            }
                        </div>

                        <div className='flex flex-col rounded-xl border border-line bg-surface shadow-card px-5'>
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Course</testConfigStyle.FieldLabel>
                                <div className='flex flex-wrap gap-[6px]'>
                                    {
                                        courses.map((item) => (
                                            <kit.FilterChip key={item.id} type='button' className='!pl-[5px]' active={config.courseID === item.id} aria-pressed={config.courseID === item.id} onClick={()=>update({ courseID : item.id })}>
                                                <CourseIcon course={item} size={20}/>
                                                {item.name}
                                            </kit.FilterChip>
                                        ))
                                    }
                                </div>
                            </testConfigStyle.Field>
                            {
                                isPaper ?
                                <testConfigStyle.Field>
                                    <testConfigStyle.FieldLabel>Paper</testConfigStyle.FieldLabel>
                                    <div><SegmentedControl aria-label='Paper year' value={year} onChange={(value)=>update({ year : value })} options={years}/></div>
                                </testConfigStyle.Field>
                                :
                                <testConfigStyle.Field>
                                    <testConfigStyle.FieldLabel>Questions</testConfigStyle.FieldLabel>
                                    {
                                        isChallenge ? <span className='text-[14px] text-ink-2'>5, fixed for challenges</span>
                                        : <div><SegmentedControl aria-label='Questions' value={config.count} onChange={(count)=>update({ count })} options={counts}/></div>
                                    }
                                </testConfigStyle.Field>
                            }
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Time limit</testConfigStyle.FieldLabel>
                                {
                                    isChallenge ? <span className='text-[14px] text-ink-2'>10 minutes</span>
                                    : <div><SegmentedControl aria-label='Time limit' value={config.minutes} onChange={(minutes)=>update({ minutes })} options={durations.map((minutes) => ({ value : minutes, label : `${minutes} min` }))}/></div>
                                }
                            </testConfigStyle.Field>
                            {
                                !isPaper && !isChallenge &&
                                <testConfigStyle.Field>
                                    <testConfigStyle.FieldLabel>Difficulty</testConfigStyle.FieldLabel>
                                    <div><SegmentedControl aria-label='Difficulty' value={config.difficulty} onChange={(difficulty)=>update({ difficulty })} options={difficulties}/></div>
                                </testConfigStyle.Field>
                            }
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Feedback</testConfigStyle.FieldLabel>
                                <label className='flex items-center gap-3 text-[14px] text-ink-2 cursor-pointer'>
                                    <Switch size='small' checked={config.instantFeedback} disabled={isChallenge} onChange={(instantFeedback)=>update({ instantFeedback })}/>
                                    Show whether each answer is right as I go
                                </label>
                            </testConfigStyle.Field>
                        </div>
                    </div>

                    <testConfigStyle.Summary>
                        <div className='flex items-center gap-3'>
                            <CourseIcon course={course} size={36}/>
                            <div className='flex flex-col min-w-0'>
                                <span className='text-[15px] font-medium text-ink truncate'>{course.name}</span>
                                <span className='text-[12px] text-ink-3'>{modes.find((mode) => mode.id === config.mode)?.title}{isPaper && year ? ` · ${year}` : ''}</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-3 rounded-md bg-subtle py-3'>
                            {[
                                { label : 'Questions', value : inCourse ? asked : '–' },
                                { label : 'Minutes', value : config.minutes },
                                { label : 'Per question', value : inCourse && asked ? perQuestion(config.minutes * 60 / asked) : '–' },
                            ].map((item, index) => (
                                <div key={item.label} className={`flex flex-col items-center gap-[2px] ${index ? 'border-l border-line' : ''}`}>
                                    <span className='text-[20px] font-semibold tracking-[-0.03em] text-ink tabular-nums'>{item.value}</span>
                                    <span className='text-[11px] text-ink-3'>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        {
                            inCourse && !isPaper && asked < config.count &&
                            <span className='flex gap-2 text-[12px] leading-[1.5] text-medium bg-medium/10 border border-medium/20 rounded-md px-3 py-2'>
                                <FiAlertCircle size={14} className='shrink-0 mt-[1px]'/>
                                <span>Only {asked} {config.difficulty === 'Mixed' ? '' : `${config.difficulty.toLowerCase()} `}question{asked === 1 ? ' is' : 's are'} available for {course.name}, so the test uses {asked === 1 ? 'it' : 'all of them'}.</span>
                            </span>
                        }
                        <kit.PrimaryButton type='button' className='w-full !h-10' disabled={!inCourse || available === 0} onClick={start}>
                            Start test <FiArrowRight size={15}/>
                        </kit.PrimaryButton>
                        <span className='flex items-start gap-2 text-[12px] leading-[1.5] text-ink-3'>
                            <FiFlag size={12} className='mt-[3px] shrink-0'/> Flag questions and come back to them before you submit.
                        </span>
                    </testConfigStyle.Summary>
                </testConfigStyle.Layout>

                <section className='flex flex-col gap-4'>
                    <h2 className='text-[20px] font-semibold tracking-[-0.02em] text-ink'>History</h2>
                    <TestHistory/>
                </section>
        </main>
    )
}

export default TestConfig
