import { ReactNode, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { FiX, FiWifiOff } from 'react-icons/fi'
import { IconType } from 'react-icons'
import { Empty, Avatar } from '../../styles/kit'
import { IconButton, Td, Tr } from '../../styles/adminKit'

/* Skeletons */

const shimmer = keyframes`
    from { background-position : 200% 0; }
    to { background-position : -200% 0; }
`

export const Skeleton = styled.span.attrs({
    className : `Skeleton block rounded-[6px]` as string
})<{width? : string, height? : number}>`
    width : ${({width}) => width ?? '100%'};
    height : ${({height}) => height ?? 12}px;
    background : linear-gradient(90deg, #f1f2f4 25%, #e8e9ec 37%, #f1f2f4 63%);
    background-size : 400% 100%;
    animation : ${shimmer} 1.4s ease infinite;
    @media (prefers-reduced-motion : reduce) { animation : none; }
`

export const SkeletonRows = ({ columns, rows = 6 } : { columns : number, rows? : number }) => (
    <>
        {Array.from({ length : rows }).map((_, row) => (
            <Tr key={row}>
                {Array.from({ length : columns }).map((__, column) => (
                    <Td key={column}>
                        <Skeleton width={column === 0 ? '70%' : `${40 + ((row + column) % 3) * 15}%`} />
                    </Td>
                ))}
            </Tr>
        ))}
    </>
)

/* Empty state */

export const EmptyState = ({ icon : Icon, title, body, action } : {
    icon : IconType, title : string, body? : string, action? : ReactNode
}) => (
    <Empty>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-mist border border-bone text-ink">
            <Icon size={16} />
        </span>
        <span className="text-[15px] font-bold text-ink">{title}</span>
        {body && <span className="text-[13px] max-w-[340px] leading-[1.5]">{body}</span>}
        {action}
    </Empty>
)

/* Sample data notice */

const NoticePill = styled.span.attrs({
    className : `NoticePill inline-flex items-center gap-[6px] rounded-full px-3 h-[26px] text-[12px] font-semibold whitespace-nowrap` as string
})`
    color : ${({theme}) => theme.colors2.orange.orange1};
    background : ${({theme}) => theme.colors2.orange.orange5};
`

export const SampleNotice = ({ live } : { live : boolean }) => live ? null : (
    <NoticePill title="The API did not respond, so this screen shows sample data. Changes are kept only until you reload.">
        <FiWifiOff size={12} /> Sample data
    </NoticePill>
)

/* People */

export const initials = (name : string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

export const PersonAvatar = ({ name, color, size = 28 } : { name : string, color : string, size? : number }) => (
    <Avatar color={color} size={size} ring="transparent" style={{ fontSize : size > 30 ? 12 : 10, border : 'none' }}>
        {initials(name)}
    </Avatar>
)

/* Dialog */

const fadeIn = keyframes` from { opacity : 0; } to { opacity : 1; } `
const rise = keyframes`
    from { opacity : 0; transform : translateY(8px) scale(0.96); }
    to { opacity : 1; transform : none; }
`

const Backdrop = styled.div.attrs({
    className : `Backdrop fixed inset-0 z-[1300] flex items-end sm:items-center justify-center p-0 sm:p-6` as string
})`
    background : rgba(9, 12, 29, 0.32);
    animation : ${fadeIn} 200ms cubic-bezier(0.23, 1, 0.32, 1);
`

const DialogPanel = styled.div.attrs({
    className : `DialogPanel w-full sm:max-w-[480px] max-h-[90vh] overflow-y-auto rounded-t-[20px] sm:rounded-[16px] flex flex-col` as string
})`
    background : ${({theme}) => theme.colors.background.light.white};
    box-shadow : ${({theme}) => theme.shadows.screenshot};
    animation : ${rise} 260ms cubic-bezier(0.23, 1, 0.32, 1);
    @media (prefers-reduced-motion : reduce) { animation : ${fadeIn} 160ms linear; }
`

export const Dialog = ({ open, title, description, onClose, children, footer } : {
    open : boolean, title : string, description? : string, onClose : () => void, children? : ReactNode, footer? : ReactNode
}) => {
    const panel = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onKey = (event : KeyboardEvent) => event.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        panel.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null
    return (
        <Backdrop onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <DialogPanel ref={panel} role="dialog" aria-modal="true" aria-label={title}>
                <div className="flex items-start justify-between gap-4 px-6 pt-5">
                    <div className="flex flex-col gap-1">
                        <span className="font-display text-[18px] font-bold tracking-[-0.02em] text-ink">{title}</span>
                        {description && <span className="text-[13px] text-muted leading-[1.5]">{description}</span>}
                    </div>
                    <IconButton onClick={onClose} aria-label="Close"><FiX size={16} /></IconButton>
                </div>
                {children ? <div className="flex flex-col gap-4 px-6 py-5">{children}</div> : <div className="h-5" />}
                {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-bone bg-mist">{footer}</div>}
            </DialogPanel>
        </Backdrop>
    )
}
