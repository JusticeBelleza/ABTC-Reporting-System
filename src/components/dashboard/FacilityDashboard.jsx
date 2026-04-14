import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, FileDown, CheckCircle, XCircle, ArrowLeft, MessageSquare, X, Trash2, TrendingUp, ChevronRight, Clock, Archive, Building2, Layers, WifiOff, Plus } from 'lucide-react';
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
  
  const isAnyAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';

  // --- V2 STATE MANAGEMENT ---
  const [v2Data, setV2Data] = useState({});
  const [formRowKeys, setFormRowKeys] = useState([]);     // Standard rows (Barangays or Municipalities)
  const [otherRowKeys, setOtherRowKeys] = useState([]);   // Dynamically added "Other" rows
  const [formPopulations, setFormPopulations] = useState({});
  
  const [masterPopulations, setMasterPopulations] = useState({});
  const [availableLocationsToAdd, setAvailableLocationsToAdd] = useState([]);
  const [selectedLocationToAdd, setSelectedLocationToAdd] = useState("");

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
    user, facilities, facilityBarangays, year, month, quarter, periodType, adminViewMode, selectedFacility
  });

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  // --- V2: FETCH LOCATIONS, POPULATIONS & EXISTING DATA ---
  useEffect(() => {
    const fetchV2Data = async () => {
      if (!activeFacilityName) return;

      try {
        let facilityType = facilityDetails?.[activeFacilityName]?.type;
        if (!facilityType) {
            if (activeFacilityName.includes('Hospital') || activeFacilityName === 'APH') facilityType = 'Hospital';
            else if (activeFacilityName.includes('Clinic') || activeFacilityName === 'AMDC') facilityType = 'Clinic';
            else facilityType = 'RHU';
        }

        const { data: popData, error: popError } = await supabase
            .from('populations')
            .select('municipality, barangay_name, population, year');
            
        if (popError) throw popError;

        const baseKeys = new Set();
        const otherKeys = new Set();
        const popMap = {};
        const fullPopMap = {}; 
        const allMunicipalities = new Set();
        const muniPopSums = {}; // Fallback for municipalities without an "All" row

        if (popData && popData.length > 0) {
            const maxYear = Math.max(...popData.map(p => p.year || 0));
            const latestPopData = popData.filter(p => !p.year || p.year === maxYear);

            latestPopData.forEach(item => {
                const muni = (item.municipality || '').trim();
                const brgy = (item.barangay_name || '').trim();
                const pop = parseInt(item.population) || 0;

                if (!muni || muni === 'Non-Abra') return;

                // Add to our master list of ALL municipalities regardless of barangay status
                allMunicipalities.add(muni);

                // Calculate sums in case "All" is missing
                if (brgy && brgy.toLowerCase() !== 'all') {
                    muniPopSums[muni] = (muniPopSums[muni] || 0) + pop;
                }

                // If "All" row exists, use it as the definitive total
                if (!brgy || brgy.toLowerCase() === 'all') {
                    fullPopMap[muni] = pop;
                }

                if (facilityType !== 'Hospital' && facilityType !== 'Clinic') {
                    // RHU Logic
                    if (muni.toLowerCase() === (currentHostMunicipality || '').toLowerCase()) {
                        if (brgy && brgy.toLowerCase() !== 'all') {
                            baseKeys.add(brgy);
                            popMap[brgy] = pop;
                            fullPopMap[brgy] = pop;
                        }
                    }
                } else {
                    // Hospital/Clinic Logic
                    baseKeys.add(muni);
                    if (!brgy || brgy.toLowerCase() === 'all') {
                        popMap[muni] = pop;
                    }
                }
            });

            // Fallback: If any municipality didn't have an "All" row, use the sum we calculated
            allMunicipalities.forEach(m => {
                if (fullPopMap[m] === undefined) {
                    fullPopMap[m] = muniPopSums[m] || 0;
                    if ((facilityType === 'Hospital' || facilityType === 'Clinic') && popMap[m] === undefined) {
                        popMap[m] = muniPopSums[m] || 0;
                    }
                }
            });
        }

        // Add Non-Abra to master list of available options
        fullPopMap["Non-Abra"] = 0;

        // Fetch existing V2 Report Data
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
            // If the row isn't in our base standard keys, it must be an "Other" row we previously added
            if (!baseKeys.has(row.location_name)) {
                otherKeys.add(row.location_name);
                popMap[row.location_name] = fullPopMap[row.location_name] || 0;
            }

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

        const sortedBaseKeys = Array.from(baseKeys).sort((a, b) => a.localeCompare(b));
        
        // Sort Other Keys, ensuring Non-Abra is always at the bottom
        const sortedOtherKeys = Array.from(otherKeys).sort((a, b) => {
            if (a === "Non-Abra") return 1;
            if (b === "Non-Abra") return -1;
            return a.localeCompare(b);
        });
        
        setFormRowKeys(sortedBaseKeys);
        setOtherRowKeys(sortedOtherKeys);
        setFormPopulations(popMap);
        setMasterPopulations(fullPopMap);
        setV2Data(loadedState);

        // Generate dropdown list of municipalities NOT currently in either table section
        const combinedKeys = [...sortedBaseKeys, ...sortedOtherKeys];
        
        // Exclude the RHU's own municipality from the dropdown
        const availableMunis = Array.from(allMunicipalities)
            .filter(m => !combinedKeys.includes(m) && m.toLowerCase() !== (currentHostMunicipality || '').toLowerCase())
            .sort();
        
        // Ensure Non-Abra is always an option if it hasn't been added yet
        if (!combinedKeys.includes("Non-Abra")) {
            availableMunis.push("Non-Abra");
        }
        
        setAvailableLocationsToAdd(availableMunis);

      } catch (err) {
        console.error("Error fetching V2 data:", err);
      }
    };

    fetchV2Data();
  }, [activeFacilityName, currentHostMunicipality, year, month, quarter, periodType, facilityDetails]);

  // --- DYNAMIC ROW ADDER ---
  const handleAddRow = () => {
      if (!selectedLocationToAdd) return;
      if (formRowKeys.includes(selectedLocationToAdd) || otherRowKeys.includes(selectedLocationToAdd)) {
          toast.error("Location is already in the table.");
          return;
      }

      // Add to the 'Other' group and re-sort
      const updatedOtherKeys = [...otherRowKeys, selectedLocationToAdd].sort((a, b) => {
          if (a === "Non-Abra") return 1;
          if (b === "Non-Abra") return -1;
          return a.localeCompare(b);
      });

      setOtherRowKeys(updatedOtherKeys);
      setFormPopulations(prev => ({
          ...prev,
          [selectedLocationToAdd]: masterPopulations[selectedLocationToAdd] || 0
      }));

      // Remove from dropdown options
      setAvailableLocationsToAdd(prev => prev.filter(loc => loc !== selectedLocationToAdd));
      setSelectedLocationToAdd("");
      toast.success(`${selectedLocationToAdd} added to the report.`);
  };

  const handleV2CellChange = (location, field, value) => {
    setV2Data(prev => ({
      ...prev,
      [location]: { ...(prev[location] || {}), [field]: value }
    }));
  };

  useEffect(() => {
    const checkOfflineDraft = async () => {
        const draft = await getOfflineDraft(); 
        if (draft && navigator.onLine) {
            try {
                toast.info("🌐 Connection restored! Auto-syncing offline V2 report...", { duration: 4000 });
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

                await clearOfflineDraft(); 
                toast.success("Offline data successfully synced to the server!", { duration: 5000 });
            } catch (err) {
                console.error("Auto Sync Error:", err);
            }
        }
    };
    
    window.addEventListener('online', checkOfflineDraft);
    checkOfflineDraft();
    return () => window.removeEventListener('online', checkOfflineDraft);
  }, []);

  const saveV2Report = async (status, reason = '') => {
    try {
      const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
      
      // Combine both key arrays so everything gets saved
      const allKeysToSave = [...formRowKeys, ...otherRowKeys];
      
      const payload = allKeysToSave.map(loc => {
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
      window.location.reload(); 
    } catch (err) {
      console.error("Error saving report:", err);
      toast.error("Failed to save report.");
    }
  };

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
    
    if (status === 'Pending') { 
        let hasErrors = false;
        let isCompletelyEmpty = true;

        const allKeysToCheck = [...formRowKeys, ...otherRowKeys];

        for (const loc of allKeysToCheck) {
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

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 relative pb-24">
        
        {/* ========================================== */}
        {/* HEADER & ACTIONS */}
        {/* ========================================== */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 sm:gap-6 border border-slate-800 relative mx-4 mt-4">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
            
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 relative z-10 w-full xl:w-auto">
                {isAnyAdmin && (
                    <button onClick={onBack} className="p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white active:scale-90 transition-all duration-200 shrink-0">
                        <ArrowLeft size={20}/>
                    </button>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                    <h2 className="font-extrabold tracking-tight text-white leading-tight break-words text-2xl sm:text-3xl">
                        {isConsolidatedView ? 'Consolidated Report' : activeFacilityName}
                    </h2>
                    {!isConsolidatedView && !isAggregationMode && periodType === 'Monthly' && (
                        <div className="shrink-0 flex items-center shadow-sm"><StatusBadge status={reportStatus} /></div>
                    )}
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 relative z-10 w-full xl:w-auto">
                <button disabled={isDownloadingPdf || (!isConsolidatedView && !isAggregationMode && reportStatus !== 'Approved')} onClick={() => setShowExportModal(true)} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:bg-slate-700 hover:text-white disabled:opacity-50 flex items-center gap-2 transition-all">
                    {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} 
                    <span>Export PDF</span>
                </button>

                {!isConsolidatedView && !isAggregationMode && (
                    <div className="flex flex-1 sm:flex-none items-center gap-2 sm:pl-3 sm:border-l sm:border-slate-700 w-full sm:w-auto">
                    {isAnyAdmin ? (
                        <>
                        <button onClick={() => onSaveClick('Approved')} disabled={loading || isSaving || reportStatus === 'Approved' || reportStatus === 'Rejected' || reportStatus === 'Draft'} className="flex-1 sm:flex-none justify-center bg-emerald-500 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-600 shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>} Approve
                        </button>
                        <button onClick={() => onSaveClick('Rejected')} disabled={loading || isSaving || reportStatus === 'Rejected' || reportStatus === 'Draft'} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-rose-400 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-rose-600 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>} Reject
                        </button>
                        <button onClick={() => setShowDeleteReportModal(true)} disabled={loading || isSaving || reportStatus === 'Draft'} className="bg-slate-800 border border-slate-700 text-red-400 p-2.5 sm:p-2 rounded-xl hover:bg-red-600 hover:text-white flex items-center justify-center transition-all disabled:opacity-50">
                            <Trash2 size={16} />
                        </button>
                        </>
                    ) : (
                        <>
                        <button onClick={() => onSaveClick('Draft')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-700 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Draft
                        </button>
                        <button onClick={() => onSaveClick('Pending')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50">
                            {isSaving ? <Loader2 size={14} className="animate-spin"/> : null} Submit Report
                        </button>
                        </>
                    )}
                    </div>
                )}
            </div>
        </div>

        {/* ========================================== */}
        {/* CONTROLS (TABS & FILTERS) */}
        {/* ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 mx-4 mt-4">
            <div className="flex items-center w-full sm:w-auto">
                 <h2 className="text-slate-800 font-bold px-4">DOH Form 1</h2>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block mr-1">Period:</span>
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20">
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                    </select>
                </div>
                
                {periodType === 'Monthly' && (
                    <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 min-w-[110px]">
                        {availableMonths.map((m) => {
                            const isFuture = year > currentRealYear || (year === currentRealYear && MONTHS.indexOf(m) > currentRealMonthIdx);
                            return <option key={m} value={m} disabled={isFuture}>{m}</option>;
                        })}
                    </select>
                )}
                
                {periodType === 'Quarterly' && (
                    <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 min-w-[110px]">
                        {QUARTERS.map((q, idx) => {
                            const isFuture = year > currentRealYear || (year === currentRealYear && idx > Math.floor(currentRealMonthIdx / 3));
                            return <option key={q} value={q} disabled={isFuture}>{formatQuarterName(q)}</option>;
                        })}
                    </select>
                )}
                
                <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 min-w-[80px]">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        </div>

        {isOffline && (
            <div className="mx-4 mb-4 px-4 py-3 rounded-xl flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
                <WifiOff size={20} className="text-amber-700 mt-0.5" strokeWidth={2.5} />
                <div>
                    <p className="text-sm font-bold">You are currently offline.</p>
                    <p className="text-xs font-medium mt-0.5 text-amber-800/80">You can continue working. Drafts and submissions will be queued and auto-synced when internet is restored.</p>
                </div>
            </div>
        )}

        {/* Main Table Container */}
        <div className="bg-white mx-4 flex-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-4">
            {formRowKeys.length > 0 ? (
                <>
                    <MainReportTableV2 
                        data={v2Data} 
                        baseRowKeys={formRowKeys} 
                        otherRowKeys={otherRowKeys}
                        populations={formPopulations}
                        onChange={handleV2CellChange} 
                        isRowReadOnly={reportStatus === 'Approved' || reportStatus === 'Pending' || isConsolidatedView}
                    />
                    
                    {/* --- DYNAMIC ROW ADDER CONTROL (NEVER HIDES, JUST DISABLES) --- */}
                    {!isConsolidatedView && reportStatus !== 'Approved' && reportStatus !== 'Pending' && (
                        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Plus size={16} strokeWidth={3}/></div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">Add Patient Origin</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">Report cases from outside your usual catchment area.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={selectedLocationToAdd}
                                    onChange={e => setSelectedLocationToAdd(e.target.value)}
                                    disabled={availableLocationsToAdd.length === 0}
                                    className="text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-[220px] focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 bg-white disabled:opacity-50"
                                >
                                    <option value="">-- Select Municipality --</option>
                                    {availableLocationsToAdd.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                                <button
                                    onClick={handleAddRow}
                                    disabled={!selectedLocationToAdd || availableLocationsToAdd.length === 0}
                                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    {availableLocationsToAdd.length === 0 ? 'All Locations Added' : 'Add Row'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 font-medium py-20">
                    <Loader2 className="animate-spin mb-4 text-blue-500" size={32} /> 
                    <p>Loading database locations & forms...</p>
                </div>
            )}
        </div>

        {/* --- MODALS --- */}
        {showExportModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl max-w-sm w-full">
                    <h3 className="text-xl font-bold text-center mb-4">Export to PDF?</h3>
                    <div className="flex gap-3">
                        <button onClick={() => setShowExportModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-semibold">Cancel</button>
                        <button onClick={() => { setShowExportModal(false); /* Trigger print or handle PDF export mapping later */ }} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Export</button>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}
        {showSubmitModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
                    <AlertCircle size={32} className={`mx-auto mb-4 ${isZeroSubmit ? 'text-amber-500' : 'text-blue-500'}`} />
                    <h3 className="text-xl font-bold mb-2">{isZeroSubmit ? "Submit Zero Case Report?" : "Submit Report?"}</h3>
                    <p className="text-sm text-slate-500 mb-6">Are you sure you want to submit this report?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-semibold">Cancel</button>
                        <button onClick={confirmSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Confirm</button>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}
        {showDraftModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
                    <Save size={32} className="mx-auto mb-4 text-slate-800" />
                    <h3 className="text-xl font-bold mb-2">Save as Draft?</h3>
                    <p className="text-sm text-slate-500 mb-6">You can return to edit it later before submitting.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDraftModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-semibold">Cancel</button>
                        <button onClick={confirmSaveDraft} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Save Draft</button>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}
    </div>
  );
}