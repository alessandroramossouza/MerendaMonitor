// ====================================
// MERENDAMONITOR - TIPOS DA GESTÃO ESCOLAR
// ====================================

export interface School {
  id: string;
  name: string;
  inepCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  totalCapacity: number;
  logoUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Staff {
  id: string;
  schoolId: string;
  name: string;
  role: 'director' | 'coordinator' | 'supervisor';
  cpf?: string;
  enrollmentNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Grade {
  id: string;
  schoolId: string;
  name: string;
  educationLevel: 'infantil' | 'fundamental_1' | 'fundamental_2' | 'medio' | 'eja';
  orderIndex: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  name: string;
  cpf?: string;
  enrollmentNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  specialization?: string;
  hireDate?: string;
  isActive: boolean;
  photoUrl?: string;
  createdAt?: string;
}

export interface Classroom {
  id: string;
  schoolId: string;
  gradeId?: string;
  gradeName?: string;
  teacherId?: string;
  teacherName?: string;
  name: string;
  capacity: number;
  shift: 'morning' | 'afternoon' | 'evening' | 'full_time';
  roomNumber?: string;
  isActive: boolean;
  totalStudents?: number;
  createdAt?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  classroomId?: string;
  name: string;
  birthDate?: string;
  cpf?: string;
  registrationNumber?: string;
  address?: string;
  
  // Guardian info
  guardianName: string;
  guardianPhone: string;
  guardianCpf?: string;
  guardianRelationship?: string;
  
  // Additional info
  hasSpecialNeeds: boolean;
  specialNeedsDescription?: string;
  hasFoodRestriction: boolean;
  foodRestrictionDescription?: string;
  bloodType?: string;
  
  // Status
  enrollmentStatus: 'active' | 'transferred' | 'dropped' | 'graduated';
  enrollmentDate?: string;
  photoUrl?: string;
  
  createdAt?: string;
}

export interface DailyAttendance {
  id: string;
  schoolId: string;
  classroomId: string;
  classroomName?: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'full_time';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  registeredByName?: string;
  registeredByRole?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAttendance {
  id: string;
  dailyAttendanceId: string;
  studentId: string;
  studentName?: string;
  isPresent: boolean;
  arrivalTime?: string;
  notes?: string;
  createdAt?: string;
}

export interface StudentTransfer {
  id: string;
  studentId: string;
  fromClassroomId?: string;
  toClassroomId?: string;
  transferDate: string;
  reason?: string;
  createdAt?: string;
}

export interface ClassroomStats {
  classroomId: string;
  classroomName: string;
  gradeName?: string;
  teacherName?: string;
  shift: string;
  totalStudents: number;
  capacity: number;
  availableSpots: number;
  attendanceRate?: number;
}

export interface SchoolDailyPresence {
  schoolId: string;
  date: string;
  totalPresent: number;
  totalEnrolled: number;
  attendanceRate: number;
}

// Helper types
export interface AttendanceFormData {
  classroomId: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'full_time';
  presentCount: number;
  notes?: string;
}

export interface ClassroomWithDetails extends Classroom {
  grade?: Grade;
  teacher?: Teacher;
  students?: Student[];
  attendanceToday?: DailyAttendance;
}
