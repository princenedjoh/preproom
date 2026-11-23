import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'
import SegmentedControl from '../../components/UI/segmented/segmented'
import { Notification as NotificationType } from '../../data/sample'
import { useNotifications, AppNotification } from '../../store/notifications'
import { progress } from '../../store/progress'
import { FiMessageCircle, FiInbox, FiCheckCircle, FiAward, FiInfo, FiZap } from "react-icons/fi";

const icons : Record<string, { icon : typeof FiInbox, tone : kit.Tone }> = {
    reply : { icon : FiMessageCircle, tone : 'blue' },
    challenge : { icon : FiAward, tone : 'purple' },
    streak : { icon : FiZap, tone : 'yellow' },
    result : { icon : FiCheckCircle, tone : 'green' },
    system : { icon : FiInfo, tone : 'gray' },
}

const tabs = ['All', 'Unread', 'Mentions'] as const
const groups : NotificationType['group'][] = ['Today', 'This week', 'Earlier']

const Notification = () => {

    const navigate = useNavigate()
    const items = useNotifications()
    const [tab, setTab] = useState<typeof tabs[number]>('All')

    const visible = items.filter((item) => tab === 'All' || (tab === 'Unread' ? item.unread : item.kind === 'reply'))
    const unreadCount = items.filter((item) => item.unread).length

    const open = (item : AppNotification) => {
        progress.markRead([item.id])
        navigate(item.route)
    }

    return (
        <kit.Page>
            <kit.PageInner className='!max-w-[760px]'>
                <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-2'>
                    <div className='flex flex-col gap-2'>
                        <kit.PageTitle>Inbox</kit.PageTitle>
                        <kit.Body>Replies to your comments, results and challenge news.</kit.Body>
                    </div>
                    <kit.GhostButton 
                        type='button'
                        disabled={unreadCount === 0}
                        className='disabled:opacity-40 self-start sm:self-auto'
                        onClick={()=>progress.markRead(items.map((item) => item.id))}
                    >
                        Mark all as read
                    </kit.GhostButton>
                </div>
                <SegmentedControl
                    aria-label='Filter notifications'
                    className='self-start'
                    value={tab}
                    onChange={setTab}
                    options={tabs.map((item) => ({ value : item, label : item === 'Unread' && unreadCount > 0 ? `Unread · ${unreadCount}` : item }))}
                />
                {
                    visible.length === 0 ?
                    <kit.Empty>
                        <FiInbox size={20}/>
                        <span className='text-[15px] font-medium text-ink'>You're all caught up</span>
                        <span className='text-[14px]'>New replies, results and challenges will show up here.</span>
                    </kit.Empty>
                    :
                    groups.map((group) => {
                        const inGroup = visible.filter((item) => item.group === group)
                        if(inGroup.length === 0) return null
                        return (
                            <div key={group} className='flex flex-col gap-2'>
                                <span className='text-[12px] font-medium text-ink-3'>{group}</span>
                                <div className='rounded-lg border border-line overflow-hidden'>
                                    {
                                        inGroup.map((item) => {
                                            const meta = icons[item.kind] ?? icons.system
                                            return (
                                                <button
                                                    key={item.id}
                                                    type='button'
                                                    onClick={()=>open(item)}
                                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-line last:border-0 transition-colors duration-100 hover:bg-ink/[0.03] focus-visible:outline-none focus-visible:bg-ink/[0.05] ${item.unread ? '' : ''}`}
                                                >
                                                    <kit.IconTile tone={meta.tone} className='!w-8 !h-8 mt-[2px]'><meta.icon size={15}/></kit.IconTile>
                                                    <span className='flex flex-col gap-1 flex-1 min-w-0'>
                                                        <span className={`text-[14px] ${item.unread ? 'font-semibold text-ink' : 'text-ink-2'}`}>{item.title}</span>
                                                        <span className='text-[13px] text-ink-3 leading-[1.5]'>{item.body}</span>
                                                    </span>
                                                    <span className='flex items-center gap-2 shrink-0 pt-[2px]'>
                                                        <span className='text-[12px] text-ink-3'>{item.time}</span>
                                                        {item.unread && <span className='w-2 h-2 rounded-full bg-accent' aria-label='Unread'/>}
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
