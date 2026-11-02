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
import { Camera, Lock } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import Spinner from "@/components/ui/spinner";
import { BASE_URL } from "../../config";
import { authContext } from "@/context/AuthContext";
import { DEMO_MODE } from "@/brand";
import { toast } from "react-toastify";
import { useContext, useEffect, useState } from "react";

const ProfileSetting = ({user}) => {
  // shared demo patients keep the name and photo doctors and reviews show
  const locked = DEMO_MODE && Boolean(user.isDemo);
  const { token } = useContext(authContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: null,
    gender: "",
    bloodType:"",
  });

  useEffect(() => {
    setFormData({
    name : user.name || "",
    email : user.email || "",
    password: "",
    photo : user.photo || null,
    gender : user.gender || "",
    bloodType : user.bloodType || "",

  })
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({ ...prevFormData, [name]: value }));
  };
  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadImageToCloudinary(file);
      const photoUrl = data.secure_url || data.url;
      setSelectedFile(file);
      setFormData(prevFormData => ({ ...prevFormData, photo: photoUrl }));
    } catch {
      toast.error("Photo upload failed, please try again");
    } finally {
      setUploading(false);
    }
  };
  const submitHandler = async (event) => {
    event.preventDefault();
    if (uploading) {
      return toast.info("Please wait for the photo upload to finish");
    }
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
    <div className="card-surface p-6 sm:p-8">
      <h2 className="text-xl font-bold">Profile settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Keep your details up to date for your doctors.</p>

      {locked && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          Demo account: the name and photo are locked so every visitor sees the same patient. Everything else can be changed.
        </p>
      )}
      <form onSubmit={submitHandler} className="mt-6 space-y-5">
        {/* photo */}
        <fieldset disabled={locked} className="flex min-w-0 items-center gap-4">
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
            {uploading ? "Uploading..." : selectedFile ? selectedFile.name : "Change photo"}
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-name" className="form_label">Full name</label>
            <Input
              id="settings-name"
              type="text"
              placeholder="Full name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={locked}
            />
          </div>
          <div>
            <label htmlFor="settings-email" className="form_label">Email</label>
            <Input
              id="settings-email"
              type="email"
              name="email"
              value={formData.email}
              aria-readonly
              readOnly
              disabled
            />
          </div>
          {/* the shared demo accounts keep their password */}
          {!DEMO_MODE && (
          <div>
            <label htmlFor="settings-password" className="form_label">New password</label>
            <Input
              id="settings-password"
              type="password"
              placeholder="Leave empty to keep current"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
            />
          </div>
          )}
          <div>
            <label htmlFor="settings-blood" className="form_label">Blood type</label>
            <Input
              id="settings-blood"
              type="text"
              placeholder="e.g. B+"
              name="bloodType"
              value={formData.bloodType}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="form_label">Gender</label>
            <Select
              name="gender"
              value={formData.gender}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, gender: value }))
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
        </div>

        <Button
          disabled={loading}
          type="submit"
          className="w-full sm:w-auto"
        >
          {loading ? <Spinner className="text-primary-foreground" /> : "Save changes"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileSetting;
