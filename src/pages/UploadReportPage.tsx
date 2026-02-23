import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";

export default function UploadReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [_reportId, setReportId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED"
  >("IDLE");
  const [result, setResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);
  const apiBase = `${import.meta.env.VITE_BASE_URL}/api`;
  const LS_REPORT_STATE_KEY = "report-analyzer-state";
  const LS_LAST_RESULT_KEY = "report-analyzer-last";

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_REPORT_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          reportId?: string;
          status?: string;
        };
        if (parsed?.reportId) {
          setReportId(parsed.reportId);
          setStatus(parsed.status === "PROCESSING" ? "PROCESSING" : "IDLE");
          startPolling(parsed.reportId);
        }
      }

      const last = localStorage.getItem(LS_LAST_RESULT_KEY);
      if (last) {
        const parsedLast = JSON.parse(last);
        if (parsedLast && parsedLast.id) {
          setResult(parsedLast);
          setStatus(parsedLast.status || "COMPLETED");
        }
      }
    } catch {}

    return () => stopPolling();
  }, []);

  const startPolling = (id: string) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await axios.get(`${apiBase}/report/${id}`, {
          withCredentials: true,
        });
        if (res.data?.success) {
          const r = res.data.data;
          if (r.status === "COMPLETED") {
            setStatus("COMPLETED");
            setResult(r);
            stopPolling();
            setIsUploading(false);
            toast.success("Report analyzed successfully");
          } else if (r.status === "FAILED") {
            setStatus("FAILED");
            setErrorMessage(r.error || "Analysis failed");
            stopPolling();
            setIsUploading(false);
            toast.error(r.error || "Report analysis failed");
          } else {
            setStatus("PROCESSING");
          }
        }
      } catch (err) {
        // keep polling briefly; show toast once
      }
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setErrorMessage(null);
    setResult(null);
    setIsUploading(true);
    setStatus("PROCESSING");

    try {
      const form = new FormData();
      form.append("report", file);

      const res = await axios.post(`${apiBase}/report`, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data?.data?.reportId) {
        const id = res.data.data.reportId as string;
        setReportId(id);
        startPolling(id);
        toast.message("Report uploaded", {
          description: "Analyzing in background...",
        });
      } else {
        throw new Error(res.data?.message || "Upload failed");
      }
    } catch (err: any) {
      setIsUploading(false);
      setStatus("FAILED");
      const msg =
        err?.response?.data?.message || err?.message || "Upload failed";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analyze Report
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your medical reports for AI-powered analysis and insights.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Medical Report
            </CardTitle>
            <CardDescription>
              Upload your medical reports in PDF, JPG, or PNG format for
              analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {file ? file.name : "Choose file or drag and drop"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF, JPG, PNG up to 10MB
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="mt-4"
              >
                Select File
              </Button>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your uploaded reports will be analyzed using AI to provide
                insights about your health condition. All data is processed
                securely and confidentially.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? "Analyzing..." : "Analyze Report"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>
              {status === "IDLE" && "Upload a report to see results here."}
              {status === "PROCESSING" &&
                "We are analyzing your report. This may take a moment."}
              {status === "COMPLETED" && "Your report has been analyzed."}
              {status === "FAILED" && "We couldn't analyze your report."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "PROCESSING" && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Analyzing... Please wait.
              </div>
            )}

            {status === "FAILED" && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage ||
                    "Something went wrong while analyzing your report."}
                </AlertDescription>
              </Alert>
            )}

            {status === "COMPLETED" && result && (
              <div className="space-y-6">
                <div className="grid gap-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Filename
                  </div>
                  <div className="font-medium">{result.filename}</div>
                </div>

                {result.summary && (
                  <div>
                    <div className="font-semibold mb-2">Summary</div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {result.summary}
                    </p>
                  </div>
                )}

                {Array.isArray(result.abnormalValues) &&
                  result.abnormalValues.length > 0 && (
                    <div>
                      <div className="font-semibold mb-2">Abnormal Values</div>
                      <div className="space-y-3">
                        {result.abnormalValues
                          .map((raw: any, i: number) => {
                            const name =
                              raw.test_name ||
                              raw.testName ||
                              raw.parameter ||
                              `Result ${i + 1}`;
                            const value =
                              raw.value ??
                              raw.measured_value ??
                              raw.measuredValue;
                            const unit = raw.unit || raw.units || "";
                            const normal =
                              raw.normal_range ||
                              raw.normalRange ||
                              raw.reference ||
                              "";
                            const issue =
                              raw.issue || raw.reason || raw.flag || "";
                            return { name, value, unit, normal, issue };
                          })
                          .map((v: any, idx: number) => (
                            <div
                              key={`${v.name}-${idx}`}
                              className="rounded-lg border border-red-500/20 bg-red-500/5 p-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">
                                    {v.name}
                                  </div>
                                  {v.normal && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Normal: {v.normal}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-red-600 font-semibold">
                                    {v.value !== undefined ? v.value : "—"}{" "}
                                    {v.unit}
                                  </div>
                                  {v.issue && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    >
                                      {v.issue}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {Array.isArray(result.possibleConditions) &&
                  result.possibleConditions.length > 0 && (
                    <div>
                      <div className="font-semibold mb-2">
                        Possible Conditions
                      </div>
                      <ul className="list-disc pl-6 space-y-1">
                        {result.possibleConditions.map(
                          (c: any, idx: number) => (
                            <li key={idx}>
                              {typeof c === "string"
                                ? c
                                : c?.condition || JSON.stringify(c)}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {result.recommendation && (
                  <div>
                    <div className="font-semibold mb-2">Recommendation</div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {result.recommendation}
                    </p>
                  </div>
                )}

                {result.disclaimer && (
                  <div>
                    <div className="font-semibold mb-2">Disclaimer</div>
                    <p className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                      {result.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            )}

            {status === "IDLE" && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No reports analyzed yet. Upload your first report to get
                started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
