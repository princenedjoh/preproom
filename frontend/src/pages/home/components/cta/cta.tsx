import * as i from '../../../../utils/defaultImports'
import * as homeStyle from '../../home.styled'
import { FiArrowRight } from "react-icons/fi";

const Cta = () => {

    const navigate = i.useNavigate()

    return (
        <homeStyle.Section>
            <homeStyle.Container className='pb-24 md:pb-32'>
                <div data-reveal className='flex flex-col items-center text-center gap-6 max-w-[760px] mx-auto'>
                    <homeStyle.Heading className='md:!text-[60px]'>Your next exam starts here.</homeStyle.Heading>
                    <homeStyle.Lead>Create a free account and solve your first question in under a minute.</homeStyle.Lead>
                    <div className='flex flex-wrap justify-center gap-3'>
                        <homeStyle.DarkButton type='button' onClick={()=>navigate('/auth/signup')}>
                            Get started. It's free <FiArrowRight size={16} />
                        </homeStyle.DarkButton>
                        <homeStyle.GhostButton type='button' onClick={()=>navigate('/questions')}>
                            Browse questions
                        </homeStyle.GhostButton>
                    </div>
                </div>
            </homeStyle.Container>
        </homeStyle.Section>
    )
}

export default Cta
