import type { Tone } from './kit'

// Course and person colours come from data as arbitrary hex; on screen they are
// mapped to Notion's tag palette so they sit quietly in both themes.
const known : Record<string, Tone> = {
    '#6647f0' : 'purple', '#0091ff' : 'blue', '#fd9a46' : 'orange', '#16c0a4' : 'green', '#f0457a' : 'pink',
}
const cycle : Tone[] = ['blue', 'purple', 'orange', 'green', 'pink', 'brown', 'yellow', 'red']

export const toneOf = (key : string, colour? : string) : Tone => {
    const hit = colour && known[colour.toLowerCase()]
    if(hit) return hit
    let hash = 0
    for(const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0
    return cycle[Math.abs(hash) % cycle.length]
}

export const toneVar = (tone : Tone) => `rgb(var(--tag-${tone}))`
export const toneBgVar = (tone : Tone) => `rgb(var(--tag-${tone}-bg))`
