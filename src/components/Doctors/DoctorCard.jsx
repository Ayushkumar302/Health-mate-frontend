import { Link } from 'react-router-dom'
import { ArrowUpRight, Building2, Star } from 'lucide-react'
import Avatar from '../ui/avatar'
import { formatPrice } from '@/utils/formatPrice'

function DoctorCard({ doctor }) {
    const { name, totalRating, averageRating, photo, specialization, experiences, ticketPrice } = doctor
    const hospital = experiences?.[0]?.hospital

  return (
    <Link
      to={`/doctors/${doctor._id}`}
      className='group card-surface card-hover flex h-full flex-col overflow-hidden'
    >
        <div className='relative aspect-[4/3] overflow-hidden bg-muted'>
            {photo ? (
              <img
                src={photo}
                alt={name}
                className='h-full w-full object-cover object-[50%_20%] transition-transform duration-700 group-hover:scale-105'
              />
            ) : (
              <div className='grid h-full place-items-center'>
                <Avatar name={name} className='h-24 w-24 shadow-soft' textClassName='text-2xl' />
              </div>
            )}
            {specialization && (
              <span className='glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold capitalize text-foreground'>
                {specialization}
              </span>
            )}
        </div>

        <div className='flex flex-1 flex-col p-5'>
            <div className='flex items-start justify-between gap-3'>
                <h3 className='text-lg font-bold leading-snug text-foreground'>{name}</h3>
                <span className='flex shrink-0 items-center gap-1 rounded-full bg-brand-amber/15 px-2 py-0.5 text-xs font-bold text-brand-amber'>
                    <Star className='h-3.5 w-3.5 fill-current' />
                    {averageRating ? averageRating.toFixed(1) : 'New'}
                    {totalRating > 0 && <span className='font-medium text-muted-foreground'>({totalRating})</span>}
                </span>
            </div>

            <p className='mt-2 flex items-center gap-1.5 text-sm text-muted-foreground'>
                <Building2 className='h-4 w-4 shrink-0' />
                <span className='truncate'>{hospital || 'Independent practice'}</span>
            </p>

            <div className='mt-auto flex items-center justify-between pt-5'>
                <p className='text-sm text-muted-foreground'>
                    {ticketPrice ? (
                      <><span className='text-lg font-extrabold text-foreground'>{formatPrice(ticketPrice)}</span> / visit</>
                    ) : 'Price on request'}
                </p>
                <span className='grid h-10 w-10 place-items-center rounded-full border border-border text-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground'>
                    <ArrowUpRight className='h-5 w-5 transition-transform duration-300 group-hover:rotate-45' />
                </span>
            </div>
        </div>
    </Link>
  )
}

// placeholder card shown while doctors are loading
export const DoctorCardSkeleton = () => (
  <div className='card-surface overflow-hidden'>
    <div className='skeleton aspect-[4/3] rounded-none' />
    <div className='space-y-3 p-5'>
      <div className='skeleton h-5 w-2/3' />
      <div className='skeleton h-4 w-1/2' />
      <div className='skeleton h-8 w-full' />
    </div>
  </div>
)

export default DoctorCard
