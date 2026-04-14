import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, FileDown, CheckCircle, XCircle, ArrowLeft, MessageSquare, X, Trash2, TrendingUp, ChevronRight, Clock, Archive, Building2, Layers, WifiOff, Plus, Calendar, CalendarCheck, BarChart3 } from 'lucide-react';
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
  const [formRowKeys, setFormRowKeys] = useState([]);     
  const [otherRowKeys, setOtherRowKeys] = useState([]);   
  const [formPopulations, setFormPopulations] = useState({});
  
  const [masterPopulations, setMasterPopulations] = useState({});
  const [availableLocationsToAdd, setAvailableLocationsToAdd] = useState([]);
  const [selectedLocationToAdd, setSelectedLocationToAdd] = useState("");

  const [deleteRowModal, setDeleteRowModal] = useState({ isOpen: false, location: null });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false); 
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); 
  const [showDraftModal, setShowDraftModal] = useState(false); 
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isZeroSubmit, setIsZeroSubmit] = useState(false);

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

        const { data: popData, error: popError } = await supabase.from('populations').select('municipality, barangay_name, population, year');
        if (popError) throw popError;

        const baseKeys = new Set();
        const otherKeys = new Set();
        const popMap = {};
        const fullPopMap = {}; 
        const allMunicipalities = new Set();
        const muniPopSums = {};

        if (popData && popData.length > 0) {
            const maxYear = Math.max(...popData.map(p => p.year || 0));
            const latestPopData = popData.filter(p => !p.year || p.year === maxYear);
            latestPopData.forEach(item => {
                const muni = (item.municipality || '').trim();
                const brgy = (item.barangay_name || '').trim();
                const pop = parseInt(item.population) || 0;
                if (!muni || muni === 'Non-Abra') return;
                
                allMunicipalities.add(muni);
                if (brgy && brgy.toLowerCase() !== 'all') muniPopSums[muni] = (muniPopSums[muni] || 0) + pop;
                if (!brgy || brgy.toLowerCase() === 'all') fullPopMap[muni] = pop;

                if (facilityType !== 'Hospital' && facilityType !== 'Clinic') {
                    if (muni.toLowerCase() === (currentHostMunicipality || '').toLowerCase()) {
                        if (brgy && brgy.toLowerCase() !== 'all') { baseKeys.add(brgy); popMap[brgy] = pop; fullPopMap[brgy] = pop; }
                    }
                } else {
                    baseKeys.add(muni);
                    if (!brgy || brgy.toLowerCase() === 'all') popMap[muni] = pop;
                }
            });
            allMunicipalities.forEach(m => {
                if (fullPopMap[m] === undefined) {
                    fullPopMap[m] = muniPopSums[m] || 0;
                    if ((facilityType === 'Hospital' || facilityType === 'Clinic') && popMap[m] === undefined) popMap[m] = muniPopSums[m] || 0;
                }
            });
        }
        fullPopMap["Non-Abra"] = 0;

        const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
        const { data: existingData, error: existingError } = await supabase
          .from('abtc_reports_v2').select('*').eq('year', year).eq('month', currentPeriod).eq('facility', activeFacilityName);
        if (existingError) throw existingError;

        const loadedState = {};
        if (existingData) {
          existingData.forEach(row => {
            if (!baseKeys.has(row.location_name)) {
                otherKeys.add(row.location_name);
                popMap[row.location_name] = fullPopMap[row.location_name] || 0;
            }
            loadedState[row.location_name] = {
              male: row.male || '', female: row.female || '', ageUnder15: row.age_under_15 || '', ageOver15: row.age_over_15 || '',
              cat1: row.cat1 || '', cat2EligPri: row.cat2_elig_pri || '', cat2EligBoost: row.cat2_elig_boost || '', cat2NonElig: row.cat2_non_elig || '',
              cat3EligPri: row.cat3_elig_pri || '', cat3EligBoost: row.cat3_elig_boost || '', cat3NonElig: row.cat3_non_elig || '',
              compCat2Pri: row.comp_cat2_pri || '', compCat2Boost: row.comp_cat2_boost || '',
              compCat3PriErig: row.comp_cat3_pri_erig || '', compCat3PriHrig: row.comp_cat3_pri_hrig || '', compCat3Boost: row.comp_cat3_boost || '',
              typeDog: row.type_dog || '', typeCat: row.type_cat || '', typeOthers: row.type_others || '',
              statusPet: row.status_pet || '', statusStray: row.status_stray || '', statusUnk: row.status_unk || '', rabiesCases: row.rabies_cases || ''
            };
          });
        }

        const sortedBaseKeys = Array.from(baseKeys).sort((a, b) => a.localeCompare(b));
        const sortedOtherKeys = Array.from(otherKeys).sort((a, b) => (a === "Non-Abra") ? 1 : (b === "Non-Abra") ? -1 : a.localeCompare(b));
        
        setFormRowKeys(sortedBaseKeys);
        setOtherRowKeys(sortedOtherKeys);
        setFormPopulations(popMap);
        setMasterPopulations(fullPopMap);
        setV2Data(loadedState);

        const combinedKeys = [...sortedBaseKeys, ...sortedOtherKeys];
        const availableMunis = Array.from(allMunicipalities).filter(m => !combinedKeys.includes(m) && m.toLowerCase() !== (currentHostMunicipality || '').toLowerCase()).sort();
        if (!combinedKeys.includes("Non-Abra")) availableMunis.push("Non-Abra");
        setAvailableLocationsToAdd(availableMunis);
      } catch (err) { console.error("Error fetching V2 data:", err); }
    };
    fetchV2Data();
  }, [activeFacilityName, currentHostMunicipality, year, month, quarter, periodType, facilityDetails]);

  // --- FETCH KPI STATS FOR PROGRESS TRACKER ---
  useEffect(() => {
    const fetchYearlyStats = async () => {
        if (!year || !activeFacilityName || isConsolidatedView) return;
        try {
            const { data: mainData } = await supabase.from('abtc_reports_v2').select('facility, month, status').eq('year', year).eq('facility', activeFacilityName);
            setYearlyStats({ main: mainData || [] });
        } catch (error) { console.error("Error fetching yearly stats:", error); }
    };
    fetchYearlyStats();
  }, [activeFacilityName, year, isConsolidatedView, reportStatus]);

  const myYearlyStats = yearlyStats.main || [];
  
  const getMonthStatus = (m) => {
      const record = myYearlyStats.find(r => r.month === m);
      return record ? record.status : 'Not Submitted';
  };

  const getStatusColor = (status, isFuture) => {
      if (isFuture) return 'bg-slate-50 border-slate-200 text-slate-300 border-dashed opacity-60';
      switch(status) {
          case 'Approved': return 'bg-emerald-500 border-emerald-600 text-white shadow-sm';
          case 'Pending': return 'bg-amber-500 border-amber-600 text-white shadow-sm';
          case 'Rejected': return 'bg-rose-500 border-rose-600 text-white shadow-sm';
          case 'Draft': return 'bg-slate-400 border-slate-500 text-white shadow-sm';
          default: return 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200';
      }
  };

  const submittedMonthsCount = MONTHS.filter(m => {
      const s = getMonthStatus(m);
      return s === 'Pending' || s === 'Approved';
  }).length;


  // --- DYNAMIC ROW ADDER / REMOVER ---
  const handleAddRow = () => {
      if (!selectedLocationToAdd) return;
      const updatedOtherKeys = [...otherRowKeys, selectedLocationToAdd].sort((a, b) => (a === "Non-Abra") ? 1 : (b === "Non-Abra") ? -1 : a.localeCompare(b));
      setOtherRowKeys(updatedOtherKeys);
      setFormPopulations(prev => ({ ...prev, [selectedLocationToAdd]: masterPopulations[selectedLocationToAdd] || 0 }));
      setAvailableLocationsToAdd(prev => prev.filter(loc => loc !== selectedLocationToAdd));
      setSelectedLocationToAdd("");
      toast.success(`${selectedLocationToAdd} added.`);
  };

  const confirmDeleteOtherRow = () => {
    const loc = deleteRowModal.location;
    setOtherRowKeys(prev => prev.filter(k => k !== loc));
    setV2Data(prev => {
        const next = { ...prev };
        delete next[loc];
        return next;
    });
    setAvailableLocationsToAdd(prev => [...prev, loc].sort((a,b) => (a==="Non-Abra")?1:(b==="Non-Abra")?-1:a.localeCompare(b)));
    setDeleteRowModal({ isOpen: false, location: null });
    toast.success(`${loc} removed from table.`);
  };

  const handleV2CellChange = (location, field, value) => {
    setV2Data(prev => ({ ...prev, [location]: { ...(prev[location] || {}), [field]: value } }));
  };

  // --- OFFLINE / SAVE / SUBMIT LOGIC ---
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
      const allKeysToSave = [...formRowKeys, ...otherRowKeys];
      
      const payload = allKeysToSave.map(loc => {
        const row = v2Data[loc] || {};
        const num = (val) => parseInt(val) || 0;
        return {
          year, month: currentPeriod, facility: activeFacilityName, location_name: loc,
          status, 
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
        if (isAnyAdmin && (status === 'Approved' || status === 'Rejected')) { toast.error("Offline: Reconnect to manage reports."); return; }
        if (!isAnyAdmin && status === 'Pending') { toast.warning("Offline: Report queued for auto-sync."); return; }
        if (status === 'Draft') { setShowDraftModal(true); return; }
    }
    if (status === 'Rejected') { setRejectionReason(''); setShowRejectModal(true); return; }
    if (status === 'Approved') { setShowApproveModal(true); return; }
    if (status === 'Draft') { setShowDraftModal(true); return; } 
    if (status === 'Pending') { 
        let hasErrors = false; let isCompletelyEmpty = true;
        for (const loc of [...formRowKeys, ...otherRowKeys]) {
            const row = v2Data[loc] || {};
            const n = (v) => parseInt(v) || 0;
            const tSex = n(row.male)+n(row.female); const tAge = n(row.ageUnder15)+n(row.ageOver15);
            const tAnim = n(row.typeDog)+n(row.typeCat)+n(row.typeOthers); const tStat = n(row.statusPet)+n(row.statusStray)+n(row.statusUnk);
            const tCase = n(row.cat1) + (n(row.cat2EligPri)+n(row.cat2EligBoost)+n(row.cat2NonElig)) + (n(row.cat3EligPri)+n(row.cat3EligBoost)+n(row.cat3NonElig));
            if (tSex > 0 || tAge > 0 || tCase > 0 || tAnim > 0) {
              isCompletelyEmpty = false;
              if (tSex !== tAge || tSex !== tCase || tCase !== tAnim || tAnim !== tStat) { hasErrors = true; break; }
            }
        }
        if (hasErrors) { toast.error("DATA MISMATCH: Totals must balance exactly."); return; }
        setIsZeroSubmit(isCompletelyEmpty); setShowSubmitModal(true); 
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
        {/* ALIGNED MASTER CONTAINER */}
        {/* ========================================== */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 pt-4 flex-1">
            
            {/* Header Section */}
            <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 border border-slate-800 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
                <div className="flex items-start sm:items-center gap-4 relative z-10">
                    {isAnyAdmin && <button onClick={onBack} className="p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"><ArrowLeft size={20}/></button>}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                        <h2 className="font-extrabold tracking-tight text-white text-2xl sm:text-3xl truncate">{activeFacilityName}</h2>
                        {!isConsolidatedView && !isAggregationMode && periodType === 'Monthly' && <StatusBadge status={reportStatus} />}
                    </div>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 relative z-10 w-full xl:w-auto shrink-0">
                    <button disabled={isDownloadingPdf || (!isConsolidatedView && !isAggregationMode && reportStatus !== 'Approved')} onClick={() => setShowExportModal(true)} className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                        {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} Export PDF
                    </button>
                    {!isConsolidatedView && !isAggregationMode && (
                        <div className="flex w-full sm:w-auto items-center gap-2 sm:pl-3 sm:border-l sm:border-slate-700">
                        {isAnyAdmin ? (
                            <>
                            <button onClick={() => onSaveClick('Approved')} disabled={loading || isSaving || reportStatus !== 'Pending'} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all whitespace-nowrap">Approve</button>
                            <button onClick={() => onSaveClick('Rejected')} disabled={loading || isSaving || reportStatus !== 'Pending'} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-slate-800 border border-slate-700 text-rose-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 hover:text-white transition-all whitespace-nowrap">Reject</button>
                            </>
                        ) : (
                            <>
                            <button onClick={() => onSaveClick('Draft')} disabled={loading || isSaving || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all whitespace-nowrap">
                                {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Draft
                            </button>
                            <button onClick={() => onSaveClick('Pending')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 whitespace-nowrap">
                                {isSaving ? <Loader2 size={16} className="animate-spin"/> : null} Submit Report
                            </button>
                            </>
                        )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                <h2 className="text-slate-800 font-bold px-4 shrink-0">DOH Form 1</h2>
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                    
                    {periodType === 'Monthly' && (
                        <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">
                            {availableMonths.filter(m => {
                                const isFuture = year > currentRealYear || (year === currentRealYear && MONTHS.indexOf(m) > currentRealMonthIdx);
                                return !isFuture;
                            }).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    )}
                    
                    {periodType === 'Quarterly' && (
                        <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">
                            {QUARTERS.filter((q, idx) => {
                                const isFuture = year > currentRealYear || (year === currentRealYear && idx > Math.floor(currentRealMonthIdx / 3));
                                return !isFuture;
                            }).map(q => <option key={q} value={q}>{formatQuarterName(q)}</option>)}
                        </select>
                    )}
                    
                    <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </div>

            {/* --- DYNAMIC PROGRESS TRACKER (Consolidated) --- */}
            {!isConsolidatedView && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 no-print">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Calendar size={18} className="text-blue-600"/>
                                Yearly Submission Progress ({year})
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Track monthly reports, quarterly milestones, and annual completion in one view.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shrink-0">
                            <span className="text-slate-600 uppercase tracking-wider text-[10px]">Annual Completion:</span>
                            <span className={`px-2 py-0.5 rounded-md ${submittedMonthsCount === 12 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {submittedMonthsCount} / 12
                            </span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600"></div> Approved</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500 border border-amber-600"></div> Pending</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500 border border-rose-600"></div> Rejected</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-400 border border-slate-500"></div> Draft</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div> Unsubmitted</div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map(qIdx => {
                            const qMonths = MONTHS.slice(qIdx * 3, qIdx * 3 + 3);
                            return (
                                <div key={qIdx} className="flex flex-col bg-slate-50 rounded-xl p-3 pt-4 border border-slate-100 relative">
                                    <span className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-black text-slate-400 border border-slate-200 rounded-full shadow-sm">
                                        Q{qIdx + 1}
                                    </span>
                                    <div className="flex gap-1.5">
                                        {qMonths.map(m => {
                                            const status = getMonthStatus(m);
                                            const isFuture = year > currentRealYear || (year === currentRealYear && MONTHS.indexOf(m) > currentRealMonthIdx);
                                            const colorClass = getStatusColor(status, isFuture);
                                            
                                            return (
                                                <div 
                                                    key={m} 
                                                    onClick={() => {
                                                        if (!isFuture) {
                                                            setMonth(m);
                                                            setPeriodType('Monthly');
                                                        }
                                                    }}
                                                    title={isFuture ? 'Future month' : `${m}: ${status}`}
                                                    className={`flex-1 py-2 rounded-md border flex flex-col items-center justify-center transition-all ${
                                                        isFuture ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md'
                                                    } ${colorClass}`}
                                                >
                                                    <span className="text-[10px] sm:text-xs font-black tracking-widest">{m.substring(0, 3).toUpperCase()}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {isOffline && (
                <div className="px-4 py-3 rounded-xl flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
                    <WifiOff size={20} className="text-amber-700 mt-0.5" strokeWidth={2.5} />
                    <div>
                        <p className="text-sm font-bold">You are currently offline.</p>
                        <p className="text-xs font-medium mt-0.5 text-amber-800/80">You can continue working. Drafts and submissions will be queued and auto-synced when internet is restored.</p>
                    </div>
                </div>
            )}

            {/* Main Table Container */}
            <div className="bg-white flex-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                {formRowKeys.length > 0 ? (
                    <>
                        <MainReportTableV2 
                            data={v2Data} baseRowKeys={formRowKeys} otherRowKeys={otherRowKeys} populations={formPopulations}
                            onChange={handleV2CellChange} 
                            isRowReadOnly={reportStatus === 'Approved' || reportStatus === 'Pending' || isConsolidatedView}
                            onDeleteOtherRow={(loc) => setDeleteRowModal({ isOpen: true, location: loc })}
                        />
                        
                        {!isConsolidatedView && reportStatus !== 'Approved' && reportStatus !== 'Pending' && (
                            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Plus size={16} strokeWidth={3}/></div>
                                    <div><h3 className="text-sm font-bold text-slate-800">Add Patient Origin</h3><p className="text-[10px] text-slate-500 font-medium">Report cases from outside your catchment area.</p></div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select value={selectedLocationToAdd} onChange={e => setSelectedLocationToAdd(e.target.value)} className="text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-[220px] focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 bg-white">
                                        <option value="">-- Select Municipality --</option>
                                        {availableLocationsToAdd.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
                                    <button onClick={handleAddRow} disabled={!selectedLocationToAdd} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Add Row</button>
                                </div>
                            </div>
                        )}
                    </>
                ) : <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Loader2 className="animate-spin mb-4 text-blue-500" size={32} /><p>Loading forms...</p></div>}
            </div>
        </div>

        {/* Confirmation Modals */}
        {deleteRowModal.isOpen && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-2xl">
                        <Trash2 size={32} className="mx-auto mb-4 text-rose-500" />
                        <h3 className="text-xl font-bold mb-2">Remove Row?</h3>
                        <p className="text-sm text-slate-500 mb-6">Are you sure you want to remove <b>{deleteRowModal.location}</b>? All unsaved data in this row will be lost.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteRowModal({ isOpen: false, location: null })} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-700 transition-colors">Cancel</button>
                            <button onClick={confirmDeleteOtherRow} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-sm">Remove Row</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {showSubmitModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
                        <AlertCircle size={32} className={`mx-auto mb-4 ${isZeroSubmit ? 'text-amber-500' : 'text-blue-600'}`} />
                        <h3 className="text-xl font-bold mb-2">{isZeroSubmit ? "Submit Zero Case Report?" : "Submit Report?"}</h3>
                        <p className="text-sm text-slate-500 mb-6">Verify all data entries before submission. This action cannot be undone by you.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-700">Cancel</button>
                            <button onClick={confirmSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Confirm</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}
        {showDraftModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
                        <Save size={32} className="mx-auto mb-4 text-slate-800" />
                        <h3 className="text-xl font-bold mb-2">Save as Draft?</h3>
                        <p className="text-sm text-slate-500 mb-6">Current progress will be saved. You can submit it later.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDraftModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-semibold text-slate-700">Cancel</button>
                            <button onClick={confirmSaveDraft} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold">Save Draft</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}
    </div>
  );
}