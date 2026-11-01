import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import { notifications as initial, Notification as NotificationType } from '../../data/sample'
import { FiMessageCircle, FiBell, FiCheckCircle, FiAward, FiInfo } from "react-icons/fi";
import { HiFire } from "react-icons/hi2";

const icons = {
    reply : { icon : FiMessageCircle, color : '#0091ff' },
    challenge : { icon : FiAward, color : '#6647f0' },
    streak : { icon : HiFire, color : '#fd9a46' },
    result : { icon : FiCheckCircle, color : '#00c07a' },
    system : { icon : FiInfo, color : '#646464' },
}

const tabs = ['All', 'Unread', 'Mentions'] as const
const groups : NotificationType['group'][] = ['Today', 'This week', 'Earlier']

const routes : Record<NotificationType['kind'], string> = {
    reply : '/questions', challenge : '/challenges', streak : '/challenges', result : '/test/testconfig', system : '/questions',
}

const Notification = () => {

    const navigate = useNavigate()
    const [items, setItems] = useState(initial)
    const [tab, setTab] = useState<typeof tabs[number]>('All')

    const visible = items.filter((item) => tab === 'All' || (tab === 'Unread' ? item.unread : item.kind === 'reply'))
    const unreadCount = items.filter((item) => item.unread).length

    const open = (item : NotificationType) => {
        setItems(items.map((other) => other.id === item.id ? { ...other, unread : false } : other))
        navigate(routes[item.kind])
    }

    return (
        <kit.Page>
            <kit.PageInner className='!max-w-[760px]'>
                <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
                    <div className='flex flex-col gap-2'>
                        <kit.Eyebrow>Inbox</kit.Eyebrow>
                        <kit.PageTitle>Notifications</kit.PageTitle>
                    </div>
                    <kit.GhostButton 
                        type='button'
                        disabled={unreadCount === 0}
                        className='disabled:opacity-40 self-start sm:self-auto'
                        onClick={()=>setItems(items.map((item) => ({ ...item, unread : false })))}
                    >
                        Mark all as read
                    </kit.GhostButton>
                </div>
                <kit.Segmented className='self-start'>
                    {
                        tabs.map((item) => (
                            <kit.SegmentedItem key={item} type='button' active={tab === item} onClick={()=>setTab(item)}>
                                {item}{item === 'Unread' && unreadCount > 0 ? ` · ${unreadCount}` : ''}
                            </kit.SegmentedItem>
                        ))
                    }
                </kit.Segmented>
                {
                    visible.length === 0 ?
                    <kit.Empty>
                        <FiBell size={22}/>
                        <span className='text-[15px] font-semibold text-ink'>You're all caught up</span>
                        <span className='text-[14px]'>New replies, results and challenges will show up here.</span>
                    </kit.Empty>
                    :
                    groups.map((group) => {
                        const inGroup = visible.filter((item) => item.group === group)
                        if(inGroup.length === 0) return null
                        return (
                            <div key={group} className='flex flex-col gap-2'>
                                <kit.Eyebrow>{group}</kit.Eyebrow>
                                <div className='rounded-[12px] border border-bone overflow-hidden'>
                                    {
                                        inGroup.map((item) => {
                                            const meta = icons[item.kind]
                                            return (
                                                <button
                                                    key={item.id}
                                                    type='button'
                                                    onClick={()=>open(item)}
                                                    className={`w-full flex items-start gap-4 px-5 py-4 text-left border-b border-bone last:border-0 transition-colors duration-150 hover:bg-mist`}
                                                >
                                                    <span 
                                                        className='w-9 h-9 rounded-full flex items-center justify-center shrink-0'
                                                        style={{ background : `${meta.color}14`, color : meta.color }}
                                                    >
                                                        <meta.icon size={16}/>
                                                    </span>
                                                    <span className='flex flex-col gap-1 flex-1 min-w-0'>
                                                        <span className={`text-[14px] ${item.unread ? 'font-bold text-ink' : 'font-semibold text-carbon'}`}>{item.title}</span>
                                                        <span className='text-[14px] text-muted leading-[1.5]'>{item.body}</span>
                                                    </span>
                                                    <span className='flex items-center gap-2 shrink-0 pt-[2px]'>
                                                        <span className='text-[12px] text-ash'>{item.time}</span>
                                                        {item.unread && <span className='w-2 h-2 rounded-full bg-brand-violet' aria-label='Unread'/>}
                                                    </span>
                                                </button>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        )
                    })
                }
            </kit.PageInner>
        </kit.Page>
    )
}

export default Notification
