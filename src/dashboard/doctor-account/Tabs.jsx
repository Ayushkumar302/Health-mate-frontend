import { Button } from '@/components/ui/button'
import React ,{useContext} from 'react'
import { BiMenu } from 'react-icons/bi'
import { authContext } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Tabs = ({ tab, setTab }) => {
    
    const {dispatch} = useContext(authContext);
    const navigate = useNavigate();
    const handleLogout = () => {
      dispatch({type: 'LOGOUT'});
      navigate('/');
    }
   
  return (
    <div>
      
      <span className="lg:hidden">
        <BiMenu className="w-6 h-6 cursor-pointer" />
      </span>

     
      <div className="hidden lg:flex flex-col p-6 bg-white shadow-lg items-center rounded-md w-64">
        <button
          onClick={() => setTab('overview')}
          className={`${
            tab === 'overview' ? "bg-indigo-100 text-blue-500" : "bg-transparent text-headingColor"
          } w-full text-center py-3 px-5 rounded-md transition-colors duration-300 ease-in-out hover:bg-indigo-200`}
        >
          Overview
        </button>

        <button
          onClick={() => setTab('appointments')}
          className={`${
            tab === 'appointments' ? "bg-indigo-100 text-blue-500" : "bg-transparent text-headingColor"
          } w-full text-center my-4 py-3 px-5 rounded-md transition-colors duration-300 ease-in-out hover:bg-indigo-200`}
        >
          Appointments
        </button>

        <button
          onClick={() => setTab('profile')}
          className={`${
            tab === 'profile' ? "bg-indigo-100 text-blue-500" : "bg-transparent text-headingColor"
          } w-full text-center py-3 px-5 rounded-md transition-colors duration-300 ease-in-out hover:bg-indigo-200`}
        >
          Profile
        </button>

        <div className="mt-[50px] md:mt-[20px] flex flex-col gap-4 w-full">
                <Button
                  onClick={handleLogout}
                  
                  className="bg-[#181A1E] hover:bg-[#181a1ecd] rounded-md leading-7"
                >
                  Logout
                </Button>
                <Button variant="destructive" className="rounded-md leading-7">
                  Delete Account
                </Button>
        </div>
      </div>
    </div>
  )
}

export default Tabs
