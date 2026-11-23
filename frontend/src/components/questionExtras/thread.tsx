import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, toApiError } from '../../api/client'
import { useRemote } from '../../api/useRemote'
import { useSession } from '../../store/session'
import { relativeDay } from '../../store/progress'
import * as kit from '../../styles/kit'
import { FiTrash2 } from 'react-icons/fi'

interface Comment {
    id : string
    body : string
    createdAt : string
    mine : boolean
    author : { id : string, name : string, initials : string, color : string, isStaff : boolean }
}

const when = (iso : string) => {
    const time = new Date(iso).getTime()
    const minutes = Math.round((Date.now() - time) / 60000)
    if(minutes < 1) return 'just now'
    if(minutes < 60) return `${minutes}m`
    if(minutes < 60 * 24) return `${Math.round(minutes / 60)}h`
    return relativeDay(time)
}

// Discussion under a question: read by anyone, written by people who are logged in
const Thread = ({ questionID, onCount } : { questionID : string, onCount : (count : number) => void }) => {

    const navigate = useNavigate()
    const signedIn = useSession().status === 'user'
    const { data, loading, error, refresh } = useRemote<{ items : Comment[] }>(`comments:${questionID}`, () => api.get(`/questions/${questionID}/comments`).then((r) => r.data))
    const [body, setBody] = useState('')
    const [posting, setPosting] = useState(false)
    const [problem, setProblem] = useState<string | null>(null)
    const comments = data?.items ?? []

    const post = async (event : FormEvent) => {
        event.preventDefault()
        if(!body.trim()) return
        setPosting(true)
        setProblem(null)
        try {
            await api.post(`/questions/${questionID}/comments`, { body : body.trim() })
            setBody('')
            await refresh()
            onCount(comments.length + 1)
        } catch(failure) {
            setProblem(toApiError(failure).message)
        } finally {
            setPosting(false)
        }
    }

    const remove = async (id : string) => {
        try {
            await api.delete(`/questions/${questionID}/comments/${id}`)
            await refresh()
            onCount(Math.max(0, comments.length - 1))
        } catch(failure) {
            setProblem(toApiError(failure).message)
        }
    }

    return (
        <div className='flex flex-col gap-3 rounded-md border border-line p-4'>
            {
                loading ? <span className='text-[13px] text-ink-3'>Loading discussion…</span>
                : error ? <span className='text-[13px] text-ink-3'>Discussion isn't available offline.</span>
                : comments.length === 0 ? <span className='text-[13px] text-ink-3'>No discussion yet. Ask a question or share how you solved it.</span>
                :
                <div className='flex flex-col gap-4'>
                    {comments.map((comment) => (
                        <div key={comment.id} className='flex gap-3 group'>
                            <kit.Avatar color={comment.author.color} size={28} ring='transparent'>{comment.author.initials}</kit.Avatar>
                            <div className='flex flex-col gap-1 flex-1 min-w-0'>
                                <span className='flex items-center gap-2 text-[12px] text-ink-3'>
                                    <b className='text-[13px] text-ink'>{comment.mine ? 'You' : comment.author.name}</b>
                                    {comment.author.isStaff && <span className='rounded-full bg-tag-purple-bg text-tag-purple px-2 py-[1px] text-[10px] font-semibold uppercase tracking-[0.04em]'>Staff</span>}
                                    {when(comment.createdAt)}
                                    {
                                        comment.mine &&
                                        <button type='button' aria-label='Delete comment' onClick={()=>remove(comment.id)} className='ml-auto opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-ink-3 hover:text-hard transition-opacity'>
                                            <FiTrash2 size={13}/>
                                        </button>
                                    }
                                </span>
                                <p className='text-[14px] leading-[1.55] text-carbon whitespace-pre-wrap break-words'>{comment.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            }
            {
                signedIn ?
                <form onSubmit={post} className='flex gap-2 items-end'>
                    <textarea
                        value={body}
                        onChange={(event)=>setBody(event.target.value)}
                        onKeyDown={(event)=>{ if(event.key === 'Enter' && (event.metaKey || event.ctrlKey)) post(event as any) }}
                        rows={1}
                        maxLength={1000}
                        placeholder='Add to the discussion'
                        aria-label='Comment'
                        className='flex-1 min-h-[40px] max-h-[160px] rounded-md border border-line bg-surface text-ink px-3 py-[9px] text-[14px] outline-none resize-y focus:border-accent transition-colors'
                    />
                    <kit.PrimaryButton type='submit' className='!py-[9px] !px-4' disabled={posting || !body.trim()}>Post</kit.PrimaryButton>
                </form>
                :
                <button type='button' onClick={()=>navigate('/auth/login', { state : { from : window.location.pathname + window.location.search } })} className='self-start text-[13px] font-semibold text-brand-blue hover:underline'>
                    Log in to join the discussion
                </button>
            }
            {problem && <span role='alert' className='text-[12px] text-hard'>{problem}</span>}
        </div>
    )
}

export default Thread
