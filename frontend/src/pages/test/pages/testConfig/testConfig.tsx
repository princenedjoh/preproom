import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Switch } from 'antd'
import * as testConfigStyle from './testConfig.style'
import * as kit from '../../../../styles/kit'
import { courses, getCourse, testHistory, Difficulty } from '../../../../data/sample'
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

    const [config, setConfig] = useState<TestConfigState>({
        courseID : incoming.courseID ?? courses[0].id,
        mode : 'mcqs',
        count : 10,
        minutes : 20,
        difficulty : 'Mixed',
        instantFeedback : false,
    })
    const update = (patch : Partial<TestConfigState>) => setConfig({ ...config, ...patch })
    const course = getCourse(config.courseID)

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
                                        onClick={()=>update({ mode : mode.id })}
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
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Questions</testConfigStyle.FieldLabel>
                                <kit.Segmented>
                                    {
                                        counts.map((count) => (
                                            <kit.SegmentedItem key={count} type='button' active={config.count === count} onClick={()=>update({ count })}>
                                                {count}
                                            </kit.SegmentedItem>
                                        ))
                                    }
                                </kit.Segmented>
                            </testConfigStyle.Field>
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Time limit</testConfigStyle.FieldLabel>
                                <kit.Segmented>
                                    {
                                        durations.map((minutes) => (
                                            <kit.SegmentedItem key={minutes} type='button' active={config.minutes === minutes} onClick={()=>update({ minutes })}>
                                                {minutes} min
                                            </kit.SegmentedItem>
                                        ))
                                    }
                                </kit.Segmented>
                            </testConfigStyle.Field>
                            <testConfigStyle.Field>
                                <testConfigStyle.FieldLabel>Difficulty</testConfigStyle.FieldLabel>
                                <kit.Segmented>
                                    {
                                        difficulties.map((difficulty) => (
                                            <kit.SegmentedItem key={difficulty} type='button' active={config.difficulty === difficulty} onClick={()=>update({ difficulty })}>
                                                {difficulty}
                                            </kit.SegmentedItem>
                                        ))
                                    }
                                </kit.Segmented>
                            </testConfigStyle.Field>
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
                            <testConfigStyle.SummaryRow>Questions <b>{config.count}</b></testConfigStyle.SummaryRow>
                            <testConfigStyle.SummaryRow>Time limit <b>{config.minutes} minutes</b></testConfigStyle.SummaryRow>
                            <testConfigStyle.SummaryRow>Difficulty <b>{config.difficulty}</b></testConfigStyle.SummaryRow>
                        </div>
                        <span className='conic-border w-full'>
                            <kit.DarkButton type='button' className='w-full' onClick={()=>navigate('/test/session', { state : config })}>
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
                    <testConfigStyle.Table>
                        <testConfigStyle.TableRow head>
                            <span>Test</span>
                            <span className='hidden md:block'>Date</span>
                            <span className='hidden md:block'>Score</span>
                            <span className='hidden md:block'>Time</span>
                            <span/>
                        </testConfigStyle.TableRow>
                        {
                            testHistory.map((record) => {
                                const percent = Math.round(record.score / record.total * 100)
                                const recordCourse = getCourse(record.courseID)
                                return (
                                    <testConfigStyle.TableRow key={record.id}>
                                        <div className='flex flex-col min-w-0'>
                                            <span className='font-semibold truncate'>{record.title}</span>
                                            <span className='text-[12px] text-ash truncate'>
                                                {recordCourse.code} · <span className='md:hidden'>{record.date} · {record.score}/{record.total}</span><span className='hidden md:inline'>{recordCourse.name}</span>
                                            </span>
                                        </div>
                                        <span className='hidden md:block text-muted'>{record.date}</span>
                                        <span className='hidden md:flex items-center gap-2'>
                                            {record.score}/{record.total}
                                            <kit.StatusPill status={percent >= 70 ? 'done' : percent >= 50 ? 'progress' : 'review'}>{percent}%</kit.StatusPill>
                                        </span>
                                        <span className='hidden md:block text-muted'>{record.minutes} min</span>
                                        <kit.GhostButton type='button' className='!px-4 !py-[7px]' onClick={()=>navigate(`/questions/${record.courseID}`)}>
                                            Review
                                        </kit.GhostButton>
                                    </testConfigStyle.TableRow>
                                )
                            })
                        }
                    </testConfigStyle.Table>
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default TestConfig
