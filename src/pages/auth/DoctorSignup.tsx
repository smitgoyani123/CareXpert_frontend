/**
 * DoctorSignup.tsx - Refactored to use react-hook-form with Zod validation
 * 
 * Changes made:
 * 1. Replaced multiple useState hooks with useForm hook from react-hook-form
 * 2. Added Zod schema (doctorSignupSchema) for type-safe validation
 * 3. Removed manual onChange handlers - now using register() and Controller for Select
 * 4. Added inline error messages for each field
 * 5. Centralized validation in Zod schema
 * 6. Used zodResolver to connect Zod schema with react-hook-form
 */
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
  Mail,
  Lock,
  Eye,
  EyeOff,
  Stethoscope,
  BriefcaseBusiness,
  CreditCard,
  MapPin,
  User,
} from "lucide-react";
import { InputWithIcon } from "../../components/ui/input-with-icon";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";

/**
 * Zod Schema for Doctor Signup Form
 * Defines validation rules for all doctor signup fields
 */
const doctorSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  specialty: z.string().min(1, "Please select a specialty"),
  experience: z.string().optional(),
  license: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

// Type inference from Zod schema
type DoctorSignupFormData = z.infer<typeof doctorSignupSchema>;

export default function DoctorSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Mock data for specialties
  const specialties = [
    "Cardiology",
    "Dermatology",
    "General Medicine",
    "Neurology",
    "Pediatrics",
    "Psychiatry",
    "Orthopedics",
    "Gynecology",
    "Other",
  ];

  /**
   * Doctor Signup Form - using react-hook-form with Zod resolver
   */
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DoctorSignupFormData>({
    resolver: zodResolver(doctorSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      specialty: "",
      experience: "",
      license: "",
      location: "",
      password: "",
    },
  });

  /**
   * Handle form submission - simplified with react-hook-form
   * Validation is handled automatically by zodResolver
   */
  const onSubmit = async (data: DoctorSignupFormData) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/user/signup`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: "DOCTOR",
        specialty: data.specialty,
        clinicLocation: data.location,
      }, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Doctor account created successfully!");
        navigate("/dashboard/doctor");
      } else {
        toast.error(res.data.message || "Signup failed");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || "Something went wrong");
      } else {
        toast.error("Unknown error occurred.");
      }
      console.error(err);
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
          {/* Form using react-hook-form's handleSubmit */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  First Name
                </label>
                <InputWithIcon
                  id="firstName"
                  type="text"
                  placeholder="Dr. John"
                  {...register("firstName")}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                />
                {/* Display validation error from Zod schema */}
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Last Name
                </label>
                <InputWithIcon
                  id="lastName"
                  type="text"
                  placeholder="Smith"
                  {...register("lastName")}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email Address
              </label>
              <InputWithIcon
                id="email"
                type="email"
                placeholder="dr.smith@hospital.com"
                {...register("email")}
                icon={<Mail className="h-4 w-4 text-gray-400" />}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="specialty"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Specialty
                </label>
                {/* Using Controller for Select component */}
                <Controller
                  name="specialty"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.specialty && (
                  <p className="text-sm text-red-500">{errors.specialty.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="experience"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Experience
                </label>
                <InputWithIcon
                  id="experience"
                  type="text"
                  placeholder="5 years"
                  {...register("experience")}
                  icon={<BriefcaseBusiness className="h-4 w-4 text-gray-400" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="license"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  License Number
                </label>
                <InputWithIcon
                  id="license"
                  type="text"
                  placeholder="MD123456"
                  {...register("license")}
                  icon={<CreditCard className="h-4 w-4 text-gray-400" />}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Location
                </label>
                <InputWithIcon
                  id="location"
                  type="text"
                  placeholder="New York, NY"
                  {...register("location")}
                  icon={<MapPin className="h-4 w-4 text-gray-400" />}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <div className="relative">
                <InputWithIcon
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  {...register("password")}
                  icon={<Lock className="h-4 w-4 text-gray-400" />}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Doctor Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
