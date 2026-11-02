import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Camera, LockKeyhole } from "lucide-react";
import { DEMO_ACCOUNTS, DEMO_MODE } from "@/brand";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import Spinner from "@/components/ui/spinner";
import AuthShell from "@/components/Auth/AuthShell";
import RoleSwitch from "@/components/Auth/RoleSwitch";
import uploadImageToCloudinary from "../utils/uploadCloudinary";
import { BASE_URL } from "../config";
import { toast } from "react-toastify";

function SignUp() {
  const [previewURL, setPreviewURL] = useState('');
  const [loading , setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const [formData , setFormData] = useState(
    {
      name: "",
      email: '',
      password: '',
      photo: null,
      role: 'patient',
      gender:'',
      registrationNumber:'',
    })

    const handleInputChange = e=>{
      const { name, value } = e.target
      setFormData(prevFormData => ({...prevFormData, [name]: value}))
    }
    const handleFileInputChange = async event => {
      const file = event.target.files[0]
      if (!file) return
      setUploading(true)
      try {
        const data = await uploadImageToCloudinary(file)
        const photoUrl = data.secure_url || data.url
        setPreviewURL(photoUrl)
        // use the latest form state, the user may have typed while the photo was uploading
        setFormData(prevFormData => ({...prevFormData, photo:photoUrl}))
      } catch {
        toast.error("Photo upload failed, please try again")
      } finally {
        setUploading(false)
      }
    }
    const submitHandler = async (event) => {
      event.preventDefault();
      if (uploading) {
        return toast.info("Please wait for the photo upload to finish");
      }
      const isDoctor = formData.role === "doctor";
      if (isDoctor && !formData.registrationNumber.trim()) {
        return toast.error("Please enter your medical registration number");
      }
      // the registration number is only sent for doctors (undefined is left out of the JSON)
      const payload = isDoctor ? formData : { ...formData, registrationNumber: undefined };
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const { message, data } = await res.json();

        if (!res.ok) {
          throw new Error(message);
        }
        setLoading(false);
        // doctors get a longer message explaining the verification step
        toast.success(message, isDoctor ? { autoClose: 6000 } : undefined);
        // the account works once the emailed link is clicked
        navigate("/check-email", { state: { email: formData.email, previewUrl: data?.previewUrl } });

      } catch (err) {
        toast.error(err.message);
        setLoading(false);
      }
    };


  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute. No credit card needed.">
      <form onSubmit={submitHandler} className="space-y-5">
        <RoleSwitch
          value={formData.role}
          onChange={role => setFormData(prev => ({ ...prev, role }))}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="form_label">Full name</label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="form_label">Gender</label>
            <Select
              name="gender"
              value={formData.gender}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
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

        <div>
          <label htmlFor="email" className="form_label">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="form_label">Password</label>
          <Input
            id="password"
            type="password"
            placeholder="8+ characters with a letter and a number"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        {/* doctors are verified with their registration number before they are listed */}
        <AnimatePresence initial={false}>
          {formData.role === "doctor" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label htmlFor="registrationNumber" className="form_label flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" /> Medical registration number
              </label>
              <Input
                id="registrationNumber"
                type="text"
                placeholder="State medical council / NMC number"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                required
              />
              <p className="mt-2 text-xs text-muted-foreground">
                We verify this number before your profile is listed, usually within 2 days.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* photo upload with live preview */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {previewURL ? (
              <img src={previewURL} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/40" />
            ) : (
              <Avatar name={formData.name || "?"} className="h-16 w-16" textClassName="text-lg" />
            )}
            {uploading && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-background/70">
                <Spinner />
              </span>
            )}
          </div>
          <label
            htmlFor="customFile"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Camera className="h-4 w-4" />
            {uploading ? "Uploading..." : previewURL ? "Change photo" : "Upload photo"}
          </label>
          <input
            type="file"
            name="photo"
            id="customFile"
            onChange={handleFileInputChange}
            accept=".jpg, .jpeg, .png"
            className="sr-only"
          />
        </div>

        <Button disabled={loading} type="submit" size="lg" className="w-full">
          {loading ? <Spinner className="text-primary-foreground" /> : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

// portfolio demo: no new accounts, point visitors to the shared demo accounts instead
function SignupClosed() {
  return (
    <AuthShell title="Sign-ups are closed" subtitle="This is a portfolio demo, so new accounts can't be created.">
      <div className="space-y-5">
        <div className="flex gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
          <LockKeyhole className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            To keep the demo safe from spam and fake doctor accounts, registration is turned off. You can explore everything
            with the ready-made accounts below.
          </p>
        </div>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {DEMO_ACCOUNTS.map(account => (
            <li key={account.role} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-semibold">{account.label}</p>
                <p className="text-xs text-muted-foreground">{account.email} · {account.password}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link to="/login" className="block">
          <Button size="lg" className="w-full">
            Go to login <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return DEMO_MODE ? <SignupClosed /> : <SignUp />;
}
