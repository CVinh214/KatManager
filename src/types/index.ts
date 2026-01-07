export type Role = 'manager' | 'staff';

export type EmployeeRole = 'SM' | 'SUP' | 'CAP' | 'FT' | 'CL';

export type Position = 'Cashier' | 'Barista' | 'Kitchen Staff' | 'Server';

export type ShiftStatus = 'pending' | 'approved' | 'rejected';

export type ShiftType = 'morning' | 'afternoon' | 'evening';

export interface User {
  id: string;
  email: string;
  role: Role;
  employeeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  code: string;
  employeeRole: EmployeeRole;
  role: Role;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string; // ISO date string
  start: string; // HH:mm format
  end: string; // HH:mm format
  type: ShiftType;
  status: ShiftStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeLog {
  id: string;
  shiftId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  actualStart: string; // HH:mm format
  actualEnd: string; // HH:mm format
  position: Position;
  positionNote?: string;
  notes?: string;
  totalHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  shiftType: ShiftType;
  requestType: 'register' | 'leave';
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
}

export interface ShiftPreference {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface EmployeeState {
  employees: Employee[];
  loadEmployees: () => Promise<void>; // Load from API
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployeeById: (id: string) => Employee | undefined;
}

export interface ShiftState {
  shifts: Shift[];
  shiftRequests: ShiftRequest[];
  shiftPreferences: ShiftPreference[];
  isRegistrationEnabled: boolean; // Quản lý bật/tắt đăng ký lịch
  loadShifts: (employeeId?: string, startDate?: string, endDate?: string) => Promise<void>; // Load from API
  loadShiftPreferences: (employeeId?: string, startDate?: string, endDate?: string) => Promise<void>; // Load from API
  addShift: (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateShift: (id: string, shift: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  getShiftsByEmployee: (employeeId: string) => Shift[];
  getShiftsByDateRange: (startDate: string, endDate: string) => Shift[];
  addShiftRequest: (request: Omit<ShiftRequest, 'id' | 'createdAt'>) => void;
  updateShiftRequest: (id: string, status: ShiftRequest['status']) => void;
  addShiftPreference: (preference: Omit<ShiftPreference, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateShiftPreference: (id: string, updates: Partial<ShiftPreference>) => Promise<void>;
  getShiftPreferencesByDateRange: (startDate: string, endDate: string) => ShiftPreference[];
  setRegistrationEnabled: (enabled: boolean) => void; // Toggle đăng ký lịch
}

export interface TimeLogState {
  timeLogs: TimeLog[];
  addTimeLog: (log: Omit<TimeLog, 'id' | 'createdAt' | 'updatedAt' | 'totalHours'>) => void;
  updateTimeLog: (id: string, log: Partial<TimeLog>) => void;
  deleteTimeLog: (id: string) => void;
  getTimeLogsByEmployee: (employeeId: string) => TimeLog[];
  getTimeLogsByDateRange: (startDate: string, endDate: string) => TimeLog[];
  getTimeLogsByPosition: (position: Position) => TimeLog[];
}
