import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'
import theme from '../../styles/theme'
import * as kit from '../../styles/kit'

interface Options {
    title : string
    content? : string
    okText? : string
    cancelText? : string
    danger? : boolean
    onOk? : () => unknown
}

// A small themed confirm dialog, called imperatively like antd's Modal.confirm.
// Centred (a modal isn't anchored to a trigger), scales in from 0.96, Esc / Enter work.
const Dialog = ({ title, content, okText = 'OK', cancelText = 'Cancel', danger, onOk, close } : Options & { close : () => void }) => {
    const ok = useRef<HTMLButtonElement>(null)
    const returnFocus = useRef(document.activeElement as HTMLElement | null)

    useEffect(() => {
        ok.current?.focus()
        const onKey = (event : KeyboardEvent) => {
            if(event.key === 'Escape'){ event.preventDefault(); event.stopPropagation(); close() }
        }
        window.addEventListener('keydown', onKey, true)
        document.body.style.overflow = 'hidden'
        const previous = returnFocus.current
        return () => {
            window.removeEventListener('keydown', onKey, true)
            document.body.style.overflow = ''
            previous?.focus?.()
        }
    }, [close])

    const confirm = async () => { close(); await onOk?.() }

    return (
        <div className='fixed inset-0 z-[1100] flex items-center justify-center px-4'>
            <div className='absolute inset-0 animate-[fade_160ms_ease-out]' style={{ background : 'var(--scrim)' }} onMouseDown={close}/>
            <div role='alertdialog' aria-modal='true' aria-labelledby='confirm-title' aria-describedby={content ? 'confirm-body' : undefined}
                className='relative w-full max-w-[400px] rounded-xl bg-surface shadow-float p-5 flex flex-col gap-2 animate-[pop_180ms_var(--ease-out)]'>
                <h2 id='confirm-title' className='text-[16px] font-semibold tracking-[-0.01em] text-ink'>{title}</h2>
                {content && <p id='confirm-body' className='text-[14px] leading-[1.55] text-ink-2'>{content}</p>}
                <div className='flex justify-end gap-2 pt-3'>
                    <kit.SecondaryButton type='button' onClick={close}>{cancelText}</kit.SecondaryButton>
                    <kit.PrimaryButton ref={ok} type='button' onClick={confirm} className={danger ? '!bg-tag-red hover:!bg-tag-red/90' : ''}>{okText}</kit.PrimaryButton>
                </div>
            </div>
        </div>
    )
}

export const confirm = (options : Options) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const close = () => { root.unmount(); host.remove() }
    root.render(<ThemeProvider theme={theme}><Dialog {...options} close={close}/></ThemeProvider>)
}
