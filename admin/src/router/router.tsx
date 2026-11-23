import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from '../components/shell/Shell'
import Overview from '../pages/overview/overview'
import AddQuestion from '../pages/addQuestion/addQuestion'
import QuestionBank from '../pages/questionBank/questionBank'
import Flags from '../pages/flags/flags'
import Notifications from '../pages/notifications/notifications'
import Academics from '../pages/academics/academics'
import People from '../pages/people/people'
import Login from '../pages/login/login'
import NotFound from '../pages/notFound/notFound'

const Router = () => (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="addQuestions" element={<AddQuestion />} />
            <Route path="questions" element={<QuestionBank />} />
            <Route path="alerts/flags" element={<Flags />} />
            <Route path="alerts/notification" element={<Notifications />} />
            <Route path="academics/:entity" element={<Academics />} />
            <Route path="people/:group" element={<People />} />

            {/* Older links */}
            <Route path="notification" element={<Navigate to="/alerts/notification" replace />} />
            <Route path="users/supervisors" element={<Navigate to="/people/supervisors" replace />} />
            <Route path="users/moderators" element={<Navigate to="/people/moderators" replace />} />
            <Route path="users/administrators" element={<Navigate to="/people/supervisors" replace />} />

            <Route path="*" element={<NotFound />} />
        </Route>
    </Routes>
)

export default Router
