import React from 'react';
import { BASE_URL } from '@/config';
import DoctorCard from '@/components/Doctors/DoctorCard';
import { HashLoader } from 'react-spinners';
import Error from '@/components/Error/Error';
import useFetchData from '@/hooks/useFetchData';

const MyBooking = () => {
  const {
    data: appointments, // Fetched data
    loading,
    error,
  } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);

  // Ensure `appointments` is always a valid array
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  return (
    <div>
      {/* Show loader when loading */}
      {loading && !error && <HashLoader size={35} color="#0067FF" />}

      {/* Show error message if error exists */}
      {error && !loading && <Error errMessage={error} />}

      {/* Render doctor cards if appointments exist */}
      {!loading && !error && safeAppointments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
          {safeAppointments.map((doctor) => (
            <DoctorCard  key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}

      {/* Show message if no appointments exist */}
      {!loading && !error && safeAppointments.length === 0 && (
        <h2
          className="mt-5 text-center leading-7 text-[20px] font-semibold text-primaryColor"
        >
          You did not book any doctor yet!
        </h2>
      )}
    </div>
  );
};

export default MyBooking;
