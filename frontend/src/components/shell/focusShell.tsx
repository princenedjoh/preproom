import { Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css"
import "../reactToastify/toastifyCustomStyles.css"

// A test in progress gets the whole screen: no sidebar, no navigation to wander off to
const FocusShell = () => (
    <div className='min-h-screen bg-canvas'>
        <ToastContainer/>
        <Outlet/>
    </div>
)

export default FocusShell
