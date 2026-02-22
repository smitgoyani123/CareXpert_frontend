import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Mail, Lock, Eye, EyeOff, Stethoscope, BriefcaseBusiness, CreditCard, MapPin, User,
} from "lucide-react";
import { InputWithIcon } from "../../components/ui/input-with-icon";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as React from "react";
import axios from "axios";
import { toast } from "sonner";

const getPasswordRules = (pwd: string) => [
  { label: "At least 8 characters",                     pass: pwd.length >= 8 },
  { label: "At least one uppercase letter (A-Z)",       pass: /[A-Z]/.test(pwd) },
  { label: "At least one lowercase letter (a-z)",       pass: /[a-z]/.test(pwd) },
  { label: "At least one number (0-9)",                 pass: /[0-9]/.test(pwd) },
  { label: "At least one special character (!@#$%^&*)", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
];

const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/;
const nameRegex = /^[a-zA-Z\s'-]+$/;
const licenseRegex = /^[A-Z0-9]{5,15}$/i;

const specialties = [
  "Cardiology", "Dermatology", "General Medicine", "Neurology",
  "Pediatrics", "Psychiatry", "Orthopedics", "Gynecology", "Other",
];

export default function DoctorSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [license, setLicense] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    firstName?: string; lastName?: string; email?: string;
    specialty?: string; location?: string; license?: string; password?: string;
  }>({});
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  const passwordRules = getPasswordRules(password);

  // ── onBlur handlers ──
  const handleFirstNameBlur = () => {
    if (!firstName.trim()) setErrors((p) => ({ ...p, firstName: "First name is required." }));
    else if (!nameRegex.test(firstName)) setErrors((p) => ({ ...p, firstName: "First name must contain only letters." }));
    else setErrors((p) => ({ ...p, firstName: undefined }));
  };

  const handleLastNameBlur = () => {
    if (!lastName.trim()) setErrors((p) => ({ ...p, lastName: "Last name is required." }));
    else if (!nameRegex.test(lastName)) setErrors((p) => ({ ...p, lastName: "Last name must contain only letters." }));
    else setErrors((p) => ({ ...p, lastName: undefined }));
  };

  const handleEmailBlur = () => {
    if (!email.trim()) setErrors((p) => ({ ...p, email: "Email is required." }));
    else if (!emailRegex.test(email.trim())) setErrors((p) => ({ ...p, email: "Enter a valid email (e.g. name@example.com)." }));
    else setErrors((p) => ({ ...p, email: undefined }));
  };

  const handleLocationBlur = () => {
    if (!location.trim()) setErrors((p) => ({ ...p, location: "Location is required." }));
    else setErrors((p) => ({ ...p, location: undefined }));
  };

  const handleLicenseBlur = () => {
    if (license.trim() && !licenseRegex.test(license.trim()))
      setErrors((p) => ({ ...p, license: "License must be 5-15 alphanumeric characters." }));
    else setErrors((p) => ({ ...p, license: undefined }));
  };

  const handlePasswordBlur = () => {
    setShowRules(true);
    if (!password) setErrors((p) => ({ ...p, password: "Password is required." }));
    else if (!getPasswordRules(password).every((r) => r.pass)) setErrors((p) => ({ ...p, password: "Password does not meet all requirements below." }));
    else setErrors((p) => ({ ...p, password: undefined }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    const rules = getPasswordRules(password);

    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    else if (!nameRegex.test(firstName)) newErrors.firstName = "First name must contain only letters.";

    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    else if (!nameRegex.test(lastName)) newErrors.lastName = "Last name must contain only letters.";

    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!emailRegex.test(email.trim())) newErrors.email = "Enter a valid email (e.g. name@example.com).";

    if (!specialty) newErrors.specialty = "Please select your specialty.";

    if (!location.trim()) newErrors.location = "Location is required.";

    if (license.trim() && !licenseRegex.test(license.trim()))
      newErrors.license = "License must be 5-15 alphanumeric characters.";

    if (!password) newErrors.password = "Password is required.";
    else if (!rules.every((r) => r.pass)) newErrors.password = "Password does not meet all requirements below.";

    setErrors(newErrors);
    setShowRules(true);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/user/signup`, {
        firstName, lastName, email, password, role: "DOCTOR", specialty, clinicLocation: location,
      }, { withCredentials: true });

      if (res.data.success) {
        toast.success("Doctor account created successfully!");
        navigate("/dashboard/doctor");
      } else {
        toast.error(res.data.message || "Signup failed");
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data?.message || "Something went wrong");
      else toast.error("Unknown error occurred.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Join as Doctor</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Create your professional account to start helping patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSignup}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">First Name</label>
                <InputWithIcon
                  id="firstName" type="text" placeholder="Dr. John" value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: undefined })); }}
                  onBlur={handleFirstNameBlur}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  className={errors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Name</label>
                <InputWithIcon
                  id="lastName" type="text" placeholder="Smith" value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: undefined })); }}
                  onBlur={handleLastNameBlur}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  className={errors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Address</label>
              <InputWithIcon
                id="email" type="email" placeholder="dr.smith@hospital.com" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                onBlur={handleEmailBlur}
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="specialty" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Specialty</label>
                <Select value={specialty} onValueChange={(val) => { setSpecialty(val); setErrors((p) => ({ ...p, specialty: undefined })); }}>
                  <SelectTrigger id="specialty" className={errors.specialty ? "border-red-500 focus:ring-red-500" : ""}>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.specialty && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.specialty}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="experience" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Experience</label>
                <InputWithIcon
                  id="experience" type="text" placeholder="5 years" value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  icon={<BriefcaseBusiness className="h-4 w-4 text-gray-400" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="license" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Number</label>
                <InputWithIcon
                  id="license" type="text" placeholder="MD123456" value={license}
                  onChange={(e) => { setLicense(e.target.value); setErrors((p) => ({ ...p, license: undefined })); }}
                  onBlur={handleLicenseBlur}
                  icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                  className={errors.license ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.license && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.license}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location</label>
                <InputWithIcon
                  id="location" type="text" placeholder="New York, NY" value={location}
                  onChange={(e) => { setLocation(e.target.value); setErrors((p) => ({ ...p, location: undefined })); }}
                  onBlur={handleLocationBlur}
                  icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  className={errors.location ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.location}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
              <div className="relative">
                <InputWithIcon
                  id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setShowRules(true); setErrors((p) => ({ ...p, password: undefined })); }}
                  onBlur={handlePasswordBlur}
                  icon={<Lock className="h-4 w-4 text-gray-400" />}
                  className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.password}</p>}
              {showRules && (
                <ul className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                  {passwordRules.map((rule) => (
                    <li key={rule.label} className={`text-xs flex items-center gap-1 ${rule.pass ? "text-green-600" : "text-red-500"}`}>
                      <span className="font-bold">{rule.pass ? "✓" : "✗"}</span>{rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Create Doctor Account</Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}