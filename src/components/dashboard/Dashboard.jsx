import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Users, Save, AlertCircle, FileText, LogOut, CheckCircle, XCircle, Plus, 
  Layers, Loader2, PlusCircle, Trash2, MessageSquare, 
  User, Settings, FileDown, X, ArrowLeft, Github, AlertTriangle, 
  Hospital, Stethoscope, Building2
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase, adminHelperClient } from '../../lib/supabase';
import { 
  DEFAULT_FACILITIES, MUNICIPALITIES, MONTHS, QUARTERS, PDF_STYLES, INITIAL_FACILITY_BARANGAYS
} from '../../lib/constants';
import { downloadPDF } from '../../lib/utils';
import { useReportData } from '../../hooks/useReportData';

import NotificationBell from './NotificationBell';
import AddFacilityForm from './AddFacilityForm';
import { StatusBadge } from './StatusBadge';
import MainReportTable from '../reports/MainReportTable';
import CohortReportTable from '../reports/CohortReportTable';
import PrivacyModal from '../modals/PrivacyModal';
import TermsModal from '../modals/TermsModal';
import SettingsModal from '../modals/SettingsModal';
import ProfileModal from '../modals/ProfileModal';
import UserManagementModal from '../modals/UserManagementModal';
import ErrorBoundary from '../ErrorBoundary';

function DashboardContent({ user, facilities, setFacilities, facilityBarangays, setFacilityBarangays, onLogout, globalSettings, setGlobalSettings, userProfile, setUserProfile }) {
  // Minor Suggestion: Use PH Time for default Year/Month to ensure consistency across timezones
  const currentDate = useMemo(() => {
    try {
      return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    } catch (e) {
      return new Date(); // Fallback
    }
  }, []);
  
  const currentRealYear = currentDate.getFullYear();
  const currentRealMonth = currentDate.getMonth();
  const availableYears = useMemo(() => { const years = []; for (let y = 2024; y <= currentRealYear; y++) years.push(y); return years; }, [currentRealYear]);
  
  // UI State (View Controls)
  const [activeTab, setActiveTab] = useState('main'); 
  const [cohortSubTab, setCohortSubTab] = useState('cat2'); 
  const [year, setYear] = useState(currentRealYear);
  const [periodType, setPeriodType] = useState('Monthly'); 
  const [month, setMonth] = useState(MONTHS[currentRealMonth]);
  const [quarter, setQuarter] = useState("1st Quarter");
  const availableMonths = useMemo(() => (year === currentRealYear ? MONTHS.slice(0, currentRealMonth + 1) : MONTHS), [year, currentRealYear, currentRealMonth]);

  // Admin UI State
  const [adminViewMode, setAdminViewMode] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(null);
  
  // Modal UI State
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, rowKey: null });
  
  // Action UI State
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [isDeletingFacility, setIsDeletingFacility] = useState(false);
  const [deleteFacilityInput, setDeleteFacilityInput] = useState('');
  const [isAddingFacility, setIsAddingFacility] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null); 
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [facilityTypes, setFacilityTypes] = useState({}); 

  // --- Initialize Custom Hook ---
  const {
    data, cohortData, reportStatus, loading, isSaving, 
    facilityStatuses,
    currentRows, cohortRowsCat2, cohortRowsCat3, activeFacilityName, currentHostMunicipality,
    grandTotals, cohortTotals,
    visibleOtherMunicipalities, setVisibleOtherMunicipalities,
    visibleCat2, setVisibleCat2,
    visibleCat3, setVisibleCat3,
    fetchFacilityStatuses, handleChange, handleDeleteRow, handleSave, confirmDeleteReport: hookConfirmDeleteReport
  } = useReportData({
    user, facilities, facilityBarangays, year, month, quarter, periodType, activeTab, cohortSubTab, adminViewMode, selectedFacility
  });

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  // --- Facility Metadata Management (Kept in Dashboard as it's global app state) ---
  const fetchFacilitiesList = async () => {
    try {
      const { data } = await supabase.from('facilities').select('*');
      let combinedFacilities = [...DEFAULT_FACILITIES];
      let combinedBarangays = { ...INITIAL_FACILITY_BARANGAYS };
      let types = {};
      DEFAULT_FACILITIES.forEach(f => {
          if(f.includes("RHU")) types[f] = 'RHU';
          else if(f.includes("Hospital") || f === 'APH') types[f] = 'Hospital';
          else if(f.includes("Clinic") || f === 'AMDC') types[f] = 'Clinic';
          else types[f] = 'RHU'; 
      });
      if (data && data.length > 0) {
        const dbNames = data.map(f => f.name);
        const dbBarangays = {};
        data.forEach(f => { 
            if (f.barangays?.length > 0) dbBarangays[f.name] = f.barangays; 
            types[f.name] = f.type || 'RHU';
        });
        combinedFacilities = [...new Set([...combinedFacilities, ...dbNames])];
        combinedBarangays = { ...combinedBarangays, ...dbBarangays };
      }
      setFacilities(combinedFacilities);
      setFacilityBarangays(combinedBarangays);
      setFacilityTypes(types);
    } catch (err) {}
  };
  useEffect(() => { fetchFacilitiesList(); }, []);

  // --- Event Handlers ---

  const handleAddFacility = async (name, type, barangaysList) => {
    if (facilities.includes(name)) { toast.error('Name exists'); return; }
    setIsAddingFacility(true);
    try {
      let bArray = type === 'RHU' && barangaysList ? barangaysList.split(',').map(b => b.trim()).filter(b => b) : null;
      const { error } = await supabase.from('facilities').insert({ name, type, barangays: bArray });
      if (error) throw error;
      setFacilities(prev => [...prev, name]);
      if (bArray) setFacilityBarangays(prev => ({ ...prev, [name]: bArray }));
      setFacilityTypes(prev => ({ ...prev, [name]: type }));
      toast.success("Facility added"); setShowAddFacilityModal(false);
    } catch (err) { toast.error(err.message); }
    setIsAddingFacility(false);
  };

  const initiateDeleteFacility = (facilityName) => { setFacilityToDelete(facilityName); setDeleteFacilityInput(''); };
  const confirmDeleteFacility = async () => {
    if (deleteFacilityInput !== 'delete') { toast.error('Please type "delete" to confirm.'); return; }
    setIsDeletingFacility(true);
    try {
        await supabase.from('abtc_reports').delete().eq('facility', facilityToDelete);
        await supabase.from('abtc_cohort_reports').delete().eq('facility', facilityToDelete);
        const { error } = await supabase.from('facilities').delete().eq('name', facilityToDelete);
        if (error) throw error;
        setFacilities(prev => prev.filter(f => f !== facilityToDelete));
        setFacilityBarangays(prev => { const next = { ...prev }; delete next[facilityToDelete]; return next; });
        toast.success("Deleted"); setFacilityToDelete(null);
    } catch (err) { toast.error(err.message); }
    setIsDeletingFacility(false);
  };

  const confirmRejection = async () => { 
    if (!rejectionReason.trim()) { toast.error("Reason required"); return; } 
    setShowRejectModal(false); 
    const success = await handleSave('Rejected', rejectionReason);
    if(success && user.role === 'admin') {
      setAdminViewMode('dashboard'); setSelectedFacility(null); fetchFacilityStatuses();
    }
  };

  const onSaveClick = async (status) => {
      if (status === 'Rejected' && user.role === 'admin') { setRejectionReason(''); setShowRejectModal(true); return; }
      const success = await handleSave(status);
      if(success && user.role === 'admin' && (status === 'Approved')) {
        setAdminViewMode('dashboard'); setSelectedFacility(null); fetchFacilityStatuses();
      }
  };

  const onDeleteReportClick = async () => {
    setIsDeletingReport(true);
    await hookConfirmDeleteReport();
    setReportToDelete(null);
    setIsDeletingReport(false);
  };

  const getPreviousPeriodText = () => {
    if (periodType === 'Annual') return `Annual ${year - 1}`;
    if (periodType === 'Quarterly') { const idx = QUARTERS.indexOf(quarter); if (idx === 0) return `4th Quarter ${year - 1}`; return `${QUARTERS[idx - 1]} ${year}`; }
    const idx = MONTHS.indexOf(month); if (idx === 0) return `December ${year - 1}`; return `${MONTHS[idx - 1]} ${year}`;
  };

  const handleDownloadClick = async () => {
    setIsDownloadingPdf(true);
    const periodText = activeTab === 'cohort' 
        ? getPreviousPeriodText() 
        : (periodType === 'Monthly' ? `${month} ${year}` : (periodType === 'Quarterly' ? `${quarter} ${year}` : `Annual ${year}`));
    
    const suffix = activeTab === 'cohort' ? (cohortSubTab === 'cat2' ? '_Category_II' : '_Category_III') : '';
    const filename = `Report_${activeFacilityName.replace(/\s+/g,'_')}_${year}${suffix}.pdf`;

    await downloadPDF({
        type: activeTab,
        cohortType: cohortSubTab,
        filename,
        data: activeTab === 'main' ? data : cohortData,
        rowKeys: activeTab === 'main' ? currentRows : (cohortSubTab === 'cat2' ? cohortRowsCat2 : cohortRowsCat3),
        grandTotals,
        cohortTotals,
        periodText,
        facilityName: activeFacilityName,
        userProfile,
        globalSettings
    });
    setIsDownloadingPdf(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-zinc-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-zinc-900 text-white p-1.5 rounded-lg"><FileText size={18} strokeWidth={2}/></div>
             <span className="font-semibold tracking-tight text-sm md:text-lg">ABTC-Reporting System</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBell user={user} />
            <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
            {/* Profile Button with Hover */}
            <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-zinc-100 transition" onClick={() => setShowProfileModal(true)}>
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium leading-none">{userProfile?.full_name || user.fullName || user.name}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">{user.role}</div>
              </div>
              <div className="bg-gray-100 p-2 rounded-full text-gray-600"><User size={16}/></div>
            </div>
            {/* Settings Button with Hover */}
            <button onClick={() => setShowSettingsModal(true)} className="text-gray-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition"><Settings size={20} strokeWidth={1.5} /></button>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-600 p-2 transition ml-2"><LogOut size={20} strokeWidth={1.5} /></button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8" id="report-content">
        {user.role === 'admin' && adminViewMode === 'dashboard' && (
          <div className="max-w-6xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div><h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h2><p className="text-gray-500 text-sm mt-1">Overview of facility submissions and statuses</p></div>
                <div className="flex gap-3">
                  {/* Add Facility with BLUE hover */}
                  <button onClick={() => setShowAddFacilityModal(true)} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"><Plus size={16} /> Add Facility</button>
                  {/* Users with INDIGO hover */}
                  <button onClick={() => setShowManageUsers(true)} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"><Users size={16} /> Users</button>
                  <button onClick={() => setAdminViewMode('consolidated')} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2 transition"><Layers size={16} /> Consolidated</button>
                </div>
             </div>
             <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 inline-flex items-center gap-2">
                <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-900 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                <div className="w-px h-4 bg-gray-200"></div>
                {periodType === 'Monthly' && <select value={month} onChange={e => setMonth(e.target.value)} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">{availableMonths.map(m => <option key={m}>{m}</option>)}</select>}
                {periodType === 'Quarterly' && <select value={quarter} onChange={e => setQuarter(e.target.value)} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>}
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-transparent text-sm text-gray-600 p-2 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded-lg">{availableYears.map(y => <option key={y}>{y}</option>)}</select>
                <button onClick={fetchFacilityStatuses} className="ml-2 p-2 text-gray-400 hover:text-zinc-900 transition"><ArrowLeft size={14} className="rotate-180"/></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {facilities.map(f => (
                 <div key={f} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer" onClick={() => { setSelectedFacility(f); setAdminViewMode('review'); }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                          {facilityTypes[f] === 'Hospital' ? <Hospital size={20}/> : (facilityTypes[f] === 'Clinic' ? <Stethoscope size={20}/> : <Building2 size={20}/>)}
                      </div>
                      <StatusBadge status={facilityStatuses[f]} />
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-1">{f}</h3>
                    <p className="text-xs text-gray-500 mb-4">Report for {periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                       <span className="text-xs font-medium text-blue-600 group-hover:underline">View Report</span>
                       {user.role === 'admin' && <button onClick={(e) => { e.stopPropagation(); initiateDeleteFacility(f); }} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={14} /></button>}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
        {(user.role !== 'admin' || (user.role === 'admin' && (adminViewMode === 'review' || adminViewMode === 'consolidated'))) && (
          <div className="max-w-[1600px] mx-auto animate-in fade-in zoom-in duration-300">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
                <div className="flex items-center gap-4">
                  {user.role === 'admin' && <button onClick={() => { setAdminViewMode('dashboard'); setSelectedFacility(null); }} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"><ArrowLeft size={18}/></button>}
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                      {isConsolidatedView ? 'Consolidated Report' : `${activeFacilityName}`}
                      {!isConsolidatedView && !isAggregationMode && <StatusBadge status={reportStatus} />}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>{periodType}</span> &bull; <span>{periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                   <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm mr-4">
                      <button onClick={() => setActiveTab('main')} className={`px-4 py-1.5 text-sm font-medium rounded transition ${activeTab==='main'?'bg-zinc-900 text-white shadow':'text-gray-600 hover:bg-gray-50'}`}>ABTC Reporting</button>
                      <button onClick={() => setActiveTab('cohort')} className={`px-4 py-1.5 text-sm font-medium rounded transition ${activeTab==='cohort'?'bg-zinc-900 text-white shadow':'text-gray-600 hover:bg-gray-50'}`}>Cohort</button>
                   </div>
                   <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center shadow-sm">
                      <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-900 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                      <div className="w-px h-4 bg-gray-200"></div>
                      {periodType === 'Monthly' && <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{availableMonths.map(m => <option key={m}>{m}</option>)}</select>}
                      {periodType === 'Quarterly' && <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>}
                      <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{availableYears.map(y => <option key={y}>{y}</option>)}</select>
                   </div>
                   <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>
                   
                   {/* PDF Button with RED hover */}
                   <button disabled={isDownloadingPdf} onClick={handleDownloadClick} className="bg-white border border-gray-200 text-zinc-900 px-3 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition disabled:opacity-70 hover:bg-red-50 hover:text-red-700 hover:border-red-200">
                     {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} PDF
                   </button>

                   {!isConsolidatedView && !isAggregationMode && (
                     <>
                        {user.role === 'admin' ? (
                          <>
                            {/* Approve Button: Emerald Green Base with darker hover */}
                            <button onClick={() => onSaveClick('Approved')} disabled={loading || isSaving} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition disabled:opacity-50">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve</button>
                            {/* Reject Button: RED hover */}
                            <button onClick={() => onSaveClick('Rejected')} disabled={loading || isSaving} className="bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-700 shadow-sm flex items-center gap-2 transition disabled:opacity-50">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} Reject</button>
                            {reportStatus !== 'Draft' && <button onClick={() => setReportToDelete(true)} className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 shadow-sm flex items-center gap-2 transition ml-2" title="Delete Report Data"><Trash2 size={16}/></button>}
                          </>
                        ) : (
                          <>
                            <button onClick={() => onSaveClick('Draft')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save</button>
                            <button onClick={() => onSaveClick('Pending')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'Submit'}</button>
                          </>
                        )}
                     </>
                   )}
                </div>
             </div>
             
             <div className="overflow-x-auto shadow-sm rounded-xl bg-white border border-gray-200 print:shadow-none print:border-none" style={{...PDF_STYLES.container, ...PDF_STYLES.border}}>
               {activeTab === 'main' ? (
                 <MainReportTable 
                    data={data} rowKeys={currentRows} isConsolidated={isConsolidatedView} isAggregationMode={isAggregationMode} reportStatus={reportStatus} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality} 
                    visibleOtherMunicipalities={visibleOtherMunicipalities} setVisibleOtherMunicipalities={setVisibleOtherMunicipalities}
                    onChange={handleChange} onDeleteRow={(key) => setDeleteConfirmation({ isOpen: true, rowKey: key })} grandTotals={grandTotals} facilityBarangays={facilityBarangays}
                 />
               ) : (
                 <div className="p-4">
                   <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs italic rounded-lg border border-blue-100 flex items-center gap-2 no-print"><AlertCircle size={14} /><span><strong>Guide:</strong> You are currently viewing the Cohort Report. Please ensure you are reporting outcome data for the <u>previous period</u>: <strong>{getPreviousPeriodText()}</strong>.</span></div>
                   <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2 no-print">
                      <button onClick={() => setCohortSubTab('cat2')} className={`text-sm font-semibold pb-1 border-b-2 transition ${cohortSubTab==='cat2' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Category II</button>
                      <button onClick={() => setCohortSubTab('cat3')} className={`text-sm font-semibold pb-1 border-b-2 transition ${cohortSubTab==='cat3' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Category III</button>
                   </div>
                   <CohortReportTable 
                      subTab={cohortSubTab} data={cohortData} rowKeysCat2={cohortRowsCat2} rowKeysCat3={cohortRowsCat3} isConsolidated={isConsolidatedView} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality}
                      visibleCat2={visibleCat2} setVisibleCat2={setVisibleCat2} visibleCat3={visibleCat3} setVisibleCat3={setVisibleCat3}
                      onChange={handleChange} onDeleteRow={(key) => setDeleteConfirmation({ isOpen: true, rowKey: key })} cohortTotals={cohortTotals}
                   />
                 </div>
               )}
             </div>
          </div>
        )}
        
        {/* MODALS */}
        {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} globalSettings={globalSettings} onSaveGlobal={setGlobalSettings} userProfile={userProfile} onSaveProfile={setUserProfile} isAdmin={user.role === 'admin'} />}
        {showManageUsers && <UserManagementModal onClose={() => setShowManageUsers(false)} facilities={facilities} client={adminHelperClient} />}
        {showProfileModal && <ProfileModal userId={user.id} onClose={() => setShowProfileModal(false)} isSelf={true} />}
        {showAddFacilityModal && (<div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl w-full max-w-md"><div className="flex justify-between items-center mb-6"><h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900"><PlusCircle size={20}/> Add New Facility</h2><button onClick={() => setShowAddFacilityModal(false)} className="text-gray-400 hover:text-zinc-900"><X size={20} /></button></div><AddFacilityForm onAdd={handleAddFacility} loading={isAddingFacility} /></div></div>)}
        {showRejectModal && (<div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200"><div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-rose-600 flex items-center gap-2"><MessageSquare size={20}/> Reject Report</h2><button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-zinc-900"><X size={20}/></button></div><p className="text-gray-600 text-sm mb-4">Please provide a reason for rejecting this report.</p><textarea className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition" rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} autoFocus placeholder="e.g. Incomplete data for..."></textarea><div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition">Cancel</button><button onClick={confirmRejection} className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-sm font-medium transition">Confirm Rejection</button></div></div></div>)}
        {facilityToDelete && (<div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200"><div className="flex flex-col items-center text-center"><div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><AlertTriangle size={24} /></div><h3 className="text-lg font-bold text-gray-900">Delete Facility?</h3><p className="text-sm text-gray-500 mt-2 mb-4">This will remove <span className="font-semibold">{facilityToDelete}</span>. Type <span className="font-mono font-bold text-red-600">delete</span> to confirm.</p><input type="text" value={deleteFacilityInput} onChange={(e) => setDeleteFacilityInput(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 mb-4 text-center text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition" placeholder='Type "delete"' autoFocus /><div className="flex gap-3 w-full"><button onClick={() => setFacilityToDelete(null)} disabled={isDeletingFacility} className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button><button onClick={confirmDeleteFacility} disabled={isDeletingFacility || deleteFacilityInput !== 'delete'} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex justify-center items-center gap-2">{isDeletingFacility && <Loader2 size={14} className="animate-spin"/>} Confirm</button></div></div></div></div>)}
        {reportToDelete && (<div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200"><div className="flex flex-col items-center text-center"><div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><Trash2 size={24} /></div><h3 className="text-lg font-bold text-gray-900">Delete Report Data?</h3><p className="text-sm text-gray-500 mt-2 mb-6">Are you sure you want to delete all report data for <span className="font-semibold">{activeFacilityName}</span> for this period? This action cannot be undone.</p><div className="flex gap-3 w-full"><button onClick={() => setReportToDelete(null)} disabled={isDeletingReport} className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button><button onClick={onDeleteReportClick} disabled={isDeletingReport} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex justify-center items-center gap-2">{isDeletingReport && <Loader2 size={14} className="animate-spin"/>} Delete</button></div></div></div></div>)}
        {deleteConfirmation.isOpen && (<div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200"><div className="flex flex-col items-center text-center"><div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><AlertTriangle size={24} strokeWidth={2} /></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Remove Row?</h3><p className="text-sm text-gray-500 mb-6">Are you sure you want to remove the row for <span className="font-bold text-gray-800">{deleteConfirmation.rowKey}</span>? All data in this row will be cleared.</p><div className="flex gap-3 w-full"><button onClick={() => setDeleteConfirmation({isOpen: false, rowKey: null})} className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition border border-gray-200">Cancel</button><button onClick={() => { handleDeleteRow(deleteConfirmation.rowKey); setDeleteConfirmation({isOpen:false, rowKey:null}); }} className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition shadow-sm">Remove</button></div></div></div></div>)}
        
        {showPrivacyPolicy && <PrivacyModal onClose={() => setShowPrivacyPolicy(false)} />}
        {showTermsOfUse && <TermsModal onClose={() => setShowTermsOfUse(false)} />}
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto no-print">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 flex flex-col md:flex-row items-center gap-4">
            <span>&copy; 2026 Justice Belleza. Independent project.</span>
            <div className="hidden md:block w-px h-3 bg-gray-300"></div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowPrivacyPolicy(true)} className="hover:text-zinc-900 hover:underline transition">Privacy Policy</button>
              <button onClick={() => setShowTermsOfUse(true)} className="hover:text-zinc-900 hover:underline transition">Terms of Use</button>
              <a href="/images/System_Manual.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 hover:underline transition">User Manual</a>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500"><span>GitHub Profile →</span><a href="https://github.com/JusticeBelleza" target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-gray-100"><Github size={16} /></a></div>
        </div>
      </footer>
    </div>
  );
}

// PropTypes validation for Dashboard Content
DashboardContent.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.string,
    name: PropTypes.string,
    fullName: PropTypes.string
  }).isRequired,
  facilities: PropTypes.array.isRequired,
  setFacilities: PropTypes.func.isRequired,
  facilityBarangays: PropTypes.object.isRequired,
  setFacilityBarangays: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  globalSettings: PropTypes.object,
  setGlobalSettings: PropTypes.func,
  userProfile: PropTypes.object,
  setUserProfile: PropTypes.func
};

// Main Export with Error Boundary Wrapper
export default function Dashboard(props) {
  return (
    <ErrorBoundary>
      <DashboardContent {...props} />
    </ErrorBoundary>
  );
}