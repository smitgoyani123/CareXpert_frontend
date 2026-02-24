import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Search,
  MapPin,
  Clock,
  Filter,
  Heart,
  Video,
  User,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/store/authstore";
import EmptyState from "@/components/EmptyState";

/* ================= TYPES ================= */

type FindDoctors = {
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

type FindDoctorsApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: FindDoctors[];
};

type AppointmentBookingData = {
  doctorId: string;
  date: string;
  time: string;
  appointmentType: "ONLINE" | "OFFLINE";
  notes?: string;
};

/* ================= COMPONENT ================= */

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [doctors, setDoctors] = useState<FindDoctors[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] =
    useState<FindDoctors | null>(null);
  const [bookingData, setBookingData] = useState<AppointmentBookingData>({
    doctorId: "",
    date: "",
    time: "",
    appointmentType: "OFFLINE",
    notes: "",
  });
  const [isBooking, setIsBooking] = useState(false);

  const user = useAuthStore((state) => state.user);
  const url = `${import.meta.env.VITE_BASE_URL}/api/patient`;

  /* ================= EFFECTS ================= */

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get<FindDoctorsApiResponse>(
          `${url}/fetchAllDoctors`,
          {
            params: { search: debouncedSearch },
            withCredentials: true,
          }
        );

        if (res.data.success) {
          setDoctors(res.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Something went wrong");
        } else {
          toast.error("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [debouncedSearch, url]);

  /* ================= FILTERS ================= */

  const specialties = [
    "Cardiology",
    "Dermatology",
    "General Medicine",
    "Neurology",
    "Pediatrics",
    "Psychiatry",
    "Orthopedics",
    "Gynecology",
  ];

  const locations = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Boston, MA",
    "Miami, FL",
    "Seattle, WA",
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSpecialty =
      selectedSpecialty === "all" || doctor.specialty === selectedSpecialty;
    const matchesLocation =
      selectedLocation === "all" || doctor.clinicLocation === selectedLocation;
    return matchesSpecialty && matchesLocation;
  });

  /* ================= ACTIONS ================= */

  const openBookingDialog = (doctor: FindDoctors) => {
    if (!user || user.role !== "PATIENT") {
      toast.error("Please login as a patient to book appointments");
      return;
    }
    setSelectedDoctor(doctor);
    setBookingData({
      doctorId: doctor.id,
      date: "",
      time: "",
      appointmentType: "OFFLINE",
      notes: "",
    });
    setIsBookingDialogOpen(true);
  };

  const closeBookingDialog = () => {
    setIsBookingDialogOpen(false);
    setSelectedDoctor(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.date || !bookingData.time) {
      toast.error("Please select both date and time");
      return;
    }

    setIsBooking(true);
    try {
      const res = await axios.post(
        `${url}/book-direct-appointment`,
        bookingData,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Appointment booked successfully!");
        closeBookingDialog();
      }
    } catch (err) {
      toast.error("Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let h = 9; h <= 17; h++) {
      for (let m = 0; m < 60; m += 30) {
        slots.push(
          `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}`
        );
      }
    }
    return slots;
  };

  /* ================= UI ================= */

  return (
    <div className="p-6 md:p-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Find Your Doctor</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with certified healthcare professionals
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6 grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4" />
              )}
            </div>

            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {specialties.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button>
              <Filter className="h-4 w-4 mr-2" /> Apply
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            title="No Doctors Found"
            description="Try adjusting your filters"
            icon={<Stethoscope />}
          />
        ) : (
          <div className="grid gap-6">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id}>
                <CardContent className="p-6 grid lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 flex gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={doctor.user.profilePicture} />
                      <AvatarFallback>
                        {doctor.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {doctor.user.name}
                      </h3>
                      <p className="text-blue-600">{doctor.specialty}</p>
                      <p className="text-sm">{doctor.clinicLocation}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col justify-between">
                    <p className="text-2xl font-bold">
                      ${doctor.consultationFee}
                    </p>
                    <Button onClick={() => openBookingDialog(doctor)}>
                      <Heart className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>

          {selectedDoctor && (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <Input
                type="date"
                value={bookingData.date}
                onChange={(e) =>
                  setBookingData({ ...bookingData, date: e.target.value })
                }
              />
              <Select
                value={bookingData.time}
                onValueChange={(v) =>
                  setBookingData({ ...bookingData, time: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DialogFooter>
                <Button variant="outline" onClick={closeBookingDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isBooking}>
                  {isBooking ? "Booking..." : "Book"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}