import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Switch } from 'antd'
import * as testConfigStyle from './testConfig.style'
import * as kit from '../../../../styles/kit'
import { Difficulty, Question } from '../../../../data/sample'
import { getCourse, useCatalog, fetchQuestions, fetchPapers } from '../../../../data/catalog'
import TestHistory from '../../../../components/testHistory/testHistory'
import SegmentedControl from '../../../../components/UI/segmented/segmented'
import { RiCheckboxMultipleFill } from "react-icons/ri";
import { GiPapers } from "react-icons/gi";
import { HiTrophy } from "react-icons/hi2";
import { FiArrowRight, FiClock } from "react-icons/fi";

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
    { id : 'mcqs', icon : RiCheckboxMultipleFill, title : 'Practice test', text : 'A random mix of questions from the topics you pick.' },
    { id : 'paper', icon : GiPapers, title : 'Past paper', text : 'Sit a full paper exactly as it was set.' },
    { id : 'challenge', icon : HiTrophy, title : 'Challenge', text : 'Short, hard and ranked against other students.' },
]

const counts = [5, 10, 20, 30]
const durations = [10, 20, 30, 45]
const difficulties : TestConfigState['difficulty'][] = ['Mixed', 'Easy', 'Medium', 'Hard']

const TestConfig = () => {

    const navigate = useNavigate()
    const incoming = (useLocation().state ?? {}) as Partial<TestConfigState>

    const { courses } = useCatalog()
    const [config, setConfig] = useState<TestConfigState>({
        courseID : getCourse(incoming.courseID).id,
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
        <kit.Page>
            <kit.PageInner className='gap-10'>
                <div className='flex flex-col gap-2'>
                    <kit.Eyebrow>Test</kit.Eyebrow>
                    <kit.PageTitle>Set up a test</kit.PageTitle>
                    <kit.Body>Pick a course and the rules. The clock starts when you press Start.</kit.Body>
                </div>

                <testConfigStyle.Layout>
                    <div className='flex flex-col gap-8 min-w-0'>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                            {
                                modes.map((mode) => (
                                    <testConfigStyle.Mode 
                                        key={mode.id}
                                        type='button'
                                        active={config.mode === mode.id}
                                        onClick={()=>chooseMode(mode.id)}
                                        aria-pressed={config.mode === mode.id}
                                    >
                                        <kit.IconTile><mode.icon size={17}/></kit.IconTile>
                                        <span className='text-[15px] font-bold text-ink pt-1'>{mode.title}</span>
                                        <span className='text-[13px] leading-[1.5] text-muted'>{mode.text}</span>
                                    </testConfigStyle.Mode>
                                ))
                            }
                        </div>

                        <testConfigStyle.Field>
                            <testConfigStyle.FieldLabel>Course</testConfigStyle.FieldLabel>
                            <div className='flex flex-wrap gap-2'>
                                {
                                    courses.map((item) => (
                                        <kit.FilterChip key={item.id} type='button' active={config.courseID === item.id} onClick={()=>update({ courseID : item.id })}>
                                            <span className='w-[8px] h-[8px] rounded-[3px]' style={{ background : item.color }}/>
                                            {item.name}
                                        </kit.FilterChip>
                                    ))
                                }
                            </div>
                        </testConfigStyle.Field>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {
                                isPaper ?
                                <testConfigStyle.Field>
                                    <testConfigStyle.FieldLabel>Paper</testConfigStyle.FieldLabel>
                                    <SegmentedControl aria-label='Paper year' value={year} onChange={(value)=>update({ year : value })} options={years}/>
                                </testConfigStyle.Field>
                                :
                                <testConfigStyle.Field>
                                    <testConfigStyle.FieldLabel>Questions</testConfigStyle.FieldLabel>
                                    {
                                        isChallenge ? <span className='text-[14px] text-muted h-[38px] flex items-center'>5 questions, fixed for challenges</span>
                                        : <SegmentedControl aria-label='Questions' value={config.count} onChange={(count)=>update({ count })} options={counts}/>
                                    }
                                </testConfigStyle.Field>
                            }
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Time limit</testConfigStyle.FieldLabel>
                                {
                                    isChallenge ? <span className='text-[14px] text-muted h-[38px] flex items-center'>10 minutes</span>
                                    : <SegmentedControl aria-label='Time limit' value={config.minutes} onChange={(minutes)=>update({ minutes })} options={durations.map((minutes) => ({ value : minutes, label : `${minutes} min` }))}/>
                                }
                            </testConfigStyle.Field>
                            {
                                !isPaper && !isChallenge &&
                                <testConfigStyle.Field>
                                    <testConfigStyle.FieldLabel>Difficulty</testConfigStyle.FieldLabel>
                                    <SegmentedControl aria-label='Difficulty' value={config.difficulty} onChange={(difficulty)=>update({ difficulty })} options={difficulties}/>
                                </testConfigStyle.Field>
                            }
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Feedback</testConfigStyle.FieldLabel>
                                <label className='flex items-center gap-3 text-[14px] text-muted h-[38px]'>
                                    <Switch size='small' checked={config.instantFeedback} onChange={(instantFeedback)=>update({ instantFeedback })}/>
                                    Show if each answer is right as I go
                                </label>
                            </testConfigStyle.Field>
                        </div>
                    </div>

                    <testConfigStyle.Summary>
                        <div className='flex flex-col gap-1'>
                            <kit.Eyebrow>Summary</kit.Eyebrow>
                            <kit.Title>{course.name}</kit.Title>
                        </div>
                        <div className='flex flex-col gap-3'>
                            <testConfigStyle.SummaryRow>Mode <b>{modes.find((mode) => mode.id === config.mode)?.title}</b></testConfigStyle.SummaryRow>
                            {isPaper && <testConfigStyle.SummaryRow>Paper <b>{year}</b></testConfigStyle.SummaryRow>}
                            <testConfigStyle.SummaryRow>Questions <b className='tabular-nums'>{inCourse ? asked : '–'}</b></testConfigStyle.SummaryRow>
                            <testConfigStyle.SummaryRow>Time limit <b>{config.minutes} minutes</b></testConfigStyle.SummaryRow>
                            {!isPaper && <testConfigStyle.SummaryRow>Difficulty <b>{config.difficulty}</b></testConfigStyle.SummaryRow>}
                            {
                                inCourse && !isPaper && asked < config.count &&
                                <span className='text-[12px] leading-[1.5] text-[#b5651d] bg-[#fff6ec] rounded-[8px] px-3 py-2'>
                                    Only {asked} {config.difficulty === 'Mixed' ? '' : `${config.difficulty.toLowerCase()} `}question{asked === 1 ? ' is' : 's are'} available for {course.name}, so the test will use {asked === 1 ? 'it' : 'all of them'}.
                                </span>
                            }
                        </div>
                        <span className='conic-border w-full'>
                            <kit.DarkButton type='button' className='w-full' disabled={!inCourse || available === 0} onClick={start}>
                                Start test <FiArrowRight size={16}/>
                            </kit.DarkButton>
                        </span>
                        <span className='flex items-center gap-2 text-[12px] text-ash'>
                            <FiClock size={12}/> You can flag questions and come back to them before submitting.
                        </span>
                    </testConfigStyle.Summary>
                </testConfigStyle.Layout>

                <div className='flex flex-col gap-4'>
                    <kit.Title>Test history</kit.Title>
                    <TestHistory/>
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default TestConfig
