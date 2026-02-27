import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Pill, Calendar, Download, Mail, User } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { useAuthStore } from "@/store/authstore";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import EmptyState from "@/components/EmptyState";

type DoctorPrescription = {
  id: string;
  date: string;
  prescriptionText: string;
  patientName: string;
  patientEmail: string;
};

type PrescriptionApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: DoctorPrescription[];
};

export default function DoctorPrescriptionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiBase = useMemo(() => {
    return (api.defaults.baseURL || "/api").replace(/\/+$/, "");
  }, []);

  useEffect(() => {
    if (!user || user.role !== "DOCTOR") {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        setIsLoading(true);
        const res = await api.get<PrescriptionApiResponse>(
          "/doctor/prescriptions",
          { withCredentials: true }
        );
        if (res.data.success) {
          setPrescriptions(res.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Failed to load prescriptions");
        } else {
          toast.error("Failed to load prescriptions");
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.role === "DOCTOR") {
      fetchPrescriptions();
    }
  }, [user]);

  const openPrescriptionPdf = (id: string) => {
    window.open(`${apiBase}/doctor/prescription-pdf/${id}`, "_blank");
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Prescriptions
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              View and download prescriptions you have issued
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {prescriptions.length} Prescriptions
          </Badge>
        </div>
      </motion.div>

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
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Pill className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Prescription #{prescription.id.slice(-8)}
                          </CardTitle>
                          <CardDescription>
                            For {prescription.patientName}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPrescriptionPdf(prescription.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {prescription.patientName}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <Mail className="h-3 w-3" />
                          {prescription.patientEmail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="h-4 w-4" />
                      <span>Issued {relativeTime(prescription.date)}</span>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
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
          <EmptyState
            title="No Prescriptions"
            description="Prescriptions you issue will appear here after completing appointments."
            icon={<Pill className="h-8 w-8" />}
            ctaLabel="View Appointments"
            onCtaClick={() => navigate("/doctor/appointments")}
          />
        )}
      </motion.div>
    </div>
  );
}
