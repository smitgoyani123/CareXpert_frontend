import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Calendar, User, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuthStore } from "@/store/authstore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";
import EmptyState from "@/components/EmptyState";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

type AppointmentPatient = {
  id: string;
  name: string;
  email: string;
};

type AppointmentApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: Array<{
    patient: AppointmentPatient;
  }>;
};

type ReportSummary = {
  id: string;
  filename: string;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  summary: string | null;
  abnormalValues: unknown;
  possibleConditions: string[] | null;
  recommendation: string | null;
  disclaimer: string | null;
  createdAt: string;
  status: string;
};

type ReportsApiResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: ReportSummary[];
};

type ReportDetail = ReportSummary & {
  patient: {
    id: string;
    user: { name: string; email: string };
  };
  extractedText?: string | null;
};

type ReportDetailResponse = {
  statusCode: number;
  message: string;
  success: boolean;
  data: ReportDetail;
};

export default function DoctorReportsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<AppointmentPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reportDetail, setReportDetail] = useState<ReportDetail | null>(null);

  useEffect(() => {
    if (!user || user.role !== "DOCTOR") {
      navigate("/auth/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoadingPatients(true);
        const res = await api.get<AppointmentApiResponse>(
          "/doctor/all-appointments",
          { withCredentials: true }
        );
        if (res.data.success) {
          const unique = new Map<string, AppointmentPatient>();
          res.data.data.forEach((item) => {
            if (item.patient?.id) {
              unique.set(item.patient.id, item.patient);
            }
          });
          const patientList = Array.from(unique.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setPatients(patientList);

          const initialId = searchParams.get("patientId");
          if (initialId && unique.has(initialId)) {
            setSelectedPatientId(initialId);
          }
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Failed to load patients");
        } else {
          toast.error("Failed to load patients");
        }
      } finally {
        setLoadingPatients(false);
      }
    }

    if (user?.role === "DOCTOR") {
      fetchPatients();
    }
  }, [user, searchParams]);

  useEffect(() => {
    async function fetchReports(patientId: string) {
      try {
        setLoadingReports(true);
        const res = await api.get<ReportsApiResponse>(
          `/doctor/patient/${patientId}/reports`,
          { withCredentials: true }
        );
        if (res.data.success) {
          setReports(res.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Failed to load reports");
        } else {
          toast.error("Failed to load reports");
        }
      } finally {
        setLoadingReports(false);
      }
    }

    if (selectedPatientId) {
      fetchReports(selectedPatientId);
    } else {
      setReports([]);
    }
  }, [selectedPatientId]);

  const openReportDetail = async (reportId: string) => {
    try {
      setDetailLoading(true);
      setReportDetail(null);
      setDetailOpen(true);
      const res = await api.get<ReportDetailResponse>(
        `/doctor/patient/report/${reportId}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setReportDetail(res.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || "Failed to load report detail");
      } else {
        toast.error("Failed to load report detail");
      }
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatFileSize = (size: number) => {
    if (!size) return "-";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / Math.pow(1024, index);
    return `${value.toFixed(1)} ${units[index]}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const renderAbnormalValues = (values: unknown) => {
    if (!values) return "None reported";
    if (Array.isArray(values)) {
      return values.length ? values.join(", ") : "None reported";
    }
    if (typeof values === "object") {
      try {
        return JSON.stringify(values, null, 2);
      } catch {
        return "See report details";
      }
    }
    return String(values);
  };

  if (loadingPatients) {
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
              Patient Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Review AI-analyzed reports for your patients
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {reports.length} Reports
          </Badge>
        </div>
      </motion.div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Patient
          </CardTitle>
          <CardDescription>
            Choose a patient to view their completed reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <Select
              value={selectedPatientId}
              onValueChange={(value) => setSelectedPatientId(value)}
            >
              <SelectTrigger className="w-full md:w-[420px]">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name} ({patient.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <EmptyState
              title="No patients found"
              description="Once you have appointments, patients will show up here."
              icon={<User className="h-8 w-8" />}
              ctaLabel="View Appointments"
              onCtaClick={() => navigate("/doctor/appointments")}
            />
          )}
        </CardContent>
      </Card>

      {selectedPatientId ? (
        loadingReports ? (
          <div className="flex items-center justify-center min-h-[240px]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-6">
            {reports.map((report, index) => {
              const canOpenFile = /^https?:\/\//.test(report.fileUrl || "");
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {report.filename || `Report ${report.id.slice(-6)}`}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(report.createdAt)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(report.fileSize!)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReportDetail(report.id)}
                          >
                            View Details
                          </Button>
                          {canOpenFile && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(report.fileUrl!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open File
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Summary
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {report.summary || "No summary available."}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Abnormal Values
                          </h5>
                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {renderAbnormalValues(report.abnormalValues)}
                          </pre>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Possible Conditions
                          </h5>
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            {report.possibleConditions?.length
                              ? report.possibleConditions.join(", ")
                              : "None listed"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          Recommendation
                        </h5>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {report.recommendation || "No recommendations yet."}
                        </p>
                      </div>

                      {report.disclaimer && (
                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>{report.disclaimer}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No reports found"
            description="This patient doesn't have any completed reports yet."
            icon={<FileText className="h-8 w-8" />}
          />
        )
      ) : (
        <EmptyState
          title="Select a patient"
          description="Choose a patient from the list to view reports."
          icon={<FileText className="h-8 w-8" />}
        />
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {reportDetail
                ? `Report for ${reportDetail.patient.user.name}`
                : "Loading report details..."}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : reportDetail ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Patient
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {reportDetail.patient.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reportDetail.patient.user.email}
                  </p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Created At
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(reportDetail.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Summary
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {reportDetail.summary || "No summary available."}
                </p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Abnormal Values
                </h5>
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {renderAbnormalValues(reportDetail.abnormalValues)}
                </pre>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Possible Conditions
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {reportDetail.possibleConditions?.length
                    ? reportDetail.possibleConditions.join(", ")
                    : "None listed"}
                </p>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Recommendation
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {reportDetail.recommendation || "No recommendations yet."}
                </p>
              </div>

              {reportDetail.disclaimer && (
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>{reportDetail.disclaimer}</span>
                </div>
              )}

              {reportDetail.fileUrl && /^https?:\/\//.test(reportDetail.fileUrl) && (
                <Button
                  variant="outline"
                  onClick={() => window.open(reportDetail.fileUrl!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open File
                </Button>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
