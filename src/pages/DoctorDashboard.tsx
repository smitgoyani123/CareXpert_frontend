import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Calendar,
  Users,
  MessageCircle,
  FileText,
  Clock,
  Settings,
  Search as _Search,
  Send as _Send,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { api } from "@/lib/api";
import axios from "axios";
import { useAuthStore } from "@/store/authstore";
import { Appointment, BlockedDate } from "@/types";
import { notify } from "@/lib/toast";

type AppointmentApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: Appointment[];
};

type BlockedDatesApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: BlockedDate[];
};

type AuthProfileResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: {
    id: string;
    role: string;
    doctor?: {
      id: string;
      specialty?: string;
      clinicLocation?: string;
    };
  };
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [_selectedTimeSlot, _setSelectedTimeSlot] = useState(""); // Keep this state for future UI
  const [_searchQuery, _setSearchQuery] = useState(""); // Keep this state for future UI

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingApppointments] = useState<
    Appointment[]
  >([]);

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isBlockedDatesLoading, setIsBlockedDatesLoading] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BlockedDate | null>(null);

  const [blockDate, setBlockDate] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const todayLocal = new Date();
  const todayMinDate = new Date(
    todayLocal.getFullYear(),
    todayLocal.getMonth(),
    todayLocal.getDate()
  )
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "DOCTOR")) {
      navigate("/auth/login"); // Use react-router-dom navigate
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const res = await api.get<AppointmentApiResponse>(
          `/doctor/all-appointments`,
          { withCredentials: true }
        );
        if (res.data.success) {
          const allAppointments = res.data.data;
          const now = new Date();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // Filter today's appointments
          const todayApts = allAppointments.filter(apt => {
            const appointmentDate = new Date(apt.date);
            return appointmentDate >= today && appointmentDate < tomorrow;
          });
          
          // Filter upcoming appointments (including today)
          const upcoming = allAppointments.filter(apt => {
            const appointmentDateTime = new Date(`${apt.date}T${apt.time}`);
            return appointmentDateTime >= now;
          });
          
          setTodayAppointments(todayApts);
          setUpcomingApppointments(upcoming);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          notify.error(err.response.data?.message || "Something went wrong");
        } else {
          notify.error("Unknown error occured");
        }
      }
    }

    fetchAppointments();
  }, []);

  useEffect(() => {
    async function fetchDoctorId() {
      try {
        const res = await api.get<AuthProfileResponse>(
          "/user/authenticated-profile",
          { withCredentials: true }
        );
        const docId = res.data?.data?.doctor?.id;
        if (docId) {
          setDoctorId(docId);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          notify.error(err.response.data?.message || "Failed to load profile");
        } else {
          notify.error("Failed to load profile");
        }
      }
    }

    if (user?.role === "DOCTOR") {
      fetchDoctorId();
    }
  }, [user?.role]);

  useEffect(() => {
    async function fetchBlockedDates() {
      if (!doctorId) return;
      setIsBlockedDatesLoading(true);
      try {
        const res = await api.get<BlockedDatesApiResponse>(
          `/doctor/${doctorId}/blocked-dates`,
          { withCredentials: true }
        );
        if (res.data?.success) {
          setBlockedDates(res.data.data || []);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          notify.error(err.response.data?.message || "Failed to load blocked dates");
        } else {
          notify.error("Failed to load blocked dates");
        }
      } finally {
        setIsBlockedDatesLoading(false);
      }
    }

    fetchBlockedDates();
  }, [doctorId]);

  const handleAddBlockedDate = async () => {
    if (!blockDate) {
      notify.error("Please select a date");
      return;
    }

    if (!isFullDay) {
      if (!blockStartTime || !blockEndTime) {
        notify.error("Please provide start and end time");
        return;
      }
    }

    try {
      const payload = {
        date: blockDate,
        isFullDay,
        startTime: isFullDay ? undefined : blockStartTime,
        endTime: isFullDay ? undefined : blockEndTime,
        reason: blockReason || undefined,
      };

      const res = await api.post(`/doctor/block-date`, payload, {
        withCredentials: true,
      });

      if (res.data?.success) {
        notify.success("Blocked date added");
        setBlockDate("");
        setBlockStartTime("");
        setBlockEndTime("");
        setBlockReason("");
        setIsFullDay(true);
        if (doctorId) {
          const refresh = await api.get<BlockedDatesApiResponse>(
            `/doctor/${doctorId}/blocked-dates`,
            { withCredentials: true }
          );
          if (refresh.data?.success) {
            setBlockedDates(refresh.data.data || []);
          }
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        notify.error(err.response.data?.message || "Failed to add blocked date");
      } else {
        notify.error("Failed to add blocked date");
      }
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      const res = await api.delete(`/doctor/block-date/${id}`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setBlockedDates((prev) => prev.filter((block) => block.id !== id));
        notify.success("Blocked date removed");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        notify.error(err.response.data?.message || "Failed to delete blocked date");
      } else {
        notify.error("Failed to delete blocked date");
      }
    }
  };

  const openDeleteDialog = (block: BlockedDate) => {
    setPendingDelete(block);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBlockedDate = async () => {
    if (!pendingDelete) return;
    await handleDeleteBlockedDate(pendingDelete.id);
    setPendingDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // TODO: Implement patient chats and available slots functionality

  return (
    <div className="p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Welcome back, {user?.name || "Doctor"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your practice and help your patients
        </p>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Today's Appointments
                  </p>
                  <p className="text-2xl font-bold dark:text-white">
                    {todayAppointments?.length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Patients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    247
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Unread Messages
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    3
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    89
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs structure with Appointments tab content */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger
              value="appointments"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger
              value="availability"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patients
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Today's Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Today's Appointments
                  </CardTitle>
                  <CardDescription>
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              appointment.patient?.profilePicture || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {appointment.patient?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("") ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {appointment.patient?.name ?? "Unknown"}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(appointment.date).toLocaleDateString("en-US")} at {appointment.time}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={appointment.appointmentType === "ONLINE" ? "secondary" : "default"}>
                              {appointment.appointmentType === "ONLINE" ? "Video Call" : "In-Person"}
                            </Badge>
                            <Badge variant={
                              appointment.status === "PENDING" ? "outline" :
                              appointment.status === "CONFIRMED" ? "default" :
                              appointment.status === "COMPLETED" ? "secondary" : "destructive"
                            }>
                              {appointment.status}
                            </Badge>
                          </div>
                          {appointment.notes && (
                            <Badge className="bg-gray-200 text-black dark:bg-gray-600 dark:text-white/90">
                              {appointment.notes}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge
                          variant={
                            appointment.status === "COMPLETED"
                              ? "default"
                              : appointment.status === "PENDING"
                              ? "secondary"
                              : appointment.status === "CANCELLED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {appointment.status}
                        </Badge>

                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" /> Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              appointment.patient?.profilePicture || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {appointment.patient?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("") ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {appointment.patient?.name ?? "Unknown"}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(appointment.date).toLocaleDateString("en-US")} at {appointment.time}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={appointment.appointmentType === "ONLINE" ? "secondary" : "default"}>
                              {appointment.appointmentType === "ONLINE" ? "Video Call" : "In-Person"}
                            </Badge>
                            <Badge variant={
                              appointment.status === "PENDING" ? "outline" :
                              appointment.status === "CONFIRMED" ? "default" :
                              appointment.status === "COMPLETED" ? "secondary" : "destructive"
                            }>
                              {appointment.status}
                            </Badge>
                          </div>
                          {appointment.notes && (
                            <Badge className="bg-gray-200 text-black dark:bg-gray-600 dark:text-white/90">
                              {appointment.notes}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          appointment.status === "CONFIRMED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Availability Tab Placeholder */}
          <TabsContent value="availability">
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Add Leave (Blocked Date)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Mark your unavailable dates or time ranges.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="block-date">Date</Label>
                        <Input
                          id="block-date"
                          type="date"
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          min={todayMinDate}
                        />
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={isFullDay}
                          onChange={(e) => setIsFullDay(e.target.checked)}
                          className="h-4 w-4"
                        />
                        Full day leave
                      </label>

                      {!isFullDay && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor="block-start">Start time</Label>
                            <Input
                              id="block-start"
                              type="time"
                              value={blockStartTime}
                              onChange={(e) => setBlockStartTime(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="block-end">End time</Label>
                            <Input
                              id="block-end"
                              type="time"
                              value={blockEndTime}
                              onChange={(e) => setBlockEndTime(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label htmlFor="block-reason">Reason (optional)</Label>
                        <Textarea
                          id="block-reason"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder="Personal appointment"
                        />
                      </div>

                      <div>
                        <Button onClick={handleAddBlockedDate}>
                          Add blocked date
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Your blocked dates
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Manage existing leaves or time blocks.
                      </p>
                    </div>

                    {isBlockedDatesLoading ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300">Loading blocked dates...</p>
                    ) : blockedDates.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        No blocked dates yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {blockedDates.map((block) => {
                          const dateLabel = new Date(block.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          });
                          const timeLabel = block.isFullDay
                            ? "Full day"
                            : `${block.startTime ?? ""} - ${block.endTime ?? ""}`;

                          return (
                            <div
                              key={block.id}
                              className="flex items-start justify-between rounded-lg border p-4"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {dateLabel}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {timeLabel}
                                </p>
                                {block.reason && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {block.reason}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(block)}
                              >
                                Delete
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab Placeholder */}
          <TabsContent value="patients">
            <Card>
              <CardContent className="p-6">
                <p>Patients tab content placeholder</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete blocked date?</DialogTitle>
              <DialogDescription>
                This will remove the selected leave. Patients may be able to book
                appointments in that time.
              </DialogDescription>
            </DialogHeader>
            {pendingDelete && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p>
                  Date:{" "}
                  {new Date(pendingDelete.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p>
                  Time:{" "}
                  {pendingDelete.isFullDay
                    ? "Full day"
                    : `${pendingDelete.startTime ?? ""} - ${pendingDelete.endTime ?? ""}`}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={confirmDeleteBlockedDate}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
