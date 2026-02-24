<<<<<<< fix/route-protection-and-cleanup
import { Navigate } from "react-router-dom";

// This page is deprecated — use PatientDashboard or DoctorDashboard instead
=======
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 1200);

  return () => clearTimeout(timer);
}, []);
>>>>>>> main
export default function DashboardPage() {
  return <Navigate to="/dashboard/patient" replace />;
}

