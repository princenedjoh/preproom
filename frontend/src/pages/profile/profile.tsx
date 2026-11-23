import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch, Modal } from 'antd'
import * as kit from '../../styles/kit'
import SegmentedControl from '../../components/UI/segmented/segmented'
import TestHistory from '../../components/testHistory/testHistory'
import { courses } from '../../data/sample'
import { progress, getProgress, useProgress, summarize, courseProgress, initialsOf, ProfileInfo } from '../../store/progress'
import { notify } from '../../utils/notify'
import { FiEdit2, FiArrowRight, FiLogOut, FiTrash2 } from "react-icons/fi";
import Cookies from 'universal-cookie'

const cookie = new Cookies()
const tabs = ['Overview', 'Settings'] as const

const Profile = () => {

    const navigate = useNavigate()
    const state = useProgress()
    const stats = summarize(state)
    const [tab, setTab] = useState<typeof tabs[number]>('Overview')
    const [form, setForm] = useState<ProfileInfo>(state.profile)
    const dirty = JSON.stringify(form) !== JSON.stringify(state.profile)

    const save = (event : FormEvent) => {
        event.preventDefault()
        if(!form.name.trim()) return
        progress.setProfile({ ...form, name : form.name.trim() })
        notify('Profile saved')
    }

    const logout = () => {
        cookie.remove('jwtToken', { path : '/' })
        navigate('/auth/login')
    }

    const clearData = () => {
        Modal.confirm({
            title : 'Clear your progress?',
            content : 'This removes your answers, saved questions, test history and streak from this device. It cannot be undone.',
            okText : 'Clear everything',
            cancelText : 'Cancel',
            okButtonProps : { shape : 'round', danger : true },
            cancelButtonProps : { shape : 'round' },
            onOk : () => {
                progress.reset()
                setForm(getProgress().profile)
                notify('Progress cleared')
            },
        })
    }

    return (
        <kit.Page>
            <kit.PageInner>
                <div className='flex flex-col md:flex-row md:items-center gap-5 md:justify-between'>
                    <div className='flex items-center gap-4 min-w-0'>
                        <kit.Avatar color='#202020' size={72} ring='#ffffff' className='!text-[22px] shadow-[0_0_0_1px_#e8e8e8]'>
                            {initialsOf(state.profile.name)}
                        </kit.Avatar>
                        <div className='flex flex-col gap-1 min-w-0'>
                            <kit.PageTitle className='!text-[30px] md:!text-[36px] truncate'>{state.profile.name}</kit.PageTitle>
                            <span className='text-[14px] text-muted'>{[state.profile.program, state.profile.school, state.profile.year].filter(Boolean).join(' · ')}</span>
                        </div>
                    </div>
                    <SegmentedControl aria-label='Profile section' className='self-start md:self-auto' value={tab} onChange={setTab} options={tabs}/>
                </div>

                {
                    tab === 'Overview' ?
                    <>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                            <kit.Stat><kit.StatValue>{stats.solved}</kit.StatValue><kit.StatLabel>Questions answered</kit.StatLabel></kit.Stat>
                            <kit.Stat><kit.StatValue>{stats.solved ? `${stats.accuracy}%` : '–'}</kit.StatValue><kit.StatLabel>Accuracy</kit.StatLabel></kit.Stat>
                            <kit.Stat><kit.StatValue>{stats.tests}</kit.StatValue><kit.StatLabel>Tests taken</kit.StatLabel></kit.Stat>
                            <kit.Stat>
                                <kit.StatValue>{stats.streak}</kit.StatValue>
                                <kit.StatLabel>Day streak{stats.best > stats.streak ? ` · best ${stats.best}` : ''}</kit.StatLabel>
                            </kit.Stat>
                        </div>
                        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 items-start'>
                            <kit.Panel className='!p-6'>
                                <kit.PanelTitle>Course progress</kit.PanelTitle>
                                <div className='flex flex-col gap-5'>
                                    {
                                        courses.map((course) => {
                                            const value = courseProgress(state, course.id, course.questions)
                                            return (
                                                <button
                                                    key={course.id}
                                                    type='button'
                                                    onClick={()=>navigate(`/questions/${course.id}`)}
                                                    className='flex flex-col gap-2 text-left group rounded-[8px] -m-2 p-2 hover:bg-mist transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,145,255,0.35)]'
                                                >
                                                    <div className='flex items-center justify-between text-[14px] w-full'>
                                                        <span className='flex items-center gap-2 font-semibold text-ink'>
                                                            <span className='w-[8px] h-[8px] rounded-[3px]' style={{ background : course.color }}/>
                                                            {course.name}
                                                            <FiArrowRight size={13} className='opacity-0 group-hover:opacity-100 transition-opacity text-ash'/>
                                                        </span>
                                                        <span className='text-muted tabular-nums text-[13px]'>
                                                            {value.answered}/{course.questions}
                                                            {value.answered > 0 && <span className='text-ash'> · {value.accuracy}% right</span>}
                                                        </span>
                                                    </div>
                                                    <kit.ProgressTrack><kit.ProgressFill value={value.percent} color={course.color}/></kit.ProgressTrack>
                                                </button>
                                            )
                                        })
                                    }
                                </div>
                            </kit.Panel>
                            <kit.Panel className='!p-6'>
                                <div className='flex items-center justify-between'>
                                    <kit.PanelTitle>Recent tests</kit.PanelTitle>
                                    {state.tests.length > 0 && <kit.TextLink type='button' onClick={()=>navigate('/test/testconfig')}>New test <FiArrowRight size={13}/></kit.TextLink>}
                                </div>
                                <TestHistory compact limit={5}/>
                            </kit.Panel>
                        </div>
                    </>
                    :
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'>
                        <kit.Panel className='!p-6'>
                            <kit.PanelTitle><FiEdit2 size={14}/> Account</kit.PanelTitle>
                            <form className='flex flex-col gap-4' onSubmit={save}>
                                <kit.Label>Full name
                                    <kit.TextInput required autoComplete='name' value={form.name} onChange={(e)=>setForm({ ...form, name : e.target.value })}/>
                                </kit.Label>
                                <kit.Label>Programme
                                    <kit.TextInput value={form.program} onChange={(e)=>setForm({ ...form, program : e.target.value })}/>
                                </kit.Label>
                                <div className='grid grid-cols-2 gap-3'>
                                    <kit.Label>School<kit.TextInput value={form.school} onChange={(e)=>setForm({ ...form, school : e.target.value })}/></kit.Label>
                                    <kit.Label>Level<kit.TextInput value={form.year} onChange={(e)=>setForm({ ...form, year : e.target.value })}/></kit.Label>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <kit.DarkButton type='submit' disabled={!dirty || !form.name.trim()}>Save changes</kit.DarkButton>
                                    {dirty && <button type='button' className='text-[13px] text-ash hover:text-ink transition-colors' onClick={()=>setForm(state.profile)}>Discard</button>}
                                </div>
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
                                        <label key={key} className='flex items-center justify-between gap-3 text-[14px] text-carbon cursor-pointer'>
                                            {label}
                                            <Switch size='small' checked={state.prefs[key]} onChange={(value)=>progress.setPrefs({ [key] : value })}/>
                                        </label>
                                    ))
                                }
                            </kit.Panel>
                            <kit.Panel className='!p-6'>
                                <kit.PanelTitle>Data and session</kit.PanelTitle>
                                <span className='text-[14px] text-muted'>Your progress is stored on this device.</span>
                                <div className='flex flex-wrap gap-2'>
                                    <kit.GhostButton type='button' onClick={logout}>
                                        <FiLogOut size={14}/> Log out
                                    </kit.GhostButton>
                                    <kit.GhostButton type='button' className='!text-[#d9365f]' onClick={clearData}>
                                        <FiTrash2 size={14}/> Clear my data
                                    </kit.GhostButton>
                                </div>
                            </kit.Panel>
                        </div>
                    </div>
                }
            </kit.PageInner>
        </kit.Page>
    )
}

export default Profile
