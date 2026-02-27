/**
 * LoginSignup.tsx - Auth page using react-hook-form + Zod for login, and manual Zod validation for signup.
 * * Changes made (Issue #25):
 * 1. Replaced useState for login form data with useForm hook from react-hook-form
 * 2. Added Zod schemas for type-safe validation (loginSchema, signupSchema)
 * 3. Removed manual onChange handlers for the login form - now using register() from react-hook-form
 * 4. Added inline error messages for each login field via react-hook-form
 * 5. Login validation is now schema-based via zodResolver; signup uses Zod safeParse with toast-based errors
 * 6. Reduced re-renders for the login form - only touched fields re-render
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Heart, User, Stethoscope, MapPin, Eye, EyeOff, Phone } from "lucide-react";
import { useAuthStore } from "../../store/authstore";
import { api } from "@/lib/api";
import axios from "axios";
import { notify } from "@/lib/toast";

/**
 * Zod Schema for Login Form
 * - data: email or username (required, min 1 character)
 * - password: required, min 6 characters
 */
const loginSchema = z.object({
  data: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Zod Schema for Signup Form
 * - Uses discriminatedUnion based on role (PATIENT vs DOCTOR)
 * - Includes password confirmation validation via refine
 * - Doctor requires specialty and clinicLocation
 * - Patient requires location
 */
const baseSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[0-9+\-\s()]*$/, "Invalid phone number"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

// Schema for Patient signup
const patientSignupSchema = baseSignupSchema.extend({
  role: z.literal("PATIENT"),
  location: z.string().min(1, "Location is required"),
});

// Schema for Doctor signup
const doctorSignupSchema = baseSignupSchema.extend({
  role: z.literal("DOCTOR"),
  specialty: z.string().min(1, "Specialty is required"),
  clinicLocation: z.string().min(1, "Clinic location is required"),
});

// Combined signup schema with password match validation
const signupSchema = z.discriminatedUnion("role", [patientSignupSchema, doctorSignupSchema])
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Type inference from Zod schemas
type LoginFormData = z.infer<typeof loginSchema>;

// Form type that includes all possible fields for react-hook-form
// (We validate with Zod discriminated union on submit)
type SignupFormFields = {
  role: "PATIENT" | "DOCTOR" | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  location: string;
  specialty: string;
  clinicLocation: string;
};

export default function LoginSignup() {
  // UI state - kept as useState since these are not form data
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  /**
   * Login Form - using react-hook-form with Zod resolver
   * Benefits:
   * - No manual state management for form fields
   * - Automatic validation on submit and onChange (after first submit)
   * - Type-safe form data
   */
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      data: "",
      password: "",
    },
  });

  /**
   * Signup Form - using react-hook-form
   * Uses SignupFormFields type to include ALL possible fields
   * Validation is done automatically with Zod via resolver
   */
  const signupForm = useForm<SignupFormFields>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      role: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      location: "",
      specialty: "",
      clinicLocation: "",
    },
  });

  const selectedRole = signupForm.watch("role");

  /**
   * Handle Login - simplified with react-hook-form
   * Form validation is handled automatically by zodResolver
   */
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await api.post(`/user/login`, data);

      if (response.data.success) {
        setUser(response.data.data);
        notify.success("Login successful!");

        // Navigate based on role
        const role = response.data.data.role;
        if (role === "DOCTOR") {
          navigate("/dashboard/doctor");
        } else if (role === "PATIENT") {
          navigate("/dashboard/patient");
        } else if (role === "ADMIN") {
          navigate("/admin");
        }
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        notify.error(error.response?.data?.message || "Login failed");
      } else {
        notify.error("Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Signup - with Zod validation via react-hook-form resolver
   * Password matching and role-specific fields are validated by schema
   */
  const handleSignup = async (formValues: SignupFormFields) => {
    if (!formValues.role) {
      notify.error("Please select a role");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        phone: formValues.phone,
        password: formValues.password,
        role: formValues.role,
        ...(formValues.role === "DOCTOR" && {
          specialty: formValues.specialty,
          clinicLocation: formValues.clinicLocation,
        }),
        ...(formValues.role === "PATIENT" && {
          location: formValues.location,
        }),
      };

      const response = await api.post(`/user/signup`, payload);

      if (response.data.success) {
        notify.success("Signup successful! Please login.");
        setIsLogin(true);
        signupForm.reset();
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        notify.error(error.response?.data?.message || "Signup failed");
      } else {
        notify.error("Signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle role selection and update form accordingly
   */
  const handleRoleSelect = (role: "PATIENT" | "DOCTOR") => {
    signupForm.setValue("role", role, { shouldValidate: true, shouldDirty: true });
    // Clear role-specific errors when role changes
    signupForm.clearErrors(["location", "specialty", "clinicLocation"]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to CareXpert
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your health companion for better care
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <Tabs value={isLogin ? "login" : "signup"} onValueChange={(value) => setIsLogin(value === "login")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={isLogin ? "login" : "signup"}>
              {/* Login Tab - Using react-hook-form's handleSubmit and register */}
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  <div>
                    <Label htmlFor="login-data">Email or Username</Label>
                    <Input
                      id="login-data"
                      type="text"
                      {...loginForm.register("data")}
                      placeholder="Enter your email or username"
                    />
                    {loginForm.formState.errors.data && (
                      <p className="text-sm text-red-500 mt-1">
                        {loginForm.formState.errors.data.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        {...loginForm.register("password")}
                        placeholder="Enter your password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500 mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab - Using react-hook-form's register and handleSubmit */}
              <TabsContent value="signup">
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-6">
                  {/* Role Selection */}
                  <div>
                    <Label>I want to join as:</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button
                        type="button"
                        variant={selectedRole === "PATIENT" ? "default" : "outline"}
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleRoleSelect("PATIENT")}
                      >
                        <User className="h-6 w-6" />
                        <span>Patient</span>
                      </Button>
                      <Button
                        type="button"
                        variant={selectedRole === "DOCTOR" ? "default" : "outline"}
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleRoleSelect("DOCTOR")}
                      >
                        <Stethoscope className="h-6 w-6" />
                        <span>Doctor</span>
                      </Button>
                    </div>
                    {signupForm.formState.errors.role && (
                      <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.role.message}</p>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...signupForm.register("firstName")}
                        placeholder="John"
                      />
                      {signupForm.formState.errors.firstName && (
                        <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...signupForm.register("lastName")}
                        placeholder="Doe"
                      />
                      {signupForm.formState.errors.lastName && (
                        <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...signupForm.register("email")}
                      placeholder="john@example.com"
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        {...signupForm.register("phone")}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                      />
                    </div>
                    {signupForm.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  {/* Doctor-specific fields */}
                  {selectedRole === "DOCTOR" && (
                    <>
                      <div>
                        <Label htmlFor="specialty">Specialty</Label>
                        <Select
                          value={signupForm.watch("specialty") || ""}
                          onValueChange={(value) => signupForm.setValue("specialty", value, { shouldValidate: true, shouldDirty: true })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cardiology">Cardiology</SelectItem>
                            <SelectItem value="Dermatology">Dermatology</SelectItem>
                            <SelectItem value="Neurology">Neurology</SelectItem>
                            <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                            <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                            <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                            <SelectItem value="General Medicine">General Medicine</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {signupForm.formState.errors.specialty && (
                          <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.specialty.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="clinicLocation">Clinic Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="clinicLocation"
                            {...signupForm.register("clinicLocation")}
                            placeholder="City, State, Country"
                            className="pl-10"
                          />
                        </div>
                        {signupForm.formState.errors.clinicLocation && (
                          <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.clinicLocation.message}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Patient-specific fields */}
                  {selectedRole === "PATIENT" && (
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          {...signupForm.register("location")}
                          placeholder="City, State, Country"
                          className="pl-10"
                        />
                      </div>
                      {signupForm.formState.errors.location && (
                        <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.location.message}</p>
                      )}
                    </div>
                  )}

                  {/* Password fields */}
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...signupForm.register("password")}
                        placeholder="Create a password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...signupForm.register("confirmPassword")}
                      placeholder="Confirm your password"
                    />
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !selectedRole || !signupForm.formState.isValid}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}