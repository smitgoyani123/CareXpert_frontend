import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Mail, Lock, Eye, EyeOff, Heart, Loader2 } from "lucide-react";
import { InputWithIcon } from "../../components/ui/input-with-icon";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as React from "react";
import { useAuthStore } from "@/store/authstore";
import { notify } from "@/lib/toast"; 

const getPasswordRules = (pwd: string) => [
  { label: "At least 8 characters", pass: pwd.length >= 8 },
  { label: "At least one uppercase letter (A-Z)", pass: /[A-Z]/.test(pwd) },
  { label: "At least one lowercase letter (a-z)", pass: /[a-z]/.test(pwd) },
  { label: "At least one number (0-9)", pass: /[0-9]/.test(pwd) },
  {
    label: "At least one special character (!@#$%^&*)",
    pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  },
];

const emailRegex =
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  const passwordRules = getPasswordRules(password);

  const handleEmailBlur = () => {
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required." }));
    } else if (!emailRegex.test(email.trim())) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter a valid email (e.g. name@example.com).",
      }));
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordBlur = () => {
    setShowRules(true);
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required." }));
    } else if (!getPasswordRules(password).every((r) => r.pass)) {
      setErrors((prev) => ({
        ...prev,
        password: "Password does not meet all requirements below.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};
    const rules = getPasswordRules(password);

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email =
        "Enter a valid email (e.g. name@example.com).";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (!rules.every((r) => r.pass)) {
      newErrors.password =
        "Password does not meet all requirements below.";
    }

    setErrors(newErrors);
    setShowRules(true);

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await useAuthStore.getState().login(email, password);

      notify.success("Login successful"); // ✅ SUCCESS TOAST

      const user = useAuthStore.getState().user;
      if (user) {
        if (user.role === "PATIENT") {
          navigate("/dashboard/patient");
        } else if (user.role === "DOCTOR") {
          navigate("/dashboard/doctor");
        } else if (user.role === "ADMIN") {
          navigate("/admin");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        notify.error(err.message); // ✅ ERROR TOAST
      } else {
        notify.error("Unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Sign in to your careXpert account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* EMAIL FIELD — unchanged */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <InputWithIcon
                id="email"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    email: undefined,
                  }));
                }}
                onBlur={handleEmailBlur}
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                className={
                  errors.email
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  &#x2717; {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD FIELD — unchanged */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <InputWithIcon
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setShowRules(true);
                    setErrors((prev) => ({
                      ...prev,
                      password: undefined,
                    }));
                  }}
                  onBlur={handlePasswordBlur}
                  icon={<Lock className="h-4 w-4 text-gray-400" />}
                  className={
                    errors.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
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
                <p className="text-xs text-red-500 mt-1">
                  &#x2717; {errors.password}
                </p>
              )}

              {showRules && (
                <ul className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                  {passwordRules.map((rule) => (
                    <li
                      key={rule.label}
                      className={`text-xs flex items-center gap-1 ${
                        rule.pass
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      <span className="font-bold">
                        {rule.pass ? "✓" : "✗"}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/auth/patient/signup"
              className="font-medium text-blue-600 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}