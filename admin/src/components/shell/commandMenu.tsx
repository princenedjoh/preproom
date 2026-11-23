import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { IconType } from 'react-icons'
import { FiSearch, FiPlus, FiSun, FiMoon, FiMonitor, FiLogOut, FiFileText, FiCornerDownLeft } from 'react-icons/fi'
import * as api from '../../data/api'
import * as sample from '../../data/sample'
import { useAdmin } from '../../context/admin'
import { useTheme, setTheme, ThemeChoice } from '../../store/theme'
import { Kbd } from '../../styles/kit'
import { CourseDot } from '../../styles/adminKit'
import { navSections } from './nav'

// ⌘K menu: jump to any screen, search the question bank, or run an action.

const fade = keyframes` from { opacity : 0; } to { opacity : 1; } `
const enter = keyframes`
    from { opacity : 0; transform : translateY(-6px) scale(0.98); }
    to { opacity : 1; transform : none; }
`

const Backdrop = styled.div.attrs({
    className : `fixed inset-0 z-[1500] flex justify-center items-start px-3 pt-[10vh]` as string
})`
    background : rgb(15 15 15 / 0.4);
    animation : ${fade} 160ms ${({theme}) => theme.motion.easeOut};
`

const Panel = styled.div.attrs({
    className : `w-full max-w-[620px] rounded-xl overflow-hidden flex flex-col` as string
})`
    max-height : min(560px, 76vh);
    background : ${({theme}) => theme.color.surface};
    box-shadow : ${({theme}) => theme.shadows.float};
    animation : ${enter} 200ms ${({theme}) => theme.motion.easeOut};
    @media (prefers-reduced-motion : reduce) { animation : ${fade} 120ms linear; }
`

const Row = styled.div.attrs({
    className : `flex items-center gap-[10px] mx-1 px-2 h-[36px] rounded-md text-[14px] cursor-pointer` as string
})<{active : boolean}>`
    color : ${({theme}) => theme.color.ink};
    background : ${({theme, active}) => active ? theme.color.hover : 'transparent'};
    svg { color : ${({theme}) => theme.color.ink3}; flex-shrink : 0; }
`

interface Command {
    id : string
    group : 'Questions' | 'Go to' | 'Actions'
    label : string
    hint? : string
    icon? : IconType
    color? : string
    run : () => void
}

const themeIcons : Record<ThemeChoice, IconType> = { light : FiSun, dark : FiMoon, system : FiMonitor }

const CommandMenu = ({ open, onClose } : { open : boolean, onClose : () => void }) => {
    const navigate = useNavigate()
    const { can, signOut } = useAdmin()
    const { choice } = useTheme()
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(0)
    const [found, setFound] = useState<sample.Question[]>([])
    const [searching, setSearching] = useState(false)
    const input = useRef<HTMLInputElement>(null)
    const list = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        setQuery('')
        setFound([])
        setActive(0)
        const restore = document.activeElement as HTMLElement | null
        requestAnimationFrame(() => input.current?.focus())
        return () => restore?.focus()
    }, [open])

    // Search the bank as you type (debounced); stale responses are dropped
    useEffect(() => {
        const term = query.trim()
        if (!open || term.length < 2) { setFound([]); setSearching(false); return }
        let current = true
        setSearching(true)
        const timer = setTimeout(() => {
            api.fetchQuestionPage({ search : term }).then((page) => {
                if (!current) return
                setFound(page.items.slice(0, 6))
                setSearching(false)
            })
        }, 200)
        return () => { current = false; clearTimeout(timer) }
    }, [query, open])

    const commands = useMemo<Command[]>(() => {
        const go = (path : string) => () => navigate(path)
        const term = query.trim().toLowerCase()
        const matches = (text : string) => !term || text.toLowerCase().includes(term)

        const questions : Command[] = found.map((question) => ({
            id : `q-${question.id}`,
            group : 'Questions',
            label : sample.plainText(question.question),
            hint : sample.getCourse(question.courseID)?.code,
            color : sample.getCourse(question.courseID)?.color,
            icon : FiFileText,
            run : go(`/questions?open=${question.id}`),
        }))

        const pages : Command[] = navSections
            .filter((section) => section.title !== 'People' || can.managePeople)
            .flatMap((section) => section.items.map((item) => ({
                id : `p-${item.path}`,
                group : 'Go to' as const,
                label : item.label,
                hint : section.title,
                icon : item.icon,
                run : go(item.path),
            })))
            .filter((command) => matches(`${command.label} ${command.hint ?? ''}`))

        const themes = (['light', 'dark', 'system'] as ThemeChoice[]).filter((option) => option !== choice).map((option) => ({
            id : `t-${option}`,
            group : 'Actions' as const,
            label : option === 'system' ? 'Use system theme' : `Switch to ${option} theme`,
            icon : themeIcons[option],
            run : () => setTheme(option),
        }))

        const actions = ([
            { id : 'a-new', group : 'Actions', label : 'New question', icon : FiPlus, run : go('/addQuestions') },
            ...themes,
            { id : 'a-out', group : 'Actions', label : 'Log out', icon : FiLogOut, run : () => { signOut().then(() => navigate('/login', { replace : true })) } },
        ] as Command[]).filter((command) => matches(command.label))

        return [...questions, ...pages, ...actions]
    }, [found, query, can.managePeople, choice, navigate, signOut])

    useEffect(() => { setActive(0) }, [query, found.length])

    useEffect(() => {
        list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block : 'nearest' })
    }, [active])

    if (!open) return null

    const run = (command? : Command) => {
        if (!command) return
        onClose()
        command.run()
    }

    const onKeyDown = (event : React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => Math.min(index + 1, commands.length - 1)) }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)) }
        if (event.key === 'Enter') { event.preventDefault(); run(commands[active]) }
        if (event.key === 'Escape') { event.preventDefault(); onClose() }
    }

    const groups = (['Questions', 'Go to', 'Actions'] as const)
        .map((group) => ({ group, items : commands.map((command, index) => ({ command, index })).filter(({ command }) => command.group === group) }))
        .filter(({ items }) => items.length)

    return (
        <Backdrop onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <Panel role="dialog" aria-modal="true" aria-label="Command menu" onKeyDown={onKeyDown}>
                <div className="flex items-center gap-[10px] px-4 h-[52px] border-b border-line shrink-0">
                    <FiSearch size={17} className="text-ink-3 shrink-0" />
                    <input
                        ref={input}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search questions, screens and actions…"
                        className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-ink placeholder:text-ink-4"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls="command-list"
                        aria-activedescendant={commands[active] ? `command-${commands[active].id}` : undefined}
                    />
                    {searching && <span className="w-[14px] h-[14px] rounded-full border-2 border-line border-t-ink-3 animate-spin" aria-label="Searching" />}
                    <Kbd>esc</Kbd>
                </div>

                <div ref={list} id="command-list" role="listbox" className="overflow-y-auto py-1">
                    {groups.length === 0 && (
                        <div className="px-4 py-10 text-center text-[14px] text-ink-3">
                            {searching ? 'Searching…' : `No results for “${query.trim()}”`}
                        </div>
                    )}
                    {groups.map(({ group, items }) => (
                        <div key={group} className="pb-1">
                            <div className="px-4 pt-2 pb-1 text-[12px] font-medium text-ink-3">{group}</div>
                            {items.map(({ command, index }) => (
                                <Row key={command.id} id={`command-${command.id}`} role="option" aria-selected={index === active}
                                    data-index={index} active={index === active}
                                    onPointerMove={() => index !== active && setActive(index)}
                                    onClick={() => run(command)}>
                                    {command.icon && <command.icon size={15} />}
                                    <span className="flex-1 truncate">{command.label}</span>
                                    {command.hint && (
                                        <span className="flex items-center gap-[6px] text-[12px] text-ink-3 whitespace-nowrap">
                                            {command.color && <CourseDot color={command.color} />}{command.hint}
                                        </span>
                                    )}
                                    {index === active && <FiCornerDownLeft size={13} />}
                                </Row>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="hidden sm:flex items-center gap-4 px-4 h-[36px] border-t border-line text-[12px] text-ink-3 shrink-0">
                    <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
                    <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
                    <span className="ml-auto">Type 2+ letters to search questions</span>
                </div>
            </Panel>
        </Backdrop>
    )
}

export default CommandMenu
