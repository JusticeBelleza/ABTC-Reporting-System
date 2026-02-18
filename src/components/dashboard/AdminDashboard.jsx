import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Plus, Search, 
  MapPin, Trash2, ExternalLink, RefreshCcw, Archive, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext'; 
import AddFacilityForm from './AddFacilityForm';
import UserManagementModal from '../modals/UserManagementModal';
import StatusBadge from './StatusBadge'; 

export default function AdminDashboard() {
  const { facilities: facilityNames, refreshFacilities } = useApp(); 
  const [facilities, setLocalFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchFacilitiesDetailed();
  }, [facilityNames]); 

  const fetchFacilitiesDetailed = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setLocalFacilities(data || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFacility = async ({ name, type, ownership, municipality, barangays }) => {
    setAdding(true);
    try {
      // FIX: Removed 'created_at' from here. Let the Database handle it.
      const { error } = await supabase
        .from('facilities')
        .insert([{ 
          name, 
          type,
          ownership,
          municipality, 
          status: 'Active',
          // Save the list of areas (Barangays OR Municipalities)
          catchment_area: barangays ? barangays.split(',').map(b => b.trim()) : []
        }]);

      if (error) throw error;
      
      await refreshFacilities(); 
      await fetchFacilitiesDetailed();

      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding facility:', error);
      alert(`Error adding facility: ${error.message || error.details || 'Unknown error'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    const action = newStatus === 'Active' ? 'restore' : 'archive';
    
    if (!confirm(`Are you sure you want to ${action} this facility?`)) return;

    try {
      const { error } = await supabase
        .from('facilities')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setLocalFacilities(facilities.map(f => 
        f.id === id ? { ...f, status: newStatus } : f
      ));
      
      refreshFacilities();

    } catch (error) {
      console.error(`Error ${action}ing facility:`, error);
      alert(`Error updating facility status.`);
    }
  };

  const filteredFacilities = facilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || f.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const activeFacilities = filteredFacilities.filter(f => f.status === 'Active' || !f.status);
  const disabledFacilities = filteredFacilities.filter(f => f.status === 'Disabled');

  const getFacilityIcon = (type) => {
    switch (type) {
      case 'Hospital': return <Building2 className="text-blue-500" />;
      case 'Clinic': return <Building2 className="text-green-500" />;
      default: return <Building2 className="text-zinc-900" />;
    }
  };

  const FacilityCard = ({ facility }) => (
    <div key={facility.id} className={`bg-white p-6 rounded-xl border shadow-sm transition group ${facility.status === 'Disabled' ? 'border-gray-100 bg-gray-50 opacity-75' : 'border-gray-100 hover:shadow-md'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition ${facility.status === 'Disabled' ? 'bg-gray-100 grayscale' : 'bg-gray-50 group-hover:bg-zinc-50'}`}>
            {getFacilityIcon(facility.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{facility.name}</h3>
            <div className="flex items-center gap-2">
               <p className="text-xs text-gray-500">{facility.type}</p>
               <StatusBadge status={facility.status || 'Active'} />
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => handleToggleStatus(facility.id, facility.status || 'Active')}
            className={`p-1.5 rounded-lg transition ${
              facility.status === 'Disabled' 
                ? 'text-green-600 hover:bg-green-50' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title={facility.status === 'Disabled' ? "Restore Facility" : "Archive Facility"}
          >
            {facility.status === 'Disabled' ? <RefreshCcw size={16} /> : <Archive size={16} />}
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={14} className="text-gray-400" />
          <span className="truncate">{facility.municipality || 'Province-wide'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={14} className="text-gray-400" />
          <span>{facility.catchment_area?.length || 0} Areas Covered</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Facilities</p>
              <h3 className="text-2xl font-bold mt-1">{activeFacilities.length}</h3>
            </div>
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Building2 size={20} className="text-zinc-900" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold mt-1">--</h3>
            </div>
            <button 
              onClick={() => setShowUserModal(true)}
              className="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition"
            >
              <Users size={20} className="text-zinc-900" />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Archived</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-400">{disabledFacilities.length}</h3>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <Archive size={20} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          >
            <option value="all">All Types</option>
            <option value="Rural Health Unit">RHU</option>
            <option value="Hospital">Hospital</option>
            <option value="Clinic">Clinic</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          Add Facility
        </button>
      </div>

      {/* Active List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          Active Facilities <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{activeFacilities.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeFacilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
          
          {activeFacilities.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No active facilities. Click "Add Facility" to start.
            </div>
          )}
        </div>
      </div>

      {/* Archived List */}
      {disabledFacilities.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
           <h2 className="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2">
            Archived / Disabled <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{disabledFacilities.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
            {disabledFacilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add New Facility</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <AddFacilityForm onAdd={handleAddFacility} loading={adding} />
          </div>
        </div>
      )}

      {showUserModal && (
        <UserManagementModal 
          isOpen={showUserModal} 
          onClose={() => setShowUserModal(false)} 
        />
      )}
    </div>
  );
}