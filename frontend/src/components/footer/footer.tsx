import { AppTypography, ClickableTab } from '../../styles/global'
import { TypographySize } from '../../styles/style.types'
import * as footerStyle from './footer.style'
import { BsInstagram, BsLinkedin, BsFacebook, BsTwitter } from 'react-icons/bs'
import { TiSocialYoutube } from 'react-icons/ti'
import { FaTiktok } from 'react-icons/fa'
import { Wordmark } from '../brand/logo'
import { useNavigate } from 'react-router-dom'
import { SiThreadless } from 'react-icons/si'
import theme from '../../styles/theme'
import Tooltip from '@mui/material/Tooltip';

const socials = [
    {
        name : "instagram",
        icon : BsInstagram,
        route : "#"
    },
    {
        name : "linkedin",
        icon : BsLinkedin,
        route : "#"
    },
    {
        name : "facebook",
        icon : BsFacebook,
        route : "#"
    },
    {
        name : "twitter",
        icon : BsTwitter,
        route : "#"
    },
        {
        name : "youtube",
        icon : TiSocialYoutube,
        route : "#"
    },
    {
        name : "tiktok",
        icon : FaTiktok,
        route : "#"
    },
    {
        name : "threads",
        icon : SiThreadless,
        route : "#"
    },
]

interface propsType {
    rigid? : boolean
}

const columns = [
    {
        title : 'Practice',
        links : [
            { name : 'Questions', route : '/questions' },
            { name : 'Challenges', route : '/challenges' },
            { name : 'Take a test', route : '/test/testconfig' },
        ]
    },
    {
        title : 'Account',
        links : [
            { name : 'Log in', route : '/auth/login' },
            { name : 'Sign up', route : '/auth/signup' },
            { name : 'Notifications', route : '/notification' },
        ]
    },
    {
        title : 'Company',
        links : [
            { name : 'Terms', route : '/usage/terms' },
            { name : 'Privacy', route : '/usage/privacy' },
            { name : 'Contact', route : '/contact' },
        ]
    },
]

const Footer = ({rigid} : propsType) => {

    const navigate = useNavigate()
    const handleSocialClick = (link : string) => {
        window.open(link, '_blank')
    }

    return (
        <>
            <footerStyle.Main rigid={rigid}>
                <footerStyle.MainWrap>
                    <footerStyle.Columns>
                        <footerStyle.Brand>
                            <button type='button' className='w-fit' aria-label='PrepRoom home' onClick={()=>navigate('/')}><Wordmark/></button>
                            <AppTypography size={TypographySize.sm2} textColor={theme.colors2.gray.gray3} lineHeight={1.55}>
                                Past questions, daily challenges and timed tests for students who want to walk into exams prepared.
                            </AppTypography>
                        </footerStyle.Brand>
                        {
                            columns.map((column) => (
                                <footerStyle.Column key={column.title}>
                                    <footerStyle.ColumnTitle>{column.title}</footerStyle.ColumnTitle>
                                    {
                                        column.links.map((link) => (
                                            <footerStyle.FooterLink 
                                                key={link.name}
                                                type='button'
                                                onClick={()=>navigate(link.route)}
                                            >
                                                {link.name}
                                            </footerStyle.FooterLink>
                                        ))
                                    }
                                </footerStyle.Column>
                            ))
                        }
                    </footerStyle.Columns>
                    <footerStyle.Bottom>
                        <footerStyle.Rights>
                            © {new Date().getFullYear()} PrepRoom. All rights reserved.
                        </footerStyle.Rights>
                        <footerStyle.Socials>
                            {
                                socials.map((socialMap, index : number)=>{
                                    return (
                                        <Tooltip 
                                            title={socialMap.name} 
                                            arrow placement='top'
                                            key={index}>
                                            <ClickableTab padding='8px'>
                                                <socialMap.icon 
                                                    color={theme.colors2.gray.gray4}
                                                    onClick={()=>handleSocialClick(socialMap.route)}/>
                                            </ClickableTab>
                                        </Tooltip>
                                    )
                                })
                            }
                        </footerStyle.Socials>
                    </footerStyle.Bottom>
                </footerStyle.MainWrap>
            </footerStyle.Main>
        </>
    )
}

export default Footer
