import { ReactNode, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { pressable } from '../../styles/kit'

// A floating menu anchored to its trigger. It grows from the corner it is
// attached to, closes on outside click or Escape, and returns focus.

const pop = keyframes`
    from { opacity : 0; transform : scale(0.96); }
    to { opacity : 1; transform : scale(1); }
`

const Panel = styled.div.attrs({
    className : `MenuPanel absolute z-[1400] flex flex-col p-1 rounded-lg` as string
})<{align : 'start' | 'end', side : 'top' | 'bottom'}>`
    min-width : 220px;
    ${({align}) => align === 'start' ? 'left : 0;' : 'right : 0;'}
    ${({side}) => side === 'bottom' ? 'top : calc(100% + 4px);' : 'bottom : calc(100% + 4px);'}
    transform-origin : ${({align, side}) => `${side === 'bottom' ? 'top' : 'bottom'} ${align === 'start' ? 'left' : 'right'}`};
    background : ${({theme}) => theme.color.surface};
    box-shadow : ${({theme}) => theme.shadows.float};
    animation : ${pop} 160ms ${({theme}) => theme.motion.easeOut};
    @media (prefers-reduced-motion : reduce) { animation : none; }
`

export const MenuItem = styled.button.attrs({
    className : `MenuItem flex items-center gap-2 w-full h-[30px] px-2 rounded-md text-[14px] text-left` as string
})<{danger? : boolean}>`
    color : ${({theme, danger}) => danger ? theme.color.tag.red : theme.color.ink};
    ${pressable}
    &:active:not(:disabled) { transform : none; }
    svg { color : ${({theme, danger}) => danger ? theme.color.tag.red : theme.color.ink3}; flex-shrink : 0; }
    @media (hover : hover) and (pointer : fine) { &:hover { background : ${({theme}) => theme.color.hover}; } }
`

export const MenuDivider = styled.hr.attrs({ className : `my-1 mx-[-4px]` as string })`
    border : none;
    border-top : 1px solid ${({theme}) => theme.color.line};
`

export const MenuLabel = styled.span.attrs({
    className : `block px-2 pt-[6px] pb-1 text-[12px] font-medium` as string
})`
    color : ${({theme}) => theme.color.ink3};
`

export const Menu = ({ open, onClose, align = 'start', side = 'bottom', className, children } : {
    open : boolean, onClose : () => void, align? : 'start' | 'end', side? : 'top' | 'bottom', className? : string, children : ReactNode
}) => {
    const panel = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const trigger = document.activeElement as HTMLElement | null
        const onPointer = (event : PointerEvent) => {
            const host = panel.current?.parentElement
            if (host && !host.contains(event.target as Node)) onClose()
        }
        const onKey = (event : KeyboardEvent) => {
            if (event.key === 'Escape') { onClose(); trigger?.focus() }
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [role="radio"]') ?? [])
            const index = items.indexOf(document.activeElement as HTMLElement)
            const next = event.key === 'ArrowDown' ? items[(index + 1) % items.length] : items[(index - 1 + items.length) % items.length]
            next?.focus()
            event.preventDefault()
        }
        document.addEventListener('pointerdown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('pointerdown', onPointer)
            document.removeEventListener('keydown', onKey)
        }
    }, [open, onClose])

    if (!open) return null
    return <Panel ref={panel} role="menu" align={align} side={side} className={className}>{children}</Panel>
}
