import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import uploadImageToCloudinary from "../../utils/uploadCloudinary";
import { HashLoader } from "react-spinners";
import { BASE_URL, token } from "../../config";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

const ProfileSetting = ({user}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setFormData({
    name : user.name,
    email : user.email,
    photo : user.photo,
    gender : user.gender,
    bloodType : user.bloodType,
  
  })
  }, [user])
  

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: null,
    gender: "",
    bloodType:"",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    const data = await uploadImageToCloudinary(file);
    setSelectedFile(data.url);
    setFormData({ ...formData, photo: data.url });
  };
  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify(formData),
      });
      const { message } = await res.json();

      if (!res.ok) {
        throw new Error(message);
      }
      setLoading(false);
      toast.success(message);
      navigate("/users/profile/me");
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 md:mt-5">
      {" "}
      <form onSubmit={submitHandler}>
        <div className="mb-5">
          <Input
            type="text"
            placeholder="Full name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-5">
          <Input
            type="email"
            placeholder="Your email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            aria-readonly
            readOnly
          />
        </div>
        <div className="mb-5">
          <Input
            type="password"
            placeholder="Your password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            
            
          />
        </div>
        <div className="mb-5">
          <Input
            type="text"
            placeholder="Your Blood Type"
            name="bloodType"
            value={formData.bloodType}
            onChange={handleInputChange}
          />
        </div>


        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">


          <div>
            <label className="text-headingColor font-bold text-[16px] leading-7">
              Gender:
            </label>
            <Select
              name="gender"
              value={formData.gender}
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
        </div>
        <div className="mb-5 flex items-center gap-3">
          {formData.photo && (
            <figure
              className="w-[60px] h-[60px] rounded-full border-2
        border-solid border-primaryColor overflow-hidden"
            >
              <img src={formData.photo} alt="" className="w-full rounded-full" />
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
              {selectedFile? selectedFile.name : "upload Photo"}
            </label>
          </div>
        </div>
        <div className="mt-7">
          <Button
            disabled={loading && true}
            type="submit"
            className="w-full rounded-md py-3"
          >
            {loading ? <HashLoader size={25} color="#ffffff" /> : "Update"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetting;
