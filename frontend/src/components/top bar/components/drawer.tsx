import * as React from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';
import * as kit from '../../../styles/kit';
import { profile } from '../../../data/sample';
import { FiUser, FiClipboard, FiBookmark, FiBell, FiSettings, FiLogOut, FiLogIn } from "react-icons/fi";
import { HiFire } from "react-icons/hi2";

const cookie = new Cookies()

interface drawerChildrenProp {
    children: React.ReactNode;
    hasSession : boolean
}

const links = [
  { icon : FiUser, label : 'Profile', route : '/profile' },
  { icon : FiClipboard, label : 'Test history', route : '/test/testconfig' },
  { icon : FiBookmark, label : 'Saved questions', route : '/questions' },
  { icon : FiBell, label : 'Notifications', route : '/notification' },
  { icon : FiSettings, label : 'Settings', route : '/profile' },
]

// Account panel that slides in from the right of the top bar
const SwipeableTemporaryDrawer = ({
    children, hasSession
} : drawerChildrenProp) => {

  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  const go = (route : string) => {
    setOpen(false)
    navigate(route)
  }

  const logout = () => {
    cookie.remove('jwtToken', { path : '/' })
    go('/auth/login')
  }

  return (
    <div>
      <div onClick={()=>setOpen(true)}>{children}</div>
      <SwipeableDrawer
        anchor='right'
        open={open}
        onClose={()=>setOpen(false)}
        onOpen={()=>setOpen(true)}
        PaperProps={{ sx : { width : 300, borderLeft : '1px solid #e8e8e8', boxShadow : 'none' } }}
      >
        <div className='flex flex-col h-full p-5 gap-5' data-lenis-prevent>
          <div className='flex items-center gap-3'>
            <kit.Avatar color='#202020' size={44} ring='transparent' className='!text-[14px]'>{profile.initials}</kit.Avatar>
            <div className='flex flex-col min-w-0'>
              <span className='text-[15px] font-bold text-ink truncate'>{hasSession ? profile.name : 'Guest'}</span>
              <span className='text-[13px] text-ash truncate'>{hasSession ? `${profile.program} · ${profile.school}` : 'Log in to save progress'}</span>
            </div>
          </div>
          {
            hasSession &&
            <div className='flex items-center gap-2 rounded-[12px] bg-mist border border-bone px-4 py-3 text-[13px] text-carbon'>
              <HiFire className='text-[#fd9a46]' size={16}/> <b className='text-ink'>{profile.streak}-day streak</b> · keep it going
            </div>
          }
          <nav className='flex flex-col gap-1'>
            {
              links.map((link) => (
                <button
                  key={link.label}
                  type='button'
                  onClick={()=>go(link.route)}
                  className='flex items-center gap-3 rounded-[9px] px-3 py-[10px] text-[14px] font-medium text-carbon hover:bg-black/[0.04] transition-colors duration-150'
                >
                  <link.icon size={16} className='text-ash'/> {link.label}
                </button>
              ))
            }
          </nav>
          <div className='mt-auto pt-4 border-t border-bone'>
            {
              hasSession ?
              <kit.GhostButton type='button' className='w-full' onClick={logout}><FiLogOut size={14}/> Log out</kit.GhostButton>
              :
              <kit.DarkButton type='button' className='w-full' onClick={()=>go('/auth/login')}><FiLogIn size={14}/> Log in</kit.DarkButton>
            }
          </div>
        </div>
      </SwipeableDrawer>
    </div>
  );
}

export default SwipeableTemporaryDrawer
