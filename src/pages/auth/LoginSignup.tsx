/**
 * LoginSignup.tsx - Auth page using react-hook-form + Zod for login, and manual Zod validation for signup.
 * 
 * Changes made (Issue #25):
 * 1. Replaced useState for login form data with useForm hook from react-hook-form
 * 2. Added Zod schemas for type-safe validation (loginSchema, signupSchema)
 * 3. Removed manual onChange handlers for the login form - now using register() from react-hook-form
 * 4. Added inline error messages for each login field via react-hook-form
 * 5. Login validation is now schema-based via zodResolver; signup uses Zod safeParse with toast-based errors
 * 6. Reduced re-renders for the login form - only touched fields re-render
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Heart, User, Stethoscope, MapPin, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/authstore";
import axios from "axios";
import { toast } from "sonner";

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
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  firstName: string;
  lastName: string;
  email: string;
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
  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "DOCTOR" | null>(null);

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
   * Validation is done manually with Zod on submit (discriminated union)
   */
  const signupForm = useForm<SignupFormFields>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      location: "",
      specialty: "",
      clinicLocation: "",
    },
  });

  /**
   * Handle Login - simplified with react-hook-form
   * Form validation is handled automatically by zodResolver
   */
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/login`,
        data,
        { withCredentials: true }
      );

      if (response.data.success) {
        setUser(response.data.data);
        toast.success("Login successful!");
        
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Signup - with Zod validation
   * Password matching and role-specific fields are validated by schema
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get form values - now properly typed with all fields
    const formValues = signupForm.getValues();
    
    // Check role first
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    // Build complete data with role for validation
    const completeData = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword,
      role: selectedRole,
      ...(selectedRole === "PATIENT" && { location: formValues.location }),
      ...(selectedRole === "DOCTOR" && { 
        specialty: formValues.specialty,
        clinicLocation: formValues.clinicLocation,
      }),
    };

    // Validate with Zod schema
    const validationResult = signupSchema.safeParse(completeData);
    
    if (!validationResult.success) {
      // Show first validation error
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsLoading(true);

    try {
      // Build payload from form values (already validated)
      const payload = {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        password: formValues.password,
        role: selectedRole,
        ...(selectedRole === "DOCTOR" && {
          specialty: formValues.specialty,
          clinicLocation: formValues.clinicLocation,
        }),
        ...(selectedRole === "PATIENT" && {
          location: formValues.location,
        }),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/signup`,
        payload
      );

      if (response.data.success) {
        toast.success("Signup successful! Please login.");
        setIsLogin(true);
        // Reset form using react-hook-form's reset method
        signupForm.reset();
        setSelectedRole(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle role selection and update form accordingly
   */
  const handleRoleSelect = (role: "PATIENT" | "DOCTOR") => {
    setSelectedRole(role);
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
                    {/* Using register() instead of value + onChange */}
                    <Input
                      id="login-data"
                      type="text"
                      {...loginForm.register("data")}
                      placeholder="Enter your email or username"
                    />
                    {/* Display validation error from Zod schema */}
                    {loginForm.formState.errors.data && (
                      <p className="text-sm text-red-500 mt-1">
                        {loginForm.formState.errors.data.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      {/* Using register() instead of value + onChange */}
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
                    {/* Display validation error from Zod schema */}
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

              {/* Signup Tab - Using react-hook-form's register for all fields */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6">
                  {/* Role Selection - Kept as state since it controls conditional rendering */}
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
                  </div>

                  {/* Basic Info - Using register() instead of value + onChange */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...signupForm.register("firstName")}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...signupForm.register("lastName")}
                        placeholder="Doe"
                      />
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
                  </div>

                  {/* Doctor-specific fields - using watch() + setValue() for Select integration */}
                  {selectedRole === "DOCTOR" && (
                    <>
                      <div>
                        <Label htmlFor="specialty">Specialty</Label>
                        {/* Select requires special handling with react-hook-form */}
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
                    </div>
                  )}

                  {/* Password fields - Using register() */}
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
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...signupForm.register("confirmPassword")}
                      placeholder="Confirm your password"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !selectedRole}>
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
