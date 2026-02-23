import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authstore";

export default function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
