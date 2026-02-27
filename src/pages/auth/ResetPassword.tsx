import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { InputWithIcon } from "../../components/ui/input-with-icon";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import * as React from "react";
import { api } from "@/lib/api";
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

const getPasswordStrength = (pwd: string): { label: string; color: string; percentage: number } => {
  const rules = getPasswordRules(pwd);
  const passedRules = rules.filter(r => r.pass).length;
  
  if (passedRules <= 2) return { label: "Weak", color: "bg-red-500", percentage: 33 };
  if (passedRules <= 4) return { label: "Medium", color: "bg-yellow-500", percentage: 66 };
  return { label: "Strong", color: "bg-green-500", percentage: 100 };
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    token?: string;
  }>({});
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const passwordRules = getPasswordRules(password);
  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    if (!token) {
      setErrors({ token: "Invalid or missing reset token" });
      notify.error("Invalid reset link");
    }
  }, [token]);

  useEffect(() => {
    if (resetSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resetSuccess && countdown === 0) {
      navigate("/auth/login");
    }
  }, [resetSuccess, countdown, navigate]);

  const handlePasswordBlur = () => {
    setShowRules(true);
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required." }));
    } else if (!passwordRules.every((r) => r.pass)) {
      setErrors((prev) => ({
        ...prev,
        password: "Password does not meet all requirements below.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Please confirm your password." }));
    } else if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { password?: string; confirmPassword?: string; token?: string } = {};

    if (!token) {
      newErrors.token = "Invalid or missing reset token";
      setErrors(newErrors);
      return;
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (!passwordRules.every((r) => r.pass)) {
      newErrors.password = "Password does not meet all requirements below.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    setShowRules(true);

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const response = await api.post("/user/reset-password", {
        token,
        newPassword: password,
      });

      if (response.data.success) {
        setResetSuccess(true);
        notify.success("Password reset successfully! Redirecting to login...");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to reset password. Please try again.";
      notify.error(errorMessage);
      
      if (errorMessage.includes("token") || errorMessage.includes("expired")) {
        setErrors({ token: errorMessage });
      } else {
        setErrors({ password: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-3 text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Password Reset Successful!
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                Your password has been changed successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redirecting to login in <strong className="text-blue-600 dark:text-blue-400">{countdown}</strong> seconds...
              </p>
              <Button
                onClick={() => navigate("/auth/login")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Go to Login Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (errors.token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-3 text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                {errors.token}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Possible reasons:</strong>
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
                  <li>The link has expired (valid for 30 minutes)</li>
                  <li>The link has already been used</li>
                  <li>The link is malformed or incomplete</li>
                </ul>
              </div>

              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Request New Reset Link
              </Button>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            CareXpert
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new password
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-300">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4 text-gray-400" />}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={handlePasswordBlur}
                    onFocus={() => setShowRules(true)}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}

                {password && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Password Strength:</span>
                      <span className={`font-semibold ${
                        passwordStrength.label === "Weak" ? "text-red-600" :
                        passwordStrength.label === "Medium" ? "text-yellow-600" :
                        "text-green-600"
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${passwordStrength.color} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${passwordStrength.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {showRules && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Password must contain:
                    </p>
                    {passwordRules.map((rule, i) => (
                      <div key={i} className="flex items-center text-xs">
                        <CheckCircle
                          className={`w-4 h-4 mr-2 ${
                            rule.pass
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        />
                        <span
                          className={
                            rule.pass
                              ? "text-green-700 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          }
                        >
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4 text-gray-400" />}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={handleConfirmPasswordBlur}
                    className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
