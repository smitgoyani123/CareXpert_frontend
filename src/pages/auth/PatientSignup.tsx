import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Mail, Lock, Eye, EyeOff, Heart, User } from "lucide-react";
import { InputWithIcon } from "../../components/ui/input-with-icon";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as React from "react";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/store/authstore";

const getPasswordRules = (pwd: string) => [
  { label: "At least 8 characters",                     pass: pwd.length >= 8 },
  { label: "At least one uppercase letter (A-Z)",       pass: /[A-Z]/.test(pwd) },
  { label: "At least one lowercase letter (a-z)",       pass: /[a-z]/.test(pwd) },
  { label: "At least one number (0-9)",                 pass: /[0-9]/.test(pwd) },
  { label: "At least one special character (!@#$%^&*)", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
];

const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/;
const nameRegex = /^[a-zA-Z\s'-]+$/;

export default function PatientSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  const passwordRules = getPasswordRules(password);

  // ── onBlur handlers: show error as soon as user leaves the field ──
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

  const handlePasswordBlur = () => {
    setShowRules(true);
    if (!password) setErrors((p) => ({ ...p, password: "Password is required." }));
    else if (!getPasswordRules(password).every((r) => r.pass)) setErrors((p) => ({ ...p, password: "Password does not meet all requirements below." }));
    else setErrors((p) => ({ ...p, password: undefined }));
  };

  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "Please confirm your password." }));
    else if (password !== confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "Passwords do not match." }));
    else setErrors((p) => ({ ...p, confirmPassword: undefined }));
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

    if (!password) newErrors.password = "Password is required.";
    else if (!rules.every((r) => r.pass)) newErrors.password = "Password does not meet all requirements below.";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    setShowRules(true);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/signup`,
        { firstName, lastName, email, password },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success("Account created successfully!");
        useAuthStore.getState().setUser({
          id: res.data.data.id,
          name: res.data.data.name,
          email: res.data.data.email,
          profilePicture: res.data.data.profilePicture,
          role: res.data.data.role,
          refreshToken: res.data.data.refreshToken,
        });
        if (res.data.data.role === "PATIENT") navigate("/dashboard/patient");
        else navigate("/dashboard/doctor");
      } else {
        toast.error(res.data.message || "Signup failed");
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data?.message || "Something went wrong");
      else toast.error("Unknown error occurred");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Join as Patient</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Create your account to start your healthcare journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSignup}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">First Name</label>
                <InputWithIcon
                  id="firstName" type="text" placeholder="John" value={firstName}
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
                  id="lastName" type="text" placeholder="Doe" value={lastName}
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
                id="email" type="email" placeholder="john.doe@example.com" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                onBlur={handleEmailBlur}
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.email}</p>}
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

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm Password</label>
              <div className="relative">
                <InputWithIcon
                  id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  onBlur={handleConfirmPasswordBlur}
                  icon={<Lock className="h-4 w-4 text-gray-400" />}
                  className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">&#x2717; {errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full">Create Account</Button>
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