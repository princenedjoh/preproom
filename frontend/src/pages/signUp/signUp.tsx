import { Link, useNavigate } from 'react-router-dom'
import * as signUpStyle from './signUp.styled'
import { useState } from 'react'
import { RiLockPasswordFill } from 'react-icons/ri'
import {logos} from '../../assets'
import { IoEnter } from 'react-icons/io5'
import { MdEmail } from 'react-icons/md'
import theme from '../../styles/theme'
import axios from 'axios'
import Cookies from 'universal-cookie'
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../../components/reactToastify/toastifyCustomStyles.css"
import { BASE_URL } from '../../variables/variables'
import { BiSolidUserPin } from 'react-icons/bi'
import { PiGenderIntersexBold } from 'react-icons/pi'
import Input from '../../components/UI/input/input'
import Dropdown, { tagType } from '../../components/UI/input/dropdown'

const SignUp = () => {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [gender, setGender] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [genderTypes] = useState<tagType[]>([
        {
            name : "Male",
            id : "male"
        },
        {
            name : "Female",
            id : "female"
        },
        {
            name : "Other",
            id : "other"
        },
    ])

    const navigate = useNavigate()
    const data = {
        firstName,
        lastName,
        gender,
        email,
        password
    }

    const cookies = new Cookies()
    const submitHandler = async (e:any) =>{
        e.preventDefault()
        try {
            const response = await axios.post(`${BASE_URL}/users/add`, data,
            {
                validateStatus: () => true
            })
            if(response.status === 200){
                toast.success(
                    "signUp Successfull",
                    {
                        hideProgressBar : true,
                        closeOnClick : true
                    }
                )
                const {accessToken} = response.data
                cookies.set('jwtToken', accessToken);
                navigate("/auth/login")
            }
            else if(response.status === 409){
                toast.error(
                    response.data,
                    {
                        hideProgressBar : true,
                        closeOnClick : true
                    }
                )
            }
            else{
                toast.error(
                    "Unable to sign up, please try again later",
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
        <signUpStyle.Main>
            <ToastContainer/>
            <signUpStyle.Head>
                <signUpStyle.Avatar
                    src={logos.logoMark}
                />
                <signUpStyle.Title>Create your account</signUpStyle.Title>
                <signUpStyle.Subtitle>Free forever. Start practicing in under a minute.</signUpStyle.Subtitle>
            </signUpStyle.Head>
            <signUpStyle.Container
                onSubmit={(e)=>submitHandler(e)}
            >
                <div className='grid grid-cols-2 gap-3 w-full'>
                <Input 
                    placeholder='First name'
                    value={firstName}
                    setState={setFirstName}
                    type="text"
                    variant='borderless'
                    PreIcon={BiSolidUserPin}
                />
                <Input 
                    placeholder='Last name'
                    value={lastName}
                    setState={setLastName}
                    type="text"
                    PreIcon={BiSolidUserPin}
                />
                </div>
                <Input 
                    placeholder='Email'
                    value={email}
                    setState={setEmail}
                    type="email"
                    PreIcon={MdEmail}
                />
                <Dropdown 
                    placeholder='Gender'
                    tags={genderTypes}
                    setValue={setGender}
                    value={gender}
                    PreIcon={PiGenderIntersexBold}
                />
                <Input 
                    type="password"
                    value={password}
                    setState={setPassword}
                    placeholder='Password'
                    allowClear
                    PreIcon={RiLockPasswordFill}
                />
                <signUpStyle.Submit
                    type='submit'
                >
                    Create account <IoEnter
                        size={"20px"}
                        color={theme.colors.background.light.white}
                    />
                </signUpStyle.Submit>
            </signUpStyle.Container>
            <signUpStyle.HaveAnAccount>
                Already have an account? 
                <signUpStyle.Link>
                    <Link to={"/auth/login"}>Log in</Link>
                </signUpStyle.Link>
            </signUpStyle.HaveAnAccount>
            <signUpStyle.Terms>
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
            </signUpStyle.Terms>
        </signUpStyle.Main>
    )
}

export default SignUp