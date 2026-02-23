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
  Pill,
  Calendar,
  Download,
  FileText,
  User,
  MapPin,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/authstore";
import { relativeTime } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Prescription = {
  id: string;
  date: string;
  prescriptionText: string;
  doctorName: string;
  speciality: string;
  clinicLocation: string;
}

type PrescriptionApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: Prescription[];
}

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const url = `${import.meta.env.VITE_BASE_URL}/api/patient`;

  useEffect(() => {
    if (!user || user.role !== "PATIENT") {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        setIsLoading(true);
        const res = await axios.get<PrescriptionApiResponse>(`${url}/view-prescriptions`, { withCredentials: true });
        if (res.data.success) {
          setPrescriptions(res.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Something went wrong");
        } else {
          toast.error("Unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrescriptions();
  }, [url]);

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
              My Prescriptions
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              View and download your medical prescriptions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {prescriptions.length} Prescriptions
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Prescriptions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {prescriptions.length > 0 ? (
          <div className="space-y-6">
            {prescriptions.map((prescription, index) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Pill className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Prescription #{prescription.id.slice(-8)}</CardTitle>
                          <CardDescription>
                            Prescribed by Dr. {prescription.doctorName}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {prescription.speciality}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`${url}/prescription-pdf/${prescription.id}`, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Doctor Information */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Dr. {prescription.doctorName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {prescription.speciality}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {prescription.clinicLocation}
                        </div>
                      </div>
                    </div>

                    {/* Prescription Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="h-4 w-4" />
                        <span>Prescribed: {relativeTime(prescription.date)}</span>
                      </div>
                    </div>

                    {/* Prescription Instructions */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Prescription Instructions
                      </h4>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {prescription.prescriptionText}
                        </p>
                      </div>
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
              <Pill className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Prescriptions Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              You don't have any prescriptions yet. Your prescriptions will appear here after your appointments.
            </p>
            <Button 
              onClick={() => navigate("/doctors")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Book an Appointment
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
