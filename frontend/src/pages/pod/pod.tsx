import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { useChallengeView } from '../../store/challenge'
import { loadResult } from '../test/engine'
import { TestConfigState } from '../test/pages/testConfig/testConfig'
import { HiFire, HiTrophy } from "react-icons/hi2";
import { FiArrowRight, FiClock, FiCheck } from "react-icons/fi";

const untilMidnight = () => {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const total = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`
}

export const startChallenge = (navigate : ReturnType<typeof useNavigate>, courseID : string) => {
    const config : TestConfigState = { courseID, mode : 'challenge', count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false }
    navigate('/test/session', { state : config })
}

const Pod = () => {

    const navigate = useNavigate()
    const view = useChallengeView()
    const [countdown, setCountdown] = useState(untilMidnight)
    const done = view.result

    useEffect(()=>{
        const id = window.setInterval(() => setCountdown(untilMidnight()), 30000)
        return () => window.clearInterval(id)
    },[])

    const openResult = async () => {
        if(done?.testID){
            const result = await loadResult(done.testID).catch(() => null)
            if(result) return navigate('/test/results', { state : result })
        }
        navigate(`/questions/${view.course.id}${done?.missed ? '?status=mistakes' : ''}`)
    }

    const streak = view.streak
    const streakNote = streak.current === 0 ? 'Answer a question today to start a streak'
        : !streak.activeToday ? 'Practise today to keep it alive'
        : streak.current >= streak.best ? 'Your best streak yet'
        : `${streak.best - streak.current} more day${streak.best - streak.current === 1 ? '' : 's'} to beat your best`

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
                            aria-busy={!view.ready}
                        >
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <kit.Eyebrow light>Today · {view.course.code}</kit.Eyebrow>
                                <span className='inline-flex items-center gap-2 text-[13px] text-fog'>
                                    <FiClock size={13}/> {done ? `Next set in ${countdown}` : `${view.minutes} minutes`}
                                </span>
                            </div>
                            <div className='flex flex-col gap-3 max-w-[560px]'>
                                <kit.Heading light className='!text-[34px] md:!text-[44px]'>
                                    {done ? `You scored ${done.score}/${done.total}.` : view.title}
                                </kit.Heading>
                                <kit.Lead light>
                                    {
                                        done ? (done.rank ? `You're ranked #${done.rank} today. Come back tomorrow for a new set.` : 'Come back tomorrow for a new set.')
                                        : view.status === 'in_progress' ? 'You started this one. Pick up where you left off before the clock runs out.'
                                        : `${view.count} mixed-difficulty questions from recent past papers. Ranked by score, then time.`
                                    }
                                </kit.Lead>
                            </div>
                            <div className='flex flex-wrap items-center gap-4'>
                                {
                                    done ?
                                    <kit.LightButton type='button' onClick={openResult}>
                                        {done.testID ? 'See your answers' : done.missed ? 'Review what you missed' : `Practise more ${view.course.name}`} <FiArrowRight size={16}/>
                                    </kit.LightButton>
                                    :
                                    <kit.LightButton type='button' disabled={!view.ready} onClick={()=>startChallenge(navigate, view.course.id)}>
                                        {view.status === 'in_progress' ? 'Resume challenge' : 'Start challenge'} <FiArrowRight size={16}/>
                                    </kit.LightButton>
                                }
                                {
                                    view.recentPlayers.length > 0 &&
                                    <div className='flex items-center'>
                                        {view.recentPlayers.slice(0, 4).map((person, index) => (
                                            <kit.Avatar key={`${person.initials}${index}`} color={person.color} size={28} ring='#111111'>{person.initials}</kit.Avatar>
                                        ))}
                                        <span className='ml-3 text-[13px] text-fog'>
                                            {view.players ? `${view.players.toLocaleString()} played today` : 'Same five for everyone'}
                                        </span>
                                    </div>
                                }
                            </div>
                        </div>

                        <kit.Panel className='!p-6'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <kit.PanelTitle>
                                    <HiFire size={16} className={streak.current ? '!text-[#fd9a46]' : ''}/>
                                    {streak.current}-day streak
                                </kit.PanelTitle>
                                <span className='text-[13px] text-muted'>{streakNote}</span>
                            </div>
                            <div className='grid grid-cols-7 gap-2'>
                                {
                                    streak.week.map((day) => (
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
                                view.recent.length === 0 ?
                                <kit.Empty className='!py-10'>
                                    <HiTrophy size={20}/>
                                    <span className='text-[15px] font-semibold text-ink'>No challenges yet</span>
                                    <span className='text-[14px]'>Today's set takes about ten minutes.</span>
                                </kit.Empty>
                                :
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    {
                                        view.recent.map((item) => (
                                            <kit.Card key={item.key} className='!p-5 !gap-2'>
                                                <div className='flex items-center justify-between'>
                                                    <span className='text-[12px] text-ash'>{item.when}</span>
                                                    <kit.StatusPill status={item.score === item.total ? 'done' : item.score >= item.total * 0.6 ? 'progress' : 'review'}>{item.score}/{item.total}</kit.StatusPill>
                                                </div>
                                                <span className='text-[15px] font-bold text-ink'>{item.course}</span>
                                                <span className='text-[13px] text-muted'>{item.note}</span>
                                            </kit.Card>
                                        ))
                                    }
                                </div>
                            }
                        </div>
                    </div>

                    <kit.Panel className='lg:sticky lg:top-[88px]'>
                        <kit.PanelTitle><HiTrophy size={15}/> This week's leaderboard</kit.PanelTitle>
                        {
                            view.board.length === 0 ?
                            <span className='text-[14px] text-muted leading-[1.5]'>No one has played this week yet. Finish today's challenge to take the top spot.</span>
                            :
                            <div className='flex flex-col'>
                                {
                                    view.board.map((person) => (
                                        <div
                                            key={person.key}
                                            className={`flex items-center gap-3 py-3 ${person.you ? 'rounded-[9px] bg-mist px-3 -mx-3 my-1' : 'border-b border-mercury last:border-0'}`}
                                        >
                                            <span className='font-mono text-[12px] text-ash w-[18px] tabular-nums'>{person.rank}</span>
                                            <kit.Avatar color={person.color} size={32} ring='transparent'>{person.initials}</kit.Avatar>
                                            <div className='flex flex-col flex-1 min-w-0'>
                                                <span className='text-[14px] font-semibold text-ink truncate'>{person.name}</span>
                                                {person.school && <span className='text-[12px] text-ash'>{person.school}</span>}
                                            </div>
                                            <span className='text-[14px] font-bold text-ink tabular-nums'>{person.score}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        }
                        <span className='text-[12px] leading-[1.5] text-ash'>
                            {view.you.rank === 1 ? "You're top of the board this week. " : view.you.rank ? `You're #${view.you.rank}. ` : ''}{view.scoring}
                        </span>
                    </kit.Panel>
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Pod
