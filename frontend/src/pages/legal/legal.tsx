import * as kit from '../../styles/kit'

interface Section { title : string, body : string[] }

const documents : Record<'terms' | 'privacy', { title : string, updated : string, intro : string, sections : Section[] }> = {
    terms : {
        title : 'Terms of use',
        updated : 'November 1, 2026',
        intro : 'These terms cover how you can use PrepRoom. By creating an account you agree to them.',
        sections : [
            { title : 'Your account', body : ['You are responsible for keeping your login details private and for activity on your account.', 'You must give accurate information about your school and programme.'] },
            { title : 'Using the question bank', body : ['Questions, explanations and discussions are for your personal study. Do not republish them in bulk.', 'Past papers remain the property of the institutions that set them.'] },
            { title : 'Community guidelines', body : ['Keep discussions respectful and on topic. Do not share answers to live, ongoing assessments.', 'We may remove content or suspend accounts that break these rules.'] },
            { title : 'Changes', body : ['We may update these terms. If a change is significant we will tell you in the app before it takes effect.'] },
        ],
    },
    privacy : {
        title : 'Privacy policy',
        updated : 'November 1, 2026',
        intro : 'This explains what we collect when you use PrepRoom, why, and the choices you have.',
        sections : [
            { title : 'What we collect', body : ['Your name, email, school and programme when you sign up.', 'Your answers, test results and streaks so we can show your progress.'] },
            { title : 'How we use it', body : ['To run your account, personalise practice, and rank daily challenges.', 'We never sell your personal data.'] },
            { title : 'Your choices', body : ['You can edit your profile or turn off email notifications from Settings at any time.', 'You can ask us to delete your account and associated data.'] },
            { title : 'Cookies', body : ['We use a single session cookie to keep you logged in.'] },
        ],
    },
}

const Legal = ({ kind } : { kind : 'terms' | 'privacy' }) => {

    const doc = documents[kind]

    return (
        <kit.Page>
            <kit.PageInner className='!max-w-[720px] !gap-10'>
                <div className='flex flex-col gap-3'>
                    <kit.Eyebrow>Last updated {doc.updated}</kit.Eyebrow>
                    <kit.PageTitle>{doc.title}</kit.PageTitle>
                    <kit.Lead>{doc.intro}</kit.Lead>
                </div>
                {
                    doc.sections.map((section, index) => (
                        <section key={section.title} className='flex flex-col gap-3 pt-8 border-t border-bone'>
                            <h2 className='font-display font-bold text-[20px] tracking-[-0.02em] text-ink'>
                                <span className='font-mono text-[13px] text-ash mr-3'>{String(index + 1).padStart(2, '0')}</span>
                                {section.title}
                            </h2>
                            {section.body.map((paragraph) => <kit.Body key={paragraph} className='!text-[15px]'>{paragraph}</kit.Body>)}
                        </section>
                    ))
                }
            </kit.PageInner>
        </kit.Page>
    )
}

export default Legal
