export class HttpError extends Error {
    constructor(
        public status : number,
        public code : string,
        message : string,
        public details? : unknown,
    ) {
        super(message)
    }
}

export const badRequest = (message : string, details? : unknown) => new HttpError(400, 'bad_request', message, details)
export const unauthorized = (message = 'You need to log in') => new HttpError(401, 'unauthorized', message)
export const forbidden = (message = 'You do not have access to this') => new HttpError(403, 'forbidden', message)
export const notFound = (what = 'Resource') => new HttpError(404, 'not_found', `${what} not found`)
export const conflict = (message : string) => new HttpError(409, 'conflict', message)
