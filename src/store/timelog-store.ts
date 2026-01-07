import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimeLog, TimeLogState } from '@/types';
import { generateId, calculateHours } from '@/lib/utils';

// Generate mock time logs
function generateMockTimeLogs(): TimeLog[] {
  const logs: TimeLog[] = [];
  const today = new Date();
  const employeeIds = ['emp-002', 'emp-003', 'emp-004', 'emp-005', 'emp-006'];
  const positions: Array<'Cashier' | 'Barista' | 'Server'> = [
    'Cashier',
    'Barista',
    'Server',
  ];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    employeeIds.forEach((empId, idx) => {
      if (Math.random() > 0.3) {
        // 70% chance of having a log
        const actualStart = '07:30';
        const actualEnd = '17:00';
        logs.push({
          id: generateId(),
          shiftId: generateId(),
          employeeId: empId,
          date: dateStr,
          actualStart,
          actualEnd,
          position: positions[idx],
          totalHours: calculateHours(actualStart, actualEnd),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });
  }

  return logs;
}

export const useTimeLogStore = create<TimeLogState>()(
  persist(
    (set, get) => ({
      timeLogs: generateMockTimeLogs(),
      addTimeLog: (log) => {
        const totalHours = calculateHours(log.actualStart, log.actualEnd);
        const newLog: TimeLog = {
          ...log,
          id: generateId(),
          totalHours,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          timeLogs: [...state.timeLogs, newLog],
        }));
      },
      updateTimeLog: (id, updates) => {
        set((state) => ({
          timeLogs: state.timeLogs.map((log) => {
            if (log.id === id) {
              const updatedLog = { ...log, ...updates, updatedAt: new Date() };
              if (updates.actualStart || updates.actualEnd) {
                updatedLog.totalHours = calculateHours(
                  updatedLog.actualStart,
                  updatedLog.actualEnd
                );
              }
              return updatedLog;
            }
            return log;
          }),
        }));
      },
      deleteTimeLog: (id) => {
        set((state) => ({
          timeLogs: state.timeLogs.filter((log) => log.id !== id),
        }));
      },
      getTimeLogsByEmployee: (employeeId) => {
        return get().timeLogs.filter((log) => log.employeeId === employeeId);
      },
      getTimeLogsByDateRange: (startDate, endDate) => {
        return get().timeLogs.filter(
          (log) => log.date >= startDate && log.date <= endDate
        );
      },
      getTimeLogsByPosition: (position) => {
        return get().timeLogs.filter((log) => log.position === position);
      },
    }),
    {
      name: 'timelog-storage',
    }
  )
);
