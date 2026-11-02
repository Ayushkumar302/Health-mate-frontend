import { AlertTriangle } from 'lucide-react'

const Error = ({ errMessage = 'Something went wrong. Please try again.' }) => {
  return (
    <div className='card-surface mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center'>
        <span className='grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive'>
          <AlertTriangle className='h-6 w-6' />
        </span>
        <h3 className='text-base font-semibold text-foreground'>{errMessage}</h3>
    </div>
  )
}

export default Error
