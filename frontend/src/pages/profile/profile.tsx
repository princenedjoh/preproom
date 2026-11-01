import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch } from 'antd'
import * as kit from '../../styles/kit'
import { courses, profile, testHistory, getCourse } from '../../data/sample'
import { FiEdit2, FiArrowRight, FiLogOut } from "react-icons/fi";
import Cookies from 'universal-cookie'

const cookie = new Cookies()
const tabs = ['Overview', 'Settings'] as const

const Profile = () => {

    const navigate = useNavigate()
    const [tab, setTab] = useState<typeof tabs[number]>('Overview')
    const [prefs, setPrefs] = useState({ dailyReminder : true, replies : true, weeklyReport : false })

    const logout = () => {
        cookie.remove('jwtToken', { path : '/' })
        navigate('/auth/login')
    }

    return (
        <kit.Page>
            <kit.PageInner>
                <div className='flex flex-col md:flex-row md:items-center gap-5 md:justify-between'>
                    <div className='flex items-center gap-4'>
                        <kit.Avatar color='#202020' size={72} ring='#ffffff' className='!text-[22px] shadow-[0_0_0_1px_#e8e8e8]'>
                            {profile.initials}
                        </kit.Avatar>
                        <div className='flex flex-col gap-1'>
                            <kit.PageTitle className='!text-[30px] md:!text-[36px]'>{profile.name}</kit.PageTitle>
                            <span className='text-[14px] text-muted'>{profile.program} · {profile.school} · {profile.year}</span>
                        </div>
                    </div>
                    <kit.Segmented className='self-start md:self-auto'>
                        {tabs.map((item) => (
                            <kit.SegmentedItem key={item} type='button' active={tab === item} onClick={()=>setTab(item)}>{item}</kit.SegmentedItem>
                        ))}
                    </kit.Segmented>
                </div>

                {
                    tab === 'Overview' ?
                    <>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                            <kit.Stat><kit.StatValue>{profile.solved}</kit.StatValue><kit.StatLabel>Questions solved</kit.StatLabel></kit.Stat>
                            <kit.Stat><kit.StatValue>{profile.accuracy}%</kit.StatValue><kit.StatLabel>Accuracy</kit.StatLabel></kit.Stat>
                            <kit.Stat><kit.StatValue>{profile.tests}</kit.StatValue><kit.StatLabel>Tests taken</kit.StatLabel></kit.Stat>
                            <kit.Stat><kit.StatValue>{profile.streak}</kit.StatValue><kit.StatLabel>Day streak</kit.StatLabel></kit.Stat>
                        </div>
                        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 items-start'>
                            <kit.Panel className='!p-6'>
                                <kit.PanelTitle>Course progress</kit.PanelTitle>
                                <div className='flex flex-col gap-5'>
                                    {
                                        courses.map((course) => (
                                            <button 
                                                key={course.id}
                                                type='button'
                                                onClick={()=>navigate(`/questions/${course.id}`)}
                                                className='flex flex-col gap-2 text-left group'
                                            >
                                                <div className='flex items-center justify-between text-[14px]'>
                                                    <span className='flex items-center gap-2 font-semibold text-ink'>
                                                        <span className='w-[8px] h-[8px] rounded-[3px]' style={{ background : course.color }}/>
                                                        {course.name}
                                                        <FiArrowRight size={13} className='opacity-0 group-hover:opacity-100 transition-opacity text-ash'/>
                                                    </span>
                                                    <span className='text-muted tabular-nums'>{course.progress}%</span>
                                                </div>
                                                <kit.ProgressTrack><kit.ProgressFill value={course.progress} color={course.color}/></kit.ProgressTrack>
                                            </button>
                                        ))
                                    }
                                </div>
                            </kit.Panel>
                            <kit.Panel className='!p-6'>
                                <div className='flex items-center justify-between'>
                                    <kit.PanelTitle>Recent tests</kit.PanelTitle>
                                    <kit.TextLink type='button' onClick={()=>navigate('/test/testconfig')}>All tests <FiArrowRight size={13}/></kit.TextLink>
                                </div>
                                <div className='flex flex-col'>
                                    {
                                        testHistory.map((record) => {
                                            const percent = Math.round(record.score / record.total * 100)
                                            return (
                                                <div key={record.id} className='flex items-center gap-3 py-3 border-b border-mercury last:border-0'>
                                                    <div className='flex flex-col flex-1 min-w-0'>
                                                        <span className='text-[14px] font-semibold text-ink truncate'>{record.title}</span>
                                                        <span className='text-[12px] text-ash'>{getCourse(record.courseID).code} · {record.date}</span>
                                                    </div>
                                                    <kit.StatusPill status={percent >= 70 ? 'done' : percent >= 50 ? 'progress' : 'review'}>{percent}%</kit.StatusPill>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </kit.Panel>
                        </div>
                    </>
                    :
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'>
                        <kit.Panel className='!p-6'>
                            <kit.PanelTitle><FiEdit2 size={14}/> Account</kit.PanelTitle>
                            <form className='flex flex-col gap-4' onSubmit={(e)=>e.preventDefault()}>
                                <kit.Label>Full name<kit.TextInput defaultValue={profile.name}/></kit.Label>
                                <kit.Label>Programme<kit.TextInput defaultValue={profile.program}/></kit.Label>
                                <div className='grid grid-cols-2 gap-3'>
                                    <kit.Label>School<kit.TextInput defaultValue={profile.school}/></kit.Label>
                                    <kit.Label>Level<kit.TextInput defaultValue={profile.year}/></kit.Label>
                                </div>
                                <kit.DarkButton type='submit' className='self-start'>Save changes</kit.DarkButton>
                            </form>
                        </kit.Panel>
                        <div className='flex flex-col gap-6'>
                            <kit.Panel className='!p-6'>
                                <kit.PanelTitle>Notifications</kit.PanelTitle>
                                {
                                    ([
                                        ['dailyReminder', 'Daily challenge reminder'],
                                        ['replies', 'Replies to my comments'],
                                        ['weeklyReport', 'Weekly progress email'],
                                    ] as const).map(([key, label]) => (
                                        <label key={key} className='flex items-center justify-between gap-3 text-[14px] text-carbon'>
                                            {label}
                                            <Switch size='small' checked={prefs[key]} onChange={(value)=>setPrefs({ ...prefs, [key] : value })}/>
                                        </label>
                                    ))
                                }
                            </kit.Panel>
                            <kit.Panel className='!p-6'>
                                <kit.PanelTitle>Session</kit.PanelTitle>
                                <span className='text-[14px] text-muted'>Log out of PrepRoom on this device.</span>
                                <kit.GhostButton type='button' className='self-start' onClick={logout}>
                                    <FiLogOut size={14}/> Log out
                                </kit.GhostButton>
                            </kit.Panel>
                        </div>
                    </div>
                }
            </kit.PageInner>
        </kit.Page>
    )
}

export default Profile
