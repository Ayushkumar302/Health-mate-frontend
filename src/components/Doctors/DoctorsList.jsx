import DoctorCard from "./DoctorCard"; 
import { BASE_URL } from "@/config";
import useFetchData from "@/hooks/useFetchData";
import { HashLoader } from "react-spinners";
import Error from "../Error/Error";

function DoctorsList() {
  const { data: doctors = [], error, loading } = useFetchData(`${BASE_URL}/doctors`);

  return (
    <>
      {loading && <HashLoader size={35} color="#0067FF" />}
      {error && <Error />}
      {!loading && !error && doctors?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-[30px] mt-[30px] lg:mt-[55px]">
          {doctors.map(doctor => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}
      {!loading && !error && doctors?.length === 0 && (
        <p>No doctors found.</p>
      )}
    </>
  );
}

export default DoctorsList;
