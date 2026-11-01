import * as homeStyle from '../../home.styled'

const topics = [
    'Data Structures', 'Mechanics', 'Calculus II', 'Organic Chemistry', 'Microeconomics',
    'Python', 'Thermodynamics', 'Linear Algebra', 'Ergonomics', 'Astrophysics', 'Statistics',
]

// Grayscale "trusted by"-style strip; the track is duplicated so GSAP can loop it seamlessly
const Topics = () => {
    return (
        <homeStyle.Section>
            <homeStyle.Container className='flex flex-col items-center gap-6 pb-20 md:pb-24'>
                <homeStyle.Eyebrow>Practice across every course</homeStyle.Eyebrow>
                <div 
                    className='w-full overflow-hidden'
                    style={{ 
                        maskImage : 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
                        WebkitMaskImage : 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
                    }}
                >
                    <div data-marquee className='flex w-max'>
                        {
                            [0, 1].map((copy) => (
                                <div key={copy} className='flex items-center shrink-0' aria-hidden={copy === 1}>
                                    {
                                        topics.map((topic) => (
                                            <span 
                                                key={topic}
                                                className='font-display font-semibold text-[22px] md:text-[26px] tracking-[-0.03em] text-fog whitespace-nowrap px-6 md:px-8'
                                            >
                                                {topic}
                                            </span>
                                        ))
                                    }
                                </div>
                            ))
                        }
                    </div>
                </div>
            </homeStyle.Container>
        </homeStyle.Section>
    )
}

export default Topics
