import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import * as testConfigStyle from '../../pages/test/pages/testConfig/testConfig.style'
import { getCourse } from '../../data/catalog'
import { useProgress, relativeDay } from '../../store/progress'
import { FiClock } from 'react-icons/fi'
import CourseIcon from '../courseIcon/courseIcon'

const statusFor = (percent : number) => percent >= 70 ? 'done' : percent >= 50 ? 'progress' : 'review'
const minutes = (seconds : number) => seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)} min`

interface Props {
    compact? : boolean
    limit? : number
}

// Finished tests from this device, newest first
const TestHistory = ({ compact, limit } : Props) => {

    const navigate = useNavigate()
    const { tests } = useProgress()
    const rows = limit ? tests.slice(0, limit) : tests

    if(rows.length === 0){
        return (
            <kit.Empty className={compact ? '!py-8' : ''}>
                <FiClock size={20}/>
                <span className='text-[15px] font-medium text-ink'>No tests yet</span>
                <span className='text-[14px] max-w-[300px]'>Finished tests show up here with your score and time.</span>
                {compact && <kit.SecondaryButton type='button' className='mt-2' onClick={()=>navigate('/test/testconfig')}>Set up a test</kit.SecondaryButton>}
            </kit.Empty>
        )
    }

    const review = (courseID : string, missed : number) => navigate(`/questions/${courseID}${missed > 0 ? '?status=mistakes' : ''}`)

    if(compact){
        return (
            <div className='flex flex-col -mx-2'>
                {
                    rows.map((run) => {
                        const percent = run.total ? Math.round(run.score / run.total * 100) : 0
                        return (
                            <button
                                key={run.id}
                                type='button'
                                onClick={()=>review(run.courseID, run.missed.length)}
                                className='flex items-center gap-3 py-2 text-left hover:bg-ink/[0.04] px-2 rounded-md transition-colors duration-100'
                            >
                                <CourseIcon course={getCourse(run.courseID)} size={28}/>
                                <div className='flex flex-col flex-1 min-w-0'>
                                    <span className='text-[14px] text-ink truncate'>{run.title}</span>
                                    <span className='text-[12px] text-ink-3 tabular-nums'>{relativeDay(run.at)} · {run.score}/{run.total}</span>
                                </div>
                                <kit.StatusPill status={statusFor(percent)}>{percent}%</kit.StatusPill>
                            </button>
                        )
                    })
                }
            </div>
        )
    }

    return (
        <testConfigStyle.Table>
            <testConfigStyle.TableRow head>
                <span>Test</span>
                <span className='hidden md:block'>Date</span>
                <span className='hidden md:block'>Score</span>
                <span className='hidden md:block'>Time</span>
                <span/>
            </testConfigStyle.TableRow>
            {
                rows.map((run) => {
                    const percent = run.total ? Math.round(run.score / run.total * 100) : 0
                    const course = getCourse(run.courseID)
                    return (
                        <testConfigStyle.TableRow key={run.id}>
                            <div className='flex items-center gap-3 min-w-0'>
                            <CourseIcon course={course} size={28}/>
                            <div className='flex flex-col min-w-0'>
                                <span className='truncate'>{run.title}</span>
                                <span className='text-[12px] text-ink-3 truncate'>
                                    {course.code} · <span className='md:hidden'>{relativeDay(run.at)} · {run.score}/{run.total}</span><span className='hidden md:inline'>{course.name}</span>
                                </span>
                            </div>
                            </div>
                            <span className='hidden md:block text-ink-2'>{relativeDay(run.at)}</span>
                            <span className='hidden md:flex items-center gap-2 tabular-nums'>
                                {run.score}/{run.total}
                                <kit.StatusPill status={statusFor(percent)}>{percent}%</kit.StatusPill>
                            </span>
                            <span className='hidden md:block text-ink-2 tabular-nums'>{minutes(run.seconds)}</span>
                            <kit.SecondaryButton type='button' className='!h-8 !px-3 !text-[13px]' onClick={()=>review(run.courseID, run.missed.length)}>
                                {run.missed.length > 0 ? 'Review' : 'Practise'}
                            </kit.SecondaryButton>
                        </testConfigStyle.TableRow>
                    )
                })
            }
        </testConfigStyle.Table>
    )
}

export default TestHistory
