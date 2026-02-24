/**
 * BookAppointmentPage.tsx - Refactored to use react-hook-form with Zod validation
 * 
 * Changes made (Issue #25):
 * 1. Replaced useState for formData with useForm hook from react-hook-form
 * 2. Added Zod schema (appointmentSchema) for type-safe validation
 * 3. Removed manual handleInputChange - now using register() and setValue()
 * 4. Added inline error messages for validation
 * 5. Centralized validation in Zod schema instead of manual checks
 * 6. Used zodResolver to connect Zod schema with react-hook-form
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

/**
 * Zod Schema for Appointment Booking Form
 * - doctorId: required string
 * - date: required, must be a valid date string
 * - time: required, must be selected
 * - appointmentType: enum of ONLINE or OFFLINE
 * - notes: optional string
 */
const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  appointmentType: z.enum(["ONLINE", "OFFLINE"], {
    errorMap: () => ({ message: "Please select appointment type" }),
  }),
  notes: z.string().optional(),
});

// Type inference from Zod schema
type AppointmentFormData = z.infer<typeof appointmentSchema>;

// Type for Doctor data from API
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

export default function BookAppointmentPage() {
  const { id: doctorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  // UI state - kept as useState since these are not form data
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  /**
   * Appointment Form - using react-hook-form with Zod resolver
   * Benefits:
   * - No manual state management for form fields
   * - Automatic validation on submit
   * - Type-safe form data inferred from Zod schema
   */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorId: doctorId || "",
      date: "",
      time: "",
      appointmentType: "OFFLINE",
      notes: "",
    },
  });

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

  /**
   * Handle form submission - simplified with react-hook-form
   * Validation is handled automatically by zodResolver
   * No need for manual checks like "if (!formData.date || !formData.time)"
   */
  const onSubmit = async (data: AppointmentFormData) => {
    setBooking(true);
    
    try {
      const res = await axios.post(
        `${url}/book-direct-appointment`,
        data,
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
                  {/* Form using react-hook-form's handleSubmit */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Hidden field to register doctorId so it's included in form submission */}
                    <input type="hidden" {...register("doctorId")} />
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Date field - using register() */}
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          {...register("date")}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {/* Display validation error from Zod schema */}
                        {errors.date && (
                          <p className="text-sm text-red-500">{errors.date.message}</p>
                        )}
                      </div>

                      {/* Time field - using setValue and watch for Select component */}
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Select
                          value={watch("time")}
                          onValueChange={(value) => setValue("time", value, { shouldValidate: true, shouldDirty: true })}
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
                        {/* Display validation error from Zod schema */}
                        {errors.time && (
                          <p className="text-sm text-red-500">{errors.time.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Appointment Type - using setValue and watch for Select component */}
                    <div className="space-y-2">
                      <Label htmlFor="appointmentType">Appointment Type</Label>
                      <Select
                        value={watch("appointmentType")}
                        onValueChange={(value: "ONLINE" | "OFFLINE") => 
                          setValue("appointmentType", value, { shouldValidate: true, shouldDirty: true })
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
                      {/* Display validation error from Zod schema */}
                      {errors.appointmentType && (
                        <p className="text-sm text-red-500">{errors.appointmentType.message}</p>
                      )}
                    </div>

                    {/* Notes field - using register() */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any specific concerns or symptoms you'd like to discuss..."
                        {...register("notes")}
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
