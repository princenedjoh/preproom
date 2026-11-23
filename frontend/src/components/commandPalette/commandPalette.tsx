import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { IconType } from 'react-icons'
import { getCourse, useCatalog, cachedQuestions } from '../../data/catalog'
import { dailyIndex, reviewLink } from '../../store/progress'
import { getLenis } from '../smoothScroll/smoothScroll'
import { FiSearch, FiSun, FiBookOpen, FiClock, FiAward, FiUser, FiBell, FiBookmark, FiRotateCcw, FiHelpCircle, FiCornerDownLeft } from 'react-icons/fi'

interface Item {
    id : string
    group : 'Go to' | 'Courses' | 'Actions' | 'Questions'
    label : string
    hint? : string
    icon? : IconType
    color? : string
    run : () => void
}

// Opened with ⌘K / Ctrl K or "/". Deliberately no open/close animation: it is a
// keyboard tool used many times a day, so it must feel instant.
export const useCommandPalette = () => {
    const [open, setOpen] = useState(false)
    useEffect(()=>{
        const onKey = (event : KeyboardEvent) => {
            const target = event.target
            const typing = target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')
            if((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'){
                event.preventDefault()
                setOpen((value) => !value)
            }
            else if(event.key === '/' && !typing){
                event.preventDefault()
                setOpen(true)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    },[])
    return [open, setOpen] as const
}

const CommandPalette = ({ open, onClose } : { open : boolean, onClose : () => void }) => {

    const navigate = useNavigate()
    const { courses } = useCatalog()
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(0)
    const input = useRef<HTMLInputElement>(null)
    const list = useRef<HTMLDivElement>(null)
    const returnFocus = useRef<HTMLElement | null>(null)

    useEffect(()=>{
        if(!open) return
        returnFocus.current = document.activeElement as HTMLElement
        setQuery('')
        setActive(0)
        const lenis = getLenis()
        lenis?.stop()
        document.body.style.overflow = 'hidden'
        requestAnimationFrame(() => input.current?.focus())
        return () => {
            lenis?.start()
            document.body.style.overflow = ''
            returnFocus.current?.focus?.()
        }
    },[open])

    const go = (route : string, state? : unknown) => () => { onClose(); navigate(route, state ? { state } : undefined) }

    const items = useMemo<Item[]>(() => {
        const today = courses[dailyIndex(courses.length)]
        const base : Item[] = [
            { id : 'today', group : 'Go to', label : 'Today', icon : FiSun, run : go('/today') },
            { id : 'questions', group : 'Go to', label : 'Questions', icon : FiBookOpen, run : go('/questions') },
            { id : 'test', group : 'Go to', label : 'Test setup and history', icon : FiClock, run : go('/test/testconfig') },
            { id : 'challenges', group : 'Go to', label : 'Challenges', icon : FiAward, run : go('/challenges') },
            { id : 'notifications', group : 'Go to', label : 'Notifications', icon : FiBell, run : go('/notification') },
            { id : 'profile', group : 'Go to', label : 'Profile and settings', icon : FiUser, run : go('/profile') },
            { id : 'help', group : 'Go to', label : 'Help and contact', icon : FiHelpCircle, run : go('/contact') },
            { id : 'challenge', group : 'Actions', label : "Start today's challenge", hint : today.name, icon : FiAward,
                run : go('/test/session', { courseID : today.id, mode : 'challenge', count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false }) },
            { id : 'saved', group : 'Actions', label : 'Saved questions', icon : FiBookmark, run : () => go(reviewLink('saved'))() },
            { id : 'mistakes', group : 'Actions', label : 'Review mistakes', icon : FiRotateCcw, run : () => go(reviewLink('mistakes'))() },
            ...courses.map((course) : Item => ({
                id : `course-${course.id}`, group : 'Courses', label : course.name, hint : course.code, color : course.color, run : go(`/questions/${course.id}`),
            })),
        ]
        const term = query.trim().toLowerCase()
        if(!term) return base
        const words = term.split(/\s+/)
        const matches = (text : string) => words.every((word) => text.toLowerCase().includes(word))
        const found = base.filter((item) => matches(`${item.label} ${item.hint ?? ''}`))
        const questionHits = term.length < 2 ? [] : cachedQuestions()
            .filter((question) => matches(`${question.question} ${question.topic}`))
            .slice(0, 6)
            .map((question) : Item => {
                const course = getCourse(question.courseID)
                return {
                    id : `q-${question.id}`, group : 'Questions', label : question.question.replace(/<[^>]+>/g, ''),
                    hint : `${course.code} · ${question.topic}`, color : course.color,
                    run : go(`/questions/${course.id}?q=${encodeURIComponent(question.question.slice(0, 40))}`),
                }
            })
        return [...found, ...questionHits]
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[query, courses])

    useEffect(()=>{ setActive(0) },[query])

    useEffect(()=>{
        list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block : 'nearest' })
    },[active])

    if(!open) return null

    const onKeyDown = (event : React.KeyboardEvent) => {
        if(event.key === 'ArrowDown'){ event.preventDefault(); setActive((value) => Math.min(items.length - 1, value + 1)) }
        else if(event.key === 'ArrowUp'){ event.preventDefault(); setActive((value) => Math.max(0, value - 1)) }
        else if(event.key === 'Enter'){ event.preventDefault(); items[active]?.run() }
        else if(event.key === 'Escape'){ event.preventDefault(); onClose() }
        else if(event.key === 'Tab'){ event.preventDefault() }
    }

    const groups = Array.from(new Set(items.map((item) => item.group)))
    let index = -1

    return createPortal(
        <div className='fixed inset-0 z-[1000] flex items-start justify-center px-4 pt-[12vh]' onKeyDown={onKeyDown}>
            <div className='absolute inset-0 bg-[rgba(9,12,29,0.32)]' onMouseDown={onClose} aria-hidden/>
            <div
                role='dialog'
                aria-modal='true'
                aria-label='Command menu'
                className='relative w-full max-w-[580px] rounded-[16px] bg-white border border-bone overflow-hidden'
                style={{ boxShadow : 'rgba(13, 21, 48, 0.18) 0px 40px 80px -20px, rgba(13, 21, 48, 0.08) 0px 12px 24px -8px' }}
            >
                <div className='flex items-center gap-3 px-5 h-[56px] border-b border-bone'>
                    <FiSearch size={17} className='text-ash shrink-0'/>
                    <input
                        ref={input}
                        value={query}
                        onChange={(event)=>setQuery(event.target.value)}
                        placeholder='Search pages, courses and questions'
                        className='flex-1 h-full bg-transparent outline-none text-[15px] text-ink placeholder:text-ash'
                        role='combobox'
                        aria-expanded='true'
                        aria-controls='command-list'
                        aria-activedescendant={items[active] ? `cmd-${items[active].id}` : undefined}
                    />
                    <kbd className='font-mono text-[11px] text-ash border border-bone rounded-[6px] px-[6px] py-[1px]'>Esc</kbd>
                </div>
                <div ref={list} id='command-list' role='listbox' className='max-h-[min(420px,60vh)] overflow-y-auto p-2' data-lenis-prevent>
                    {
                        items.length === 0 ?
                        <div className='px-4 py-10 text-center text-[14px] text-muted'>No results for “{query}”</div>
                        :
                        groups.map((group) => (
                            <div key={group} className='flex flex-col pb-1'>
                                <span className='px-3 pt-3 pb-[6px] font-mono text-[10px] uppercase tracking-[0.08em] text-ash'>{group}</span>
                                {
                                    items.filter((item) => item.group === group).map((item) => {
                                        index += 1
                                        const current = index
                                        const selected = current === active
                                        return (
                                            <div
                                                key={item.id}
                                                id={`cmd-${item.id}`}
                                                role='option'
                                                aria-selected={selected}
                                                data-index={current}
                                                onMouseMove={()=>!selected && setActive(current)}
                                                onClick={item.run}
                                                className={`flex items-center gap-3 rounded-[9px] px-3 py-[9px] cursor-pointer text-[14px] ${selected ? 'bg-mist text-ink' : 'text-carbon'}`}
                                            >
                                                {
                                                    item.icon ? <item.icon size={15} className='text-ash shrink-0'/>
                                                    : <span className='w-[15px] flex justify-center shrink-0'><span className='w-[8px] h-[8px] rounded-[3px]' style={{ background : item.color }}/></span>
                                                }
                                                <span className='flex-1 min-w-0 truncate font-medium'>{item.label}</span>
                                                {item.hint && <span className='text-[12px] text-ash shrink-0 truncate max-w-[40%]'>{item.hint}</span>}
                                                {selected && <FiCornerDownLeft size={13} className='text-ash shrink-0'/>}
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        ))
                    }
                </div>
                <div className='hidden sm:flex items-center gap-4 px-5 h-[40px] border-t border-bone bg-mist text-[12px] text-ash'>
                    <span className='flex items-center gap-1'><kbd className='font-mono'>↑↓</kbd> move</span>
                    <span className='flex items-center gap-1'><kbd className='font-mono'>↵</kbd> open</span>
                    <span className='flex items-center gap-1'><kbd className='font-mono'>esc</kbd> close</span>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default CommandPalette
