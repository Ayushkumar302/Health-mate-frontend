import { useContext, useState } from "react";
import { authContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import MyBookings from "./MyBookings";
import ProfileSettings from "./ProfileSettings";
import useGetProfile from '../../hooks/useFetchData';
import { BASE_URL } from "@/config";
import { HashLoader } from "react-spinners";
import Error from "@/components/Error/Error";
import noProfileImg from '../../assets/images/nouser.jpg'

function MyAccount() {
  const { dispatch } = useContext(authContext);
  const [tab, setTab] = useState('bookings');

  // Fetch profile data using custom hook
  const { data: userData, loading, error } = useGetProfile(`${BASE_URL}/users/profile/me`);
  
  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  };

  // Conditional rendering based on loading and error
  return (
    <section>
      <div className="container">
        {/* Show loading spinner while data is being fetched */}
        {loading && !error && <div className="flex justify-center"><HashLoader size={35} color="#0067FF" /></div>}
        
        {/* Show error message if there's an issue fetching data */}
        {error && !loading && <Error errMessage={error} />}
        
        {/* Render the main content once data is loaded and there's no error */}
        {!loading && !error && userData && (
          <div className="grid md:grid-cols-3 gap-10">
            {/* User Profile Section */}
            <div className="pb-[50px] px-[30px] rounded-md">
              <div className="flex items-center justify-center">
                <figure className="w-[100px] h-[100px] rounded-full border-2 border-solid border-primaryColor">
                  {/* Use userData.photo if available, or fallback image */}
                  <img
                    src={userData?.photo || noProfileImg}
                    alt="User"
                    className="w-full h-[100px] rounded-full"
                  />
                </figure>
              </div>

              <div className="text-center mt-4">
                {/* Render user name, email, and blood type */}
                <h3 className="text-[18px] leading-[30px] text-headingColor font-bold">
                  {userData?.name || 'User Name'}
                </h3>
                <p className="text-textColor text-[14px] leading-6 text-bodyColor">
                  {userData?.email || 'example@example.com'}
                </p>
                <p className="text-textColor text-[14px] leading-6 text-bodyColor">
                  Blood Type:{" "}
                  <span className="ml-2 text-headingColor text-[22px] leading-8 ">
                    {userData?.bloodType || 'N/A'}
                  </span>
                </p>
              </div>

              {/* Logout and Delete Account Buttons */}
              <div className="mt-[50px] md:mt-[100px] flex flex-col gap-4">
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

            {/* Tab Selection (My Bookings / Profile Settings) */}
            <div className="md:col-span-2 md:px-[30px]">
              <div>
                <button
                  onClick={() => setTab('bookings')}
                  className={`${tab === 'bookings' && 'bg-primaryColor text-white font-normal'}
                    py-2 px-5 rounded-md text-headingColor font-semibold text-[16px] leading-7 border border-solid border-primaryColor mr-2 `}
                >
                  My Bookings
                </button>

                <button
                  onClick={() => setTab('settings')}
                  className={`${tab === 'settings' && 'bg-primaryColor text-white font-normal'}
                    py-2 px-5 rounded-md text-headingColor font-semibold text-[16px] leading-7 border border-solid border-primaryColor`}
                >
                  Profile Settings
                </button>
              </div>

              {/* Render the selected tab content */}
              {tab === 'bookings' && <MyBookings />}
              {tab === 'settings' && <ProfileSettings user={userData} />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default MyAccount;
