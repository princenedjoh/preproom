import * as mockStyle from './productMock.style'
import * as homeStyle from '../../home.styled'
import * as i from '../../../../utils/defaultImports'
import { FiClock, FiMessageCircle } from "react-icons/fi";

const courses = [
    { name : 'Data Structures', color : i.theme.colors2.brand.violet, active : true },
    { name : 'Mechanics', color : i.theme.colors2.brand.blue },
    { name : 'Calculus II', color : i.theme.colors2.orange.orange3 },
    { name : 'Organic Chemistry', color : i.theme.colors2.brand.teal },
    { name : 'Microeconomics', color : i.theme.colors2.red.red3 },
]

const questions : {
    no : number, text : string, level : string, status : 'done' | 'progress' | 'review' | 'todo', people : string[]
}[] = [
    { no : 11, text : 'Time complexity of binary search', level : 'Easy', status : 'done', people : ['#6647f0', '#0091ff', '#16c0a4'] },
    { no : 12, text : 'Balancing an AVL tree after insert', level : 'Hard', status : 'review', people : ['#fd9a46', '#6647f0'] },
    { no : 13, text : 'Stack vs queue for BFS', level : 'Medium', status : 'done', people : ['#0091ff'] },
    { no : 14, text : 'Which traversal visits the root first?', level : 'Easy', status : 'progress', people : ['#f0457a', '#16c0a4', '#202020'] },
    { no : 15, text : 'Hash collisions and open addressing', level : 'Medium', status : 'todo', people : [] },
    { no : 16, text : 'Heapify a min-heap in place', level : 'Hard', status : 'todo', people : ['#6647f0'] },
]

const statusLabel = { done : 'Done', progress : 'In progress', review : 'Review', todo : 'To do' }

// A static, dense slice of the PrepRoom question bank used as the hero "screenshot"
const ProductMock = () => {
    return (
        <div className='relative w-full'>
            <mockStyle.Window>
                <mockStyle.Chrome>
                    <mockStyle.Dot /><mockStyle.Dot /><mockStyle.Dot />
                    <mockStyle.Address>preproom.app/questions</mockStyle.Address>
                </mockStyle.Chrome>
                <div className='flex'>
                    <mockStyle.Sidebar>
                        <homeStyle.Eyebrow className='px-2 pb-1 !text-[10px]'>Courses</homeStyle.Eyebrow>
                        {
                            courses.map((course) => (
                                <mockStyle.SideItem key={course.name} active={course.active}>
                                    <mockStyle.CourseDot color={course.color} />
                                    <span className='truncate'>{course.name}</span>
                                </mockStyle.SideItem>
                            ))
                        }
                    </mockStyle.Sidebar>
                    <div className='flex-1 min-w-0 flex flex-col'>
                        <div className='flex items-center justify-between gap-3 px-3 pt-3 pb-2'>
                            <div className='min-w-0'>
                                <div className='text-[14px] font-bold font-display tracking-[-0.02em] text-ink truncate'>
                                    Data Structures · Trees & Graphs
                                </div>
                                <div className='text-[11px] text-ash'>CS 201 · Past questions, 2019 to 2024</div>
                            </div>
                            <span className='inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-semibold text-ink bg-mist border border-bone shrink-0'>
                                <FiClock size={11} /> 12:48
                            </span>
                        </div>
                        <div className='flex items-center gap-2 px-3 pb-3'>
                            <mockStyle.Progress><mockStyle.ProgressFill value={62} /></mockStyle.Progress>
                            <span className='text-[11px] text-ash shrink-0'>62%</span>
                        </div>
                        {
                            questions.map((question) => (
                                <mockStyle.Row key={question.no}>
                                    <span className='font-mono text-[11px] text-ash w-[22px] shrink-0'>Q{question.no}</span>
                                    <span className='flex-1 min-w-0 truncate'>{question.text}</span>
                                    <span className='hidden xl:inline text-[11px] text-ash w-[48px] shrink-0'>{question.level}</span>
                                    <span className='hidden lg:flex w-[56px] shrink-0'>
                                        {
                                            question.people.map((color, index) => (
                                                <homeStyle.Avatar key={index} color={color} size={20} />
                                            ))
                                        }
                                    </span>
                                    <span className='w-[78px] shrink-0 flex justify-end'>
                                        <homeStyle.StatusPill status={question.status}>
                                            {statusLabel[question.status]}
                                        </homeStyle.StatusPill>
                                    </span>
                                </mockStyle.Row>
                            ))
                        }
                        <div className='h-[28px]' />
                    </div>
                </div>
            </mockStyle.Window>
            <mockStyle.FloatingCard data-float>
                <div className='flex items-center justify-between'>
                    <homeStyle.Eyebrow className='!text-[10px]'>Question 14</homeStyle.Eyebrow>
                    <span className='inline-flex items-center gap-1 text-[11px] text-ash'>
                        <FiMessageCircle size={11} /> 8
                    </span>
                </div>
                <div className='text-[13px] font-semibold text-ink leading-[1.4]'>
                    Which traversal visits the root before its subtrees?
                </div>
                <mockStyle.Option><mockStyle.OptionKey>A</mockStyle.OptionKey>In-order</mockStyle.Option>
                <mockStyle.Option correct><mockStyle.OptionKey correct>B</mockStyle.OptionKey>Pre-order</mockStyle.Option>
                <mockStyle.Option><mockStyle.OptionKey>C</mockStyle.OptionKey>Post-order</mockStyle.Option>
            </mockStyle.FloatingCard>
        </div>
    )
}

export default ProductMock
