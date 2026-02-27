import { useState, useEffect } from "react";
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
  FileText,
  CheckCircle,
  XCircle,
  Mail,
} from "lucide-react";
import { useAuthStore } from "@/store/authstore";
import { api } from "@/lib/api";
import axios from "axios";
import { motion } from "framer-motion";
import { notify } from "@/lib/toast";
import EmptyState from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

type AppointmentRequest = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  appointmentType: "ONLINE" | "OFFLINE";
  date: string;
  time: string;
  notes?: string;
  consultationFee?: number;
  createdAt: string;
  prescriptionId?: string | null;
  patient: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    medicalHistory?: string;
  };
  timeSlot?: {
    id: string;
    startTime: string;
    endTime: string;
    consultationFee?: number;
  };
};

type AppointmentApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: AppointmentRequest[];
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AppointmentRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "all">("requests");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptionForAppointmentId, setPrescriptionForAppointmentId] =
    useState<string | null>(null);
  const [completeAfterPrescription, setCompleteAfterPrescription] =
    useState(false);

  const user = useAuthStore((state) => state.user);
  useEffect(() => {
    if (user?.role === "DOCTOR") {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      // Fetch pending requests
      const pendingResponse = await api.get<AppointmentApiResponse>(
        `/doctor/pending-requests`,
        { withCredentials: true }
      );

      // Fetch all appointments
      const allResponse = await api.get<AppointmentApiResponse>(
        `/doctor/all-appointments`,
        { withCredentials: true }
      );

      if (pendingResponse.data.success) {
        setPendingRequests(pendingResponse.data.data);
      }

      if (allResponse.data.success) {
        setAppointments(allResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      if (axios.isAxiosError(error) && error.response) {
        notify.error(
          error.response.data?.message || "Failed to fetch appointments"
        );
      } else {
        notify.error("Failed to fetch appointments");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      setProcessing(true);
      const response = await api.patch(
        `/doctor/appointment-requests/${appointmentId}/respond`,
        { action: "accept" },
        { withCredentials: true }
      );

      if (response.data.success) {
        notify.success("Appointment accepted successfully!");
        fetchAppointments();
      }
    } catch (error) {
      console.error("Error accepting appointment:", error);
      if (axios.isAxiosError(error) && error.response) {
        notify.error(
          error.response.data?.message || "Failed to accept appointment"
        );
      } else {
        notify.error("Failed to accept appointment");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitPrescription = async () => {
    if (!prescriptionForAppointmentId || !prescriptionText.trim()) {
      notify.error("Please enter prescription");
      return;
    }
    try {
      setProcessing(true);
      const res = await api.post(
        `/doctor/appointments/${prescriptionForAppointmentId}/prescription`,
        { prescriptionText: prescriptionText.trim() },
        { withCredentials: true }
      );
      if (res.data.success) {
        notify.success("Prescription saved");
        // If we initiated from "Mark Completed", mark the appointment as completed now
        if (completeAfterPrescription && prescriptionForAppointmentId) {
          try {
            const completeRes = await api.patch(
              `/doctor/appointments/${prescriptionForAppointmentId}/complete`,
              {},
              { withCredentials: true }
            );
            if (completeRes.data.success) {
              notify.success("Appointment marked as completed");
            }
          } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
              notify.error(
                error.response.data?.message || "Failed to mark as completed"
              );
            } else {
              notify.error("Failed to mark as completed");
            }
          }
        }

        setCompleteAfterPrescription(false);
        setPrescriptionDialogOpen(false);
        setPrescriptionText("");
        setPrescriptionForAppointmentId(null);
        fetchAppointments();
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        notify.error(
          error.response.data?.message || "Failed to save prescription"
        );
      } else {
        notify.error("Failed to save prescription");
      }
    } finally {
      setProcessing(false);
    }
  };

  const canMarkCompleted = (appointment: AppointmentRequest) => {
    if (
      appointment.appointmentType !== "OFFLINE" ||
      appointment.status !== "CONFIRMED"
    )
      return false;
    try {
      const start = new Date(appointment.date);
      const [hh, mm] = appointment.time.split(":");
      start.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
      return start.getTime() <= Date.now();
    } catch {
      return true;
    }
  };

  const handleMarkCompleted = async (appointmentId: string) => {
    // On completion, require prescription first, then complete
    setPrescriptionForAppointmentId(appointmentId);
    setCompleteAfterPrescription(true);
    setPrescriptionDialogOpen(true);
  };

  const handleRejectAppointment = async () => {
    if (!selectedAppointment || !rejectionReason.trim()) {
      notify.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessing(true);
      const response = await api.patch(
        `/doctor/appointment-requests/${selectedAppointment.id}/respond`,
        {
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        notify.success("Appointment request rejected");
        setRejectDialogOpen(false);
        setRejectionReason("");
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh the list
      }
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      if (axios.isAxiosError(error) && error.response) {
        notify.error(
          error.response.data?.message || "Failed to reject appointment"
        );
      } else {
        notify.error("Failed to reject appointment");
      }
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const base =
      "backdrop-blur-sm rounded-full px-2.5 py-1 border shadow-sm text-xs font-medium";
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: {
        label: "Pending",
        cls: "bg-gradient-to-r from-amber-400/15 to-yellow-500/15 text-amber-700 dark:text-amber-200 border-amber-400/30",
      },
      CONFIRMED: {
        label: "Confirmed",
        cls: "bg-gradient-to-r from-emerald-400/15 to-teal-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-400/30",
      },
      COMPLETED: {
        label: "Completed",
        cls: "bg-gradient-to-r from-sky-400/15 to-indigo-500/15 text-sky-700 dark:text-sky-200 border-sky-400/30",
      },
      CANCELLED: {
        label: "Cancelled",
        cls: "bg-gradient-to-r from-rose-400/15 to-red-500/15 text-rose-700 dark:text-rose-200 border-rose-400/30",
      },
      REJECTED: {
        label: "Rejected",
        cls: "bg-gradient-to-r from-rose-400/15 to-red-500/15 text-rose-700 dark:text-rose-200 border-rose-400/30",
      },
    };

    const cfg = map[status] || map["PENDING"];
    return (
      <Badge variant="outline" className={`${base} ${cfg.cls}`}>
        {cfg.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Appointment Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your appointment requests and view all appointments
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "requests"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "all"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
          >
            All Appointments ({appointments.length})
          </button>
        </div>
      </div>

      {/* Pending Requests Tab */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pending Appointment Requests
            </h2>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              {pendingRequests.length} requests
            </Badge>
          </div>

          {pendingRequests.length === 0 ? (
            <EmptyState
              title="No Pending Requests"
              description="You don't have any pending appointment requests at the moment. New requests from patients will appear here."
              icon={<Calendar className="h-8 w-8" />}
              ctaLabel="Refresh"
              onCtaClick={fetchAppointments}
            />
          ) : (
            <div className="grid gap-6">
              {pendingRequests.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={appointment.patient.profilePicture}
                            />
                            <AvatarFallback>
                              {appointment.patient.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {appointment.patient.name}
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{appointment.patient.email}</span>
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(appointment.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(appointment.time)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {appointment.appointmentType}
                          </span>
                        </div>
                        {appointment.consultationFee && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              ₹{appointment.consultationFee}
                            </span>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Patient Notes:
                          </Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {appointment.notes}
                          </p>
                        </div>
                      )}

                      {appointment.patient.medicalHistory && (
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Medical History:
                          </Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {appointment.patient.medicalHistory}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <Button
                          onClick={() =>
                            handleAcceptAppointment(appointment.id)
                          }
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Dialog
                          open={rejectDialogOpen}
                          onOpenChange={setRejectDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                setSelectedAppointment(appointment)
                              }
                              disabled={processing}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Reject Appointment Request
                              </DialogTitle>
                              <DialogDescription>
                                Please provide a reason for rejecting this
                                appointment request. The patient will be
                                notified with your feedback.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="rejection-reason">
                                  Reason for rejection
                                </Label>
                                <Textarea
                                  id="rejection-reason"
                                  placeholder="e.g., Time slot not available, suggest alternative time..."
                                  value={rejectionReason}
                                  onChange={(e) =>
                                    setRejectionReason(e.target.value)
                                  }
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRejectDialogOpen(false);
                                  setRejectionReason("");
                                  setSelectedAppointment(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleRejectAppointment}
                                disabled={processing || !rejectionReason.trim()}
                              >
                                {processing ? "Rejecting..." : "Reject Request"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Appointments Tab */}
      {activeTab === "all" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Appointments
            </h2>
            <Badge variant="secondary">{appointments.length} total</Badge>
          </div>

          {appointments.length === 0 ? (
            <EmptyState
              title="No Appointments Scheduled"
              description="You don't have any appointments yet. Once patients book appointments with you, they will appear here."
              icon={<Calendar className="h-8 w-8" />}
              ctaLabel="View Pending Requests"
              onCtaClick={() => setActiveTab("requests")}
            />
          ) : (
            <div className="space-y-6">
              {appointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={appointment.patient.profilePicture}
                            />
                            <AvatarFallback>
                              {appointment.patient.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {appointment.patient.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {appointment.patient.email}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatDate(appointment.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatTime(appointment.time)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {appointment.appointmentType}
                          </span>
                        </div>
                        {appointment.consultationFee && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              ₹{appointment.consultationFee}
                            </span>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {appointment.status === "CONFIRMED" && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setPrescriptionForAppointmentId(appointment.id);
                              setPrescriptionDialogOpen(true);
                            }}
                            disabled={processing}
                          >
                            Upload Prescription
                          </Button>
                        )}
                        {appointment.prescriptionId && (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              window.open(
                                `/patient/prescription-pdf/${appointment.prescriptionId}`,
                                "_blank"
                              )
                            }
                          >
                            View Prescription
                          </Button>
                        )}
                        {canMarkCompleted(appointment) && (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleMarkCompleted(appointment.id)}
                            disabled={processing}
                          >
                            Mark as Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prescription Dialog */}
      <Dialog
        open={prescriptionDialogOpen}
        onOpenChange={setPrescriptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Prescription</DialogTitle>
            <DialogDescription>
              Add prescription details for this appointment. Patients will be
              able to view it as a PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prescription-text">Prescription</Label>
              <Textarea
                id="prescription-text"
                placeholder="Medication, dosage, instructions..."
                value={prescriptionText}
                onChange={(e) => setPrescriptionText(e.target.value)}
                className="mt-1"
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPrescriptionDialogOpen(false);
                setPrescriptionText("");
                setPrescriptionForAppointmentId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPrescription}
              disabled={processing || !prescriptionText.trim()}
            >
              {processing ? "Saving..." : "Save Prescription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
