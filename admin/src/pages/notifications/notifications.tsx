import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiFlag, FiPlusSquare, FiUserPlus, FiActivity, FiBell, FiCheck } from 'react-icons/fi'
import { IconType } from 'react-icons'
import * as sample from '../../data/sample'
import { useAdmin } from '../../context/admin'
import { EmptyState } from '../../components/ui/ui'
import { GhostButton, Segmented, SegmentedItem, IconTile, Eyebrow } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, Toolbar, Mono } from '../../styles/adminKit'

const kinds : Record<sample.AdminNotification['kind'], { icon : IconType, path : string }> = {
    flag : { icon : FiFlag, path : '/alerts/flags' },
    question : { icon : FiPlusSquare, path : '/questions' },
    people : { icon : FiUserPlus, path : '/people/moderators' },
    system : { icon : FiActivity, path : '/' },
}

const isRecent = (time : string) => /m ago|h ago|now/i.test(time)

const Notifications = () => {
    const navigate = useNavigate()
    const { notifications, markRead, unread } = useAdmin()
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const shown = notifications.filter((item) => filter === 'all' || !item.read)
    const groups = [
        { title : 'Today', items : shown.filter((item) => isRecent(item.time)) },
        { title : 'Earlier', items : shown.filter((item) => !isRecent(item.time)) },
    ].filter((group) => group.items.length)

    return (
        <Screen className="!max-w-[760px]">
            <ScreenHeader>
                <div>
                    <ScreenTitle>Notifications</ScreenTitle>
                    <ScreenLead>New flags, contributor activity and weekly digests.</ScreenLead>
                </div>
                <Toolbar>
                    <Segmented>
                        <SegmentedItem active={filter === 'all'} onClick={() => setFilter('all')}>All</SegmentedItem>
                        <SegmentedItem active={filter === 'unread'} onClick={() => setFilter('unread')}>Unread{unread ? ` · ${unread}` : ''}</SegmentedItem>
                    </Segmented>
                    <GhostButton disabled={!unread} className="disabled:opacity-40" onClick={() => markRead()}><FiCheck size={14} /> Mark all read</GhostButton>
                </Toolbar>
            </ScreenHeader>

            {groups.length === 0 ? (
                <EmptyState icon={FiBell} title="You're all caught up" body="Unread notifications show up here." />
            ) : groups.map((group) => (
                <section key={group.title} className="flex flex-col gap-2">
                    <Eyebrow>{group.title}</Eyebrow>
                    <div className="flex flex-col rounded-[12px] border border-bone overflow-hidden bg-white">
                        {group.items.map((item) => {
                            const kind = kinds[item.kind]
                            return (
                                <button key={item.id}
                                    onClick={() => { markRead(item.id); navigate(kind.path) }}
                                    className={`text-left flex items-start gap-3 px-4 py-4 border-t border-bone first:border-t-0 transition-colors duration-150 hover:bg-mist ${item.read ? '' : 'bg-[#f2f9ff]'}`}>
                                    <IconTile className="shrink-0 !w-9 !h-9"><kind.icon size={15} /></IconTile>
                                    <span className="flex flex-col gap-[2px] min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className={`text-[14px] text-ink ${item.read ? 'font-medium' : 'font-bold'}`}>{item.title}</span>
                                            {!item.read && <span className="w-[7px] h-[7px] rounded-full bg-brand-blue shrink-0" aria-label="Unread" />}
                                        </span>
                                        <span className="text-[13px] text-muted leading-[1.5]">{item.body}</span>
                                    </span>
                                    <Mono className="whitespace-nowrap">{item.time}</Mono>
                                </button>
                            )
                        })}
                    </div>
                </section>
            ))}
        </Screen>
    )
}

export default Notifications
