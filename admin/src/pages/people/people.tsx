import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Select as AntSelect } from 'antd'
import { toast } from 'react-toastify'
import { FiUserPlus, FiSearch, FiTrash2, FiRepeat, FiSend, FiUsers } from 'react-icons/fi'
import * as sample from '../../data/sample'
import { SkeletonRows, EmptyState, Dialog, PersonAvatar, SampleNotice } from '../../components/ui/ui'
import { DarkButton, GhostButton, Label, TextInput, Panel } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, Toolbar, SearchField, TableWrap, Table, Th, Td, Tr, IconButton, Muted, Mono } from '../../styles/adminKit'
import useLoad from '../../hooks/useLoad'

const roles : Record<string, { role : sample.Role, lead : string, can : string[] }> = {
    supervisors : {
        role : 'Supervisor',
        lead : 'Supervisors own a set of courses. They add questions, review moderators and have the final say on flags.',
        can : ['Add and edit questions', 'Resolve flags', 'Invite moderators'],
    },
    moderators : {
        role : 'Moderator',
        lead : 'Moderators add questions and triage flags for the courses they are assigned to.',
        can : ['Add questions', 'Triage flags'],
    },
}

const palette = ['#6647f0', '#0091ff', '#fd9a46', '#16c0a4', '#f0457a', '#00c07a']
const fetchPeople = async () => ({ items : sample.people, live : false })

const People = () => {
    const { group } = useParams()
    const settings = group ? roles[group] : undefined
    const people = useLoad(fetchPeople)
    const courses = useLoad(sample.fetchCourses)

    const [query, setQuery] = useState('')
    const [inviting, setInviting] = useState(false)
    const [form, setForm] = useState({ name : '', email : '', courses : [] as string[] })
    const [removing, setRemoving] = useState<sample.Person>()

    if (!settings) return <Navigate to="/people/supervisors" replace />

    const members = people.items.filter((person) => person.role === settings.role)
    const rows = members.filter((person) => !query || `${person.name} ${person.email}`.toLowerCase().includes(query.toLowerCase()))
    const otherRole : sample.Role = settings.role === 'Supervisor' ? 'Moderator' : 'Supervisor'
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)

    const update = (id : string, change : Partial<sample.Person>) =>
        people.setItems((items) => items.map((person) => person.id === id ? { ...person, ...change } : person))

    const invite = () => {
        if (!form.name.trim() || !validEmail) return
        people.setItems((items) => [{
            id : `local-${Date.now()}`, name : form.name.trim(), email : form.email.trim(), role : settings.role, courses : form.courses,
            questionsAdded : 0, flagsResolved : 0, status : 'Invited', lastActive : '—', color : palette[items.length % palette.length],
        }, ...items])
        sample.api.post('/people/invite', { ...form, role : settings.role }).catch(() => undefined)
        toast.success(`Invite sent to ${form.email.trim()}.`)
        setInviting(false)
        setForm({ name : '', email : '', courses : [] })
    }

    const courseCode = (id : string) => {
        const course = courses.items.find((item) => item.id === id)
        return course?.code || course?.name || id
    }

    return (
        <Screen>
            <ScreenHeader>
                <div>
                    <ScreenTitle>{group === 'supervisors' ? 'Supervisors' : 'Moderators'}</ScreenTitle>
                    <ScreenLead>{settings.lead}</ScreenLead>
                </div>
                <Toolbar>
                    <SampleNotice live={people.live} />
                    <DarkButton onClick={() => setInviting(true)}><FiUserPlus size={14} /> Invite {settings.role.toLowerCase()}</DarkButton>
                </Toolbar>
            </ScreenHeader>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label : 'Members', value : members.length },
                    { label : 'Pending invites', value : members.filter((person) => person.status === 'Invited').length },
                    { label : 'Questions added', value : members.reduce((sum, person) => sum + person.questionsAdded, 0) },
                    { label : 'Flags resolved', value : members.reduce((sum, person) => sum + person.flagsResolved, 0) },
                ].map((stat) => (
                    <Panel key={stat.label} className="!gap-1 !p-4">
                        <Muted>{stat.label}</Muted>
                        <span className="font-display text-[24px] font-bold tracking-[-0.04em] text-onyx tabular-nums leading-none">{stat.value.toLocaleString()}</span>
                    </Panel>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <SearchField>
                    <FiSearch size={14} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search people" />
                </SearchField>
                <Muted className="sm:ml-auto">Can {settings.can.join(', ').toLowerCase()}</Muted>
            </div>

            <TableWrap className="max-h-[calc(100vh-260px)] overflow-y-auto">
                <Table>
                    <thead className="sticky top-0 z-[1]">
                        <tr>
                            <Th>Person</Th><Th className="hidden md:table-cell">Courses</Th>
                            <Th className="text-right hidden sm:table-cell">Questions</Th><Th className="text-right hidden lg:table-cell">Flags</Th>
                            <Th>Status</Th><Th className="hidden lg:table-cell">Last active</Th>
                            <Th className="w-[88px]"><span className="sr-only">Actions</span></Th>
                        </tr>
                    </thead>
                    <tbody>
                        {people.loading ? <SkeletonRows columns={7} rows={4} /> : rows.map((person) => (
                            <Tr key={person.id} className="group">
                                <Td>
                                    <span className="flex items-center gap-3 min-w-0">
                                        <PersonAvatar name={person.name} color={person.color} size={32} />
                                        <span className="flex flex-col min-w-0">
                                            <span className="font-semibold truncate">{person.name}</span>
                                            <Mono className="truncate">{person.email}</Mono>
                                        </span>
                                    </span>
                                </Td>
                                <Td className="hidden md:table-cell">
                                    <span className="flex flex-wrap gap-1">
                                        {person.courses.length ? person.courses.map((id) => (
                                            <span key={id} className="rounded-full border border-bone bg-mist px-2 py-[1px] text-[11px] font-semibold whitespace-nowrap">{courseCode(id)}</span>
                                        )) : <Muted>None</Muted>}
                                    </span>
                                </Td>
                                <Td className="text-right tabular-nums hidden sm:table-cell">{person.questionsAdded}</Td>
                                <Td className="text-right tabular-nums hidden lg:table-cell">{person.flagsResolved}</Td>
                                <Td>
                                    <span className={`inline-flex items-center gap-[6px] rounded-full px-2 py-[2px] text-[11px] font-semibold
                                        ${person.status === 'Active' ? 'bg-[#dcfaee] text-[#005c3a]' : 'bg-[#fff0e3] text-[#7a3d07]'}`}>
                                        <span className={`w-[6px] h-[6px] rounded-full ${person.status === 'Active' ? 'bg-brand-emerald' : 'bg-[#fd9a46]'}`} />
                                        {person.status}
                                    </span>
                                </Td>
                                <Td className="hidden lg:table-cell whitespace-nowrap"><Muted>{person.lastActive}</Muted></Td>
                                <Td className="text-right whitespace-nowrap">
                                    <span className="inline-flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity duration-150">
                                        {person.status === 'Invited' ? (
                                            <IconButton aria-label={`Resend invite to ${person.name}`} title="Resend invite"
                                                onClick={() => toast.success(`Invite resent to ${person.email}.`)}><FiSend size={14} /></IconButton>
                                        ) : (
                                            <IconButton aria-label={`Make ${person.name} a ${otherRole.toLowerCase()}`} title={`Make ${otherRole.toLowerCase()}`}
                                                onClick={() => { update(person.id, { role : otherRole }); toast.success(`${person.name} is now a ${otherRole.toLowerCase()}.`) }}>
                                                <FiRepeat size={14} />
                                            </IconButton>
                                        )}
                                        <IconButton danger aria-label={`Remove ${person.name}`} title="Remove" onClick={() => setRemoving(person)}><FiTrash2 size={14} /></IconButton>
                                    </span>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </Table>
                {!people.loading && rows.length === 0 && (
                    <div className="p-4">
                        <EmptyState icon={FiUsers} title={query ? 'Nobody matches' : `No ${group} yet`}
                            action={<GhostButton onClick={() => setInviting(true)}><FiUserPlus size={14} /> Invite {settings.role.toLowerCase()}</GhostButton>} />
                    </div>
                )}
            </TableWrap>

            <Dialog
                open={inviting}
                title={`Invite a ${settings.role.toLowerCase()}`}
                description="They get an email with a link to set a password. Invites expire after 7 days."
                onClose={() => setInviting(false)}
                footer={<>
                    <GhostButton onClick={() => setInviting(false)}>Cancel</GhostButton>
                    <DarkButton disabled={!form.name.trim() || !validEmail} className="disabled:opacity-40" onClick={invite}><FiSend size={14} /> Send invite</DarkButton>
                </>}
            >
                <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); invite() }}>
                    <Label>Full name<TextInput value={form.name} onChange={(event) => setForm({ ...form, name : event.target.value })} placeholder="Ama Owusu" /></Label>
                    <Label>Email<TextInput type="email" value={form.email} onChange={(event) => setForm({ ...form, email : event.target.value })} placeholder="name@school.edu" /></Label>
                    <Label as="div">
                        Courses
                        <AntSelect mode="multiple" placeholder="Courses they look after" value={form.courses} optionFilterProp="label"
                            onChange={(value) => setForm({ ...form, courses : value })}
                            options={courses.items.map((item) => ({ value : item.id, label : item.code ? `${item.code} · ${item.name}` : item.name }))} />
                    </Label>
                    <button type="submit" hidden />
                </form>
            </Dialog>

            <Dialog
                open={Boolean(removing)}
                title={`Remove ${removing?.name}?`}
                description="They lose admin access straight away. Questions they added stay in the bank."
                onClose={() => setRemoving(undefined)}
                footer={<>
                    <GhostButton onClick={() => setRemoving(undefined)}>Cancel</GhostButton>
                    <DarkButton className="!bg-[#c2184f]" onClick={() => {
                        if (!removing) return
                        people.setItems((items) => items.filter((person) => person.id !== removing.id))
                        toast.success(`${removing.name} removed.`)
                        setRemoving(undefined)
                    }}>Remove</DarkButton>
                </>}
             />
        </Screen>
    )
}

export default People
