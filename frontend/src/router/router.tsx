import { Routes, Route } from "react-router-dom"
import SignUp from "../pages/signUp/signUp"
import Home from "../pages/home/home"
import AppShell from "../components/shell/appShell"
import SiteShell from "../components/shell/siteShell"
import FocusShell from "../components/shell/focusShell"
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
import Today from "../pages/today/today"
import ResetPassword from "../pages/resetPassword/resetPassword"

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
    },
    {
        path : '/auth/reset',
        route : ResetPassword
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
        name : 'today',
        path : '/today',
        route : Today
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

// Which frame a route lives in: the app (sidebar), the site (marketing bar), or focus (test in progress)
const appPaths = ['/today', '/questions', '/questions/:courseID', '/challenges', '/test/testconfig', '/test/results', '/notification', '/profile']
const all = [...navRoutes, ...pageRoutes]
const appRoutes = all.filter((route) => appPaths.includes(route.path))
const siteRoutes = all.filter((route) => !appPaths.includes(route.path) && route.path !== '/test/session')

const Router = () => {
    return(
        <Routes>
            <Route element={<AppShell />}>
                {appRoutes.map((route) => <Route key={route.path} path={route.path} element={<route.route />} />)}
            </Route>
            <Route element={<FocusShell />}>
                <Route path='/test/session' element={<Session />} />
            </Route>
            <Route element={<SiteShell />}>
                {siteRoutes.map((route) => <Route key={route.path} path={route.path} element={<route.route />} />)}
                <Route path='*' element={<NotFound />} />
            </Route>
            <Route element={<SiteShell bare />}>
                {authRoutes.map((route) => <Route key={route.path} path={route.path} element={<route.route />} />)}
            </Route>
        </Routes>
    )
}

export default Router
