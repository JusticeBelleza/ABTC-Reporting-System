import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Save, AlertCircle, FileText, LogOut, CheckCircle, XCircle, Plus, 
  Layers, Filter, Loader2, PlusCircle, Trash2, MessageSquare, 
  User, Edit, Settings, FileDown, X, ArrowLeft, Github, AlertTriangle, 
  Hospital, Stethoscope, Building2
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase, adminHelperClient } from '../../lib/supabase';
import { 
  DEFAULT_FACILITIES, MUNICIPALITIES, INITIAL_ROW_STATE, INITIAL_COHORT_ROW, 
  MONTHS, QUARTERS, PDF_STYLES, INITIAL_FACILITY_BARANGAYS
} from '../../lib/constants';
import { 
  mapDbToRow, mapCohortDbToRow, mapRowToDb, mapCohortRowToDb, 
  getQuarterMonths, hasData, hasCohortData, downloadPDF, toInt, getComputations 
} from '../../lib/utils';

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

export default function Dashboard({ user, facilities, setFacilities, facilityBarangays, setFacilityBarangays, onLogout, globalSettings, setGlobalSettings, userProfile, setUserProfile }) {
  const currentDate = new Date();
  const currentRealYear = currentDate.getFullYear();
  const currentRealMonth = currentDate.getMonth();
  const availableYears = useMemo(() => { const years = []; for (let y = 2024; y <= currentRealYear; y++) years.push(y); return years; }, [currentRealYear]);
  
  const [activeTab, setActiveTab] = useState('main'); 
  const [cohortSubTab, setCohortSubTab] = useState('cat2'); 
  const [year, setYear] = useState(currentRealYear);
  const [periodType, setPeriodType] = useState('Monthly'); 
  const [month, setMonth] = useState(MONTHS[currentRealMonth]);
  const [quarter, setQuarter] = useState("1st Quarter");
  const availableMonths = useMemo(() => (year === currentRealYear ? MONTHS.slice(0, currentRealMonth + 1) : MONTHS), [year, currentRealYear, currentRealMonth]);

  const [data, setData] = useState({});
  const [cohortData, setCohortData] = useState({});
  const [reportStatus, setReportStatus] = useState('Draft');
  const [loading, setLoading] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityStatuses, setFacilityStatuses] = useState({});
  const [facilityTypes, setFacilityTypes] = useState({}); 
  
  const [visibleOtherMunicipalities, setVisibleOtherMunicipalities] = useState([]);
  const [visibleCat2, setVisibleCat2] = useState([]);
  const [visibleCat3, setVisibleCat3] = useState([]);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, rowKey: null });
  
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [isDeletingFacility, setIsDeletingFacility] = useState(false);
  const [deleteFacilityInput, setDeleteFacilityInput] = useState('');
  const [isAddingFacility, setIsAddingFacility] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null); 
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';
  const activeFacilityName = user.role === 'admin' ? (isConsolidatedView ? 'PHO' : selectedFacility) : user.name;

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

  const getRowKeysForFacility = (facilityName, consolidated = false, returnAll = false, forCohort = false, specificVisible = null) => {
    if (!facilityName) return []; 
    if (consolidated) return MUNICIPALITIES;
    if (facilityName === "AMDC" || facilityName === "APH" || !facilityBarangays[facilityName]) return MUNICIPALITIES;
    
    const barangays = facilityBarangays[facilityName] || [];
    const hostMunicipality = MUNICIPALITIES.find(m => facilityName.includes(m));
    
    if (barangays.length > 0 && hostMunicipality) {
      const other = MUNICIPALITIES.filter(m => m !== hostMunicipality);
      if (returnAll) return [hostMunicipality, ...barangays, "Others:", ...other];
      let visible = specificVisible ? specificVisible : (forCohort ? [] : visibleOtherMunicipalities);
      const visibleOther = other.filter(m => visible.includes(m));
      return [hostMunicipality, ...barangays, "Others:", ...visibleOther];
    }
    return barangays.length > 0 ? [...barangays, "Others:", ...MUNICIPALITIES] : MUNICIPALITIES;
  };

  const currentRows = useMemo(() => (user.role === 'admin' && adminViewMode === 'dashboard') ? [] : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, false, visibleOtherMunicipalities), [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode, visibleOtherMunicipalities]);
  const cohortRowsCat2 = useMemo(() => (user.role === 'admin' && adminViewMode === 'dashboard') ? [] : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, true, visibleCat2), [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode, visibleCat2]);
  const cohortRowsCat3 = useMemo(() => (user.role === 'admin' && adminViewMode === 'dashboard') ? [] : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, true, visibleCat3), [activeFacilityName, isConsolidatedView, facilityBarangays, user.role, adminViewMode, visibleCat3]);
  const currentHostMunicipality = useMemo(() => (!activeFacilityName || isConsolidatedView || activeFacilityName==="AMDC" || activeFacilityName==="APH") ? null : MUNICIPALITIES.find(m => activeFacilityName.includes(m)) || null, [activeFacilityName, isConsolidatedView]);

  const initData = (rowKeys, isCohort=false) => { 
    const d = {}; rowKeys.forEach(k => { if (k !== "Others:") d[k] = isCohort ? { ...INITIAL_COHORT_ROW } : { ...INITIAL_ROW_STATE }; }); 
    return d; 
  };

  const fetchFacilityStatuses = async () => {
    if (periodType !== 'Monthly') return; 
    setLoading(true);
    const { data } = await supabase.from('abtc_reports').select('facility, status').eq('year', year).eq('month', month);
    const statuses = {}; facilities.forEach(f => statuses[f] = 'Draft');
    if (data) data.forEach(r => statuses[r.facility] = r.status);
    setFacilityStatuses(statuses);
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    const target = user.role === 'admin' ? (isConsolidatedView ? null : selectedFacility) : user.name;
    const fullRowKeys = getRowKeysForFacility(target || 'PHO Consolidated', isConsolidatedView, true, false);
    
    if (activeTab === 'main') {
        const newData = initData(fullRowKeys, false);
        let query = supabase.from('abtc_reports').select('*').eq('year', year);
        if (periodType === 'Monthly') query = query.eq('month', month);
        else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter));
        if (isConsolidatedView) query = query.eq('status', 'Approved'); else if (target) query = query.eq('facility', target);
        
        const { data: records } = await query;
        const newVisibleOthers = new Set();
        if (records && records.length > 0) {
          records.forEach(record => {
            const m = record.municipality;
            if (newData[m]) {
               const r = mapDbToRow(record);
               const c = newData[m];
               const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
               keys.forEach(k => { c[k] = (toInt(c[k]) + toInt(r[k])) || ''; if(c[k] === 0) c[k] = ''; });
               const isBarangay = facilityBarangays[target]?.includes(m);
               const host = MUNICIPALITIES.find(mun => target?.includes(mun));
               if (!isBarangay && m !== host && hasData(r)) { newVisibleOthers.add(m); }
            }
          });
          setData(newData);
          setReportStatus(periodType === 'Monthly' && !isConsolidatedView ? (records[0].status || 'Draft') : (isConsolidatedView ? 'View Only' : 'Draft'));
        } else { setData(newData); setReportStatus('Draft'); }
        setVisibleOtherMunicipalities(Array.from(newVisibleOthers));
    } else {
        const newCohort = initData(fullRowKeys, true);
        let query = supabase.from('abtc_cohort_reports').select('*').eq('year', year);
        if (periodType === 'Monthly') query = query.eq('month', month);
        else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter)); 
        if (isConsolidatedView) query = query.eq('status', 'Approved'); else if (target) query = query.eq('facility', target);
        const { data: records } = await query;
        const newVisibleCat2 = new Set(); const newVisibleCat3 = new Set();
        if (records && records.length > 0) {
            records.forEach(record => {
                const m = record.municipality;
                if(newCohort[m]) {
                    const r = mapCohortDbToRow(record);
                    const c = newCohort[m];
                    const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
                    keys.forEach(k => { c[k] = (toInt(c[k]) + toInt(r[k])) || ''; if(c[k] === 0) c[k] = ''; });
                    c.cat2_remarks = r.cat2_remarks || ''; c.cat3_remarks = r.cat3_remarks || '';
                    const isBarangay = facilityBarangays[target]?.includes(m);
                    const host = MUNICIPALITIES.find(mun => target?.includes(mun));
                    if (!isBarangay && m !== host) {
                        if (hasCohortData(r, 'cat2')) newVisibleCat2.add(m);
                        if (hasCohortData(r, 'cat3')) newVisibleCat3.add(m);
                    }
                }
            });
            setCohortData(newCohort);
            setReportStatus(periodType === 'Monthly' && !isConsolidatedView ? (records[0].status || 'Draft') : (isConsolidatedView ? 'View Only' : 'Draft'));
        } else { setCohortData(newCohort); setReportStatus('Draft'); }
        setVisibleCat2(Array.from(newVisibleCat2)); setVisibleCat3(Array.from(newVisibleCat3));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user.role === 'admin') {
      if (adminViewMode === 'dashboard') fetchFacilityStatuses();
      else if (adminViewMode === 'consolidated' || (adminViewMode === 'review' && selectedFacility)) fetchData();
    } else fetchData();
  }, [user, year, month, quarter, periodType, adminViewMode, selectedFacility, activeTab, facilities]);

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
      setFacilityStatuses(prev => ({ ...prev, [name]: 'Draft' }));
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
        setFacilityStatuses(prev => { const next = {...prev}; delete next[facilityToDelete]; return next; });
        toast.success("Deleted"); setFacilityToDelete(null);
    } catch (err) { toast.error(err.message); }
    setIsDeletingFacility(false);
  };

  const handleDeleteRow = (key) => { setDeleteConfirmation({ isOpen: true, rowKey: key }); };
  const confirmDeleteRow = () => {
    const key = deleteConfirmation.rowKey;
    if (key) {
      if (activeTab === 'main') {
        setData(prev => ({...prev, [key]: {...INITIAL_ROW_STATE}}));
        setVisibleOtherMunicipalities(prev => prev.filter(m => m !== key));
      } else {
        setCohortData(prev => {
            const currentRow = prev[key] || { ...INITIAL_COHORT_ROW };
            let updatedRow = { ...currentRow };
            if (cohortSubTab === 'cat2') {
                updatedRow = { ...updatedRow, cat2_registered: '', cat2_rig: '', cat2_complete: '', cat2_incomplete: '', cat2_booster: '', cat2_none: '', cat2_died: '', cat2_remarks: '' };
                setVisibleCat2(prevVis => prevVis.filter(m => m !== key));
            } else {
                updatedRow = { ...updatedRow, cat3_registered: '', cat3_rig: '', cat3_complete: '', cat3_incomplete: '', cat3_booster: '', cat3_none: '', cat3_died: '', cat3_remarks: '' };
                setVisibleCat3(prevVis => prevVis.filter(m => m !== key));
            }
            return { ...prev, [key]: updatedRow };
        });
      }
      toast.success(`Row for ${key} removed`);
    }
    setDeleteConfirmation({ isOpen: false, rowKey: null });
  };

  const handleChange = (m, f, v) => {
    if (activeTab === 'main') {
        if (periodType !== 'Monthly' || user.role === 'admin' || (reportStatus !== 'Draft' && reportStatus !== 'Rejected') || m === currentHostMunicipality || (f !== 'othersSpec' && f !== 'remarks' && v !== '' && Number(v) < 0)) return;
        setData(prev => {
            const n = { ...prev }; n[m] = { ...n[m], [f]: v };
            if (currentHostMunicipality && facilityBarangays[activeFacilityName]?.includes(m)) {
                const tot = { ...INITIAL_ROW_STATE };
                const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
                facilityBarangays[activeFacilityName].forEach(b => { const r = n[b] || INITIAL_ROW_STATE; keys.forEach(k => tot[k] = toInt(tot[k]) + toInt(r[k])); });
                keys.forEach(k => { if(tot[k] === 0) tot[k] = ''; });
                n[currentHostMunicipality] = { ...n[currentHostMunicipality], ...tot, remarks: 'Auto-computed' };
            }
            return n;
        });
    } else {
        if (user.role === 'admin' || m === currentHostMunicipality) return;
        setCohortData(prev => {
            const n = { ...prev }; n[m] = { ...n[m], [f]: v };
            if (currentHostMunicipality && facilityBarangays[activeFacilityName]?.includes(m)) {
                const tot = { ...INITIAL_COHORT_ROW };
                const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
                facilityBarangays[activeFacilityName].forEach(b => { const r = n[b] || INITIAL_COHORT_ROW; keys.forEach(k => tot[k] = toInt(tot[k]) + toInt(r[k])); });
                keys.forEach(k => { if(tot[k] === 0) tot[k] = ''; });
                n[currentHostMunicipality] = { ...n[currentHostMunicipality], ...tot };
            }
            return n;
        });
    }
  };

  const createDbNotification = async (recipient, title, message, type='info') => { try { await supabase.from('notifications').insert({ recipient, title, message, type }); } catch(err) { console.error(err); } };
  const confirmRejection = async () => { if (!rejectionReason.trim()) { toast.error("Reason required"); return; } setShowRejectModal(false); await handleSave('Rejected', rejectionReason); };
  
  const handleSave = async (newStatus, reason = null) => {
    if (periodType !== 'Monthly' && activeTab === 'main') { toast.error("Monthly only for Main Report"); return; }
    if (newStatus === 'Rejected' && reason === null && user.role === 'admin') { setRejectionReason(''); setShowRejectModal(true); return; }
    const target = user.role === 'admin' ? selectedFacility : user.name;
    setLoading(true);
    const targetKey = currentHostMunicipality || MUNICIPALITIES[0];
    try {
        if (activeTab === 'main') {
            const payload = Object.entries(data).map(([m, row]) => {
                if (!hasData(row) && !getRowKeysForFacility(target, false, false, false, visibleOtherMunicipalities).includes(m)) return null;
                let rem = row.remarks; if (newStatus === 'Rejected' && reason && m === targetKey) rem = `REJECTED: ${reason}`;
                return { ...mapRowToDb(row), year, month, municipality: m, facility: target, status: newStatus, remarks: rem };
            }).filter(x => x !== null);
            await supabase.from('abtc_reports').delete().eq('year', year).eq('month', month).eq('facility', target);
            if(payload.length > 0) await supabase.from('abtc_reports').insert(payload);
            setReportStatus(newStatus);
        } else {
            const payload = Object.entries(cohortData).map(([m, row]) => {
                if (!hasCohortData(row, 'cat2') && !hasCohortData(row, 'cat3') && !getRowKeysForFacility(target, false, false, true, visibleCat2).includes(m) && !getRowKeysForFacility(target, false, false, true, visibleCat3).includes(m)) return null;
                return { ...mapCohortRowToDb(row), year, month: periodType === 'Monthly' ? month : quarter, municipality: m, facility: target, status: newStatus };
            }).filter(x => x !== null);
            await supabase.from('abtc_cohort_reports').delete().eq('year', year).eq('month', periodType === 'Monthly' ? month : quarter).eq('facility', target);
            if(payload.length > 0) await supabase.from('abtc_cohort_reports').insert(payload);
            setReportStatus(newStatus);
        }
        if (newStatus === 'Pending') { await createDbNotification('PHO Admin', 'New Submission', `${target} report.`, 'info'); toast.success('Submitted'); }
        else if (newStatus === 'Approved') { await createDbNotification(target, 'Approved', `Report approved.`, 'success'); toast.success('Approved'); }
        else if (newStatus === 'Rejected') { await createDbNotification(target, 'Report Rejected', `Your report has been rejected. Reason: ${reason}`, 'error'); toast.success('Rejected'); }
        else toast.success('Saved');
        if (user.role === 'admin' && (newStatus === 'Approved' || newStatus === 'Rejected')) { setAdminViewMode('dashboard'); setSelectedFacility(null); fetchFacilityStatuses(); }
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };
  
  const confirmDeleteReport = async () => {
      setIsDeletingReport(true);
      try {
          const target = activeFacilityName; 
          await supabase.from('abtc_reports').delete().eq('year', year).eq('month', periodType === 'Monthly' ? month : quarter).eq('facility', target);
          await supabase.from('abtc_cohort_reports').delete().eq('year', year).eq('month', periodType === 'Monthly' ? month : quarter).eq('facility', target);
          toast.success("Report data deleted"); setReportStatus('Draft'); fetchData(); setReportToDelete(null);
      } catch(err) { toast.error(err.message); }
      setIsDeletingReport(false);
  };

  const grandTotals = useMemo(() => {
    const t = { ...INITIAL_ROW_STATE, sexTotal: 0, ageTotal: 0, cat23: 0, catTotal: 0, animalTotal: 0 };
    const numericKeys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
    numericKeys.forEach(k => t[k] = 0);
    Object.entries(data).forEach(([key, row]) => { if (MUNICIPALITIES.includes(key)) { const c = getComputations(row); numericKeys.forEach(k => t[k] += toInt(row[k])); t.sexTotal += c.sexTotal; t.ageTotal += c.ageTotal; t.cat23 += c.cat23; t.catTotal += c.catTotal; t.animalTotal += c.animalTotal; } });
    t.percent = t.animalTotal > 0 ? (t.washed / t.animalTotal * 100).toFixed(0) + '%' : '0%';
    return t;
  }, [data]);

  const cohortTotals = useMemo(() => {
    const t = { ...INITIAL_COHORT_ROW };
    const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
    keys.forEach(k => t[k] = 0);
    Object.entries(cohortData).forEach(([key, row]) => { if(MUNICIPALITIES.includes(key)) { keys.forEach(k => t[k] += toInt(row[k])); } });
    return t;
  }, [cohortData]);

  const getPreviousPeriodText = () => {
    if (periodType === 'Annual') return `Annual ${year - 1}`;
    if (periodType === 'Quarterly') { const idx = QUARTERS.indexOf(quarter); if (idx === 0) return `4th Quarter ${year - 1}`; return `${QUARTERS[idx - 1]} ${year}`; }
    const idx = MONTHS.indexOf(month); if (idx === 0) return `December ${year - 1}`; return `${MONTHS[idx - 1]} ${year}`;
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
            <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition" onClick={() => setShowProfileModal(true)}>
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium leading-none">{userProfile?.full_name || user.fullName || user.name}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-1">{user.role}</div>
              </div>
              <div className="bg-gray-100 p-2 rounded-full text-gray-600"><User size={16}/></div>
            </div>
            <button onClick={() => setShowSettingsModal(true)} className="text-gray-500 hover:text-zinc-900 p-2 transition"><Settings size={20} strokeWidth={1.5} /></button>
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
                  <button onClick={() => setShowAddFacilityModal(true)} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition"><Plus size={16} /> Add Facility</button>
                  <button onClick={() => setShowManageUsers(true)} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition"><Users size={16} /> Users</button>
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
                   <button disabled={isDownloadingPdf} onClick={async () => { setIsDownloadingPdf(true); const suffix = activeTab === 'cohort' ? (cohortSubTab === 'cat2' ? '_Category_II' : '_Category_III') : ''; await downloadPDF('report-content', `Report_${activeFacilityName}_${year}${suffix}.pdf`); setIsDownloadingPdf(false); }} className="bg-white border border-gray-200 text-zinc-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition disabled:opacity-70">
                     {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} PDF
                   </button>
                   {!isConsolidatedView && !isAggregationMode && (
                     <>
                        {user.role === 'admin' ? (
                          <>
                            <button onClick={() => handleSave('Approved')} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve</button>
                            <button onClick={() => handleSave('Rejected')} className="bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 shadow-sm flex items-center gap-2 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} Reject</button>
                            {reportStatus !== 'Draft' && <button onClick={() => setReportToDelete(true)} className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 shadow-sm flex items-center gap-2 transition ml-2" title="Delete Report Data"><Trash2 size={16}/></button>}
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleSave('Draft')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save</button>
                            <button onClick={() => handleSave('Pending')} disabled={loading || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{loading ? <Loader2 size={16} className="animate-spin"/> : 'Submit'}</button>
                          </>
                        )}
                     </>
                   )}
                </div>
             </div>
             <div className="hidden print:flex mb-6 items-center justify-between gap-6 pt-4 px-8" style={{ ...PDF_STYLES.headerContainer, display: 'none' }} id="pdf-header">
                <div style={PDF_STYLES.logoBox}>{globalSettings?.logo_base64 && <img src={globalSettings.logo_base64} alt="Logo" style={{height:'60px', width:'auto', objectFit:'contain'}} />}</div>
                <div style={PDF_STYLES.centerText}>
                   <h1 style={{fontSize:'12px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px', color:'#000'}}>National Rabies Prevention and Control Program</h1>
                   <h2 style={{fontSize:'14px', fontWeight:'bold', textTransform:'uppercase', margin:'4px 0', color:'#000'}}>
                     {activeTab === 'main' ? 'Form 1 - Accomplishment Report' : `Cohort Report - ${cohortSubTab === 'cat2' ? 'Category II' : 'Category III'}`}
                   </h2>
                   <p style={{fontSize:'11px', fontWeight:'bold', color:'#000'}}>
                     {activeTab === 'cohort' ? `Reporting For: ${getPreviousPeriodText()}` : (periodType === 'Monthly' ? `${month} ${year}` : (periodType === 'Quarterly' ? `${quarter} ${year}` : `Annual ${year}`))}
                   </p>
                   <p style={{fontSize:'10px', fontWeight:'bold', marginTop:'4px', color:'#000'}}>Health Facility: {activeFacilityName}</p>
                </div>
                <div style={PDF_STYLES.logoBox}>{userProfile?.facility_logo && <img src={userProfile.facility_logo} alt="Facility Logo" style={{height:'60px', width:'auto', objectFit:'contain'}} />}</div>
             </div>
             <div className="overflow-x-auto shadow-sm rounded-xl bg-white border border-gray-200 print:shadow-none print:border-none" style={{...PDF_STYLES.container, ...PDF_STYLES.border}}>
               {activeTab === 'main' ? (
                 <MainReportTable 
                    data={data} rowKeys={currentRows} isConsolidated={isConsolidatedView} isAggregationMode={isAggregationMode} reportStatus={reportStatus} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality} 
                    visibleOtherMunicipalities={visibleOtherMunicipalities} setVisibleOtherMunicipalities={setVisibleOtherMunicipalities}
                    onChange={handleChange} onDeleteRow={handleDeleteRow} grandTotals={grandTotals} facilityBarangays={facilityBarangays}
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
                      onChange={handleChange} onDeleteRow={handleDeleteRow} cohortTotals={cohortTotals}
                   />
                 </div>
               )}
             </div>
             <div className="hidden print:flex flex-col mt-auto" style={{ display: 'none', marginTop:'auto' }} id="pdf-footer">
                <div className="flex justify-around text-center text-sm" style={{ display: 'flex', justifyContent:'space-around', marginBottom:'20px' }}>
                  {userProfile?.signatories?.length > 0 ? userProfile.signatories.map((sig, idx) => (
                    <div key={idx} className="flex flex-col items-center" style={{ minWidth: '150px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{marginBottom:'0.5rem', fontWeight:'bold', fontSize:'10px', textTransform:'uppercase', color:'#4b5563'}}>{sig.label}</div>
                      <div style={{height:'3.5rem', width:'100%'}}></div>
                      <p style={{fontWeight:'bold', textTransform:'uppercase', borderTop:'1px solid #000', padding:'0.25rem 2rem', marginTop:'0.25rem', width:'100%', color: '#000'}}>{sig.name}</p>
                      <p style={{fontSize:'10px', color:'#374151'}}>{sig.title}</p>
                    </div>
                  )) : null}
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '10px', fontSize: '8px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                   <span>Generated on: {new Date().toLocaleString()}</span>
                   <span>Generated by: {userProfile?.full_name || user.fullName || user.name}</span>
                </div>
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
        {reportToDelete && (<div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200"><div className="flex flex-col items-center text-center"><div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><Trash2 size={24} /></div><h3 className="text-lg font-bold text-gray-900">Delete Report Data?</h3><p className="text-sm text-gray-500 mt-2 mb-6">Are you sure you want to delete all report data for <span className="font-semibold">{activeFacilityName}</span> for this period? This action cannot be undone.</p><div className="flex gap-3 w-full"><button onClick={() => setReportToDelete(null)} disabled={isDeletingReport} className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button><button onClick={confirmDeleteReport} disabled={isDeletingReport} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex justify-center items-center gap-2">{isDeletingReport && <Loader2 size={14} className="animate-spin"/>} Delete</button></div></div></div></div>)}
        {deleteConfirmation.isOpen && (<div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200"><div className="flex flex-col items-center text-center"><div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><AlertTriangle size={24} strokeWidth={2} /></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Remove Row?</h3><p className="text-sm text-gray-500 mb-6">Are you sure you want to remove the row for <span className="font-bold text-gray-800">{deleteConfirmation.rowKey}</span>? All data in this row will be cleared.</p><div className="flex gap-3 w-full"><button onClick={() => setDeleteConfirmation({isOpen: false, rowKey: null})} className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition border border-gray-200">Cancel</button><button onClick={confirmDeleteRow} className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition shadow-sm">Remove</button></div></div></div></div>)}
        
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