import DoctorCard, { DoctorCardSkeleton } from "./DoctorCard";
import { BASE_URL } from "@/config";
import useFetchData from "@/hooks/useFetchData";
import Error from "../Error/Error";
import { Stagger, StaggerItem } from "../Motion/Reveal";

// limit: show only the first few doctors (used on the home page)
function DoctorsList({ limit = 6 }) {
  const { data: doctors, error, loading } = useFetchData(`${BASE_URL}/doctors?limit=${limit}&sort=rating`);
  const items = Array.isArray(doctors) ? doctors.slice(0, limit) : [];

  return (
    <div className="mt-12">
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <DoctorCardSkeleton key={index} />)}
        </div>
      )}
      {error && !loading && <Error errMessage="We couldn't load doctors right now. Please try again shortly." />}
      {!loading && !error && items.length > 0 && (
        <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(doctor => (
            <StaggerItem key={doctor._id}>
              <DoctorCard doctor={doctor} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="text-center text-muted-foreground">No doctors are listed yet. Check back soon.</p>
      )}
    </div>
  );
}

export default DoctorsList;
