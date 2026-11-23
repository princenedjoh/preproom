import { api, toApiError, ApiError } from '../../api/client'
import { Question } from '../../data/sample'
import { fetchQuestions, getCourse, normalizeQuestion, slugOf, loadCatalog } from '../../data/catalog'
import { progress, seededShuffle, dayKey, isSynced } from '../../store/progress'
import { toTestRun } from '../../store/session'
import { invalidate } from '../../api/useRemote'
import type { TestConfigState } from './pages/testConfig/testConfig'

// Runs a test either on the server (logged in: it picks, times and grades) or on
// this device. The session screen doesn't care which.

export interface Run {
    id : string | null          // server test id; null for a local test
    config : TestConfigState
    title : string
    questions : Question[]      // answers are -1 while hidden by the server
    answers : Record<string, number>
    deadline : number           // epoch ms
}

export interface TestResultState {
    config : TestConfigState
    questions : Question[]
    answers : Record<string, number>
    seconds : number
    title? : string
    rank? : number | null
    runID? : string
}

export class TestError extends Error {
    constructor(public problem : ApiError, public testID? : string){ super(problem.message) }
}

const localTitle = (config : TestConfigState) => {
    const course = getCourse(config.courseID)
    return config.mode === 'challenge' ? `Daily challenge · ${course.name}`
        : config.year ? `${course.name} · ${config.year} paper`
        : `${course.name} · ${config.difficulty === 'Mixed' ? 'Mixed practice' : config.difficulty}`
}

const fromServer = (test : any, config : TestConfigState) : Run => ({
    id : test.id,
    config : { ...config, courseID : slugOf(test.courseID ?? config.courseID) },
    title : test.title,
    questions : (test.questions ?? []).map(normalizeQuestion),
    answers : test.answers ?? {},
    deadline : new Date(test.endsAt).getTime(),
})

const resultFromServer = (result : any) : TestResultState => {
    const config = { ...result.config, courseID : slugOf(result.config?.courseID ?? result.courseID) } as TestConfigState
    const questions : Question[] = (result.questions ?? []).map(normalizeQuestion)
    return { config, questions, answers : result.answers ?? {}, seconds : result.seconds ?? 0, title : result.title, rank : result.rank, runID : result.id }
}

const recordServerResult = (result : any, state : TestResultState) => {
    const missed = state.questions.filter((question) => state.answers[question.id] !== question.answer).map((question) => question.id)
    progress.addTest(toTestRun({ ...result, missed, at : new Date(result.submittedAt ?? Date.now()).getTime() }),
        Object.fromEntries(state.questions.filter((question) => state.answers[question.id] !== undefined).map((question) => [question.id, {
            choice : state.answers[question.id], correct : state.answers[question.id] === question.answer, courseID : question.courseID, topic : question.topic,
        }])))
}

export const startTest = async (config : TestConfigState) : Promise<Run> => {
    await loadCatalog()
    if(isSynced()){
        try {
            const course = getCourse(config.courseID)
            const { data } = config.mode === 'challenge'
                ? await api.post('/challenges/today/start', {})
                : await api.post('/tests', { ...config, courseID : course.uuid ?? config.courseID })
            return fromServer(data, config)
        } catch(error) {
            const problem = toApiError(error)
            if(problem.status !== null) throw new TestError(problem, problem.details?.testID)
            // Offline: fall back to a local test
        }
    }
    const all = await fetchQuestions(config.courseID)
    if(all.length === 0) throw new TestError({ status : 422, code : 'no_questions', message : 'There are no questions for this course yet.' })
    const pool = config.year ? all.filter((question) => question.year === config.year)
        : config.difficulty === 'Mixed' ? all : all.filter((question) => question.difficulty === config.difficulty)
    const source = pool.length > 0 ? pool : all
    const ordered = config.mode === 'challenge' ? seededShuffle(source, `challenge:${dayKey()}`)
        : config.year ? source
        : seededShuffle(source, `${Date.now()}`)
    return {
        id : null, config, title : localTitle(config),
        questions : ordered.slice(0, config.year ? ordered.length : config.count),
        answers : {}, deadline : Date.now() + config.minutes * 60000,
    }
}

export const autosave = (run : Run, answers : Record<string, number>) => {
    if(!run.id) return
    api.put(`/tests/${run.id}/answers`, { answers }).catch(() => { /* the next save or the submit carries them */ })
}

export const loadResult = async (testID : string) : Promise<TestResultState | null> => {
    const { data } = await api.get(`/tests/${testID}`)
    return data.status === 'submitted' ? resultFromServer(data) : null
}

export const submitTest = async (run : Run, answers : Record<string, number>) : Promise<TestResultState> => {
    if(run.id){
        const { data } = await api.post(`/tests/${run.id}/submit`, { answers })
        const state = resultFromServer(data)
        recordServerResult(data, state)
        invalidate('challenge:')
        invalidate('notifications')
        return state
    }
    const { config, questions } = run
    const seconds = Math.min(config.minutes * 60, Math.round((Date.now() - (run.deadline - config.minutes * 60000)) / 1000))
    const score = questions.filter((question) => answers[question.id] === question.answer).length
    const saved = progress.recordTest({
        courseID : config.courseID, mode : config.mode, title : run.title, score, total : questions.length, seconds,
        missed : questions.filter((question) => answers[question.id] !== question.answer).map((question) => question.id),
    }, Object.fromEntries(questions.filter((question) => answers[question.id] !== undefined).map((question) => [question.id, {
        choice : answers[question.id], correct : answers[question.id] === question.answer, courseID : question.courseID, topic : question.topic,
    }])))
    return { config, questions, answers, seconds, title : run.title, runID : saved.id }
}

