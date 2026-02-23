import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { SearchX } from "lucide-react";
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
import { Search, MapPin, Clock, Filter, Heart, Video, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/store/authstore";


type FindDoctors = {
  id: string,
  userId : string,
  specialty: string,
  clinicLocation: string,
  experience: string,
  education : string,
  bio : string,
  languages: string[];
  consultationFee : number,
  user : {
    name: string,
    profilePicture : string
  },
  nextAvailable : string
}

type FindDoctorsApiResponse = {
  statusCode : number,
  message : string,
  success : boolean,
  data : FindDoctors[];
}

type AppointmentBookingData = {
  doctorId: string;
  date: string;
  time: string;
  appointmentType: "ONLINE" | "OFFLINE";
  notes?: string;
};

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [doctors , setDoctors] = useState<FindDoctors[]>([]);
  

  // Booking dialog state
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<FindDoctors | null>(null);
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
//fix2
useEffect(() => {
  setIsSearching(true);

  const timer = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery);
  }, 400);

  return () => clearTimeout(timer);
}, [searchQuery]);
useEffect(() => {
  const fetchDoctors = async () => {
    try {
      const res = await axios.get<FindDoctorsApiResponse>(
        `${url}/fetchAllDoctors`,
        {
          params: { search: debouncedSearchQuery },
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
      setIsSearching(false);
    }
  };

  fetchDoctors();
}, [debouncedSearchQuery]);
  
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
  const matchesSearch =
    doctor.user.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

  const matchesSpecialty =
    selectedSpecialty === "all" || doctor.specialty === selectedSpecialty;

  const matchesLocation =
    selectedLocation === "all" || doctor.clinicLocation === selectedLocation;

  return matchesSearch && matchesSpecialty && matchesLocation;
});

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
    setBookingData({
      doctorId: "",
      date: "",
      time: "",
      appointmentType: "OFFLINE",
      notes: "",
    });
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
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || "Failed to book an appointment");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsBooking(false);
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

  return (
    <div className="p-6 md:p-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Doctor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with certified healthcare professionals and book
            appointments with ease
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctors or specialties..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  className="pl-10 pr-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
              </div>

              <Select
                value={selectedSpecialty}
                onValueChange={setSelectedSpecialty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button className="bg-blue-600 hover:bg-blue-700">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
       
        <div className="mb-6 flex items-center justify-between">
  <p className="text-gray-600 dark:text-gray-300">
    Showing {filteredDoctors.length} doctors
  </p>
  {isSearching && (
    <span className="text-sm text-blue-600">
      Searching...
    </span>
  )}
</div>

        {/* Doctor Cards */}
        
          {filteredDoctors.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
      No doctors found
    </h3>
    <p className="text-gray-600 dark:text-gray-300">
      Try adjusting filters or modifying your search.
    </p>
  </div>
) : (
  <div className="grid gap-6">
    {filteredDoctors.map((doctor) => (
      <Card
        key={doctor.id}
        className="overflow-hidden hover:shadow-lg transition-shadow"
      >
        {/* paste your original card content here */}
      </Card>
    ))}
  </div>
)}
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          
          {selectedDoctor && (
            <>
              {/* Doctor Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedDoctor.user.profilePicture || "/placeholder.svg"} />
                  <AvatarFallback>
                    {selectedDoctor.user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedDoctor.user.name}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {selectedDoctor.specialty}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ${selectedDoctor.consultationFee} consultation fee
                  </p>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Select
                      value={bookingData.time}
                      onValueChange={(value: string) => setBookingData(prev => ({ ...prev, time: value }))}
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
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentType">Appointment Type</Label>
                  <Select
                    value={bookingData.appointmentType}
                    onValueChange={(value: "ONLINE" | "OFFLINE") => 
                      setBookingData(prev => ({ ...prev, appointmentType: value }))
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
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeBookingDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isBooking}
                  >
                    {isBooking ? "Booking..." : "Book Appointment"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
