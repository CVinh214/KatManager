import * as z from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  code: z.string().min(3, 'Mã nhân viên phải có ít nhất 3 ký tự'),
  employeeRole: z.enum(['SM', 'SUP', 'CAP', 'FT', 'CL'] as const, {
    message: 'Vui lòng chọn vai trò',
  }),
  role: z.enum(['manager', 'staff'] as const, {
    message: 'Vui lòng chọn quyền',
  }),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export const shiftSchema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  start: z.string().min(1, 'Vui lòng nhập giờ bắt đầu'),
  end: z.string().min(1, 'Vui lòng nhập giờ kết thúc'),
  type: z.enum(['morning', 'afternoon', 'evening'] as const),
  notes: z.string().optional(),
});

export type ShiftFormData = z.infer<typeof shiftSchema>;

export const timeLogSchema = z.object({
  shiftId: z.string().optional(),
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  actualStart: z.string().min(1, 'Vui lòng nhập giờ bắt đầu'),
  actualEnd: z.string().min(1, 'Vui lòng nhập giờ kết thúc'),
  position: z.enum(['Cashier', 'Barista', 'Kitchen Staff', 'Server'] as const),
  positionNote: z.string().optional(),
  notes: z.string().optional(),
});

export type TimeLogFormData = z.infer<typeof timeLogSchema>;
