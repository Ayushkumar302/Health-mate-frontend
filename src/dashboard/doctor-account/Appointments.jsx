import { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { formatDate } from '@/utils/formatDate'
import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardList, ClipboardPen, FilePenLine, FileText, MessageSquare, UserX, Video } from 'lucide-react'
import { IntakeView } from '@/components/AI/Intake'
import { appointmentStart, canJoinVideo, formatAppointment, getAppointmentStatus, statusLabels, statusStyles, useNow } from '@/utils/appointment'
import { apiRequest } from '@/utils/api'
import { authContext } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'
import { BASE_URL } from '@/config'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/ui/avatar'
import CallDetails from '@/components/Video/CallDetails'
import ConsultationBadge from '@/components/Booking/ConsultationBadge'
import RespondButtons from '@/components/Booking/RespondButtons'
import { formatPrice } from '@/utils/formatPrice'
import { bookedByNote, patientOf } from '@/utils/family'

// small labelled button for the secondary row actions (Record, Message)
export const IconAction = ({ icon: Icon, label, text, onClick, to }) => {
    const className = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary'
    const content = <><Icon className='h-4 w-4' /> {text || label}</>
    return to ? (
        <Link to={to} className={className} aria-label={label} title={label}>{content}</Link>
    ) : (
        <button type='button' onClick={onClick} className={className} aria-label={label} title={label}>{content}</button>
    )
}

// "Write prescription" from the moment the call opens, "Edit" once one exists
export const PrescriptionButton = ({ booking, status, hasPrescription, onPrescribe }) => {
    if (status !== 'ongoing' && status !== 'completed') return null
    return hasPrescription ? (
        <Button size='sm' variant='soft' onClick={() => onPrescribe(booking)}>
            <FileText className='h-4 w-4' /> Edit Rx
        </Button>
    ) : (
        <Button size='sm' variant={status === 'completed' ? 'default' : 'soft'} onClick={() => onPrescribe(booking)}>
            <FilePenLine className='h-4 w-4' /> Write Rx
        </Button>
    )
}

const Appointments = ({ appointments, onChanged, prescribed, onPrescribe, onRecord }) => {
    const { token } = useContext(authContext)
    const [cancellingId, setCancellingId] = useState(null)
    // the booking whose pre-visit notes are open
    const [notesFor, setNotesFor] = useState(null)
    const confirm = useConfirm()
    const now = useNow()

    // doctor cancellations always refund the patient
    const handleCancel = async (booking) => {
        if (!(await confirm({ title: 'Cancel this appointment?', message: `${booking.user?.name || 'The patient'} will be told and gets a full refund.`, confirmText: 'Cancel appointment', cancelText: 'Keep it', tone: 'danger' }))) return
        setCancellingId(booking._id)
        try {
            const res = await fetch(`${BASE_URL}/bookings/${booking._id}/cancel`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            })
            const result = await res.json()
            if (!res.ok) {
                throw new Error(result.message)
            }
            toast.success(result.message)
            onChanged?.()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setCancellingId(null)
        }
    }

    // a clinic patient who never came: the fee is kept (video calls are checked automatically)
    const handleMissed = async (booking) => {
        if (!(await confirm({ title: 'Patient didn\'t come?', message: `${booking.user?.name || 'The patient'} is told the visit was missed. The fee is not refunded.`, confirmText: 'Mark as missed', cancelText: 'Back', tone: 'danger' }))) return
        setCancellingId(booking._id)
        try {
            const result = await apiRequest(`/bookings/${booking._id}/no-show`, { token, method: 'PUT' })
            toast.success(result.message)
            onChanged?.()
        } catch (error) {
            toast.error(error.message)
        } finally {
            setCancellingId(null)
        }
    }

    // the server accepts it from the start of the visit until 3 days later
    const canMarkMissed = (item, status) =>
        item.consultationType === 'clinic' && item.status === 'approved' && !item.noShow &&
        (status === 'ongoing' || status === 'completed') && now - appointmentStart(item) < 3 * 24 * 3600000

    if (!appointments?.length) {
        return <p className='p-6 text-sm text-muted-foreground'>No appointments here.</p>
    }

  return (
    <div className='overflow-x-auto'>
    <table className='w-full text-left text-sm text-muted-foreground'>
        <thead className='bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground'>
            <tr>
                <th scope='col' className='px-6 py-3'>Patient</th>
                <th scope='col' className='px-6 py-3'>Appointment</th>
                <th scope='col' className='px-6 py-3'>Status</th>
                <th scope='col' className='px-6 py-3'>Fee</th>
                <th scope='col' className='px-6 py-3'>Booked</th>
                <th scope='col' className='px-6 py-3'>Actions</th>
            </tr>
        </thead>

        <tbody>
            {appointments.map(item=> {
                const status = getAppointmentStatus(item, now)
                const patientId = item.user?._id
                const person = patientOf(item)
                return (
                <tr key={item._id} className='border-b border-border align-top transition-colors hover:bg-muted/40'>
                    <th scope='row' className='flex items-center px-6 py-4 text-foreground whitespace-nowrap'>
                        <Avatar src={person?.memberId ? undefined : item.user?.photo} name={person?.name || 'Patient'} className="h-10 w-10" textClassName="text-xs"/>
                        <div className='pl-3'>
                            <div className='text-base font-semibold'>{person?.name || 'Deleted user'}</div>
                            <div className='text-xs font-normal capitalize text-muted-foreground'>
                                {bookedByNote(person) || [item.user?.gender, item.user?.bloodType].filter(Boolean).join(' · ') || item.user?.email}
                            </div>
                        </div>
                    </th>
                    <td className='px-6 py-4 text-foreground font-medium'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <span className='whitespace-nowrap'>{formatAppointment(item)}</span>
                            <ConsultationBadge booking={item} />
                        </div>
                        {status !== 'cancelled' && status !== 'completed' && <CallDetails booking={item} now={now} compact />}
                        {item.declineReason && <p className='mt-1 text-xs text-muted-foreground'>{item.cancelledBy === 'system' || item.noShow === 'doctor' ? item.declineReason : `Declined: ${item.declineReason}`}</p>}
                        {item.noShow === 'patient' && <p className='mt-1 text-xs text-muted-foreground'>The patient missed this visit, the fee is kept</p>}
                    </td>
                    <td className='px-6 py-4'>
                        <span className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
                            {statusLabels[status]}
                        </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                        {formatPrice(item.listPrice || item.ticketPrice)}
                        {item.familyDiscount > 0 && <div className='text-xs'>Family discount paid by Medora</div>}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>{formatDate(item.createdAt)}</td>
                    <td className='px-6 py-4'>
                        <div className='flex flex-wrap items-center gap-2'>
                        {status === 'requested' && <RespondButtons booking={item} onDone={onChanged} />}
                        {canJoinVideo(item, now) && (
                            <Link to={`/consultation/${item._id}`}>
                                <Button size='sm'>
                                    <Video className='h-4 w-4' /> Join
                                </Button>
                            </Link>
                        )}
                        <PrescriptionButton booking={item} status={status} hasPrescription={prescribed?.has(item._id)} onPrescribe={onPrescribe} />
                        {patientId && status !== 'cancelled' && (
                            <>
                                {item.intake?.summary?.complaint && (
                                    <IconAction icon={item.intake.summary.redFlags?.length ? AlertTriangle : ClipboardPen} label='Pre-visit notes' text='Notes' onClick={() => setNotesFor(item)} />
                                )}
                                <IconAction icon={ClipboardList} label='Health record' text='Record' onClick={() => onRecord(person)} />
                                <IconAction icon={MessageSquare} label='Message' to={`/messages?with=${patientId}`} />
                            </>
                        )}
                        {status === 'upcoming' && (
                            <Button
                                size='sm'
                                variant='ghost'
                                className='text-destructive hover:bg-destructive/10'
                                disabled={cancellingId === item._id}
                                onClick={() => handleCancel(item)}
                            >
                                Cancel
                            </Button>
                        )}
                        {canMarkMissed(item, status) && (
                            <Button size='sm' variant='ghost' disabled={cancellingId === item._id} onClick={() => handleMissed(item)}>
                                <UserX className='h-4 w-4' /> Didn&apos;t come
                            </Button>
                        )}
                        </div>
                    </td>
                </tr>
            )})}
        </tbody>
    </table>
    <IntakeView intake={notesFor?.intake} patientName={patientOf(notesFor)?.name} open={Boolean(notesFor)} onClose={() => setNotesFor(null)} />
    </div>
  )
}

export default Appointments
