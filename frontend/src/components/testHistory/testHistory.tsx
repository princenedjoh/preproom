import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import * as testConfigStyle from '../../pages/test/pages/testConfig/testConfig.style'
import { getCourse } from '../../data/sample'
import { useProgress, relativeDay } from '../../store/progress'
import { FiClock } from 'react-icons/fi'

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
                <span className='text-[15px] font-semibold text-ink'>No tests yet</span>
                <span className='text-[14px] max-w-[300px]'>Finished tests show up here with your score and time.</span>
                {compact && <kit.GhostButton type='button' className='mt-1' onClick={()=>navigate('/test/testconfig')}>Set up a test</kit.GhostButton>}
            </kit.Empty>
        )
    }

    const review = (courseID : string, missed : number) => navigate(`/questions/${courseID}${missed > 0 ? '?status=mistakes' : ''}`)

    if(compact){
        return (
            <div className='flex flex-col'>
                {
                    rows.map((run) => {
                        const percent = run.total ? Math.round(run.score / run.total * 100) : 0
                        return (
                            <button
                                key={run.id}
                                type='button'
                                onClick={()=>review(run.courseID, run.missed.length)}
                                className='flex items-center gap-3 py-3 border-b border-mercury last:border-0 text-left hover:bg-mist -mx-2 px-2 rounded-[8px] transition-colors duration-150'
                            >
                                <div className='flex flex-col flex-1 min-w-0'>
                                    <span className='text-[14px] font-semibold text-ink truncate'>{run.title}</span>
                                    <span className='text-[12px] text-ash'>{getCourse(run.courseID).code} · {relativeDay(run.at)} · {run.score}/{run.total}</span>
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
                            <div className='flex flex-col min-w-0'>
                                <span className='font-semibold truncate'>{run.title}</span>
                                <span className='text-[12px] text-ash truncate'>
                                    {course.code} · <span className='md:hidden'>{relativeDay(run.at)} · {run.score}/{run.total}</span><span className='hidden md:inline'>{course.name}</span>
                                </span>
                            </div>
                            <span className='hidden md:block text-muted'>{relativeDay(run.at)}</span>
                            <span className='hidden md:flex items-center gap-2 tabular-nums'>
                                {run.score}/{run.total}
                                <kit.StatusPill status={statusFor(percent)}>{percent}%</kit.StatusPill>
                            </span>
                            <span className='hidden md:block text-muted tabular-nums'>{minutes(run.seconds)}</span>
                            <kit.GhostButton type='button' className='!px-4 !py-[7px]' onClick={()=>review(run.courseID, run.missed.length)}>
                                {run.missed.length > 0 ? 'Review' : 'Practice'}
                            </kit.GhostButton>
                        </testConfigStyle.TableRow>
                    )
                })
            }
        </testConfigStyle.Table>
    )
}

export default TestHistory
