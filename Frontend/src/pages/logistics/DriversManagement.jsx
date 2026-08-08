import React, { useState, useEffect } from 'react';
import { Users, Phone, FileText, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const DriversManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    name: '', phone: '', licenseNumber: '', status: 'Active', assignedVehicle: ''
  });

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      // Only get available vehicles, or show all but let user pick? 
      // User said "must assign vehicles" so we fetch all of them.
      setVehicles(data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/drivers');
      setDrivers(data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await api.put(`/drivers/${editingDriver._id}`, formData);
      } else {
        await api.post('/drivers', formData);
      }
      closeModal();
      fetchDrivers();
      fetchVehicles();
    } catch (error) {
      console.error(editingDriver ? 'Error updating driver:' : 'Error creating driver:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || (editingDriver ? 'Failed to update driver.' : 'Failed to create driver.'),
        buttonText: 'Try again'
      });
    }
  };

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData({ name: '', phone: '', licenseNumber: '', status: 'Active', assignedVehicle: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      status: driver.status || 'Active',
      assignedVehicle: driver.assignedVehicle?._id || driver.assignedVehicle || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
      setFormData({ name: '', phone: '', licenseNumber: '', status: 'Active', assignedVehicle: '' });
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete driver?',
      message: 'Are you sure you want to delete this driver?',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting driver:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to delete driver.',
        buttonText: 'Try again'
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Drivers Registry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage delivery personnel and their details.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Driver
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">License Number</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading drivers...</td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No drivers registered.</td>
                </tr>
              ) : (
                drivers.map(driver => (
                  <tr key={driver._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {driver.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {driver.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {driver.licenseNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-sm font-medium">
                      {driver.assignedVehicle ? (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                          {driver.assignedVehicle.vehicleNumber} ({driver.assignedVehicle.type})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        driver.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                      }`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(driver)} className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors" title="Edit driver">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(driver._id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-xl shadow-brand-600/20">
                  {editingDriver ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-500">Driver Registry</p>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
                </div>
              </div>
              <button onClick={closeModal} className="p-3 rounded-2xl text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-900 shadow-sm transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input 
                  type="text" required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input 
                  type="text" required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">License Number</label>
                <input 
                  type="text" required
                  value={formData.licenseNumber}
                  onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign Vehicle</label>
                <select 
                  required
                  value={formData.assignedVehicle}
                  onChange={e => setFormData({...formData, assignedVehicle: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                >
                  <option value="" disabled>Select a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.vehicleNumber} - {v.type} {v.capacity ? `(${v.capacity})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors">
                  {editingDriver ? 'Update Driver' : 'Save Driver'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversManagement;
