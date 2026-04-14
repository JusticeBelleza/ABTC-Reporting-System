import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, FileDown, CheckCircle, XCircle, ArrowLeft, MessageSquare, X, Trash2, TrendingUp, ChevronRight, Clock, Archive, Building2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { MONTHS, QUARTERS, PDF_STYLES } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';
import ModalPortal from '../modals/ModalPortal';
import { downloadPDF } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import MainReportTableV2 from '../reports/MainReportTableV2';
import { saveOfflineDraft, getOfflineDraft, clearOfflineDraft } from '../../lib/offlineDB';

export default function FacilityDashboard({
  periodType, setPeriodType,
  year, setYear,
  month, setMonth,
  quarter, setQuarter,
  availableYears, availableMonths,
  adminViewMode, selectedFacility, onBack,
  currentRealYear, currentRealMonthIdx 
}) {
  const { user, facilities, facilityBarangays, facilityDetails, globalSettings, userProfile } = useApp();
  
  // Helper to check if current user is any type of admin
  const isAnyAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';

  // --- V2 STATE MANAGEMENT ---
  const [v2Data, setV2Data] = useState({});
  const [formRowKeys, setFormRowKeys] = useState([]);
  const [formPopulations, setFormPopulations] = useState({});

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false); 
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); 
  const [showDraftModal, setShowDraftModal] = useState(false); 
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isZeroSubmit, setIsZeroSubmit] = useState(false);

  const [statusModal, setStatusModal] = useState({ isOpen: false, status: null });
  const [consolidatedModal, setConsolidatedModal] = useState({ isOpen: false, filter: null });
  const [yearlyStats, setYearlyStats] = useState({ main: [] });

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
    reportStatus, loading, isSaving, 
    activeFacilityName, currentHostMunicipality,
    confirmDeleteReport
  } = useReportData({
    user, facilities, facilityBarangays, year, month, quarter, periodType, activeTab: 'main', adminViewMode, selectedFacility
  });

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  // --- V2: FETCH LOCATIONS, POPULATIONS & EXISTING DATA ---
  useEffect(() => {
    const fetchV2Data = async () => {
      if (!activeFacilityName) return;

      try {
        // 1. Fetch Locations & Populations
        let popQuery = supabase.from('populations').select('municipality, barangay_name, population').eq('year', year);
        const facilityType = facilityDetails?.[activeFacilityName]?.type || 'RHU';
        
        if (facilityType !== 'Hospital') {
          popQuery = popQuery.eq('municipality', currentHostMunicipality).neq('barangay_name', 'All').not('barangay_name', 'is', null);
        } else {
          popQuery = popQuery.is('barangay_name', null);
        }

        const { data: popData, error: popError } = await popQuery;
        if (popError) throw popError;

        const keys = [];
        const popMap = {};

        if (popData) {
          popData.forEach(item => {
            const rowName = (facilityType !== 'Hospital') ? item.barangay_name : item.municipality;
            keys.push(rowName);
            popMap[rowName] = item.population;
          });
          keys.sort((a, b) => a.localeCompare(b));
          
          keys.push("Outside Catchment / Non-Abra");
          popMap["Outside Catchment / Non-Abra"] = 0;
          
          setFormRowKeys(keys);
          setFormPopulations(popMap);
        }

        // 2. Fetch existing V2 Report Data for this period
        const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
        const { data: existingData, error: existingError } = await supabase
          .from('abtc_reports_v2')
          .select('*')
          .eq('year', year)
          .eq('month', currentPeriod)
          .eq('facility', activeFacilityName);

        if (existingError) throw existingError;

        const loadedState = {};
        if (existingData) {
          existingData.forEach(row => {
            loadedState[row.location_name] = {
              male: row.male || '', female: row.female || '',
              ageUnder15: row.age_under_15 || '', ageOver15: row.age_over_15 || '',
              cat1: row.cat1 || '',
              cat2EligPri: row.cat2_elig_pri || '', cat2EligBoost: row.cat2_elig_boost || '', cat2NonElig: row.cat2_non_elig || '',
              cat3EligPri: row.cat3_elig_pri || '', cat3EligBoost: row.cat3_elig_boost || '', cat3NonElig: row.cat3_non_elig || '',
              compCat2Pri: row.comp_cat2_pri || '', compCat2Boost: row.comp_cat2_boost || '',
              compCat3PriErig: row.comp_cat3_pri_erig || '', compCat3PriHrig: row.comp_cat3_pri_hrig || '', compCat3Boost: row.comp_cat3_boost || '',
              typeDog: row.type_dog || '', typeCat: row.type_cat || '', typeOthers: row.type_others || '',
              statusPet: row.status_pet || '', statusStray: row.status_stray || '', statusUnk: row.status_unk || '',
              rabiesCases: row.rabies_cases || ''
            };
          });
        }
        setV2Data(loadedState);

      } catch (err) {
        console.error("Error fetching V2 data:", err);
      }
    };

    fetchV2Data();
  }, [activeFacilityName, currentHostMunicipality, year, month, quarter, periodType, facilityDetails]);

  const handleV2CellChange = (location, field, value) => {
    setV2Data(prev => ({
      ...prev,
      [location]: { ...(prev[location] || {}), [field]: value }
    }));
  };

  // --- ADVANCED OFFLINE BACKGROUND AUTO-SYNC (V2 Updated) ---
  useEffect(() => {
    const checkOfflineDraft = async () => {
        const draft = await getOfflineDraft(); 
        if (draft && navigator.onLine) {
            try {
                toast.info("🌐 Connection restored! Auto-syncing offline V2 report...", { duration: 4000 });

                // Construct payload from offline V2 draft
                const payload = Object.entries(draft.data).map(([loc, row]) => {
                    const num = (val) => parseInt(val) || 0;
                    return {
                        year: draft.year, month: draft.month, facility: draft.facility, location_name: loc,
                        status: draft.intendedStatus || 'Draft',
                        male: num(row.male), female: num(row.female),
                        age_under_15: num(row.ageUnder15), age_over_15: num(row.ageOver15),
                        cat1: num(row.cat1),
                        cat2_elig_pri: num(row.cat2EligPri), cat2_elig_boost: num(row.cat2EligBoost), cat2_non_elig: num(row.cat2NonElig),
                        cat3_elig_pri: num(row.cat3EligPri), cat3_elig_boost: num(row.cat3EligBoost), cat3_non_elig: num(row.cat3NonElig),
                        comp_cat2_pri: num(row.compCat2Pri), comp_cat2_boost: num(row.compCat2Boost),
                        comp_cat3_pri_erig: num(row.compCat3PriErig), comp_cat3_pri_hrig: num(row.compCat3PriHrig), comp_cat3_boost: num(row.compCat3Boost),
                        type_dog: num(row.typeDog), type_cat: num(row.typeCat), type_others: num(row.typeOthers),
                        status_pet: num(row.statusPet), status_stray: num(row.statusStray), status_unk: num(row.statusUnk),
                        rabies_cases: num(row.rabiesCases)
                    };
                });

                const { error } = await supabase.from('abtc_reports_v2').upsert(payload, { onConflict: 'year, month, facility, location_name' });
                if (error) throw error;

                if (draft.intendedStatus === 'Pending') {
                    const { error: notifError } = await supabase.from('notifications').insert([{
                        title: 'Report Auto-Synced',
                        message: `${draft.facility} submitted their Form 1 report for ${draft.month} ${draft.year} via offline auto-sync.`,
                        type: 'submission', is_read: false, facility: draft.facility
                    }]);
                    if (notifError) console.error("Notification Sync Error:", notifError);
                }

                await clearOfflineDraft(); 
                toast.success("Offline data successfully synced to the server!", { duration: 5000 });
                // Note: The main useEffect will naturally re-fetch data if needed.
            } catch (err) {
                console.error("Auto Sync Error:", err);
                toast.error("Auto-sync failed. Please save manually.", { duration: 5000 });
            }
        }
    };
    
    window.addEventListener('online', checkOfflineDraft);
    checkOfflineDraft();
    return () => window.removeEventListener('online', checkOfflineDraft);
  }, []);

  // --- STATS FETCHING (V2 Updated) ---
  useEffect(() => {
    const fetchYearlyStats = async () => {
        if (!year) return;
        try {
            let mainQuery = supabase.from('abtc_reports_v2').select('facility, month, status').eq('year', year);
            if (!isConsolidatedView) {
                if (!activeFacilityName) return;
                mainQuery = mainQuery.eq('facility', activeFacilityName);
            }
            const { data: mainData } = await mainQuery;
            setYearlyStats({ main: mainData || [] });
        } catch (error) { console.error("Error fetching yearly stats:", error); }
    };
    fetchYearlyStats();
  }, [activeFacilityName, year, isConsolidatedView, reportStatus]);

  const getMonthsByStatus = (statusType) => {
      const uniqueObj = {};
      yearlyStats.main.forEach(r => { if (!uniqueObj[r.month] || r.status === 'Approved') uniqueObj[r.month] = r.status; });
      return Object.entries(uniqueObj).filter(([m, status]) => status === statusType).map(([m]) => m).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
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

  const buildMatrix = () => {
      const dedupedStats = {};
      yearlyStats.main.forEach(r => {
          const key = `${r.facility}_${r.month}`;
          if (!dedupedStats[key] || r.status === 'Approved') dedupedStats[key] = r;
      });
      const flatStats = Object.values(dedupedStats);

      return facilities.map(f => {
          const facStats = flatStats.filter(r => r.facility === f);
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

  const mainMatrix = isConsolidatedView ? buildMatrix() : [];
  const getAggregates = (matrix) => {
      if (!isConsolidatedView || matrix.length === 0) return { full: 0, partial: 0, zero: 0, rate: 0 };
      const totalApproved = matrix.reduce((sum, m) => sum + m.approvedCount, 0);
      return {
          full: matrix.filter(m => m.isFully).length, partial: matrix.filter(m => m.isPartial).length,
          zero: matrix.filter(m => m.isZero).length, rate: Math.round((totalApproved / (facilities.length * targetMonths.length)) * 100) || 0
      };
  };
  const mainAgg = getAggregates(mainMatrix);

  const getFilteredMatrix = () => {
      if (consolidatedModal.filter === 'full') return mainMatrix.filter(m => m.isFully);
      if (consolidatedModal.filter === 'partial') return mainMatrix.filter(m => m.isPartial);
      if (consolidatedModal.filter === 'zero') return mainMatrix.filter(m => m.isZero);
      return mainMatrix; 
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


  // --- V2 MASTER SAVE LOGIC ---
  const saveV2Report = async (status, reason = '') => {
    try {
      const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
      const payload = formRowKeys.map(loc => {
        const row = v2Data[loc] || {};
        const num = (val) => parseInt(val) || 0;
        return {
          year, month: currentPeriod, facility: activeFacilityName, location_name: loc,
          status, remarks: reason,
          male: num(row.male), female: num(row.female),
          age_under_15: num(row.ageUnder15), age_over_15: num(row.ageOver15),
          cat1: num(row.cat1),
          cat2_elig_pri: num(row.cat2EligPri), cat2_elig_boost: num(row.cat2EligBoost), cat2_non_elig: num(row.cat2NonElig),
          cat3_elig_pri: num(row.cat3EligPri), cat3_elig_boost: num(row.cat3EligBoost), cat3_non_elig: num(row.cat3NonElig),
          comp_cat2_pri: num(row.compCat2Pri), comp_cat2_boost: num(row.compCat2Boost),
          comp_cat3_pri_erig: num(row.compCat3PriErig), comp_cat3_pri_hrig: num(row.compCat3PriHrig), comp_cat3_boost: num(row.compCat3Boost),
          type_dog: num(row.typeDog), type_cat: num(row.typeCat), type_others: num(row.typeOthers),
          status_pet: num(row.statusPet), status_stray: num(row.statusStray), status_unk: num(row.statusUnk),
          rabies_cases: num(row.rabiesCases)
        };
      });

      const { error } = await supabase.from('abtc_reports_v2').upsert(payload, { onConflict: 'year, month, facility, location_name' });
      if (error) throw error;
      
      toast.success(`Report successfully marked as ${status}`);
      // Since we bypass useReportData for fetching, we might need a hard refresh or trigger
      window.location.reload(); // Simple refresh to update dashboard status UI
    } catch (err) {
      console.error("Error saving report:", err);
      toast.error("Failed to save report.");
    }
  };

  // --- V2 VALIDATION & GUARDRAIL ---
  const onSaveClick = async (status) => {
    if (!navigator.onLine) {
        if (isAnyAdmin && (status === 'Approved' || status === 'Rejected')) {
             toast.error("📴 No Internet Connection! Admin approvals and rejections require an active connection.", { duration: 5000 });
             return;
        } else if (!isAnyAdmin && status === 'Pending') {
            toast.warning("📴 Offline Detected! Report will be securely queued on your device and will auto-sync when internet is restored.", { duration: 8000 });
            const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
            const offlinePayload = {
                facility: activeFacilityName, year, month: currentPeriod, periodType,
                data: v2Data, timestamp: new Date().toISOString(), intendedStatus: 'Pending' 
            };
            await saveOfflineDraft(offlinePayload);
            return;
        } else if (status === 'Draft') {
            setShowDraftModal(true); return;
        }
    }

    if (status === 'Rejected') { setRejectionReason(''); setShowRejectModal(true); return; }
    if (status === 'Approved') { setShowApproveModal(true); return; }
    if (status === 'Draft') { setShowDraftModal(true); return; } 
    
    // STRICT DOH VALIDATION LOGIC FOR SUBMISSIONS
    if (status === 'Pending') { 
        let hasErrors = false;
        let isCompletelyEmpty = true;

        for (const loc of formRowKeys) {
            const row = v2Data[loc] || {};
            const num = (val) => parseInt(val) || 0;

            const totalSex = num(row.male) + num(row.female);
            const totalAge = num(row.ageUnder15) + num(row.ageOver15);
            const totalAnimals = num(row.typeDog) + num(row.typeCat) + num(row.typeOthers);
            const totalStatus = num(row.statusPet) + num(row.statusStray) + num(row.statusUnk);
            const totalCases = num(row.cat1) + 
                               (num(row.cat2EligPri) + num(row.cat2EligBoost) + num(row.cat2NonElig)) + 
                               (num(row.cat3EligPri) + num(row.cat3EligBoost) + num(row.cat3NonElig));

            if (totalSex > 0 || totalAge > 0 || totalCases > 0 || totalAnimals > 0) {
              isCompletelyEmpty = false;
              if (totalSex !== totalAge || totalSex !== totalCases || totalCases !== totalAnimals || totalAnimals !== totalStatus) {
                hasErrors = true;
                break;
              }
            }
        }

        if (hasErrors) {
            toast.error("DATA MISMATCH: Totals for Sex, Age, Cases, and Animals MUST match exactly across all filled rows.", { duration: 6000 });
            return;
        }
        
        setIsZeroSubmit(isCompletelyEmpty); 
        setShowSubmitModal(true); 
        return; 
    }
  };

  const confirmApprove = async () => { setShowApproveModal(false); await saveV2Report('Approved'); };
  const confirmRejection = async () => { 
    if (!rejectionReason.trim()) { toast.error("Reason required"); return; } 
    setShowRejectModal(false); await saveV2Report('Rejected', rejectionReason); 
  };
  const confirmSubmit = async () => { setShowSubmitModal(false); await saveV2Report('Pending'); };
  
  const confirmSaveDraft = async () => { 
    setShowDraftModal(false); 
    if (!navigator.onLine) {
        const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
        const offlinePayload = {
            facility: activeFacilityName, year, month: currentPeriod, periodType,
            data: v2Data, timestamp: new Date().toISOString(), intendedStatus: 'Draft' 
        };
        await saveOfflineDraft(offlinePayload);
        toast.warning("📴 Offline! Draft saved locally. It will automatically sync when internet is restored.", { duration: 8000 });
        return;
    }
    await saveV2Report('Draft'); 
  };

  const handleDeleteReportClick = async () => { 
    setShowDeleteReportModal(false); 
    await confirmDeleteReport(); 
    await clearOfflineDraft();
  };


  const getCurrentPeriodText = () => periodType === 'Annual' ? `Annual ${year}` : periodType === 'Quarterly' ? `${formatQuarterName(quarter)} ${year}` : `${month} ${year}`;
  const currentDisplayPeriod = periodType === 'Monthly' ? month : periodType === 'Quarterly' ? formatQuarterName(quarter) : 'Annual';

  const confirmExportPdf = async () => {
    setShowExportModal(false);
    setIsDownloadingPdf(true);
    const currentPeriodText = getCurrentPeriodText();
    const filename = `Report_${activeFacilityName.replace(/\s+/g,'_')}_${year}.pdf`;
    
    // Note: V2 PDF Generation will require the `downloadPDF` utility to be updated later to map the new V2 columns.
    await downloadPDF({
        type: 'main', filename, data: v2Data, rowKeys: formRowKeys, 
        periodText: currentPeriodText, facilityName: activeFacilityName, userProfile, globalSettings,
        isConsolidated: isConsolidatedView,
        facilityType: facilityDetails?.[activeFacilityName]?.type || 'RHU',      
        facilityOwnership: facilityDetails?.[activeFacilityName]?.ownership || 'Government'
    });
    setIsDownloadingPdf(false);
  };

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
                                    Form 1 - {statusModal.status}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 truncate">{activeFacilityName} • {year}</p>
                            </div>
                        </div>
                        <button onClick={() => setStatusModal({ isOpen: false, status: null })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                        {getMonthsByStatus(statusModal.status).length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <Archive size={20} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-600">No {statusModal.status.toLowerCase()} reports</p>
                                <p className="text-xs text-slate-400 mt-1">There are no months currently in this status for {year}.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 p-2">
                                {getMonthsByStatus(statusModal.status).map(m => (
                                    <div 
                                        key={m} 
                                        onClick={() => { 
                                            setStatusModal({ isOpen: false, status: null }); 
                                            setMonth(m); 
                                            setPeriodType('Monthly'); 
                                        }} 
                                        className="group px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200 active:scale-[0.98] transition-all"
                                    >
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
                                <Building2 size={20} strokeWidth={2.5}/> 
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
                        <button onClick={() => setConsolidatedModal({ isOpen: false, filter: null })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
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

        {/* ========================================== */}
        {/* TIER 1: MAIN FACILITY HEADER & ACTIONS */}
        {/* ========================================== */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 sm:gap-6 border border-slate-800 relative overflow-hidden no-print z-20 mt-2 mb-3">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
            
            {/* Left side: Facility Name & Status */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10 w-full xl:w-auto">
                {isAnyAdmin && (
                    <button onClick={onBack} className="p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-600 hover:shadow-md active:scale-90 transition-all duration-200 shrink-0">
                        <ArrowLeft size={20}/>
                    </button>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                    <h2 className={`font-extrabold tracking-tight text-white leading-tight break-words
                        ${isConsolidatedView ? 'text-2xl sm:text-3xl' : activeFacilityName?.length > 50 ? 'text-lg sm:text-xl' : activeFacilityName?.length > 30 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}
                    >
                        {isConsolidatedView ? 'Consolidated Report' : activeFacilityName}
                    </h2>
                    
                    {!isConsolidatedView && !isAggregationMode && periodType === 'Monthly' && (
                        <div className="shrink-0 flex items-center shadow-sm"><StatusBadge status={reportStatus} /></div>
                    )}
                </div>
            </div>
            
            {/* Right side: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 relative z-10 w-full xl:w-auto">
                <button disabled={isDownloadingPdf || (!isConsolidatedView && !isAggregationMode && reportStatus !== 'Approved')} onClick={() => setShowExportModal(true)} title={(!isConsolidatedView && !isAggregationMode && reportStatus !== 'Approved') ? "Only Approved reports can be exported to PDF." : "Export PDF"} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 hover:text-white hover:border-slate-500">
                    {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} 
                    <span>Export PDF</span>
                </button>

                {!isConsolidatedView && !isAggregationMode && (
                    <div className="flex flex-1 sm:flex-none items-center gap-2 sm:pl-3 sm:border-l sm:border-slate-700 w-full sm:w-auto">
                    {isAnyAdmin ? (
                        <>
                        <button onClick={() => onSaveClick('Approved')} disabled={loading || isSaving || reportStatus === 'Approved' || reportStatus === 'Rejected' || reportStatus === 'Draft'} className="flex-1 sm:flex-none justify-center bg-yellow-400 text-black px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)] flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:shadow-none">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>} Approve
                        </button>
                        <button onClick={() => onSaveClick('Rejected')} disabled={loading || isSaving || reportStatus === 'Rejected' || reportStatus === 'Draft'} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-rose-400 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-rose-600 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>} Reject
                        </button>
                        <button onClick={() => setShowDeleteReportModal(true)} disabled={loading || isSaving || reportStatus === 'Draft'} className="bg-slate-800 border border-slate-700 text-red-400 p-2.5 sm:p-2 rounded-xl hover:bg-red-600 hover:text-white flex items-center justify-center active:scale-90 transition-all duration-200 disabled:opacity-50 shrink-0">
                            <Trash2 size={16} />
                        </button>
                        </>
                    ) : (
                        <>
                        <button onClick={() => onSaveClick('Draft')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-700 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Draft
                        </button>
                        <button onClick={() => onSaveClick('Pending')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center bg-yellow-400 text-black px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)] flex items-center gap-1.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:shadow-none">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : null} Submit Report
                        </button>
                        </>
                    )}
                    </div>
                )}
            </div>
        </div>

        {/* ========================================== */}
        {/* TIER 2: DATA CONTROLS (TABS & FILTERS) */}
        {/* ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 sm:p-3 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 no-print">
            
            {/* Left side: Empty placeholder since we removed Cohort tabs */}
            <div className="flex items-center w-full sm:w-auto">
                 <h2 className="text-slate-800 font-bold px-4">DOH Form 1</h2>
            </div>

            {/* Right side: Date Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block mr-1">Period:</span>
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                    </select>
                </div>
                
                {periodType === 'Monthly' && (
                    <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 min-w-[110px]">
                        {availableMonths.map((m) => {
                            const mIdx = MONTHS.indexOf(m);
                            const isFuture = year > currentRealYear || (year === currentRealYear && mIdx > currentRealMonthIdx);
                            return <option key={m} value={m} disabled={isFuture}>{m}</option>;
                        })}
                    </select>
                )}
                
                {periodType === 'Quarterly' && (
                    <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 min-w-[110px]">
                        {QUARTERS.map((q, idx) => {
                            const isFuture = year > currentRealYear || (year === currentRealYear && idx > Math.floor(currentRealMonthIdx / 3));
                            return <option key={q} value={q} disabled={isFuture}>{formatQuarterName(q)}</option>;
                        })}
                    </select>
                )}
                
                <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 min-w-[80px]">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        </div>

        {/* --- OFFLINE WARNING BANNER --- */}
        {isOffline && (
            <div className={`px-4 py-3 sm:px-5 sm:py-4 rounded-xl mb-6 flex items-start sm:items-center gap-3 sm:gap-4 shadow-sm animate-in slide-in-from-top-4 no-print ${isAnyAdmin ? 'bg-rose-50 border border-rose-200 text-rose-900' : 'bg-amber-50 border border-amber-200 text-amber-900'}`}>
                <div className={`p-2 rounded-full shrink-0 mt-0.5 sm:mt-0 ${isAnyAdmin ? 'bg-rose-200/50' : 'bg-amber-200/50'}`}>
                    <WifiOff size={20} className={isAnyAdmin ? "text-rose-700" : "text-amber-700"} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-extrabold tracking-tight">
                        {isAnyAdmin ? "No Internet Connection!" : "You are currently offline."}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium mt-0.5 ${isAnyAdmin ? 'text-rose-800/80' : 'text-amber-800/80'}`}>
                        {isAnyAdmin 
                            ? "Admin approvals and rejections require an active connection. Please reconnect to manage reports."
                            : <span>Don't panic! You can continue working. Click <strong>Submit Report</strong> or <strong>Save Draft</strong> and it will securely queue on your device to auto-sync when your connection returns.</span>
                        }
                    </p>
                </div>
            </div>
        )}

        {/* --- DYNAMIC KPI CARDS & YEARLY TRACKER --- */}
        <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500 no-print">
            <div>
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">
                {isConsolidatedView ? `Form 1 Provincial Compliance (${getCurrentPeriodText()})` : `Form 1 Overview (${currentDisplayPeriod} ${year})`}
            </h3>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${periodType === 'Monthly' && !isConsolidatedView ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'full' }) : setStatusModal({ isOpen: true, status: 'Approved' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CheckCircle size={20} strokeWidth={2.5} /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblApproved}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? mainAgg.full : mainStats.approved}</p></div>
                </div>
                <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'partial' }) : setStatusModal({ isOpen: true, status: 'Pending' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-amber-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors"><Clock size={20} strokeWidth={2.5} /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{lblPending}</p><p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{isConsolidatedView ? mainAgg.partial : mainStats.pending}</p></div>
                </div>
                <div onClick={() => isConsolidatedView ? setConsolidatedModal({ isOpen: true, filter: 'zero' }) : setStatusModal({ isOpen: true, status: 'Rejected' })} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:border-rose-300 transition-all duration-300 cursor-pointer group active:scale-[0.98]">
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
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-none print:rounded-none print:shadow-none print:border-none relative w-full overflow-x-auto" style={{...PDF_STYLES.container}}>
            <div className="min-w-fit">
                {formRowKeys.length > 0 ? (
                    <MainReportTableV2 
                        data={v2Data} 
                        rowKeys={formRowKeys} 
                        populations={formPopulations}
                        onChange={handleV2CellChange} 
                        isRowReadOnly={reportStatus === 'Approved' || reportStatus === 'Pending' || isConsolidatedView}
                    />
                ) : (
                    <div className="flex items-center justify-center h-64 text-slate-400 font-medium border border-slate-200 rounded-lg">
                        <Loader2 className="animate-spin mr-2" size={20} /> Loading database locations...
                    </div>
                )}
            </div>
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
                            Are you sure you want to download the <strong>Form 1</strong> report as a PDF document?
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
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Delete Form 1 Report?</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to delete the <strong>Form 1</strong> report? This action cannot be undone and all data will be lost.
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
    </div>
  );
}