import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, MessageSquarePlus, Sparkles, Star, ThumbsUp } from 'lucide-react'
import { formatDate } from '@/utils/formatDate'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/ui/avatar'
import FeedbackForm from './FeedbackForm'

function DoctorFeedback({ reviews, totalRating, reviewSummary, doctorName }) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  return (
    <div>
      <h3 className='text-xl font-bold'>
        Patient reviews <span className='text-muted-foreground'>({totalRating || 0})</span>
      </h3>

      {/* Pro / Pro Clinic: the reviews summed up by AI, the reviews themselves stay below */}
      {reviewSummary?.summary && (
        <div className='mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-5'>
          <p className='flex items-center gap-2 text-sm font-bold'><Sparkles className='h-4 w-4 text-primary' /> What patients say</p>
          <p className='mt-2 text-[15px] leading-7'>{reviewSummary.summary}</p>
          {(reviewSummary.praised?.length > 0 || reviewSummary.improve?.length > 0) && (
            <div className='mt-3 flex flex-wrap gap-1.5'>
              {reviewSummary.praised?.map(item => (
                <span key={item} className='inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success'><ThumbsUp className='h-3 w-3' /> {item}</span>
              ))}
              {reviewSummary.improve?.map(item => (
                <span key={item} className='inline-flex items-center gap-1 rounded-full bg-brand-amber/15 px-2.5 py-1 text-xs font-semibold text-brand-amber'><Info className='h-3 w-3' /> {item}</span>
              ))}
            </div>
          )}
          <p className='mt-3 text-xs text-muted-foreground'>
            AI summary (Google Gemini) of {reviewSummary.count} reviews{doctorName ? ` of ${doctorName}` : ''}. Read the reviews below for the full picture.
          </p>
        </div>
      )}

      <div className='mt-6 space-y-4'>
        {!reviews?.length && (
          <p className='text-muted-foreground'>No reviews yet. Patients can review after their appointment.</p>
        )}
        {reviews?.map((review, index) => (
          <motion.div
            key={review._id || index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className='rounded-2xl border border-border bg-background/50 p-5'
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <Avatar src={review?.user?.photo} name={review?.user?.name || 'Patient'} className='h-11 w-11' textClassName='text-xs' />
                <div>
                  <p className='font-semibold'>{review?.user?.name || 'Former patient'}</p>
                  <p className='text-xs text-muted-foreground'>{formatDate(review?.createdAt)}</p>
                </div>
              </div>
              <div className='flex gap-0.5 text-brand-amber'>
                {Array.from({ length: 5 }, (_, star) => (
                  <Star key={star} className={`h-4 w-4 ${star < review?.rating ? 'fill-current' : 'opacity-25'}`} />
                ))}
              </div>
            </div>
            <p className='mt-3 text-[15px] leading-7 text-foreground/90'>{review?.reviewText}</p>
            {review?.reply?.text && (
              <div className='mt-3 rounded-xl border-l-4 border-primary/50 bg-muted/60 px-4 py-3'>
                <p className='text-xs font-semibold text-primary'>Reply from {doctorName || 'the doctor'} · {formatDate(review.reply.at)}</p>
                <p className='mt-1 text-sm leading-6'>{review.reply.text}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode='wait'>
        {showFeedbackForm ? (
          <motion.div
            key='form'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='overflow-hidden'
          >
            <div className='mt-8'>
              <FeedbackForm />
            </div>
          </motion.div>
        ) : (
          <motion.div key='button' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='mt-8 text-center'>
            <Button variant='soft' onClick={() => setShowFeedbackForm(true)}>
              <MessageSquarePlus className='h-4 w-4' /> Write a review
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DoctorFeedback
