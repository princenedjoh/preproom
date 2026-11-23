import { useSyncExternalStore } from 'react'
import { api, isOffline } from '../api/client'
import { courses as sampleCourses, questions as sampleQuestions, Course, Question, Difficulty } from './sample'

// The course catalogue and a cache of questions seen so far. It starts with the
// bundled sample content and switches to the API as soon as /courses answers, so
// every screen renders immediately and still works when the server is down.

interface CatalogState {
    source : 'sample' | 'api'
    ready : boolean
    courses : Course[]
    questions : Map<string, Question>
}

let state : CatalogState = {
    source : 'sample',
    ready : false,
    courses : sampleCourses,
    questions : new Map(sampleQuestions.map((question) => [question.id, question])),
}
const listeners = new Set<() => void>()
const emit = (next : Partial<CatalogState>) => {
    state = { ...state, ...next }
    listeners.forEach((listener) => listener())
}
const subscribe = (listener : () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

export const useCatalog = () => useSyncExternalStore(subscribe, () => state)
export const catalogSource = () => state.source

/* Lookups */

export const getCourse = (id? : string | null) =>
    state.courses.find((course) => course.id === id || course.uuid === id) ?? state.courses[0]

// Server records carry course UUIDs; the app routes by slug
export const slugOf = (id : string) => state.courses.find((course) => course.uuid === id || course.id === id)?.id ?? id

export const getQuestion = (id : string) => state.questions.get(id)
export const cachedQuestions = () => Array.from(state.questions.values())

const normalize = (item : any) : Question => ({
    id : item.id,
    courseID : slugOf(item.courseID),
    topic : item.topic ?? 'General',
    difficulty : (item.difficulty ?? 'Medium') as Difficulty,
    year : item.year ?? new Date().getFullYear(),
    question : item.question,
    options : item.options ?? [],
    answer : typeof item.answer === 'number' ? item.answer : -1,
    explanation : item.explanation ?? '',
    discussions : item.discussions ?? 0,
    saves : item.saves ?? 0,
    institution : item.institution ?? null,
    ...(item.stats ? { stats : item.stats } : {}),
})

export const normalizeQuestion = (item : any) => {
    const question = normalize(item)
    // Never overwrite a cached answer with a hidden one (tests hide answers until submit)
    const cached = state.questions.get(question.id)
    if(question.answer < 0 && cached) question.answer = cached.answer
    return question
}

const remember = (questions : Question[]) => {
    const map = new Map(state.questions)
    questions.forEach((question) => map.set(question.id, question))
    emit({ questions : map })
}

/* Loading */

let loading : Promise<void> | null = null

export const loadCatalog = () => {
    loading = loading ?? api.get('/courses')
        .then(({ data }) => {
            const courses : Course[] = (data.items ?? []).map((item : any) => ({
                id : item.slug, uuid : item.id, code : item.code, name : item.name, color : item.color ?? '#646464', questions : item.questions ?? 0,
            }))
            if(courses.length === 0) throw new Error('empty catalog')
            emit({ source : 'api', ready : true, courses, questions : new Map() })
        })
        .catch(() => emit({ ready : true }))
    return loading
}

export const fetchQuestions = async (courseID : string) : Promise<Question[]> => {
    await loadCatalog()
    if(state.source === 'api'){
        try {
            const { data } = await api.get(`/courses/${slugOf(courseID)}/questions`, { params : { limit : 200 } })
            const questions = (data.items ?? []).map(normalize)
            remember(questions)
            return questions
        } catch(error) {
            if(!isOffline(error)) return []
        }
    }
    return sampleQuestions.filter((question) => question.courseID === courseID)
}

export const fetchPapers = async (courseID : string) : Promise<number[]> => {
    if(state.source === 'api'){
        try {
            const { data } = await api.get(`/courses/${slugOf(courseID)}/papers`)
            return Array.from(new Set<number>((data.items ?? []).map((item : any) => item.year))).sort((a, b) => b - a)
        } catch { /* fall through to local */ }
    }
    return Array.from(new Set(sampleQuestions.filter((question) => question.courseID === courseID).map((question) => question.year))).sort((a, b) => b - a)
}
