import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  ArrowRight,
  ChevronDown,
  DollarSign,
  Calendar,
  Building,
  UserCheck,
  CircleOff,
  UserPlus,
  Shield,
  Wallet,
  Clock,
  ClipboardList
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const DEPARTMENTS = ['Sales', 'Security', 'Admin', 'Cleaners'];
const ROLES = ['Admin', 'Manager', 'Cashier', 'Beautician', 'Trainer'];

const StaffManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [employees, setEmployees] = useState([]);
  const [warehouses, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileEmployee, setProfileEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    employeeCode: '',
    phone: '',
    email: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    department: 'Sales',
    jobTitle: '',
    warehouse: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    salaryType: 'Monthly',
    salaryAmount: '',
    payDay: '',
    hasSystemAccess: false,
    systemRole: 'Cashier',
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/warehouses');
      setBranches(data);
    } catch (error) {
      console.error("Failed to fetch warehouses", error);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm) ||
        emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All Departments' || emp.department === deptFilter;
      const matchesStatus = statusFilter === 'All Status' || emp.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, deptFilter, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedEmployee(null);
    setFormData({
      name: '', employeeCode: '', phone: '', email: '', address: '',
      emergencyName: '', emergencyPhone: '',
      department: 'Sales', jobTitle: '',
      warehouse: warehouses.length > 0 ? warehouses[0]._id : '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active', salaryType: 'Monthly', salaryAmount: '', payDay: '',
      hasSystemAccess: false, systemRole: 'Cashier', notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      employeeCode: emp.employeeCode || '',
      phone: emp.phone,
      email: emp.email || '',
      address: emp.address || '',
      emergencyName: emp.emergencyContact?.name || '',
      emergencyPhone: emp.emergencyContact?.phone || '',
      department: emp.department || 'Sales',
      jobTitle: emp.jobTitle,
      warehouse: emp.warehouseId?._id || emp.warehouseId || (warehouses.length > 0 ? warehouses[0]._id : ''),
      joinDate: emp.joinDate ? emp.joinDate.split('T')[0] : '',
      status: emp.status,
      salaryType: emp.salaryType,
      salaryAmount: emp.salaryAmount?.toString() || '',
      payDay: emp.payDay || '',
      hasSystemAccess: emp.hasSystemAccess,
      systemRole: emp.systemRole || 'Cashier',
      notes: emp.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        employeeCode: formData.employeeCode,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone
        },
        department: formData.department,
        jobTitle: formData.jobTitle,
        warehouseId: formData.warehouse, // Send warehouseId to backend
        joinDate: formData.joinDate,
        status: formData.status,
        salaryType: formData.salaryType,
        salaryAmount: parseFloat(formData.salaryAmount) || 0,
        payDay: formData.payDay,
        hasSystemAccess: formData.hasSystemAccess,
        systemRole: formData.hasSystemAccess ? formData.systemRole : undefined,
        notes: formData.notes
      };

      if (selectedEmployee) {
        await api.put(`/employees/${selectedEmployee._id}`, payload);
      } else {
        await api.post('/employees', payload);
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error("Failed to save employee", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to save employee.',
        buttonText: 'Try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (emp) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Change status?',
      message: `Are you sure you want to change ${emp.name}'s status?`,
      confirmText: 'Change status',
      cancelText: 'Cancel'
    });
    if (!ok) return;
    try {
      const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/employees/${emp._id}`, { status: newStatus });
      setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, status: newStatus } : e));
    } catch (error) {
      console.error("Failed to update status", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to update status.',
        buttonText: 'Try again'
      });
    }
  };

  const handleDelete = async (emp) => {
    const ok = await showConfirm({
      type: 'danger',
      title: 'Delete employee?',
      message: `Delete ${emp.name}? Employees with attendance or task history cannot be deleted; make them inactive instead.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!ok) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      setEmployees(prev => prev.filter(e => e._id !== emp._id));
    } catch (error) {
      console.error("Failed to delete employee", error);
      showAlert({
        type: 'error',
        title: 'Could not delete',
        message: error.response?.data?.message || 'Failed to delete employee.',
        buttonText: 'OK'
      });
    }
  };

  // Helper to get warehouse name
  const getBranchName = (id) => {
    if (id && typeof id === 'object') return id.name || 'Unknown Warehouse';
    const warehouse = warehouses.find(b => b._id === id);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Page Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10 transition-transform hover:rotate-3">
            <Users size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Employees</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Workforce registry & Payroll parameters</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 group border border-slate-700 shadow-xl"
        >
          <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Add Employee
        </button>
      </div>

      {/* Control Bar (Search & Filters) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[44px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-1 items-center gap-6">
          <div className="relative group flex-1 md:max-w-md">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by Name or Phone..."
              className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-sm font-semibold outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:text-white shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 hidden md:flex">
            <div className="relative">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="pl-6 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none cursor-pointer shadow-inner"
              >
                <option>All Departments</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-6 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[22px] text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none cursor-pointer shadow-inner"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Employee</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6">Phone Number</th>
                <th className="px-10 py-6">Salary Basis</th>
                <th className="px-10 py-6">Workload</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400 font-bold">Loading Workforce Registry...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-slate-400 font-bold">No employees found.</td></tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                          {(emp.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{emp.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{emp.employeeCode || emp._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1">
                        <p className="text-xs font-black dark:text-slate-200 uppercase tracking-tight">{emp.jobTitle}</p>
                        <p className="text-[9px] font-bold text-brand-500 uppercase tracking-[0.2em]">{emp.department}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                      {emp.phone}
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ${emp.salaryAmount?.toLocaleString() || 0} <span className="text-[10px] text-slate-400 font-medium">/ {emp.salaryType === 'Monthly' ? 'Mo' : 'Day'}</span>
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Node: {getBranchName(emp.warehouseId)}
                        </p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
                          <p className="text-[8px] font-black uppercase tracking-widest">Open Tasks</p>
                          <p className="text-sm font-black tabular-nums">{emp.taskStats?.open || 0}</p>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                          <p className="text-[8px] font-black uppercase tracking-widest">Attendance</p>
                          <p className="text-sm font-black tabular-nums">{emp.attendanceRecords || 0}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className={`mx-auto px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-fit flex items-center gap-2 border shadow-sm ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : emp.status === 'On Leave' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500 animate-pulse' : emp.status === 'On Leave' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        {emp.status}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => setProfileEmployee(emp)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                          title="View profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-600 transition-all shadow-sm active:scale-90"
                          title="Edit employee"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeactivate(emp)}
                          className={`p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl transition-all shadow-sm active:scale-90 ${emp.status === 'Active' ? 'text-slate-300 hover:text-rose-500' : 'text-emerald-500 hover:text-emerald-600'
                            }`}
                          title={emp.status === 'Active' ? 'Make inactive' : 'Make active'}
                        >
                          {emp.status === 'Active' ? <CircleOff size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm active:scale-90"
                          title="Delete employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
        {/* Footer info */}
        <div className="p-10 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Human Capital Registry</p>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-tight">
                <ShieldCheck size={16} /> Staff Node Fully Audited
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase">Total Personnel: {employees.length}</p>
        </div>
      </div>

      {profileEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setProfileEmployee(null)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                  {(profileEmployee.name || '?').charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase leading-none">{profileEmployee.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">{profileEmployee.employeeCode || profileEmployee._id.slice(-6)} · {profileEmployee.jobTitle}</p>
                </div>
              </div>
              <button onClick={() => setProfileEmployee(null)} className="p-3 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={22} /></button>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{profileEmployee.phone || 'Not recorded'}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email</p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white break-all">{profileEmployee.email || 'Not recorded'}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Warehouse</p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{getBranchName(profileEmployee.warehouseId)}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Department</p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{profileEmployee.department}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Salary</p>
                <p className="mt-2 text-sm font-black text-emerald-600">${profileEmployee.salaryAmount?.toLocaleString() || 0} / {profileEmployee.salaryType}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Emergency Contact</p>
                <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{profileEmployee.emergencyContact?.name || 'Not recorded'}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">{profileEmployee.emergencyContact?.phone || ''}</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">Open Tasks</p>
                  <p className="mt-2 text-2xl font-black text-blue-700 dark:text-blue-300">{profileEmployee.taskStats?.open || 0}</p>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Attendance Records</p>
                  <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">{profileEmployee.attendanceRecords || 0}</p>
                </div>
              </div>
              <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Notes</p>
                <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{profileEmployee.notes || 'No notes recorded.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[56px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-12 py-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                  {selectedEmployee ? <Edit2 size={32} /> : <UserPlus size={32} strokeWidth={2.5} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                    {selectedEmployee ? 'Edit Employee Node' : 'Initialize Employee Onboarding'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">Capture workforce metrics and organizational parameters.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-12 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">

              {/* Section: Basic Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <UserCheck size={18} className="text-brand-600" />
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Basic Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Employee Code</label>
                    <input type="text" value={formData.employeeCode} onChange={e => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })} placeholder="Auto-generated if empty" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Legal Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ahmed Yusuf" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number *</label>
                    <input required type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+252 61 XXX XXXX" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="employee@procare.so" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Home Address</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="District, Street..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Emergency Contact Name</label>
                    <input type="text" value={formData.emergencyName} onChange={e => setFormData({ ...formData, emergencyName: e.target.value })} placeholder="Family or guardian name" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Emergency Contact Phone</label>
                    <input type="text" value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })} placeholder="+252 61 XXX XXXX" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                  </div>
                </div>
              </div>

              {/* Section: Job Info */}
              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-amber-500" />
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Job Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department</label>
                    <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none appearance-none shadow-inner">
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Role</label>
                    <input required type="text" value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="e.g. Barber Assistant" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Warehouse *</label>
                    <select value={formData.warehouse} onChange={e => setFormData({ ...formData, warehouse: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none appearance-none">
                      {warehouses.length > 0 ? (
                        warehouses.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))
                      ) : (
                        <option value="">No warehouses found</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Join Date *</label>
                    <input required type="date" value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Initial Status</label>
                    <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <button type="button" onClick={() => setFormData({ ...formData, status: 'Active' })} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === 'Active' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>Active</button>
                      <button type="button" onClick={() => setFormData({ ...formData, status: 'On Leave' })} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === 'On Leave' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>Leave</button>
                      <button type="button" onClick={() => setFormData({ ...formData, status: 'Inactive' })} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === 'Inactive' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>Inactive</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Salary Information */}
              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Wallet size={18} className="text-emerald-500" />
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Salary Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Salary Basis</label>
                    <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <button type="button" onClick={() => setFormData({ ...formData, salaryType: 'Monthly' })} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.salaryType === 'Monthly' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Monthly</button>
                      <button type="button" onClick={() => setFormData({ ...formData, salaryType: 'Daily' })} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.salaryType === 'Daily' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Daily</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Salary Amount * (USD)</label>
                    <div className="relative group">
                      <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                      <input required type="number" value={formData.salaryAmount} onChange={e => setFormData({ ...formData, salaryAmount: e.target.value })} placeholder="0.00" className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-inner" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pay Day Node (Optional)</label>
                    <div className="relative group">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={formData.payDay} onChange={e => setFormData({ ...formData, payDay: e.target.value })} placeholder="e.g. Last day of month" className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: System Access (Optional) */}
              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-violet-500" />
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">System Access Logic</h4>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[32px] space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-black dark:text-white uppercase tracking-tight leading-none">Enable System Authorization</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Generate a unique login identity for this employee</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hasSystemAccess: !formData.hasSystemAccess })}
                      className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${formData.hasSystemAccess ? 'bg-violet-600 shadow-violet-600/20' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.hasSystemAccess ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {formData.hasSystemAccess && (
                    <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign Functional Role</label>
                      <div className="relative">
                        <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-violet-500" />
                        <select value={formData.systemRole} onChange={e => setFormData({ ...formData, systemRole: e.target.value })} className="w-full pl-14 pr-10 py-4 bg-white dark:bg-slate-900 border-2 border-violet-500/20 rounded-[22px] text-sm font-black dark:text-white outline-none focus:ring-4 focus:ring-violet-500/10 appearance-none shadow-sm transition-all">
                          {ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} className="text-blue-500" />
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Employee Notes</h4>
                </div>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Internal HR notes, shift preference, contract reminders..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold dark:text-white outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pt-10 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-10 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 w-full px-10 py-5 bg-brand-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-brand-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Processing Entry...' : (
                    <>Commit Employee Entry <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
