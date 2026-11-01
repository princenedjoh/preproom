import { useContext, useState } from 'react'
import * as kit from '../../styles/kit'
import Context from '../../context/context'
import { FiMessageCircle, FiFlag, FiUsers, FiArrowRight } from "react-icons/fi";

const reasons = [
    { icon : FiMessageCircle, title : 'General question', text : 'Anything about your account or how PrepRoom works.' },
    { icon : FiFlag, title : 'Report a question', text : 'A wrong answer, a typo or a missing explanation.' },
    { icon : FiUsers, title : 'Schools & departments', text : 'Add your department’s past papers to PrepRoom.' },
]

const Contact = () => {

    const [toast] = useContext(Context) as any[]
    const [reason, setReason] = useState(reasons[0].title)
    const [form, setForm] = useState({ name : '', email : '', message : '' })

    const submit = (e : React.FormEvent) => {
        e.preventDefault()
        toast?.success?.('Thanks, we’ll get back to you by email.', { hideProgressBar : true })
        setForm({ name : '', email : '', message : '' })
    }

    return (
        <kit.Page>
            <kit.PageInner>
                <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16 items-start'>
                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col gap-3'>
                            <kit.Eyebrow>Contact</kit.Eyebrow>
                            <kit.PageTitle>We’d love to hear from you.</kit.PageTitle>
                            <kit.Lead>Tell us what’s on your mind and we’ll reply by email, usually within a day.</kit.Lead>
                        </div>
                        <div className='flex flex-col gap-3'>
                            {
                                reasons.map((item) => (
                                    <button
                                        key={item.title}
                                        type='button'
                                        onClick={()=>setReason(item.title)}
                                        aria-pressed={reason === item.title}
                                        className={`flex items-start gap-4 rounded-[12px] p-4 text-left border transition-colors duration-150 ${reason === item.title ? 'border-ink bg-white shadow-[inset_0_0_0_1px_#202020]' : 'border-bone hover:border-cloud'}`}
                                    >
                                        <kit.IconTile><item.icon size={16}/></kit.IconTile>
                                        <span className='flex flex-col gap-1'>
                                            <span className='text-[15px] font-bold text-ink'>{item.title}</span>
                                            <span className='text-[14px] text-muted'>{item.text}</span>
                                        </span>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                    <kit.Panel as='form' onSubmit={submit} className='!p-6 md:!p-8 !gap-5'>
                        <kit.Title>{reason}</kit.Title>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <kit.Label>Name<kit.TextInput required value={form.name} onChange={(e)=>setForm({ ...form, name : e.target.value })} placeholder='Your name'/></kit.Label>
                            <kit.Label>Email<kit.TextInput required type='email' value={form.email} onChange={(e)=>setForm({ ...form, email : e.target.value })} placeholder='you@school.edu'/></kit.Label>
                        </div>
                        <kit.Label>
                            Message
                            <kit.TextInput 
                                as='textarea'
                                required
                                rows={6}
                                value={form.message}
                                onChange={(e : any)=>setForm({ ...form, message : e.target.value })}
                                placeholder='How can we help?'
                                className='!h-auto py-3 resize-y'
                            />
                        </kit.Label>
                        <kit.DarkButton type='submit' className='self-start'>Send message <FiArrowRight size={15}/></kit.DarkButton>
                    </kit.Panel>
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default Contact
