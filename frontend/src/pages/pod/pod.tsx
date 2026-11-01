import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { courses, leaderboard, profile } from '../../data/sample'
import { TestConfigState } from '../test/pages/testConfig/testConfig'
import { HiFire, HiTrophy } from "react-icons/hi2";
import { FiArrowRight, FiClock, FiCheck } from "react-icons/fi";

const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const todayIndex = (new Date().getDay() + 6) % 7

const past = [
    { day : 'Yesterday', course : courses[1], score : 4, rank : 38 },
    { day : '2 days ago', course : courses[0], score : 5, rank : 12 },
    { day : '3 days ago', course : courses[3], score : 3, rank : 71 },
    { day : '4 days ago', course : courses[2], score : 4, rank : 25 },
]

const Pod = () => {

    const navigate = useNavigate()
    const todayCourse = courses[0]

    const startChallenge = () => {
        const config : TestConfigState = {
            courseID : todayCourse.id, mode : 'challenge', count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false,
        }
        navigate('/test/session', { state : config })
    }

    return (
        <kit.Page>
            <kit.PageInner>
                <div className='flex flex-col gap-2'>
                    <kit.Eyebrow>Daily challenge</kit.Eyebrow>
                    <kit.PageTitle>Five questions. Every day.</kit.PageTitle>
                    <kit.Body>A fresh set lands at midnight. Answer all five to keep your streak alive.</kit.Body>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start'>
                    <div className='flex flex-col gap-6 min-w-0'>
                        <div 
                            className='rounded-[20px] p-8 md:p-10 flex flex-col gap-6'
                            style={{ background : 'linear-gradient(rgb(17, 17, 17) 24%, rgb(0, 0, 0))' }}
                        >
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <kit.Eyebrow light>Today · {todayCourse.code}</kit.Eyebrow>
                                <span className='inline-flex items-center gap-2 text-[13px] text-fog'><FiClock size={13}/> 10 minutes</span>
                            </div>
                            <div className='flex flex-col gap-3 max-w-[560px]'>
                                <kit.Heading light className='!text-[34px] md:!text-[44px]'>{todayCourse.name}: trees, graphs and heaps.</kit.Heading>
                                <kit.Lead light>Five mixed-difficulty questions from recent past papers. Ranked by accuracy, then time.</kit.Lead>
                            </div>
                            <div className='flex flex-wrap items-center gap-4'>
                                <kit.LightButton type='button' onClick={startChallenge}>
                                    Start challenge <FiArrowRight size={16}/>
                                </kit.LightButton>
                                <div className='flex items-center'>
                                    {leaderboard.slice(0, 4).map((person) => (
                                        <kit.Avatar key={person.initials} color={person.color} size={28} ring='#111111'>{person.initials}</kit.Avatar>
                                    ))}
                                    <span className='ml-3 text-[13px] text-fog'>1,284 students played today</span>
                                </div>
                            </div>
                        </div>

                        <kit.Panel className='!p-6'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <kit.PanelTitle><HiFire size={16} className='!text-[#fd9a46]'/> {profile.streak}-day streak</kit.PanelTitle>
                                <span className='text-[13px] text-muted'>One more day to beat your best</span>
                            </div>
                            <div className='grid grid-cols-7 gap-2'>
                                {
                                    week.map((day, index) => {
                                        const done = index < todayIndex
                                        const today = index === todayIndex
                                        return (
                                            <div key={day} className='flex flex-col items-center gap-2'>
                                                <span 
                                                    className={`w-full max-w-[56px] aspect-square rounded-[12px] flex items-center justify-center 
                                                    ${done ? 'bg-ink text-white' : today ? 'border-2 border-dashed border-ink text-ink' : 'bg-mist border border-bone text-fog'}`}
                                                >
                                                    {done ? <FiCheck size={18}/> : today ? <HiFire size={18}/> : null}
                                                </span>
                                                <span className={`text-[12px] ${today ? 'font-bold text-ink' : 'text-ash'}`}>{day}</span>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </kit.Panel>

                        <div className='flex flex-col gap-3'>
                            <kit.Title>Recent challenges</kit.Title>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                {
                                    past.map((item) => (
                                        <kit.Card key={item.day} className='!p-5 !gap-2'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-[12px] text-ash'>{item.day}</span>
                                                <kit.StatusPill status={item.score === 5 ? 'done' : item.score >= 4 ? 'progress' : 'review'}>{item.score}/5</kit.StatusPill>
                                            </div>
                                            <span className='text-[15px] font-bold text-ink'>{item.course.name}</span>
                                            <span className='text-[13px] text-muted'>Ranked #{item.rank} today</span>
                                        </kit.Card>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    <kit.Panel className='lg:sticky lg:top-[88px]'>
                        <kit.PanelTitle><HiTrophy size={15}/> This week's leaderboard</kit.PanelTitle>
                        <div className='flex flex-col'>
                            {
                                leaderboard.map((person, index) => (
                                    <div key={person.initials} className='flex items-center gap-3 py-3 border-b border-mercury last:border-0'>
                                        <span className='font-mono text-[12px] text-ash w-[18px]'>{index + 1}</span>
                                        <kit.Avatar color={person.color} size={32} ring='transparent'>{person.initials}</kit.Avatar>
                                        <div className='flex flex-col flex-1 min-w-0'>
                                            <span className='text-[14px] font-semibold text-ink truncate'>{person.name}</span>
                                            <span className='text-[12px] text-ash'>{person.school}</span>
                                        </div>
                                        <span className='text-[14px] font-bold text-ink tabular-nums'>{person.score}</span>
                                    </div>
                                ))
                            }
                            <div className='flex items-center gap-3 mt-2 rounded-[9px] bg-mist px-3 py-3'>
                                <span className='font-mono text-[12px] text-ash w-[18px]'>42</span>
                                <kit.Avatar color='#202020' size={32} ring='transparent'>{profile.initials}</kit.Avatar>
                                <span className='flex-1 text-[14px] font-semibold text-ink'>You</span>
                                <span className='text-[14px] font-bold text-ink tabular-nums'>610</span>
                            </div>
                        </div>
                    </kit.Panel>
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Pod
