/**
 * services.ts - Centralized API Service Layer
 *
 * This module provides organized, domain-separated endpoint functions that
 * wrap the shared `api` axios instance from `@/lib/api`. Components should
 * import from here instead of calling `api.*` directly, ensuring:
 *   - A single source of truth for every backend route
 *   - Consistent TypeScript return types
 *   - Easy endpoint discovery and maintenance
 *
 * Usage:
 *   import { authAPI, patientAPI, doctorAPI } from "@/lib/services";
 *   const data = await patientAPI.getAllDoctors();
 */

import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Shared response shape (all backend routes follow this pattern)
// ---------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    statusCode: number;
    data: T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface LoginPayload {
    email: string;
    password: string;
}

export interface SignupPayload {
    email: string;
    password: string;
    name: string;
    role: "PATIENT" | "DOCTOR";
    [key: string]: unknown; // doctor extra fields
}

export interface ResetPasswordPayload {
    token: string;
    password: string;
}

export const authAPI = {
    /** POST /user/login */
    login: (payload: LoginPayload) =>
        api.post<ApiResponse>("/user/login", payload),

    /** POST /user/signup */
    signup: (payload: SignupPayload) =>
        api.post<ApiResponse>("/user/signup", payload),

    /** POST /user/logout */
    logout: () => api.post<ApiResponse>("/user/logout"),

    /** POST /user/forgot-password */
    forgotPassword: (email: string) =>
        api.post<ApiResponse>("/user/forgot-password", { email }),

    /** POST /user/reset-password */
    resetPassword: (payload: ResetPasswordPayload) =>
        api.post<ApiResponse>("/user/reset-password", payload),
};

// ---------------------------------------------------------------------------
// User / Profile
// ---------------------------------------------------------------------------
export interface UpdateProfilePayload {
    name?: string;
    profilePicture?: File;
}

export const userAPI = {
    /** GET /user/authenticated-profile */
    getAuthenticatedProfile: () =>
        api.get<ApiResponse>("/user/authenticated-profile"),

    /** PUT /user/update-patient */
    updatePatientProfile: (form: FormData) =>
        api.put<ApiResponse>("/user/update-patient", form, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    /** PUT /user/update-doctor */
    updateDoctorProfile: (form: FormData) =>
        api.put<ApiResponse>("/user/update-doctor", form, {
            headers: { "Content-Type": "multipart/form-data" },
        }),

    /** GET /user/notifications */
    getNotifications: (signal?: AbortSignal) =>
        api.get<ApiResponse>("/user/notifications", { signal }),

    /** GET /user/notifications/unread-count */
    getUnreadNotificationCount: () =>
        api.get<ApiResponse>("/user/notifications/unread-count"),

    /** PUT /user/notifications/:id/read */
    markNotificationRead: (notificationId: string) =>
        api.put<ApiResponse>(`/user/notifications/${notificationId}/read`, {}),

    /** PUT /user/notifications/mark-all-read */
    markAllNotificationsRead: () =>
        api.put<ApiResponse>("/user/notifications/mark-all-read", {}),

    /** GET /user/communities/:roomId/members */
    getCommunityMembers: (roomId: string) =>
        api.get<ApiResponse>(`/user/communities/${roomId}/members`),
};

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------
export interface BookAppointmentPayload {
    doctorId: string;
    date: string;
    time: string;
    notes?: string;
    appointmentType: "ONLINE" | "OFFLINE";
}

/**
 * The backend /patient/fetchAllDoctors (and related endpoints) still returns
 * doctor display fields nested under a `user` sub-object:
 *   { id, specialty, ..., user: { name, profilePicture } }
 *
 * This helper hoists those fields onto the root of the doctor object so that
 * pages can use the flat shape (doctor.name / doctor.profilePicture) without
 * ever crashing on undefined, regardless of which backend version is running.
 */
export interface NormalizedDoctor {
    id: string;
    userId: string;
    specialty: string;
    clinicLocation: string;
    experience: string;
    education: string;
    bio: string;
    languages: string[];
    consultationFee: number;
    name: string;
    profilePicture: string;
}

// Raw shape returned by the backend (still nested under user)
type RawDoctor = Record<string, unknown> & {
    user?: { name?: string; profilePicture?: string };
    name?: string;
    profilePicture?: string;
};

function normalizeDoctorData(doctor: RawDoctor): NormalizedDoctor {
    return {
        ...(doctor as unknown as NormalizedDoctor),
        // Prefer top-level fields (future-proof); fall back to nested user object
        name: doctor.name ?? doctor.user?.name ?? "",
        profilePicture: doctor.profilePicture ?? doctor.user?.profilePicture ?? "",
    };
}

export const patientAPI = {
    /**
     * GET /patient/fetchAllDoctors
     * Response is normalized so that name/profilePicture are always at the
     * top level of each doctor object, regardless of backend payload shape.
     */
    getAllDoctors: async (): Promise<{ data: { success: boolean; data: NormalizedDoctor[] } }> => {
        const res = await api.get<ApiResponse<RawDoctor[]>>("/patient/fetchAllDoctors");
        if (res.data?.success && Array.isArray(res.data.data)) {
            (res as unknown as { data: { data: NormalizedDoctor[] } }).data.data =
                (res.data.data as RawDoctor[]).map(normalizeDoctorData);
        }
        return res as unknown as { data: { success: boolean; data: NormalizedDoctor[] } };
    },

    /** POST /patient/book-direct-appointment */
    bookAppointment: (payload: BookAppointmentPayload) =>
        api.post<ApiResponse>("/patient/book-direct-appointment", payload),
};

// ---------------------------------------------------------------------------
// Doctor
// ---------------------------------------------------------------------------
export interface RespondToAppointmentPayload {
    action: "accept" | "reject";
    rejectionReason?: string;
}

export interface BlockDatePayload {
    date: string;
    isFullDay: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
}

export interface SubmitPrescriptionPayload {
    prescriptionText: string;
}

export const doctorAPI = {
    /** GET /doctor/all-appointments */
    getAllAppointments: () =>
        api.get<ApiResponse>("/doctor/all-appointments"),

    /** GET /doctor/appointment-requests */
    getAppointmentRequests: () =>
        api.get<ApiResponse>("/doctor/appointment-requests"),

    /** GET /doctor/pending-requests */
    getPendingRequests: () =>
        api.get<ApiResponse>("/doctor/pending-requests"),

    /** PATCH /doctor/appointment-requests/:id/respond */
    respondToAppointment: (
        appointmentId: string,
        payload: RespondToAppointmentPayload
    ) =>
        api.patch<ApiResponse>(
            `/doctor/appointment-requests/${appointmentId}/respond`,
            payload
        ),

    /** POST /doctor/appointments/:id/prescription */
    submitPrescription: (
        appointmentId: string,
        payload: SubmitPrescriptionPayload
    ) =>
        api.post<ApiResponse>(
            `/doctor/appointments/${appointmentId}/prescription`,
            payload
        ),

    /** PATCH /doctor/appointments/:id/complete */
    completeAppointment: (appointmentId: string) =>
        api.patch<ApiResponse>(`/doctor/appointments/${appointmentId}/complete`, {}),

    /** GET /doctor/:doctorId/blocked-dates */
    getBlockedDates: (doctorId: string) =>
        api.get<ApiResponse>(`/doctor/${doctorId}/blocked-dates`),

    /** POST /doctor/block-date */
    addBlockedDate: (payload: BlockDatePayload) =>
        api.post<ApiResponse>("/doctor/block-date", payload),

    /** DELETE /doctor/block-date/:id */
    deleteBlockedDate: (blockedDateId: string) =>
        api.delete<ApiResponse>(`/doctor/block-date/${blockedDateId}`),
};

// ---------------------------------------------------------------------------
// Reports (AI-powered report analysis)
// ---------------------------------------------------------------------------
export const reportAPI = {
    /** POST /report — upload a report file for AI analysis */
    uploadReport: (file: File) => {
        const form = new FormData();
        form.append("report", file);
        return api.post<ApiResponse>("/report", form, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    /** GET /report/:id — poll for analysis result */
    getReportStatus: (reportId: string) =>
        api.get<ApiResponse>(`/report/${reportId}`),
};

// ---------------------------------------------------------------------------
// Chat (real-time messaging helpers called from socket.ts and ChatPage)
// ---------------------------------------------------------------------------
export interface SendMessagePayload {
    content: string;
    receiverId?: string;
    roomId?: string;
}

export const chatAPI = {
    /** GET /chat/one-on-one/:otherUserId — load DM history */
    getOneOnOneChatHistory: (otherUserId: string, page = 1, limit = 50) =>
        api.get<ApiResponse>(`/chat/one-on-one/${otherUserId}`, {
            params: { page, limit },
        }),

    /** GET /chat/city/:cityName — city public channel history */
    getCityChatHistory: (cityName: string, page = 1, limit = 50) =>
        api.get<ApiResponse>(`/chat/city/${encodeURIComponent(cityName)}`, {
            params: { page, limit },
        }),

    /** GET /chat/room/:roomId — room/community chat history */
    getRoomChatHistory: (roomId: string, page = 1, limit = 50) =>
        api.get<ApiResponse>(`/chat/room/${roomId}`, { params: { page, limit } }),

    /** GET /chat/doctor/conversations — list all patient conversations for a doctor */
    getDoctorConversations: () =>
        api.get<ApiResponse>("/chat/doctor/conversations"),

    /** POST /ai-chat — send a message to the AI chatbot */
    sendAiMessage: (payload: SendMessagePayload) =>
        api.post<ApiResponse>("/ai-chat", payload),

    /** GET /ai-chat/history — load AI chat history */
    getAiChatHistory: () => api.get<ApiResponse>("/ai-chat/history"),

    /** DELETE /ai-chat/history — clear AI chat history */
    clearAiChatHistory: () => api.delete<ApiResponse>("/ai-chat/history"),
};

// ---------------------------------------------------------------------------
// Video Calls
// ---------------------------------------------------------------------------
export interface MeetingTokenResponse {
    roomId: string;
    token: string;
}

export const videoCallAPI = {
    /** POST /chat/get-token — get a video meeting room + token */
    getMeetingToken: () =>
        api.post<MeetingTokenResponse>("/chat/get-token"),
};

// ---------------------------------------------------------------------------
// Pharmacy
// ---------------------------------------------------------------------------
export interface PharmacySearchParams {
    city?: string;
    name?: string;
    [key: string]: string | undefined;
}

export const pharmacyAPI = {
    /** GET /pharmacies — search nearby pharmacies */
    getPharmacies: (params?: PharmacySearchParams) =>
        api.get<ApiResponse>("/pharmacies", { params }),
};
