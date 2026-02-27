import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Calendar,
  Clock,
  MessageCircle,
  FileText,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/authstore";
import { api } from "@/lib/api";
import axios from "axios";
import { motion } from "framer-motion";
import { notify } from "@/lib/toast";

type Appointment = {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  appointmentType: 'ONLINE' | 'OFFLINE';
  date: string;
  time: string;
  notes?: string;
  consultationFee?: number;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    profilePicture?: string;
    specialty: string;
    clinicLocation: string;
    experience: string;
    education?: string;
    bio?: string;
    languages: string[];
  };
}

type AppointmentApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: Appointment[];
}

export default function AppointmentManagementPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!user || user.role !== "PATIENT") {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        setIsLoading(true);
        const res = await api.get<AppointmentApiResponse>(`/patient/all-appointments`, { withCredentials: true });
        if (res.data.success) {
          const allAppointments = res.data.data;
          const now = new Date();
          
          
          function parseAppointmentDateTime(dateStr: string, timeStr: string) {
            // If dateStr already contains 'T', assume it's ISO and just return new Date(dateStr)
            if (dateStr.includes('T')) {
              return new Date(dateStr);
            }
            // Otherwise, combine date and time as local time
            // e.g. "2025-09-14" + "12:30" => "2025-09-14T12:30"
            // This will be interpreted as local time by JS Date
            return new Date(`${dateStr}T${timeStr}`);
          }

          // Separate upcoming and past appointments
          const upcoming = allAppointments.filter(apt => {
            const appointmentDateTime = parseAppointmentDateTime(apt.date, apt.time);
            return appointmentDateTime >= now;
          });

          const past = allAppointments.filter(apt => {
            const appointmentDateTime = parseAppointmentDateTime(apt.date, apt.time);
            return appointmentDateTime < now;
          });
          
          setUpcomingAppointments(upcoming);
          setPastAppointments(past);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          notify.error(err.response.data.message);
        } else {
          notify.error("Unknown error occurred..");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  useEffect(() => {
    console.log(upcomingAppointments);
  }, [upcomingAppointments]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Appointments
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Manage your upcoming and past appointments
            </p>
          </div>
          <Button 
            onClick={() => navigate("/doctors")}
            className="bg-blue-600 hover:bg-blue-700 dark:text-white "
          >
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Upcoming Appointments
                <Badge variant="secondary" className="ml-2">
                  {upcomingAppointments.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Your scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={appointment.doctor.profilePicture || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {appointment.doctor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {appointment.doctor.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {appointment.doctor.specialty}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(appointment.date).toLocaleDateString("en-US")} at {appointment.time}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={appointment.appointmentType === "ONLINE" ? "secondary" : "default"}>
                            {appointment.appointmentType === "ONLINE" ? "Video Call" : "In-Person"}
                          </Badge>
                          <Badge variant={
                            appointment.status === "PENDING" ? "outline" :
                            appointment.status === "CONFIRMED" ? "default" :
                            appointment.status === "COMPLETED" ? "secondary" :
                            appointment.status === "REJECTED" ? "destructive" : "secondary"
                          }>
                            {appointment.status === "PENDING" ? "Request Sent" : appointment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {appointment.appointmentType === "ONLINE" && appointment.status === "CONFIRMED" && (
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Join Call
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No upcoming appointments
                  </p>
                  <Button 
                    onClick={() => navigate("/doctors")}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Book an Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Past Appointments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Past Appointments
                <Badge variant="secondary" className="ml-2">
                  {pastAppointments.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Your completed appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastAppointments.length > 0 ? (
                pastAppointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={appointment.doctor.profilePicture || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {appointment.doctor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {appointment.doctor.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {appointment.doctor.specialty}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(appointment.date).toLocaleDateString("en-US")} at {appointment.time}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={appointment.appointmentType === "ONLINE" ? "secondary" : "default"}>
                            {appointment.appointmentType === "ONLINE" ? "Video Call" : "In-Person"}
                          </Badge>
                          <Badge variant={
                            appointment.status === "PENDING" ? "outline" :
                            appointment.status === "CONFIRMED" ? "default" :
                            appointment.status === "COMPLETED" ? "secondary" :
                            appointment.status === "REJECTED" ? "destructive" : "secondary"
                          }>
                            {appointment.status === "PENDING" ? "Request Sent" : appointment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" />
                        View Report
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Feedback
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No past appointments
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
