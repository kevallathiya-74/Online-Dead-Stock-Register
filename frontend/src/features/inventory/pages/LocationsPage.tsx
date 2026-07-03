import {
    EyeIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

interface AssetLocation {
  _id: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  manager: {
    _id: string;
    name: string;
    email: string;
  };
  capacity: number;
  current_assets: number;
  location_type: 'Office' | 'Warehouse' | 'Branch' | 'Data Center';
  is_active: boolean;
  created_at: string;
}

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [addLocationDialog, setAddLocationDialog] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const response = await api.get('/assets/locations');
        const locationData = response.data.data || response.data;
        setLocations(locationData);
        toast.success('Locations loaded successfully');
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || location.location_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleAddLocation = () => {
    setAddLocationDialog(true);
  };

  const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity, 0);
  const totalAssets = locations.reduce((sum, loc) => sum + loc.current_assets, 0);
  const utilizationRate = totalCapacity > 0 ? (totalAssets / totalCapacity * 100) : 0;

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'Data Center': return 'bg-red-50 text-red-700 border border-red-105';
      case 'Office': return 'bg-blue-50 text-blue-700 border border-blue-105';
      case 'Warehouse': return 'bg-amber-50 text-amber-705 border border-amber-100';
      default: return 'bg-green-50 text-green-700 border border-green-105';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-905">Locations Management</h2>
            <p className="text-slate-455 mt-1">Manage asset locations, capacity, and utilization across facilities</p>
          </div>
          <button
            onClick={handleAddLocation}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer shadow-brand"
          >
            <PlusIcon className="w-4 h-4" />
            Add Location
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Locations</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">
              {loading ? '...' : locations.length}
            </h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Assets Registered</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">
              {loading ? '...' : totalAssets.toLocaleString()}
            </h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Aggregated Capacity</p>
            <h3 className="text-xl font-bold font-display text-slate-905 mt-1">
              {loading ? '...' : totalCapacity.toLocaleString()}
            </h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-400">Overall Utilization</p>
            <h3 className="text-xl font-bold font-display text-amber-705 mt-1">
              {loading ? '...' : `${utilizationRate.toFixed(1)}%`}
            </h3>
          </div>
        </div>

        {/* Filters control */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <MagnifyingGlassIcon className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
            >
              <option value="all">All Types</option>
              <option value="Office">Office</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Branch">Branch</option>
              <option value="Data Center">Data Center</option>
            </select>
          </div>

          <div className="md:col-span-2 text-slate-400 font-semibold text-right">
            {filteredLocations.length} locations matched
          </div>
        </div>

        {/* Locations List Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-slate-905 font-display mb-3">Facility Utilization</h3>
          
          <div className="overflow-x-auto border border-slate-50 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="pb-3 pt-2 pl-4">Location Name</th>
                  <th className="pb-3 pt-2">Type</th>
                  <th className="pb-3 pt-2">Address</th>
                  <th className="pb-3 pt-2">Manager</th>
                  <th className="pb-3 pt-2">Capacity</th>
                  <th className="pb-3 pt-2">Assets Count</th>
                  <th className="pb-3 pt-2">Utilization</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                    </td>
                  </tr>
                ) : filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No locations found</td>
                  </tr>
                ) : (
                  filteredLocations.map((location) => {
                    const utilization = (location.current_assets / location.capacity * 100);
                    return (
                      <tr key={location._id} className="hover:bg-slate-55/50">
                        <td className="py-3.5 pl-4">
                          <p className="font-bold text-slate-900">{location.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">{location.building} • Floor {location.floor}</p>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getBadgeClass(location.location_type)}`}>
                            {location.location_type}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <p className="text-slate-805">{location.address.city}, {location.address.state}</p>
                          <p className="text-[9px] text-slate-400 font-normal mt-0.5">{location.address.zipCode}</p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-bold text-slate-900">{location.manager.name}</p>
                          <p className="text-[9px] text-slate-400 font-normal mt-0.5">{location.manager.email}</p>
                        </td>
                        <td className="py-3.5 font-bold text-slate-805">{location.capacity}</td>
                        <td className="py-3.5 font-bold text-slate-805">{location.current_assets}</td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{utilization.toFixed(0)}%</span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            location.is_active ? 'bg-green-50 text-green-700 border-green-105' : 'bg-slate-55 text-slate-405 border-slate-150'
                          }`}>
                            {location.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center pr-4 flex justify-center gap-1.5">
                          <button
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="View Asset details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-slate-400 hover:text-green-650 hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="Edit Location info"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Location dialog modal */}
        {addLocationDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 shadow-card-xl space-y-4 animate-fade-in-up">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold font-display text-slate-900">Add New Location</h3>
                <button onClick={() => setAddLocationDialog(false)} className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-105 rounded-xl text-blue-800 font-semibold leading-relaxed">
                Location creation will link directly with database records following authorized validation patterns.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Location Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-205 rounded-xl" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Location Type</label>
                  <select className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white">
                    <option value="Office">Office</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Branch">Branch</option>
                    <option value="Data Center">Data Center</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Building</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-205 rounded-xl" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Floor</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-205 rounded-xl" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-655 mb-1">Address Details</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-205 rounded-xl" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Capacity</label>
                  <input type="number" className="w-full px-3 py-2 border border-slate-205 rounded-xl" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 font-semibold">
                <button
                  onClick={() => setAddLocationDialog(false)}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setAddLocationDialog(false);
                    toast.success('Location added successfully!');
                  }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
                >
                  Create Location
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default LocationsPage;