import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'
import { setTheme, useTheme, ThemeChoice } from '../../store/theme'

const options : { value : ThemeChoice, label : string, icon : typeof FiSun }[] = [
    { value : 'light', label : 'Light', icon : FiSun },
    { value : 'dark', label : 'Dark', icon : FiMoon },
    { value : 'system', label : 'System', icon : FiMonitor },
]

// Three-way switch: light, dark, or follow the device
const ThemeSwitch = ({ wide = false } : { wide? : boolean }) => {
    const { choice } = useTheme()
    return (
        <div role='radiogroup' aria-label='Theme' className={`inline-flex items-center gap-[2px] rounded-md bg-subtle p-[3px] ${wide ? 'w-full' : ''}`}>
            {
                options.map(({ value, label, icon : Icon }) => (
                    <button
                        key={value}
                        type='button'
                        role='radio'
                        aria-checked={choice === value}
                        aria-label={label}
                        title={label}
                        onClick={()=>setTheme(value)}
                        className={`inline-flex items-center justify-center gap-[6px] h-7 rounded-[6px] text-[12px] font-medium transition-colors duration-100
                        ${wide ? 'flex-1' : 'w-8'}
                        ${choice === value ? 'bg-surface text-ink shadow-press' : 'text-ink-3 hover:text-ink'}`}
                    >
                        <Icon size={13}/>
                        {wide && label}
                    </button>
                ))
            }
        </div>
    )
}

export default ThemeSwitch
