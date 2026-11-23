import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiFlag, FiPlusSquare, FiUserPlus, FiActivity, FiBell, FiCheck } from 'react-icons/fi'
import { IconType } from 'react-icons'
import * as sample from '../../data/sample'
import { useAdmin } from '../../context/admin'
import { EmptyState } from '../../components/ui/ui'
import SegmentedControl from '../../components/ui/segmented'
import { SecondaryButton, IconTile, Eyebrow } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, Toolbar, Mono } from '../../styles/adminKit'

const kinds : Record<sample.AdminNotification['kind'], { icon : IconType, path : string }> = {
    flag : { icon : FiFlag, path : '/alerts/flags' },
    question : { icon : FiPlusSquare, path : '/questions' },
    people : { icon : FiUserPlus, path : '/people/moderators' },
    system : { icon : FiActivity, path : '/' },
}

const isToday = (item : sample.AdminNotification) => item.createdAt
    ? new Date(item.createdAt).toDateString() === new Date().toDateString()
    : /m ago|h ago|now/i.test(item.time)

const Notifications = () => {
    const navigate = useNavigate()
    const { notifications, markRead, unread } = useAdmin()
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const shown = notifications.filter((item) => filter === 'all' || !item.read)
    const groups = [
        { title : 'Today', items : shown.filter(isToday) },
        { title : 'Earlier', items : shown.filter((item) => !isToday(item)) },
    ].filter((group) => group.items.length)

    return (
        <Screen className="!max-w-[760px]">
            <ScreenHeader>
                <div>
                    <ScreenTitle>Notifications</ScreenTitle>
                    <ScreenLead>New flags, contributor activity and weekly digests.</ScreenLead>
                </div>
                <Toolbar>
                    <SegmentedControl aria-label="Show" value={filter} onChange={setFilter}
                        options={[{ value : 'all', label : 'All' }, { value : 'unread', label : `Unread${unread ? ` · ${unread}` : ''}` }]} />
                    <SecondaryButton disabled={!unread} className="disabled:opacity-40" onClick={() => markRead()}><FiCheck size={14} /> Mark all read</SecondaryButton>
                </Toolbar>
            </ScreenHeader>

            {groups.length === 0 ? (
                <EmptyState icon={FiBell} title="You're all caught up" body="Unread notifications show up here." />
            ) : groups.map((group) => (
                <section key={group.title} className="flex flex-col gap-2">
                    <Eyebrow>{group.title}</Eyebrow>
                    <div className="flex flex-col rounded-[12px] border border-line overflow-hidden bg-surface">
                        {group.items.map((item) => {
                            const kind = kinds[item.kind]
                            return (
                                <button key={item.id}
                                    onClick={() => { markRead(item.id); navigate(item.link ?? kind.path) }}
                                    className={`text-left flex items-start gap-3 px-4 py-4 border-t border-line first:border-t-0 transition-colors duration-150 hover:bg-subtle ${item.read ? '' : 'bg-accent/[0.04]'}`}>
                                    <IconTile className="shrink-0 !w-9 !h-9"><kind.icon size={15} /></IconTile>
                                    <span className="flex flex-col gap-[2px] min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className={`text-[14px] text-ink ${item.read ? 'font-medium' : 'font-bold'}`}>{item.title}</span>
                                            {!item.read && <span className="w-[7px] h-[7px] rounded-full bg-accent shrink-0" aria-label="Unread" />}
                                        </span>
                                        <span className="text-[13px] text-ink-2 leading-[1.5]">{item.body}</span>
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
