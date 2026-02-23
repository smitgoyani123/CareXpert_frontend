import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Heart, Users, Clock, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/footer";
import { AIChatBox } from "../components/ai-chat-box";
import { SampleCredentials } from "../components/sample-credentials";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      {/* Hero Section with Inline Chat */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Your Health, Our
              <span className="text-blue-600 dark:text-blue-400">
                {" "}
                Priority
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Connect with certified doctors, get AI-powered consultations, and
              manage your health journey with careXpert - the modern healthcare
              platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth/patient/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Book Appointment
                </Button>
              </Link>
              <Link to="/auth/doctor/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl"
                >
                  Join as Doctor
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side - AI Chat Box */}
          <div>
            <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Try CareXpert AI
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Get instant health guidance from our AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIChatBox />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sample Credentials */}
        <SampleCredentials />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose careXpert?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience healthcare like never before with our cutting-edge
            platform designed for modern patients and doctors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group p-6 text-center border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Expert Doctors
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with certified healthcare professionals
              </p>
            </CardContent>
          </Card>

          <Card className="group p-6 text-center border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                24/7 Available
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Round-the-clock healthcare support
              </p>
            </CardContent>
          </Card>
<Card className="group p-6 text-center border-0 bg-purple-100 dark:bg-purple-900/30 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your health data is protected and encrypted
              </p>
            </CardContent>
          </Card>

          <Card className="group p-6 text-center border-0 bg-orange-100 dark:bg-orange-900/30 backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI Powered
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Smart consultations with AI assistance
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
