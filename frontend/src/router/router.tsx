import { Routes, Route } from "react-router-dom"
import SignUp from "../pages/signUp/signUp"
import Home from "../pages/home/home"
import TopBar from "../components/top bar/topBar"
import About from "../pages/about/about"
import Questions from "../pages/questions/questions"
import Login from "../pages/login/login"
import ForgotPassword from "../pages/forgotPassword/forgotPassword"
import Pod from "../pages/pod/pod"
import TestConfig from "../pages/test/pages/testConfig/testConfig"
import Session from "../pages/test/pages/session/session"
import Results from "../pages/test/pages/results/results"
import Notification from "../pages/notification/notification"
import Profile from "../pages/profile/profile"
import Legal from "../pages/legal/legal"
import Contact from "../pages/contact/contact"
import NotFound from "../pages/notFound/notFound"

const authRoutes = [
    {
        path : '/auth/login',
        route : Login
    },
    {
        path : '/auth/signup',
        route : SignUp
    },
    {
        path : '/auth/forgot',
        route : ForgotPassword
    }
]

const pageRoutes = [
    {
        path : '/questions/:courseID',
        route : Questions
    },
    {
        path : '/test/session',
        route : Session
    },
    {
        path : '/test/results',
        route : Results
    },
    {
        path : '/profile',
        route : Profile
    },
    {
        path : '/about',
        route : About
    },
    {
        path : '/usage/terms',
        route : () => <Legal kind='terms'/>
    },
    {
        path : '/usage/privacy',
        route : () => <Legal kind='privacy'/>
    },
    {
        path : '/contact',
        route : Contact
    },
]

export const navRoutes = [
    {
        name : 'home',
        path : '/',
        route : Home
    },
    {
        name : 'questions',
        path : '/questions',
        route : Questions
    },
    {
        name : 'challenges',
        path : '/challenges',
        route : Pod
    },
    {
        name : 'test',
        path : '/test/testconfig',
        route : TestConfig
    },
    {
        name : 'notification',
        path : '/notification',
        route : Notification
    },
]

const Router = () => {
    return(
        <Routes>
            <Route path={'/'} element={<TopBar />}>
                {
                    [...navRoutes, ...pageRoutes, ...authRoutes].map((path, index : number)=>{
                        return(
                            <Route key={index} path={path.path} element={<path.route />} />
                        )
                    })
                }
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default Router
