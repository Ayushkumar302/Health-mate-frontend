import React, { useState } from "react";
import { HashLoader } from "react-spinners";
import Error from "@/components/Error/Error";
import useGetProfile from "../../hooks/useFetchData";
import { BASE_URL } from "@/config";
import Tabs from "./Tabs";
import { StarIcon } from "lucide-react";
import DoctorAbout from "@/pages/Doctors/DoctorAbout";
import Profile from "./Profile";
import Appointments from "./Appointments";

const Dashboard = () => {
  const { data, loading, error } = useGetProfile(
    `${BASE_URL}/doctors/profile/me`
  );
  const [tab, setTab] = useState("overview");

  // Check if data exists before accessing 'isApproved'
  const isApproved = data ? data.isApproved : null;

  return (
    <section>
      <div className="container">
        <div className="flex justify-center items-center">
          {loading && !error && <HashLoader size={35} color="#0067FF" />}
        </div>
        {error && !loading && <Error />}

        {!loading && !error && data && (
          <div className="grid lg:grid-cols-3 gap-[30px] lg:gap-[50px]">
            <Tabs tab={tab} setTab={setTab} />
            <div className="lg:col-span-2">
              {/* Only render this message if data exists and isApproved is pending */}
              {isApproved === "pending" && (
                <div className="flex p-4 mb-4 text-yellow-800 bg-yellow-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    className="flex shrink-0 h5 w-5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M12,17L12,17c-0.552,0-1-0.448-1-1v-4 c0-0.552,0.448-1,1-1h0c0.552,0,1,0.448,1,1v4C13,16.552,12.552,17,12,17z M12.5,9h-1C11.224,9,11,8.776,11,8.5v-1 C11,7.224,11.224,7,11.5,7h1C12.776,7,13,7.224,13,7.5v1C13,8.776,12.776,9,12.5,9z"></path>
                  </svg>
                  <span className="sr-only">Info</span>
                  <div className="ml-3 text-sm font-medium">
                  To get approval please complete your profile. We&apos;ll
                  review your profile and get back to you within 2 days.
                  </div>
                
                </div>
              )}

              <div className="mt-8">
                {tab === "overview" &&( 
                <div>
                  <div className="flex items-center gap-4 mb-10">
                    <figure className="max-w-[200px] max-h-[200px]">
                      <img src={data?.photo} alt=""  className="  w-full h-[200px] rounded-md"/>
                    </figure>

                    <div>
                    <span className="bg-[#ccf0f3] text-irisBlueColor py-1 px-4 lg:py-2 lg:px-6 rounded text-[12px] leading-4 lg:text-[16px]
                    lg:leading-6 font-semibold">
                      {data.specialization}
                    </span>
                    <h3 className="text-[22px] leading-9 font-bold text-headingColor mt-3">
                      {data.name}
                    </h3>

                    <div className="flex items-center gap-[6px]">
                      <span className="flex items-center gap-[6px] text-headingColor text-[14px]
                      leading-5 lg:text-[16px] lg:leading-6 font-semibold">
                        <StarIcon className="text-yellow-500"/>
                        {data.averageRating}
                      </span>
                      <span className=" text-textColor text-[14px]
                      leading-5 lg:text-[16px] lg:leading-6 font-semibold">
                        ({data.totalRating})
                      </span>
                    </div>
                     <p className="text__para font-[15px] lg:max-w-[390px] leading-6">{data?.bio}</p>
                    </div>
                  </div>
                  <DoctorAbout
                  name={data.name}
                  about={data.about}
                  experiences={data.experiences}
                  qualifications={data.qualifications}
                  />
                </div>)}


                {tab === "appointments" && <Appointments appointments={data.appointments}/>}
                {tab === "profile" && <Profile doctorData={data}/> }

              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
