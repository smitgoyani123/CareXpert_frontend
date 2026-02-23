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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authstore";
import { relativeTime } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";

type PendingRequest = {
  id: string;
  status: string;
  appointmentType: string;
  date: string;
  time: string;
  notes?: string;
  consultationFee?: number;
  createdAt: string;
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

export default function DoctorPendingRequestsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [alternativeSlots, setAlternativeSlots] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const url = `${import.meta.env.VITE_BASE_URL}/api/doctor`;

  useEffect(() => {
    if (!user || user.role !== "DOCTOR") {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${url}/pending-requests`, { withCredentials: true });
      if (res.data.success) {
        setPendingRequests(res.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || "Failed to fetch pending requests");
      } else {
        toast.error("Unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (request: PendingRequest, actionType: "accept" | "reject") => {
    setSelectedRequest(request);
    setAction(actionType);
    setIsDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedRequest || !action) return;

    try {
      setIsProcessing(true);
      const payload: any = { action };
      
      if (action === "reject") {
        payload.rejectionReason = rejectionReason;
        if (alternativeSlots.trim()) {
          payload.alternativeSlots = alternativeSlots.split(",").map(slot => slot.trim());
        }
      }

      const res = await axios.patch(
        `${url}/appointment-requests/${selectedRequest.id}/respond`,
        payload,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Appointment request ${action}ed successfully`);
        await fetchPendingRequests(); // Refresh the list
        setIsDialogOpen(false);
        setSelectedRequest(null);
        setAction(null);
        setRejectionReason("");
        setAlternativeSlots("");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || "Failed to process request");
      } else {
        toast.error("Unknown error occurred");
      }
    } finally {
      setIsProcessing(false);
    }
  };

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
              Pending Appointment Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Review and respond to patient appointment requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {pendingRequests.length} Pending
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Pending Requests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {pendingRequests.length > 0 ? (
          <div className="space-y-6">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={request.patient.profilePicture || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {request.patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{request.patient.name}</CardTitle>
                          <CardDescription>{request.patient.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {request.appointmentType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {relativeTime(request.createdAt)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Appointment Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4" />
                          <span>Date: {new Date(request.date).toLocaleDateString("en-US", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock className="h-4 w-4" />
                          <span>Time: {request.time}</span>
                        </div>
                        {request.consultationFee && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span>Fee: ₹{request.consultationFee}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {request.patient.medicalHistory && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                              Medical History
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {request.patient.medicalHistory}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Patient Notes
                        </h4>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {request.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleActionClick(request, "accept")}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Request
                      </Button>
                      <Button
                        onClick={() => handleActionClick(request, "reject")}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Pending Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              You don't have any pending appointment requests at the moment. 
              New requests will appear here when patients book appointments.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {action === "accept" ? "Accept Appointment Request" : "Reject Appointment Request"}
            </DialogTitle>
            <DialogDescription>
              {action === "accept" 
                ? "Are you sure you want to accept this appointment request? The patient will be notified."
                : "Please provide a reason for rejecting this appointment request. You can also suggest alternative time slots."
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedRequest.patient.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {new Date(selectedRequest.date).toLocaleDateString()} at {selectedRequest.time}
                </p>
              </div>

              {action === "reject" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="rejectionReason">Reason for rejection (optional)</Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="e.g., Time slot not available, schedule conflict..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alternativeSlots">Alternative time slots (optional)</Label>
                    <Textarea
                      id="alternativeSlots"
                      placeholder="e.g., Tomorrow 2:00 PM, Friday 10:00 AM"
                      value={alternativeSlots}
                      onChange={(e) => setAlternativeSlots(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={isProcessing}
              className={action === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isProcessing ? "Processing..." : action === "accept" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
