import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Switch } from 'antd'
import * as questionsStyled from './questions.styled'
import * as kit from '../../styles/kit'
import Mcqs from '../mcqs/mcqs'
import { courses, getCourse, fetchQuestions, Question, Difficulty } from '../../data/sample'
import { FiSearch, FiSliders, FiTrendingUp, FiArrowRight } from "react-icons/fi";
import { BiSolidSchool } from "react-icons/bi";

const difficulties : ('All' | Difficulty)[] = ['All', 'Easy', 'Medium', 'Hard']
const sorts = ['Newest', 'Oldest', 'Hardest'] as const
const difficultyRank = { Easy : 0, Medium : 1, Hard : 2 }
const schools = ['KNUST', 'UG', 'UCC', 'UEW', 'UDS', 'ATU']

const Questions = () => {

    const navigate = useNavigate()
    const { courseID } = useParams()
    const course = getCourse(courseID)

    const [data, setData] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All')
    const [topic, setTopic] = useState('All')
    const [sort, setSort] = useState<typeof sorts[number]>('Newest')
    const [revealAll, setRevealAll] = useState(false)
    const [selectedSchools, setSelectedSchools] = useState<string[]>([])
    const [results, setResults] = useState<Record<string, boolean>>({})

    useEffect(()=>{
        let active = true
        setLoading(true)
        setResults({})
        fetchQuestions(course.id).then((questions) => {
            if(!active) return
            setData(questions)
            setLoading(false)
        })
        return () => { active = false }
    },[course.id])

    const topics = useMemo(() => ['All', ...Array.from(new Set(data.map((question) => question.topic)))], [data])

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase()
        return data
            .filter((question) => difficulty === 'All' || question.difficulty === difficulty)
            .filter((question) => topic === 'All' || question.topic === topic)
            .filter((question) => !term || question.question.toLowerCase().includes(term))
            .sort((a, b) => sort === 'Newest' ? b.year - a.year
                : sort === 'Oldest' ? a.year - b.year
                : difficultyRank[b.difficulty] - difficultyRank[a.difficulty])
    }, [data, search, difficulty, topic, sort])

    const answered = Object.keys(results).length
    const correct = Object.values(results).filter(Boolean).length

    const toggleSchool = (school : string) => {
        setSelectedSchools(selectedSchools.includes(school)
            ? selectedSchools.filter((item) => item !== school)
            : [...selectedSchools, school])
    }

    return (
        <kit.Page>
            <kit.PageInner>
                <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                    <div className='flex flex-col gap-2'>
                        <kit.Eyebrow>{course.code} · Past questions</kit.Eyebrow>
                        <kit.PageTitle>{course.name}</kit.PageTitle>
                        <kit.Body>{course.questions} questions from past papers, sorted by topic and difficulty.</kit.Body>
                    </div>
                    <kit.DarkButton type='button' onClick={()=>navigate('/test/testconfig', { state : { courseID : course.id } })}>
                        Take a timed test <FiArrowRight size={16}/>
                    </kit.DarkButton>
                </div>

                <questionsStyled.ChipRow>
                    {
                        courses.map((item) => (
                            <kit.FilterChip
                                key={item.id}
                                type='button'
                                active={item.id === course.id}
                                onClick={()=>navigate(`/questions/${item.id}`)}
                            >
                                <span className='w-[8px] h-[8px] rounded-[3px]' style={{ background : item.color }}/>
                                {item.name}
                            </kit.FilterChip>
                        ))
                    }
                </questionsStyled.ChipRow>

                <questionsStyled.Layout>
                    <div className='flex flex-col gap-4 min-w-0'>
                        <questionsStyled.Toolbar>
                            <div className='flex flex-col md:flex-row gap-3 md:items-center md:justify-between'>
                                <questionsStyled.Search>
                                    <FiSearch size={15}/>
                                    <kit.TextInput
                                        value={search}
                                        onChange={(e)=>setSearch(e.target.value)}
                                        placeholder='Search questions'
                                        aria-label='Search questions'
                                    />
                                </questionsStyled.Search>
                                <kit.Segmented>
                                    {
                                        difficulties.map((item) => (
                                            <kit.SegmentedItem 
                                                key={item}
                                                type='button'
                                                active={difficulty === item}
                                                onClick={()=>setDifficulty(item)}
                                            >
                                                {item}
                                            </kit.SegmentedItem>
                                        ))
                                    }
                                </kit.Segmented>
                            </div>
                            <questionsStyled.ChipRow>
                                <kit.Eyebrow className='self-center shrink-0 mr-1'>Topics</kit.Eyebrow>
                                {
                                    topics.map((item) => (
                                        <kit.FilterChip key={item} type='button' active={topic === item} onClick={()=>setTopic(item)}>
                                            {item}
                                        </kit.FilterChip>
                                    ))
                                }
                            </questionsStyled.ChipRow>
                        </questionsStyled.Toolbar>

                        {
                            loading ?
                            <div className='flex flex-col gap-3'>
                                {[0,1,2].map((item) => <div key={item} className='h-[220px] rounded-[12px] bg-mist border border-bone animate-pulse'/>)}
                            </div>
                            : visible.length === 0 ?
                            <kit.Empty>
                                <FiSearch size={22}/>
                                <span className='text-[15px] font-semibold text-ink'>No questions match your filters</span>
                                <kit.GhostButton type='button' onClick={()=>{ setSearch(''); setDifficulty('All'); setTopic('All') }}>
                                    Clear filters
                                </kit.GhostButton>
                            </kit.Empty>
                            :
                            <Mcqs 
                                questions={visible}
                                revealAll={revealAll}
                                onAnswer={(id, isCorrect)=>setResults({ ...results, [id] : isCorrect })}
                            />
                        }
                    </div>

                    <questionsStyled.Rail>
                        <kit.Panel>
                            <kit.PanelTitle><FiTrendingUp size={15}/> This session</kit.PanelTitle>
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='flex flex-col'>
                                    <kit.StatValue className='!text-[28px]'>{answered}</kit.StatValue>
                                    <kit.StatLabel>Answered</kit.StatLabel>
                                </div>
                                <div className='flex flex-col'>
                                    <kit.StatValue className='!text-[28px]'>{answered ? Math.round(correct / answered * 100) : 0}%</kit.StatValue>
                                    <kit.StatLabel>Accuracy</kit.StatLabel>
                                </div>
                            </div>
                            <div className='flex flex-col gap-2'>
                                <div className='flex justify-between text-[12px] text-ash'>
                                    <span>Course progress</span><span>{course.progress}%</span>
                                </div>
                                <kit.ProgressTrack><kit.ProgressFill value={course.progress}/></kit.ProgressTrack>
                            </div>
                        </kit.Panel>

                        <kit.Panel>
                            <kit.PanelTitle><FiSliders size={15}/> View</kit.PanelTitle>
                            <questionsStyled.SettingRow>
                                Show all answers
                                <Switch size='small' checked={revealAll} onChange={setRevealAll}/>
                            </questionsStyled.SettingRow>
                            <div className='flex flex-col gap-2'>
                                <span className='text-[13px] text-muted'>Sort by</span>
                                <kit.Segmented className='w-full'>
                                    {
                                        sorts.map((item) => (
                                            <kit.SegmentedItem
                                                key={item}
                                                type='button'
                                                className='flex-1'
                                                active={sort === item}
                                                onClick={()=>setSort(item)}
                                            >
                                                {item}
                                            </kit.SegmentedItem>
                                        ))
                                    }
                                </kit.Segmented>
                            </div>
                        </kit.Panel>

                        <kit.Panel>
                            <kit.PanelTitle><BiSolidSchool size={15}/> Schools</kit.PanelTitle>
                            <div className='flex flex-wrap gap-2'>
                                {
                                    schools.map((school) => (
                                        <kit.FilterChip 
                                            key={school}
                                            type='button'
                                            active={selectedSchools.includes(school)}
                                            onClick={()=>toggleSchool(school)}
                                        >
                                            {school}
                                        </kit.FilterChip>
                                    ))
                                }
                            </div>
                        </kit.Panel>
                    </questionsStyled.Rail>
                </questionsStyled.Layout>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Questions
