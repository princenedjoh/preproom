import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto'

const scrypt = (password : string, salt : Buffer, length : number, options : ScryptOptions) => new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, length, options, (error, key) => error ? reject(error) : resolve(key)))

// scrypt (memory-hard, built into Node). Stored as scrypt$N$r$p$salt$key
const PARAMS = { N : 16384, r : 8, p : 1 }
const KEY_LENGTH = 64

export const hashPassword = async (password : string) => {
    const salt = randomBytes(16)
    const key = await scrypt(password, salt, KEY_LENGTH, PARAMS)
    return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64url'), key.toString('base64url')].join('$')
}

export const verifyPassword = async (password : string, stored : string) => {
    const [scheme, N, r, p, salt, key] = stored.split('$')
    if (scheme !== 'scrypt' || !key) return false
    const expected = Buffer.from(key, 'base64url')
    const actual = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length, { N : Number(N), r : Number(r), p : Number(p) })
    return timingSafeEqual(actual, expected)
}

// Session and email tokens: random to the client, only the SHA-256 is stored
export const newToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token : string) => createHash('sha256').update(token).digest('hex')
