import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi'
import * as api from '../../data/api'
import { useAdmin } from '../../context/admin'
import useLoad from '../../hooks/useLoad'
import { SampleNotice, SkeletonRows, EmptyState, Dialog } from '../../components/ui/ui'
import { DarkButton, GhostButton, Label, TextInput } from '../../styles/kit'
import { Screen, ScreenHeader, ScreenTitle, ScreenLead, Toolbar, SearchField, Select, TableWrap, Table, Th, Td, Tr, IconButton, Muted, Mono, CourseDot } from '../../styles/adminKit'

type Entity = 'schools' | 'programs' | 'courses' | 'topics'

interface Row { id : string, name : string, code? : string, parentID? : string, color? : string, total? : number }

const config : Record<Entity, {
    title : string, singular : string, lead : string, parent? : Entity, child? : Entity
}> = {
    schools : { title : 'Schools', singular : 'school', lead : 'Faculties group programs together. Students pick a school first when they sign up.', child : 'programs' },
    programs : { title : 'Programs', singular : 'program', lead : 'Degree programs inside each school. A course can belong to several programs.', parent : 'schools', child : 'courses' },
    courses : { title : 'Courses', singular : 'course', lead : 'Courses hold the questions students practise. Give each a short code.', parent : 'programs', child : 'topics' },
    topics : { title : 'Topics', singular : 'topic', lead : 'Topics split a course into chapters so students can drill one area at a time.', parent : 'courses' },
}

const palette = ['#6647f0', '#0091ff', '#fd9a46', '#16c0a4', '#f0457a', '#00c07a']

const Catalog = ({ entity } : { entity : Entity }) => {
    const settings = config[entity]
    const lists : Record<Entity, ReturnType<typeof useLoad<Row>>> = {
        schools : useLoad<Row>(api.fetchSchools),
        programs : useLoad<Row>(() => api.fetchPrograms().then((result) => ({ ...result, items : result.items.map((item) => ({ ...item, parentID : item.schoolID })) }))),
        courses : useLoad<Row>(() => api.fetchCourses().then((result) => ({ ...result, items : result.items.map((item) => ({ ...item, parentID : item.programID })) }))),
        topics : useLoad<Row>(() => api.fetchTopics().then((result) => ({ ...result, items : result.items.map((item) => ({ ...item, parentID : item.courseID, total : item.questions })) }))),
    }
    const list = lists[entity]
    const { can, inScope } = useAdmin()
    // Moderators can add topics to their own courses; everything else needs a supervisor
    const canCreate = can.editCatalog || entity === 'topics'
    const canChange = can.editCatalog
    const [saving, setSaving] = useState(false)
    const parents = settings.parent ? lists[settings.parent].items : []
    const children = settings.child ? lists[settings.child].items : []

    const [query, setQuery] = useState('')
    const [parentFilter, setParentFilter] = useState('all')
    const [editing, setEditing] = useState<Row | 'new'>()
    const [form, setForm] = useState({ name : '', code : '', parentID : '' })
    const [deleting, setDeleting] = useState<Row>()

    // Moderators can only add topics to their own courses
    const formParents = entity === 'topics' ? parents.filter((item) => inScope(item.id)) : parents
    const parentName = (id? : string) => parents.find((item) => item.id === id)?.name ?? '—'
    const childCount = (id : string) => children.filter((item) => item.parentID === id).length
    const topicQuestions = (row : Row) => row.total ?? 0

    const rows = list.items.filter((row) =>
        (!query || `${row.name} ${row.code ?? ''}`.toLowerCase().includes(query.toLowerCase()))
        && (parentFilter === 'all' || row.parentID === parentFilter))

    const openForm = (row? : Row) => {
        setForm({ name : row?.name ?? '', code : row?.code ?? '', parentID : row?.parentID ?? (parentFilter !== 'all' && formParents.some((item) => item.id === parentFilter) ? parentFilter : formParents[0]?.id ?? '') })
        setEditing(row ?? 'new')
    }

    const bodyFor = (name : string, code? : string, parentID? : string) => ({
        schools : { name },
        programs : { name, schoolID : parentID },
        courses : { name, code, programID : parentID || undefined },
        topics : editing === 'new' ? { name, courseID : parentID } : { name },
    })[entity]

    const save = async () => {
        const name = form.name.trim()
        if (!name || (settings.parent && !form.parentID) || saving) return
        const isNew = editing === 'new'
        const code = form.code.trim() || undefined
        const parentID = form.parentID || undefined
        const base : Row = isNew
            ? { id : `local-${Date.now()}`, name, code, parentID, color : palette[list.items.length % palette.length], total : 0 }
            : { ...(editing as Row), name, code, parentID }
        let row = base
        let offline = !list.live
        setSaving(true)
        if (!offline) {
            try {
                const saved = isNew
                    ? await api.createCatalogItem(entity, bodyFor(name, code, parentID))
                    : await api.updateCatalogItem(entity, base.id, bodyFor(name, code, parentID))
                row = { ...base, id : saved.id ?? base.id, color : saved.color ?? base.color }
            } catch (error) {
                setSaving(false)
                if (!api.isOffline(error)) return void toast.error(api.errorMessage(error))
                offline = true
            }
        }
        setSaving(false)
        list.setItems((items) => isNew ? [row, ...items] : items.map((item) => item.id === row.id ? row : item))
        setEditing(undefined)
        if (offline) toast.warn(`${name} ${isNew ? 'added' : 'updated'} in this session only. The API didn’t respond.`)
        else toast.success(`${name} ${isNew ? 'added' : 'updated'}.`)
    }

    const remove = async (row : Row) => {
        setDeleting(undefined)
        if (list.live && !row.id.startsWith('local-')) {
            try {
                await api.deleteCatalogItem(entity, row.id)
            } catch (error) {
                // 409 explains what still uses it
                if (!api.isOffline(error)) return void toast.error(api.errorMessage(error))
            }
        }
        list.setItems((items) => items.filter((item) => item.id !== row.id))
        toast.success(`${row.name} deleted.`)
    }

    const columns = entity === 'courses' ? 5 : entity === 'schools' ? 3 : 4

    return (
        <Screen>
            <ScreenHeader>
                <div>
                    <ScreenTitle>{settings.title}</ScreenTitle>
                    <ScreenLead>{settings.lead}</ScreenLead>
                </div>
                <Toolbar>
                    <SampleNotice live={list.live} />
                    {canCreate && <DarkButton onClick={() => openForm()}><FiPlus size={14} /> Add {settings.singular}</DarkButton>}
                </Toolbar>
            </ScreenHeader>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <SearchField>
                    <FiSearch size={14} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${settings.title.toLowerCase()}`} aria-label={`Search ${settings.title}`} />
                </SearchField>
                {settings.parent && (
                    <Select value={parentFilter} onChange={(event) => setParentFilter(event.target.value)} aria-label={`Filter by ${config[settings.parent].singular}`}>
                        <option value="all">All {config[settings.parent].title.toLowerCase()}</option>
                        {parents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </Select>
                )}
                <Mono className="sm:ml-auto tabular-nums">{rows.length} {rows.length === 1 ? settings.singular : settings.title.toLowerCase()}</Mono>
            </div>

            <TableWrap className="max-h-[calc(100vh-260px)] overflow-y-auto">
                <Table>
                    <thead className="sticky top-0 z-[1]">
                        <tr>
                            {entity === 'courses' && <Th>Code</Th>}
                            <Th>Name</Th>
                            {settings.parent && <Th className="hidden sm:table-cell">{config[settings.parent].singular}</Th>}
                            {entity === 'courses' && <Th className="text-right">Questions</Th>}
                            {settings.child ? <Th className="text-right hidden sm:table-cell">{config[settings.child].title}</Th> : <Th className="text-right">Questions</Th>}
                            <Th className="w-[88px]"><span className="sr-only">Actions</span></Th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.loading ? <SkeletonRows columns={columns} /> : rows.map((row) => (
                            <Tr key={row.id} className="group">
                                {entity === 'courses' && <Td className="whitespace-nowrap"><span className="inline-flex items-center gap-2"><CourseDot color={row.color ?? '#838383'} /><Mono className="!text-ink">{row.code || '—'}</Mono></span></Td>}
                                <Td className="font-medium">{row.name}</Td>
                                {settings.parent && <Td className="hidden sm:table-cell"><Muted>{parentName(row.parentID)}</Muted></Td>}
                                {entity === 'courses' && <Td className="text-right tabular-nums">{row.total ?? 0}</Td>}
                                <Td className={`text-right tabular-nums ${settings.child ? 'hidden sm:table-cell' : ''}`}>{settings.child ? childCount(row.id) : topicQuestions(row)}</Td>
                                <Td className="text-right whitespace-nowrap">
                                    {canChange && <span className="inline-flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity duration-150">
                                        <IconButton aria-label={`Rename ${row.name}`} onClick={() => openForm(row)}><FiEdit2 size={14} /></IconButton>
                                        <IconButton danger aria-label={`Delete ${row.name}`} onClick={() => setDeleting(row)}><FiTrash2 size={14} /></IconButton>
                                    </span>}
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </Table>
                {list.error && <div className="p-4"><EmptyState icon={FiFolder} title={`Couldn’t load ${settings.title.toLowerCase()}`} body={list.error} /></div>}
                {!list.loading && !list.error && rows.length === 0 && (
                    <div className="p-4">
                        <EmptyState icon={FiFolder}
                            title={query || parentFilter !== 'all' ? `No ${settings.title.toLowerCase()} match` : `No ${settings.title.toLowerCase()} yet`}
                            action={canCreate ? <GhostButton onClick={() => openForm()}><FiPlus size={14} /> Add {settings.singular}</GhostButton> : undefined} />
                    </div>
                )}
            </TableWrap>

            <Dialog
                open={Boolean(editing)}
                title={editing === 'new' ? `Add ${settings.singular}` : `Edit ${settings.singular}`}
                onClose={() => setEditing(undefined)}
                footer={<>
                    <GhostButton onClick={() => setEditing(undefined)}>Cancel</GhostButton>
                    <DarkButton disabled={saving || !form.name.trim() || Boolean(settings.parent && !form.parentID)} className="disabled:opacity-40" onClick={save}>
                        {saving ? 'Saving…' : editing === 'new' ? `Add ${settings.singular}` : 'Save changes'}
                    </DarkButton>
                </>}
            >
                <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); save() }}>
                    {entity === 'courses' && (
                        <Label>Code<TextInput value={form.code} onChange={(event) => setForm({ ...form, code : event.target.value.toUpperCase() })} placeholder="e.g. CS 201" /></Label>
                    )}
                    <Label>Name<TextInput value={form.name} onChange={(event) => setForm({ ...form, name : event.target.value })} placeholder={`${settings.singular[0].toUpperCase()}${settings.singular.slice(1)} name`} /></Label>
                    {settings.parent && !(entity === 'topics' && editing !== 'new') && (
                        <Label>
                            {config[settings.parent].singular[0].toUpperCase() + config[settings.parent].singular.slice(1)}
                            <Select className="!rounded-[9px] !h-[44px] w-full !text-[14px] !font-medium" value={form.parentID} onChange={(event) => setForm({ ...form, parentID : event.target.value })}>
                                {formParents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </Select>
                        </Label>
                    )}
                    <button type="submit" hidden />
                </form>
            </Dialog>

            <Dialog
                open={Boolean(deleting)}
                title={`Delete ${deleting?.name}?`}
                description={deleting && settings.child && childCount(deleting.id) > 0
                    ? `It still has ${childCount(deleting.id)} ${config[settings.child].title.toLowerCase()}. They will be left without a ${settings.singular}.`
                    : "This can't be undone."}
                onClose={() => setDeleting(undefined)}
                footer={<>
                    <GhostButton onClick={() => setDeleting(undefined)}>Cancel</GhostButton>
                    <DarkButton className="!bg-[#c2184f]" onClick={() => deleting && remove(deleting)}>Delete</DarkButton>
                </>}
             />
        </Screen>
    )
}

const Academics = () => {
    const { entity } = useParams()
    if (!entity || !(entity in config)) return <Navigate to="/academics/schools" replace />
    return <Catalog key={entity} entity={entity as Entity} />
}

export default Academics
