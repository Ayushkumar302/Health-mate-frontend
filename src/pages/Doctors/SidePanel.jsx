/* eslint-disable react/prop-types */
import { Button } from '@/components/ui/button'
import { BASE_URL ,token } from '@/config';
import ConvertTime from '@/utils/convertTime';
import { toast } from 'react-toastify';

function SidePanel({timeSlots, ticketPrice , doctorId}) {
const bookingHandler = async()=>{
  try {
    const res = await fetch(`${BASE_URL}/bookings/checkout-session/${doctorId}`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        },
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message + 'please try again')
    } 
    if (data.session.url) {
      window.location.href = data.session.url
    }
  } catch (error) {
    toast.error(error.message)
  }
}

  return (
    <div
      className=" shadow-panelShadow p-3 lg:p-5
    rounded-md"
    >
      <div className="flex items-center justify-between">
        <p className="text__para mt-0 font-semibold">Ticket Price</p>
        <span className="text-[16px] leading-7 lg:text-[22px] lg:leading-8 text-headingColor font-bold">
          {ticketPrice} USD
        </span>
      </div>
      <div className="mt-[30px]">
        <p className="text__para mt-0 font-semibold text-headingColor">
          Available Time Slots:
        </p>
        <ul className="mt-3">
          {timeSlots?.map((item, index) => (
            <li key={index} className="flex items-center justify-between mb-2">
              <p className="text-[15px] leading-6 text-textColor font-semibold">
                {item.day.charAt(0).toUpperCase() + item.day.slice(1)}
              </p>
              <p className="text-[15px] leading-6 text-textColor font-semibold">
                {ConvertTime(item.startingTime)} - {ConvertTime(item.EndingTime)}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <Button onClick={bookingHandler} className="w-full rounded-md">Book Appointment</Button>
    </div>
  );
}

export default SidePanel