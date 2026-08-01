/* eslint-disable react/prop-types */
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import  { useState ,useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {AiOutlineDelete} from 'react-icons/ai'
import uploadImageToCloudinary from '../../utils/uploadCloudinary'
import { BASE_URL ,token } from '@/config'
import {toast} from 'react-toastify'

const Profile = ({doctorData}) => {
    const [formData , setFormData] = useState({
        name: '',
        email: '',
        password:'',
        phone: '',
        bio: '',
        gender: '',
        specialization:'',
        ticketPrice:0,
        qualifications:[],
        experiences:[],
        timeSlots:[],
        about:'',
        photo:null,
    })

    useEffect(() => {
      setFormData({
        name: doctorData?.name,
        email: doctorData?.email,
        phone: doctorData?.phone,
        bio: doctorData?.bio,
        gender: doctorData?.gender,
        specialization:doctorData?.specialization,
        ticketPrice:doctorData?.ticketPrice,
        qualifications:doctorData?.qualifications,
        experiences:doctorData?.experiences,
        timeSlots:doctorData?.timeSlots,
        about:doctorData?.about,
        photo:doctorData?.photo

      })
    
    }, [doctorData])
    

    
    const handleInputChange = e =>{
        setFormData({...formData, [e.target.name]: e.target.value})
        

    }
   
    //reusable function to add item
    const addItem = (key,item)=>{
      setFormData(prevFormData =>({...prevFormData,[key]:[...prevFormData[key] , item]}))
    }
    //reusable input change function
    const handleResuableInputChangeFunc = (key,index,event)=>{
      const {name,value}=event.target
      setFormData(prevFormData =>{
        const updateItems = [...prevFormData[key]]
        updateItems[index][name] = value
        return {...prevFormData, [key]:updateItems}
      
    })
  }
  //resuable delete func
  const deleteItem = (key, index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [key]: prevFormData[key].filter((_, i) => i === index),
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
          day:'Monday',
          startingTime:'11:00',
          EndingTime:'05:00',
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
      const data = await uploadImageToCloudinary(file);
      // console.log(data);
      setFormData({
        ...formData,
        photo: data?.url,
      });
    };


    const updateProfileHandler = async (e) => {
      e.preventDefault();
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
  return (
    <div>
      <h2 className="text-headingColor font-bold text-[24px] leading-9 mb-10">
        Profile Information
      </h2>
      <form>
        <div className="mb-5">
          <p className="form_label">Name</p>
          <Input
            type="text"
            placeholder="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>

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

        <div className="mb-5">
          <p className="form_label">Bio</p>
          <Textarea
            type="text"
            placeholder="Your Bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            maxLength={2000}
          />
        </div>

        <div className="mb-5">
          <div className="grid grid-cols-3 gap-5 mb-[30px]">
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
                <SelectTrigger className="w-[180px]">
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
                name="specialization"
                value={formData.specialization}
                onValueChange={(value) =>
                  setFormData({ ...formData, specialization: value })
                }
              >
                <SelectTrigger className="w-[180px]">
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
              <p className="form_label">Ticket Price</p>
              <Input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                placeholder="100"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="form_label">Qualifications</p>
          {formData.qualifications?.map((item, index) => (
            <div key={index}>
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
                  className="bg-red-600 p-2 rounded-full text-white text-[18px] mt-[30px] cursor-pointer"
                >
                  <AiOutlineDelete />
                </button>
              </div>
            </div>
          ))}
          <Button onClick={addQualification} className="mt-[30px] rounded-sm">
            Add Qualification
          </Button>
        </div>

        <div className="mb-5">
          <p className="form_label mt-2">Experiences</p>
          {formData.experiences?.map((item, index) => (
            <div key={index}>
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
                  className="bg-red-600 p-2 rounded-full text-white text-[18px] mt-[30px] cursor-pointer"
                >
                  <AiOutlineDelete />
                </button>
              </div>
            </div>
          ))}
          <Button onClick={addExperience} className="mt-[30px] rounded-sm">
            Add Experience
          </Button>
        </div>

        <div className="mb-5">
          <p className="form_label mt-2">Time slots</p>
          {formData.timeSlots?.map((item, index) => (
            <div key={index}>
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 mb-[30px] gap-5 items-center">
                  <div>
                    <p className="form_label text-[13px]">Day</p>
                    <select
                      name="day"
                      value={item.day}
                      onChange={(e) => handleTimeSlotChange(e, index)}
                      className="w-[180px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="bg-red-600 p-2 rounded-full mt-7 text-white text-[18px] cursor-pointer"
                    >
                      <AiOutlineDelete />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button onClick={addTimeSlot} className="mt-[30px] rounded-sm">
            Add Slot
          </Button>
        </div>

        <div className="mb-5">
          <p className="form_label">About</p>
          <Textarea
            type="text"
            placeholder="Write about yourself"
            name="about"
            value={formData.about}
            onChange={handleInputChange}
            maxLength={100}
          />
        </div>

        <div className="mb-5 flex items-center  gap-3">
          {formData.photo && (
            <figure className="w-[60px] h-[60px] rounded-full border-2 border-solid border-primaryColor overflow-hidden">
              <img
                src={formData.photo}
                alt=""
                className="w-full rounded-full"
              />
            </figure>
          )}
          <div className="relative w-[130px] h-[50px]">
            <Input
              type="file"
              name="photo"
              id="customFile"
              onChange={handleFileInputChange}
              accept=".jpg, .png"
              className="absolute top-0 left-0 w-full opacity-0 "
            />
            <label
              htmlFor="customFile"
              className="absolute top-0 left-0 w-full h-full flex items-center px-3 py-[0.375rem]
                              text-[15px] leading-6 overflow-hidden bg-[#0066ff46] text-headingColor font-semibold rounded-lg
                              truncate cursor-pointer"
            >
              Upload photo
            </label>
          </div>
        </div>

        <div className="mt-7">
          <Button type="submit" onClick={updateProfileHandler}>
            Update Profile
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Profile