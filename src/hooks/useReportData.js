import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { 
  MUNICIPALITIES, 
  INITIAL_ROW_STATE, 
  INITIAL_COHORT_ROW, 
  INITIAL_FACILITY_BARANGAYS 
} from '../lib/constants';
import { 
  mapDbToRow, 
  mapCohortDbToRow, 
  mapRowToDb, 
  mapCohortRowToDb, 
  getQuarterMonths, 
  hasData, 
  hasCohortData, 
  toInt, 
  getComputations 
} from '../lib/utils';

export function useReportData({
  user,
  facilities,
  facilityBarangays,
  year,
  month,
  quarter,
  periodType,
  activeTab,
  cohortSubTab,
  adminViewMode,
  selectedFacility
}) {
  // --- Decompose User to Primitive Values (Fixes Alt+Tab Refresh) ---
  const userRole = user?.role;
  const userName = user?.name;

  // --- Local State ---
  const [data, setData] = useState({});
  const [cohortData, setCohortData] = useState({});
  const [reportStatus, setReportStatus] = useState('Draft');
  const [loading, setLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);
  const [facilityStatuses, setFacilityStatuses] = useState({}); 
  
  const [visibleOtherMunicipalities, setVisibleOtherMunicipalities] = useState([]);
  const [visibleCat2, setVisibleCat2] = useState([]);
  const [visibleCat3, setVisibleCat3] = useState([]);

  // --- Derived State Helpers ---
  const isConsolidatedView = adminViewMode === 'consolidated';
  const activeFacilityName = userRole === 'admin' ? (isConsolidatedView ? 'PHO' : selectedFacility) : userName;
  
  const currentHostMunicipality = useMemo(() => {
    if (!activeFacilityName || isConsolidatedView || activeFacilityName === "AMDC" || activeFacilityName === "APH") return null;
    return MUNICIPALITIES.find(m => activeFacilityName.includes(m)) || null;
  }, [activeFacilityName, isConsolidatedView]);

  // --- Helpers (Internal) ---
  const getRowKeysForFacility = useCallback((facilityName, consolidated = false, returnAll = false, forCohort = false, specificVisible = null) => {
    if (!facilityName) return []; 
    if (consolidated) return MUNICIPALITIES;
    if (facilityName === "AMDC" || facilityName === "APH" || !facilityBarangays[facilityName]) return MUNICIPALITIES;
    
    const barangays = facilityBarangays[facilityName] || [];
    const hostMunicipality = MUNICIPALITIES.find(m => facilityName.includes(m));
    
    if (barangays.length > 0 && hostMunicipality) {
      const other = MUNICIPALITIES.filter(m => m !== hostMunicipality);
      if (returnAll) return [hostMunicipality, ...barangays, "Others:", ...other];
      
      let visible = specificVisible 
        ? specificVisible 
        : (forCohort ? [] : visibleOtherMunicipalities);
        
      const visibleOther = other.filter(m => visible.includes(m));
      return [hostMunicipality, ...barangays, "Others:", ...visibleOther];
    }
    return barangays.length > 0 ? [...barangays, "Others:", ...MUNICIPALITIES] : MUNICIPALITIES;
  }, [facilityBarangays, visibleOtherMunicipalities]);

  const currentRows = useMemo(() => 
    (userRole === 'admin' && adminViewMode === 'dashboard') 
      ? [] 
      : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, false, visibleOtherMunicipalities),
    [activeFacilityName, isConsolidatedView, userRole, adminViewMode, visibleOtherMunicipalities, getRowKeysForFacility]
  );

  const cohortRowsCat2 = useMemo(() => 
    (userRole === 'admin' && adminViewMode === 'dashboard') 
      ? [] 
      : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, true, visibleCat2),
    [activeFacilityName, isConsolidatedView, userRole, adminViewMode, visibleCat2, getRowKeysForFacility]
  );

  const cohortRowsCat3 = useMemo(() => 
    (userRole === 'admin' && adminViewMode === 'dashboard') 
      ? [] 
      : getRowKeysForFacility(activeFacilityName, isConsolidatedView, false, true, visibleCat3),
    [activeFacilityName, isConsolidatedView, userRole, adminViewMode, visibleCat3, getRowKeysForFacility]
  );

  const initData = (rowKeys, isCohort = false) => { 
    const d = {}; 
    rowKeys.forEach(k => { 
      if (k !== "Others:") d[k] = isCohort ? { ...INITIAL_COHORT_ROW } : { ...INITIAL_ROW_STATE }; 
    }); 
    return d; 
  };

  // --- Actions ---

  const fetchFacilityStatuses = useCallback(async () => {
    setLoading(true);
    try {
      if (periodType !== 'Monthly') {
        setFacilityStatuses({});
        return; 
      }

      const { data: reportData } = await supabase.from('abtc_reports').select('facility, status').eq('year', year).eq('month', month);
      const statuses = {}; 
      facilities.forEach(f => statuses[f] = 'Draft');
      if (reportData) reportData.forEach(r => statuses[r.facility] = r.status);
      setFacilityStatuses(statuses);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast.error("Failed to load facility statuses");
    } finally {
      setLoading(false);
    }
  }, [periodType, year, month, facilities]);

  // FIX: Depend on userRole/userName primitives instead of 'user' object
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const target = userRole === 'admin' ? (isConsolidatedView ? null : selectedFacility) : userName;
      const fullRowKeys = getRowKeysForFacility(target || 'PHO Consolidated', isConsolidatedView, true, false, []);
      
      if (activeTab === 'main') {
          const newData = initData(fullRowKeys, false);
          let query = supabase.from('abtc_reports').select('*').eq('year', year);
          if (periodType === 'Monthly') query = query.eq('month', month);
          else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter));
          
          if (isConsolidatedView) query = query.eq('status', 'Approved'); 
          else if (target) query = query.eq('facility', target);
          
          // FIX: Sort by created_at so newer rows overwrite older ones (handling duplicates)
          const { data: records, error } = await query.order('created_at', { ascending: true });
          if (error) throw error;

          const newVisibleOthers = new Set();
          
          if (records && records.length > 0) {
            records.forEach(record => {
              const m = record.municipality;
              if (newData[m]) {
                 const r = mapDbToRow(record);
                 const c = newData[m];
                 const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
                 
                 // FIX: Assign (=) instead of Add (+=) to prevent summing duplicates
                 keys.forEach(k => { c[k] = toInt(r[k]); });
                 
                 if (r.othersSpec && r.othersSpec.trim()) {
                   // For duplicates, prefer the latest text
                   c.othersSpec = r.othersSpec.trim();
                 }

                 c.remarks = record.remarks || c.remarks;
                 
                 const isBarangay = facilityBarangays[target]?.includes(m);
                 const host = MUNICIPALITIES.find(mun => target?.includes(mun));
                 if (!isBarangay && m !== host && hasData(r)) { newVisibleOthers.add(m); }
              }
            });
            setData(newData);
            // FIX: Use status from LAST record (latest)
            setReportStatus(periodType === 'Monthly' && !isConsolidatedView ? (records[records.length - 1].status || 'Draft') : (isConsolidatedView ? 'View Only' : 'Draft'));
          } else { 
            setData(newData); 
            setReportStatus('Draft'); 
          }
          
          setVisibleOtherMunicipalities(Array.from(newVisibleOthers));

      } else {
          const newCohort = initData(fullRowKeys, true);
          let query = supabase.from('abtc_cohort_reports').select('*').eq('year', year);
          if (periodType === 'Monthly') query = query.eq('month', month);
          else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter)); 
          
          if (isConsolidatedView) query = query.eq('status', 'Approved'); 
          else if (target) query = query.eq('facility', target);
          
          // FIX: Sort by created_at
          const { data: records, error } = await query.order('created_at', { ascending: true });
          if (error) throw error;

          const newVisibleCat2 = new Set(); 
          const newVisibleCat3 = new Set();
          
          if (records && records.length > 0) {
              records.forEach(record => {
                  const m = record.municipality;
                  if(newCohort[m]) {
                      const r = mapCohortDbToRow(record);
                      const c = newCohort[m];
                      const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
                      // FIX: Assign (=) instead of Add (+=)
                      keys.forEach(k => { c[k] = toInt(r[k]); });
                      c.cat2_remarks = r.cat2_remarks || c.cat2_remarks || ''; 
                      c.cat3_remarks = r.cat3_remarks || c.cat3_remarks || '';
                      
                      const isBarangay = facilityBarangays[target]?.includes(m);
                      const host = MUNICIPALITIES.find(mun => target?.includes(mun));
                      if (!isBarangay && m !== host) {
                          if (hasCohortData(r, 'cat2')) newVisibleCat2.add(m);
                          if (hasCohortData(r, 'cat3')) newVisibleCat3.add(m);
                      }
                  }
              });
              setCohortData(newCohort);
              // FIX: Use status from LAST record
              setReportStatus(periodType === 'Monthly' && !isConsolidatedView ? (records[records.length - 1].status || 'Draft') : (isConsolidatedView ? 'View Only' : 'Draft'));
          } else { 
            setCohortData(newCohort); 
            setReportStatus('Draft'); 
          }
          
          setVisibleCat2(Array.from(newVisibleCat2));
          setVisibleCat3(Array.from(newVisibleCat3));
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [userRole, userName, year, month, quarter, periodType, adminViewMode, selectedFacility, activeTab, isConsolidatedView, facilityBarangays]); 

  // FIX: Depend on userRole primitive
  useEffect(() => {
    if (userRole === 'admin') {
      if (adminViewMode === 'dashboard') fetchFacilityStatuses();
      else if (adminViewMode === 'consolidated' || (adminViewMode === 'review' && selectedFacility)) fetchData();
    } else {
      fetchData();
    }
  }, [userRole, year, month, quarter, periodType, adminViewMode, selectedFacility, activeTab, fetchData, fetchFacilityStatuses]);

  const handleDeleteRow = (key) => {
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
  };

  const handleChange = (m, f, v) => {
    if (activeTab === 'main') {
        if (periodType !== 'Monthly' || userRole === 'admin' || (reportStatus !== 'Draft' && reportStatus !== 'Rejected') || m === currentHostMunicipality || (f !== 'othersSpec' && f !== 'remarks' && v !== '' && Number(v) < 0)) return;
        setData(prev => {
            const n = { ...prev }; 
            n[m] = { ...(n[m] || INITIAL_ROW_STATE), [f]: v };
            
            if (currentHostMunicipality && facilityBarangays[activeFacilityName]?.includes(m)) {
                const tot = { ...INITIAL_ROW_STATE };
                const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
                
                facilityBarangays[activeFacilityName].forEach(b => { 
                  const r = n[b] || INITIAL_ROW_STATE; 
                  keys.forEach(k => tot[k] = toInt(tot[k]) + toInt(r[k])); 
                  
                  if (r.othersSpec && r.othersSpec.trim()) {
                     const spec = r.othersSpec.trim();
                     if (!tot.othersSpec.includes(spec)) {
                        tot.othersSpec = tot.othersSpec ? `${tot.othersSpec}, ${spec}` : spec;
                     }
                  }
                });
                keys.forEach(k => { if(tot[k] === 0) tot[k] = ''; });
                n[currentHostMunicipality] = { ...n[currentHostMunicipality], ...tot, remarks: 'Auto-computed' };
            }
            return n;
        });
    } else {
        if (userRole === 'admin' || m === currentHostMunicipality) return;
        setCohortData(prev => {
            const n = { ...prev }; 
            n[m] = { ...(n[m] || INITIAL_COHORT_ROW), [f]: v };

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

  const handleSave = async (newStatus, reason = null) => {
    if (periodType !== 'Monthly' && activeTab === 'main') { toast.error("Monthly only for Main Report"); return; }
    
    const target = userRole === 'admin' ? selectedFacility : userName;
    setIsSaving(true);
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
        
        return true; 
    } catch (err) { 
        toast.error(err.message); 
        return false;
    } finally { 
        setIsSaving(false); 
    }
  };

  const confirmDeleteReport = async () => {
    try {
        const target = activeFacilityName; 
        await supabase.from('abtc_reports').delete().eq('year', year).eq('month', periodType === 'Monthly' ? month : quarter).eq('facility', target);
        await supabase.from('abtc_cohort_reports').delete().eq('year', year).eq('month', periodType === 'Monthly' ? month : quarter).eq('facility', target);
        toast.success("Report data deleted"); 
        setReportStatus('Draft'); 
        fetchData(); 
        return true;
    } catch(err) { 
        toast.error(err.message); 
        return false;
    }
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

  return {
    data,
    cohortData,
    reportStatus,
    loading,
    isSaving,
    facilityStatuses,
    currentRows,
    cohortRowsCat2,
    cohortRowsCat3,
    activeFacilityName,
    currentHostMunicipality,
    grandTotals,
    cohortTotals,
    visibleOtherMunicipalities,
    setVisibleOtherMunicipalities,
    visibleCat2,
    setVisibleCat2,
    visibleCat3,
    setVisibleCat3,
    fetchData,
    fetchFacilityStatuses,
    handleChange,
    handleDeleteRow,
    handleSave,
    confirmDeleteReport
  };
}