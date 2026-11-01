import { Link, useNavigate } from 'react-router-dom'
import * as loginStyle from './login.styled'
import { Fragment, useState } from 'react'
import { RiLockPasswordFill } from 'react-icons/ri'
import {logos} from '../../assets'
import { IoEnter } from 'react-icons/io5'
import { MdEmail } from 'react-icons/md'
import theme from '../../styles/theme'
import axios from 'axios'
import Cookies from 'universal-cookie'
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../../components/reactToastify/toastifyCustomStyles.css"
import { BASE_URL } from '../../variables/variables'
import Input from '../../components/UI/input/input'
import { inputValuesType } from '../../utils/types'

const Login = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const navigate = useNavigate()
    const data = {
        email : email,
        password : password
    }

    const cookies = new Cookies()
    const submitHandler = async (e:any) =>{
        e.preventDefault()
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, data,
            {
                validateStatus: () => true
            })
            if(response.status === 200){
                toast.success(
                    "Login Successfull",
                    {
                        hideProgressBar : true,
                        closeOnClick : true
                    }
                )
                const {accessToken} = response.data
                console.log(accessToken)
                cookies.remove('jwtToken')
                cookies.set('jwtToken', accessToken, {
                    domain : "localhost", path : "/"
                });
                console.log(cookies.get('jwtToken'))
                navigate("/questions")
            }
            else if(response.status === 404){
                toast.error(
                    "Invalid Credentials",
                    {
                        hideProgressBar : true,
                        closeOnClick : true
                    }
                )
            }
        } catch (error) {
            toast.error(
                "Error Signing in, Please try again later",
                {
                    hideProgressBar : true,
                    closeOnClick : true
                }
            )
        }
    }

    const [inputValues] = useState<inputValuesType[]>([
        {
            title : "Email",
            type : "email",
            placeholder : "Input email",
            icon : MdEmail,
            value : email,
            setValue : setEmail,
            errorMessage : null
        },
        {
            title : "Password",
            type : "password",
            placeholder : "Input Password",
            icon : RiLockPasswordFill,
            value : password,
            setValue : setPassword,
            errorMessage : null
        },
    ])


    const [terms] = useState([
        {
            name : 'Terms',
            route : '/usage/terms'
        },
        {
            name : 'Privacy',
            route : '/usage/privacy'
        },
        {
            name : 'Contact',
            route : '/contact'
        }
    ])

    return(
        <loginStyle.Main>
            <loginStyle.Head>
                <loginStyle.Avatar
                    src={logos.logoMark}
                />
                <loginStyle.Title>Log in to PrepRoom</loginStyle.Title>
                <loginStyle.Subtitle>Welcome back. Pick up where you left off.</loginStyle.Subtitle>
            </loginStyle.Head>
            <loginStyle.Container
                onSubmit={(e)=>submitHandler(e)}
            >
                {
                    inputValues.map((inputValuesMap, index:number)=>{
                        return(
                            <Fragment key={index}>
                                <Input 
                                    value={inputValuesMap.value}
                                    setState={inputValuesMap.setValue}
                                    type={inputValuesMap.type}
                                    placeholder={inputValuesMap.placeholder ?? ''}
                                    PreIcon={inputValuesMap.icon}
                                />
                            </Fragment>
                        )
                    })
                }
                <Link to='/auth/forgot' className='self-end text-[13px] font-semibold text-muted hover:text-ink'>
                    Forgot password?
                </Link>
                <loginStyle.Submit
                    type='submit'
                >
                    Log in <IoEnter
                        size={"20px"}
                        color={theme.colors.background.light.white}
                    />
                </loginStyle.Submit>
            </loginStyle.Container>
            <loginStyle.HaveAnAccount>
                New to PrepRoom? 
                <loginStyle.Link>
                    <Link to={"/auth/signup"}>Sign up</Link>
                </loginStyle.Link>
            </loginStyle.HaveAnAccount>
            <loginStyle.Terms>
                {
                    terms.map((termsMap, index : number)=>{
                        return(
                            <Link 
                                key={index}
                                to={termsMap.route}>
                                {termsMap.name}
                            </Link>
                        )
                    })
                }
            </loginStyle.Terms>
        </loginStyle.Main>
    )
}

export default Login