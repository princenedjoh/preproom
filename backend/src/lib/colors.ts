const palette = ['#6647f0', '#0091ff', '#16c0a4', '#fd9a46', '#f0457a', '#00c07a', '#202020']

export const colorFor = (seed : string) => {
    let hash = 0
    for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
    return palette[Math.abs(hash) % palette.length]
}

export const initialsOf = (first : string, last : string) =>
    `${first.trim()[0] ?? ''}${last.trim()[0] ?? ''}`.toUpperCase() || 'PR'
