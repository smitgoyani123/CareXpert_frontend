// src/types/index.ts
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: UserRole;
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  clinicLocation: string;
  experience: string;
  education?: string;
  bio?: string;
  languages: string[];
  consultationFee?: number;
  user: User;
}

export interface Appointment {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  appointmentType: 'ONLINE' | 'OFFLINE';
  date: string;
  time: string;
  notes?: string;
  consultationFee?: number;
  createdAt: string;
  updatedAt?: string;
  prescriptionId?: string | null;
  patient?: User; // Depending on if you're fetching from Doctor or Patient side
  doctor?: Doctor;
}
export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  distanceValue?: number; // Distance in meters for sorting
  rating: number;
  phone: string;
  hours: string;
  openTime?: string;
  closeTime?: string;
  isOpen: boolean;
  services?: string[];
  latitude?: number;
  longitude?: number;
}
export interface BlockedDate {
  id: string;
  doctorId: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
  isFullDay: boolean;
  createdAt?: string;
  updatedAt?: string;
}