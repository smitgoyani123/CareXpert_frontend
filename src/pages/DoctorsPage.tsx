import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Search,
  Filter,
  Heart,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { patientAPI, NormalizedDoctor } from "@/lib/services";
import { api } from "@/lib/api";
import axios from "axios";
import { useAuthStore } from "@/store/authstore";
import EmptyState from "@/components/EmptyState";
import { notify } from "@/lib/toast";

/* ================= TYPES ================= */

type FindDoctors = NormalizedDoctor;


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

  // Booking dialog state
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
  const [bookingError, setBookingError] = useState("");

  const user = useAuthStore((state) => state.user);

  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState("name-asc");
  const [showScrollTop, setShowScrollTop] = useState(false);
  /* ================= EFFECTS ================= */

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch doctors when debounced search changes
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await patientAPI.getAllDoctors();
        if (res.data.success) {
          setDoctors(res.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          notify.error(err.response.data?.message || "Something went wrong");
        } else {
          notify.error("An unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [debouncedSearch]);

  // Sync URL search params to state
  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    const sort = searchParams.get("sort") || "name-asc";
    const specialty = searchParams.get("specialty") || "all";
    const location = searchParams.get("location") || "all";

    setCurrentPage(page);
    setSortBy(sort);
    setSelectedSpecialty(specialty);
    setSelectedLocation(location);
  }, [searchParams]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSpecialty, selectedLocation, debouncedSearch, sortBy]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "fee-asc") return a.consultationFee - b.consultationFee;
    if (sortBy === "fee-desc") return b.consultationFee - a.consultationFee;
    return 0;
  });

  const totalPages = Math.ceil(sortedDoctors.length / itemsPerPage);

  const paginatedDoctors = sortedDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // ...existing code...

  /* ================= ACTIONS ================= */

  const openBookingDialog = (doctor: FindDoctors) => {
    if (!user || user.role !== "PATIENT") {
      notify.error("Please login as a patient to book appointments");
      return;
    }
    setSelectedDoctor(doctor);
    setBookingError("");
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
    if (isBooking) return;

    setBookingError("");

    if (!bookingData.date || !bookingData.time) {
      setBookingError("Please select both date and time.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (bookingData.date < today) {
      setBookingError("You cannot book an appointment in the past.");
      return;
    }

    setIsBooking(true);
    try {
      const res = await api.post(
        `/patient/book-direct-appointment`,
        bookingData
      );

      if (res.data.success) {
        notify.success("Appointment booked successfully!");
        closeBookingDialog();
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setBookingError(
          err.response.data?.message || "Failed to book an appointment"
        );
      } else {
        setBookingError("An unexpected error occurred");
      }
    } finally {
      setIsBooking(false);
    }
  };
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
          <CardContent className="p-6 grid md:grid-cols-5 gap-4">
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A to Z</SelectItem>
                <SelectItem value="name-desc">Name Z to A</SelectItem>
                <SelectItem value="fee-asc">Fee Low to High</SelectItem>
                <SelectItem value="fee-desc">Fee High to Low</SelectItem>
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
        ) : sortedDoctors.length === 0 ? (
          <EmptyState
            title="No Doctors Found"
            description="Try adjusting your filters"
            icon={<Stethoscope />}
          />
        ) : (
          <div className="grid gap-6">
            {paginatedDoctors.map((doctor) => (
              <Card key={doctor.id}>
                <CardContent className="p-6 grid lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 flex gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={doctor.profilePicture} />
                      <AvatarFallback>
                        {doctor.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {doctor.name}
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

            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
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
                disabled={isBooking}
                value={bookingData.date}
                onChange={(e) =>
                  setBookingData({ ...bookingData, date: e.target.value })
                }
              />
              <Select
                value={bookingData.time}
                disabled={isBooking}
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
              {bookingError && (
                <p className="text-sm text-red-500">{bookingError}</p>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeBookingDialog}
                  disabled={isBooking}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isBooking}>
                  {isBooking ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Booking...
                    </span>
                  ) : (
                    "Book"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg z-50"
        >
          ↑
        </Button>
      )}
    </div>
  );
}