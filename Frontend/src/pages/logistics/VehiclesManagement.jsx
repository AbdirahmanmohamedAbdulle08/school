import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, Edit2, Trash2, Truck, X } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const VehiclesManagement = () => {
  const { showAlert, showConfirm } = useAlert();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '', type: '', capacity: '', status: 'Available'
  });

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/drivers');
      setDrivers(data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle._id}`, formData);
      } else {
        await api.post('/vehicles', formData);
      }
      closeModal();
      fetchVehicles();
      fetchDrivers();
    } catch (error) {
      console.error(editingVehicle ? 'Error updating vehicle:' : 'Error creating vehicle:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || (editingVehicle ? 'Failed to update vehicle.' : 'Failed to create vehicle.'),
        buttonText: 'Try again'
      });
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({ vehicleNumber: '', type: '', capacity: '', status: 'Available' });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.vehicleNumber || '',
      type: vehicle.type || '',
      capacity: vehicle.capacity || '',
      status: vehicle.status || 'Available'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setFormData({ vehicleNumber: '', type: '', capacity: '', status: 'Available' });
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Delete vehicle?',
      message: 'Are you sure you want to delete this vehicle?',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: error.response?.data?.message || 'Failed to delete vehicle.',
        buttonText: 'Try again'
      });
    }
  };

  const getAssignedDriver = (vehicle) => {
    if (vehicle.defaultDriver?.name) return vehicle.defaultDriver;
    return drivers.find(driver => {
      const assignedVehicleId = driver.assignedVehicle?._id || driver.assignedVehicle;
      return assignedVehicleId === vehicle._id;
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Fleet Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage delivery vehicles, capacity, and availability.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Vehicle Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Default Driver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading fleet data...</td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No vehicles registered.</td>
                </tr>
              ) : (
                vehicles.map(vehicle => {
                  const assignedDriver = getAssignedDriver(vehicle);
                  return (
                  <tr key={vehicle._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        {vehicle.vehicleNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{vehicle.type}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{vehicle.capacity || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {assignedDriver?.name || <span className="text-slate-400 italic text-xs">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        vehicle.status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        vehicle.status === 'In Transit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(vehicle)} className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors" title="Edit vehicle">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(vehicle._id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
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
                  {editingVehicle ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-500">Fleet Registry</p>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                </div>
              </div>
              <button onClick={closeModal} className="p-3 rounded-2xl text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-900 shadow-sm transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle Plate / Number</label>
                <input 
                  type="text" required 
                  value={formData.vehicleNumber}
                  onChange={e => setFormData({...formData, vehicleNumber: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type (e.g., Delivery Van)</label>
                <input 
                  type="text" required
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
                <input 
                  type="text"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                >
                  <option value="Available">Available</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors">
                  {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
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

export default VehiclesManagement;
