import axios, { AxiosError } from 'axios'

// One client for the PrepRoom API. Auth rides on an httpOnly cookie, so every
// request is sent with credentials and nothing about the session lives in JS.
export const API_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3001'

export const api = axios.create({
    baseURL : API_URL,
    withCredentials : true,
    timeout : 10000,
    headers : { 'Content-Type' : 'application/json' },
})

export interface ApiError {
    status : number | null   // null when the server couldn't be reached
    code : string
    message : string
    details? : any
}

export const toApiError = (error : unknown) : ApiError => {
    const axiosError = error as AxiosError<any>
    if(!axiosError?.response){
        return { status : null, code : 'offline', message : "We couldn't reach PrepRoom. Check your connection and try again." }
    }
    const body = axiosError.response.data?.error
    return {
        status : axiosError.response.status,
        code : body?.code ?? 'error',
        message : body?.message ?? 'Something went wrong. Please try again.',
        details : body?.details,
    }
}

export const isOffline = (error : unknown) => !(error as AxiosError)?.response
