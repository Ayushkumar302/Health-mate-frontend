import React, { useState } from "react";
import { Link} from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SignUpImg from "../assets/images/signup.gif";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import uploadImageToCloudinary from "../utils/uploadCloudinary";
import { HashLoader } from "react-spinners";
import { BASE_URL } from "../config";
import { toast } from "react-toastify";

function SignUp() {

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState('');
  const [loading , setLoading] = useState(false);
  const navigate = useNavigate();
 


  const [formData , setFormData] = useState(
    {
      name: "",
      email: '',
      password: '',
      photo:selectedFile,
      role: 'patient',
      gender:'',

    })

    const handleInputChange = e=>{
      setFormData({...formData, [e.target.name]: e.target.value})
    }
    const handleFileInputChange = async event => {
      const file = event.target.files[0]
      const data = await uploadImageToCloudinary(file)
      setPreviewURL(data.url)
      setSelectedFile(data.url)
      setFormData({...formData, photo:data.url})
      
      
      
     
    }
    const submitHandler = async (event) => {
      event.preventDefault();
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        const { message } = await res.json();

        if (!res.ok) {
          throw new Error(message);
        }
        setLoading(false);
        toast.success(message);
        navigate("/login");
        
      } catch (err) {
        toast.error(err.message);
        setLoading(false);
      }
    };


  return (
    <section className="px-5 xl:px-0">
      <div className="max-w-[1170px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* img */}
          <div className="hidden lg:block bg-primaryColor rounded-l-lg">
            <figure className="rounded-l-lg">
              <img
                src={SignUpImg}
                alt="Sign up"
                className="w-full rounded-l-lg"
              />
            </figure>
          </div>
          {/* form */}
          <div className="rounded-l-lg lg:pl-16 py-10">
            <h3 className="text-headingColor text-[22px] leading-9 font-bold mb-10">
              Create an <span className="text-primaryColor">account</span>
            </h3>
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
                />
              </div>
              <div className="mb-5">
                <Input
                  type="password"
                  placeholder="Your password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <label className="text-headingColor font-bold text-[16px] leading-7">
                    Are you a:
                  </label>
                  <Select
                    name="role"
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                {selectedFile && (
                  <figure
                    className="w-[60px] h-[60px] rounded-full border-2
                  border-solid border-primaryColor overflow-hidden"
                  >
                    <img
                      src={previewURL}
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
                <Button
                  disabled={loading && true}
                  type="submit"
                  className="w-full rounded-md py-3"
                >
                  {loading ? (
                    <HashLoader size={35} color="#ffffff" />
                  ) : (
                    "Sign up"
                  )}
                </Button>
              </div>
              <p className="mt-5 text-textColor text-center">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primaryColor ml-1"
                >
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignUp;
