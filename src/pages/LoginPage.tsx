import { Navigate } from "react-router-dom";

// This page is deprecated — use AuthPage instead
export default function LoginPage() {
  return <Navigate to="/auth" replace />;
}
