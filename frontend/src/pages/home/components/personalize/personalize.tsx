import * as i from '../../../../utils/defaultImports'
import * as homeStyle from '../../home.styled'
import { RiCheckboxMultipleFill } from "react-icons/ri";
import { GiPapers } from "react-icons/gi";
import { HiTrophy } from "react-icons/hi2";
import { ImPowerCord } from "react-icons/im";
import { FaLightbulb } from "react-icons/fa";
import { IoLocationSharp } from "react-icons/io5";
import { FaUsers } from "react-icons/fa6";
import { FiArrowRight } from "react-icons/fi";

const modes = [
    {
        icon : RiCheckboxMultipleFill,
        tag : 'MCQs',
        title : 'Solve multiple choice questions',
        text : 'Practice across subjects, filter by topic and difficulty, and reveal the answer when you are ready.',
        route : '/questions',
        preview : ['Easy', 'Medium', 'Hard'],
    },
    {
        icon : GiPapers,
        tag : 'Past papers',
        title : 'Work through real past papers',
        text : 'Prepare with the questions your department has actually set, organised by course and year.',
        route : '/questions',
        preview : ['2022', '2023', '2024'],
    },
    {
        icon : HiTrophy,
        tag : 'Challenges',
        title : 'Sharpen up with daily challenges',
        text : 'A short set of thought-provoking questions every day to keep your streak and your memory alive.',
        route : '/challenges',
        preview : ['Today', 'Streak', 'Rank'],
    },
]

const extras = [
    {
        icon : ImPowerCord,
        title : 'Efficient preparation',
        text : 'Focused practice that aligns with what you need to revise.',
    },
    {
        icon : FaLightbulb,
        title : 'Flexible schedule',
        text : 'Study plans that fit your lifestyle and keep you on track.',
    },
    {
        icon : IoLocationSharp,
        title : 'Study anywhere',
        text : 'Pick up where you left off on any device, on the go.',
    },
    {
        icon : FaUsers,
        title : 'Peer guidance',
        text : 'Discuss every question with students on the same course.',
    },
]

const Personalize = () => {

    const navigate = i.useNavigate()

    return (
        <homeStyle.Section>
            <homeStyle.Container className='flex flex-col gap-12 md:gap-14 pb-20 md:pb-28'>
                <div data-reveal className='flex flex-col items-center text-center gap-4 max-w-[720px] mx-auto'>
                    <homeStyle.Eyebrow>Everything in one room</homeStyle.Eyebrow>
                    <homeStyle.Heading>One place for every way you prepare.</homeStyle.Heading>
                    <homeStyle.Lead>
                        Pick a course, choose the topics and difficulty, then practice the way that suits the exam in front of you.
                    </homeStyle.Lead>
                </div>
                <div data-stagger className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {
                        modes.map((mode) => (
                            <homeStyle.Card key={mode.tag} className='justify-between gap-6'>
                                <div className='flex flex-col gap-3'>
                                    <div className='flex items-center justify-between'>
                                        <homeStyle.IconTile><mode.icon size={18} /></homeStyle.IconTile>
                                        <homeStyle.Eyebrow>{mode.tag}</homeStyle.Eyebrow>
                                    </div>
                                    <homeStyle.Title>{mode.title}</homeStyle.Title>
                                    <homeStyle.Body>{mode.text}</homeStyle.Body>
                                </div>
                                <div className='flex flex-col gap-4'>
                                    <div className='flex gap-2'>
                                        {
                                            mode.preview.map((chip) => (
                                                <span key={chip} className='rounded-full bg-mist border border-bone px-3 py-1 text-[12px] font-semibold text-carbon'>
                                                    {chip}
                                                </span>
                                            ))
                                        }
                                    </div>
                                    <homeStyle.TextLink 
                                        type='button'
                                        onClick={()=>navigate(mode.route)}
                                    >
                                        Get started <FiArrowRight size={14} />
                                    </homeStyle.TextLink>
                                </div>
                            </homeStyle.Card>
                        ))
                    }
                </div>
                <div data-stagger className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 pt-2'>
                    {
                        extras.map((extra) => (
                            <div key={extra.title} className='flex flex-col gap-2'>
                                <homeStyle.IconTile><extra.icon size={16} /></homeStyle.IconTile>
                                <div className='text-[16px] font-bold text-ink tracking-[-0.01em] pt-1'>{extra.title}</div>
                                <homeStyle.Body>{extra.text}</homeStyle.Body>
                            </div>
                        ))
                    }
                </div>
            </homeStyle.Container>
        </homeStyle.Section>
    )
}

export default Personalize
