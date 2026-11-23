import { toast } from 'react-toastify'

// One quiet toast style for the whole app: dark pill, bottom centre, no progress bar
export const notify = (message : string) => toast(message, {
    position : 'bottom-center',
    autoClose : 2400,
    hideProgressBar : true,
    closeButton : false,
    pauseOnFocusLoss : true,
    className : 'pr-toast',
})
