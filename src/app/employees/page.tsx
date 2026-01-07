'use client';

import { useState, useRef } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { useRequireRole } from '@/hooks/use-auth';
import { useEmployeeStore } from '@/store/employee-store';
import { Employee, EmployeeRole } from '@/types';
import { EmployeeFormData } from '@/lib/validations';
import EmployeeModal from '@/components/employees/employee-modal';
import { Plus, Edit, Trash2, Search, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function EmployeesPage() {
  const { user, isHydrated, hasAccess } = useRequireRole(['manager']);
  
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployeeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSave = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, data);
    } else {
      addEmployee(data);
    }
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    setDeleteConfirm(null);
  };
const getEmployeeRoleColor = (employeeRole: EmployeeRole) => {
    const colors: Record<EmployeeRole, string> = {
      SM: 'bg-purple-100 text-purple-700',
      SUP: 'bg-blue-100 text-blue-700',
      CAP: 'bg-green-100 text-green-700',
      FT: 'bg-yellow-100 text-yellow-700',
      CL: 'bg-orange-100 text-orange-700',
    };
    return colors[employeeRole] || 'bg-gray-100 text-gray-700';
  };

  const getEmployeeRoleLabel = (employeeRole: EmployeeRole) => {
    const labels: Record<EmployeeRole, string> = {
      SM: 'SM (Store Manager)',
      SUP: 'SUP (Supervisor)',
      CAP: 'CAP (Captain)',
      FT: 'FT (Full Time)',
      CL: 'CL (Casual Labour)',
    };
    return labels[employeeRole] || employeeRole;
  };

  const getRoleColor = (role: string) => {
    return role === 'manager'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700';
  };

  // Helper function to determine role based on employeeRole
  const getRoleFromEmployeeRole = (employeeRole: EmployeeRole): 'manager' | 'staff' => {
    return ['SM', 'SUP', 'CAP'].includes(employeeRole) ? 'manager' : 'staff';
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRoles: EmployeeRole[] = ['SM', 'SUP', 'CAP', 'FT', 'CL'];
        let successCount = 0;
        let errorCount = 0;

        results.data.forEach((row: any) => {
          try {
            if (!row['Mã NV'] || !row['Họ tên'] || !row['Vai trò'] || !row['Email']) {
              errorCount++;
              return;
            }

            const employeeRole = row['Vai trò'].toUpperCase().trim() as EmployeeRole;
            if (!validRoles.includes(employeeRole)) {
              errorCount++;
              return;
            }

            const employeeData: EmployeeFormData = {
              code: row['Mã NV'].trim(),
              name: row['Họ tên'].trim(),
              email: row['Email'].trim(),
              phone: row['SĐT']?.trim() || '',
              employeeRole: employeeRole,
              role: getRoleFromEmployeeRole(employeeRole), // Auto-set role based on employeeRole
            };

            addEmployee(employeeData);
            successCount++;
          } catch (error) {
            errorCount++;
          }
        });

        alert(`Import hoàn tất!\nThành công: ${successCount}\nLỗi: ${errorCount}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        alert(`Lỗi khi đọc file: ${error.message}`);
      },
    });
  };

  const handleExportExcel = () => {
    const exportData = employees.map((emp) => ({
      'Mã NV': emp.code,
      'Họ tên': emp.name,
      'Vai trò': emp.employeeRole,
      'Email': emp.email,
      'SĐT': emp.phone || '',
      'Quyền': emp.role === 'manager' ? 'Quản lý' : 'Nhân viên',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bao-cao-nhan-vien-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Auth check
  if (!user || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập với quyền quản lý</p>
          <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
        </div>
      </div>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
          
          {/* Action buttons - Stack on mobile */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Xuất</span>
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-1 sm:flex-none justify-center"
            >
              <Plus size={18} />
              Thêm NV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Search */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Mã NV
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    SĐT
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-900">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{employee.code}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">{employee.name}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEmployeeRoleColor(
                            employee.employeeRole
                          )}`}
                        >
                          {employee.employeeRole}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-gray-900 text-sm">
                        {employee.email}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-gray-900">
                        {employee.phone || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                          {deleteConfirm === employee.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(employee.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(employee.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                Không tìm thấy nhân viên nào
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div key={employee.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{employee.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEmployeeRoleColor(
                            employee.employeeRole
                          )}`}
                        >
                          {employee.employeeRole}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 space-y-0.5">
                        <div>Mã: {employee.code}</div>
                        <div className="truncate">{employee.email}</div>
                        {employee.phone && <div>{employee.phone}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      {deleteConfirm === employee.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Xóa
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(employee.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Tổng số: <span className="font-medium text-gray-900">{filteredEmployees.length}</span> nhân viên
            </p>
          </div>
        </div>
      </div>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        employee={editingEmployee}
      />
    </Sidebar>
  );
}
