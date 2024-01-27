import { images } from '../../../../assets'
import * as i from '../../../../utils/defaultImports'
import * as experienceStyle from './experirence.style'

const Experience = () => {

    const [data, setData] = i.useState([
        {
            image : images.gradHat,
            title : 'Boost your performance',
            text : 'Leverage detailed insights to focus your efforts on areas that need improvements'
        },
        {
            image : images.cert,
            title : 'Personalize your studies',
            text : 'Tailor your study sessions by selecting specific topics, setting study goals and creating a personalized study plan'
        },
        {
            image : images.smartPhone,
            title : 'Study anytime anywhere',
            text : 'Access PrepRoom on your favorite device, allowing you to study on the go.'
        },
    ])

    return (
        <experienceStyle.Main>
            <i.Flex 
                direction='column'
                width={`${i.minimumWidth}px`}
                align='center'
                gap={20}
            >
                <i.AppTypography
                    size={i.TypographySize.lg2}
                    bold={i.TypographyBold.md}
                    textColor={i.theme.colors2.main.primary}
                >
                    Experience the power of PrepRoom
                </i.AppTypography>
                <i.Flex 
                    width={`${i.minimumWidth}px`}
                    justify='center'
                    gap={50}
                >
                    {
                        data.map((item, index : number) => {
                            return (
                                <i.Flex
                                    key={index}
                                    direction='column'
                                    align='center'
                                >
                                    <i.AppTypography
                                        size={i.TypographySize.md2}
                                        bold={i.TypographyBold.md}
                                        textColor={i.theme.colors2.main.primary}
                                    >
                                        {item.title}
                                    </i.AppTypography>
                                    <i.AppTypography
                                        textAlign='center'
                                    >
                                        {item.text}
                                    </i.AppTypography>
                                </i.Flex>
                            )
                        })
                    }
                </i.Flex>
            </i.Flex>
        </experienceStyle.Main>
    )
}

export default Experience