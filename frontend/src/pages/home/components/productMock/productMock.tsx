import { FiCheck, FiShuffle, FiUploadCloud, FiFileText, FiZap } from "react-icons/fi";
import { Mark } from '../../../../components/brand/logo'

const courses = [
    { code : 'CS', name : 'Data Structures', tone : 'purple', active : true },
    { code : 'PH', name : 'Mechanics', tone : 'blue' },
    { code : 'MA', name : 'Calculus II', tone : 'orange' },
    { code : 'CH', name : 'Organic Chemistry', tone : 'green' },
    { code : 'EC', name : 'Microeconomics', tone : 'pink' },
]

const rows : { no : number, text : string, level : 'Easy' | 'Med.' | 'Hard', rate : string, status : 'solved' | 'tried' | null }[] = [
    { no : 1, text : 'Time complexity of building a heap bottom-up', level : 'Hard', rate : '41.2%', status : 'solved' },
    { no : 2, text : 'Which structure does BFS use to pick the next vertex?', level : 'Med.', rate : '78.5%', status : 'solved' },
    { no : 3, text : 'Worst-case time of binary search on n items', level : 'Easy', rate : '91.0%', status : 'tried' },
    { no : 4, text : 'Rebalancing an AVL tree after an insert', level : 'Hard', rate : '33.7%', status : null },
    { no : 5, text : 'What degrades open addressing as load grows?', level : 'Med.', rate : '62.4%', status : null },
    { no : 6, text : 'Which traversal visits the root first?', level : 'Easy', rate : '85.7%', status : 'solved' },
]

const levelClass = { 'Easy' : 'text-easy', 'Med.' : 'text-medium', 'Hard' : 'text-hard' }

// A static slice of the real app (question list + answer sheet), drawn with the live tokens
const ProductMock = () => (
    <div className='relative w-full'>
        <div className='rounded-xl border border-line bg-frame overflow-hidden shadow-float text-left'>
            <div className='h-9 flex items-center gap-2 px-3 bg-surface border-b border-line'>
                <Mark size={16}/>
                <span className='text-[11px] font-semibold text-ink'>PrepRoom</span>
                <span className='ml-3 text-[11px] text-ink'>Questions</span>
                <span className='text-[11px] text-ink-3'>Tests</span>
                <span className='text-[11px] text-ink-3'>Challenge</span>
                <span className='ml-auto inline-flex items-center gap-1 text-[11px] text-medium font-medium'><FiZap size={11} fill='currentColor'/> 12</span>
            </div>
            <div className='flex bg-canvas'>
                <div className='hidden md:flex flex-col gap-[2px] w-[150px] p-2 border-r border-line'>
                    <span className='px-2 pb-1 text-[10px] text-ink-3'>Courses</span>
                    {courses.map((course) => (
                        <span key={course.code} className={`flex items-center gap-2 h-7 px-2 rounded-md text-[11px] ${course.active ? 'bg-ink/[0.07] text-ink font-medium' : 'text-ink-2'}`}>
                            <span className='w-4 h-4 rounded-[4px] inline-flex items-center justify-center text-[7px] font-bold' style={{ color : `rgb(var(--tag-${course.tone}))`, background : `rgb(var(--tag-${course.tone}-bg))` }}>{course.code}</span>
                            <span className='truncate'>{course.name}</span>
                        </span>
                    ))}
                </div>
                <div className='flex-1 min-w-0 p-3 flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                        {['All topics', 'Trees', 'Graphs', 'Hashing'].map((topic, index) => (
                            <span key={topic} className={`h-5 px-2 rounded-full text-[10px] inline-flex items-center ${index === 0 ? 'bg-ink text-surface' : 'text-ink-2'}`}>{topic}</span>
                        ))}
                        <span className='ml-auto inline-flex items-center gap-1 text-[10px] text-ink-2'>
                            <span className='w-3 h-3 rounded-full border-2 border-success'/> 3/6 Solved
                        </span>
                        <span className='w-5 h-5 rounded-full bg-ink/[0.05] inline-flex items-center justify-center text-ink-3'><FiShuffle size={9}/></span>
                    </div>
                    <div className='flex flex-col'>
                        {rows.map((row, index) => (
                            <div key={row.no} className={`h-8 flex items-center gap-2 px-2 rounded-[5px] text-[11px] ${index % 2 ? '' : 'bg-stripe'}`}>
                                <span className='w-3 shrink-0'>{row.status === 'solved' ? <FiCheck size={11} strokeWidth={3} className='text-success'/> : row.status === 'tried' ? <span className='block w-[8px] h-[8px] rounded-full border-[1.5px] border-medium'/> : null}</span>
                                <span className='flex-1 min-w-0 truncate font-medium text-ink'>{row.no}. {row.text}</span>
                                <span className='hidden sm:inline w-[42px] text-right text-ink-2 tabular-nums'>{row.rate}</span>
                                <span className={`w-[30px] text-right font-medium ${levelClass[row.level]}`}>{row.level}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <div data-float className='absolute -bottom-10 -right-2 md:-right-8 w-[250px] rounded-lg border border-line bg-surface shadow-float overflow-hidden'>
            <div className='h-8 flex items-center gap-2 px-3 border-b border-line text-[11px] font-medium text-ink'>
                <FiFileText size={11} className='text-accent'/> 6. Trees
                <span className='ml-auto inline-flex items-center gap-1 h-5 px-2 rounded-[4px] bg-ink/[0.08] text-success font-semibold'><FiUploadCloud size={10}/> Submit</span>
            </div>
            <div className='p-3 flex flex-col gap-[6px]'>
                <span className='text-[12px] text-ink leading-[1.4]'>Which traversal visits the root before its subtrees?</span>
                {[['A', 'In-order', 0], ['B', 'Pre-order', 86], ['C', 'Post-order', 0]].map(([key, text, share]) => (
                    <span key={key as string} className={`relative h-7 flex items-center gap-2 px-2 rounded-md border text-[11px] overflow-hidden ${key === 'B' ? 'border-success/50 bg-success/10 text-ink' : 'border-line text-ink-3'}`}>
                        {key === 'B' && <span className='absolute inset-y-0 left-0 bg-ink/[0.04]' style={{ width : `${share}%` }}/>}
                        <span className={`relative w-4 h-4 rounded-[4px] inline-flex items-center justify-center font-mono text-[9px] ${key === 'B' ? 'bg-success text-white' : 'bg-ink/[0.06]'}`}>{key}</span>
                        <span className='relative flex-1'>{text}</span>
                        <span className='relative tabular-nums text-ink-3'>{share}%</span>
                    </span>
                ))}
                <span className='text-[11px]'><b className='text-success font-semibold'>Correct</b> <span className='text-ink-3'>· 86% of students got this right</span></span>
            </div>
        </div>
    </div>
)

export default ProductMock
