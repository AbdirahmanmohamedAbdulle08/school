import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Truck, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../components/common/alerts/useAlert';

const ShipmentsList = () => {
  const { showAlert, showConfirm } = useAlert();
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data } = await api.get('/shipments');
      setShipments(data);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDelivered = async (id) => {
    const ok = await showConfirm({
      type: 'warning',
      title: 'Mark delivered?',
      message: 'Mark this shipment as Delivered?',
      confirmText: 'Mark delivered',
      cancelText: 'Cancel'
    });
    if (!ok) return;
    try {
      await api.put(`/shipments/${id}/status`, { status: 'Delivered' });
      fetchShipments();
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Uh oh!',
        message: 'Failed to update shipment status.',
        buttonText: 'Try again'
      });
    }
  };

  const filteredShipments = shipments.filter(s => 
    s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'In Transit': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'; // Pending
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckCircle className="w-4 h-4 mr-1.5" />;
      case 'In Transit': return <Truck className="w-4 h-4 mr-1.5" />;
      case 'Failed': return <Clock className="w-4 h-4 mr-1.5" />;
      default: return <Clock className="w-4 h-4 mr-1.5" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Shipments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage outbound logistics and deliveries.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Tracking No, Carrier, Address..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
            />
          </div>
          <button className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Shipment ID</th>
                <th className="py-3 px-4">Client / Destination</th>
                <th className="py-3 px-4">Driver & Vehicle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 hidden md:table-cell">ETA</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No shipments found.
                  </td>
                </tr>
              ) : (
                filteredShipments.map(shipment => (
                  <tr key={shipment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">#{shipment.trackingNumber}</div>
                      <div className="text-xs text-slate-500">{shipment.carrier}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-bold">{shipment.saleId?.customerName || 'Walk-in Client'}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{shipment.deliveryAddress || 'Address not specified'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{shipment.driverName || 'Unassigned'}</div>
                      <div className="text-xs text-slate-500">{shipment.vehiclePlate || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                        {getStatusIcon(shipment.status)}
                        {shipment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString() : 'Pending'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {shipment.status === 'In Transit' && (
                        <button 
                          onClick={() => handleMarkDelivered(shipment._id)}
                          className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium text-sm"
                        >
                          Mark Delivered
                        </button>
                      )}
                      <button className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 font-medium text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 flex justify-between items-center">
          <span>Showing {filteredShipments.length} records</span>
        </div>
      </div>
    </div>
  );
};

export default ShipmentsList;
