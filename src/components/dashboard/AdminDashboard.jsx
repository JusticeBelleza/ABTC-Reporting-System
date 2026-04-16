import React, { useState, useEffect } from 'react';
import { Users, Layers, Plus, Hospital, Stethoscope, Building2, Clock, Archive, RefreshCcw, Trash2, AlertTriangle, X, CheckCircle, XCircle, TrendingUp, ChevronRight, ChevronLeft, FileDown, Loader2, ArrowLeft } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { MONTHS, QUARTERS } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

import ModalPortal from '../modals/ModalPortal';
import { exportToExcelTemplate } from '../../lib/excelExporter';
import MainReportTableV2 from '../reports/MainReportTableV2';
import { useReportStore } from '../../store/useReportStore';

const ABRA_MUNICIPALITIES = [
    "Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", "Dolores",
    "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", "Licuan-Baay",
    "Luba", "Malibcong", "Manabo", "Penarrubia", "Pidigan", "Pilar",
    "Sallapadan", "San Isidro", "San Juan", "San Quintin", "Tayum",
    "Tineg", "Tubo", "Villaviciosa"
];

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
  const { facilities, user, facilityBarangays, facilityDetails, globalSettings, userProfile } = useApp();
  
  const setInitialData = useReportStore(state => state.setInitialData);

  const [facilityMeta, setFacilityMeta] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [facilityOwners, setFacilityOwners] = useState({});
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, facility: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, status: null });
  const [leaderboardModal, setLeaderboardModal] = useState({ isOpen: false, filter: null });
  
  const [isViewingConsolidated, setIsViewingConsolidated] = useState(false);
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false);
  const [isExportingConsolidated, setIsExportingConsolidated] = useState(false);

  const [yearlyStats, setYearlyStats] = useState({ main: [] });
  const [facilityStatuses, setFacilityStatuses] = useState({});

  const [modalPage, setModalPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [cardPage, setCardPage] = useState(1);
  const CARDS_PER_PAGE = 6;

  const currentDate = new Date();
  const currentRealYear = currentDate.getFullYear();
  const currentRealMonthIdx = currentDate.getMonth();

  const formatQuarterName = (q) => {
      if (!q) return '';
      const qStr = q.toString().toLowerCase();
      if (qStr.includes('1')) return '1st Quarter';
      if (qStr.includes('2')) return '2nd Quarter';
      if (qStr.includes('3')) return '3rd Quarter';
      if (qStr.includes('4')) return '4th Quarter';
      return q;
  };

  useEffect(() => { setCardPage(1); }, [showArchived]);

  useReportData({
    user, facilities, facilityBarangays: facilityBarangays || {}, 
    year, month, quarter, periodType, adminViewMode: 'dashboard'
  });

  const fetchFacilityMeta = async () => {
    try {
      const { data } = await supabase.from('facilities').select('name, status, type, ownership, host_municipality');
      if (data) setFacilityMeta(data);
    } catch (err) { console.error("Error fetching facility meta", err); }
  };

  const fetchFacilityOwners = async () => {
    try {
      const { data } = await supabase.from('profiles').select('facility_name, full_name, email');
      if (data) {
        const mapping = {};
        data.forEach(u => { 
          if (u.facility_name) {
            const displayName = u.full_name || u.email || 'User Assigned (No Name)';
            if (mapping[u.facility_name]) {
                mapping[u.facility_name] += `, ${displayName}`;
            } else {
                mapping[u.facility_name] = displayName;
            }
          } 
        });
        setFacilityOwners(mapping);
      }
    } catch (error) { console.error("Error fetching facility owners:", error); }
  };

  useEffect(() => { fetchFacilityOwners(); }, [facilities]); 

  useEffect(() => {
    const handleUserRegistered = () => fetchFacilityOwners();
    window.addEventListener('user_registered', handleUserRegistered);
    return () => window.removeEventListener('user_registered', handleUserRegistered);
  }, []);

  useEffect(() => { fetchFacilityMeta(); }, [facilities]);

  useEffect(() => {
    const fetchV2StatsAndStatuses = async () => {
        if (!year) return;
        try {
            const { data: v2Data } = await supabase.from('abtc_reports_v2').select('facility, month, status').eq('year', year);
            setYearlyStats({ main: v2Data || [] });

            const currentPeriod = periodType === 'Quarterly' ? quarter : (periodType === 'Annual' ? 'Annual' : month);
            const { data: currentPeriodData } = await supabase.from('abtc_reports_v2')
                .select('facility, status, created_at')
                .eq('year', year)
                .eq('month', currentPeriod);
            
            const currentStatusMap = {};
            if (currentPeriodData) {
                currentPeriodData.forEach(row => {
                    const fac = row.facility;
                    if (!currentStatusMap[fac]) currentStatusMap[fac] = { status: 'Draft', lastUpdated: row.created_at };
                    
                    if (new Date(row.created_at) > new Date(currentStatusMap[fac].lastUpdated)) {
                        currentStatusMap[fac].lastUpdated = row.created_at;
                    }

                    if (row.status === 'Approved') currentStatusMap[fac].status = 'Approved';
                    else if (row.status === 'Pending' && currentStatusMap[fac].status !== 'Approved') currentStatusMap[fac].status = 'Pending';
                    else if (row.status === 'Rejected' && currentStatusMap[fac].status === 'Draft') currentStatusMap[fac].status = 'Rejected';
                });
            }
            setFacilityStatuses(currentStatusMap);

        } catch (error) { console.error("Error fetching V2 stats:", error); }
    };
    fetchV2StatsAndStatuses();
  }, [year, month, quarter, periodType]);

  const requestAction = (e, facility, action) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, action, facility });
  };

  const handleConfirmAction = async () => {
    const { action, facility } = confirmModal;
    setConfirmModal({ isOpen: false, action: null, facility: null });
    if (action === 'delete') { initiateDeleteFacility(facility); return; }

    const newStatus = action === 'restore' ? 'Active' : 'Archived';
    try {
      const { error } = await supabase.from('facilities').update({ status: newStatus }).eq('name', facility);
      if (error) throw error;
      toast.success(`Facility ${newStatus === 'Active' ? 'restored' : 'archived'} successfully`);
      fetchFacilityMeta();
    } catch (err) { toast.error(`Failed to ${action} facility`); }
  };

  // ==========================================
  // CONSOLIDATED DATA FETCHING & UI RENDER
  // ==========================================
  const loadConsolidatedData = async () => {
    setIsLoadingConsolidated(true);
    try {
        const { data: popData, error: popError } = await supabase.from('populations').select('municipality, barangay_name, population, year');
        if (popError) throw popError;

        const muniPopulations = {};
        ABRA_MUNICIPALITIES.forEach(m => muniPopulations[m] = 0);
        muniPopulations["Non-Abra"] = 0; 

        if (popData && popData.length > 0) {
            const maxYear = Math.max(...popData.map(p => p.year || 0));
            const latestPopData = popData.filter(p => !p.year || p.year === maxYear);
            
            const muniPopSums = {};
            const fullPopMap = {};

            latestPopData.forEach(item => {
                const muni = (item.municipality || '').trim();
                const brgy = (item.barangay_name || '').trim();
                const pop = parseInt(item.population) || 0;
                
                if (brgy && brgy.toLowerCase() !== 'all') {
                    muniPopSums[muni] = (muniPopSums[muni] || 0) + pop;
                } else if (!brgy || brgy.toLowerCase() === 'all') {
                    fullPopMap[muni] = pop;
                }
            });

            ABRA_MUNICIPALITIES.forEach(m => {
                muniPopulations[m] = fullPopMap[m] !== undefined ? fullPopMap[m] : (muniPopSums[m] || 0);
            });
        }

        let targetMonths = [];
        if (periodType === 'Monthly') targetMonths = [month];
        else if (periodType === 'Quarterly') {
            const qIdx = QUARTERS.indexOf(quarter);
            targetMonths = MONTHS.slice(qIdx * 3, qIdx * 3 + 3);
        } else targetMonths = MONTHS;

        // FIX: STRICTLY PULLS ONLY 'Approved' REPORTS
        const { data: reports, error: repError } = await supabase.from('abtc_reports_v2')
            .select('*')
            .eq('year', year)
            .in('month', periodType === 'Annual' ? MONTHS : targetMonths)
            .eq('status', 'Approved');

        if (repError) throw repError;

        const consolidatedData = {};
        ABRA_MUNICIPALITIES.forEach(m => consolidatedData[m] = {
            male: null, female: null, ageUnder15: null, ageOver15: null, cat1: null, 
            cat2EligPri: null, cat2EligBoost: null, cat2NonElig: null, 
            cat3EligPri: null, cat3EligBoost: null, cat3NonElig: null, 
            compCat2Pri: null, compCat2Boost: null, compCat3PriErig: null, compCat3PriHrig: null, compCat3Boost: null, 
            typeDog: null, typeCat: null, typeOthers: null, statusPet: null, statusStray: null, statusUnk: null, rabiesCases: null
        });
        consolidatedData["Non-Abra"] = { ...consolidatedData["Bangued"] }; 

        const addVal = (current, incoming) => {
            if (incoming === null || incoming === undefined || incoming === '') return current;
            const num = parseInt(incoming, 10);
            if (isNaN(num)) return current;
            return (current === null ? 0 : current) + num;
        };

        const map = {
            male: 'male', female: 'female', ageUnder15: 'age_under_15', ageOver15: 'age_over_15',
            cat1: 'cat1', cat2EligPri: 'cat2_elig_pri', cat2EligBoost: 'cat2_elig_boost', cat2NonElig: 'cat2_non_elig',
            cat3EligPri: 'cat3_elig_pri', cat3EligBoost: 'cat3_elig_boost', cat3NonElig: 'cat3_non_elig',
            compCat2Pri: 'comp_cat2_pri', compCat2Boost: 'comp_cat2_boost', compCat3PriErig: 'comp_cat3_pri_erig', compCat3PriHrig: 'comp_cat3_pri_hrig', compCat3Boost: 'comp_cat3_boost',
            typeDog: 'type_dog', typeCat: 'type_cat', typeOthers: 'type_others',
            statusPet: 'status_pet', statusStray: 'status_stray', statusUnk: 'status_unk', rabiesCases: 'rabies_cases'
        };

        reports.forEach(row => {
            const loc = row.location_name?.trim();
            const facName = row.facility;
            
            let targetMuni = null;

            if (ABRA_MUNICIPALITIES.includes(loc)) {
                targetMuni = loc;
            } else if (loc === "Non-Abra") {
                targetMuni = "Non-Abra"; 
            } else {
                const fMeta = facilityMeta.find(m => m.name === facName);
                if (fMeta && fMeta.host_municipality && ABRA_MUNICIPALITIES.includes(fMeta.host_municipality)) {
                    targetMuni = fMeta.host_municipality;
                } else {
                    const fCtx = facilityDetails?.[facName];
                    if (fCtx && fCtx.host_municipality && ABRA_MUNICIPALITIES.includes(fCtx.host_municipality)) {
                        targetMuni = fCtx.host_municipality;
                    } else {
                        const guessed = ABRA_MUNICIPALITIES.find(m => facName.includes(m));
                        if (guessed) targetMuni = guessed;
                    }
                }
            }

            if (targetMuni && consolidatedData[targetMuni]) {
                const agg = consolidatedData[targetMuni];
                for (const [camel, snake] of Object.entries(map)) {
                    agg[camel] = addVal(agg[camel], row[snake]);
                }
            }
        });

        Object.keys(consolidatedData).forEach(loc => {
            Object.keys(consolidatedData[loc]).forEach(k => {
                consolidatedData[loc][k] = consolidatedData[loc][k] === null ? '' : String(consolidatedData[loc][k]);
            });
        });

        setInitialData({
            formRowKeys: [...ABRA_MUNICIPALITIES, "Non-Abra"], 
            otherRowKeys: [], 
            formPopulations: muniPopulations,
            masterPopulations: muniPopulations,
            v2Data: consolidatedData,
            availableLocationsToAdd: [],
            selectedLocationToAdd: ""
        });

        setIsViewingConsolidated(true);
    } catch (err) {
        toast.error("Failed to load consolidated data");
    } finally {
        setIsLoadingConsolidated(false);
    }
  };

  useEffect(() => {
      if (isViewingConsolidated) {
          loadConsolidatedData();
      }
  }, [year, month, quarter, periodType]);

  const handleExportConsolidated = async () => {
    setIsExportingConsolidated(true);
    try {
        const { v2Data, formRowKeys, otherRowKeys, formPopulations } = useReportStore.getState();

        let rawDataForAnnual = null;
        if (periodType === 'Annual') {
            // FIX: STRICTLY PULLS ONLY 'Approved' REPORTS FOR RAW DATA
            const { data: rd, error } = await supabase.from('abtc_reports_v2')
                .select('*')
                .eq('year', year)
                .eq('status', 'Approved');
            if (error) throw error;
            
            rawDataForAnnual = rd.map(row => {
                const loc = row.location_name?.trim();
                const facName = row.facility;
                
                let targetMuni = null;

                if (ABRA_MUNICIPALITIES.includes(loc)) {
                    targetMuni = loc;
                } else if (loc === "Non-Abra") {
                    targetMuni = "Non-Abra"; 
                } else {
                    const fMeta = facilityMeta.find(m => m.name === facName);
                    if (fMeta && fMeta.host_municipality && ABRA_MUNICIPALITIES.includes(fMeta.host_municipality)) {
                        targetMuni = fMeta.host_municipality;
                    } else {
                        const fCtx = facilityDetails?.[facName];
                        if (fCtx && fCtx.host_municipality && ABRA_MUNICIPALITIES.includes(fCtx.host_municipality)) {
                            targetMuni = fCtx.host_municipality;
                        } else {
                            const guessed = ABRA_MUNICIPALITIES.find(m => facName.includes(m));
                            if (guessed) targetMuni = guessed;
                        }
                    }
                }
                return targetMuni ? { ...row, location_name: targetMuni } : null;
            }).filter(Boolean);
        }

        await exportToExcelTemplate({
            data: v2Data,
            formRowKeys, 
            otherRowKeys: [], 
            populations: formPopulations,
            periodType, quarter, month, year,
            facilityName: "PROVINCE OF ABRA (CONSOLIDATED)",
            globalSettings, userProfile,
            rawData: rawDataForAnnual
        });

        toast.success("Consolidated Excel exported successfully!");
    } catch (err) {
        console.error(err);
        toast.error("Failed to generate Consolidated Excel.");
    } finally {
        setIsExportingConsolidated(false);
    }
  };

  // ==========================================
  // RENDER CONSOLIDATED TABLE VIEW
  // ==========================================
  if (isViewingConsolidated) {
      return (
          <div className="flex flex-col h-full w-full bg-slate-50 relative pb-24">
              <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 pt-4 flex-1">
                  
                  {/* Header */}
                  <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 border border-slate-800 relative overflow-hidden">
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
                      <div className="flex items-start sm:items-center gap-4 relative z-10">
                          <button onClick={() => setIsViewingConsolidated(false)} className="p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all"><ArrowLeft size={20}/></button>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                              <h2 className="font-extrabold tracking-tight text-white text-2xl sm:text-3xl truncate">Province-Wide Consolidated</h2>
                              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5"><Layers size={14}/> Province Data</div>
                          </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 relative z-10 w-full xl:w-auto shrink-0">
                          <button disabled={isExportingConsolidated} onClick={handleExportConsolidated} className="w-full sm:w-auto bg-yellow-400 text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                              {isExportingConsolidated ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} 
                              {isExportingConsolidated ? 'Aggregating...' : 'Export Excel'}
                          </button>
                      </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                      <h2 className="text-slate-800 font-bold px-4 shrink-0">Animal Bite and Rabies Report Form</h2>
                      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                          <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                          
                          {/* FIX: Dynamic Dropdowns (Hides Future Months/Quarters entirely) */}
                          {periodType === 'Monthly' && (
                              <select value={month} onChange={e => setMonth(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">
                                  {availableMonths
                                      .filter(m => !(year > currentRealYear || (year === currentRealYear && MONTHS.indexOf(m) > currentRealMonthIdx)))
                                      .map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                          )}
                          {periodType === 'Quarterly' && (
                              <select value={quarter} onChange={e => setQuarter(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">
                                  {QUARTERS
                                      .filter((q, idx) => !(year > currentRealYear || (year === currentRealYear && idx > Math.floor(currentRealMonthIdx / 3))))
                                      .map(q => <option key={q} value={q}>{formatQuarterName(q)}</option>)}
                              </select>
                          )}
                          <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 rounded-lg border border-slate-200 outline-none">{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                      </div>
                  </div>

                  {/* Table Component */}
                  <div className="bg-white flex-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                      {isLoadingConsolidated ? (
                          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                              <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                              <p>Aggregating province-wide data...</p>
                          </div>
                      ) : (
                          <MainReportTableV2 isRowReadOnly={true} onDeleteOtherRow={() => {}} />
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // ==========================================
  // RENDER NORMAL ADMIN DASHBOARD
  // ==========================================
  const displayedFacilities = facilities.filter(f => {
    const meta = facilityMeta.find(m => m.name === f);
    const status = meta?.status || 'Active'; 
    return showArchived ? status === 'Archived' : status === 'Active';
  });

  const mainStats = displayedFacilities.reduce((acc, f) => {
    const status = facilityStatuses[f]?.status || 'Draft';
    if (status === 'Approved') acc.approved++;
    if (status === 'Pending') acc.pending++;
    if (status === 'Rejected') acc.rejected++;
    if (status !== 'Draft' && status !== 'View Only') acc.submitted++;
    return acc;
  }, { approved: 0, pending: 0, rejected: 0, submitted: 0 });

  const totalFacilities = displayedFacilities.length;
  const mainReportingRate = totalFacilities > 0 ? Math.round((mainStats.submitted / totalFacilities) * 100) : 0;

  const getFacilitiesByStatus = (statusType) => {
    return displayedFacilities.filter(f => (facilityStatuses[f]?.status || 'Draft') === statusType);
  };

  const getTargetMonths = () => {
      if (periodType === 'Quarterly') {
          const qIdx = QUARTERS.indexOf(quarter);
          return [MONTHS[qIdx * 3], MONTHS[qIdx * 3 + 1], MONTHS[qIdx * 3 + 2]];
      }
      return MONTHS;
  };
  const targetMonths = getTargetMonths();

  const buildMatrix = () => {
      const dedupedStats = {};
      yearlyStats.main.forEach(r => {
          const key = `${r.facility}_${r.month}`;
          if (!dedupedStats[key] || r.status === 'Approved') dedupedStats[key] = r;
      });
      const flatStats = Object.values(dedupedStats);

      return displayedFacilities.map(f => {
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

  const mainMatrix = buildMatrix();

  const getAggregates = (matrix) => {
      if (matrix.length === 0) return { full: 0, partial: 0, zero: 0, rate: 0 };
      const totalApproved = matrix.reduce((sum, m) => sum + m.approvedCount, 0);
      return {
          full: matrix.filter(m => m.isFully).length,
          partial: matrix.filter(m => m.isPartial).length,
          zero: matrix.filter(m => m.isZero).length,
          rate: Math.round((totalApproved / (displayedFacilities.length * targetMonths.length)) * 100) || 0
      };
  };

  const mainAgg = getAggregates(mainMatrix);

  const getFilteredMatrix = () => {
      if (leaderboardModal.filter === 'full') return mainMatrix.filter(m => m.isFully);
      if (leaderboardModal.filter === 'partial') return mainMatrix.filter(m => m.isPartial);
      if (leaderboardModal.filter === 'zero') return mainMatrix.filter(m => m.isZero);
      return mainMatrix; 
  };

  const modalFacilities = statusModal.isOpen ? getFacilitiesByStatus(statusModal.status) : [];
  const totalModalPages = Math.ceil(modalFacilities.length / ITEMS_PER_PAGE);
  const paginatedModalFacilities = modalFacilities.slice((modalPage - 1) * ITEMS_PER_PAGE, modalPage * ITEMS_PER_PAGE);

  const totalCardPages = Math.ceil(displayedFacilities.length / CARDS_PER_PAGE);
  const paginatedCards = displayedFacilities.slice((cardPage - 1) * CARDS_PER_PAGE, cardPage * CARDS_PER_PAGE);

  const currentDisplayPeriod = periodType === 'Monthly' ? month : periodType === 'Quarterly' ? formatQuarterName(quarter) : 'Annual';

  const renderFractionBadge = (facilityName, matrix) => {
      const facData = matrix.find(m => m.facility === facilityName);
      if (!facData) return <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-bold text-[10px]">0 / {targetMonths.length}</span>;
      
      const isFull = facData.isFully;
      const isZero = facData.isZero;
      
      return (
          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              isFull ? 'bg-emerald-100 text-emerald-700' : 
              isZero ? 'bg-rose-100 text-rose-700' : 
              'bg-amber-100 text-amber-700'
          }`}>
              {facData.approvedCount} / {targetMonths.length}
          </span>
      );
  };

  return (
    <div className="max-w-7xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500 relative pb-24 sm:pb-12 w-full px-2 sm:px-4">
        
        {/* --- MONTHLY STATUS DETAILS MODAL --- */}
        {statusModal.isOpen && (
            <ModalPortal>
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                    ${statusModal.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                                      statusModal.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {statusModal.status === 'Approved' ? <CheckCircle size={20} strokeWidth={2.5}/> : 
                                     statusModal.status === 'Pending' ? <Clock size={20} strokeWidth={2.5}/> : <XCircle size={20} strokeWidth={2.5}/>}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                                        Form 1 - {statusModal.status}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500">{month} {year}</p>
                                </div>
                            </div>
                            <button onClick={() => setStatusModal({ isOpen: false, status: null })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="overflow-hidden flex flex-col flex-1">
                            {modalFacilities.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <Archive size={20} className="text-slate-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">No {statusModal.status.toLowerCase()} reports</p>
                                    <p className="text-xs text-slate-400 mt-1">There are no facilities currently in this status.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto custom-scrollbar">
                                        {paginatedModalFacilities.map(f => (
                                            <div 
                                                key={f} 
                                                onClick={() => { 
                                                    localStorage.setItem('adminTargetTab', 'main');
                                                    setStatusModal({ isOpen: false, status: null }); 
                                                    onSelectFacility(f); 
                                                }} 
                                                className="group px-4 py-3.5 hover:bg-slate-50 rounded-xl flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200 active:scale-[0.98] transition-all"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-800 truncate group-hover:text-black transition-colors">{f}</span>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-yellow-500 transition-colors shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                    {totalModalPages > 1 && (
                                        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-100">
                                            <button onClick={() => setModalPage(p => Math.max(1, p - 1))} disabled={modalPage === 1} className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 active:scale-95 disabled:opacity-50 transition-all shadow-sm">Previous</button>
                                            <span className="text-xs font-medium text-slate-500">Page {modalPage} of {totalModalPages}</span>
                                            <button onClick={() => setModalPage(p => Math.min(totalModalPages, p + 1))} disabled={modalPage === totalModalPages} className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 active:scale-95 disabled:opacity-50 transition-all shadow-sm">Next</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* --- LEADERBOARD MATRIX MODAL --- */}
        {leaderboardModal.isOpen && (
            <ModalPortal>
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
                                        {leaderboardModal.filter} Compliance • {periodType === 'Annual' ? `Annual ${year}` : `${formatQuarterName(quarter)} ${year}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setLeaderboardModal({ isOpen: false, filter: null })} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
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
                                                        <div 
                                                            key={m.month} 
                                                            title={`${m.month}: ${m.status}`}
                                                            className={`flex items-center justify-center px-2 py-1 text-[10px] sm:text-xs font-bold rounded-md border ${
                                                                isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                                                                isPending ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                                                                isRejected ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                                                                'bg-slate-100 border-slate-200 text-slate-400'
                                                            }`}
                                                        >
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

        {/* --- CONFIRMATION MODAL (Delete/Restore) --- */}
        {confirmModal.isOpen && (
            <ModalPortal>
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="flex flex-col items-center text-center">
                            <div className={`p-4 rounded-full mb-5 shadow-inner ${confirmModal.action === 'delete' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                {confirmModal.action === 'delete' ? <Trash2 size={28} strokeWidth={2.5} /> : <AlertTriangle size={28} strokeWidth={2.5} />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 capitalize tracking-tight">
                                {confirmModal.action} Facility?
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                                Are you sure you want to <strong>{confirmModal.action}</strong> the facility <span className="text-slate-900 font-medium">"{confirmModal.facility}"</span>?
                                {confirmModal.action === 'archive' && " It will be hidden from the main dashboard."}
                                {confirmModal.action === 'delete' && " This action cannot be undone."}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button onClick={() => setConfirmModal({ isOpen: false, action: null, facility: null })} className="flex-1 py-3 sm:py-2.5 px-4 bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all duration-200 border border-slate-200 order-2 sm:order-1">
                                    Cancel
                                </button>
                                <button onClick={handleConfirmAction} className={`flex-1 py-3 sm:py-2.5 text-black rounded-xl text-sm font-bold active:scale-95 transition-all duration-200 shadow-sm order-1 sm:order-2 ${confirmModal.action === 'delete' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-yellow-400 hover:bg-yellow-500'}`}>
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalPortal>
        )}

        {/* ========================================== */}
        {/* TIER 1: MAIN ADMIN HEADER & ACTIONS        */}
        {/* ========================================== */}
        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 md:p-8 mb-6 mt-2 shadow-xl flex flex-col xl:flex-row xl:items-end justify-between gap-5 sm:gap-6 border border-slate-800 relative overflow-hidden no-print z-20 mt-2 mb-3">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
            
            {/* Left side: Title & Subtitle */}
            <div className="relative z-10 w-full xl:w-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Admin Dashboard</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Manage and monitor facility submissions province-wide</p>
            </div>
            
            {/* Right side: Global Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 relative z-10 w-full xl:w-auto">
                <button onClick={onAddFacility} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:border-slate-500">
                    <Plus size={16} /> <span>Add Facility</span>
                </button>
                <button onClick={onManageUsers} className="flex-1 sm:flex-none justify-center bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95 transition-all duration-200 hover:bg-slate-700 hover:text-white hover:border-slate-500">
                    <Users size={16} /> <span>Manage Users</span>
                </button>
                <div className="hidden sm:block w-px h-6 bg-slate-700 mx-1"></div>
                <button onClick={loadConsolidatedData} className="flex-1 sm:flex-none justify-center bg-yellow-400 text-black px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:bg-yellow-500 flex items-center gap-2 active:scale-95 transition-all duration-200">
                    <Layers size={16} /> <span>Consolidated Report</span>
                </button>
            </div>
        </div>

        {/* ========================================== */}
        {/* TIER 2: DATA CONTROLS (FILTERS & VIEWS)    */}
        {/* ========================================== */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 sm:p-3 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 no-print">

            {/* Left side: Date Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block mr-1">Period:</span>
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                    </select>
                </div>
                
                {/* FIX: Dynamic Dropdowns (Hides Future Months/Quarters entirely) */}
                {periodType === 'Monthly' && (
                    <select value={month} onChange={e => setMonth(e.target.value)} disabled={!availableMonths.length} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 min-w-[110px]">
                        {availableMonths
                            .filter(m => !(year > currentRealYear || (year === currentRealYear && MONTHS.indexOf(m) > currentRealMonthIdx)))
                            .map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                )}
                
                {periodType === 'Quarterly' && (
                    <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={!QUARTERS.length} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 min-w-[110px]">
                        {QUARTERS
                            .filter((q, idx) => !(year > currentRealYear || (year === currentRealYear && idx > Math.floor(currentRealMonthIdx / 3))))
                            .map(q => <option key={q} value={q}>{formatQuarterName(q)}</option>)}
                    </select>
                )}
                
                <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={!availableYears.length} className="bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 min-w-[80px]">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Right side: Archive Toggle */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                {showArchived && (
                    <div className="hidden sm:flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 text-xs font-bold animate-in fade-in slide-in-from-right-2">
                        <AlertTriangle size={14} /> Viewing Archived
                    </div>
                )}
                <button 
                    onClick={() => setShowArchived(!showArchived)} 
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 border flex items-center justify-center gap-2 ${
                        showArchived 
                            ? 'bg-slate-800 text-white border-slate-700 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                    }`}
                >
                    {showArchived ? <RefreshCcw size={16} /> : <Archive size={16} />}
                    <span>{showArchived ? 'Show Active Facilities' : 'View Archived'}</span>
                </button>
            </div>
        </div>

        {/* --- KPI CARDS --- */}
        {!showArchived && (
          <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div>
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">
                 Form 1 Overview ({currentDisplayPeriod} {year})
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {periodType === 'Monthly' ? (
                      <>
                        <div onClick={() => { setStatusModal({ isOpen: true, status: 'Approved' }); setModalPage(1); }} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer group active:scale-[0.98] transition-all">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <CheckCircle size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Approved</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainStats.approved}</p>
                            </div>
                        </div>
                        <div onClick={() => { setStatusModal({ isOpen: true, status: 'Pending' }); setModalPage(1); }} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer group active:scale-[0.98] transition-all">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <Clock size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pending</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainStats.pending}</p>
                            </div>
                        </div>
                        <div onClick={() => { setStatusModal({ isOpen: true, status: 'Rejected' }); setModalPage(1); }} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer group active:scale-[0.98] transition-all">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                <XCircle size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Rejected</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainStats.rejected}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md group">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all">
                                <TrendingUp size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Compliance Rate</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainReportingRate}%</p>
                            </div>
                        </div>
                      </>
                  ) : (
                      <>
                        <div onClick={() => setLeaderboardModal({ isOpen: true, filter: 'full' })} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer group active:scale-[0.98] transition-all">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <CheckCircle size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fully Compliant</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainAgg.full}</p>
                            </div>
                        </div>
                        <div onClick={() => setLeaderboardModal({ isOpen: true, filter: 'partial' })} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer group active:scale-[0.98] transition-all">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <Clock size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Partially Compliant</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainAgg.partial}</p>
                            </div>
                        </div>
                        <div onClick={() => setLeaderboardModal({ isOpen: true, filter: 'zero' })} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer group active:scale-[0.98] transition-all">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                <XCircle size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Zero Submissions</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainAgg.zero}</p>
                            </div>
                        </div>
                        <div onClick={() => setLeaderboardModal({ isOpen: true, filter: 'all' })} className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex items-center gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer group active:scale-[0.98] transition-all">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_10px_rgba(250,204,21,0.3)] transition-all">
                                <TrendingUp size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Average Compliance</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{mainAgg.rate}%</p>
                            </div>
                        </div>
                      </>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Facility Cards Grid with Pagination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedCards.map((f) => {
            const statusObj = facilityStatuses[f] || { status: 'Draft', lastUpdated: null };
            const main = statusObj.status;
            const lastUpdated = statusObj.lastUpdated;

            const meta = facilityMeta.find((m) => m.name === f);
            
            let type = meta?.type;
            if (!type) {
              if (f.includes('Hospital') || f === 'APH') type = 'Hospital';
              else if (f.includes('Clinic') || f === 'AMDC') type = 'Clinic';
              else type = 'RHU';
            }

            let ownership = meta?.ownership;
            if (!ownership) {
              if (f === 'APH' || type === 'RHU') ownership = 'Government';
              else ownership = 'Private';
            }

            const isArchived = meta?.status === 'Archived';
            const facilityStatusLabel = isArchived ? 'Disabled' : 'Active';
            const ownerName = facilityOwners[f];

            return (
              <div 
                key={f} 
                onClick={() => {
                    if (!showArchived) {
                        localStorage.setItem('adminTargetTab', 'main');
                        onSelectFacility(f);
                    }
                }} 
                className={`group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden ${showArchived ? 'bg-slate-100 border-slate-200 opacity-80' : 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] hover:border-slate-900/30'}`}
              >
                <div className="flex justify-between items-start mb-4 sm:mb-5">
                  <div className={`p-2.5 sm:p-3 rounded-xl transition-all duration-300 ${showArchived ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-yellow-400 group-hover:shadow-md'}`}>
                    {type === 'Hospital' ? <Hospital size={24} strokeWidth={2}/> : (type === 'Clinic' ? <Stethoscope size={24} strokeWidth={2}/> : <Building2 size={24} strokeWidth={2}/>)}
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-1.5 items-end">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
                        <StatusBadge status={facilityStatusLabel} />
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Form 1</span>
                        {periodType === 'Monthly' ? <StatusBadge status={main} /> : renderFractionBadge(f, mainMatrix)}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3 sm:mb-4">
                  <span className={`inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider mb-2 sm:mb-3 ${ownership === 'Government' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800 shadow-sm'}`}>
                    {ownership}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight break-words mb-1 group-hover:text-black transition-colors">{f}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Report for {periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? formatQuarterName(quarter) : 'Annual')} {year}</p>
                </div>
                
                <div className="mb-4 sm:mb-5 flex items-center gap-2 text-xs sm:text-sm bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100">
                    <Users size={14} className="text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium truncate" title={ownerName || 'Unassigned'}>
                        {ownerName || <span className="italic text-slate-400 font-normal">No user assigned</span>}
                    </span>
                </div>
                
                <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-bold transition-colors ${showArchived ? 'text-slate-400' : 'text-slate-800 group-hover:text-yellow-600'}`}>
                    {showArchived ? 'Archived Facility' : 'Open Report →'}
                  </span>
                  
                  {/* ONLY SYSADMIN CAN SEE ARCHIVE/DELETE */}
                  {user?.role === 'SYSADMIN' && (
                      <div className="flex gap-1.5">
                        <button onClick={(e) => requestAction(e, f, showArchived ? 'restore' : 'archive')} className={`transition-all duration-200 active:scale-90 p-1.5 sm:p-2 rounded-lg border border-transparent ${showArchived ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200'}`} title={showArchived ? "Restore" : "Archive"}>
                            {showArchived ? <RefreshCcw size={14} /> : <Archive size={14} />}
                        </button>
                        <button onClick={(e) => requestAction(e, f, 'delete')} className="text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 active:scale-90 p-1.5 sm:p-2 rounded-lg border border-transparent" title="Delete">
                            <Trash2 size={14} />
                        </button>
                      </div>
                  )}

                </div>

                {lastUpdated && (
                  <div className="absolute top-3 sm:top-4 right-1/2 translate-x-1/2 flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 font-bold bg-white/90 backdrop-blur px-2 sm:px-2.5 py-0.5 rounded-full border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm pointer-events-none">
                      <Clock size={10} />
                      <span>Updated {new Date(lastUpdated).toLocaleDateString('en-PH')}</span>
                  </div>
                )}
              </div>
            );
          })}
          
          {displayedFacilities.length === 0 && (
             <div className="col-span-full py-12 sm:py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-300">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 mb-3 sm:mb-4">
                  {showArchived ? <Archive size={24} className="text-slate-400" /> : <Hospital size={24} className="text-slate-400" />}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">No Facilities Found</h3>
                <p className="text-slate-500 text-xs sm:text-sm">There are currently no {showArchived ? 'archived' : 'active'} facilities to display.</p>
             </div>
          )}

          {/* Cards Pagination */}
          {totalCardPages > 1 && (
             <div className="col-span-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white rounded-2xl border border-slate-200 shadow-sm mt-2">
                 <button onClick={() => setCardPage(p => Math.max(1, p - 1))} disabled={cardPage === 1} className="text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm flex items-center gap-1.5 sm:gap-2">
                     <ChevronLeft size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Previous</span>
                 </button>
                 <span className="text-xs sm:text-sm font-medium text-slate-500">
                     Page <strong className="text-slate-900">{cardPage}</strong> of <strong className="text-slate-900">{totalCardPages}</strong>
                 </span>
                 <button onClick={() => setCardPage(p => Math.min(totalCardPages, p + 1))} disabled={cardPage === totalCardPages} className="text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm flex items-center gap-1.5 sm:gap-2">
                     <span className="hidden sm:inline">Next</span> <ChevronRight size={16} strokeWidth={2.5} />
                 </button>
             </div>
          )}
        </div>
    </div>
  );
}