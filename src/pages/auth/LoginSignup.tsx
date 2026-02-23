import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Heart, User, Stethoscope, MapPin, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authstore";
import axios from "axios";
import { toast } from "sonner";

interface LoginErrors {
  data?: string;
  password?: string;
}

interface SignupErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  specialty?: string;
  clinicLocation?: string;
  location?: string;
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 3) return { label: "Moderate", color: "bg-yellow-500", width: "66%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "DOCTOR" | null>(null);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});

  // Form states
  const [loginData, setLoginData] = useState({
    data: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    specialty: "",
    clinicLocation: "",
    location: "",
  });

  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const passwordStrength = useMemo(() => getPasswordStrength(signupData.password), [signupData.password]);

  const clearLoginError = (field: keyof LoginErrors) => {
    if (loginErrors[field]) setLoginErrors((p) => ({ ...p, [field]: undefined }));
  };

  const clearSignupError = (field: keyof SignupErrors) => {
    if (signupErrors[field]) setSignupErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validateLogin = (): boolean => {
    const errors: LoginErrors = {};
    if (!loginData.data.trim()) errors.data = "Email or username is required";
    else if (loginData.data.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.data))
      errors.data = "Invalid email format";
    if (!loginData.password) errors.password = "Password is required";
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignup = (): boolean => {
    const errors: SignupErrors = {};
    if (!signupData.firstName.trim()) errors.firstName = "First name is required";
    if (!signupData.lastName.trim()) errors.lastName = "Last name is required";
    if (!signupData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) errors.email = "Invalid email format";
    if (!signupData.password) errors.password = "Password is required";
    else if (signupData.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!signupData.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (signupData.password !== signupData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!selectedRole) errors.role = "Please select a role";
    if (selectedRole === "DOCTOR") {
      if (!signupData.specialty) errors.specialty = "Specialty is required";
      if (!signupData.clinicLocation.trim()) errors.clinicLocation = "Clinic location is required";
    }
    if (selectedRole === "PATIENT") {
      if (!signupData.location.trim()) errors.location = "Location is required";
    }
    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/login`,
        loginData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setUser(response.data.data);
        toast.success("Login successful!");

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
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        if (data?.errors && typeof data.errors === "object") {
          const be: LoginErrors = {};
          if (data.errors.data || data.errors.email) be.data = data.errors.data || data.errors.email;
          if (data.errors.password) be.password = data.errors.password;
          if (Object.keys(be).length > 0) setLoginErrors(be);
        }
        toast.error(data?.message || "Login failed");
      } else {
        toast.error("Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    setIsLoading(true);
    try {
      const payload = {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        password: signupData.password,
        role: selectedRole,
        ...(selectedRole === "DOCTOR" && {
          specialty: signupData.specialty,
          clinicLocation: signupData.clinicLocation,
        }),
        ...(selectedRole === "PATIENT" && {
          location: signupData.location,
        }),
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/signup`,
        payload
      );

      if (response.data.success) {
        toast.success("Signup successful! Please login.");
        setIsLogin(true);
        setSignupData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
          specialty: "",
          clinicLocation: "",
          location: "",
        });
        setSelectedRole(null);
        setSignupErrors({});
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        if (data?.errors && typeof data.errors === "object") {
          const be: SignupErrors = {};
          for (const key of Object.keys(data.errors)) {
            if (["firstName", "lastName", "email", "password", "confirmPassword", "specialty", "clinicLocation", "location", "role"].includes(key)) {
              (be as any)[key] = data.errors[key];
            }
          }
          if (Object.keys(be).length > 0) setSignupErrors(be);
        }
        toast.error(data?.message || "Signup failed");
      } else {
        toast.error("Signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: "PATIENT" | "DOCTOR") => {
    setSelectedRole(role);
    setSignupData(prev => ({ ...prev, role }));
    clearSignupError("role");
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
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="login-data">Email or Username</Label>
                    <Input
                      id="login-data"
                      type="text"
                      value={loginData.data}
                      onChange={(e) => { setLoginData(prev => ({ ...prev, data: e.target.value })); clearLoginError("data"); }}
                      placeholder="Enter your email or username"
                      required
                    />
                    {loginErrors.data && <p className="text-sm text-red-500 mt-1">{loginErrors.data}</p>}
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => { setLoginData(prev => ({ ...prev, password: e.target.value })); clearLoginError("password"); }}
                        placeholder="Enter your password"
                        required
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
                    {loginErrors.password && <p className="text-sm text-red-500 mt-1">{loginErrors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6">
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
                    {signupErrors.role && <p className="text-sm text-red-500 mt-1">{signupErrors.role}</p>}
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={signupData.firstName}
                        onChange={(e) => { setSignupData(prev => ({ ...prev, firstName: e.target.value })); clearSignupError("firstName"); }}
                        placeholder="John"
                        required
                      />
                      {signupErrors.firstName && <p className="text-sm text-red-500 mt-1">{signupErrors.firstName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={signupData.lastName}
                        onChange={(e) => { setSignupData(prev => ({ ...prev, lastName: e.target.value })); clearSignupError("lastName"); }}
                        placeholder="Doe"
                        required
                      />
                      {signupErrors.lastName && <p className="text-sm text-red-500 mt-1">{signupErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => { setSignupData(prev => ({ ...prev, email: e.target.value })); clearSignupError("email"); }}
                      placeholder="john@example.com"
                      required
                    />
                    {signupErrors.email && <p className="text-sm text-red-500 mt-1">{signupErrors.email}</p>}
                  </div>

                  {/* Doctor-specific fields */}
                  {selectedRole === "DOCTOR" && (
                    <>
                      <div>
                        <Label htmlFor="specialty">Specialty</Label>
                        <Select
                          value={signupData.specialty}
                          onValueChange={(value) => { setSignupData(prev => ({ ...prev, specialty: value })); clearSignupError("specialty"); }}
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
                        {signupErrors.specialty && <p className="text-sm text-red-500 mt-1">{signupErrors.specialty}</p>}
                      </div>

                      <div>
                        <Label htmlFor="clinicLocation">Clinic Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="clinicLocation"
                            value={signupData.clinicLocation}
                            onChange={(e) => { setSignupData(prev => ({ ...prev, clinicLocation: e.target.value })); clearSignupError("clinicLocation"); }}
                            placeholder="City, State, Country"
                            className="pl-10"
                            required
                          />
                        </div>
                        {signupErrors.clinicLocation && <p className="text-sm text-red-500 mt-1">{signupErrors.clinicLocation}</p>}
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
                          value={signupData.location}
                          onChange={(e) => { setSignupData(prev => ({ ...prev, location: e.target.value })); clearSignupError("location"); }}
                          placeholder="City, State, Country"
                          className="pl-10"
                          required
                        />
                      </div>
                      {signupErrors.location && <p className="text-sm text-red-500 mt-1">{signupErrors.location}</p>}
                    </div>
                  )}

                  {/* Password fields */}
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => { setSignupData(prev => ({ ...prev, password: e.target.value })); clearSignupError("password"); }}
                        placeholder="Create a password"
                        required
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
                    {signupData.password && (
                      <div className="space-y-1 mt-2">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        <p className={`text-xs ${passwordStrength.color.replace("bg-", "text-")}`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                    {signupErrors.password && <p className="text-sm text-red-500 mt-1">{signupErrors.password}</p>}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => { setSignupData(prev => ({ ...prev, confirmPassword: e.target.value })); clearSignupError("confirmPassword"); }}
                      placeholder="Confirm your password"
                      required
                    />
                    {signupErrors.confirmPassword && <p className="text-sm text-red-500 mt-1">{signupErrors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !selectedRole}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
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
