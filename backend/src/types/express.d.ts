import type { AuthUser } from '../services/sessions'

declare global {
    namespace Express {
        interface Request {
            user? : AuthUser
            sessionId? : string
        }
    }
}

export {}
