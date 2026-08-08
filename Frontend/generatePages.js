import fs from 'fs';
import path from 'path';

const pages = [
  { name: 'Branches', endpoint: '/branches', icon: 'Building2', singleName: 'Branch' },
  { name: 'Classes', endpoint: '/classes', icon: 'BookOpen', singleName: 'Class' },
  { name: 'Guardians', endpoint: '/guardians', icon: 'UserCheck', singleName: 'Guardian' },
  { name: 'Students', endpoint: '/students', icon: 'Users', singleName: 'Student' },
  { name: 'Payments', endpoint: '/payments', icon: 'Receipt', singleName: 'Payment' },
  { name: 'Salaries', endpoint: '/salaries', icon: 'CreditCard', singleName: 'Salary' },
  { name: 'StudentAttendance', endpoint: '/student-attendance', icon: 'CalendarCheck', singleName: 'Attendance' },
  { name: 'TeacherAttendance', endpoint: '/teacher-attendance', icon: 'CalendarCheck', singleName: 'Attendance' },
  { name: 'Expenses', endpoint: '/expenses', icon: 'ArrowDownRight', singleName: 'Expense' },
  { name: 'Transactions', endpoint: '/transactions', icon: 'ArrowUpRight', singleName: 'Transaction' },
  { name: 'Wallets', endpoint: '/wallets', icon: 'Wallet', singleName: 'Wallet' }
];

const template = (name, endpoint, icon, singleName) => `import React, { useState, useEffect } from 'react';
import { Plus, X, ArrowRight, Edit2, Trash2, ${icon} } from 'lucide-react';
import api from '../services/api';
import { useAlert } from '../components/common/alerts/useAlert';

const ${name}Management = () => {
  const { showAlert, showConfirm } = useAlert();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('${endpoint}');
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete?',
      message: 'Are you sure you want to delete this record? This cannot be undone.',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    try {
      await api.delete(\`${endpoint}/\${item._id}\`);
      setData(prev => prev.filter(i => i._id !== item._id));
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-brand-400 shadow-2xl border border-slate-700 ring-4 ring-brand-400/10">
            <${icon} size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">${name}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em] opacity-80">Management Hub</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl transition-all active:scale-95 border border-slate-700"
        >
          <Plus size={18} strokeWidth={3} /> Add New
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible">
        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-10 py-6">ID / Ref</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                  <td className="px-10 py-8 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item._id}
                  </td>
                  <td className="px-10 py-8 text-right relative overflow-visible">
                    <div className="flex justify-end items-center gap-2">
                      <button onClick={() => handleDelete(item)} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="2" className="px-10 py-8 text-center text-slate-500">No data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ${name}Management;
`;

pages.forEach(({ name, endpoint, icon, singleName }) => {
  const file = path.join('./src/pages', `${name}Management.jsx`);
  fs.writeFileSync(file, template(name, endpoint, icon, singleName));
  console.log(`Generated ${name}Management.jsx`);
});
