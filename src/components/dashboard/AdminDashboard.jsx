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
      // MODIFIED: Added 'type' and 'ownership' to the select query
      const { data } = await supabase.from('facilities').select('name, status, type, ownership');
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
  }, [facilities]); 

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
    <div className="max-w-7xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500 relative pb-12">
        
        {/* Custom Confirmation Modal Overlay */}
        {confirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
                    <div className="p-6 text-center">
                        <div className={`mx-auto mb-5 w-14 h-14 rounded-full flex items-center justify-center ${confirmModal.action === 'delete' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'} shadow-inner`}>
                            {confirmModal.action === 'delete' ? <Trash2 size={26} strokeWidth={2.5} /> : <AlertTriangle size={26} strokeWidth={2.5} />}
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2 capitalize tracking-tight">
                            {confirmModal.action} Facility?
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Are you sure you want to <strong>{confirmModal.action}</strong> the facility <span className="text-zinc-900 font-medium">"{confirmModal.facility}"</span>?
                            {confirmModal.action === 'archive' && " It will be hidden from the main dashboard."}
                            {confirmModal.action === 'delete' && " This action cannot be undone."}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setConfirmModal({ isOpen: false, action: null, facility: null })}
                                className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmAction}
                                className={`px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-sm ${confirmModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/20' : 'bg-zinc-900 hover:bg-zinc-800 hover:shadow-zinc-900/20'}`}
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Top Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1.5 font-medium">Manage and monitor facility submissions</p>
          </div>
          
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
            <button 
              onClick={() => setShowArchived(!showArchived)} 
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${showArchived ? 'bg-zinc-800 text-white shadow-md' : 'bg-white border border-gray-200 text-zinc-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'}`}
            >
                {showArchived ? <RefreshCcw size={16} /> : <Archive size={16} />}
                <span className="truncate">{showArchived ? 'View Active' : 'View Archived'}</span>
            </button>
            <button 
              onClick={onAddFacility} 
              className="bg-white border border-gray-200 text-zinc-700 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200"
            >
                <Plus size={16} /> <span className="truncate">Add Facility</span>
            </button>
            <button 
              onClick={onManageUsers} 
              className="bg-white border border-gray-200 text-zinc-700 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all duration-200"
            >
                <Users size={16} /> <span className="truncate">Manage Users</span>
            </button>
            <button 
              onClick={onViewConsolidated} 
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow-blue-600/20 flex items-center justify-center gap-2 transition-all duration-200"
            >
                <Layers size={16} /> <span className="truncate">Consolidated</span>
            </button>
          </div>
        </div>

        {/* Filters and Notices */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Pill-Style Date Filters */}
          <div className="bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 inline-flex flex-wrap items-center gap-1 w-fit shadow-inner">
            <select 
              value={periodType} 
              onChange={e => setPeriodType(e.target.value)} 
              className="bg-white text-sm font-semibold text-zinc-800 py-1.5 px-3 outline-none cursor-pointer rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annual">Annual</option>
            </select>
            
            {periodType === 'Monthly' && (
              <select 
                value={month} 
                onChange={e => setMonth(e.target.value)} 
                className="bg-transparent text-sm font-medium text-gray-600 py-1.5 px-3 outline-none cursor-pointer hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                  {availableMonths.map(m => <option key={m}>{m}</option>)}
              </select>
            )}
            
            {periodType === 'Quarterly' && (
              <select 
                value={quarter} 
                onChange={e => setQuarter(e.target.value)} 
                className="bg-transparent text-sm font-medium text-gray-600 py-1.5 px-3 outline-none cursor-pointer hover:bg-white hover:shadow-sm rounded-lg transition-all"
              >
                  {QUARTERS.map(q => <option key={q}>{q}</option>)}
              </select>
            )}
            
            <div className="w-px h-5 bg-gray-300 mx-1 hidden xs:block"></div>

            <select 
              value={year} 
              onChange={e => setYear(Number(e.target.value))} 
              className="bg-transparent text-sm font-medium text-gray-600 py-1.5 px-3 outline-none cursor-pointer hover:bg-white hover:shadow-sm rounded-lg transition-all"
            >
              {availableYears.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          {showArchived && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200/60 shadow-sm w-fit animate-in fade-in slide-in-from-left-2">
              <Archive size={16} className="text-amber-500" />
              <span className="text-sm font-semibold">Viewing Archived Facilities. Restore them to enable reporting.</span>
            </div>
          )}
        </div>

        {/* Facility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedFacilities.map(f => {
            const { main, cohort, lastUpdated } = facilityStatuses[f] || { main: 'Draft', cohort: 'Draft', lastUpdated: null };
            
            const meta = facilityMeta.find(m => m.name === f);
            const type = meta?.type || (f.includes("Hospital") || f === 'APH' ? 'Hospital' : (f.includes("Clinic") || f === 'AMDC' ? 'Clinic' : 'RHU'));
            const ownership = meta?.ownership || ((f === 'APH' || type === 'RHU') ? 'Government' : 'Private');
            const isArchived = meta?.status === 'Archived';
            
            const facilityStatusLabel = isArchived ? 'Disabled' : 'Active';
            const ownerName = facilityOwners[f];

            return (
              <div 
                key={f} 
                className={`group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden ${showArchived ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-100/60'}`} 
                onClick={() => !showArchived && onSelectFacility(f)}
              >
                {/* Decorative Top Accent Line on hover */}
                {!showArchived && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}

                <div className="flex justify-between items-start mb-5">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${showArchived ? 'bg-gray-200 text-gray-400' : 'bg-blue-50/50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md'}`}>
                    {type === 'Hospital' ? <Hospital size={24} strokeWidth={2}/> : (type === 'Clinic' ? <Stethoscope size={24} strokeWidth={2}/> : <Building2 size={24} strokeWidth={2}/>)}
                  </div>
                  
                  <div className="flex flex-col gap-1.5 items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status</span>
                        <StatusBadge status={facilityStatusLabel} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Form 1</span>
                        {periodType === 'Monthly' && <StatusBadge status={main} />}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cohort</span>
                        {periodType === 'Monthly' && <StatusBadge status={cohort} />}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider mb-3 ${ownership === 'Government' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {ownership}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 leading-tight break-words mb-1 group-hover:text-blue-700 transition-colors">{f}</h3>
                  <p className="text-sm text-gray-500 font-medium">Report for {periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</p>
                </div>
                
                <div className="mb-5 flex items-center gap-2 text-sm bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-zinc-700 font-medium truncate" title={ownerName || 'Unassigned'}>
                        {ownerName || <span className="italic text-gray-400 font-normal">No user assigned</span>}
                    </span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-sm font-semibold transition-colors ${showArchived ? 'text-gray-400' : 'text-blue-600 group-hover:text-blue-700'}`}>
                    {showArchived ? 'Archived Facility' : 'Open Report →'}
                  </span>
                  
                  <div className="flex gap-1.5">
                    <button 
                        onClick={(e) => requestAction(e, f, showArchived ? 'restore' : 'archive')} 
                        className={`transition p-2 rounded-lg border border-transparent ${showArchived ? 'text-green-600 hover:bg-green-50 hover:border-green-200' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200'}`}
                        title={showArchived ? "Restore" : "Archive"}
                    >
                        {showArchived ? <RefreshCcw size={16} /> : <Archive size={16} />}
                    </button>

                    <button 
                        onClick={(e) => requestAction(e, f, 'delete')} 
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition p-2 rounded-lg border border-transparent"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Last Updated Footer */}
                {lastUpdated && (
                  <div className="absolute top-4 right-1/2 translate-x-1/2 flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-white/80 backdrop-blur px-2 py-0.5 rounded-full border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm pointer-events-none">
                      <Clock size={10} />
                      <span>Updated {new Date(lastUpdated).toLocaleDateString('en-PH')}</span>
                  </div>
                )}
              </div>
            );
          })}
          
          {displayedFacilities.length === 0 && (
             <div className="col-span-full py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                  {showArchived ? <Archive size={24} className="text-gray-400" /> : <Hospital size={24} className="text-gray-400" />}
                </div>
                <h3 className="text-lg font-bold text-zinc-800 mb-1">No Facilities Found</h3>
                <p className="text-gray-500 text-sm">There are currently no {showArchived ? 'archived' : 'active'} facilities to display.</p>
             </div>
          )}
        </div>
    </div>
  );
}