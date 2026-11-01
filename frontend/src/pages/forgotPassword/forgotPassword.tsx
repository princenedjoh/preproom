import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as loginStyle from '../login/login.styled'
import * as kit from '../../styles/kit'
import { logos } from '../../assets'
import { FiArrowLeft, FiMail } from "react-icons/fi";

const ForgotPassword = () => {

    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)

    return (
        <loginStyle.Main>
            <loginStyle.Head>
                <loginStyle.Avatar src={logos.logoMark}/>
                <loginStyle.Title>{sent ? 'Check your email' : 'Reset your password'}</loginStyle.Title>
                <loginStyle.Subtitle>
                    {sent ? `If an account exists for ${email}, we sent a link to reset your password.` : 'Enter the email you signed up with and we’ll send you a reset link.'}
                </loginStyle.Subtitle>
            </loginStyle.Head>
            {
                sent ?
                <kit.IconTile className='!w-14 !h-14'><FiMail size={22}/></kit.IconTile>
                :
                <loginStyle.Container onSubmit={(e)=>{ e.preventDefault(); setSent(true) }}>
                    <kit.TextInput type='email' required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder='you@school.edu' aria-label='Email'/>
                    <loginStyle.Submit type='submit'>Send reset link</loginStyle.Submit>
                </loginStyle.Container>
            }
            <loginStyle.Terms>
                <Link to='/auth/login' className='inline-flex items-center gap-1'><FiArrowLeft size={13}/> Back to log in</Link>
            </loginStyle.Terms>
        </loginStyle.Main>
    )
}

export default ForgotPassword
