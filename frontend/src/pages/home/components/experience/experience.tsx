import * as homeStyle from '../../home.styled'

const steps = [
    {
        number : '01',
        title : 'Pick your course',
        text : 'Choose your programme and the courses you are writing this semester.',
    },
    {
        number : '02',
        title : 'Practice by topic',
        text : 'Filter questions by topic and difficulty, then check your answer and the explanation.',
    },
    {
        number : '03',
        title : 'Test yourself on the clock',
        text : 'Run a timed mock test, review what you missed and track how you are improving.',
    },
]

const Experience = () => {
    return (
        <homeStyle.Section band>
            <homeStyle.Container className='flex flex-col gap-12 py-20 md:py-24'>
                <div data-reveal className='flex flex-col md:flex-row md:items-end md:justify-between gap-4'>
                    <div className='flex flex-col gap-4 max-w-[560px]'>
                        <homeStyle.Eyebrow>How it works</homeStyle.Eyebrow>
                        <homeStyle.Heading>From first question to exam day.</homeStyle.Heading>
                    </div>
                    <homeStyle.Lead className='max-w-[380px]'>
                        Three steps, no setup. Your progress is saved as you go.
                    </homeStyle.Lead>
                </div>
                <div data-stagger className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {
                        steps.map((step) => (
                            <div key={step.number} className='flex flex-col gap-3 rounded-lg bg-surface border border-line p-7'>
                                <span className='font-display font-bold text-[60px] md:text-[72px] leading-none tracking-[-0.04em] text-onyx'>
                                    {step.number}
                                </span>
                                <homeStyle.Title className='pt-2'>{step.title}</homeStyle.Title>
                                <homeStyle.Body>{step.text}</homeStyle.Body>
                            </div>
                        ))
                    }
                </div>
            </homeStyle.Container>
        </homeStyle.Section>
    )
}

export default Experience
