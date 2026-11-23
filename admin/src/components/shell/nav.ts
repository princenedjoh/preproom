import { IconType } from 'react-icons'
import {
    FiGrid, FiPlusSquare, FiDatabase, FiFlag, FiBell, FiHome, FiLayers, FiBookOpen, FiHash, FiShield, FiUsers, FiKey,
} from 'react-icons/fi'

export interface NavItem {
    label : string
    path : string
    icon : IconType
    badge? : 'flags' | 'unread'
}

export interface NavSection {
    title? : string
    items : NavItem[]
}

export const navSections : NavSection[] = [
    {
        items : [
            { label : 'Overview', path : '/', icon : FiGrid },
            { label : 'Add question', path : '/addQuestions', icon : FiPlusSquare },
            { label : 'Question bank', path : '/questions', icon : FiDatabase },
        ],
    },
    {
        title : 'Alerts',
        items : [
            { label : 'Flags', path : '/alerts/flags', icon : FiFlag, badge : 'flags' },
            { label : 'Notifications', path : '/alerts/notification', icon : FiBell, badge : 'unread' },
        ],
    },
    {
        title : 'Academics',
        items : [
            { label : 'Schools', path : '/academics/schools', icon : FiHome },
            { label : 'Programs', path : '/academics/programs', icon : FiLayers },
            { label : 'Courses', path : '/academics/courses', icon : FiBookOpen },
            { label : 'Topics', path : '/academics/topics', icon : FiHash },
        ],
    },
    {
        title : 'People',
        items : [
            { label : 'Administrators', path : '/people/admins', icon : FiKey },
            { label : 'Supervisors', path : '/people/supervisors', icon : FiShield },
            { label : 'Moderators', path : '/people/moderators', icon : FiUsers },
        ],
    },
]

const allItems = navSections.flatMap((section) => section.items.map((item) => ({ ...item, section : section.title })))

export const isActive = (path : string, pathname : string) =>
    path === '/' ? pathname === '/' : pathname.toLowerCase().startsWith(path.toLowerCase())

export const currentNav = (pathname : string) => allItems.find((item) => isActive(item.path, pathname))
