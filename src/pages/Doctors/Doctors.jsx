import React, { useEffect, useState } from "react";
import DoctorCard from "@/components/Doctors/DoctorCard";
import { doctors } from "@/assets/data/doctors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Testimonial from "@/components/Testimonial/Testimonial";
import { BASE_URL } from "@/config";
import useFetchData from "@/hooks/useFetchData";
import { HashLoader } from "react-spinners";
import Error from "@/components/Error/Error";

function Doctors() {
  const [query, setQuery] = useState('')
  const [debounceQuery , setDebounceQuery] = useState("")

  
  const handleSearchInput =()=>{
    setQuery(query.trim())
   }

useEffect(() => {
  
  const timeout = setTimeout(()=>{
    setDebounceQuery(query)
  },700)
  return () => clearTimeout(timeout)
}, [query])



  const { data:doctors=[], error, loading } = useFetchData(`${BASE_URL}/doctors?query=${debounceQuery}`);
  
  
  return (
    <>
      <section className="pt-0 bg-[#fff9ea]">
        <div className="container text-center">
          <h2 className="heading">Find a Doctor</h2>
          <div className="max-w-[400px] mt-[30px] mx-auto bg-white rounded-md flex items-center">
            <Input
              type="search"
              placeholder="Search doctor by name or specifications"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="py-3 pl-4 pr-2 bg-transparent w-full focus:outline-none placeholder:text-slate-500 rounded-l-md border-0"
            />
            <Button
            onClick={handleSearchInput}
             className="h-full px-4 rounded-none rounded-r-md">
              Search
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
         <div className="flex items-center justify-center">
         {loading && <HashLoader size={35} color="#0067FF" />}
         {error && <Error />}
         </div>
          {!loading && !error && doctors?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:grid-cols-4">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
          )}
          {!loading && !error && doctors?.length === 0 && (
            <p>No doctors available.</p>
          )}
        </div>
      </section>

      <section className="">
        <div className="container pb-[75px]">
          <div className="xl:w-[470px] mx-auto">
            <h2 className="heading text-center">What our patients say</h2>
            <p className="text__para text-center">
              World class care for everyone. Our health System offers unmatched,
              expert health care.
            </p>
          </div>
          <Testimonial />
        </div>
      </section>
    </>
  );
}

export default Doctors;
