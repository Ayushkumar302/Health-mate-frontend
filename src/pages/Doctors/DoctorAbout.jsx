import { Briefcase, GraduationCap } from 'lucide-react'
import { formatDate } from '@/utils/formatDate'

const dateRange = item =>
  [item.startingDate && formatDate(item.startingDate), item.endingDate ? formatDate(item.endingDate) : 'Present']
    .filter(Boolean)
    .join(' – ')

// vertical timeline used for both education and experience
const Timeline = ({ items, icon: Icon, title, subtitle }) => (
  <ol className='relative mt-5 space-y-6 border-l border-border pl-8'>
    {items.map((item, index) => (
      <li key={index} className='relative'>
        <span className='absolute -left-[45px] grid h-8 w-8 place-items-center rounded-full border border-primary/30 bg-card text-primary'>
          <Icon className='h-4 w-4' />
        </span>
        <p className='text-xs font-semibold uppercase tracking-wider text-primary'>{dateRange(item)}</p>
        <p className='mt-1 font-bold text-foreground'>{title(item) || '—'}</p>
        <p className='text-sm text-muted-foreground'>{subtitle(item)}</p>
      </li>
    ))}
  </ol>
)

function DoctorAbout({ name, about, experiences, qualifications }) {
  return (
    <div className='space-y-10'>
        <div>
            <h3 className='text-xl font-bold'>
                About <span className='gradient-text'>{name}</span>
            </h3>
            <p className='text__para whitespace-pre-line'>
                {about || 'This doctor has not added an introduction yet.'}
            </p>
        </div>

        {qualifications?.length > 0 && (
          <div>
              <h3 className='text-xl font-bold'>Education</h3>
              <Timeline items={qualifications} icon={GraduationCap} title={item => item.degree} subtitle={item => item.university} />
          </div>
        )}

        {experiences?.length > 0 && (
          <div>
              <h3 className='text-xl font-bold'>Experience</h3>
              <Timeline items={experiences} icon={Briefcase} title={item => item.position} subtitle={item => item.hospital} />
          </div>
        )}
    </div>
  )
}

export default DoctorAbout
