import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { courses, leaderboard, questions as bank } from '../../data/sample'
import { useProgress, summarize, dayKey, dailyIndex, challengeToday, weekPoints, initialsOf, relativeDay } from '../../store/progress'
import { TestConfigState } from '../test/pages/testConfig/testConfig'
import { HiFire, HiTrophy } from "react-icons/hi2";
import { FiArrowRight, FiClock, FiCheck } from "react-icons/fi";

const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const untilMidnight = () => {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const total = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`
}

const Pod = () => {

    const navigate = useNavigate()
    const state = useProgress()
    const stats = summarize(state)
    const done = challengeToday(state)
    const todayCourse = courses[dailyIndex(courses.length)]
    const todayTopics = Array.from(new Set(bank.filter((question) => question.courseID === todayCourse.id).map((question) => question.topic))).slice(0, 3)
    const [countdown, setCountdown] = useState(untilMidnight)

    useEffect(()=>{
        const id = window.setInterval(() => setCountdown(untilMidnight()), 30000)
        return () => window.clearInterval(id)
    },[])

    // This week, Monday first, from the days you were actually active
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const days = week.map((label, index) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + index)
        const key = dayKey(date)
        return { label, active : state.activeDays.includes(key), today : key === dayKey(), future : key > dayKey() }
    })

    const you = { initials : initialsOf(state.profile.name), name : 'You', school : state.profile.school, score : weekPoints(state), color : '#202020', you : true }
    const ranked = [...leaderboard.map((person) => ({ ...person, you : false })), you].sort((a, b) => b.score - a.score)
    const yourRank = ranked.findIndex((person) => person.you) + 1

    const recent = state.tests.filter((run) => run.mode === 'challenge').slice(0, 4)

    const startChallenge = () => {
        const config : TestConfigState = {
            courseID : todayCourse.id, mode : 'challenge', count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false,
        }
        navigate('/test/session', { state : config })
    }

    const streakNote = stats.streak === 0 ? 'Answer a question today to start a streak'
        : !stats.activeToday ? 'Practise today to keep it alive'
        : stats.streak >= stats.best ? 'Your best streak yet'
        : `${stats.best - stats.streak} more day${stats.best - stats.streak === 1 ? '' : 's'} to beat your best`

    return (
        <kit.Page>
            <kit.PageInner>
                <div className='flex flex-col gap-2'>
                    <kit.Eyebrow>Daily challenge</kit.Eyebrow>
                    <kit.PageTitle>Five questions. Every day.</kit.PageTitle>
                    <kit.Body>A fresh set lands at midnight. Everyone gets the same five, ranked by score.</kit.Body>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start'>
                    <div className='flex flex-col gap-6 min-w-0'>
                        <div
                            className='rounded-[20px] p-8 md:p-10 flex flex-col gap-6'
                            style={{ background : 'linear-gradient(rgb(17, 17, 17) 24%, rgb(0, 0, 0))' }}
                        >
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <kit.Eyebrow light>Today · {todayCourse.code}</kit.Eyebrow>
                                <span className='inline-flex items-center gap-2 text-[13px] text-fog'>
                                    <FiClock size={13}/> {done ? `Next set in ${countdown}` : '10 minutes'}
                                </span>
                            </div>
                            <div className='flex flex-col gap-3 max-w-[560px]'>
                                <kit.Heading light className='!text-[34px] md:!text-[44px]'>
                                    {done ? `You scored ${done.score}/${done.total}.` : `${todayCourse.name}: ${todayTopics.join(', ').toLowerCase()}.`}
                                </kit.Heading>
                                <kit.Lead light>
                                    {done ? `That's ${done.score * 40} points toward this week's leaderboard. Come back tomorrow for a new set.`
                                        : 'Five mixed-difficulty questions from recent past papers. Ranked by score, then time.'}
                                </kit.Lead>
                            </div>
                            <div className='flex flex-wrap items-center gap-4'>
                                {
                                    done ?
                                    <kit.LightButton type='button' onClick={()=>navigate(`/questions/${todayCourse.id}${done.missed.length ? '?status=mistakes' : ''}`)}>
                                        {done.missed.length ? 'Review what you missed' : `Practise more ${todayCourse.name}`} <FiArrowRight size={16}/>
                                    </kit.LightButton>
                                    :
                                    <kit.LightButton type='button' onClick={startChallenge}>
                                        Start challenge <FiArrowRight size={16}/>
                                    </kit.LightButton>
                                }
                                <div className='flex items-center'>
                                    {leaderboard.slice(0, 4).map((person) => (
                                        <kit.Avatar key={person.initials} color={person.color} size={28} ring='#111111'>{person.initials}</kit.Avatar>
                                    ))}
                                    <span className='ml-3 text-[13px] text-fog'>Same five for everyone</span>
                                </div>
                            </div>
                        </div>

                        <kit.Panel className='!p-6'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <kit.PanelTitle>
                                    <HiFire size={16} className={stats.streak ? '!text-[#fd9a46]' : ''}/>
                                    {stats.streak}-day streak
                                </kit.PanelTitle>
                                <span className='text-[13px] text-muted'>{streakNote}</span>
                            </div>
                            <div className='grid grid-cols-7 gap-2'>
                                {
                                    days.map((day) => (
                                        <div key={day.label} className='flex flex-col items-center gap-2'>
                                            <span
                                                className={`w-full max-w-[56px] aspect-square rounded-[12px] flex items-center justify-center
                                                ${day.active ? 'bg-ink text-white' : day.today ? 'border-2 border-dashed border-ink text-ink' : day.future ? 'bg-white border border-bone text-fog' : 'bg-mist border border-bone text-fog'}`}
                                                aria-label={`${day.label}: ${day.active ? 'practised' : day.today ? 'today' : day.future ? 'upcoming' : 'missed'}`}
                                            >
                                                {day.active ? <FiCheck size={18}/> : day.today ? <HiFire size={18}/> : null}
                                            </span>
                                            <span className={`text-[12px] ${day.today ? 'font-bold text-ink' : 'text-ash'}`}>{day.label}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </kit.Panel>

                        <div className='flex flex-col gap-3'>
                            <kit.Title>Your recent challenges</kit.Title>
                            {
                                recent.length === 0 ?
                                <kit.Empty className='!py-10'>
                                    <HiTrophy size={20}/>
                                    <span className='text-[15px] font-semibold text-ink'>No challenges yet</span>
                                    <span className='text-[14px]'>Today's set takes about ten minutes.</span>
                                </kit.Empty>
                                :
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    {
                                        recent.map((run) => (
                                            <kit.Card key={run.id} className='!p-5 !gap-2'>
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-[12px] text-ash'>{relativeDay(run.at)}</span>
                                                    <kit.StatusPill status={run.score === run.total ? 'done' : run.score >= run.total * 0.6 ? 'progress' : 'review'}>{run.score}/{run.total}</kit.StatusPill>
                                                </div>
                                                <span className='text-[15px] font-bold text-ink'>{run.title.replace('Daily challenge · ', '')}</span>
                                                <span className='text-[13px] text-muted'>{run.score * 40} points</span>
                                            </kit.Card>
                                        ))
                                    }
                                </div>
                            }
                        </div>
                    </div>

                    <kit.Panel className='lg:sticky lg:top-[88px]'>
                        <kit.PanelTitle><HiTrophy size={15}/> This week's leaderboard</kit.PanelTitle>
                        <div className='flex flex-col'>
                            {
                                ranked.map((person, index) => (
                                    <div
                                        key={person.you ? 'you' : person.initials}
                                        className={`flex items-center gap-3 py-3 ${person.you ? 'rounded-[9px] bg-mist px-3 -mx-3 my-1' : 'border-b border-mercury last:border-0'}`}
                                    >
                                        <span className='font-mono text-[12px] text-ash w-[18px] tabular-nums'>{index + 1}</span>
                                        <kit.Avatar color={person.color} size={32} ring='transparent'>{person.initials}</kit.Avatar>
                                        <div className='flex flex-col flex-1 min-w-0'>
                                            <span className='text-[14px] font-semibold text-ink truncate'>{person.name}</span>
                                            <span className='text-[12px] text-ash'>{person.school}</span>
                                        </div>
                                        <span className='text-[14px] font-bold text-ink tabular-nums'>{person.score}</span>
                                    </div>
                                ))
                            }
                        </div>
                        <span className='text-[12px] text-ash'>
                            {yourRank === 1 ? "You're top of the board this week." : `You're #${yourRank}. Challenges score 40 points per correct answer, practice tests 10.`}
                        </span>
                    </kit.Panel>
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Pod
