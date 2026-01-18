import { create } from 'zustand';
import { Shift, ShiftRequest, ShiftState, ShiftPreference } from '@/types';
import { generateId, formatDateISO } from '@/lib/utils';

export const useShiftStore = create<ShiftState>()((set, get) => ({
  shifts: [],
  shiftRequests: [],
  shiftPreferences: [],
  isRegistrationEnabled: false,
  
  // Load shift preferences from API
  loadShiftPreferences: async (employeeId?: string, startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append('employeeId', employeeId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/shift-preferences?${params}`);
      if (response.ok) {
        const data = await response.json();
        // Transform data to match store format
        const preferences = data.map((p: any) => ({
          id: p.id,
          employeeId: p.employeeId,
          date: formatDateISO(new Date(p.date)),
          startTime: p.startTime,
          endTime: p.endTime,
          status: p.status,
          notes: p.notes,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        set({ shiftPreferences: preferences });
      }
    } catch (error) {
      console.error('Failed to load shift preferences:', error);
    }
  },

  // Load shifts from API
  loadShifts: async (
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    opts?: { limit?: number; offset?: number; append?: boolean }
  ) => {
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append('employeeId', employeeId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (opts?.limit) params.append('limit', String(opts.limit));
      if (opts?.offset) params.append('offset', String(opts.offset));

      const response = await fetch(`/api/shifts?${params.toString()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        // Transform data to match store format
        const shifts = data.map((s: any) => ({
          id: s.id,
          employeeId: s.employeeId,
          date: formatDateISO(new Date(s.date)),
          start: s.start,
          end: s.end,
          type: s.type,
          status: s.status,
          notes: s.notes,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));

        if (opts?.append) {
          set((state) => ({ shifts: [...state.shifts, ...shifts] }));
        } else {
          set({ shifts });
        }
      }
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  },

  addShift: (shift) => {
    const newShift: Shift = {
      ...shift,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      shifts: [...state.shifts, newShift],
    }));
  },
  
  updateShift: (id, updates) => {
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift.id === id
          ? { ...shift, ...updates, updatedAt: new Date() }
          : shift
      ),
    }));
  },
  
  deleteShift: (id) => {
    set((state) => ({
      shifts: state.shifts.filter((shift) => shift.id !== id),
    }));
  },

  // Upsert a shift object received from server (keep server id and timestamps)
  upsertShift: (shift: Shift) => {
    set((state) => {
      const exists = state.shifts.some(s => s.id === shift.id);
      if (exists) {
        return { shifts: state.shifts.map(s => s.id === shift.id ? shift : s) };
      }
      return { shifts: [...state.shifts, shift] };
    });
  },

  // Remove shift by id (server deleted)
  removeShift: (id: string) => {
    set((state) => ({ shifts: state.shifts.filter(s => s.id !== id) }));
  },
  
  getShiftsByEmployee: (employeeId) => {
    return get().shifts.filter((shift) => shift.employeeId === employeeId);
  },
  
  getShiftsByDateRange: (startDate, endDate) => {
    return get().shifts.filter(
      (shift) => shift.date >= startDate && shift.date <= endDate
    );
  },
  
  addShiftRequest: (request) => {
    const newRequest: ShiftRequest = {
      ...request,
      id: generateId(),
      createdAt: new Date(),
    };
    set((state) => ({
      shiftRequests: [...state.shiftRequests, newRequest],
    }));
  },
  
  updateShiftRequest: (id, status) => {
    set((state) => ({
      shiftRequests: state.shiftRequests.map((req) =>
        req.id === id ? { ...req, status } : req
      ),
    }));
  },
  
  addShiftPreference: async (preference) => {
    try {
      const response = await fetch('/api/shift-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preference),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newPreference: ShiftPreference = {
          id: data.id,
          employeeId: data.employeeId,
          date: formatDateISO(new Date(data.date)),
          startTime: data.startTime || undefined,
          endTime: data.endTime || undefined,
          isOff: data.isOff || false,
          status: data.status,
          notes: data.notes,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
        set((state) => ({
          shiftPreferences: [...state.shiftPreferences, newPreference],
        }));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shift preference');
      }
    } catch (error) {
      console.error('Error adding shift preference:', error);
      throw error;
    }
  },
  
  updateShiftPreference: async (id, updates) => {
    try {
      const response = await fetch('/api/shift-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      
      if (response.ok) {
        const data = await response.json();
        set((state) => ({
          shiftPreferences: state.shiftPreferences.map((pref) =>
            pref.id === id
              ? {
                  ...pref,
                  ...updates,
                  updatedAt: new Date(data.updatedAt),
                }
              : pref
          ),
        }));
      }
    } catch (error) {
      console.error('Error updating shift preference:', error);
      throw error;
    }
  },
  
  getShiftPreferencesByDateRange: (startDate, endDate) => {
    return get().shiftPreferences.filter(
      (pref) => pref.date >= startDate && pref.date <= endDate
    );
  },
  
  setRegistrationEnabled: (enabled) => {
    set({ isRegistrationEnabled: enabled });
  },
}));
