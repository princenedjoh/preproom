import * as i from '../../../../utils/defaultImports'
import * as homeStyle from '../../home.styled'
import { FaCheck } from "react-icons/fa6";
import { FiArrowRight, FiMessageCircle } from "react-icons/fi";

const benefits = [
    'Conquer exams together',
    'Engage with a vibrant community of students',
    'Share study resources and work through hard questions',
]

const thread = [
    { initials : 'AK', color : i.theme.colors2.brand.violet, name : 'Ama K.', text : 'Why is pre-order B and not A? I keep mixing them up.' },
    { initials : 'KO', color : i.theme.colors2.brand.blue, name : 'Kofi O.', text : 'Pre = root first. In-order puts the root between the subtrees.' },
    { initials : 'EM', color : i.theme.colors2.brand.teal, name : 'Esi M.', text : 'Drawing the tree and tracing it helped me a lot here.' },
]

const Benefit = () => {

    const navigate = i.useNavigate()

    return (
        <homeStyle.Section>
            <homeStyle.Container className='py-20 md:py-28'>
                <div 
                    data-reveal
                    className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[20px] px-6 py-14 sm:px-10 md:px-14 md:py-20'
                    style={{ background : i.theme.gradients.darkFade }}
                >
                    <div className='flex flex-col items-start gap-6'>
                        <homeStyle.Eyebrow light>Community</homeStyle.Eyebrow>
                        <homeStyle.Heading light>Study smarter, not harder.</homeStyle.Heading>
                        <homeStyle.Lead light>
                            Every question has a discussion, so you are never stuck alone with a wrong answer.
                        </homeStyle.Lead>
                        <ul className='flex flex-col gap-3'>
                            {
                                benefits.map((benefit) => (
                                    <li key={benefit} className='flex items-start gap-3 text-[15px] text-white'>
                                        <FaCheck size={15} className='mt-[3px] shrink-0 text-brand-mint' />
                                        {benefit}
                                    </li>
                                ))
                            }
                        </ul>
                        <homeStyle.LightButton type='button' onClick={()=>navigate('/auth/signup')}>
                            Join PrepRoom <FiArrowRight size={16} />
                        </homeStyle.LightButton>
                    </div>
                    <div className='flex flex-col gap-3'>
                        <div className='flex items-center gap-2 text-[13px] text-fog'>
                            <FiMessageCircle size={14} /> Discussion · Question 14
                        </div>
                        {
                            thread.map((message, index) => (
                                <div 
                                    key={message.name}
                                    data-thread
                                    className={`flex gap-3 rounded-[12px] p-4 border border-on-inverse/10 bg-on-inverse/[0.04] ${index === 1 ? 'lg:ml-8' : ''}`}
                                >
                                    <homeStyle.Avatar color={message.color} size={32} ring='transparent'>{message.initials}</homeStyle.Avatar>
                                    <div className='flex flex-col gap-1'>
                                        <span className='text-[13px] font-semibold text-white'>{message.name}</span>
                                        <span className='text-[14px] leading-[1.5] text-fog'>{message.text}</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </homeStyle.Container>
        </homeStyle.Section>
    )
}

export default Benefit
