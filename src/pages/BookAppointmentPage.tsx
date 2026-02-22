import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { MapPin, Clock, Star, Video, User } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/store/authstore";

type Doctor = {
  id: string;
  userId: string;
  specialty: string;
  clinicLocation: string;
  experience: string;
  education: string;
  bio: string;
  languages: string[];
  consultationFee: number;
  user: {
    name: string;
    profilePicture: string;
  };
};

type DoctorApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: Doctor;
};

type AppointmentBookingData = {
  doctorId: string;
  date: string;
  time: string;
  appointmentType: "ONLINE" | "OFFLINE";
  notes?: string;
};

export default function BookAppointmentPage() {
  const { id: doctorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  
  const [formData, setFormData] = useState<AppointmentBookingData>({
    doctorId: doctorId || "",
    date: "",
    time: "",
    appointmentType: "OFFLINE",
    notes: "",
  });

  // ── Validation errors state ──
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({});

  const url = `${import.meta.env.VITE_BASE_URL}/api/patient`;

  useEffect(() => {
    if (!user || user.role !== "PATIENT") {
      navigate("/auth/login");
      return;
    }

    const fetchDoctor = async () => {
      try {
        const res = await axios.get<DoctorApiResponse>(
          `${url}/fetchAllDoctors`,
          { withCredentials: true }
        );
        
        if (res.data.success) {
          const foundDoctor = res.data.data;
          if (foundDoctor && foundDoctor.id === doctorId) {
            setDoctor(foundDoctor);
          } else {
            toast.error("Doctor not found");
            navigate("/doctors");
          }
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Failed to fetch doctor details");
        } else {
          toast.error("An unexpected error occurred");
        }
        navigate("/doctors");
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId, user, navigate, url]);

  const handleInputChange = (field: keyof AppointmentBookingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { date?: string; time?: string } = {};
    const today = new Date().toISOString().split("T")[0];

    if (!formData.date) {
      newErrors.date = "Please select an appointment date.";
    } else if (formData.date < today) {
      newErrors.date = "Appointment date cannot be in the past.";
    }

    if (!formData.time) {
      newErrors.time = "Please select an appointment time.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setBooking(true);
    
    try {
      const res = await axios.post(
        `${url}/book-direct-appointment`,
        formData,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Appointment request sent successfully! You will be notified once the doctor responds.");
        navigate("/dashboard/patient");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || "Failed to book appointment");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setBooking(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading doctor details...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">Doctor not found</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Book an Appointment
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Schedule your consultation with {doctor.user.name}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Doctor Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.user.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback>
                        {doctor.user.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{doctor.user.name}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {doctor.specialty}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{doctor.clinicLocation}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{doctor.experience} experience</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-gray-500" />
                    <span>${doctor.consultationFee} consultation fee</span>
                  </div>

                  {doctor.education && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Education:</p>
                      <p className="text-gray-600 dark:text-gray-300">{doctor.education}</p>
                    </div>
                  )}

                  {doctor.bio && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">About:</p>
                      <p className="text-gray-600 dark:text-gray-300">{doctor.bio}</p>
                    </div>
                  )}

                  {doctor.languages.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-2">Languages:</p>
                      <div className="flex flex-wrap gap-1">
                        {doctor.languages.map((lang) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Details</CardTitle>
                  <CardDescription>
                    Fill in the details to send an appointment request to the doctor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => { handleInputChange("date", e.target.value); setErrors((prev) => ({ ...prev, date: undefined })); }}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Select
                          value={formData.time}
                          onValueChange={(value) => { handleInputChange("time", value); setErrors((prev) => ({ ...prev, time: undefined })); }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateTimeSlots().map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="appointmentType">Appointment Type</Label>
                      <Select
                        value={formData.appointmentType}
                        onValueChange={(value: "ONLINE" | "OFFLINE") => 
                          handleInputChange("appointmentType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OFFLINE">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              In-Person
                            </div>
                          </SelectItem>
                          <SelectItem value="ONLINE">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              Video Call
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any specific concerns or symptoms you'd like to discuss..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/doctors")}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={booking}
                        className="flex-1"
                      >
                        {booking ? "Sending Request..." : "Send Appointment Request"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
