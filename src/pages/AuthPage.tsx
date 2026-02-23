import { Routes, Route } from "react-router-dom";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import LoginSignup from "./auth/LoginSignup";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-16">
        <Routes>
          <Route path="login" element={<LoginSignup />} />
          <Route path="patient/signup" element={<LoginSignup />} />
          <Route path="doctor/signup" element={<LoginSignup />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
