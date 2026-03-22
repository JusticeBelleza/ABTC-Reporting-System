import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, FileDown, CheckCircle, XCircle, ArrowLeft, MessageSquare, X, Trash2, TrendingUp, ChevronRight, Clock, Archive, Building2, Layers, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { MONTHS, QUARTERS, PDF_STYLES } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';
import ModalPortal from '../modals/ModalPortal';
import { downloadPDF, hasData, hasCohortData, mapRowToDb, mapCohortRowToDb, toInt } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import MainReportTable from '../reports/MainReportTable';
import CohortReportTable from '../reports/CohortReportTable';
import { saveOfflineDraft, getOfflineDraft, clearOfflineDraft } from '../../lib/offlineDB';

export default function FacilityDashboard({
  periodType, setPeriodType,
  year, setYear,
  month, setMonth,
  quarter, setQuarter,
  availableYears, availableMonths,
  adminViewMode, selectedFacility, onBack,
  setReportToDelete,
  currentRealYear, currentRealMonthIdx 
}) {
  const { user, facilities, facilityBarangays, facilityDetails, globalSettings, userProfile } = useApp();
  const [activeTab, setActiveTab] = useState('main'); 
  const [cohortSubTab, setCohortSubTab] = useState('cat2'); 
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false); 
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); 
  const [showDraftModal, setShowDraftModal] = useState(false); 
  const [deleteRowConfirmation, setDeleteRowConfirmation] = useState({ isOpen: false, rowKey: null }); 
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isZeroSubmit, setIsZeroSubmit] = useState(false);

  const [statusModal, setStatusModal] = useState({ isOpen: false, status: null, reportType: 'main' });
  const [consolidatedModal, setConsolidatedModal] = useState({ isOpen: false, filter: null, reportType: 'main' });
  const [yearlyStats, setYearlyStats] = useState({ main: [], cohort: [] });

  // --- REAL-TIME OFFLINE DETECTION ---
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatQuarterName = (q) => {
      if (!q) return '';
      const qStr = q.toString().toLowerCase();
      if (qStr.includes('1')) return '1st Quarter';
      if (qStr.includes('2')) return '2nd Quarter';
      if (qStr.includes('3')) return '3rd Quarter';
      if (qStr.includes('4')) return '4th Quarter';
      return q;
  };

  const {
    data, cohortData, reportStatus, loading, isSaving, 
    currentRows, cohortRowsCat2, cohortRowsCat3, activeFacilityName, currentHostMunicipality,
    grandTotals, cohortTotals,
    visibleOtherMunicipalities, setVisibleOtherMunicipalities,
    visibleCat2, setVisibleCat2,
    visibleCat3, setVisibleCat3,
    fetchData, handleChange, handleSave, confirmDeleteReport, handleDeleteRow
  } = useReportData({
    user, facilities, facilityBarangays, year, month, quarter, periodType, activeTab, cohortSubTab, adminViewMode, selectedFacility
  });

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  // --- ADVANCED INDEXED-DB BACKGROUND AUTO-SYNC ---
  useEffect(() => {
    const checkOfflineDraft = async () => {
        const draft = await getOfflineDraft(); 
        if (draft && navigator.onLine) {
            try {
                toast.loading("🌐 Internet Restored! Auto-syncing offline data...", { id: 'offline-sync' });

                let payload = [];
                if (draft.activeTab === 'main') {
                    payload = Object.entries(draft.data).map(([m, row]) => {
                        if (!hasData(row)) return null; 
                        const dbRow = mapRowToDb(row);
                        delete dbRow.reported_by;
                        dbRow.others_count = row.othersCount === '' ? null : toInt(row.othersCount);  
                        if (row.othersSpec) dbRow.others_spec = row.othersSpec;
                        return { ...dbRow, municipality: m, status: 'Draft', remarks: row.remarks };
                    }).filter(x => x !== null);
                } else {
                    payload = Object.entries(draft.data).map(([m, row]) => {
                         const dbCohortRow = mapCohortRowToDb(row);
                         delete dbCohortRow.reported_by;
                         return { ...dbCohortRow, municipality: m, status: 'Draft' };
                    }).filter(x => x !== null);
                }

                const { error } = await supabase.rpc('save_report_atomic', { 
                    p_year: String(draft.year), 
                    p_month: String(draft.month), 
                    p_facility: draft.facility, 
                    p_type: draft.activeTab, 
                    p_data: payload 
                });

                if (error) throw error;

                await clearOfflineDraft(); 
                toast.success("Offline data automatically synced to the server!", { id: 'offline-sync' });
                fetchData(); 
            } catch (err) {
                toast.error("Auto-sync failed. Please save manually.", { id: 'offline-sync' });
            }
        }
    };
    
    window.addEventListener('online', checkOfflineDraft);
    checkOfflineDraft(); 
    return () => window.removeEventListener('online', checkOfflineDraft);
  }, [fetchData]);

  useEffect(() => {
    const fetchYearlyStats = async () => {
        if (!year) return;
        try {
            let mainQuery = supabase.from('abtc_reports').select('facility, month, status').eq('year', year);
            let cohortQuery = supabase.from('abtc_cohort_reports').select('facility, month, status').eq('year', year);
            if (!isConsolidatedView) {
                if (!activeFacilityName) return;
                mainQuery = mainQuery.eq('facility', activeFacilityName);
                cohortQuery = cohortQuery.eq('facility', activeFacilityName);
            }
            const [{ data: mainData }, { data: cohortData }] = await Promise.all([mainQuery, cohortQuery]);
            setYearlyStats({ main: mainData || [], cohort: cohortData || [] });
        } catch (error) { console.error("Error fetching yearly stats:", error); }
    };
    fetchYearlyStats();
  }, [activeFacilityName, year, isConsolidatedView, reportStatus]);

  const getMonthsByStatus = (statusType, reportType) => {
      const uniqueObj = {};
      yearlyStats[reportType].forEach(r => { if (!uniqueObj[r.month] || r.status === 'Approved') uniqueObj[r.month] = r.status; });
      return Object.entries(uniqueObj).filter(([m, status]) => status === statusType).map(([m]) => m).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
  };

  const isZeroReportActiveTab = activeTab === 'main' 
    ? currentRows.length > 0 && currentRows.every(key => key === "Others:" || !hasData(data[key]))
    : Object.keys(cohortData).length > 0 && Object.keys(cohortData).every(key => key === "Others:" || (!hasCohortData(cohortData[key], 'cat2') && !hasCohortData(cohortData[key], 'cat3')));
  
  const showZeroBanner = isZeroReportActiveTab && reportStatus !== 'Draft' && !loading;

  const buildMatrix = (reportType) => {
      const dedupedStats = {};
      yearlyStats[reportType].forEach(r => {
          const key = `${r.facility}_${r.month}`;
          if (!dedupedStats[key] || r.status === 'Approved') dedupedStats[key] = r;
      });
      const flatStats = Object.values(dedupedStats);

      return facilities.map(f => {
          const facStats = flatStats.filter(r => r.facility === f);
          const targetMonths = getTargetMonths();
          const mData = targetMonths.map(m => {
              const rec = facStats.find(r => r.month === m);
              return { month: m, status: rec ? rec.status : 'Not Submitted' };
          });
          const approvedCount = mData.filter(d => d.status === 'Approved').length;
          const submittedCount = mData.filter(d => d.status !== 'Not Submitted' && d.status !== 'Draft').length;
          
          return {
              facility: f, months: mData, approvedCount,
              complianceRate: Math.round((approvedCount / targetMonths.length) * 100),
              isFully: approvedCount === targetMonths.length,
              isZero: submittedCount === 0,
              isPartial: approvedCount < targetMonths.length && submittedCount > 0
          };
      }).sort((a, b) => b.complianceRate - a.complianceRate || a.facility.localeCompare(b.facility));
  };

  const getTargetMonths = () => {
      if (periodType === 'Monthly') return [month];
      if (periodType === 'Quarterly') {
          const qIdx = QUARTERS.indexOf(quarter);
          return [MONTHS[qIdx * 3], MONTHS[qIdx * 3 + 1], MONTHS[qIdx * 3 + 2]];
      }
      return MONTHS;
  };
  const targetMonths = getTargetMonths();

  const uniqueMainMonths = {};
  yearlyStats.main.forEach(r => { if (!uniqueMainMonths[r.month] || r.status === 'Approved') uniqueMainMonths[r.month] = r.status; });
  const mainStats = { approved: 0, pending: 0, rejected: 0, submitted: 0 };
  targetMonths.forEach(m => {
      const status = uniqueMainMonths[m];
      if (status === 'Approved') mainStats.approved++;
      else if (status === 'Pending') mainStats.pending++;
      else if (status === 'Rejected') mainStats.rejected++;
      if (status && status !== 'Draft' && status !== 'View Only') mainStats.submitted++;
  });
  const mainReportingRate = Math.round((mainStats.submitted / targetMonths.length) * 100) || 0;

  const uniqueCohortMonths = {};
  yearlyStats.cohort.forEach(r => { if (!uniqueCohortMonths[r.month] || r.status === 'Approved') uniqueCohortMonths[r.month] = r.status; });
  const cohortStats = { approved: 0, pending: 0, rejected: 0, submitted: 0 };
  targetMonths.forEach(m => {
      const status = uniqueCohortMonths[m];
      if (status === 'Approved') cohortStats.approved++;
      else if (status === 'Pending') cohortStats.pending++;
      else if (status === 'Rejected') cohortStats.rejected++;
      if (status && status !== 'Draft' && status !== 'View Only') cohortStats.submitted++;
  });
  const cohortReportingRate = Math.round((cohortStats.submitted / targetMonths.length) * 100) || 0;

  const mainMatrix = isConsolidatedView ? buildMatrix('main') : [];
  const cohortMatrix = isConsolidatedView ? buildMatrix('cohort') : [];

  const getAggregates = (matrix) => {
      if (!isConsolidatedView || matrix.length === 0) return { full: 0, partial: 0, zero: 0, rate: 0 };
      const totalApproved = matrix.reduce((sum, m) => sum + m.approvedCount, 0);
      return {
          full: matrix.filter(m => m.isFully).length,
          partial: matrix.filter(m => m.isPartial).length,
          zero: matrix.filter(m => m.isZero).length,
          rate: Math.round((totalApproved / (facilities.length * targetMonths.length)) * 100) || 0
      };
  };

  const mainAgg = getAggregates(mainMatrix);
  const cohortAgg = getAggregates(cohortMatrix);

  const getFilteredMatrix = () => {
      const matrix = consolidatedModal.reportType === 'main' ? mainMatrix : cohortMatrix;
      if (consolidatedModal.filter === 'full') return matrix.filter(m => m.isFully);
      if (consolidatedModal.filter === 'partial') return matrix.filter(m => m.isPartial);
      if (consolidatedModal.filter === 'zero') return matrix.filter(m => m.isZero);
      return matrix; 
  };

  const getLabels = () => {
      if (isConsolidatedView) {
          if (periodType === 'Monthly') return ['Facilities Approved', 'Facilities Pending', 'Not Submitted', 'Provincial Compliance'];
          return ['Fully Compliant', 'Partially Compliant', 'Zero Submissions', 'Average Compliance'];
      } else {
          if (periodType === 'Monthly') return ['Approved', 'Pending', 'Rejected', null]; 
          if (periodType === 'Quarterly') return ['Months Approved', 'Months Pending', 'Months Rejected', 'Quarterly Completion'];
          return ['Months Approved', 'Months Pending', 'Months Rejected', 'Annual Completion'];
      }
  };
  const [lblApproved, lblPending, lblRejected, lblCompletion] = getLabels();

  // --- SUBMISSION GUARDRAIL & OFFLINE BLOCKER ---
  const onSaveClick = async (status) => {
    if (!navigator.onLine) {
        if (status === 'Draft') {
            setShowDraftModal(true); 
            return;
        } else {
            toast.error("📴 No Internet Connection! You cannot submit or approve reports while offline. Please use 'Save Draft' to save your work locally.", { duration: 5000 });
            return;
        }
    }

    if (status === 'Rejected') { setRejectionReason(''); setShowRejectModal(true); return; }
    if (status === 'Approved') { setShowApproveModal(true); return; }
    if (status === 'Draft') { setShowDraftModal(true); return; } 
    
    // --- FIXED: COHORT MODAL NOW TRIGGERS PROPERLY ---
    if (status === 'Pending') { 
        if (activeTab === 'main') {
            let hasForm1Errors = false;
            for (const key of Object.keys(data)) {
                if (key === "Others:") continue;
                const row = data[key];
                if (!hasData(row)) continue;
                const sexSum = (Number(row.male) || 0) + (Number(row.female) || 0);
                const ageSum = (Number(row.ageLt15) || 0) + (Number(row.ageGt15) || 0);
                const cat23Sum = (Number(row.cat2) || 0) + (Number(row.cat3) || 0);
                const animalSum = (Number(row.dog) || 0) + (Number(row.cat) || 0) + (Number(row.othersCount) || 0);
                const washedCount = Number(row.washed) || 0;
                const hasAnyData = sexSum > 0 || ageSum > 0 || (Number(row.cat1)||0) > 0 || cat23Sum > 0 || animalSum > 0;
                if (hasAnyData && (sexSum !== ageSum || cat23Sum !== animalSum || washedCount > animalSum)) {
                    hasForm1Errors = true;
                    break;
                }
            }
            if (hasForm1Errors) {
                toast.error("DATA MISMATCH: Please check the RED highlighted cells to ensure your totals balance properly.", { duration: 6000 });
                setActiveTab('main'); 
                return;
            }
        }
        
        setIsZeroSubmit(isZeroReportActiveTab); 
        setShowSubmitModal(true); 
        return; 
    }
    
    await handleSave(status); 
    await clearOfflineDraft(); 
  };

  const confirmApprove = async () => { 
    setShowApproveModal(false); 
    await handleSave('Approved'); 
    await clearOfflineDraft(); 
  };

  const confirmRejection = async () => { 
    if (!rejectionReason.trim()) { toast.error("Reason required"); return; } 
    setShowRejectModal(false); 
    await handleSave('Rejected', rejectionReason); 
    await clearOfflineDraft(); 
  };

  const confirmSubmit = async () => { 
    setShowSubmitModal(false); 
    await handleSave('Pending'); 
    await clearOfflineDraft(); 
  };

  const confirmSaveDraft = async () => { 
    setShowDraftModal(false); 
    if (!navigator.onLine) {
        const offlinePayload = {
            facility: activeFacilityName, year, month, quarter, periodType,
            data: activeTab === 'main' ? data : cohortData, activeTab,
            timestamp: new Date().toISOString()
        };
        await saveOfflineDraft(offlinePayload);
        toast.warning("📴 Offline! Draft saved locally. It will automatically sync when internet is restored.", { duration: 8000 });
        return;
    }
    await handleSave('Draft'); 
    await clearOfflineDraft(); 
  };

  const handleDeleteReportClick = async () => { 
    setShowDeleteReportModal(false); 
    await confirmDeleteReport(); 
    await clearOfflineDraft();
  };

  const confirmDeleteRow = () => {
    if (deleteRowConfirmation.rowKey) {
        handleDeleteRow(deleteRowConfirmation.rowKey);
        setDeleteRowConfirmation({ isOpen: false, rowKey: null });
        toast.success("Row cleared");
    }
  };

  const getCurrentPeriodText = () => periodType === 'Annual' ? `Annual ${year}` : periodType === 'Quarterly' ? `${formatQuarterName(quarter)} ${year}` : `${month} ${year}`;
  const getPreviousPeriodText = () => {
    if (periodType === 'Annual') return `Annual ${year - 1}`;
    if (periodType === 'Quarterly') { const idx = QUARTERS.indexOf(quarter); return idx === 0 ? `4th Quarter ${year - 1}` : `${formatQuarterName(QUARTERS[idx - 1])} ${year}`; }
    const idx = MONTHS.indexOf(month); return idx === 0 ? `December ${year - 1}` : `${MONTHS[idx - 1]} ${year}`;
  };

  const confirmExportPdf = async () => {
    setShowExportModal(false);
    setIsDownloadingPdf(true);
    const currentPeriodText = getCurrentPeriodText();
    const periodText = activeTab === 'cohort' ? `${getPreviousPeriodText()} (Current Period: ${currentPeriodText})` : currentPeriodText;
    const suffix = activeTab === 'cohort' ? (cohortSubTab === 'cat2' ? '_Category_II' : '_Category_III') : '';
    const filename = `Report_${activeFacilityName.replace(/\s+/g,'_')}_${year}${suffix}.pdf`;
    
    const activeDetails = facilityDetails?.[activeFacilityName] || {};
    const hasBarangays = facilityBarangays[activeFacilityName] && facilityBarangays[activeFacilityName].length > 0;
    const keyToFilter = hasBarangays ? currentHostMunicipality : null;
    const exportRowKeys = activeTab === 'main' 
        ? currentRows.filter(k => k !== keyToFilter) 
        : (cohortSubTab === 'cat2' ? cohortRowsCat2 : cohortRowsCat3).filter(k => k !== keyToFilter);

    await downloadPDF({
        type: activeTab, cohortType: cohortSubTab, filename, data: activeTab === 'main' ? data : cohortData,
        rowKeys: exportRowKeys, 
        grandTotals, cohortTotals, periodText, facilityName: activeFacilityName, userProfile, globalSettings,
        isConsolidated: isConsolidatedView,
        facilityType: activeDetails.type || 'RHU',      
        facilityOwnership: activeDetails.ownership || 'Government'
    });
    setIsDownloadingPdf(false);
  };

  const currentDisplayPeriod = periodType === 'Monthly' ? month : periodType === 'Quarterly' ? formatQuarterName(quarter) : 'Annual';

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-300 pb-24 sm:pb-12 w-full px-2 sm:px-4">
        
        {/* --- MODALS --- */}
        {statusModal.isOpen && (
            <ModalPortal>
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-100">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center 
                                ${statusModal.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                                  statusModal.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                {statusModal.status === 'Approved' ? <CheckCircle size={20} strokeWidth={2.5}/> : 
                                 statusModal.status === 'Pending' ? <Clock size={20} strokeWidth={2.5}/> : <XCircle size={20} strokeWidth={2.5}/>}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                                    {statusModal.reportType === 'cohort' ? 'Cohort' : 'Form 1'} - {statusModal.status}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 truncate">{activeFacilityName} • {year}</p>
                            </div>
                        </div>
                        <button onClick={() => setStatusModal({ isOpen: false, status: null, reportType: 'main' })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                        {getMonthsByStatus(statusModal.status, statusModal.reportType).length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <Archive size={20} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600">No {statusModal.status.toLowerCase()} reports</p>
                                <p className="text-xs text-slate-400 mt-1">There are no months currently in this status for {year}.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 p-2">
                                {getMonthsByStatus(statusModal.status, statusModal.reportType).map(m => (
                                    <div key={m} onClick={() => { setStatusModal({ isOpen: false, status: null, reportType: 'main' }); setMonth(m); setPeriodType('Monthly'); }} className="group px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200 active:scale-[0.98] transition-all">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-bold text-sm text-slate-800 truncate group-hover:text-black transition-colors">{m} {year}</span>
                                            <span className="text-xs font-medium text-slate-500 truncate mt-0.5">Click to jump to this month's report</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-yellow-500 transition-colors shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {consolidatedModal.isOpen && (
            <ModalPortal>
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-100">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center bg-slate-900 text-yellow-400 shadow-sm">
                                <Layers size={20} strokeWidth={2.5}/> 
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                                    Compliance Leaderboard
                                </h3>
                                <p className="text-xs font-medium text-slate-500 truncate capitalize">
                                    {consolidatedModal.filter} Compliance • {getCurrentPeriodText()}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setConsolidatedModal({ isOpen: false, filter: null, reportType: 'main' })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-3 sm:p-4 custom-scrollbar flex-1 bg-slate-100/50">
                        {getFilteredMatrix().length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-200">
                                    <Archive size={20} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600">No facilities found</p>
                                <p className="text-xs text-slate-400 mt-1">There are no facilities matching this compliance filter.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {getFilteredMatrix().map(item => (
                                    <div key={item.facility} className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Building2 size={16} className="text-slate-400 shrink-0" />
                                                <span className="font-bold text-sm sm:text-base text-slate-800 truncate">{item.facility}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                <span className="text-xs font-bold text-slate-600">{item.approvedCount} / {targetMonths.length}</span>
                                                <span className={`text-xs font-black px-1.5 py-0.5 rounded ${item.complianceRate === 100 ? 'bg-emerald-100 text-emerald-700' : item.complianceRate > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.complianceRate}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.months.map(m => {
                                                const isApproved = m.status === 'Approved';
                                                const isPending = m.status === 'Pending';
                                                const isRejected = m.status === 'Rejected';
                                                return (
                                                    <div key={m.month} title={`${m.month}: ${m.status}`} className={`flex items-center justify-center px-2 py-1 text-[10px] sm:text-xs font-bold rounded-md border ${
                                                        isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                                                        isPending ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                                                        isRejected ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                                                        'bg-slate-100 border-slate-200 text-slate-400'
                                                    }`}>
                                                        {m.month.substring(0, 3).toUpperCase()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* --- HEADER --- */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 md:p-8 mb-6 mt-2 shadow-xl flex flex-col xl:flex-row xl:items-end justify-between gap-5 sm:gap-6 border border-slate-800 relative overflow-hidden no-print">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
            
            <div className="flex items-start gap-3 sm:gap-4 relative z-10 w-full xl:w-auto">
                {user.role === 'admin' && (
                    <button onClick={onBack} className="mt-1 p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-600 hover:shadow-md active:scale-90 transition-all duration-200 shrink-0">
                        <ArrowLeft size={20}/>
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <h2 className={`font-extrabold tracking-tight text-white flex flex-wrap items-center gap-2 sm:gap-3 leading-tight break-words
                        ${isConsolidatedView ? 'text-2xl sm:text-3xl' : activeFacilityName?.length > 50 ? 'text-lg sm:text-xl' : activeFacilityName?.length > 30 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}
                    >
                        <span>{isConsolidatedView ? 'Consolidated Report' : activeFacilityName}</span>
                        {!isConsolidatedView && !isAggregationMode && periodType === 'Monthly' && (
                            <div className="shrink-0 flex items-center shadow-sm"><StatusBadge status={reportStatus} /></div>
                        )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-slate-400">
                        <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 border border-slate-700">{periodType}</span> 
                        <span className="hidden sm:inline">&bull;</span> 
                        <span>{getCurrentPeriodText()}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 relative z-10 w-full xl:w-auto">
                <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 flex items-center shadow-inner w-full sm:w-auto">
                    <button onClick={() => setActiveTab('main')} className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg active:scale-95 transition-all duration-200 ${activeTab==='main'?'bg-slate-700 text-white shadow-sm border border-slate-600':'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>Form 1</button>
                    <button onClick={() => setActiveTab('cohort')} className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-lg active:scale-95 transition-all duration-200 ${activeTab==='cohort'?'bg-slate-700 text-white shadow-sm border border-slate-600':'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>Cohort</button>
                </div>
                
                <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between sm:justify-start gap-1 shadow-inner w-full sm:w-auto">
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="flex-1 sm:flex-none bg-slate-700 text-xs sm:text-sm font-semibold text-white py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer rounded-lg border border-slate-600 shadow-sm focus:ring-2 focus:ring-yellow-400/20 transition-all">
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                    </select>
                    <div className="w-px h-5 bg-slate-600 mx-1 hidden sm:block"></div>
                    
                    {periodType === 'Monthly' && (
                        <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="flex-1 sm:flex-none bg-transparent text-xs sm:text-sm font-medium text-slate-300 py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer hover:bg-slate-700 hover:text-white rounded-lg transition-all disabled:opacity-50">
                            {availableMonths.map((m) => {
                                const mIdx = MONTHS.indexOf(m);
                                const isFuture = year > currentRealYear || (year === currentRealYear && mIdx > currentRealMonthIdx);
                                return <option key={m} value={m} disabled={isFuture}>{m}</option>;
                            })}
                        </select>
                    )}
                    
                    {periodType === 'Quarterly' && (
                        <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="flex-1 sm:flex-none bg-transparent text-xs sm:text-sm font-medium text-slate-300 py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer hover:bg-slate-700 hover:text-white rounded-lg transition-all disabled:opacity-50">
                            {QUARTERS.map((q, idx) => {
                                const isFuture = year > currentRealYear || (year === currentRealYear && idx > Math.floor(currentRealMonthIdx / 3));
                                return <option key={q} value={q} disabled={isFuture}>{formatQuarterName(q)}</option>;
                            })}
                        </select>
                    )}
                    
                    <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="flex-1 sm:flex-none bg-transparent text-xs sm:text-sm font-medium text-slate-300 py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer hover:bg-slate-700 hover:text-white rounded-lg transition-all disabled:opacity-50">
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <button disabled={isDownloadingPdf || (!isConsolidatedView && !isAggregationMode && reportStatus !== 'Approved')} onClick={() => setShowExportModal(true)} title={(!isConsolidatedView && !isAggregationMode && reportStatus !== 'Approved') ? "Only Approved reports can be exported to PDF." : "Export PDF"} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-4 py-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white hover:border-slate-500">
                        {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} 
                        <span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">Export</span>
                    </button>
                    {!isConsolidatedView && !isAggregationMode && (
                        <div className="flex flex-1 sm:flex-none items-center gap-2 sm:gap-3 sm:pl-3 sm:border-l sm:border-slate-700">
                        {user.role === 'admin' ? (
                            <>
                            <button onClick={() => onSaveClick('Approved')} disabled={loading || isSaving || reportStatus === 'Approved' || reportStatus === 'Rejected' || reportStatus === 'Draft'} className="flex-1 sm:flex-none justify-center bg-yellow-400 text-black px-3 sm:px-5 py-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)] flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:shadow-none">
                                {isSaving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>} Approve
                            </button>
                            <button onClick={() => onSaveClick('Rejected')} disabled={loading || isSaving || reportStatus === 'Rejected' || reportStatus === 'Draft'} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-rose-400 px-3 sm:px-4 py-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-rose-600 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50">
                                {isSaving ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>} Reject
                            </button>
                            <button onClick={() => setShowDeleteReportModal(true)} disabled={loading || isSaving || reportStatus === 'Draft'} className="bg-slate-800 border border-slate-700 text-red-400 p-3 sm:p-2 rounded-xl hover:bg-red-600 hover:text-white flex items-center justify-center active:scale-90 transition-all duration-200 disabled:opacity-50 shrink-0">
                                <Trash2 size={16} />
                            </button>
                            </>
                        ) : (
                            <>
                            <button onClick={() => onSaveClick('Draft')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-3 sm:px-5 py-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-700 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50">
                                {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} <span className="hidden sm:inline">Save Draft</span><span className="sm:hidden">Draft</span>
                            </button>
                            <button onClick={() => onSaveClick('Pending')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center bg-yellow-400 text-black px-3 sm:px-5 py-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)] flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:shadow-none">
                                {isSaving ? <Loader2 size={14} className="animate-spin"/> : null} Submit <span className="hidden sm:inline">Report</span>
                            </button>
                            </>
                        )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- OFFLINE WARNING BANNER --- */}
        {isOffline && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 sm:px-5 sm:py-4 rounded-xl mb-6 flex items-start sm:items-center gap-3 sm:gap-4 shadow-sm animate-in slide-in-from-top-4 no-print">
                <div className="bg-amber-200/50 p-2 rounded-full shrink-0 mt-0.5 sm:mt-0">
                    <WifiOff size={20} className="text-amber-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-extrabold tracking-tight">You are currently offline.</p>
                    <p className="text-xs sm:text-sm font-medium text-amber-800/80 mt-0.5">
                        Don't panic! You can continue filling out the report. Click <strong className="text-amber-900">Save Draft</strong> below to securely store your work locally. It will auto-sync when your connection returns.
                    </p>
                </div>
            </div>
        )}

        {/* --- DYNAMIC KPI CARDS & YEARLY TRACKER --- */}
        <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500 no-print">
            {activeTab === 'main' && (
              <div>
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">
                    {isConsolidatedView ? `Form 1 Provincial Compliance (${getCurrentPeriodText()})` : `Form 1 Overview (${currentDisplayPeriod} ${year})`}
                </h3>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${periodType === 'Monthly' && !isConsolidatedView ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                    <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'full', reportType: 'main' }) : setStatusModal({ isOpen: true, status: 'Approved', reportType: 'main' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CheckCircle size={20} strokeWidth={2.5} /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblApproved}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? mainAgg.full : mainStats.approved}</p></div>
                    </div>
                    <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'partial', reportType: 'main' }) : setStatusModal({ isOpen: true, status: 'Pending', reportType: 'main' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-amber-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors"><Clock size={20} strokeWidth={2.5} /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblPending}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? mainAgg.partial : mainStats.pending}</p></div>
                    </div>
                    <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'zero', reportType: 'main' }) : setStatusModal({ isOpen: true, status: 'Rejected', reportType: 'main' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-rose-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors"><XCircle size={20} strokeWidth={2.5} /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblRejected}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? mainAgg.zero : mainStats.rejected}</p></div>
                    </div>
                    {lblCompletion && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-slate-400 transition-all duration-300 group">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all"><TrendingUp size={20} strokeWidth={2.5} /></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblCompletion}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? mainAgg.rate : mainReportingRate}%</p></div>
                        </div>
                    )}
                </div>

                {/* --- DYNAMIC SUBMISSION TRACKER --- */}
                {!isConsolidatedView && periodType !== 'Monthly' && (
                    <div className="mt-4 bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {periodType === 'Quarterly' ? `${formatQuarterName(quarter)} Submission Tracker (${year})` : `Yearly Submission Tracker (${year})`}
                        </p>
                        <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
                            {(periodType === 'Quarterly' ? targetMonths : MONTHS).map((m) => {
                                const status = uniqueMainMonths[m];
                                const isApproved = status === 'Approved';
                                const isPending = status === 'Pending';
                                const isRejected = status === 'Rejected';
                                
                                const monthActualIdx = MONTHS.indexOf(m);
                                const isFutureMonth = year > currentRealYear || (year === currentRealYear && monthActualIdx > currentRealMonthIdx);

                                return (
                                    <div 
                                        key={m} 
                                        onClick={() => { 
                                            if (isFutureMonth) return;
                                            setMonth(m); 
                                            setPeriodType('Monthly'); 
                                        }}
                                        className={`flex-1 flex items-center justify-center px-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg border transition-all duration-300 ${
                                            isFutureMonth 
                                                ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60' 
                                                : `cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                                                    isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 
                                                    isPending ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 
                                                    isRejected ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 
                                                    'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                                }`
                                        }`}
                                        title={isFutureMonth ? `${m}: Future month` : `${m}: ${status || 'Not Submitted'} (Click to view)`}
                                    >
                                        <span className="hidden sm:inline">{m.substring(0, 3).toUpperCase()}</span>
                                        <span className="sm:hidden">{m.substring(0, 1).toUpperCase()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
              </div>
            )}

            {activeTab === 'cohort' && (
              <div>
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">
                    {isConsolidatedView ? `Cohort Provincial Compliance (${getCurrentPeriodText()})` : `Cohort Overview (${currentDisplayPeriod} ${year})`}
                </h3>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${periodType === 'Monthly' && !isConsolidatedView ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                    <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'full', reportType: 'cohort' }) : setStatusModal({ isOpen: true, status: 'Approved', reportType: 'cohort' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CheckCircle size={20} strokeWidth={2.5} /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblApproved}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? cohortAgg.full : cohortStats.approved}</p></div>
                    </div>
                    <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'partial', reportType: 'cohort' }) : setStatusModal({ isOpen: true, status: 'Pending', reportType: 'cohort' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-amber-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors"><Clock size={20} strokeWidth={2.5} /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblPending}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? cohortAgg.partial : cohortStats.pending}</p></div>
                    </div>
                    <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'zero', reportType: 'cohort' }) : setStatusModal({ isOpen: true, status: 'Rejected', reportType: 'cohort' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-rose-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors"><XCircle size={20} strokeWidth={2.5} /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblRejected}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? cohortAgg.zero : cohortStats.rejected}</p></div>
                    </div>
                    {lblCompletion && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-slate-400 transition-all duration-300 group">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all"><TrendingUp size={20} strokeWidth={2.5} /></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblCompletion}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? cohortAgg.rate : cohortReportingRate}%</p></div>
                        </div>
                    )}
                </div>

                {/* --- DYNAMIC SUBMISSION TRACKER --- */}
                {!isConsolidatedView && periodType !== 'Monthly' && (
                    <div className="mt-4 bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {periodType === 'Quarterly' ? `${formatQuarterName(quarter)} Submission Tracker (${year})` : `Yearly Submission Tracker (${year})`}
                        </p>
                        <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
                            {(periodType === 'Quarterly' ? targetMonths : MONTHS).map((m) => {
                                const status = uniqueCohortMonths[m];
                                const isApproved = status === 'Approved';
                                const isPending = status === 'Pending';
                                const isRejected = status === 'Rejected';
                                
                                const monthActualIdx = MONTHS.indexOf(m);
                                const isFutureMonth = year > currentRealYear || (year === currentRealYear && monthActualIdx > currentRealMonthIdx);

                                return (
                                    <div 
                                        key={m} 
                                        onClick={() => { 
                                            if (isFutureMonth) return;
                                            setMonth(m); 
                                            setPeriodType('Monthly'); 
                                        }}
                                        className={`flex-1 flex items-center justify-center px-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg border transition-all duration-300 ${
                                            isFutureMonth 
                                                ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60' 
                                                : `cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                                                    isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 
                                                    isPending ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' : 
                                                    isRejected ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 
                                                    'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                                }`
                                        }`}
                                        title={isFutureMonth ? `${m}: Future month` : `${m}: ${status || 'Not Submitted'} (Click to view)`}
                                    >
                                        <span className="hidden sm:inline">{m.substring(0, 3).toUpperCase()}</span>
                                        <span className="sm:hidden">{m.substring(0, 1).toUpperCase()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
              </div>
            )}
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-none print:rounded-none print:shadow-none print:border-none relative w-full overflow-x-auto" style={{...PDF_STYLES.container}}>
            
            {showZeroBanner && (
                <div className="bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold py-2 sm:py-3 flex items-center justify-center gap-2 border-b border-rose-200 rounded-t-2xl no-print tracking-widest shadow-inner">
                    <AlertCircle size={18} strokeWidth={2.5} />
                    *** ZERO CASE REPORT ***
                </div>
            )}

            {activeTab === 'main' ? (
                <div className="min-w-fit">
                    <MainReportTable 
                        data={data} rowKeys={currentRows} isConsolidated={isConsolidatedView} isAggregationMode={isAggregationMode} reportStatus={reportStatus} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality} 
                        visibleOtherMunicipalities={visibleOtherMunicipalities} setVisibleOtherMunicipalities={setVisibleOtherMunicipalities}
                        onChange={handleChange} 
                        onDeleteRow={(key) => setDeleteRowConfirmation({ isOpen: true, rowKey: key })} 
                        grandTotals={grandTotals} facilityBarangays={facilityBarangays}
                    />
                </div>
            ) : (
                <div className="p-1 min-w-fit">
                    <div className="mb-4 sm:mb-6 mt-4 mx-2 sm:mx-4 p-3 sm:p-4 bg-slate-100 text-slate-800 text-xs sm:text-sm rounded-xl border border-slate-200 flex items-start sm:items-center gap-2 sm:gap-3 no-print shadow-sm">
                        <AlertCircle size={18} className="text-slate-600 shrink-0 mt-0.5 sm:mt-0" />
                        <span><strong>Guide:</strong> Viewing Cohort Report. Reporting for <u>previous period</u>: <strong>{getPreviousPeriodText()}</strong> (Current Period: <strong>{getCurrentPeriodText()}</strong>).</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 border-b border-gray-200 no-print px-4 sm:px-6">
                        <button onClick={() => setCohortSubTab('cat2')} className={`text-xs sm:text-sm font-bold pb-2 sm:pb-3 border-b-2 active:opacity-70 transition-all duration-200 ${cohortSubTab==='cat2' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}>
                            Category II Exposures
                        </button>
                        <button onClick={() => setCohortSubTab('cat3')} className={`text-xs sm:text-sm font-bold pb-2 sm:pb-3 border-b-2 active:opacity-70 transition-all duration-200 ${cohortSubTab==='cat3' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}>
                            Category III Exposures
                        </button>
                    </div>
                    
                    <CohortReportTable 
                        subTab={cohortSubTab} data={cohortData} rowKeysCat2={cohortRowsCat2} rowKeysCat3={cohortRowsCat3} isConsolidated={isConsolidatedView} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality}
                        visibleCat2={visibleCat2} setVisibleCat2={setVisibleCat2} visibleCat3={visibleCat3} setVisibleCat3={setVisibleCat3}
                        onChange={handleChange} 
                        onDeleteRow={(key) => setDeleteRowConfirmation({ isOpen: true, rowKey: key })} 
                        cohortTotals={cohortTotals}
                    />
                </div>
            )}
        </div>

        {/* --- EXPORT PDF CONFIRMATION MODAL --- */}
        {showExportModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-slate-100 p-4 rounded-full mb-5 text-slate-800 shadow-inner">
                            <FileDown size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Export to PDF?</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to download the <strong>{activeTab === 'main' ? 'Form 1' : 'Cohort'}</strong> report as a PDF document?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setShowExportModal(false)} disabled={isDownloadingPdf} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                                Cancel
                            </button>
                            <button onClick={confirmExportPdf} disabled={isDownloadingPdf} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-900 text-yellow-400 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2">
                                {isDownloadingPdf && <Loader2 size={16} className="animate-spin"/>} Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* --- DRAFT CONFIRMATION MODAL --- */}
        {showDraftModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-slate-100 p-4 rounded-full mb-5 text-slate-800 shadow-inner">
                            <Save size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Save as Draft?</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to save your current progress as a draft? You can return to edit it later before submitting.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setShowDraftModal(false)} disabled={isSaving} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                                Cancel
                            </button>
                            <button onClick={confirmSaveDraft} disabled={isSaving} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2">
                                {isSaving && <Loader2 size={16} className="animate-spin"/>} Save Draft
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* --- APPROVE CONFIRMATION MODAL --- */}
        {showApproveModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-emerald-50 p-4 rounded-full mb-5 text-emerald-600 shadow-inner">
                            <CheckCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Approve Report?</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to approve this report? Once approved, it will be included in the consolidated reporting.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setShowApproveModal(false)} disabled={isSaving} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                                Cancel
                            </button>
                            <button onClick={confirmApprove} disabled={isSaving} className="flex-1 py-3 sm:py-2.5 px-4 bg-yellow-400 text-black rounded-xl text-sm font-bold hover:bg-yellow-500 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2">
                                {isSaving && <Loader2 size={16} className="animate-spin"/>} Approve
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* --- SUBMIT CONFIRMATION MODAL --- */}
        {showSubmitModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className={`p-4 rounded-full mb-5 shadow-inner ${isZeroSubmit ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-800'}`}>
                            <AlertCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            {isZeroSubmit ? "Submit Zero Case Report?" : "Submit Report?"}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            {isZeroSubmit ? "You are about to submit a completely blank form. Are you sure you want to submit a ZERO CASE report?" : "Please verify that all data entries are correct before confirming submission."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setShowSubmitModal(false)} disabled={isSaving} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                                Cancel
                            </button>
                            <button onClick={confirmSubmit} disabled={isSaving} className={`flex-1 py-3 sm:py-2.5 px-4 text-black rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2 ${isZeroSubmit ? 'bg-amber-400 hover:bg-amber-500' : 'bg-yellow-400 hover:bg-yellow-500'}`}>
                                {isSaving && <Loader2 size={16} className="animate-spin"/>} Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* --- REJECT MODAL --- */}
        {showRejectModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg sm:text-xl font-bold text-rose-600 flex items-center gap-2 tracking-tight">
                            <MessageSquare size={22} strokeWidth={2.5}/> Reject Report
                        </h2>
                        <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 active:scale-90 rounded-lg transition-all">
                            <X size={20}/>
                        </button>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm mb-4 font-medium">Please provide a reason for rejecting this report. This will be visible to the facility user.</p>
                    <textarea className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all shadow-inner" rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} autoFocus placeholder="e.g. Incomplete data, please review the totals..."></textarea>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 w-full">
                        <button onClick={() => setShowRejectModal(false)} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold active:scale-95 transition-all duration-200 order-2 sm:order-1">
                            Cancel
                        </button>
                        <button onClick={confirmRejection} disabled={isSaving} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-rose-600 text-white hover:bg-rose-700 shadow-sm rounded-xl text-sm font-semibold active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2">
                            {isSaving && <Loader2 size={16} className="animate-spin"/>} Confirm Rejection
                        </button>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* --- DELETE REPORT MODAL --- */}
        {showDeleteReportModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-red-50 p-4 rounded-full mb-5 text-red-600 shadow-inner">
                            <AlertCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Delete {activeTab === 'main' ? 'Form 1' : 'Cohort'} Report?</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to delete the <strong>{activeTab === 'main' ? 'Form 1' : 'Cohort'}</strong> report? This action cannot be undone and all data will be lost.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setShowDeleteReportModal(false)} disabled={isSaving} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                                Cancel
                            </button>
                            <button onClick={handleDeleteReportClick} disabled={isSaving} className="flex-1 py-3 sm:py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2">
                                {isSaving && <Loader2 size={16} className="animate-spin"/>} Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* --- DELETE ROW MODAL --- */}
        {deleteRowConfirmation.isOpen && (
            <ModalPortal>
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-amber-50 p-4 rounded-full mb-5 text-amber-600 shadow-inner">
                            <AlertCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Remove Row?</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to remove <strong>{deleteRowConfirmation.rowKey}</strong>? Any data entered in this row will be lost immediately.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button onClick={() => setDeleteRowConfirmation({ isOpen: false, rowKey: null })} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1">
                                Cancel
                            </button>
                            <button onClick={confirmDeleteRow} className="flex-1 py-3 sm:py-2.5 px-4 bg-amber-500 text-black rounded-xl text-sm font-bold hover:bg-amber-600 shadow-sm active:scale-95 transition-all duration-200 order-1 sm:order-2">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}
    </div>
  );
}