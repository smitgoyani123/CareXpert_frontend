/**
 * PatientSignup.tsx - Refactored to use react-hook-form with Zod validation
 * * Changes made:
 * 1. Replaced multiple useState hooks with useForm hook from react-hook-form
 * 2. Added Zod schema (patientSignupSchema) for type-safe validation
 * 3. Removed manual onChange handlers - now using register()
 * 4. Added inline error messages for each field
 * 5. Password confirmation validation done via Zod refine
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
import { Mail, Lock, Eye, EyeOff, Heart, User } from "lucide-react";
import { InputWithIcon } from "../../components/ui/input-with-icon";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import axios from "axios";
import { useAuthStore } from "@/store/authstore";
import { notify } from "@/lib/toast";

/**
 * Zod Schema for Patient Signup Form
 * Includes password confirmation validation via refine
 */
const patientSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type inference from Zod schema
type PatientSignupFormData = z.infer<typeof patientSignupSchema>;

export default function PatientSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  /**
   * Patient Signup Form - using react-hook-form with Zod resolver
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientSignupFormData>({
    resolver: zodResolver(patientSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Handle form submission - simplified with react-hook-form
   * Validation is handled automatically by zodResolver
   */
  const onSubmit = async (data: PatientSignupFormData) => {
    try {
      const res = await api.post(
        `/user/signup`,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }
      );

      if (res.data.success) {
        notify.success("Account created successfully!");

        useAuthStore.getState().setUser({
          id: res.data.data.id,
          name: res.data.data.name,
          email: res.data.data.email,
          profilePicture: res.data.data.profilePicture,
          role: res.data.data.role,
        });

        if (res.data.data.role === "PATIENT") {
          navigate("/dashboard/patient");
        } else {
          navigate("/dashboard/doctor");
        }
      } else {
        notify.error(res.data.message || "Signup failed");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        notify.error(err.response.data?.message || "Something went wrong");
      } else {
        notify.error("Unknown error occurred");
      }
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
          {/* Form using react-hook-form's handleSubmit */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  First Name
                </label>
                <InputWithIcon
                  id="firstName"
                  type="text"
                  placeholder="John"
                  {...register("firstName")}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                />
                {/* Display validation error from Zod schema */}
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Last Name
                </label>
                <InputWithIcon
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...register("lastName")}
                  icon={<User className="h-4 w-4 text-gray-400" />}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Address
              </label>
              <InputWithIcon
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                {...register("email")}
                icon={<Mail className="h-4 w-4 text-gray-400" />}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Confirm Password
              </label>
              <div className="relative">
                <InputWithIcon
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  {...register("confirmPassword")}
                  icon={<Lock className="h-4 w-4 text-gray-400" />}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}