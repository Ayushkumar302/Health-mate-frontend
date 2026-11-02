import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import  { useState ,useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Lock, Trash2 } from 'lucide-react'
import { DEMO_MODE } from '@/brand'
import Avatar from '@/components/ui/avatar'
import Spinner from '@/components/ui/spinner'
import uploadImageToCloudinary from '../../utils/uploadCloudinary'
import { BASE_URL } from '@/config'
import { authContext } from '@/context/AuthContext'
import {toast} from 'react-toastify'

const Profile = ({doctorData}) => {
    const { token } = useContext(authContext)
    const [uploading, setUploading] = useState(false)
    const [formData , setFormData] = useState({
        name: '',
        email: '',
        password:'',
        phone: '',
        bio: '',
        gender: '',
        specialization:'',
        ticketPrice:0,
        quickCallFee:'',
        clinicAddress:'',
        qualifications:[],
        experiences:[],
        timeSlots:[],
        slotDuration:30,
        about:'',
        photo:null,
    })

    useEffect(() => {
      // fall back to empty values so a brand-new doctor profile doesn't break the form
      setFormData({
        name: doctorData?.name || '',
        email: doctorData?.email || '',
        phone: doctorData?.phone || '',
        bio: doctorData?.bio || '',
        gender: doctorData?.gender || '',
        specialization:doctorData?.specialization || '',
        ticketPrice:doctorData?.ticketPrice || 0,
        quickCallFee:doctorData?.quickCallFee || '',
        clinicAddress:doctorData?.clinicAddress || '',
        qualifications:doctorData?.qualifications || [],
        experiences:doctorData?.experiences || [],
        timeSlots:doctorData?.timeSlots || [],
        slotDuration:doctorData?.slotDuration || 30,
        about:doctorData?.about || '',
        photo:doctorData?.photo || null

      })
    
    }, [doctorData])
    

    
    const handleInputChange = e =>{
        const { name, value } = e.target
        setFormData(prevFormData => ({...prevFormData, [name]: value}))
    }
   
    //reusable function to add item
    const addItem = (key,item)=>{
      setFormData(prevFormData =>({...prevFormData,[key]:[...prevFormData[key] , item]}))
    }
    //reusable input change function
    const handleResuableInputChangeFunc = (key,index,event)=>{
      const {name,value}=event.target
      setFormData(prevFormData =>{
        // copy the item too, so the previous state is not mutated
        const updateItems = [...prevFormData[key]]
        updateItems[index] = { ...updateItems[index], [name]: value }
        return {...prevFormData, [key]:updateItems}
      
    })
  }
  //resuable delete func
  const deleteItem = (key, index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [key]: prevFormData[key].filter((_, i) => i !== index),
    }));
  };
    const addQualification = e=>{
      e.preventDefault()
      addItem('qualifications',
        {
          startingDate:'',
          endingDate:'',
          degree:'',
          university:'',
        }
      )
    }

    const handleQualificationChange = (event , index)=>{
      handleResuableInputChangeFunc('qualifications' , index , event)
    }

    const deleteQualification = (e,index)=>{
      e.preventDefault()
      deleteItem('qualifications', index)
    }

//experience funct
       const addExperience = e=>{
      e.preventDefault()
      addItem('experiences',
        {
          startingDate:'',
          endingDate:'',
          position:'',
          hospital:'',
        }
      )
    }


    const handleExperienceChange = (event , index)=>{
      handleResuableInputChangeFunc('experiences' , index , event)
    }

    const deleteExperience = (e,index)=>{
      e.preventDefault()
      deleteItem('experiences', index)
    }

    //timeslots funct
    const addTimeSlot = e=>{
      e.preventDefault()
      addItem('timeSlots',
        {
          day:'monday',
          startingTime:'11:00',
          EndingTime:'17:00',
        }
      )
    }


    const handleTimeSlotChange = (event , index)=>{
      handleResuableInputChangeFunc('timeSlots' , index , event)
    }

    const deleteTimeSlot = (e,index)=>{
      e.preventDefault()
      deleteItem('timeSlots', index)
    }

//image profile picture
    const handleFileInputChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      setUploading(true);
      try {
        const data = await uploadImageToCloudinary(file);
        setFormData(prevFormData => ({
          ...prevFormData,
          photo: data?.secure_url || data?.url,
        }));
      } catch {
        toast.error('Photo upload failed, please try again');
      } finally {
        setUploading(false);
      }
    };


    const updateProfileHandler = async (e) => {
      e.preventDefault();
      if (uploading) {
        return toast.info('Please wait for the photo upload to finish');
      }
      try {
        const res = await fetch(`${BASE_URL}/doctors/${doctorData._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok) {
          throw Error(result.message);
        }
        toast.success(result.message);
      } catch (error) {
        toast.error(error.message);
      }
    };
  // shared demo doctors keep the public profile every visitor sees; schedule and fees stay editable
  const locked = DEMO_MODE && Boolean(doctorData?.isDemo);

  return (
    <div>
      <h2 className="text-xl font-bold">Profile information</h2>
      <p className="mt-1 text-sm text-muted-foreground">This is what patients see on your public profile.</p>
      {locked && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          Demo account: name, photo, specialty, bio, about, education, experience and clinic address are locked so every visitor sees the same profile. Phone, fees, appointment length and time slots can be changed.
        </p>
      )}
      <form className="mt-8">
        <fieldset disabled={locked} className="mb-5 min-w-0">
          <p className="form_label">Name</p>
          <Input
            type="text"
            placeholder="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </fieldset>

        <div className="mb-5">
          <p className="form_label">Email</p>
          <Input
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            readOnly
            aria-readonly
            disabled={true}
          />
        </div>

        <div className="mb-5">
          <p className="form_label">Phone</p>
          <Input
            type="number"
            placeholder="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>

        <fieldset disabled={locked} className="mb-5 min-w-0">
          <p className="form_label">Bio</p>
          <Textarea
            type="text"
            placeholder="Your Bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            maxLength={200}
          />
        </fieldset>

        <div className="mb-5">
          <div className="grid gap-5 sm:grid-cols-3 mb-[30px]">
            <div>
              <p className="form_label">Gender</p>

              <Select
                name="gender"
                value={formData.gender}
                // onChange={handleInputChange}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="form_label">Specialization</p>

              <Select
                disabled={locked}
                name="specialization"
                value={formData.specialization}
                onValueChange={(value) =>
                  setFormData({ ...formData, specialization: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="surgeon">Surgeon</SelectItem>
                  <SelectItem value="dentist">Dentist</SelectItem>
                  <SelectItem value="neurologist">Neurologist</SelectItem>
                  <SelectItem value="dermatologist">Dermatologist</SelectItem>
                  <SelectItem value="cardiologist">Cardiologist</SelectItem>
                  <SelectItem value="pediatrician">Pediatrician</SelectItem>
                  <SelectItem value="gastroenterologist">
                    Gastroenterologist
                  </SelectItem>
                  <SelectItem value="orthopedist">Orthopedist</SelectItem>
                  <SelectItem value="ophthalmologist">
                    Ophthalmologist
                  </SelectItem>
                  <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                  <SelectItem value="endocrinologist">
                    Endocrinologist
                  </SelectItem>
                  <SelectItem value="obstetrician">Obstetrician</SelectItem>
                  <SelectItem value="gynecologist">Gynecologist</SelectItem>
                  <SelectItem value="urologist">Urologist</SelectItem>
                  <SelectItem value="rheumatologist">Rheumatologist</SelectItem>
                  <SelectItem value="pulmonologist">Pulmonologist</SelectItem>
                  <SelectItem value="oncologist">Oncologist</SelectItem>
                  <SelectItem value="infectiousDiseaseSpecialist">
                    Infectious Disease Specialist
                  </SelectItem>
                  <SelectItem value="pathologist">Pathologist</SelectItem>
                  <SelectItem value="radiologist">Radiologist</SelectItem>
                  <SelectItem value="allergist">Allergist</SelectItem>
                  <SelectItem value="chiropractor">Chiropractor</SelectItem>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="form_label">Consultation fee (₹)</p>
              <Input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                placeholder="500"
                onChange={handleInputChange}
              />
              <p className="mt-1 text-xs text-muted-foreground">For clinic visits and video consultations</p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-5 sm:grid-cols-[1fr_220px]">
          <div>
            <p className="form_label">Clinic address</p>
            <Input
              disabled={locked}
              name="clinicAddress"
              value={formData.clinicAddress}
              maxLength={200}
              placeholder="Clinic name, street, city"
              onChange={handleInputChange}
            />
            <p className="mt-1 text-xs text-muted-foreground">Shown to patients who book a clinic visit</p>
          </div>
          <div>
            <p className="form_label">Quick call fee (₹)</p>
            <Input
              type="number"
              name="quickCallFee"
              min={0}
              value={formData.quickCallFee}
              placeholder={String(Math.max(100, Math.round((Number(formData.ticketPrice) * 0.4) / 10) * 10))}
              onChange={handleInputChange}
            />
            <p className="mt-1 text-xs text-muted-foreground">10 min call, empty = 40% of your fee</p>
          </div>
        </div>

        <fieldset disabled={locked} className="mb-5 min-w-0">
          <p className="form_label">Qualifications</p>
          {formData.qualifications?.map((item, index) => (
            <div key={index} className="mb-4 rounded-2xl border border-border bg-background/50 p-4">
              <div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="form_label text-[13px]">Starting Date</p>
                    <Input
                      type="date"
                      name="startingDate"
                      value={item.startingDate}
                      onChange={(e) => handleQualificationChange(e, index)}
                    />
                  </div>
                  <div>
                    <p className="form_label text-[13px]">Ending Date</p>
                    <Input
                      type="date"
                      name="endingDate"
                      value={item.endingDate}
                      onChange={(e) => handleQualificationChange(e, index)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="form_label mt-2 text-[13px]">Degree</p>
                    <Input
                      type="text"
                      name="degree"
                      placeholder="Degree"
                      value={item.degree}
                      onChange={(e) => handleQualificationChange(e, index)}
                    />
                  </div>
                  <div>
                    <p className="form_label mt-2 text-[13px]">University</p>
                    <Input
                      type="text"
                      name="university"
                      placeholder="University/College"
                      value={item.university}
                      onChange={(e) => handleQualificationChange(e, index)}
                    />
                  </div>
                </div>

                <button
                  onClick={(e) => deleteQualification(e, index)}
                  className="mt-4 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button onClick={addQualification} variant="soft" size="sm" className="mt-2">
            Add Qualification
          </Button>
        </fieldset>

        <fieldset disabled={locked} className="mb-5 min-w-0">
          <p className="form_label mt-2">Experiences</p>
          {formData.experiences?.map((item, index) => (
            <div key={index} className="mb-4 rounded-2xl border border-border bg-background/50 p-4">
              <div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="form_label text-[13px]">Starting Date</p>
                    <Input
                      type="date"
                      name="startingDate"
                      value={item.startingDate}
                      onChange={(e) => handleExperienceChange(e, index)}
                    />
                  </div>
                  <div>
                    <p className="form_label text-[13px]">Ending Date</p>
                    <Input
                      type="date"
                      name="endingDate"
                      value={item.endingDate}
                      onChange={(e) => handleExperienceChange(e, index)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="form_label mt-2 text-[13px]">Position</p>
                    <Input
                      type="text"
                      name="position"
                      placeholder="Position"
                      value={item.position}
                      onChange={(e) => handleExperienceChange(e, index)}
                    />
                  </div>
                  <div>
                    <p className="form_label mt-2 text-[13px]">Hospital</p>
                    <Input
                      type="text"
                      name="hospital"
                      placeholder="Hospital"
                      value={item.hospital}
                      onChange={(e) => handleExperienceChange(e, index)}
                    />
                  </div>
                </div>

                <button
                  onClick={(e) => deleteExperience(e, index)}
                  className="mt-4 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button onClick={addExperience} variant="soft" size="sm" className="mt-2">
            Add Experience
          </Button>
        </fieldset>

        <div className="mb-5">
          <p className="form_label mt-2">Time slots</p>
          <div className="mb-5">
            <p className="form_label text-[13px]">Appointment length</p>
            <select
              name="slotDuration"
              value={formData.slotDuration}
              onChange={handleInputChange}
              className="select-field"
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Your weekly hours are split into appointments of this length.
            </p>
          </div>
          {formData.timeSlots?.map((item, index) => (
            <div key={index} className="mb-4 rounded-2xl border border-border bg-background/50 p-4">
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 mb-[30px] gap-5 items-center">
                  <div>
                    <p className="form_label text-[13px]">Day</p>
                    <select
                      name="day"
                      value={item.day}
                      onChange={(e) => handleTimeSlotChange(e, index)}
                      className="select-field"
                    >
                      <option value="">Select</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <p className="form_label text-[13px]">Starting Time</p>
                    <Input
                      type="time"
                      name="startingTime"
                      value={item.startingTime}
                      onChange={(e) => handleTimeSlotChange(e, index)}
                    />
                  </div>
                  <div>
                    <p className="form_label text-[13px]">Ending Time</p>
                    <Input
                      type="time"
                      name="EndingTime"
                      value={item.EndingTime}
                      onChange={(e) => handleTimeSlotChange(e, index)}
                    />
                  </div>
                  {/* Button placed close to other fields */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => deleteTimeSlot(e, index)}
                      className="mt-7 grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button onClick={addTimeSlot} variant="soft" size="sm" className="mt-2">
            Add Slot
          </Button>
        </div>

        <fieldset disabled={locked} className="mb-5 min-w-0">
          <p className="form_label">About</p>
          <Textarea
            type="text"
            placeholder="Write about yourself"
            name="about"
            value={formData.about}
            onChange={handleInputChange}
            maxLength={1500}
          />
        </fieldset>

        <fieldset disabled={locked} className="mb-5 flex min-w-0 items-center gap-4">
          <div className="relative">
            <Avatar src={formData.photo} name={formData.name} className="h-16 w-16" textClassName="text-lg" />
            {uploading && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-background/70">
                <Spinner />
              </span>
            )}
          </div>
          <label
            htmlFor="customFile"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-primary ${locked ? "pointer-events-none opacity-50" : ""}`}
          >
            <Camera className="h-4 w-4" />
            {uploading ? "Uploading..." : "Change photo"}
          </label>
          <input
            type="file"
            name="photo"
            id="customFile"
            onChange={handleFileInputChange}
            accept=".jpg, .jpeg, .png"
            className="sr-only"
          />
        </fieldset>

        <div className="mt-7">
          <Button type="submit" onClick={updateProfileHandler} disabled={uploading}>
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Profile