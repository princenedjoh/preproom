import * as i from '../../../../utils/defaultImports'
import * as heroStyle from './hero.style'
import * as homeStyle from '../../home.styled'
import ProductMock from '../productMock/productMock'
import { FaCheck } from "react-icons/fa6";
import { FiArrowRight } from "react-icons/fi";

const checks = [
    { lead : 'Practice smarter.', text : 'Past MCQs sorted by course, topic and difficulty.' },
    { lead : 'Learn faster.', text : 'An explanation and discussion for every answer.' },
    { lead : 'Stay sharp.', text : 'Daily challenges and timed mock tests.' },
]

const tags = ['MCQs', 'Past papers', 'Challenges', 'Tests', 'Discussions']

const Hero = () => {

    const navigate = i.useNavigate()

    return (
        <homeStyle.Section>
            <homeStyle.Container>
                <heroStyle.Main>
                    <heroStyle.Copy>
                        <heroStyle.Announcement data-hero-fade>
                            <heroStyle.Badge>New</heroStyle.Badge>
                            Daily challenges are live
                        </heroStyle.Announcement>
                        <homeStyle.Display data-hero-title>
                            Ace every exam, one question at a time.
                        </homeStyle.Display>
                        <heroStyle.Checks data-hero-fade>
                            {
                                checks.map((check) => (
                                    <heroStyle.Check key={check.lead}>
                                        <FaCheck size={16} />
                                        <span><b>{check.lead}</b> {check.text}</span>
                                    </heroStyle.Check>
                                ))
                            }
                        </heroStyle.Checks>
                        <heroStyle.Actions data-hero-fade>
                            <homeStyle.DarkButton
                                type='button'
                                className='!h-10 !px-5'
                                onClick={()=>navigate('/questions')}
                            >
                                Start practising, it's free <FiArrowRight size={16} />
                            </homeStyle.DarkButton>
                            <homeStyle.GhostButton
                                type='button'
                                className='!h-10'
                                onClick={()=>navigate('/test/testconfig')}
                            >
                                Take a test
                            </homeStyle.GhostButton>
                        </heroStyle.Actions>
                        <heroStyle.Tags data-hero-fade>
                            {
                                tags.map((tag, index) => (
                                    <homeStyle.TagPill key={tag} active={index === 0}>{tag}</homeStyle.TagPill>
                                ))
                            }
                        </heroStyle.Tags>
                    </heroStyle.Copy>
                    <heroStyle.Visual data-hero-visual>
                        <ProductMock />
                    </heroStyle.Visual>
                </heroStyle.Main>
            </homeStyle.Container>
        </homeStyle.Section>
    )
}

export default Hero
