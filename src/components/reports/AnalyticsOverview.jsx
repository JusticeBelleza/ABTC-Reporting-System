import React, { useMemo, useState, useEffect } from 'react';
import { Loader2, ShieldAlert, PieChart as PieChartIcon, TrendingUp, TrendingDown, Calendar, User, BrainCircuit, Activity, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { QUARTERS, MONTHS } from '../../lib/constants';

import { useForecastingMetrics } from '../../hooks/useForecastingMetrics';
import DemographicCharts from './DemographicCharts';
import CustomDropdown from '../common/CustomDropdown';
import SmartAlertsPanel from './SmartAlertsPanel';
import PredictiveModel from './PredictiveModel';
import { toPng } from 'html-to-image'; 

const COLORS = {
  male: '#3B82F6', female: '#F43F5E',
  ageLt15: '#10B981', ageGt15: '#F59E0B',
  cat1: '#14B8A6', cat2: '#F59E0B', cat3: '#EF4444',
  dog: '#6366F1', cat: '#8B5CF6', other: '#64748B',
  pet: '#10B981', stray: '#F43F5E', unk: '#94A3B8'
};

const TOOLTIP_STYLE = {
  borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  padding: '12px 16px', fontWeight: '700', color: '#0F172A', backgroundColor: 'rgba(255, 255, 255, 0.98)'
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (!value || value === 0) return null; 
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="900" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.4)' }}>
      {value}
    </text>
  );
};

const renderDynamicBarLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) return null;
  const isShortBar = height < 24;
  const textY = isShortBar ? y - 10 : y + 14;
  const textColor = isShortBar ? '#475569' : '#ffffff';
  return (
    <text x={x + width / 2} y={textY} fill={textColor} textAnchor="middle" fontSize={12} fontWeight="800">
      {value}
    </text>
  );
};

const calcTotal = (rows) => {
    let sum = 0;
    rows.forEach(r => {
        if (!r.location_name || r.location_name.includes('Outside Catchment')) return;
        const n = (v) => isNaN(Number(v)) ? 0 : Number(v);
        const cat2Tot = n(r.cat2_elig_pri) + n(r.cat2_elig_boost) + n(r.cat2_non_elig);
        const cat3Tot = n(r.cat3_elig_pri) + n(r.cat3_elig_boost) + n(r.cat3_non_elig);
        sum += n(r.cat1) + cat2Tot + cat3Tot;
    });
    return Math.round(sum);
};

export default function AnalyticsOverview({ 
  periodType, setPeriodType, year, setYear, month, setMonth, 
  quarter, setQuarter, availableYears, availableMonths 
}) {
  const { user, facilities, facilityDetails, globalSettings } = useApp();
  const isAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';

  const OUTBREAK_SENSITIVITY = 1 + ((globalSettings?.outbreak_threshold_percent ?? 50) / 100);
  const TREND_SENSITIVITY = globalSettings?.trend_alert_percent ?? 10; 

  const facilityType = facilityDetails?.[user?.facility]?.type || 'RHU';
  const locationTitleBase = isAdmin 
    ? "Cases by Municipality" 
    : (facilityType === 'Hospital' || facilityType === 'Clinic' ? "Cases by Municipality" : "Cases by Barangay");

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [showMathModal, setShowMathModal] = useState(false);
  const [dbMunicipalities, setDbMunicipalities] = useState([]);

  useEffect(() => {
      const getMunis = async () => {
          const { data } = await supabase.from('populations').select('municipality').not('municipality', 'is', null);
          if (data) setDbMunicipalities(Array.from(new Set(data.map(d => d.municipality))));
      };
      getMunis();
  }, []);

  const currentDate = useMemo(() => new Date(), []);
  const currentRealYear = currentDate.getFullYear();
  const currentQuarterIndex = Math.floor(currentDate.getMonth() / 3);
  
  const availableQuarters = useMemo(() => {
    if (year === currentRealYear) return QUARTERS.slice(0, currentQuarterIndex + 1);
    return QUARTERS;
  }, [year, currentRealYear, currentQuarterIndex]);

  const [v2AllYearData, setV2AllYearData] = useState([]); 
  const [v2Data, setV2Data] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [reportStatus, setReportStatus] = useState('Not Submitted');

  useEffect(() => {
      const fetchV2Analytics = async () => {
          setLoading(true);
          try {
              let allData = [];
              let hasMore = true;
              let page = 0;
              const pageSize = 1000;

              while (hasMore) {
                  let query = supabase.from('abtc_reports_v2').select('*').in('year', [year, year - 1]);
                  if (!isAdmin) query = query.eq('facility', user?.facility);
                  
                  const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
                  if (error) {
                      console.error("Pagination error:", error);
                      break;
                  }
                  
                  if (data && data.length > 0) {
                      allData.push(...data);
                      if (data.length < pageSize) hasMore = false;
                      else page++;
                  } else {
                      hasMore = false;
                  }
              }
              
              const buckets = [];
              allData.forEach(r => {
                  if (isAdmin && r.status !== 'Approved') return; 

                  const n = (v) => isNaN(Number(v)) ? 0 : Number(v);
                  const distribute = (mName, divisor) => {
                      buckets.push({
                          ...r, month: mName,
                          cat1: n(r.cat1) / divisor,
                          cat2_elig_pri: n(r.cat2_elig_pri) / divisor,
                          cat2_elig_boost: n(r.cat2_elig_boost) / divisor,
                          cat2_non_elig: n(r.cat2_non_elig) / divisor,
                          cat3_elig_pri: n(r.cat3_elig_pri) / divisor,
                          cat3_elig_boost: n(r.cat3_elig_boost) / divisor,
                          cat3_non_elig: n(r.cat3_non_elig) / divisor,
                          male: n(r.male) / divisor, female: n(r.female) / divisor,
                          age_under_15: n(r.age_under_15) / divisor, age_over_15: n(r.age_over_15) / divisor,
                          type_dog: n(r.type_dog) / divisor, type_cat: n(r.type_cat) / divisor, type_others: n(r.type_others) / divisor,
                          status_pet: n(r.status_pet) / divisor, status_stray: n(r.status_stray) / divisor, status_unk: n(r.status_unk) / divisor
                      });
                  };

                  const dbMonth = String(r.month || '').trim().toLowerCase();
                  if (dbMonth === 'annual') MONTHS.forEach(m => distribute(m, 12));
                  else if (dbMonth.includes('quarter')) {
                      const qNum = parseInt(dbMonth.charAt(0));
                      if (!isNaN(qNum) && qNum >= 1 && qNum <= 4) {
                          MONTHS.slice((qNum - 1) * 3, qNum * 3).forEach(m => distribute(m, 3));
                      }
                  } else {
                      const exactMonth = MONTHS.find(m => m.toLowerCase() === dbMonth);
                      if (exactMonth) distribute(exactMonth, 1);
                  }
              });

              setV2AllYearData(buckets);
              
              let targetMonths = [];
              if (periodType === 'Monthly') targetMonths = [month];
              else if (periodType === 'Quarterly') {
                  const qIdx = QUARTERS.indexOf(quarter);
                  targetMonths = [MONTHS[qIdx*3], MONTHS[qIdx*3+1], MONTHS[qIdx*3+2]];
              } else {
                  targetMonths = MONTHS;
              }

              setV2Data(buckets.filter(d => d.year === year && targetMonths.includes(d.month)));
              
              // FIX: Determine correct reportStatus for Admin
              if (isAdmin) {
                  const targetMonthsLower = targetMonths.map(m => m.toLowerCase());
                  const hasApprovedReportInPeriod = allData.some(d => 
                      d.year === year && 
                      d.status === 'Approved' && 
                      targetMonthsLower.includes(String(d.month || '').trim().toLowerCase())
                  );
                  setReportStatus(hasApprovedReportInPeriod ? 'Approved' : 'Draft');
              } else {
                  const originalRow = allData.filter(d => {
                      if (d.year !== year) return false;
                      const dbM = String(d.month || '').trim().toLowerCase();
                      if (periodType === 'Monthly') return dbM === month.toLowerCase();
                      if (periodType === 'Quarterly') return dbM.includes(String(QUARTERS.indexOf(quarter) + 1));
                      return dbM === 'annual';
                  });

                  if (originalRow.length > 0) setReportStatus(originalRow[0].status || 'Draft');
                  else setReportStatus('Draft'); 
              }

          } catch (err) {
              console.error("V2 Analytics Fetch Error:", err);
          } finally {
              setLoading(false);
          }
      };
      fetchV2Analytics();
  }, [year, month, quarter, periodType, isAdmin, user?.facility]);

  const {
    full24MonthData, loadingHistory, smartAlerts,
    complianceRate, riskLevel, projectedNextMonth, modelMetrics
  } = useForecastingMetrics({
    year, month, quarter, periodType, facilities, user, isAdmin,
    currentDate, currentRealYear, OUTBREAK_SENSITIVITY, TREND_SENSITIVITY,
    facilityDetails, globalSettings
  });

  const locationInfo = useMemo(() => {
    if (!v2Data || v2Data.length === 0) return { chartData: [], tableData: [], total: 0 };
    const chartMap = {}; const tableMap = {}; let total = 0;
    
    const hostMuni = dbMunicipalities.find(m => user?.facility?.toLowerCase().includes(m.toLowerCase()));

    v2Data.forEach(row => {
        if (!row.location_name || row.location_name.includes('Outside Catchment')) return;
        const num = (v) => isNaN(Number(v)) ? 0 : Number(v);
        const cases = num(row.cat1) + num(row.cat2_elig_pri) + num(row.cat2_elig_boost) + num(row.cat2_non_elig) + num(row.cat3_elig_pri) + num(row.cat3_elig_boost) + num(row.cat3_non_elig);
        
        if (cases > 0) {
            total += cases;
            if (isAdmin || facilityType === 'Hospital') {
                if (dbMunicipalities.includes(row.location_name) || row.location_name === 'Non-Abra') {
                    chartMap[row.location_name] = (chartMap[row.location_name] || 0) + cases;
                } else {
                    const parentMuni = dbMunicipalities.find(m => row.facility?.toLowerCase().includes(m.toLowerCase()));
                    const targetName = parentMuni || row.facility; 
                    chartMap[targetName] = (chartMap[targetName] || 0) + cases;
                }
            } else {
               if ((dbMunicipalities.includes(row.location_name) && row.location_name !== hostMuni) || row.location_name === 'Non-Abra') {
                   tableMap[row.location_name] = (tableMap[row.location_name] || 0) + cases;
               } else {
                   chartMap[row.location_name] = (chartMap[row.location_name] || 0) + cases;
               }
            }
        }
    });

    const chart = Object.entries(chartMap)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => {
            if (a.name === 'Non-Abra') return 1;
            if (b.name === 'Non-Abra') return -1;
            return a.name.localeCompare(b.name);
        });

    const table = Object.entries(tableMap)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => {
            if (a.name === 'Non-Abra') return 1;
            if (b.name === 'Non-Abra') return -1;
            return b.value - a.value; 
        });
    
    return { chartData: chart, tableData: table, total: Math.round(total) };
  }, [v2Data, isAdmin, facilityType, dbMunicipalities, user]);

  const currentTotal = locationInfo.total;

  const calculatedYTD = useMemo(() => {
      let ytdMonths = MONTHS;
      if (periodType === 'Monthly') ytdMonths = MONTHS.slice(0, MONTHS.indexOf(month) + 1);
      else if (periodType === 'Quarterly') ytdMonths = MONTHS.slice(0, (QUARTERS.indexOf(quarter) * 3) + 3);
      
      const rows = v2AllYearData.filter(d => d.year === year && ytdMonths.includes(d.month));
      return calcTotal(rows);
  }, [periodType, v2AllYearData, month, quarter, year]);

  const annualTotal = useMemo(() => {
      const rows = v2AllYearData.filter(d => d.year === year);
      return calcTotal(rows);
  }, [v2AllYearData, year]);

  const previousPeriodComparison = useMemo(() => {
      let prevMonths = []; let prevYear = year; let label = '';
      if (periodType === 'Monthly') {
          const mIdx = MONTHS.indexOf(month);
          if (mIdx === 0) { prevMonths = [MONTHS[11]]; prevYear = year - 1; }
          else { prevMonths = [MONTHS[mIdx - 1]]; prevYear = year; }
          label = `vs ${prevMonths[0].substring(0,3)} ${prevYear}`;
      } else if (periodType === 'Quarterly') {
          const qIdx = QUARTERS.indexOf(quarter);
          if (qIdx === 0) { prevMonths = [MONTHS[9], MONTHS[10], MONTHS[11]]; prevYear = year - 1; }
          else { prevMonths = [MONTHS[(qIdx-1)*3], MONTHS[(qIdx-1)*3+1], MONTHS[(qIdx-1)*3+2]]; prevYear = year; }
          label = `vs Q${qIdx === 0 ? 4 : qIdx} ${prevYear}`;
      } else {
          prevMonths = MONTHS; prevYear = year - 1;
          label = `vs ${prevYear}`;
      }
      
      const rows = v2AllYearData.filter(d => d.year === prevYear && prevMonths.includes(d.month));
      
      if (rows.length === 0) return { hasData: false, label };

      const prevTotal = calcTotal(rows);
      const diff = currentTotal - prevTotal;
      const sign = diff > 0 ? '+' : '';
      return { hasData: true, diff, display: `${sign}${diff} cases`, label };
  }, [v2AllYearData, periodType, month, quarter, year, currentTotal]);

  const samePeriodLastYear = useMemo(() => {
      if (periodType === 'Annual') return null;
      
      let targetMonths = [];
      let label = '';
      
      if (periodType === 'Monthly') {
          targetMonths = [month];
          label = `vs ${month.substring(0,3)} ${year - 1}`;
      } else {
          const qIdx = QUARTERS.indexOf(quarter);
          targetMonths = [MONTHS[qIdx*3], MONTHS[qIdx*3+1], MONTHS[qIdx*3+2]];
          label = `vs Q${qIdx + 1} ${year - 1}`;
      }

      const rows = v2AllYearData.filter(d => d.year === year - 1 && targetMonths.includes(d.month));
      
      if (rows.length === 0) return { hasData: false, label };

      const prevTotal = calcTotal(rows);
      const diff = currentTotal - prevTotal;
      const sign = diff > 0 ? '+' : '';
      return { hasData: true, diff, display: `${sign}${diff} cases`, label };
  }, [v2AllYearData, periodType, month, quarter, year, currentTotal]);

  const safeTotals = useMemo(() => {
      let sums = { male: 0, female: 0, ageLt15: 0, ageGt15: 0, cat1: 0, cat2: 0, cat3: 0, dog: 0, cat: 0, others: 0, pet: 0, stray: 0, unk: 0 };
      v2Data.forEach(r => {
          if (!r.location_name || r.location_name.includes('Outside Catchment')) return;
          const n = (v) => isNaN(Number(v)) ? 0 : Number(v);
          sums.male += n(r.male); sums.female += n(r.female);
          sums.ageLt15 += n(r.age_under_15); sums.ageGt15 += n(r.age_over_15);
          sums.cat1 += n(r.cat1);
          sums.cat2 += n(r.cat2_elig_pri) + n(r.cat2_elig_boost) + n(r.cat2_non_elig);
          sums.cat3 += n(r.cat3_elig_pri) + n(r.cat3_elig_boost) + n(r.cat3_non_elig);
          sums.dog += n(r.type_dog); sums.cat += n(r.type_cat); sums.others += n(r.type_others);
          sums.pet += n(r.status_pet); sums.stray += n(r.status_stray); sums.unk += n(r.status_unk);
      });
      
      Object.keys(sums).forEach(k => sums[k] = Math.round(sums[k]));
      return sums;
  }, [v2Data]);

  const demographicsSexData = useMemo(() => [{ name: 'Male', value: safeTotals.male || 0 }, { name: 'Female', value: safeTotals.female || 0 }], [safeTotals]);
  
  const demographicsAgeData = useMemo(() => [
    { name: 'Under 15', value: safeTotals.ageLt15 || 0, fill: COLORS.ageLt15 }, 
    { name: '15 & Over', value: safeTotals.ageGt15 || 0, fill: COLORS.ageGt15 }
  ], [safeTotals]);

  const categoryData = useMemo(() => [
    { name: 'Category I', value: safeTotals.cat1 || 0, fill: COLORS.cat1 },
    { name: 'Category II', value: safeTotals.cat2 || 0, fill: COLORS.cat2 },
    { name: 'Category III', value: safeTotals.cat3 || 0, fill: COLORS.cat3 }
  ], [safeTotals]);

  const animalData = useMemo(() => [
    { name: 'Dog', value: safeTotals.dog || 0, fill: COLORS.dog },
    { name: 'Cat', value: safeTotals.cat || 0, fill: COLORS.cat },
    { name: 'Others', value: safeTotals.others || 0, fill: COLORS.other }
  ], [safeTotals]);

  const statusData = useMemo(() => [
    { name: 'Pet', value: safeTotals.pet || 0, fill: COLORS.pet },
    { name: 'Stray', value: safeTotals.stray || 0, fill: COLORS.stray },
    { name: 'Unknown', value: safeTotals.unk || 0, fill: COLORS.unk }
  ], [safeTotals]);

  const categoryTotal = (safeTotals.cat1 || 0) + (safeTotals.cat2 || 0) + (safeTotals.cat3 || 0);
  const animalTotal = (safeTotals.dog || 0) + (safeTotals.cat || 0) + (safeTotals.others || 0);
  const statusTotal = (safeTotals.pet || 0) + (safeTotals.stray || 0) + (safeTotals.unk || 0);
  const sexTotal = (safeTotals.male || 0) + (safeTotals.female || 0);
  const ageTotal = (safeTotals.ageLt15 || 0) + (safeTotals.ageGt15 || 0);

  const handleDownload = (ref, filename) => {
    const el = document.getElementById(ref);
    if (!el) return;
    toPng(el, { cacheBust: true, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
  };

  const isDataApproved = isAdmin || (periodType === 'Monthly' ? reportStatus === 'Approved' : v2Data.length > 0);

  const renderDataCompletenessBanner = () => {
    if (v2Data.length === 0) return null; 
    const isComplete = complianceRate === 100;
    return (
      <div className={`mb-3 sm:mb-6 p-3 sm:p-4 rounded-xl border flex items-start sm:items-center gap-2.5 sm:gap-3 shadow-sm ${isComplete ? 'bg-emerald-50/80 border-emerald-200/60' : 'bg-amber-50/80 border-amber-200/60'}`}>
        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 sm:mt-0 ${isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
             {isComplete ? <CheckCircle size={18} strokeWidth={2.5}/> : <ShieldAlert size={18} strokeWidth={2.5}/>}
        </div>
        <div className="flex flex-col">
          <h4 className={`text-sm font-bold ${isComplete ? 'text-emerald-900' : 'text-amber-900'}`}>{isComplete ? 'Complete Submission Ledger' : 'Incomplete Data Warning'}</h4>
          <p className={`text-xs font-medium mt-0.5 ${isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isAdmin 
              ? (isComplete ? 'All authorized facilities have submitted reports for this period.' : `Only ${complianceRate}% of facilities have submitted their reports.`)
              : (isComplete ? 'Your facility report has been submitted for this period.' : 'Your facility report is still pending or in draft.')
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500 relative pb-24 sm:pb-12 w-full px-2 sm:px-4">
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-6 mt-1 shadow-xl flex flex-col xl:flex-row xl:items-end justify-between gap-4 sm:gap-6 border border-slate-800 relative overflow-hidden no-print z-20">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
          <div className="flex items-start gap-3 sm:gap-4 relative z-10">
              <div className="bg-slate-800 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-inner border border-slate-700 text-yellow-400">
                  <PieChartIcon size={22} className="sm:w-7 sm:h-7" strokeWidth={2.5}/>
              </div>
              <div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">{isAdmin ? "Provincial" : "Facility"} Analytics</h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5 sm:mt-1">Review performance and forecast future volume</p>
              </div>
          </div>
          
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 z-10 w-full xl:w-auto">
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-full xl:w-auto shrink-0">
                  <button onClick={() => setActiveSubTab('overview')} className={`flex-1 xl:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${activeSubTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                      Overview
                  </button>
                  <button onClick={() => setActiveSubTab('predictive')} className={`flex-1 xl:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'predictive' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                      <BrainCircuit size={14}/> Predictive
                  </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700 shadow-inner w-full xl:w-auto">
                  {activeSubTab === 'overview' && (
                      <>
                          <CustomDropdown
                              value={periodType}
                              onChange={setPeriodType}
                              options={['Monthly', 'Quarterly', 'Annual']}
                              className="flex-1 xl:flex-none min-w-[95px]"
                              buttonClassName="!bg-slate-700 !text-white !border-slate-600 !py-1.5"
                          />
                          
                          {periodType === 'Monthly' && (
                              <CustomDropdown
                                  value={month}
                                  onChange={setMonth}
                                  options={availableMonths}
                                  className="flex-1 xl:flex-none min-w-[100px]"
                                  buttonClassName="!bg-slate-700 !text-white !border-slate-600 !py-1.5"
                              />
                          )}

                          {periodType === 'Quarterly' && (
                              <CustomDropdown
                                  value={quarter}
                                  onChange={setQuarter}
                                  options={availableQuarters}
                                  className="flex-1 xl:flex-none min-w-[110px]"
                                  buttonClassName="!bg-slate-700 !text-white !border-slate-600 !py-1.5"
                              />
                          )}
                      </>
                  )}
                  <CustomDropdown
                      value={year}
                      onChange={v => setYear(Number(v))}
                      options={availableYears.map(y => ({ value: y, label: String(y) }))}
                      className="flex-1 xl:flex-none min-w-[75px]"
                      buttonClassName="!bg-slate-700 !text-white !border-slate-600 !py-1.5"
                  />
              </div>
          </div>
      </div>

      {loading || loadingHistory ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : !isDataApproved && activeSubTab === 'overview' ? (
        <div className="h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 text-center p-6">
            <div className="bg-amber-50 p-5 rounded-full mb-5 text-amber-500"><ShieldAlert size={40} /></div>
            <h3 className="text-xl font-black text-slate-900">Data Pending Approval</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md">Analytics for this period are locked until the report is approved.</p>
        </div>
      ) : activeSubTab === 'overview' ? (
        
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

          {renderDataCompletenessBanner()}

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
              
              <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 truncate"><Activity size={12} className="shrink-0"/> <span className="hidden sm:inline">Current</span> Cases</p>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
                      <h3 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">{currentTotal}</h3>
                      <div className="flex flex-col items-start sm:items-end min-w-0">
                          {previousPeriodComparison.hasData ? (
                              <div className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-black truncate max-w-full ${previousPeriodComparison.diff > 0 ? 'bg-rose-50 text-rose-600' : (previousPeriodComparison.diff < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600')}`}>
                                  {previousPeriodComparison.display}
                              </div>
                          ) : (
                              <div className="text-[8px] sm:text-[10px] font-bold text-slate-400">—</div>
                          )}
                      </div>
                  </div>
              </div>
              
              <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 truncate"><Calendar size={12} className="shrink-0"/> YTD Total</p>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
                      <h3 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
                          {calculatedYTD}
                      </h3>
                      <div className="text-[8px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                          In {year}
                      </div>
                  </div>
              </div>

              <div className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 truncate"><User size={12} className="shrink-0"/> Completion</p>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
                      <h3 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">{complianceRate}%</h3>
                      <div className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold truncate ${complianceRate >= 80 ? 'bg-emerald-50 text-emerald-600' : complianceRate >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                          {complianceRate >= 80 ? 'OPTIMAL' : complianceRate >= 50 ? 'FAIR' : 'LOW'}
                      </div>
                  </div>
              </div>
          </div>

          {v2Data.length === 0 ? (
              reportStatus !== 'Draft' ? (
                  <div className="h-96 flex flex-col items-center justify-center bg-emerald-50 rounded-2xl border border-emerald-200 border-dashed text-center p-6 animate-in fade-in zoom-in-95 duration-500">
                      <div className="bg-emerald-100 p-5 rounded-full mb-4 text-emerald-600 shadow-sm">
                          <CheckCircle size={40} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-lg font-black text-emerald-900 tracking-tight">Zero Report Verified</h3>
                      <p className="text-sm text-emerald-700 mt-1 max-w-md leading-relaxed font-medium">
                          An official report was processed and approved for this period indicating zero (0) animal bite cases.
                      </p>
                  </div>
              ) : (
                  <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 border-dashed text-center p-6 animate-in fade-in duration-500">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 text-slate-400">
                          <PieChartIcon size={40} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                          Awaiting {periodType === 'Monthly' ? month : periodType === 'Quarterly' ? quarter : 'Yearly'} Data
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-md">
                          No approved reports have been encoded for this period yet. Visualizations will automatically generate once data is submitted.
                      </p>
                  </div>
              )
          ) : (
              <DemographicCharts 
                locationTitleBase={locationTitleBase} locationTotal={locationInfo.total} locationData={locationInfo.chartData} tableData={locationInfo.tableData}
                categoryTotal={categoryTotal} categoryData={categoryData} animalTotal={animalTotal} animalData={animalData}
                statusTotal={statusTotal} statusData={statusData}
                sexTotal={sexTotal} demographicsSexData={demographicsSexData} ageTotal={ageTotal} demographicsAgeData={demographicsAgeData}
                handleDownload={handleDownload} renderDynamicBarLabel={renderDynamicBarLabel} renderCustomizedLabel={renderCustomizedLabel}
                COLORS={COLORS} TOOLTIP_STYLE={TOOLTIP_STYLE}
              />
          )}

        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <SmartAlertsPanel riskLevel={riskLevel} smartAlerts={smartAlerts} projectedNextMonth={projectedNextMonth} modelMetrics={modelMetrics} />
            <PredictiveModel 
              year={year} full24MonthData={full24MonthData} handleDownload={handleDownload} showMathModal={showMathModal} setShowMathModal={setShowMathModal}
              OUTBREAK_SENSITIVITY={OUTBREAK_SENSITIVITY} TREND_SENSITIVITY={TREND_SENSITIVITY} TOOLTIP_STYLE={TOOLTIP_STYLE}
              projectedNextMonth={projectedNextMonth} riskLevel={riskLevel} modelMetrics={modelMetrics}
              currentTotal={annualTotal} 
            />
        </div>
      )}
    </div>
  );
}