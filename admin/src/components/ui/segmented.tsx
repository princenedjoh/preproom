import { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { pressable } from '../../styles/kit'

// Segmented control with a thumb that slides to the selected option.
// The thumb is positioned with transform, so it animates on the compositor and
// retargets smoothly if the selection changes again mid-slide.

export interface SegmentedOption<T extends string | number> {
    value : T
    label : ReactNode
}

interface Props<T extends string | number> {
    options : readonly SegmentedOption<T>[] | readonly T[]
    value : T
    onChange : (value : T) => void
    fullWidth? : boolean
    className? : string
    'aria-label'? : string
}

const Track = styled.div.attrs({
    className : `Segmented relative inline-flex items-center gap-1 rounded-full p-1 max-w-full overflow-x-auto` as string
})<{full? : boolean}>`
    width : ${({full}) => full ? '100%' : 'auto'};
    background : ${({theme}) => theme.colors.background.light.primary};
    border : ${({theme}) => `1px solid ${theme.colors.border.light.primary}`};
    scrollbar-width : none;
    &::-webkit-scrollbar { display : none; }
`

const Thumb = styled.span.attrs({
    className : `absolute left-0 top-1 bottom-1 rounded-full pointer-events-none` as string
})<{ready : boolean}>`
    background : ${({theme}) => theme.colors.background.light.white};
    box-shadow : ${({theme}) => theme.shadows.subtle};
    transition : ${({ready, theme}) => ready
        ? `transform 260ms ${theme.motion.easeOut}, width 260ms ${theme.motion.easeOut}`
        : 'none'};
    @media (prefers-reduced-motion : reduce) { transition : none; }
`

const Item = styled.button.attrs({
    className : `relative z-[1] rounded-full px-4 py-[6px] text-[13px] whitespace-nowrap` as string
})<{active? : boolean, full? : boolean}>`
    flex : ${({full}) => full ? '1 1 0' : '0 0 auto'};
    font-weight : 600;
    color : ${({theme, active}) => active ? theme.colors.main.primary : theme.colors2.gray.gray3};
    ${pressable}
    @media (hover : hover) and (pointer : fine) {
        &:hover { color : ${({theme}) => theme.colors.main.primary}; }
    }
`

function SegmentedControl<T extends string | number>({ options, value, onChange, fullWidth, className, ...rest } : Props<T>){

    const normalized = (options as readonly any[]).map((option) =>
        typeof option === 'object' ? option as SegmentedOption<T> : { value : option as T, label : option })

    const track = useRef<HTMLDivElement>(null)
    const [thumb, setThumb] = useState<{ x : number, width : number } | null>(null)
    const [ready, setReady] = useState(false)

    useLayoutEffect(()=>{
        const element = track.current
        if(!element) return
        const measure = () => {
            const active = element.querySelector<HTMLButtonElement>('[aria-checked="true"]')
            if(!active) return setThumb(null)
            setThumb({ x : active.offsetLeft, width : active.offsetWidth })
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    },[value, normalized.length])

    // Enable the transition only after the first placement so the thumb doesn't fly in from the left
    useLayoutEffect(()=>{
        if(thumb && !ready){
            const id = requestAnimationFrame(() => setReady(true))
            return () => cancelAnimationFrame(id)
        }
    },[thumb, ready])

    const onKeyDown = (event : React.KeyboardEvent) => {
        const index = normalized.findIndex((option) => option.value === value)
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
        if(!delta) return
        event.preventDefault()
        const next = normalized[(index + delta + normalized.length) % normalized.length]
        onChange(next.value)
        track.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus()
    }

    return (
        <Track ref={track} full={fullWidth} className={className} role='radiogroup' aria-label={rest['aria-label']} onKeyDown={onKeyDown}>
            {thumb && <Thumb ready={ready} style={{ width : thumb.width, transform : `translateX(${thumb.x}px)` }}/>}
            {
                normalized.map((option) => {
                    const active = option.value === value
                    return (
                        <Item
                            key={String(option.value)}
                            type='button'
                            role='radio'
                            aria-checked={active}
                            tabIndex={active ? 0 : -1}
                            data-value={option.value}
                            active={active}
                            full={fullWidth}
                            onClick={()=>onChange(option.value)}
                        >
                            {option.label}
                        </Item>
                    )
                })
            }
        </Track>
    )
}

export default SegmentedControl
