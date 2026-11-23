import { ReactNode, useEffect, useState } from 'react'

// Building blocks for the dark, premium pages. Colour stays scarce: one soft spotlight per hero,
// a hairline top edge on surfaces, and tone only where it carries meaning.

type Tone = 'accent' | 'success' | 'medium' | 'hard' | 'easy' | 'purple' | 'blue' | 'orange' | 'green' | 'pink' | 'yellow' | 'red' | 'brown' | 'gray'

export const toneRgb = (tone : Tone) => ['accent', 'success', 'medium', 'hard', 'easy'].includes(tone) ? `var(--${tone})` : `var(--tag-${tone})`

// A single soft light source behind a hero, never a gradient fill
export const Glow = ({ tone = 'accent', className = '', strength = 0.06 } : { tone? : Tone, className? : string, strength? : number }) => (
    <span aria-hidden className={`pointer-events-none absolute ${className}`}
        style={{ background : `radial-gradient(closest-side, rgb(${toneRgb(tone)} / ${strength}), transparent)` }}/>
)

// The page's opening band: eyebrow, title, a line of context, and an optional right-hand slot
export const PageHero = ({ eyebrow, title, sub, right, tone = 'accent', children } : { eyebrow? : ReactNode, title : ReactNode, sub? : ReactNode, right? : ReactNode, tone? : Tone, children? : ReactNode }) => (
    <section className='relative isolate'>
        <Glow tone={tone} className='-z-10 -top-40 -left-24 w-[640px] h-[420px]' strength={0.06}/>
        <div className='flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10'>
            <div className='flex flex-col gap-3 flex-1 min-w-0'>
                {eyebrow && <span className='text-[13px] font-medium text-ink-3 inline-flex items-center gap-2'>{eyebrow}</span>}
                <h1 className='text-[34px] md:text-[44px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink text-balance'>{title}</h1>
                {sub && <p className='text-[15px] md:text-[16px] leading-[1.55] text-ink-2 max-w-[560px] text-pretty'>{sub}</p>}
            </div>
            {right}
        </div>
        {children}
    </section>
)

// Premium surface: hairline border, lit top edge, soft depth
export const Surface = ({ children, className = '', as : Tag = 'div', ...rest } : { children : ReactNode, className? : string, as? : any, [key : string] : any }) => (
    <Tag className={`relative rounded-xl bg-surface border border-line shadow-card ${className}`} {...rest}>{children}</Tag>
)

// Progress ring with a centred label
export const Ring = ({ value, size = 64, stroke = 5, tone = 'success', children } : { value : number, size? : number, stroke? : number, tone? : Tone, children? : ReactNode }) => {
    const r = (size - stroke) / 2
    const c = 2 * Math.PI * r
    const share = Math.max(0, Math.min(1, value))
    return (
        <span className='relative inline-flex shrink-0' style={{ width : size, height : size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className='w-full h-full -rotate-90'>
                <circle cx={size / 2} cy={size / 2} r={r} fill='none' strokeWidth={stroke} stroke='rgb(255 255 255 / 0.07)'/>
                {share > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill='none' strokeWidth={stroke} strokeLinecap='round' stroke={`rgb(${toneRgb(tone)})`}
                    strokeDasharray={`${c * share} ${c}`} style={{ transition : 'stroke-dasharray 700ms var(--ease-out)', filter : `drop-shadow(0 0 3px rgb(${toneRgb(tone)} / 0.15))` }}/>}
            </svg>
            <span className='absolute inset-0 flex flex-col items-center justify-center leading-none'>{children}</span>
        </span>
    )
}

// Counts up once when it first appears; instant with reduced motion
export const CountUp = ({ to, duration = 900, format = (value : number) => value.toLocaleString() } : { to : number, duration? : number, format? : (value : number) => string }) => {
    const [value, setValue] = useState(0)
    useEffect(() => {
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ setValue(to); return }
        let frame = 0
        const start = performance.now()
        const step = (now : number) => {
            const t = Math.min(1, (now - start) / duration)
            setValue(Math.round(to * (1 - Math.pow(1 - t, 4))))
            if(t < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    }, [to, duration])
    return <>{format(value)}</>
}

// Small bar chart: one bar per day, height by volume, the share answered right shown in tone
export const DayBars = ({ days, height = 96 } : { days : { label : string, total : number, correct : number, today? : boolean }[], height? : number }) => {
    const max = Math.max(1, ...days.map((day) => day.total))
    return (
        <div className='flex items-end gap-[6px]' style={{ height : height + 18 }} role='img'
            aria-label={days.map((day) => `${day.label}: ${day.total} answered, ${day.correct} right`).join('; ')}>
            {days.map((day, index) => {
                const h = day.total ? Math.max(6, day.total / max * height) : 3
                const right = day.total ? day.correct / day.total : 0
                return (
                    <div key={index} className='flex-1 flex flex-col items-center gap-[6px] min-w-0 group'>
                        <div className='relative w-full max-w-[22px] rounded-[4px] overflow-hidden bg-white/[0.06] transition-[height] duration-700 ease-out' style={{ height : h }} title={`${day.total} answered · ${day.correct} right`}>
                            {day.total > 0 && <span className='absolute inset-x-0 bottom-0 bg-success/80 group-hover:bg-success transition-colors' style={{ height : `${right * 100}%` }}/>}
                        </div>
                        <span className={`text-[10px] leading-none ${day.today ? 'text-ink font-semibold' : 'text-ink-4'}`}>{day.label}</span>
                    </div>
                )
            })}
        </div>
    )
}
