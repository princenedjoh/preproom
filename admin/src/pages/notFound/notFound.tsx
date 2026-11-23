import { useNavigate } from 'react-router-dom'
import { FiCompass } from 'react-icons/fi'
import { EmptyState } from '../../components/ui/ui'
import { DarkButton } from '../../styles/kit'
import { Screen } from '../../styles/adminKit'

const NotFound = () => {
    const navigate = useNavigate()
    return (
        <Screen className="!pt-16">
            <EmptyState icon={FiCompass} title="This page doesn’t exist"
                body="The link may be old, or the page moved. Everything is reachable from the sidebar."
                action={<DarkButton onClick={() => navigate('/')}>Back to overview</DarkButton>} />
        </Screen>
    )
}

export default NotFound
