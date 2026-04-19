import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, FileDown, CheckCircle, XCircle, ArrowLeft, MessageSquare, X, Trash2, TrendingUp, ChevronDown, Clock, Archive, Building2, Layers, WifiOff, Plus, Calendar, CalendarCheck, BarChart3, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { MONTHS, QUARTERS } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';
import ModalPortal from '../modals/ModalPortal';
import { supabase } from '../../lib/supabase';
import MainReportTableV2 from '../reports/MainReportTableV2';
import { saveOfflineDraft, getOfflineDraft, clearOfflineDraft } from '../../lib/offlineDB';
import { useReportStore } from '../../store/useReportStore';
import { exportToExcelTemplate } from '../../lib/excelExporter'; 

export default function FacilityDashboard({
  periodType, setPeriodType, year, setYear, month, setMonth, quarter, setQuarter,
  availableYears, availableMonths, adminViewMode, selectedFacility, onBack, currentRealYear, currentRealMonthIdx 
}) {
  const { user, facilityDetails, globalSettings, userProfile } = useApp();
  const isAnyAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';

  const formRowKeys = useReportStore(state => state.formRowKeys);
  const otherRowKeys = useReportStore(state => state.otherRowKeys);
  const availableLocationsToAdd = useReportStore(state => state.availableLocationsToAdd);
  const selectedLocationToAdd = useReportStore(state => state.selectedLocationToAdd);
  const setSelectedLocationToAdd = useReportStore(state => state.setSelectedLocationToAdd);
  const addOtherRow = useReportStore(state => state.addOtherRow);
  const deleteOtherRow = useReportStore(state => state.deleteOtherRow);
  const setInitialData = useReportStore(state => state.setInitialData);

  useEffect(() => {
    return () => useReportStore.getState().reset();
  }, []);

  const [deleteRowModal, setDeleteRowModal] = useState({ isOpen: false, location: null });
  const [isExporting, setIsExporting] = useState(false); 
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false); 
  const [showExportModal, setShowExportModal] = useState(false); 
  const [showDraftModal, setShowDraftModal] = useState(false); 
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isZeroSubmit, setIsZeroSubmit] = useState(false);

  const [v2Status, setV2Status] = useState('Draft');
  const [isFetchingV2, setIsFetchingV2] = useState(false); 

  const [yearlyStats, setYearlyStats] = useState({ main: [] });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const formatQuarterName = (q) => {
      if (!q) return '';
      if (q.toString().toLowerCase().includes('1')) return '1st Quarter';
      if (q.toString().toLowerCase().includes('2')) return '2nd Quarter';
      if (q.toString().toLowerCase().includes('3')) return '3rd Quarter';
      if (q.toString().toLowerCase().includes('4')) return '4th Quarter';
      return q;
  };

  const { loading, isSaving, activeFacilityName, currentHostMunicipality } = useReportData({
    user, facilityDetails, year, month, quarter, periodType, adminViewMode, selectedFacility
  });

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  let currentFacilityType = facilityDetails?.[activeFacilityName]?.type;
  if (!currentFacilityType && activeFacilityName) {
      if (activeFacilityName.includes('Hospital') || activeFacilityName === 'APH') currentFacilityType = 'Hospital';
      else if (activeFacilityName.includes('Clinic') || activeFacilityName === 'AMDC') currentFacilityType = 'Clinic';
      else currentFacilityType = 'RHU';
  }

  // --- FIXED: AUDIT LOGGER MATCHING YOUR EXACT DATABASE COLUMNS ---
  const logAuditAction = async (actionType, actionDetails) => {
    if (!navigator.onLine) return; 
    try {
        const currentPeriodStr = periodType === 'Monthly' ? month : periodType === 'Quarterly' ? formatQuarterName(quarter) : 'Annual';
        
        const { error } = await supabase.from('audit_logs').insert({
            user_id: user?.id || null, // Using user_id instead of role
            actor_name: user?.fullName || user?.name || 'Unknown User', // Using actor_name instead of user_name
            facility_name: activeFacilityName, 
            action: actionType,
            report_type: 'Animal Bite and Rabies Report Form', 
            period_info: `${currentPeriodStr} ${year}`,
            details: actionDetails
        });
        if (error) console.error("Failed to log audit action:", error);
    } catch (err) {
        console.error("Audit Log Exception:", err);
    }
  };

  useEffect(() => {
    const fetchV2Data = async () => {
      if (!activeFacilityName) return;
      setIsFetchingV2(true); 
      
      try {
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

                if (currentFacilityType !== 'Hospital' && currentFacilityType !== 'Clinic') {
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
                    if ((currentFacilityType === 'Hospital' || currentFacilityType === 'Clinic') && popMap[m] === undefined) popMap[m] = muniPopSums[m] || 0;
                }
            });
        }
        fullPopMap["Non-Abra"] = 0;

        const targetMonths = periodType === 'Monthly' 
            ? [month] 
            : periodType === 'Quarterly' 
                ? MONTHS.slice(QUARTERS.indexOf(quarter) * 3, QUARTERS.indexOf(quarter) * 3 + 3)
                : MONTHS;

        const { data: existingData, error: existingError } = await supabase
          .from('abtc_reports_v2')
          .select('*')
          .eq('year', year)
          .in('month', targetMonths) 
          .eq('facility', activeFacilityName);
        
        if (existingError) throw existingError;

        if (existingData && existingData.length > 0) {
            if (periodType === 'Monthly') setV2Status(existingData[0].status || 'Draft');
            else setV2Status('View Only'); 
        } else {
            setV2Status('Draft');
        }

        const loadedState = {};
        const getV = (val) => (val === null || val === undefined) ? '' : String(val);

        if (existingData) {
            if (periodType === 'Monthly') {
                existingData.forEach(row => {
                    if (!baseKeys.has(row.location_name)) {
                        otherKeys.add(row.location_name);
                        popMap[row.location_name] = 0;
                    }
                    loadedState[row.location_name] = {
                        male: getV(row.male), female: getV(row.female), 
                        ageUnder15: getV(row.age_under_15), ageOver15: getV(row.age_over_15),
                        cat1: getV(row.cat1), 
                        cat2EligPri: getV(row.cat2_elig_pri), cat2EligBoost: getV(row.cat2_elig_boost), cat2NonElig: getV(row.cat2_non_elig),
                        cat3EligPri: getV(row.cat3_elig_pri), cat3EligBoost: getV(row.cat3_elig_boost), cat3NonElig: getV(row.cat3_non_elig),
                        compCat2Pri: getV(row.comp_cat2_pri), compCat2Boost: getV(row.comp_cat2_boost),
                        compCat3PriErig: getV(row.comp_cat3_pri_erig), compCat3PriHrig: getV(row.comp_cat3_pri_hrig), compCat3Boost: getV(row.comp_cat3_boost),
                        typeDog: getV(row.type_dog), typeCat: getV(row.type_cat), typeOthers: getV(row.type_others),
                        statusPet: getV(row.status_pet), statusStray: getV(row.status_stray), statusUnk: getV(row.status_unk), 
                        rabiesCases: getV(row.rabies_cases)
                    };
                });
            } else {
                existingData.forEach(row => {
                    const loc = row.location_name;
                    if (!baseKeys.has(loc)) {
                        otherKeys.add(loc);
                        if (popMap[loc] === undefined) popMap[loc] = 0;
                    }
                    
                    if (!loadedState[loc]) {
                        loadedState[loc] = { 
                            male: null, female: null, ageUnder15: null, ageOver15: null, cat1: null, 
                            cat2EligPri: null, cat2EligBoost: null, cat2NonElig: null, 
                            cat3EligPri: null, cat3EligBoost: null, cat3NonElig: null, 
                            compCat2Pri: null, compCat2Boost: null, compCat3PriErig: null, compCat3PriHrig: null, compCat3Boost: null, 
                            typeDog: null, typeCat: null, typeOthers: null, statusPet: null, statusStray: null, statusUnk: null, rabiesCases: null 
                        };
                    }

                    const addVal = (current, incoming) => {
                        if (incoming === null || incoming === undefined || incoming === '') return current;
                        const num = parseInt(incoming, 10);
                        if (isNaN(num)) return current;
                        return (current === null ? 0 : current) + num;
                    };
                    
                    loadedState[loc].male = addVal(loadedState[loc].male, row.male);
                    loadedState[loc].female = addVal(loadedState[loc].female, row.female);
                    loadedState[loc].ageUnder15 = addVal(loadedState[loc].ageUnder15, row.age_under_15);
                    loadedState[loc].ageOver15 = addVal(loadedState[loc].ageOver15, row.age_over_15);
                    loadedState[loc].cat1 = addVal(loadedState[loc].cat1, row.cat1);
                    loadedState[loc].cat2EligPri = addVal(loadedState[loc].cat2EligPri, row.cat2_elig_pri);
                    loadedState[loc].cat2EligBoost = addVal(loadedState[loc].cat2EligBoost, row.cat2_elig_boost);
                    loadedState[loc].cat2NonElig = addVal(loadedState[loc].cat2NonElig, row.cat2_non_elig);
                    loadedState[loc].cat3EligPri = addVal(loadedState[loc].cat3EligPri, row.cat3_elig_pri);
                    loadedState[loc].cat3EligBoost = addVal(loadedState[loc].cat3EligBoost, row.cat3_elig_boost);
                    loadedState[loc].cat3NonElig = addVal(loadedState[loc].cat3NonElig, row.cat3_non_elig);
                    loadedState[loc].compCat2Pri = addVal(loadedState[loc].compCat2Pri, row.comp_cat2_pri);
                    loadedState[loc].compCat2Boost = addVal(loadedState[loc].compCat2Boost, row.comp_cat2_boost);
                    loadedState[loc].compCat3PriErig = addVal(loadedState[loc].compCat3PriErig, row.comp_cat3_pri_erig);
                    loadedState[loc].compCat3PriHrig = addVal(loadedState[loc].compCat3PriHrig, row.comp_cat3_pri_hrig);
                    loadedState[loc].compCat3Boost = addVal(loadedState[loc].compCat3Boost, row.comp_cat3_boost);
                    loadedState[loc].typeDog = addVal(loadedState[loc].typeDog, row.type_dog);
                    loadedState[loc].typeCat = addVal(loadedState[loc].typeCat, row.type_cat);
                    loadedState[loc].typeOthers = addVal(loadedState[loc].typeOthers, row.type_others);
                    loadedState[loc].statusPet = addVal(loadedState[loc].statusPet, row.status_pet);
                    loadedState[loc].statusStray = addVal(loadedState[loc].statusStray, row.status_stray);
                    loadedState[loc].statusUnk = addVal(loadedState[loc].statusUnk, row.status_unk);
                    loadedState[loc].rabiesCases = addVal(loadedState[loc].rabiesCases, row.rabies_cases);
                });

                Object.keys(loadedState).forEach(loc => {
                    Object.keys(loadedState[loc]).forEach(k => {
                        loadedState[loc][k] = loadedState[loc][k] === null ? '' : String(loadedState[loc][k]);
                    });
                });
            }
        }

        const sortedBaseKeys = Array.from(baseKeys).sort((a, b) => a.localeCompare(b));
        
        if (currentFacilityType === 'Hospital' || currentFacilityType === 'Clinic') {
            if (!sortedBaseKeys.includes("Non-Abra")) {
                sortedBaseKeys.push("Non-Abra");
            }
            popMap["Non-Abra"] = 0; 
        }

        const sortedOtherKeys = Array.from(otherKeys)
            .filter(k => !sortedBaseKeys.includes(k))
            .sort((a, b) => (a === "Non-Abra") ? 1 : (b === "Non-Abra") ? -1 : a.localeCompare(b));
            
        const combinedKeys = [...sortedBaseKeys, ...sortedOtherKeys];
        const availableMunis = Array.from(allMunicipalities).filter(m => !combinedKeys.includes(m) && m.toLowerCase() !== (currentHostMunicipality || '').toLowerCase()).sort();
        if (!combinedKeys.includes("Non-Abra")) availableMunis.push("Non-Abra");

        setInitialData({
          formRowKeys: sortedBaseKeys,
          otherRowKeys: sortedOtherKeys,
          formPopulations: popMap,
          masterPopulations: fullPopMap,
          v2Data: loadedState,
          availableLocationsToAdd: availableMunis,
          selectedLocationToAdd: ""
        });

      } catch (err) { 
        console.error("Error fetching V2 data:", err); 
      } finally {
        setIsFetchingV2(false);
      }
    };
    fetchV2Data();
  }, [activeFacilityName, currentHostMunicipality, year, month, quarter, periodType, facilityDetails, setInitialData, currentFacilityType]);

  useEffect(() => {
    const fetchYearlyStats = async () => {
        if (!year || !activeFacilityName || isConsolidatedView) return;
        try {
            const { data: mainData } = await supabase.from('abtc_reports_v2').select('facility, month, status').eq('year', year).eq('facility', activeFacilityName);
            setYearlyStats({ main: mainData || [] });
        } catch (error) { console.error("Error fetching yearly stats:", error); }
    };
    fetchYearlyStats();
  }, [activeFacilityName, year, isConsolidatedView, v2Status]);

  const myYearlyStats = yearlyStats.main || [];
  const getMonthStatus = (m) => { const record = myYearlyStats.find(r => r.month === m); return record ? record.status : 'Not Submitted'; };
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
  
  const submittedMonthsCount = MONTHS.filter(m => ['Pending', 'Approved'].includes(getMonthStatus(m))).length;

  let canExportExcel = true;
  let exportWarning = "";

  if (periodType === 'Quarterly') {
      const qIdx = QUARTERS.indexOf(quarter);
      const qMonths = MONTHS.slice(qIdx * 3, qIdx * 3 + 3);
      const completeMonths = qMonths.filter(m => getMonthStatus(m) === 'Approved').length;
      if (completeMonths < 3) {
          canExportExcel = false;
          exportWarning = `Cannot export: Only ${completeMonths}/3 months approved for this quarter.`;
      }
  } else if (periodType === 'Annual') {
      const approvedMonthsCount = MONTHS.filter(m => getMonthStatus(m) === 'Approved').length;
      if (approvedMonthsCount < 12) {
          canExportExcel = false;
          exportWarning = `Cannot export: Only ${approvedMonthsCount}/12 months approved for the year.`;
      }
  }

  const handleAddRow = () => {
      const addedLoc = addOtherRow();
      if (addedLoc) {
          toast.success(`${addedLoc} added.`);
          setTimeout(() => {
              const tableContainer = document.getElementById('v2-table-container');
              if (tableContainer) tableContainer.scrollTo({ top: tableContainer.scrollHeight, behavior: 'smooth' });
          }, 100);
      }
  };

  const confirmDeleteOtherRow = () => {
    const loc = deleteRowModal.location;
    deleteOtherRow(loc);
    setDeleteRowModal({ isOpen: false, location: null });
    toast.success(`${loc} removed from table.`);
  };

  useEffect(() => {
    const checkOfflineDraft = async () => {
        const draft = await getOfflineDraft(); 
        if (draft && navigator.onLine) {
            try {
                toast.info("🌐 Connection restored! Auto-syncing offline V2 report...", { duration: 4000 });
                const payload = Object.entries(draft.data).map(([loc, row]) => {
                    const num = (val) => (val === '' || val === null || val === undefined) ? null : parseInt(val);
                    return {
                        year: draft.year, month: draft.month, facility: draft.facility, location_name: loc, status: draft.intendedStatus || 'Draft',
                        male: num(row.male), female: num(row.female), age_under_15: num(row.ageUnder15), age_over_15: num(row.ageOver15),
                        cat1: num(row.cat1), cat2_elig_pri: num(row.cat2EligPri), cat2_elig_boost: num(row.cat2EligBoost), cat2_non_elig: num(row.cat2NonElig),
                        cat3_elig_pri: num(row.cat3EligPri), cat3_elig_boost: num(row.cat3EligBoost), cat3_non_elig: num(row.cat3NonElig),
                        comp_cat2_pri: num(row.compCat2Pri), comp_cat2_boost: num(row.compCat2Boost), comp_cat3_pri_erig: num(row.compCat3PriErig), comp_cat3_pri_hrig: num(row.compCat3PriHrig), comp_cat3_boost: num(row.compCat3Boost),
                        type_dog: num(row.typeDog), type_cat: num(row.typeCat), type_others: num(row.typeOthers),
                        status_pet: num(row.statusPet), status_stray: num(row.statusStray), status_unk: num(row.statusUnk), rabies_cases: num(row.rabiesCases)
                    };
                });
                const { error } = await supabase.from('abtc_reports_v2').upsert(payload, { onConflict: 'year, month, facility, location_name' });
                if (error) throw error;
                await clearOfflineDraft(); 
                toast.success("Offline data successfully synced to the server!", { duration: 5000 });
            } catch (err) { console.error("Auto Sync Error:", err); }
        }
    };
    window.addEventListener('online', checkOfflineDraft);
    checkOfflineDraft();
    return () => window.removeEventListener('online', checkOfflineDraft);
  }, []);

  const saveV2Report = async (status, reason = '') => {
    try {
      const { v2Data, formRowKeys, otherRowKeys } = useReportStore.getState();
      const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
      const allKeysToSave = [...formRowKeys, ...otherRowKeys];
      
      const payload = allKeysToSave.map(loc => {
        const row = v2Data[loc] || {};
        const num = (val) => (val === '' || val === null || val === undefined) ? null : parseInt(val);
        return {
          year, month: currentPeriod, facility: activeFacilityName, location_name: loc, status, 
          male: num(row.male), female: num(row.female), age_under_15: num(row.ageUnder15), age_over_15: num(row.ageOver15),
          cat1: num(row.cat1), cat2_elig_pri: num(row.cat2EligPri), cat2_elig_boost: num(row.cat2EligBoost), cat2_non_elig: num(row.cat2NonElig),
          cat3_elig_pri: num(row.cat3EligPri), cat3_elig_boost: num(row.cat3EligBoost), cat3_non_elig: num(row.cat3NonElig),
          comp_cat2_pri: num(row.compCat2Pri), comp_cat2_boost: num(row.compCat2Boost), comp_cat3_pri_erig: num(row.compCat3PriErig), comp_cat3_pri_hrig: num(row.compCat3PriHrig), comp_cat3_boost: num(row.compCat3Boost),
          type_dog: num(row.typeDog), type_cat: num(row.typeCat), type_others: num(row.typeOthers),
          status_pet: num(row.statusPet), status_stray: num(row.statusStray), status_unk: num(row.statusUnk), rabies_cases: num(row.rabiesCases)
        };
      });

      const { error } = await supabase.from('abtc_reports_v2').upsert(payload, { onConflict: 'year, month, facility, location_name' });
      if (error) throw error;
      
      setV2Status(status);
      toast.success(`Report successfully marked as ${status}`);

      let logActionName = status === 'Pending' ? 'SUBMITTED' : status.toUpperCase();
      let logDetails = `The Animal Bite and Rabies Report Form was marked as ${status}.`;
      if (status === 'Rejected') logDetails += ` Reason: "${reason}"`;
      await logAuditAction(logActionName, logDetails);

      if (status === 'Pending' || status === 'Approved' || status === 'Rejected') {
          
          let notifRecipient = 'PHO Admin'; 
          let notifTitle = '';
          let notifMessage = '';

          if (status === 'Pending') {
              notifTitle = 'New Report Submitted';
              notifMessage = `${activeFacilityName} has submitted their Animal Bite and Rabies Report Form for ${currentPeriod} ${year}. It is now pending your review.`;
          } else if (status === 'Approved') {
              notifRecipient = activeFacilityName; 
              notifTitle = 'Report Approved';
              notifMessage = `Your Animal Bite and Rabies Report Form for ${currentPeriod} ${year} has been reviewed and APPROVED by the Provincial Health Office.`;
          } else if (status === 'Rejected') {
              notifRecipient = activeFacilityName; 
              notifTitle = 'Report Rejected';
              notifMessage = `ACTION REQUIRED: Your Animal Bite and Rabies Report Form for ${currentPeriod} ${year} has been REJECTED. Reason: "${reason}". Please review the data, correct any errors, and resubmit.`;
          }

          const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                  recipient: notifRecipient,
                  title: notifTitle, 
                  message: notifMessage,
                  read: false
              });

          if (notifError) console.error("Failed to send notification:", notifError);
      }

    } catch (err) { toast.error("Failed to save report."); }
  };

  const handleDeleteV2Report = async () => {
    setShowDeleteReportModal(false);
    try {
        const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
        const { error } = await supabase.from('abtc_reports_v2')
            .delete()
            .eq('year', year)
            .eq('month', currentPeriod)
            .eq('facility', activeFacilityName);
        
        if (error) throw error;
        
        toast.success("Report deleted successfully.");
        
        await logAuditAction('DELETED', `Permanently deleted the Animal Bite and Rabies Report Form.`);
        
        window.location.reload(); 
    } catch (err) {
        toast.error("Failed to delete report.");
    }
  };

  const handleExportExcel = async () => {
      setShowExportModal(false);
      setIsExporting(true);
      
      try {
          const { v2Data, formRowKeys, otherRowKeys, formPopulations } = useReportStore.getState();
          
          let rawDataForAnnual = null;
          if (periodType === 'Annual') {
              const { data: rd, error } = await supabase.from('abtc_reports_v2')
                  .select('*')
                  .eq('year', year)
                  .eq('facility', activeFacilityName);
              if (error) throw error;
              rawDataForAnnual = rd;
          }

          await exportToExcelTemplate({
              data: v2Data,
              formRowKeys,   
              otherRowKeys,  
              populations: formPopulations,
              periodType,
              quarter,
              month,
              year,
              facilityName: activeFacilityName,
              globalSettings,
              userProfile,
              rawData: rawDataForAnnual 
          });
          
          toast.success("Excel file generated successfully!");
          
          await logAuditAction('EXPORTED', `Exported the Animal Bite and Rabies Report Form to Excel.`);

      } catch (error) {
          console.error(error);
          toast.error("Failed to generate Excel file. Ensure doh_template.xlsx is in the public folder.");
      } finally {
          setIsExporting(false);
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
        const { v2Data, formRowKeys, otherRowKeys } = useReportStore.getState();
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
      if (!rejectionReason.trim()) { toast.error("Please provide a reason for rejection."); return; }
      setShowRejectModal(false); 
      await saveV2Report('Rejected', rejectionReason); 
  };
  
  const confirmSubmit = async () => { setShowSubmitModal(false); await saveV2Report('Pending'); };
  
  const confirmSaveDraft = async () => { 
    setShowDraftModal(false); 
    if (!navigator.onLine) {
        const { v2Data } = useReportStore.getState();
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

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 relative pb-24">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 pt-4 flex-1">
            <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 border border-slate-800 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
                <div className="flex items-start sm:items-center gap-4 relative z-10">
                    {isAnyAdmin && <button onClick={onBack} className="p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:text-white active:scale-95 transition-all duration-200"><ArrowLeft size={20}/></button>}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                        <h2 className="font-extrabold tracking-tight text-white text-2xl sm:text-3xl truncate">{activeFacilityName}</h2>
                        {!isConsolidatedView && !isAggregationMode && periodType === 'Monthly' && <StatusBadge status={v2Status} />}
                    </div>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 relative z-10 w-full xl:w-auto shrink-0">
                    
                    {periodType !== 'Monthly' && (
                        <button 
                            disabled={isExporting || !canExportExcel} 
                            title={exportWarning}
                            onClick={() => setShowExportModal(true)} 
                            className="w-full sm:w-auto bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 active:scale-95 active:bg-slate-900 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            {isExporting ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} Export Excel
                        </button>
                    )}

                    {!isConsolidatedView && !isAggregationMode && (
                        <div className="flex w-full sm:w-auto items-center gap-2 sm:pl-3 sm:border-l sm:border-slate-700">
                        {isAnyAdmin ? (
                            <>
                            <button 
                                onClick={() => onSaveClick('Approved')} 
                                disabled={loading || isFetchingV2 || isSaving || v2Status !== 'Pending'} 
                                className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 active:scale-95 active:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none whitespace-nowrap"
                            >
                                Approve
                            </button>
                            <button 
                                onClick={() => onSaveClick('Rejected')} 
                                disabled={loading || isFetchingV2 || isSaving || (v2Status !== 'Pending' && v2Status !== 'Approved')} 
                                className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-slate-800 border border-slate-700 text-rose-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-600 hover:text-white active:scale-95 active:bg-rose-700 transition-all duration-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:pointer-events-none whitespace-nowrap"
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => setShowDeleteReportModal(true)} 
                                disabled={loading || isFetchingV2 || isSaving || v2Status === 'Draft'} 
                                className="flex-none justify-center flex items-center bg-white border border-slate-200 text-slate-400 px-3 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-90 active:bg-rose-100 transition-all duration-200 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none shadow-sm"
                                title="Delete Report"
                            >
                                <Trash2 size={16} />
                            </button>
                            </>
                        ) : (
                            <>
                            <button onClick={() => onSaveClick('Draft')} disabled={loading || isFetchingV2 || isSaving || v2Status === 'Approved' || v2Status === 'Pending'} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 active:scale-95 active:bg-slate-900 transition-all duration-200 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none whitespace-nowrap">
                                {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Draft
                            </button>
                            <button onClick={() => onSaveClick('Pending')} disabled={loading || isFetchingV2 || isSaving || v2Status === 'Pending' || v2Status === 'Approved'} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 active:bg-blue-800 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none whitespace-nowrap">
                                {isSaving ? <Loader2 size={16} className="animate-spin"/> : null} Submit Report
                            </button>
                            </>
                        )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                <h2 className="text-slate-800 font-bold px-4 shrink-0">Animal Bite and Rabies Report Form</h2>
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                    {periodType === 'Monthly' && (
                        <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">
                            {availableMonths.filter(m => !(year > currentRealYear || (year === currentRealYear && MONTHS.indexOf(m) > currentRealMonthIdx))).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    )}
                    {periodType === 'Quarterly' && (
                        <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">
                            {QUARTERS.filter((q, idx) => !(year > currentRealYear || (year === currentRealYear && idx > Math.floor(currentRealMonthIdx / 3)))).map(q => <option key={q} value={q}>{formatQuarterName(q)}</option>)}
                        </select>
                    )}
                    <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
            </div>

            {!isConsolidatedView && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 no-print">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} className="text-blue-600"/> Yearly Submission Progress ({year})</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Track monthly reports, quarterly milestones, and annual completion in one view.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shrink-0">
                            <span className="text-slate-600 uppercase tracking-wider text-[10px]">Annual Completion:</span>
                            <span className={`px-2 py-0.5 rounded-md ${submittedMonthsCount === 12 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{submittedMonthsCount} / 12</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600"></div> Approved</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500 border border-amber-600"></div> Pending</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500 border border-rose-600"></div> Rejected</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-400 border border-slate-500"></div> Draft</div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div> Unsubmitted</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map(qIdx => {
                            const qMonths = MONTHS.slice(qIdx * 3, qIdx * 3 + 3);
                            const qVal = String(quarter).replace(/\D/g, '');
                            const isActiveQuarter = periodType === 'Quarterly' && parseInt(qVal) === qIdx + 1;

                            return (
                                <div key={qIdx} className={`flex flex-col bg-slate-50 rounded-xl p-3 pt-4 border relative transition-all duration-300 ${isActiveQuarter ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50/20 shadow-md z-10' : 'border-slate-100'}`}>
                                    <span className={`absolute -top-2.5 left-3 px-2 text-[10px] font-black rounded-full shadow-sm transition-all duration-300 ${isActiveQuarter ? 'bg-blue-600 text-white border border-blue-700' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                        Q{qIdx + 1}
                                    </span>
                                    <div className="flex gap-1.5">
                                        {qMonths.map(m => {
                                            const status = getMonthStatus(m);
                                            const isFuture = year > currentRealYear || (year === currentRealYear && MONTHS.indexOf(m) > currentRealMonthIdx);
                                            const isActiveMonth = periodType === 'Monthly' && month === m;
                                            
                                            return (
                                                <div 
                                                    key={m} 
                                                    onClick={() => { if (!isFuture) { setMonth(m); setPeriodType('Monthly'); } }} 
                                                    title={isFuture ? 'Future month' : `${m}: ${status}`} 
                                                    className={`flex-1 py-2 rounded-md border flex flex-col items-center justify-center transition-all duration-300 ${
                                                        isFuture ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'
                                                    } ${getStatusColor(status, isFuture)} ${isActiveMonth ? 'ring-2 ring-offset-1 ring-blue-500 border-blue-500 shadow-md scale-[1.05] z-20' : ''}`}
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
                    <div><p className="text-sm font-bold">You are currently offline.</p><p className="text-xs font-medium mt-0.5 text-amber-800/80">You can continue working. Drafts and submissions will be queued and auto-synced when internet is restored.</p></div>
                </div>
            )}

            <div className="bg-white flex-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                {formRowKeys.length > 0 ? (
                    <>
                        <MainReportTableV2 
                            isRowReadOnly={isAnyAdmin || v2Status === 'Approved' || v2Status === 'Pending' || isConsolidatedView || isAggregationMode}
                            onDeleteOtherRow={(loc) => setDeleteRowModal({ isOpen: true, location: loc })}
                        />
                        
                        {!isConsolidatedView && !isAnyAdmin && !isAggregationMode && v2Status !== 'Approved' && v2Status !== 'Pending' && currentFacilityType === 'RHU' && (
                            <div className="bg-white border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100"><MapPin size={16} strokeWidth={2.5}/></div>
                                    <div><h3 className="text-sm font-bold text-slate-800 tracking-tight">Add Patient Origin</h3><p className="text-[11px] text-slate-400 font-medium mt-0.5">Include cases from other municipalities</p></div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-auto">
                                        <select value={selectedLocationToAdd} onChange={e => setSelectedLocationToAdd(e.target.value)} disabled={availableLocationsToAdd.length === 0} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-4 focus:ring-slate-50 focus:border-slate-300 transition-all shadow-sm w-full sm:w-[220px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                            <option value="" disabled className="text-slate-400">Select municipality...</option>
                                            {availableLocationsToAdd.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <button onClick={handleAddRow} disabled={!selectedLocationToAdd} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 active:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none text-sm font-bold px-4 py-2 rounded-lg shadow-sm whitespace-nowrap flex items-center gap-1.5 cursor-pointer"><Plus size={14} strokeWidth={2.5}/> Add</button>
                                </div>
                            </div>
                        )}
                    </>
                ) : <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Loader2 className="animate-spin mb-4 text-blue-500" size={32} /><p>Loading forms...</p></div>}
            </div>
        </div>

        {/* --- EXPORT MODAL --- */}
        {showExportModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <FileDown size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Export as Excel?</h3>
                        <p className="text-sm text-slate-500 mb-6">This will generate a highly detailed Animal Bite and Rabies Report Form Accomplishment Report in Excel format.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200">Cancel</button>
                            <button onClick={handleExportExcel} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 active:bg-blue-800 transition-all duration-200 shadow-sm flex justify-center items-center gap-2">
                                {isExporting ? <Loader2 size={16} className="animate-spin"/> : null} 
                                Generate Excel
                            </button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* --- DELETE OTHER ROW MODAL --- */}
        {deleteRowModal.isOpen && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                            <Trash2 size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Remove Row?</h3>
                        <p className="text-sm text-slate-500 mb-6">Are you sure you want to remove <strong>{deleteRowModal.location}</strong> from the report? This will clear its data.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteRowModal({ isOpen: false, location: null })} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200">Cancel</button>
                            <button onClick={confirmDeleteOtherRow} className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 active:scale-95 active:bg-rose-700 transition-all duration-200 shadow-sm">Remove</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* --- DRAFT MODAL --- */}
        {showDraftModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4">
                            <Save size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Save Draft?</h3>
                        <p className="text-sm text-slate-500 mb-6">You can return and edit this report later before submitting it to the Provincial Health Office.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDraftModal(false)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200">Cancel</button>
                            <button onClick={confirmSaveDraft} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 active:scale-95 active:bg-black transition-all duration-200 shadow-sm">Save Draft</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* --- SUBMIT MODAL --- */}
        {showSubmitModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Submit Report?</h3>
                        {isZeroSubmit ? (
                            <p className="text-sm text-rose-500 font-medium mb-6 bg-rose-50 p-2 rounded-lg border border-rose-100">Warning: You are submitting a completely blank (ZERO) report.</p>
                        ) : (
                            <p className="text-sm text-slate-500 mb-6">Once submitted, this report will be locked for review by the Provincial Health Office.</p>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200">Cancel</button>
                            <button onClick={confirmSubmit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 active:bg-blue-800 transition-all duration-200 shadow-sm">Submit Now</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* --- APPROVE MODAL --- */}
        {showApproveModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Approve Report?</h3>
                        <p className="text-sm text-slate-500 mb-6">This will mark the report as completed and include it in the consolidated analytics.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200">Cancel</button>
                            <button onClick={confirmApprove} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 active:scale-95 active:bg-emerald-700 transition-all duration-200 shadow-sm">Approve</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* --- REJECT MODAL --- */}
        {showRejectModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                            <XCircle size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Reject Report?</h3>
                        <p className="text-sm text-slate-500 mb-4">This will return the report to the facility encoder for corrections.</p>
                        
                        <div className="text-left mb-6">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Reason for Rejection <span className="text-rose-500">*</span></label>
                            <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="E.g., Please double-check the Category 2 animal count."
                                className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none transition-all shadow-sm"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200">Cancel</button>
                            <button onClick={confirmRejection} disabled={!rejectionReason.trim()} className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 active:scale-95 active:bg-rose-700 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-sm">Reject</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* --- DELETE REPORT MODAL --- */}
        {showDeleteReportModal && (
            <ModalPortal>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <Trash2 size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Delete Report?</h3>
                        <p className="text-sm text-slate-500 mb-6">Are you sure you want to completely erase this month's report? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteReportModal(false)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 active:bg-slate-200 transition-all duration-200">Cancel</button>
                            <button onClick={handleDeleteV2Report} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-95 active:bg-red-800 transition-all duration-200 shadow-sm">Delete</button>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}
    </div>
  );
}