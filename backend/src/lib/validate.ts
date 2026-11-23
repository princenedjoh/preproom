import { z } from 'zod'
import { HttpError } from './errors'

const toError = (error : z.ZodError) => new HttpError(
    400,
    'validation_error',
    error.issues[0] ? `${error.issues[0].path.join('.') || 'input'}: ${error.issues[0].message}` : 'Invalid input',
    error.issues.map((issue) => ({ path : issue.path.join('.'), message : issue.message })),
)

export const parse = <T extends z.ZodType>(schema : T, input : unknown) : z.infer<T> => {
    const result = schema.safeParse(input)
    if (!result.success) throw toError(result.error)
    return result.data
}

export const uuidParam = z.uuid()

// Accepts repeated query params (?a=1&a=2) or comma lists (?a=1,2)
export const listParam = <T extends z.ZodType>(item : T) => z.preprocess((value) => {
    if (value === undefined || value === '') return undefined
    const values = Array.isArray(value) ? value : [value]
    return values.flatMap((entry) => String(entry).split(',')).map((entry) => entry.trim()).filter(Boolean)
}, z.array(item).optional())
