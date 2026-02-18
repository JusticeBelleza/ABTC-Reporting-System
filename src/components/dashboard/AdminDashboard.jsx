import React, { useState, useEffect } from 'react';
import { Users, Layers, Plus, Hospital, Stethoscope, Building2, Clock, Archive, RefreshCcw, Trash2, AlertTriangle, X } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { MONTHS, QUARTERS } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function AdminDashboard({ 
  onViewConsolidated, 
  onSelectFacility, 
  onManageUsers, 
  onAddFacility,
  periodType, setPeriodType,
  year, setYear,
  month, setMonth,
  quarter, setQuarter,
  availableYears, availableMonths,
  initiateDeleteFacility 
}) {
  const { facilities, user, facilityBarangays } = useApp();
  
  const [facilityMeta, setFacilityMeta] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [facilityOwners, setFacilityOwners] = useState({});
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    action: null, // 'archive' | 'restore' | 'delete'
    facility: null 
  });
  
  const { facilityStatuses, fetchFacilityStatuses } = useReportData({
    user, 
    facilities, 
    facilityBarangays: facilityBarangays || {}, 
    year, 
    month, 
    quarter, 
    periodType, 
    activeTab: 'main', 
    adminViewMode: 'dashboard'
  });

  const fetchFacilityMeta = async () => {
    try {
      const { data } = await supabase.from('facilities').select('name, status');
      if (data) setFacilityMeta(data);
    } catch (err) {
      console.error("Error fetching facility meta", err);
    }
  };

  // Fetch profiles to map Facilities -> User Names
  useEffect(() => {
    const fetchFacilityOwners = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('facility_name, full_name');
        
        if (data) {
          const mapping = {};
          data.forEach(u => {
            if (u.facility_name) {
              mapping[u.facility_name] = u.full_name;
            }
          });
          setFacilityOwners(mapping);
        }
      } catch (error) {
        console.error("Error fetching facility owners:", error);
      }
    };

    fetchFacilityOwners();
  }, [facilities]); // Re-run if facilities list changes, though usually static

  useEffect(() => {
    fetchFacilityMeta();
  }, [facilities]);

  const requestAction = (e, facility, action) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, action, facility });
  };

  const handleConfirmAction = async () => {
    const { action, facility } = confirmModal;
    setConfirmModal({ isOpen: false, action: null, facility: null });

    if (action === 'delete') {
        initiateDeleteFacility(facility);
        return;
    }

    const newStatus = action === 'restore' ? 'Active' : 'Archived';
    
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ status: newStatus })
        .eq('name', facility);

      if (error) throw error;
      
      toast.success(`Facility ${newStatus === 'Active' ? 'restored' : 'archived'} successfully`);
      fetchFacilityMeta();
    } catch (err) {
      toast.error(`Failed to ${action} facility`);
      console.error(err);
    }
  };

  const displayedFacilities = facilities.filter(f => {
    const meta = facilityMeta.find(m => m.name === f);
    const status = meta?.status || 'Active'; 
    return showArchived ? status === 'Archived' : status === 'Active';
  });

  return (
    <div className="max-w-6xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
        
        {/* Custom Confirmation Modal Overlay */}
        {confirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                    <div className="p-6 text-center">
                        <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.action === 'delete' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                            {confirmModal.action === 'delete' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2 capitalize">
                            {confirmModal.action} Facility?
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to <strong>{confirmModal.action}</strong> the facility <span className="text-zinc-900 font-medium">"{confirmModal.facility}"</span>?
                            {confirmModal.action === 'archive' && " It will be hidden from the main dashboard."}
                            {confirmModal.action === 'delete' && " This action cannot be undone."}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setConfirmModal({ isOpen: false, action: null, facility: null })}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmAction}
                                className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition ${confirmModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Top Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">Overview of facility submissions</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowArchived(!showArchived)} className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors ${showArchived ? 'bg-zinc-800 text-white' : 'bg-white border border-gray-200 text-zinc-600 hover:bg-gray-50'}`}>
                {showArchived ? <RefreshCcw size={16} /> : <Archive size={16} />}
                {showArchived ? 'View Active' : 'View Archived'}
            </button>
            <button onClick={onAddFacility} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700">
                <Plus size={16} /> Add Facility
            </button>
            <button onClick={onManageUsers} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700">
                <Users size={16} /> Users
            </button>
            <button onClick={onViewConsolidated} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2">
                <Layers size={16} /> Consolidated
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 inline-flex items-center gap-2">
          <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-900 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
          </select>
          <div className="w-px h-4 bg-gray-200"></div>
          
          {periodType === 'Monthly' && (
            <select value={month} onChange={e => setMonth(e.target.value)} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">
                {availableMonths.map(m => <option key={m}>{m}</option>)}
            </select>
          )}
          
          {periodType === 'Quarterly' && (
            <select value={quarter} onChange={e => setQuarter(e.target.value)} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">
                {QUARTERS.map(q => <option key={q}>{q}</option>)}
            </select>
          )}
          
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">
            {availableYears.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        
        {showArchived && (
          <div className="mb-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <Archive size={18} />
            <span className="text-sm font-medium">Viewing Archived Facilities - Restore them to enable reporting.</span>
          </div>
        )}

        {/* Facility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedFacilities.map(f => {
            const { main, cohort, lastUpdated } = facilityStatuses[f] || { main: 'Draft', cohort: 'Draft', lastUpdated: null };
            const type = f.includes("Hospital") || f === 'APH' ? 'Hospital' : (f.includes("Clinic") || f === 'AMDC' ? 'Clinic' : 'RHU');
            
            // Determine Facility Status for Badge
            const meta = facilityMeta.find(m => m.name === f);
            const isArchived = meta?.status === 'Archived';
            const facilityStatusLabel = isArchived ? 'Disabled' : 'Active';

            // Get owner name
            const ownerName = facilityOwners[f];

            return (
              <div key={f} className={`p-5 rounded-xl border transition-all group cursor-pointer flex flex-col h-full ${showArchived ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`} onClick={() => !showArchived && onSelectFacility(f)}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg transition-colors ${showArchived ? 'bg-gray-200 text-gray-500' : 'bg-gray-50 text-gray-600 group-hover:bg-zinc-900 group-hover:text-white'}`}>
                    {type === 'Hospital' ? <Hospital size={20}/> : (type === 'Clinic' ? <Stethoscope size={20}/> : <Building2 size={20}/>)}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {/* Facility Status Badge */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status</span>
                        <StatusBadge status={facilityStatusLabel} />
                    </div>

                    {/* Report Status Badges */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Form 1</span>
                        {periodType === 'Monthly' && <StatusBadge status={main} />}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cohort</span>
                        {periodType === 'Monthly' && <StatusBadge status={cohort} />}
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-zinc-900 mb-1">{f}</h3>
                <p className="text-xs text-gray-500 mb-2">Report for {periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</p>
                
                {/* User Name Display */}
                <div className="mb-4 flex items-center gap-1 text-xs">
                    <span className="font-medium text-gray-400">User:</span>
                    <span className="text-zinc-700 font-medium truncate" title={ownerName || 'Unassigned'}>
                        {ownerName || <span className="italic text-gray-400 font-normal">Unassigned</span>}
                    </span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${showArchived ? 'text-gray-400' : 'text-blue-600 group-hover:underline'}`}>
                      {showArchived ? 'Archived' : 'View Report'}
                    </span>
                    
                    <div className="flex gap-2">
                      <button 
                          onClick={(e) => requestAction(e, f, showArchived ? 'restore' : 'archive')} 
                          className={`transition p-1.5 rounded-md ${showArchived ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:text-amber-600 hover:bg-amber-50'}`}
                          title={showArchived ? "Restore Facility" : "Archive Facility"}
                      >
                          {showArchived ? <RefreshCcw size={14} /> : <Archive size={14} />}
                      </button>

                      <button 
                          onClick={(e) => requestAction(e, f, 'delete')} 
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition p-1.5 rounded-md"
                          title="Delete Facility Permanently"
                      >
                          <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {lastUpdated && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock size={10} />
                        <span>Updated: {new Date(lastUpdated).toLocaleDateString('en-PH')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {displayedFacilities.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">No {showArchived ? 'archived' : 'active'} facilities found.</p>
             </div>
          )}
        </div>
    </div>
  );
}