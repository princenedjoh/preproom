import axios from 'axios'
import * as sample from './sample'

// Talks to the PrepRoom API (backend/API.md, "Admin" section). Reads fall back
// to sample data only when the API can't be reached at all; a reachable API
// that answers with an error is reported, never papered over.

export const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3001'

// Session cookie auth (httpOnly), shared with the student app
export const http = axios.create({ baseURL : BASE_URL, withCredentials : true, timeout : 8000 })

export const isOffline = (error : unknown) => axios.isAxiosError(error) && !error.response
export const status = (error : unknown) => axios.isAxiosError(error) ? error.response?.status : undefined

export const errorMessage = (error : unknown, fallback = 'Something went wrong. Try again.') => {
    if (isOffline(error)) return 'Can’t reach the PrepRoom API.'
    if (axios.isAxiosError(error)) return error.response?.data?.error?.message ?? fallback
    return fallback
}

/* Formatting */

const capitalise = <T extends string>(value : string) => (value ? value[0].toUpperCase() + value.slice(1) : value) as T

export const ago = (iso? : string | null) => {
    if (!iso) return '—'
    const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 172800) return 'Yesterday'
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return new Date(iso).toLocaleDateString(undefined, { day : 'numeric', month : 'short' })
}

/* Mappers: API shapes → the admin's display shapes in sample.ts */

const toQuestion = (item : any) : sample.Question => ({
    id : item.id,
    question : item.question ?? '',
    options : item.options ?? [],
    answer : item.answer ?? 0,
    explanation : item.explanation ?? '',
    courseID : item.courseID,
    topic : item.topic ?? '',
    topicID : item.topicID ?? undefined,
    difficulty : capitalise<sample.Difficulty>(item.difficulty ?? 'medium'),
    year : item.year ?? new Date().getFullYear(),
    author : item.author ?? '—',
    addedAt : ago(item.addedAt),
    flags : item.flags ?? 0,
})

const toFlag = (item : any) : sample.Flag => ({
    id : item.id,
    questionID : item.questionID,
    reporter : item.reporter ?? 'A student',
    issue : item.issue,
    comment : item.comment ?? '',
    suggestedAnswer : item.suggestedAnswer ?? undefined,
    status : item.status,
    raisedAt : ago(item.raisedAt),
    question : item.question === undefined ? undefined : {
        question : item.question, options : item.options ?? [], answer : item.answer ?? 0,
        courseID : item.courseID, courseCode : item.courseCode ?? '',
    },
})

const toPerson = (item : any) : sample.Person => ({
    id : item.id,
    name : item.name,
    email : item.email,
    role : capitalise<sample.Role>(item.role),
    courses : item.courses ?? [],
    questionsAdded : item.questionsAdded ?? 0,
    flagsResolved : item.flagsResolved ?? 0,
    status : capitalise<sample.Person['status']>(item.status),
    lastActive : item.status === 'invited' ? '—' : ago(item.lastActive),
    color : item.color ?? '#838383',
})

const staffKinds = ['flag', 'question', 'people']
const toNotification = (item : any) : sample.AdminNotification => ({
    id : item.id,
    kind : staffKinds.includes(item.kind) ? item.kind : 'system',
    title : item.title,
    body : item.body ?? '',
    time : ago(item.createdAt),
    read : !item.unread,
    link : item.link ?? undefined,
    createdAt : item.createdAt,
})

/* Reads */

export interface Loaded<T> { items : T[], live : boolean, error? : string }

const list = async <T,>(path : string, map : (item : any) => T, fallback : T[]) : Promise<Loaded<T>> => {
    try {
        const { data } = await http.get(path)
        const items : any[] = Array.isArray(data) ? data : data?.items ?? []
        return { items : items.map(map), live : true }
    } catch (error) {
        if (isOffline(error)) return { items : fallback, live : false }
        return { items : [], live : true, error : errorMessage(error) }
    }
}

export const fetchSchools = () => list<sample.School>('/admin/schools', (item) => ({ id : item.id, name : item.name }), sample.schools)

export const fetchPrograms = () => list<sample.Program>('/admin/programs',
    (item) => ({ id : item.id, name : item.name, schoolID : item.schoolID }), sample.programs)

export const fetchCourses = () => list<sample.Course>('/admin/courses', (item) => ({
    id : item.id, code : item.code ?? '', name : item.name, programID : item.programID ?? '',
    color : item.color ?? '#838383', total : item.questions ?? 0,
}), sample.courses)

export const fetchTopics = () => list<sample.Topic>('/admin/topics',
    (item) => ({ id : item.id, name : item.name, courseID : item.courseID, questions : item.questions ?? 0 }), sample.topics)

export const fetchFlags = () => list<sample.Flag>('/admin/flags?status=open,resolved,dismissed&limit=200', toFlag, sample.flags)

export const fetchPeople = () => list<sample.Person>('/admin/people', toPerson, sample.people)

export const fetchNotifications = () => list<sample.AdminNotification>('/notifications?limit=50', toNotification, sample.notifications)

export interface QuestionQuery { search? : string, courseID? : string, difficulty? : string, flagged? : boolean, offset? : number }
export interface QuestionPage { items : sample.Question[], total : number, live : boolean, error? : string }

export const PAGE_SIZE = 50

export const fetchQuestionPage = async (query : QuestionQuery = {}) : Promise<QuestionPage> => {
    try {
        const { data } = await http.get('/admin/questions', { params : {
            search : query.search || undefined,
            courseID : query.courseID || undefined,
            difficulty : query.difficulty || undefined,
            flagged : query.flagged || undefined,
            limit : PAGE_SIZE,
            offset : query.offset ?? 0,
        } })
        return { items : data.items.map(toQuestion), total : data.total, live : true }
    } catch (error) {
        if (!isOffline(error)) return { items : [], total : 0, live : true, error : errorMessage(error) }
        const items = sample.questions.filter((question) =>
            (!query.search || `${sample.plainText(question.question)} ${question.topic} ${question.author}`.toLowerCase().includes(query.search.toLowerCase()))
            && (!query.courseID || question.courseID === query.courseID)
            && (!query.difficulty || question.difficulty === query.difficulty)
            && (!query.flagged || question.flags > 0))
        return { items, total : items.length, live : false }
    }
}

export const fetchQuestions = async () : Promise<Loaded<sample.Question>> => {
    const page = await fetchQuestionPage()
    return { items : page.items, live : page.live, error : page.error }
}

export interface Overview {
    questions : { total : number, today : number, week : number }
    openFlags : number
    staff : { total : number, invited : number }
    learners : { total : number, activeThisWeek : number }
    weeklyActivity : number[]
    recentQuestions : sample.Question[]
    courses : (sample.Course & { openFlags : number, testsThisWeek : number })[]
}

export const fetchOverview = async () : Promise<{ overview : Overview, live : boolean }> => {
    try {
        const { data } = await http.get('/admin/overview')
        return { live : true, overview : {
            ...data,
            recentQuestions : data.recentQuestions.map(toQuestion),
            courses : data.courses.map((course : any) => ({ ...course, programID : '', total : course.questions })),
        } }
    } catch {
        const active = sample.people.filter((person) => person.status === 'Active').length
        return { live : false, overview : {
            questions : { total : sample.courses.reduce((sum, course) => sum + course.total, 0), today : 24, week : sample.weeklyActivity.slice(-7).reduce((a, b) => a + b, 0) },
            openFlags : sample.flags.filter((flag) => flag.status === 'open').length,
            staff : { total : sample.people.length, invited : sample.people.length - active },
            learners : { total : 1280, activeThisWeek : 412 },
            weeklyActivity : sample.weeklyActivity,
            recentQuestions : sample.questions.slice(0, 6),
            courses : sample.courses.map((course) => ({ ...course, openFlags : 0, testsThisWeek : 0 })),
        } }
    }
}

/* Writes: these throw; callers show errorMessage(error) */

export interface NewQuestion {
    question : string, options : string[], answer : number, explanation? : string, courseID : string,
    topicID? : string, topic? : string, difficulty : sample.Difficulty, year : number,
}

export const createQuestion = async (body : NewQuestion) => {
    // Difficulty is title-case in the API ('Easy' | 'Medium' | 'Hard'), unlike roles and statuses
    const { data } = await http.post('/admin/questions', body)
    return toQuestion(data)
}

export const deleteQuestion = (id : string) => http.delete(`/admin/questions/${id}`)

export const updateFlag = (id : string, change : { status : sample.FlagStatus, applyAnswer? : number, note? : string }) =>
    http.patch(`/admin/flags/${id}`, change)

export type CatalogEntity = 'schools' | 'programs' | 'courses' | 'topics'

export const createCatalogItem = async (entity : CatalogEntity, body : object) => (await http.post(`/admin/${entity}`, body)).data
export const updateCatalogItem = async (entity : CatalogEntity, id : string, body : object) => (await http.patch(`/admin/${entity}/${id}`, body)).data
export const deleteCatalogItem = (entity : CatalogEntity, id : string) => http.delete(`/admin/${entity}/${id}`)

export const invitePerson = async (body : { name : string, email : string, role : sample.Role, courses : string[] }) =>
    toPerson((await http.post('/admin/people/invite', { ...body, role : body.role.toLowerCase() })).data)
export const resendInvite = (id : string) => http.post(`/admin/people/${id}/resend-invite`, {})
export const updatePerson = (id : string, change : { role? : sample.Role, courses? : string[], status? : 'active' | 'disabled' }) =>
    http.patch(`/admin/people/${id}`, { ...change, role : change.role?.toLowerCase() })
export const removePerson = (id : string) => http.delete(`/admin/people/${id}`)

export const markNotificationsRead = (ids? : string[]) => http.post('/notifications/read', ids ? { ids } : {})

/* Auth */

export interface StaffUser { id : string, name : string, email : string, role : 'student' | 'moderator' | 'supervisor' | 'admin', color : string }

export const me = async () : Promise<StaffUser> => (await http.get('/auth/me')).data.user
export const login = async (email : string, password : string) : Promise<StaffUser> => (await http.post('/auth/login', { email, password })).data.user
export const logout = () => http.post('/auth/logout', {})

// Session additions and refetched pages can hold the same question
export const uniqueById = <T extends { id : string },>(items : T[]) => items.filter((item, index) => items.findIndex((other) => other.id === item.id) === index)

export const fetchQuestion = async (id : string) => toQuestion((await http.get(`/admin/questions/${id}`)).data)
