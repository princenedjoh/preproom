import { logger } from './logger'

export interface Mail {
    to : string
    subject : string
    text : string
}

// No email provider is configured yet. In development the message (including
// any reset or invite link) is written to the server log. Swap `send` for a
// real provider (Resend, Postmark, SES...) before launch.
const sent : Mail[] = []

export const mailer = {
    async send(mail : Mail) {
        sent.push(mail)
        if (sent.length > 50) sent.shift()
        logger.info({ to : mail.to, subject : mail.subject }, `[mail] ${mail.subject}\n${mail.text}`)
    },
    // Used by tests to read the link out of the last email
    outbox : () => sent,
}
