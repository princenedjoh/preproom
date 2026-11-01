import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import Footer from '../../components/footer/footer'
import { FiArrowRight } from "react-icons/fi";

const principles = [
    { number : '01', title : 'Real questions first', text : 'Practice with what lecturers have actually set, not generic quizzes.' },
    { number : '02', title : 'Explain every answer', text : 'A right answer is only useful if you know why it is right.' },
    { number : '03', title : 'Learn together', text : 'Every question has a discussion, so nobody gets stuck alone.' },
]

const About = () => {

    const navigate = useNavigate()

    return (
        <>
            <kit.Page className='!pb-0'>
                <kit.PageInner className='!gap-20 pb-24'>
                    <div className='flex flex-col gap-6 max-w-[860px]'>
                        <kit.Eyebrow>About PrepRoom</kit.Eyebrow>
                        <kit.Display as='h1' className='!text-[44px] md:!text-[64px]'>
                            Built by students who were tired of hunting for past papers.
                        </kit.Display>
                        <kit.Lead className='max-w-[640px]'>
                            PrepRoom brings past questions, explanations and a community of classmates into one place,
                            so revision time goes into learning instead of searching.
                        </kit.Lead>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {
                            principles.map((item) => (
                                <div key={item.number} className='flex flex-col gap-3 rounded-[12px] bg-plaster p-7'>
                                    <span className='font-display font-bold text-[60px] leading-none tracking-[-0.04em] text-onyx'>{item.number}</span>
                                    <kit.Title className='pt-2'>{item.title}</kit.Title>
                                    <kit.Body>{item.text}</kit.Body>
                                </div>
                            ))
                        }
                    </div>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-[20px] p-10' style={{ background : 'linear-gradient(rgb(17, 17, 17) 24%, rgb(0, 0, 0))' }}>
                        <kit.Heading light className='!text-[30px] md:!text-[40px] max-w-[520px]'>Start practicing with your course today.</kit.Heading>
                        <kit.LightButton type='button' onClick={()=>navigate('/auth/signup')}>Create a free account <FiArrowRight size={16}/></kit.LightButton>
                    </div>
                </kit.PageInner>
            </kit.Page>
            <Footer/>
        </>
    )
}

export default About
