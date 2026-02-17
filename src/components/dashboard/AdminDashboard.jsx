import React from 'react';
import { Users, Layers, Plus, Hospital, Stethoscope, Building2, Clock, Trash2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { MONTHS, QUARTERS } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';

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
  
  // Fetch statuses for all facilities to display on cards
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

  return (
    <div className="max-w-6xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Top Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">Overview of facility submissions</p>
          </div>
          <div className="flex gap-3">
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
          
          {/* REMOVED: ArrowLeft button was here */}
        </div>

        {/* Facility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map(f => {
            const { main, cohort, lastUpdated } = facilityStatuses[f] || { main: 'Draft', cohort: 'Draft', lastUpdated: null };
            const type = f.includes("Hospital") || f === 'APH' ? 'Hospital' : (f.includes("Clinic") || f === 'AMDC' ? 'Clinic' : 'RHU');
            
            return (
              <div key={f} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer flex flex-col h-full" onClick={() => onSelectFacility(f)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    {type === 'Hospital' ? <Hospital size={20}/> : (type === 'Clinic' ? <Stethoscope size={20}/> : <Building2 size={20}/>)}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {/* Status Badges - Hidden if not Monthly */}
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
                <p className="text-xs text-gray-500 mb-4">Report for {periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600 group-hover:underline">View Report</span>
                    {/* Delete Facility Icon */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); initiateDeleteFacility(f); }} 
                        className="text-gray-300 hover:text-red-500 transition"
                        title="Delete Facility"
                    >
                        <Trash2 size={14} />
                    </button>
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
        </div>
    </div>
  );
}