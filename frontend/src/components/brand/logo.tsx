// The PrepRoom mark: a sheet of paper with a folded corner — past papers, the thing
// the product is built around. Drawn in ink so it inverts with the theme.
export const Mark = ({ size = 22 } : { size? : number }) => (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' aria-hidden='true' className='shrink-0'>
        <path d='M5 2.75h9.6L20.25 8.4V19A2.25 2.25 0 0 1 18 21.25H6A2.25 2.25 0 0 1 3.75 19V5A2.25 2.25 0 0 1 6 2.75Z' fill='rgb(var(--surface))' stroke='rgb(var(--ink))' strokeWidth='1.5' strokeLinejoin='round'/>
        <path d='M14.5 2.9V7a1.5 1.5 0 0 0 1.5 1.5h4.1' stroke='rgb(var(--ink))' strokeWidth='1.5' strokeLinejoin='round'/>
        <path d='M8.25 17V9.75h2.6a2.15 2.15 0 0 1 0 4.3h-2.6' stroke='rgb(var(--ink))' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'/>
    </svg>
)

export const Wordmark = ({ size = 22 } : { size? : number }) => (
    <span className='inline-flex items-center gap-2 select-none'>
        <Mark size={size}/>
        <span className='text-[15px] font-semibold tracking-[-0.02em] text-ink'>PrepRoom</span>
    </span>
)
