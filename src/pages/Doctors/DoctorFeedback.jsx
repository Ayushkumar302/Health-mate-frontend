/* eslint-disable react/prop-types */
import { useState } from 'react'
import { formatDate } from '@/utils/formatDate'
import { StarFilledIcon} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import FeedbackForm from './FeedbackForm'



function DoctorFeedback({reviews , totalRating}) {
const [showFeedbackForm , setshowFeedbackForm] = useState(false)

  return (
    <div>
    <div className='mb-12'>
      <h4 className='text-[20px] leading-[30px] font-bold text-headingColor mb-[30px]'>
        All reviews ({totalRating})
        </h4>

        {reviews?.map((review , index)=>{
          return (<div  key={index} className='flex justify-between gap-10 mb-8 '>
          <div className='flex gap-3'>
            <figure className='w-10 h-10 rounded-full'>
              <img src={review?.user?.photo} className='w-full' alt="" />
            </figure>

            <div>
              <h5 className='text-[16px] leading-6 font-bold text-primaryColor'>
                {review?.user?.name}
                </h5>
              <p className='text-[14px] leading-6'>
                {formatDate(review?.createdAt)}
              </p>
              <p className='text__para mt-3 font-medium text-[15px]'>
                {review?.reviewText}
              </p>
            </div>
          </div>
          
          <div className='flex gap-1'>
            {[...Array(review?.rating).keys()].map((index)=>(
              <StarFilledIcon key={index} color="#0067ff"/>))}
          </div>
        </div>)
        })}
    </div>

    {!showFeedbackForm && <div className='text-center'>
      <Button onClick={()=>setshowFeedbackForm(true)}>Give Feedback</Button>
    </div>}

    {showFeedbackForm && <FeedbackForm/>}
  </div>
  )
}
 
export default DoctorFeedback