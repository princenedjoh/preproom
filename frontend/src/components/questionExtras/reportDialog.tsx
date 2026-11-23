import { useState } from 'react'
import { Modal } from 'antd'
import { api, toApiError } from '../../api/client'
import { alphabets } from '../../pages/mcqs/mcqs'
import { Question } from '../../data/sample'
import { notify } from '../../utils/notify'
import { Spinner } from '../auth/auth'
import * as kit from '../../styles/kit'

const issues = ['Wrong answer', 'Typo', 'Unclear question', 'Duplicate', 'Missing explanation'] as const

interface Props {
    question : Question
    open : boolean
    onClose : () => void
    onReported : () => void
}

// Sends a report to the moderators who look after this course
const ReportDialog = ({ question, open, onClose, onReported } : Props) => {

    const [issue, setIssue] = useState<typeof issues[number]>('Wrong answer')
    const [comment, setComment] = useState('')
    const [suggested, setSuggested] = useState<number | null>(null)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const send = async () => {
        setSending(true)
        setError(null)
        try {
            await api.post(`/questions/${question.id}/flags`, {
                issue,
                comment : comment.trim() || undefined,
                suggestedAnswer : issue === 'Wrong answer' && suggested !== null ? suggested : undefined,
            })
            notify("Thanks. A moderator will review this question.")
            onReported()
            onClose()
        } catch(failure) {
            const problem = toApiError(failure)
            if(problem.status === 409){ onReported(); onClose(); notify("You've already reported this question."); return }
            setError(problem.message)
        } finally {
            setSending(false)
        }
    }

    return (
        <Modal open={open} onCancel={onClose} footer={null} width={460} destroyOnClose centered title={null}>
            <div className='flex flex-col gap-5 pt-1'>
                <div className='flex flex-col gap-1'>
                    <span className='font-semibold text-[20px] tracking-[-0.02em] text-ink'>Report a problem</span>
                    <span className='text-[14px] text-ink-2'>What's wrong with this question?</span>
                </div>
                <div className='flex flex-wrap gap-2' role='radiogroup' aria-label='Issue'>
                    {issues.map((item) => (
                        <kit.FilterChip key={item} type='button' role='radio' aria-checked={issue === item} active={issue === item} onClick={()=>setIssue(item)}>{item}</kit.FilterChip>
                    ))}
                </div>
                {
                    issue === 'Wrong answer' &&
                    <div className='flex flex-col gap-2'>
                        <span className='text-[13px] font-semibold text-ink'>Which answer is correct? <span className='font-normal text-ink-3'>Optional</span></span>
                        <div className='flex gap-2'>
                            {question.options.map((_, index) => (
                                <kit.FilterChip key={index} type='button' active={suggested === index} onClick={()=>setSuggested(suggested === index ? null : index)} className='!px-4 font-mono'>
                                    {alphabets[index].toUpperCase()}
                                </kit.FilterChip>
                            ))}
                        </div>
                    </div>
                }
                <label className='flex flex-col gap-2 text-[13px] font-semibold text-ink'>
                    Details <span className='sr-only'>(optional)</span>
                    <textarea
                        value={comment}
                        onChange={(event)=>setComment(event.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder='Anything that helps a moderator fix it'
                        className='w-full rounded-md border border-line bg-surface text-ink px-4 py-3 text-[14px] font-normal outline-none resize-none focus:border-accent focus:shadow-[0_0_0_3px_rgb(var(--accent)/0.15)] transition-[border-color,box-shadow]'
                    />
                </label>
                {error && <span role='alert' className='text-[13px] text-hard'>{error}</span>}
                <div className='flex justify-end gap-2'>
                    <kit.GhostButton type='button' onClick={onClose}>Cancel</kit.GhostButton>
                    <kit.PrimaryButton type='button' onClick={send} disabled={sending}>{sending ? <><Spinner/> Sending</> : 'Send report'}</kit.PrimaryButton>
                </div>
            </div>
        </Modal>
    )
}

export default ReportDialog
