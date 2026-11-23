import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import * as kit from '../../styles/kit'
import Footer from '../../components/footer/footer'
import ProductMock from './components/productMock/productMock'
import { useCatalog } from '../../data/catalog'
import { useSession } from '../../store/session'
import { FiArrowRight, FiCheck, FiBookOpen, FiZap, FiBarChart2, FiList, FiUploadCloud } from 'react-icons/fi'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const schools = ['KNUST', 'University of Ghana', 'UCC', 'UEW', 'UDS', 'UMaT', 'Ashesi', 'GCTU', 'UENR']

// Small, static slices of the real interface, drawn with the live tokens so they follow the theme

const ListSlice = () => (
    <div className='rounded-lg border border-line bg-surface p-3 flex flex-col text-[13px]'>
        <div className='flex items-center gap-2 pb-2'>
            {['All topics 48', 'Trees 9', 'Graphs 7', 'Hashing 5'].map((chip, index) => (
                <span key={chip} className={`h-6 px-[9px] rounded-full inline-flex items-center text-[12px] ${index === 0 ? 'bg-ink text-surface' : 'text-ink-2'}`}>{chip}</span>
            ))}
        </div>
        {[
            ['1. Building a heap bottom-up costs…', '41.2%', 'Hard', true],
            ['2. BFS picks the next vertex using…', '78.5%', 'Med.', true],
            ['3. Worst case for binary search is…', '91.0%', 'Easy', false],
            ['4. Rebalancing an AVL tree after…', '33.7%', 'Hard', null],
            ['5. Open addressing slows down when…', '62.4%', 'Med.', null],
        ].map(([title, rate, level, solved], index) => (
            <div key={title as string} className={`h-10 flex items-center gap-3 px-2 rounded-[5px] ${index % 2 ? '' : 'bg-stripe'}`}>
                <span className='w-4'>{solved === true ? <FiCheck size={14} strokeWidth={3} className='text-success'/> : solved === false ? <span className='block w-[10px] h-[10px] rounded-full border-2 border-medium'/> : null}</span>
                <span className='flex-1 min-w-0 truncate font-medium text-ink'>{title}</span>
                <span className='text-ink-2 tabular-nums'>{rate}</span>
                <span className={`w-9 text-right font-medium ${level === 'Easy' ? 'text-easy' : level === 'Hard' ? 'text-hard' : 'text-medium'}`}>{level}</span>
            </div>
        ))}
    </div>
)

const AnswerSlice = () => (
    <div className='rounded-lg border border-line bg-surface overflow-hidden text-[13px]'>
        <div className='h-10 flex items-center gap-2 px-3 border-b border-line'>
            <span className='font-medium text-ink'>7. Graphs</span>
            <span className='text-[12px] text-hard'>Hard</span>
            <span className='ml-auto inline-flex items-center gap-1 h-7 px-3 rounded-[5px] bg-ink/[0.08] text-success font-semibold'><FiUploadCloud size={13}/> Submit</span>
        </div>
        <div className='p-3 flex flex-col gap-2'>
            <p className='text-[14px] text-ink leading-[1.5] pb-1'>Dijkstra's algorithm can return wrong shortest paths when the graph contains…</p>
            {[['A', 'Cycles', 9], ['B', 'Negative edge weights', 71], ['C', 'Parallel edges', 6], ['D', 'More than 1,000 vertices', 14]].map(([key, text, share]) => (
                <div key={key as string} className={`relative h-10 flex items-center gap-3 px-2 rounded-md border overflow-hidden ${key === 'B' ? 'border-success/50 bg-success/10' : key === 'D' ? 'border-hard/50 bg-hard/10' : 'border-line text-ink-3'}`}>
                    <span className='absolute inset-y-0 left-0 bg-ink/[0.05]' style={{ width : `${share}%` }}/>
                    <span className={`relative w-6 h-6 rounded-[5px] inline-flex items-center justify-center font-mono text-[11px] ${key === 'B' ? 'bg-success text-white' : key === 'D' ? 'bg-hard text-white' : 'bg-ink/[0.06]'}`}>{key}</span>
                    <span className={`relative flex-1 ${key === 'B' || key === 'D' ? 'text-ink' : ''}`}>{text}</span>
                    <span className='relative text-[12px] text-ink-3 tabular-nums'>{share}%</span>
                </div>
            ))}
            <div className='flex items-baseline gap-3 pt-1'>
                <span className='text-[16px] font-semibold text-hard'>Wrong answer</span>
                <span className='text-[12px] text-ink-3'>Correct answer <b className='text-success'>B</b> · 71% of students got this right</span>
            </div>
        </div>
    </div>
)

const PlanSlice = () => (
    <div className='rounded-lg border border-line bg-surface overflow-hidden text-[13px]'>
        {[['Searching', '2/2', [['Binary search on sorted data', 'Easy', true], ['When binary search fails', 'Medium', true]]], ['Trees', '1/3', [['Pre-order traversal', 'Easy', true], ['AVL rotations', 'Hard', false], ['Heights of complete trees', 'Medium', false]]]].map(([topic, done, items]) => (
            <div key={topic as string}>
                <div className='h-9 px-3 flex items-center justify-between bg-ink/[0.04]'>
                    <span className='font-medium text-ink'>{topic as string}</span>
                    <span className={done === '2/2' ? 'text-success font-medium' : 'text-ink-3'}>{done === '2/2' ? 'Done' : done as string}</span>
                </div>
                {(items as [string, string, boolean][]).map(([title, level, solved]) => (
                    <div key={title} className='h-10 px-3 flex items-center gap-3 border-t border-line'>
                        <span className='w-4'>{solved ? <FiCheck size={14} strokeWidth={3} className='text-success'/> : <span className='block w-[10px] h-[10px] rounded-full border-2 border-ink/20'/>}</span>
                        <span className='flex-1 truncate font-medium text-ink'>{title}</span>
                        <span className={`font-medium ${level === 'Easy' ? 'text-easy' : level === 'Hard' ? 'text-hard' : 'text-medium'}`}>{level}</span>
                    </div>
                ))}
            </div>
        ))}
    </div>
)

const ChallengeSlice = () => (
    <div className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 text-[13px]'>
        <div className='rounded-lg border border-line bg-surface p-3 flex flex-col gap-2'>
            <span className='font-medium text-ink'>Day 23 <span className='text-[11px] text-ink-3 font-mono'>01:24:09 left</span></span>
            <div className='grid grid-cols-7 gap-y-1 text-center text-[11px]'>
                {Array.from({ length : 30 }).map((_, index) => (
                    <span key={index} className={`mx-auto w-6 h-6 rounded-full inline-flex items-center justify-center tabular-nums ${index === 22 ? 'bg-success-solid text-white font-semibold' : index > 22 ? 'text-ink-4' : 'text-ink-2'}`}>
                        {index + 1}
                    </span>
                ))}
            </div>
        </div>
        <div className='rounded-lg border border-line bg-surface overflow-hidden flex flex-col'>
            <span className='h-9 px-3 flex items-center font-medium text-ink border-b border-line'>This week</span>
            {[['1', 'Ama K.', 'KNUST', '980'], ['2', 'Kofi O.', 'UG', '945'], ['3', 'Esi M.', 'UCC', '910'], ['4', 'You', 'KNUST', '870']].map(([rank, name, school, score]) => (
                <span key={rank} className={`h-10 px-3 flex items-center gap-2 ${name === 'You' ? 'bg-accent-tint' : ''}`}>
                    <span className='w-3 text-ink-3 tabular-nums'>{rank}</span>
                    <span className={`flex-1 truncate ${name === 'You' ? 'text-accent font-medium' : 'text-ink'}`}>{name} <span className='text-[11px] text-ink-3'>{school}</span></span>
                    <span className='font-medium text-ink tabular-nums'>{score}</span>
                </span>
            ))}
        </div>
    </div>
)

const features = [
    { icon : FiList, tone : 'blue', kicker : 'Question bank', title : 'Every past question, in one list.', text : 'Filter by course, topic, year and difficulty. See what you have solved, what you missed, and how many students get each one right.', slice : <ListSlice/> },
    { icon : FiBarChart2, tone : 'green', kicker : 'Answer and learn', title : 'Answer, then see how everyone did.', text : 'Pick an option and submit. The explanation unlocks, and you see the share of students who chose each answer, so you know which traps catch people.', slice : <AnswerSlice/> },
    { icon : FiBookOpen, tone : 'purple', kicker : 'Study plans', title : 'A plan for every course.', text : 'Questions grouped by topic, easiest first. Work through it and earn the badge, or jump straight to a timed test.', slice : <PlanSlice/> },
    { icon : FiZap, tone : 'yellow', kicker : 'Daily challenge', title : 'Five questions. Every day.', text : 'The same set for everyone, ranked by score and speed. Keep your streak alive and climb the weekly board.', slice : <ChallengeSlice/> },
] as const

const Home = () => {

    const scope = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const { courses } = useCatalog()
    const signedIn = useSession().status === 'user'
    const total = courses.reduce((sum, course) => sum + course.questions, 0)

    useGSAP(() => {
        const mm = gsap.matchMedia()
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.timeline({ defaults : { ease : 'power3.out' } })
                .from('[data-hero] > *', { y : 14, autoAlpha : 0, duration : 0.6, stagger : 0.06 })
                .from('[data-hero-visual]', { y : 28, autoAlpha : 0, duration : 0.8 }, '-=0.35')
            gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
                gsap.from(el, { y : 24, autoAlpha : 0, duration : 0.7, ease : 'power3.out', scrollTrigger : { trigger : el, start : 'top 85%', once : true } })
            })
        })
    }, { scope })

    const start = () => navigate(signedIn ? '/today' : '/auth/signup')

    return (
        <div ref={scope} className='w-full bg-canvas overflow-x-clip'>
            {/* Hero */}
            <section className='px-4 md:px-6 pt-[120px] md:pt-[144px] flex flex-col items-center'>
                <div data-hero className='max-w-[760px] flex flex-col items-center text-center gap-5'>
                    <span className='inline-flex items-center gap-2 h-7 pl-1 pr-3 rounded-full border border-line text-[13px] text-ink-2'>
                        <span className='h-5 px-2 rounded-full bg-success-solid text-white text-[11px] font-semibold inline-flex items-center'>New</span>
                        Daily challenges with a weekly leaderboard
                    </span>
                    <h1 className='text-[44px] sm:text-[60px] md:text-[68px] font-semibold leading-[1.02] tracking-[-0.045em] text-ink text-balance'>
                        Past questions,<br/>practised properly.
                    </h1>
                    <p className='max-w-[560px] text-[17px] md:text-[18px] leading-[1.55] text-ink-2 text-pretty'>
                        Every past paper question for your courses, with explanations, timed tests and a daily challenge. Free for students in Ghana.
                    </p>
                    <div className='flex flex-wrap justify-center gap-2 pt-1'>
                        <kit.PrimaryButton type='button' className='!h-11 !px-6 !text-[15px]' onClick={start}>{signedIn ? 'Open PrepRoom' : 'Start practising, free'} <FiArrowRight size={16}/></kit.PrimaryButton>
                        <kit.SecondaryButton type='button' className='!h-11 !px-5 !text-[15px]' onClick={()=>navigate('/questions')}>Browse questions</kit.SecondaryButton>
                    </div>
                    <span className='text-[13px] text-ink-3'>No card needed. Practise without an account, sign up to sync.</span>
                </div>
                <div data-hero-visual className='w-full max-w-[980px] mt-14 md:mt-16 pb-16'>
                    <ProductMock/>
                </div>
            </section>

            {/* Proof */}
            <section className='border-y border-line bg-surface px-4 md:px-6'>
                <div className='max-w-[1080px] mx-auto py-8 grid grid-cols-2 md:grid-cols-4 gap-6'>
                    {[
                        total >= 100 ? [total.toLocaleString(), 'past questions'] : ['Growing', 'question bank, new papers weekly'],
                        [String(courses.length || '—'), 'courses'],
                        [String(schools.length), 'universities'],
                        ['Free', 'to practise'],
                    ].map(([value, label]) => (
                        <div key={label} className='flex flex-col gap-1'>
                            <span className='text-[28px] font-semibold tracking-[-0.03em] text-ink tabular-nums'>{value}</span>
                            <span className='text-[13px] text-ink-3'>{label}</span>
                        </div>
                    ))}
                </div>
                <div className='max-w-[1080px] mx-auto pb-8 flex flex-wrap gap-x-8 gap-y-2 text-[14px] font-medium text-ink-3'>
                    <span className='text-ink-4 font-normal'>Papers from</span>
                    {schools.map((school) => <span key={school}>{school}</span>)}
                </div>
            </section>

            {/* Features: words on one side, the real interface on the other */}
            <section id='product' className='px-4 md:px-6 py-20 md:py-28 flex flex-col gap-20 md:gap-28'>
                {features.map((feature, index) => (
                    <div key={feature.title} data-reveal className='max-w-[1080px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center'>
                        <div className={`flex flex-col gap-4 ${index % 2 ? 'md:order-2' : ''}`}>
                            <span className='inline-flex items-center gap-2 text-[13px] font-medium' style={{ color : `rgb(var(--tag-${feature.tone}))` }}>
                                <feature.icon size={15}/> {feature.kicker}
                            </span>
                            <h2 className='text-[30px] md:text-[36px] font-semibold leading-[1.1] tracking-[-0.035em] text-ink text-balance'>{feature.title}</h2>
                            <p className='text-[16px] leading-[1.6] text-ink-2 max-w-[440px]'>{feature.text}</p>
                        </div>
                        <div className={index % 2 ? 'md:order-1' : ''} id={feature.kicker === 'Daily challenge' ? 'challenge' : undefined}>{feature.slice}</div>
                    </div>
                ))}
            </section>

            {/* Close */}
            <section className='px-4 md:px-6 pb-24'>
                <div data-reveal className='max-w-[1080px] mx-auto rounded-xl border border-line bg-surface px-6 py-14 md:py-16 flex flex-col items-center text-center gap-5'>
                    <h2 className='text-[32px] md:text-[44px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink text-balance'>Your next exam starts here.</h2>
                    <p className='text-[16px] text-ink-2 max-w-[440px]'>Pick your courses and answer your first question in under a minute.</p>
                    <kit.PrimaryButton type='button' className='!h-11 !px-6 !text-[15px]' onClick={start}>{signedIn ? 'Open PrepRoom' : 'Create a free account'} <FiArrowRight size={16}/></kit.PrimaryButton>
                </div>
            </section>

            <Footer/>
        </div>
    )
}

export default Home
