import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { 
  MUNICIPALITIES, 
  INITIAL_ROW_STATE, 
  INITIAL_COHORT_ROW
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
  getComputations,
  aggregateAnimalSpecs 
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
  const userRole = user?.role; 
  const userFacility = user?.facility; 

  const [data, setData] = useState({});
  const [cohortData, setCohortData] = useState({});
  const [reportStatuses, setReportStatuses] = useState({ main: 'Draft', cohort: 'Draft' });
  const [loading, setLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);
  const [facilityStatuses, setFacilityStatuses] = useState({}); 
  const [visibleOtherMunicipalities, setVisibleOtherMunicipalities] = useState([]);
  const [visibleCat2, setVisibleCat2] = useState([]);
  const [visibleCat3, setVisibleCat3] = useState([]);

  const reportStatus = activeTab === 'main' ? reportStatuses.main : reportStatuses.cohort;
  const isConsolidatedView = adminViewMode === 'consolidated';
  
  const activeFacilityName = userRole === 'admin' 
    ? (isConsolidatedView ? 'PHO' : selectedFacility) 
    : userFacility;
  
  const currentHostMunicipality = useMemo(() => {
    if (!activeFacilityName || isConsolidatedView) return null;
    
    const barangays = facilityBarangays[activeFacilityName] || [];
    const isHospital = MUNICIPALITIES.every(m => barangays.includes(m));
    
    if (isHospital || activeFacilityName === "AMDC" || activeFacilityName === "APH") return null;
    
    return MUNICIPALITIES.find(m => activeFacilityName.includes(m)) || null;
  }, [activeFacilityName, isConsolidatedView, facilityBarangays]);

  const getRowKeysForFacility = useCallback((facilityName, consolidated = false, returnAll = false, forCohort = false, specificVisible = null) => {
    if (!facilityName) return []; 
    if (consolidated) return MUNICIPALITIES;
    
    if (facilityName === "AMDC" || facilityName === "APH" || !facilityBarangays[facilityName]) return MUNICIPALITIES;
    
    const barangays = facilityBarangays[facilityName] || [];
    
    const isHospitalOrClinic = MUNICIPALITIES.every(m => barangays.includes(m));
    if (isHospitalOrClinic) {
        return MUNICIPALITIES;
    }

    const hostMunicipality = MUNICIPALITIES.find(m => facilityName.includes(m));
    
    if (barangays.length > 0 && hostMunicipality) {
      const other = MUNICIPALITIES.filter(m => m !== hostMunicipality);
      if (returnAll) return [hostMunicipality, ...barangays, "Others:", ...other];
      
      let visible = specificVisible ? specificVisible : (forCohort ? [] : visibleOtherMunicipalities);
      const visibleOther = other.filter(m => visible.includes(m));
      return [hostMunicipality, ...barangays, "Others:", ...visibleOther];
    }

    return [...new Set([...barangays, "Others:", ...MUNICIPALITIES])];
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

  const fetchFacilityStatuses = useCallback(async () => {
    setLoading(true);
    try {
      if (periodType !== 'Monthly') { setFacilityStatuses({}); return; }
      const statuses = {}; 
      facilities.forEach(f => { statuses[f] = { main: 'Draft', cohort: 'Draft', lastUpdated: null }; });

      const { data: mainData } = await supabase.from('abtc_reports').select('facility, status, created_at').eq('year', year).eq('month', month);
      if (mainData && mainData.length > 0) {
        mainData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        mainData.forEach(r => { if (statuses[r.facility]) { statuses[r.facility].main = r.status; statuses[r.facility].lastUpdated = r.created_at; } });
      }

      const { data: cohortData } = await supabase.from('abtc_cohort_reports').select('facility, status, created_at').eq('year', year).eq('month', month);
      if (cohortData && cohortData.length > 0) {
        cohortData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        cohortData.forEach(r => {
             if (statuses[r.facility]) {
                 statuses[r.facility].cohort = r.status;
                 const currentLast = statuses[r.facility].lastUpdated ? new Date(statuses[r.facility].lastUpdated) : new Date(0);
                 const newDate = new Date(r.created_at);
                 if (newDate > currentLast) { statuses[r.facility].lastUpdated = r.created_at; }
             }
        });
      }
      setFacilityStatuses(statuses);
    } catch (error) { console.error("Error:", error); toast.error("Failed to load statuses"); } finally { setLoading(false); }
  }, [periodType, year, month, facilities]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const target = userRole === 'admin' ? (isConsolidatedView ? null : selectedFacility) : userFacility;
      const fullRowKeys = getRowKeysForFacility(target || 'PHO Consolidated', isConsolidatedView, true, false, []);
      
      if (activeTab === 'main') {
          const newData = initData(fullRowKeys, false);
          let query = supabase.from('abtc_reports').select('*').eq('year', year);
          if (periodType === 'Monthly') query = query.eq('month', month);
          else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter));
          
          if (isConsolidatedView) query = query.eq('status', 'Approved'); 
          else if (target) query = query.eq('facility', target);
          
          const { data: rawRecords, error } = await query;
          if (error) throw error;

          const newVisibleOthers = new Set();
          
          if (rawRecords && rawRecords.length > 0) {
            rawRecords.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            rawRecords.forEach(record => {
                const m = record.municipality;
                if (newData[m]) {
                    const r = mapDbToRow(record);
                    r.othersCount = record.others_count ?? record.othersCount ?? 0;
                    r.othersSpec = record.others_spec ?? record.othersSpec ?? '';
                    const c = newData[m];
                    const numericKeys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
                    
                    numericKeys.forEach(k => {
                        if (r[k] !== '') {
                            c[k] = c[k] === '' ? toInt(r[k]) : toInt(c[k]) + toInt(r[k]);
                        }
                    });
                    
                    if (r.othersSpec && r.othersSpec.trim()) { c.othersSpec = aggregateAnimalSpecs([c.othersSpec, r.othersSpec]); }
                    if (record.remarks && record.remarks.trim()) {
                        if (!c.remarks.includes(record.remarks)) { c.remarks = c.remarks ? `${c.remarks}; ${record.remarks}` : record.remarks; }
                    }
                    const isBarangay = facilityBarangays[target]?.includes(m);
                    const host = MUNICIPALITIES.find(mun => target?.includes(mun));
                    if (!isBarangay && m !== host && hasData(r)) { newVisibleOthers.add(m); }
                }
            });
            setData(newData);
            const newStatus = periodType === 'Monthly' && !isConsolidatedView ? (rawRecords[rawRecords.length - 1]?.status || 'Draft') : (isConsolidatedView ? 'View Only' : 'Draft');
            setReportStatuses(prev => ({ ...prev, main: newStatus }));
          } else { setData(newData); setReportStatuses(prev => ({ ...prev, main: 'Draft' })); }
          setVisibleOtherMunicipalities(Array.from(newVisibleOthers));

      } else {
          const newCohort = initData(fullRowKeys, true);
          let query = supabase.from('abtc_cohort_reports').select('*').eq('year', year);
          if (periodType === 'Monthly') query = query.eq('month', month);
          else if (periodType === 'Quarterly') query = query.in('month', getQuarterMonths(quarter)); 
          
          if (isConsolidatedView) query = query.eq('status', 'Approved'); 
          else if (target) query = query.eq('facility', target);
          
          const { data: rawRecords, error } = await query;
          if (error) throw error;

          const newVisibleCat2 = new Set(); 
          const newVisibleCat3 = new Set();
          
          if (rawRecords && rawRecords.length > 0) {
              rawRecords.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              rawRecords.forEach(record => {
                  const m = record.municipality;
                  if(newCohort[m]) {
                      const r = mapCohortDbToRow(record);
                      const c = newCohort[m];
                      const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
                      
                      keys.forEach(k => { 
                          if (r[k] !== '') {
                              c[k] = c[k] === '' ? toInt(r[k]) : toInt(c[k]) + toInt(r[k]);
                          }
                      });
                      
                      if (record.cat2_remarks) { if(!c.cat2_remarks.includes(record.cat2_remarks)) c.cat2_remarks = c.cat2_remarks ? `${c.cat2_remarks}; ${record.cat2_remarks}` : record.cat2_remarks; }
                      if (record.cat3_remarks) { if(!c.cat3_remarks.includes(record.cat3_remarks)) c.cat3_remarks = c.cat3_remarks ? `${c.cat3_remarks}; ${record.cat3_remarks}` : record.cat3_remarks; }
                      const isBarangay = facilityBarangays[target]?.includes(m);
                      const host = MUNICIPALITIES.find(mun => target?.includes(mun));
                      if (!isBarangay && m !== host) {
                          if (hasCohortData(r, 'cat2')) newVisibleCat2.add(m);
                          if (hasCohortData(r, 'cat3')) newVisibleCat3.add(m);
                      }
                  }
              });
              setCohortData(newCohort);
              const newStatus = periodType === 'Monthly' && !isConsolidatedView ? (rawRecords[rawRecords.length - 1]?.status || 'Draft') : (isConsolidatedView ? 'View Only' : 'Draft');
              setReportStatuses(prev => ({ ...prev, cohort: newStatus }));
          } else { setCohortData(newCohort); setReportStatuses(prev => ({ ...prev, cohort: 'Draft' })); }
          setVisibleCat2(Array.from(newVisibleCat2));
          setVisibleCat3(Array.from(newVisibleCat3));
      }
    } catch (err) { console.error("Fetch Error:", err); toast.error("Failed to load data"); } finally { setLoading(false); }
  }, [userRole, userFacility, year, month, quarter, periodType, adminViewMode, selectedFacility, activeTab, isConsolidatedView, facilityBarangays]); 

  useEffect(() => {
    if (userRole === 'admin') {
      if (adminViewMode === 'dashboard') fetchFacilityStatuses();
      else if (adminViewMode === 'consolidated' || (adminViewMode === 'review' && selectedFacility)) fetchData();
    } else { fetchData(); }
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
                const existingRemarks = n[currentHostMunicipality]?.remarks || '';
                const tot = { ...INITIAL_ROW_STATE };
                const keys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
                const specsToAggregate = [];
                facilityBarangays[activeFacilityName].forEach(b => { 
                  const r = n[b] || INITIAL_ROW_STATE; 
                  keys.forEach(k => {
                      if (r[k] !== '') {
                          tot[k] = tot[k] === '' ? toInt(r[k]) : toInt(tot[k]) + toInt(r[k]);
                      }
                  }); 
                  if (r.othersSpec && r.othersSpec.trim()) { specsToAggregate.push(r.othersSpec); }
                });
                tot.othersSpec = aggregateAnimalSpecs(specsToAggregate);
                n[currentHostMunicipality] = { ...n[currentHostMunicipality], ...tot, remarks: existingRemarks };
            }
            return n;
        });
    } else {
        if (userRole === 'admin' || m === currentHostMunicipality) return;
        setCohortData(prev => {
            const n = { ...prev }; n[m] = { ...(n[m] || INITIAL_COHORT_ROW), [f]: v };
            if (currentHostMunicipality && facilityBarangays[activeFacilityName]?.includes(m)) {
                const tot = { ...INITIAL_COHORT_ROW };
                const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
                facilityBarangays[activeFacilityName].forEach(b => { 
                    const r = n[b] || INITIAL_COHORT_ROW; 
                    keys.forEach(k => {
                        if (r[k] !== '') {
                            tot[k] = tot[k] === '' ? toInt(r[k]) : toInt(tot[k]) + toInt(r[k]);
                        }
                    }); 
                });
                n[currentHostMunicipality] = { ...n[currentHostMunicipality], ...tot };
            }
            return n;
        });
    }
  };

  const createDbNotification = async (recipient, title, message, type='info') => { 
    try { await supabase.from('notifications').insert({ recipient, title, message, type }); } catch(err) { console.error(err); } 
  };

  const handleSave = async (newStatus, reason = null) => {
    if (periodType !== 'Monthly' && activeTab === 'main') { toast.error("Monthly only for Main Report"); return; }
    const target = userRole === 'admin' ? selectedFacility : userFacility;
    if (!target) { toast.error("Error: Could not determine facility."); return false; }
    const currentStatus = activeTab === 'main' ? reportStatuses.main : reportStatuses.cohort;
    
    if (userRole === 'admin' && (newStatus === 'Approved' || newStatus === 'Rejected') && currentStatus === 'Draft') {
        toast.error("Cannot approve or reject a report that has not been submitted.");
        return false;
    }

    const isResubmission = (currentStatus === 'Rejected' && newStatus === 'Pending');
    setIsSaving(true);
    
    try {
        const cleanYear = String(year).trim();
        const cleanMonth = activeTab === 'main' ? String(month).trim() : (periodType === 'Monthly' ? String(month).trim() : String(quarter).trim());
        let payload = [];
        let type = '';

        if (activeTab === 'main') {
            type = 'main';
            payload = Object.entries(data).map(([m, row]) => {
                if (!hasData(row) && !getRowKeysForFacility(target, false, false, false, visibleOtherMunicipalities).includes(m)) return null;
                let rem = row.remarks; 
                const dbRow = mapRowToDb(row);
                dbRow.others_count = row.othersCount === '' ? null : toInt(row.othersCount);  
                if (row.othersSpec) dbRow.others_spec = row.othersSpec;
                return { ...dbRow, municipality: m, status: newStatus, remarks: rem };
            }).filter(x => x !== null);
        } else {
            type = 'cohort';
            payload = Object.entries(cohortData).map(([m, row]) => {
                if (!hasCohortData(row, 'cat2') && !hasCohortData(row, 'cat3') && !getRowKeysForFacility(target, false, false, true, visibleCat2).includes(m) && !getRowKeysForFacility(target, false, false, true, visibleCat3).includes(m)) return null;
                return { ...mapCohortRowToDb(row), municipality: m, status: newStatus };
            }).filter(x => x !== null);
        }

        const { error: rpcError } = await supabase.rpc('save_report_atomic', { p_year: cleanYear, p_month: cleanMonth, p_facility: target, p_type: type, p_data: payload });
        if (rpcError) throw new Error(`Save failed: ${rpcError.message}`);

        if (activeTab === 'main') setReportStatuses(prev => ({ ...prev, main: newStatus }));
        else setReportStatuses(prev => ({ ...prev, cohort: newStatus }));
        
        const reportType = activeTab === 'main' ? 'Form 1 Report' : 'Cohort Report';
        let periodStr = periodType === 'Monthly' ? `for the month of ${month} ${year}` : (periodType === 'Quarterly' ? `for the ${quarter} of ${year}` : `for the year ${year}`);

        if (newStatus === 'Pending') { 
            const title = isResubmission ? 'Resubmission' : 'New Submission';
            const msg = `${target} ${isResubmission ? 'resubmitted' : 'submitted'} ${reportType} ${periodStr}.`;
            await createDbNotification('PHO Admin', title, msg, 'info'); 
            toast.success(isResubmission ? 'Resubmitted' : 'Submitted'); 
        }
        else if (newStatus === 'Approved') { 
            // FIXED: Added a more professional, detailed success message containing reportType and periodStr.
            await createDbNotification(target, 'Report Approved', `Your ${reportType} ${periodStr} has been successfully reviewed and approved.`, 'success'); 
            toast.success('Approved'); 
        }
        else if (newStatus === 'Rejected') { 
            await createDbNotification(target, 'Report Rejected', `Your ${reportType} ${periodStr} has been rejected. Reason: ${reason}`, 'error'); 
            toast.success('Rejected'); 
        }
        else toast.success('Saved');

        await fetchData();
        return true; 
    } catch (err) { console.error("Save Error:", err); toast.error(err.message); return false; } finally { setIsSaving(false); }
  };

  const confirmDeleteReport = async () => {
    try {
        const currentStatus = activeTab === 'main' ? reportStatuses.main : reportStatuses.cohort;
        if (userRole === 'admin' && currentStatus === 'Draft') {
            toast.error("Cannot delete a report that has not been submitted.");
            return false;
        }
        const target = activeFacilityName; 
        const cleanYear = String(year).trim();
        const currentMonthOrQuarter = periodType === 'Monthly' ? String(month).trim() : String(quarter).trim();
        const type = activeTab === 'main' ? 'main' : 'cohort';
        const { error: rpcError } = await supabase.rpc('delete_report_securely', { p_year: cleanYear, p_month: currentMonthOrQuarter, p_facility: target, p_type: type });
        if (rpcError) throw rpcError;
        if (activeTab === 'main') setReportStatuses(prev => ({ ...prev, main: 'Draft' }));
        else setReportStatuses(prev => ({ ...prev, cohort: 'Draft' }));
        toast.success("Report data deleted"); 
        fetchData(); 
        return true;
    } catch(err) { toast.error(err.message); return false; }
  };

  const grandTotals = useMemo(() => {
    const t = { ...INITIAL_ROW_STATE, sexTotal: 0, ageTotal: 0, cat23: 0, catTotal: 0, animalTotal: 0 };
    const numericKeys = ['male','female','ageLt15','ageGt15','cat1','cat2','cat3','totalPatients','abCount','hrCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount','washed'];
    numericKeys.forEach(k => t[k] = 0);
    
    const currentBarangays = facilityBarangays[activeFacilityName] || [];
    const isHospital = MUNICIPALITIES.every(m => currentBarangays.includes(m));
    const specsToAggregate = [];
    
    Object.entries(data).forEach(([key, row]) => { 
        if (key === "Others:") return;
        
        if (!isHospital && currentBarangays.includes(key)) return;
        
        if (hasData(row)) { 
            const c = getComputations(row); 
            numericKeys.forEach(k => t[k] += toInt(row[k])); 
            t.sexTotal += c.sexTotal; t.ageTotal += c.ageTotal; 
            t.cat23 += c.cat23; t.catTotal += c.catTotal; t.animalTotal += c.animalTotal; 
            if (row.othersSpec && row.othersSpec.trim()) { specsToAggregate.push(row.othersSpec); }
        } 
    });
    t.othersSpec = aggregateAnimalSpecs(specsToAggregate);
    t.percent = t.animalTotal > 0 ? (t.washed / t.animalTotal * 100).toFixed(0) + '%' : '0%';
    return t;
  }, [data, facilityBarangays, activeFacilityName]);

  const cohortTotals = useMemo(() => {
    const t = { ...INITIAL_COHORT_ROW };
    const keys = ['cat2_registered', 'cat2_rig', 'cat2_complete', 'cat2_incomplete', 'cat2_booster', 'cat2_none', 'cat2_died', 'cat3_registered', 'cat3_rig', 'cat3_complete', 'cat3_incomplete', 'cat3_booster', 'cat3_none', 'cat3_died'];
    keys.forEach(k => t[k] = 0);
    
    const currentBarangays = facilityBarangays[activeFacilityName] || [];
    const isHospital = MUNICIPALITIES.every(m => currentBarangays.includes(m));

    Object.entries(cohortData).forEach(([key, row]) => { 
        if (key === "Others:") return;
        
        if (!isHospital && currentBarangays.includes(key)) return;
        
        if (hasCohortData(row, 'cat2') || hasCohortData(row, 'cat3')) { keys.forEach(k => t[k] += toInt(row[k])); } 
    });
    return t;
  }, [cohortData, facilityBarangays, activeFacilityName]);

  return {
    data, cohortData, reportStatus, loading, isSaving, facilityStatuses, currentRows, cohortRowsCat2, cohortRowsCat3,
    activeFacilityName, currentHostMunicipality, grandTotals, cohortTotals, visibleOtherMunicipalities,
    setVisibleOtherMunicipalities, visibleCat2, setVisibleCat2, visibleCat3, setVisibleCat3,
    fetchData, fetchFacilityStatuses, handleChange, handleDeleteRow, handleSave, confirmDeleteReport
  };
}