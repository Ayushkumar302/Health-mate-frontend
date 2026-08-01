import React, { useState } from "react";
import doctorImg from "../../assets/images/doctor-img02.png";
import staricon from "../../assets/images/Star.png";
import DoctorAbout from "./DoctorAbout";
import DoctorFeedback from "./DoctorFeedback";
import SidePanel from "./SidePanel";
import { BASE_URL } from "@/config";
import useFetchData from "@/hooks/useFetchData";
import { HashLoader } from "react-spinners";
import Error from "@/components/Error/Error";
import { useParams } from "react-router-dom";

function DoctorsDetails() {
  const [tab, setTab] = useState('about');
  const { id } = useParams();
  const { data: doctor, error, loading } = useFetchData(`${BASE_URL}/doctors/${id}`);

  // Only destructure if doctor is not null or undefined
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <HashLoader size={55} color="#0067FF" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Error />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Doctor not found.</p>
      </div>
    );
  }

  // Destructuring doctor object safely now
  const {
    name,
    bio,
    specialization,
    ticketPrice,
    qualifications,
    experiences,
    timeSlots,
    reviews,
    about,
    photo,
    averageRating,
    totalRating,
  } = doctor;

  return (
    <section>
      <div className="max-w-[1170px] px-5 mx-auto">
        <div className="grid md:grid-cols-3 gap-[50px]">
          <div className="md:col-span-2">
            <div className="flex items-center gap-5">
              <figure className="max-w-[200px] max-h-[200px]">
                <img src={photo} alt="doctor" />
              </figure>

              <div>
                <span className="bg-[#ccf0f3] text-irisBlueColor py-1 px-2 lg:py-2 lg:px-6 text-[12px] leading-4 lg:text-[16px] lg:lea7 font-semibold rounded">
                  {specialization}
                </span>
                <h3 className="text-headingColor text-[27px] leading-9 mt-3 font-bold">
                  {name}
                </h3>
                <div className="flex items-center gap-[16px]">
                  <span className="flex items-center gap-[6px] text-[14px] leading-6 lg:text-[16px] lg:leading-7 font-semibold text-headingColor">
                    <img src={staricon} alt="" /> {averageRating}
                  </span>
                  <span className="text-[14px] leading-6 lg:text-[16px] lg:leading-7 font-[400] text-textColor">
                    ({totalRating})
                  </span>
                </div>
                <p className="text__para text-[14px] leading-6 md:text-[15px] lg:max-w-[390px]">
                  {bio}
                </p>
              </div>
            </div>

            <div className="mt-[50px] border-b border-solid border-[#0066ff34]">
              <button
                onClick={() => setTab('about')}
                className={` ${tab === 'about' && 'border-b border-solid border-primaryColor'} 
                py-2 px-5 mr-5 text-[16px] leading-7 text-headingColor font-semibold`}>
                About
              </button>

              <button
                onClick={() => setTab('feedback')}
                className={` ${tab === 'feedback' && 'border-b border-solid border-primaryColor'} 
                py-2 px-5 mr-5 text-[16px] leading-7 text-headingColor font-semibold`}>
                Feedback
              </button>
            </div>

            <div className="mt-[50px]">
              {tab === 'about' && (
                <DoctorAbout
                  name={name}
                  about={about}
                  qualifications={qualifications}
                  experiences={experiences}
                />
              )}

              {tab === 'feedback' && (
                <DoctorFeedback reviews={reviews} totalRating={totalRating} />
              )}
            </div>
          </div>

          <div>
            <SidePanel 
            doctorId={doctor._id} 
            ticketPrice={ticketPrice}
            timeSlots={timeSlots}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DoctorsDetails;
