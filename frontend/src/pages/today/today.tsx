import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { courses, getCourse, getQuestion } from '../../data/sample'
import { useProgress, summarize, courseProgress, weakTopics, challengeToday, dailyIndex } from '../../store/progress'
import TestHistory from '../../components/testHistory/testHistory'
import { TestConfigState } from '../test/pages/testConfig/testConfig'
import { HiFire, HiTrophy } from 'react-icons/hi2'
import { FiArrowRight, FiBookmark, FiRotateCcw, FiTarget, FiCheck } from 'react-icons/fi'

const greeting = () => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

// Home for a returning student: pick up where you left off, today's challenge, what to fix next
const Today = () => {

    const navigate = useNavigate()
    const state = useProgress()
    const stats = summarize(state)
    const firstName = state.profile.name.split(' ')[0]

    const attempts = Object.entries(state.attempts).sort((a, b) => b[1].at - a[1].at)
    const lastCourse = attempts.length ? getCourse(attempts[0][1].courseID) : null
    const last = lastCourse ? courseProgress(state, lastCourse.id, lastCourse.questions) : null

    const mistakes = attempts.filter(([, attempt]) => !attempt.correct)
    const savedCount = Object.keys(state.saved).length
    const weak = weakTopics(state).slice(0, 4)

    const done = challengeToday(state)
    const todayCourse = courses[dailyIndex(courses.length)]

    const startChallenge = () => {
        const config : TestConfigState = { courseID : todayCourse.id, mode : 'challenge', count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false }
        navigate('/test/session', { state : config })
    }

    const mistakesCourse = mistakes.length ? mistakes[0][1].courseID : null

    return (
        <kit.Page band>
            <kit.PageInner>
                <div className='flex flex-col gap-2'>
                    <kit.Eyebrow>{new Date().toLocaleDateString(undefined, { weekday : 'long', month : 'long', day : 'numeric' })}</kit.Eyebrow>
                    <kit.PageTitle>{greeting()}, {firstName}.</kit.PageTitle>
                    <kit.Body>
                        {
                            !attempts.length ? 'Pick a course to start. Every answer you give is saved here.'
                            : stats.activeToday ? `You've practised today. ${stats.streak > 1 ? `That's ${stats.streak} days in a row.` : 'Keep going.'}`
                            : stats.streak > 0 ? `Answer one question today to keep your ${stats.streak}-day streak.`
                            : 'Welcome back. Pick up where you left off.'
                        }
                    </kit.Body>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4'>
                    {
                        lastCourse && last ?
                        <div className='rounded-[20px] p-7 md:p-9 flex flex-col gap-6 justify-between min-h-[240px]' style={{ background : 'linear-gradient(rgb(17, 17, 17) 24%, rgb(0, 0, 0))' }}>
                            <div className='flex flex-col gap-3'>
                                <kit.Eyebrow light>Continue · {lastCourse.code}</kit.Eyebrow>
                                <kit.Heading light className='!text-[32px] md:!text-[40px]'>{lastCourse.name}</kit.Heading>
                                <span className='text-[14px] text-fog tabular-nums'>{last.answered} of {lastCourse.questions} answered · {last.accuracy}% right</span>
                            </div>
                            <div className='flex flex-col gap-5'>
                                <div className='h-[6px] w-full rounded-full bg-white/10 overflow-hidden'>
                                    <kit.ProgressFill value={last.percent} color={lastCourse.color}/>
                                </div>
                                <div className='flex flex-wrap gap-3'>
                                    <kit.LightButton type='button' onClick={()=>navigate(`/questions/${lastCourse.id}${last.percent < 100 ? '?status=unanswered' : ''}`)}>
                                        {last.percent < 100 ? 'Continue practising' : 'Review the course'} <FiArrowRight size={16}/>
                                    </kit.LightButton>
                                    <button
                                        type='button'
                                        onClick={()=>navigate('/test/testconfig', { state : { courseID : lastCourse.id } })}
                                        className='rounded-full px-5 py-3 text-[14px] font-bold text-white border border-white/15 hover:bg-white/[0.06] active:scale-[0.97] transition-[background-color,transform] duration-150'
                                    >
                                        Timed test
                                    </button>
                                </div>
                            </div>
                        </div>
                        :
                        <kit.Panel className='!p-7 min-h-[240px]'>
                            <kit.PanelTitle>Start with a course</kit.PanelTitle>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                {
                                    courses.map((course) => (
                                        <button
                                            key={course.id}
                                            type='button'
                                            onClick={()=>navigate(`/questions/${course.id}`)}
                                            className='group flex items-center gap-3 rounded-[12px] border border-bone px-4 py-3 text-left hover:border-cloud hover:bg-mist active:scale-[0.98] transition-[background-color,border-color,transform] duration-150'
                                        >
                                            <span className='w-[10px] h-[10px] rounded-[3px] shrink-0' style={{ background : course.color }}/>
                                            <span className='flex flex-col flex-1 min-w-0'>
                                                <span className='text-[14px] font-semibold text-ink truncate'>{course.name}</span>
                                                <span className='text-[12px] text-ash'>{course.code} · {course.questions} questions</span>
                                            </span>
                                            <FiArrowRight size={14} className='text-ash group-hover:translate-x-[2px] transition-transform'/>
                                        </button>
                                    ))
                                }
                            </div>
                        </kit.Panel>
                    }

                    <kit.Panel className='!p-7 justify-between'>
                        <div className='flex items-center justify-between'>
                            <kit.PanelTitle><HiTrophy size={15}/> Daily challenge</kit.PanelTitle>
                            <span className='inline-flex items-center gap-1 text-[13px] font-semibold text-ink'>
                                <HiFire size={15} className={stats.streak ? 'text-[#fd9a46]' : 'text-fog'}/> {stats.streak}
                            </span>
                        </div>
                        {
                            done ?
                            <div className='flex flex-col gap-2'>
                                <span className='inline-flex items-center gap-2 text-[13px] font-semibold text-brand-emerald'><FiCheck size={14}/> Done for today</span>
                                <span className='font-display font-bold text-[40px] leading-none tracking-[-0.04em] text-onyx tabular-nums'>{done.score}/{done.total}</span>
                                <span className='text-[13px] text-muted'>{done.score * 40} points this round. A new set lands at midnight.</span>
                            </div>
                            :
                            <div className='flex flex-col gap-2'>
                                <span className='text-[13px] text-ash'>{todayCourse.code} · 5 questions · 10 min</span>
                                <span className='font-display font-bold text-[24px] leading-[1.2] tracking-[-0.03em] text-onyx'>{todayCourse.name}</span>
                                <span className='text-[13px] text-muted'>Same five for everyone today. Ranked on the weekly board.</span>
                            </div>
                        }
                        {
                            done ?
                            <kit.GhostButton type='button' className='self-start' onClick={()=>navigate('/challenges')}>See leaderboard <FiArrowRight size={14}/></kit.GhostButton>
                            :
                            <kit.DarkButton type='button' className='self-start' onClick={startChallenge}>Start challenge <FiArrowRight size={14}/></kit.DarkButton>
                        }
                    </kit.Panel>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <kit.Stat><kit.StatValue>{stats.solved}</kit.StatValue><kit.StatLabel>Answered</kit.StatLabel></kit.Stat>
                    <kit.Stat><kit.StatValue>{stats.solved ? `${stats.accuracy}%` : '–'}</kit.StatValue><kit.StatLabel>Accuracy</kit.StatLabel></kit.Stat>
                    <kit.Stat><kit.StatValue>{stats.tests}</kit.StatValue><kit.StatLabel>Tests taken</kit.StatLabel></kit.Stat>
                    <kit.Stat><kit.StatValue>{stats.best}</kit.StatValue><kit.StatLabel>Best streak</kit.StatLabel></kit.Stat>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 items-start'>
                    <kit.Panel className='!p-6'>
                        <kit.PanelTitle><FiTarget size={15}/> Focus areas</kit.PanelTitle>
                        {
                            weak.length === 0 ?
                            <span className='text-[14px] text-muted leading-[1.5]'>
                                {attempts.length ? 'Nothing to fix yet. Every topic you have tried is at 100%.' : 'Topics you find hard will show up here once you start answering.'}
                            </span>
                            :
                            <div className='flex flex-col gap-4'>
                                {
                                    weak.map((item) => (
                                        <button
                                            key={`${item.courseID}:${item.topic}`}
                                            type='button'
                                            onClick={()=>navigate(`/questions/${item.courseID}?topic=${encodeURIComponent(item.topic)}`)}
                                            className='flex flex-col gap-2 text-left group'
                                        >
                                            <span className='flex items-center justify-between text-[14px] w-full'>
                                                <span className='font-semibold text-ink group-hover:underline underline-offset-2'>{item.topic}</span>
                                                <span className='text-ash text-[12px] tabular-nums'>{item.correct}/{item.total} · {getCourse(item.courseID).code}</span>
                                            </span>
                                            <kit.ProgressTrack>
                                                <kit.ProgressFill value={item.accuracy} color={item.accuracy >= 70 ? '#00c07a' : item.accuracy >= 50 ? '#0091ff' : '#f0457a'}/>
                                            </kit.ProgressTrack>
                                        </button>
                                    ))
                                }
                            </div>
                        }
                    </kit.Panel>

                    <kit.Panel className='!p-6'>
                        <kit.PanelTitle>Review</kit.PanelTitle>
                        <button
                            type='button'
                            disabled={!mistakesCourse}
                            onClick={()=>mistakesCourse && navigate(`/questions/${mistakesCourse}?status=mistakes`)}
                            className='flex items-center gap-3 rounded-[12px] border border-bone px-4 py-4 text-left enabled:hover:bg-mist enabled:active:scale-[0.98] transition-[background-color,transform] duration-150 disabled:opacity-60'
                        >
                            <kit.IconTile><FiRotateCcw size={16}/></kit.IconTile>
                            <span className='flex flex-col flex-1'>
                                <span className='text-[14px] font-semibold text-ink'>Mistakes</span>
                                <span className='text-[12px] text-ash'>{mistakes.length ? `${mistakes.length} to try again${mistakesCourse ? ` · latest in ${getCourse(mistakesCourse).code}` : ''}` : 'None yet'}</span>
                            </span>
                            {mistakes.length > 0 && <FiArrowRight size={14} className='text-ash'/>}
                        </button>
                        <button
                            type='button'
                            disabled={!savedCount}
                            onClick={()=>{
                                const first = Object.entries(state.saved).sort((a, b) => b[1] - a[1])[0]
                                const course = first && getQuestion(first[0])?.courseID
                                navigate(`/questions/${course ?? courses[0].id}?status=saved`)
                            }}
                            className='flex items-center gap-3 rounded-[12px] border border-bone px-4 py-4 text-left enabled:hover:bg-mist enabled:active:scale-[0.98] transition-[background-color,transform] duration-150 disabled:opacity-60'
                        >
                            <kit.IconTile><FiBookmark size={16}/></kit.IconTile>
                            <span className='flex flex-col flex-1'>
                                <span className='text-[14px] font-semibold text-ink'>Saved questions</span>
                                <span className='text-[12px] text-ash'>{savedCount ? `${savedCount} saved for revision` : 'Press Save on a question to keep it'}</span>
                            </span>
                            {savedCount > 0 && <FiArrowRight size={14} className='text-ash'/>}
                        </button>
                    </kit.Panel>

                    <kit.Panel className='!p-6'>
                        <div className='flex items-center justify-between'>
                            <kit.PanelTitle>Recent tests</kit.PanelTitle>
                            {state.tests.length > 3 && <kit.TextLink type='button' onClick={()=>navigate('/test/testconfig')}>All <FiArrowRight size={13}/></kit.TextLink>}
                        </div>
                        <TestHistory compact limit={3}/>
                    </kit.Panel>
                </div>

                {
                    attempts.length > 0 &&
                    <div className='flex flex-col gap-3'>
                        <kit.Title>Your courses</kit.Title>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
                            {
                                courses.map((course) => {
                                    const value = courseProgress(state, course.id, course.questions)
                                    return (
                                        <button
                                            key={course.id}
                                            type='button'
                                            onClick={()=>navigate(`/questions/${course.id}`)}
                                            className='flex flex-col gap-3 rounded-[12px] bg-white border border-bone p-4 text-left hover:border-cloud active:scale-[0.98] transition-[border-color,transform] duration-150'
                                        >
                                            <span className='flex items-center gap-2'>
                                                <span className='w-[8px] h-[8px] rounded-[3px]' style={{ background : course.color }}/>
                                                <span className='font-mono text-[11px] uppercase tracking-[0.08em] text-ash'>{course.code}</span>
                                            </span>
                                            <span className='text-[15px] font-bold text-ink leading-[1.25]'>{course.name}</span>
                                            <kit.ProgressTrack height={4}><kit.ProgressFill value={value.percent} color={course.color}/></kit.ProgressTrack>
                                            <span className='text-[12px] text-ash tabular-nums'>{value.answered}/{course.questions} answered</span>
                                        </button>
                                    )
                                })
                            }
                        </div>
                    </div>
                }
            </kit.PageInner>
        </kit.Page>
    )
}

export default Today
