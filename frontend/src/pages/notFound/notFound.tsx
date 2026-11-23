import { useNavigate } from 'react-router-dom'
import * as kit from '../../styles/kit'

const NotFound = () => {

    const navigate = useNavigate()

    return (
        <kit.Page>
            <kit.PageInner className='items-center text-center !gap-6 pt-16'>
                <kit.Eyebrow>Error 404</kit.Eyebrow>
                <span className='font-semibold text-[96px] md:text-[140px] leading-none tracking-[-0.06em] text-ink-4 tabular-nums'>404</span>
                <kit.PageTitle>This page skipped class.</kit.PageTitle>
                <kit.Lead className='max-w-[460px]'>The link may be broken, or the page may have moved.</kit.Lead>
                <div className='flex flex-wrap justify-center gap-3'>
                    <kit.PrimaryButton type='button' onClick={()=>navigate('/')}>Back to home</kit.PrimaryButton>
                    <kit.GhostButton type='button' onClick={()=>navigate('/questions')}>Browse questions</kit.GhostButton>
                </div>
            </kit.PageInner>
        </kit.Page>
    )
}

export default NotFound
