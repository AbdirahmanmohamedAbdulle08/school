import React, { useState, useEffect } from 'react';
import {
  Search, Plus, UserCircle, X, Edit2, CheckCircle2, Trash2
} from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const UsersList = () => {
  const { showAlert, showConfirm } = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    warehouse: 'Global HQ',
    roles: [],
    status: 'active'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setAvailableRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
      setAvailableRoles([]);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || user.fullName || '',
      email: user.email || '',
      password: '',
      warehouse: 'Global HQ',
      roles: user.roles ? user.roles.map(r => r._id || r) : [],
      status: user.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username,
        fullName: formData.username,
        email: formData.email,
        roles: formData.roles,
        status: formData.status
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
      } else {
        await api.post('/users', payload);
      }

      setIsModalOpen(false);
      fetchUsers();
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        warehouse: 'Global HQ',
        roles: [],
        status: 'active'
      });
    } catch (error) {
      console.error("Failed to save user", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to save user.',
        buttonText: 'Try again'
      });
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await api.put(`/users/${user._id}`, { ...user, status: newStatus });
      setUsers(prevUsers => prevUsers.map(u =>
        u._id === user._id ? { ...u, status: newStatus } : u
      ));
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

  const handleDelete = async (user) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete user?',
      message: `Are you sure you want to delete ${user.username || user.email}? This cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    try {
      await api.delete(`/users/${user._id}`);
      setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));
    } catch (error) {
      console.error("Failed to delete user", error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to delete user.',
        buttonText: 'Try again'
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const name = user.username || user.fullName || '';
    const email = user.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
    const isTeacher = user.role === 'Teacher';
    const matchesType = userTypeFilter === 'All' ||
      (userTypeFilter === 'Staff' && !isTeacher) ||
      (userTypeFilter === 'Teachers' && isTeacher);
    return matchesSearch && matchesType;
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Users...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-800 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <UserCircle size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">System Users</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Access Control & Identity Management Hub</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all active:scale-95 border border-slate-700"
        >
          <Plus size={18} strokeWidth={3} /> Add New User
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        {/* Search & Tabs */}
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'All', label: 'All Users' },
              { id: 'Staff', label: 'System Staff' },
              { id: 'Teachers', label: 'Teachers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setUserTypeFilter(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  userTypeFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-brand-500 shadow-md'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">Username</th>
                <th className="px-10 py-6">Email</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6">Roles</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-12 text-center text-slate-400 font-semibold text-sm">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-black uppercase">
                          {(user.username || user.fullName || 'U').charAt(0)}
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {user.username || user.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-slate-600 dark:text-slate-300 font-medium text-xs">
                      {user.email}
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      {user.role === 'Teacher' ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/40 text-purple-600 border border-purple-200 shadow-sm">
                          Teacher
                        </span>
                      ) : (
                        user.roles?.map(r => (
                          <span key={r._id || r} className="inline-flex items-center px-3 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mr-2 mb-1 shadow-sm">
                            {r.name || 'Role'}
                          </span>
                        ))
                      )}
                    </td>
                    <td className="px-10 py-8 text-right relative overflow-visible">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-600 transition-all shadow-sm active:scale-90"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user)}
                          className={`p-3 border rounded-xl transition-all shadow-sm active:scale-90 ${user.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600'
                            }`}
                          title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-in zoom-in-95 duration-500 my-auto">
            <div className="px-12 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <UserCircle size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{editingUser ? 'Edit User' : 'New User'}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{editingUser ? 'Modify User Details' : 'Onboard System Access'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"><X size={20} strokeWidth={2.5} /></button>
            </div>

            <form onSubmit={handleSave} className="px-12 py-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Email</label>
                  <input required type="email" placeholder="john@example.com" className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-[20px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Username</label>
                  <input required type="text" placeholder="johndoe" className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-[20px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Password {editingUser && '(Leave empty to keep)'}</label>
                  <input type="password" required={!editingUser} placeholder="••••••••" className="w-full px-5 py-4 bg-white dark:bg-slate-800 rounded-[20px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all shadow-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                <button type="submit" className="px-10 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
