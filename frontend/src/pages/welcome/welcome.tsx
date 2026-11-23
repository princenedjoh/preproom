import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Switch } from 'antd'
import * as kit from '../../styles/kit'
import { Mark } from '../../components/brand/logo'
import CourseIcon from '../../components/courseIcon/courseIcon'
import { useCatalog } from '../../data/catalog'
import { progress, useProgress } from '../../store/progress'
import { useSession } from '../../store/session'
import { setStudy, useStudy } from '../../store/study'
import { FiArrowLeft, FiArrowRight, FiCheck, FiSearch } from 'react-icons/fi'

const schools = ['KNUST', 'University of Ghana', 'UCC', 'UEW', 'UDS', 'UMaT', 'Ashesi', 'GCTU', 'UENR', 'Other']
const programmes = [
    'Computer Science', 'Computer Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Biochemistry', 'Chemistry', 'Physics', 'Mathematics', 'Statistics', 'Economics', 'Business Administration',
    'Pharmacy', 'Medicine', 'Nursing', 'Agriculture',
]
const levels = ['100', '200', '300', '400', 'Postgrad']
const goals = [
    { value : 5, label : 'Casual', note : '5 questions a day · about 8 minutes' },
    { value : 10, label : 'Regular', note : '10 questions a day · about 15 minutes' },
    { value : 20, label : 'Serious', note : '20 questions a day · about 30 minutes' },
    { value : 40, label : 'Exam week', note : '40 questions a day · about an hour' },
]

const steps = ['About you', 'Your courses', 'Daily goal']

const choice = (active : boolean) => `h-9 px-3 rounded-[5px] border text-[14px] transition-colors active:scale-[0.98] ${active ? 'border-accent bg-accent-tint text-accent font-medium' : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'}`

// First run: three short steps so Today, the question list and reminders fit you from day one
const Welcome = () => {

    const navigate = useNavigate()
    const session = useSession()
    const state = useProgress()
    const study = useStudy()
    const { courses } = useCatalog()
    const [step, setStep] = useState(0)
    const [profile, setProfile] = useState({
        school : state.profile.school,
        program : state.profile.program.replace(/^(BSc|BA|BEng|MSc|BEd)\s+/, ''),
        year : state.profile.year,
    })
    const [picked, setPicked] = useState<string[]>(study.courses)
    const [goal, setGoal] = useState(study.goal)
    const [reminder, setReminder] = useState(state.prefs.dailyReminder)
    const [programSearch, setProgramSearch] = useState('')
    const heading = useRef<HTMLHeadingElement>(null)
    const firstName = (session.user?.firstName || state.profile.name.split(' ')[0] || '').trim()

    useEffect(() => { heading.current?.focus() }, [step])

    const filteredProgrammes = useMemo(() => {
        const term = programSearch.trim().toLowerCase()
        const list = term ? programmes.filter((item) => item.toLowerCase().includes(term)) : programmes
        return term && !list.some((item) => item.toLowerCase() === term) ? [...list, programSearch.trim()] : list
    }, [programSearch])

    const canContinue = step === 0 ? !!profile.school && !!profile.program && !!profile.year
        : step === 1 ? picked.length > 0
        : true

    const finish = () => {
        progress.setProfile({ school : profile.school, program : profile.program, year : profile.year })
        progress.setPrefs({ dailyReminder : reminder })
        setStudy({ courses : picked, goal, onboarded : true })
        navigate(picked[0] ? `/questions/${picked[0]}` : '/today', { replace : true })
    }

    const next = () => step < steps.length - 1 ? setStep(step + 1) : finish()
    const skip = () => { setStudy({ onboarded : true }); navigate('/today', { replace : true }) }

    return (
        <main className='min-h-screen bg-canvas flex flex-col'>
            <header className='h-14 flex items-center justify-between px-4 md:px-6'>
                <span className='flex items-center gap-2'><Mark size={22}/><span className='text-[15px] font-semibold text-ink'>PrepRoom</span></span>
                <button type='button' onClick={skip} className='text-[13px] text-ink-3 hover:text-ink'>Skip for now</button>
            </header>

            <div className='flex-1 flex flex-col items-center px-4 pt-6 md:pt-12 pb-16'>
                <div className='w-full max-w-[560px] flex flex-col gap-8'>
                    {/* Progress */}
                    <ol className='grid grid-cols-3 gap-2' aria-label='Setup progress'>
                        {steps.map((label, index) => (
                            <li key={label} className='flex flex-col gap-2' aria-current={index === step ? 'step' : undefined}>
                                <span className={`h-1 rounded-full transition-colors duration-300 ${index <= step ? 'bg-success-solid' : 'bg-ink/[0.08]'}`}/>
                                <span className={`text-[12px] ${index === step ? 'text-ink font-medium' : 'text-ink-3'}`}>{index + 1}. {label}</span>
                            </li>
                        ))}
                    </ol>

                    <section key={step} className='flex flex-col gap-6 animate-[fade_200ms_ease-out]'>
                        {
                            step === 0 ?
                            <>
                                <div className='flex flex-col gap-2'>
                                    <h1 ref={heading} tabIndex={-1} className='text-[26px] font-semibold tracking-[-0.02em] text-ink outline-none'>
                                        {firstName ? `Welcome, ${firstName}.` : 'Welcome to PrepRoom.'} Where do you study?
                                    </h1>
                                    <p className='text-[15px] text-ink-2'>We use this to show questions from your school's papers first.</p>
                                </div>
                                <fieldset className='flex flex-col gap-3'>
                                    <legend className='text-[13px] font-medium text-ink-2 mb-3'>School</legend>
                                    <div className='flex flex-wrap gap-2'>
                                        {schools.map((item) => (
                                            <button key={item} type='button' aria-pressed={profile.school === item} className={choice(profile.school === item)} onClick={()=>setProfile({ ...profile, school : item })}>{item}</button>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset className='flex flex-col gap-3'>
                                    <legend className='text-[13px] font-medium text-ink-2 mb-3'>Programme</legend>
                                    <label className='relative'>
                                        <FiSearch size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-ink-3'/>
                                        <kit.TextInput value={programSearch} onChange={(e)=>setProgramSearch(e.target.value)} placeholder='Search or type your programme' className='!pl-9' aria-label='Search programmes'/>
                                    </label>
                                    <div className='flex flex-wrap gap-2 max-h-[156px] overflow-y-auto' data-lenis-prevent>
                                        {filteredProgrammes.map((item) => (
                                            <button key={item} type='button' aria-pressed={profile.program === item} className={choice(profile.program === item)} onClick={()=>setProfile({ ...profile, program : item })}>{item}</button>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset className='flex flex-col gap-3'>
                                    <legend className='text-[13px] font-medium text-ink-2 mb-3'>Level</legend>
                                    <div className='flex flex-wrap gap-2'>
                                        {levels.map((item) => (
                                            <button key={item} type='button' aria-pressed={profile.year === item} className={choice(profile.year === item)} onClick={()=>setProfile({ ...profile, year : item })}>{item}</button>
                                        ))}
                                    </div>
                                </fieldset>
                            </>
                            : step === 1 ?
                            <>
                                <div className='flex flex-col gap-2'>
                                    <h1 ref={heading} tabIndex={-1} className='text-[26px] font-semibold tracking-[-0.02em] text-ink outline-none'>Which courses are you taking?</h1>
                                    <p className='text-[15px] text-ink-2'>Pick as many as you like. They show up first everywhere, and you can change them later.</p>
                                </div>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                    {courses.map((course) => {
                                        const on = picked.includes(course.id)
                                        return (
                                            <button key={course.id} type='button' aria-pressed={on} onClick={()=>setPicked(on ? picked.filter((id) => id !== course.id) : [...picked, course.id])}
                                                className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors active:scale-[0.99] ${on ? 'border-accent bg-accent-tint' : 'border-line hover:border-line-strong'}`}>
                                                <CourseIcon course={course} size={36}/>
                                                <span className='flex flex-col flex-1 min-w-0'>
                                                    <span className='text-[14px] font-medium text-ink truncate'>{course.name}</span>
                                                    <span className='text-[12px] text-ink-3'>{course.code} · {course.questions} questions</span>
                                                </span>
                                                <span className={`w-5 h-5 rounded-[5px] inline-flex items-center justify-center border transition-colors ${on ? 'bg-accent border-accent text-on-accent' : 'border-line-strong'}`}>{on && <FiCheck size={13} strokeWidth={3}/>}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                                <span className='text-[13px] text-ink-3'>{picked.length ? `${picked.length} selected` : 'Pick at least one to continue.'} Don't see yours? We add courses every week.</span>
                            </>
                            :
                            <>
                                <div className='flex flex-col gap-2'>
                                    <h1 ref={heading} tabIndex={-1} className='text-[26px] font-semibold tracking-[-0.02em] text-ink outline-none'>Set a daily goal</h1>
                                    <p className='text-[15px] text-ink-2'>A little every day beats cramming. Your streak counts any day you answer a question.</p>
                                </div>
                                <div className='flex flex-col gap-2' role='radiogroup' aria-label='Daily goal'>
                                    {goals.map((item) => (
                                        <button key={item.value} type='button' role='radio' aria-checked={goal === item.value} onClick={()=>setGoal(item.value)}
                                            className={`flex items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors ${goal === item.value ? 'border-accent bg-accent-tint' : 'border-line hover:border-line-strong'}`}>
                                            <span className={`w-4 h-4 rounded-full border-2 inline-flex items-center justify-center ${goal === item.value ? 'border-accent' : 'border-line-strong'}`}>{goal === item.value && <span className='w-2 h-2 rounded-full bg-accent'/>}</span>
                                            <span className='flex flex-col'>
                                                <span className='text-[15px] font-medium text-ink'>{item.label}</span>
                                                <span className='text-[13px] text-ink-3'>{item.note}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <label className='flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 cursor-pointer'>
                                    <span className='flex flex-col'>
                                        <span className='text-[14px] font-medium text-ink'>Daily challenge reminder</span>
                                        <span className='text-[13px] text-ink-3'>{session.status === 'user' ? 'One email a day when the new set lands.' : 'Log in later to get reminders by email.'}</span>
                                    </span>
                                    <Switch checked={reminder} onChange={setReminder}/>
                                </label>
                            </>
                        }
                    </section>

                    <div className='flex items-center justify-between pt-2'>
                        {step > 0 ? <kit.GhostButton type='button' onClick={()=>setStep(step - 1)}><FiArrowLeft size={14}/> Back</kit.GhostButton> : <span/>}
                        <kit.PrimaryButton type='button' className='!h-10 !px-5' disabled={!canContinue} onClick={next}>
                            {step === steps.length - 1 ? 'Start practising' : 'Continue'} <FiArrowRight size={15}/>
                        </kit.PrimaryButton>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Welcome
