import React, { useMemo, useState, useEffect } from 'react';
import { Loader2, ShieldAlert, PieChart as PieChartIcon, TrendingUp, TrendingDown, Calendar, User, BrainCircuit, Activity, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { QUARTERS, MONTHS } from '../../lib/constants';

import { useForecastingMetrics } from '../../hooks/useForecastingMetrics';
import DemographicCharts from './DemographicCharts';
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

const calcTotal = (rows) => rows.reduce((sum, r) => {
    if (!r.location_name || r.location_name.includes('Outside Catchment')) return sum;
    const n = (v) => Number(v) || 0;
    const cat2Tot = n(r.cat2_elig_pri) + n(r.cat2_elig_boost) + n(r.cat2_non_elig);
    const cat3Tot = n(r.cat3_elig_pri) + n(r.cat3_elig_boost) + n(r.cat3_non_elig);
    return sum + n(r.cat1) + cat2Tot + cat3Tot;
}, 0);

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
              let query = supabase.from('abtc_reports_v2').select('*').in('year', [year, year - 1]);
              if (isAdmin) query = query.eq('status', 'Approved');
              else query = query.eq('facility', user?.facility);

              const { data, error } = await query;
              if (error) throw error;
              
              setV2AllYearData(data || []);
              
              let targetMonths = [];
              if (periodType === 'Monthly') targetMonths = [month];
              else if (periodType === 'Quarterly') {
                  const qIdx = QUARTERS.indexOf(quarter);
                  targetMonths = [MONTHS[qIdx*3], MONTHS[qIdx*3+1], MONTHS[qIdx*3+2]];
              } else {
                  targetMonths = MONTHS;
              }

              const currentPeriodData = (data || []).filter(d => d.year === year && targetMonths.includes(d.month));
              setV2Data(currentPeriodData);
              
              if (currentPeriodData && currentPeriodData.length > 0) {
                  setReportStatus(isAdmin ? 'Approved' : currentPeriodData[0].status || 'Draft');
              } else {
                  setReportStatus('Draft'); 
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
        const num = (v) => Number(v) || 0;
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
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
            if (a.name === 'Non-Abra') return 1;
            if (b.name === 'Non-Abra') return -1;
            return a.name.localeCompare(b.name);
        });

    const table = Object.entries(tableMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
            if (a.name === 'Non-Abra') return 1;
            if (b.name === 'Non-Abra') return -1;
            return b.value - a.value; 
        });
    
    return { chartData: chart, tableData: table, total };
  }, [v2Data, isAdmin, facilityType, dbMunicipalities, user]);

  const currentTotal = locationInfo.total;

  const calculatedYTD = useMemo(() => {
      let ytdMonths = MONTHS;
      if (periodType === 'Monthly') ytdMonths = MONTHS.slice(0, MONTHS.indexOf(month) + 1);
      else if (periodType === 'Quarterly') ytdMonths = MONTHS.slice(0, (QUARTERS.indexOf(quarter) * 3) + 3);
      
      const rows = v2AllYearData.filter(d => d.year === year && ytdMonths.includes(d.month));
      return calcTotal(rows);
  }, [periodType, v2AllYearData, month, quarter, year]);

  // --- NEW: Annual Total exclusively for Predictive Model ---
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
          if (r.location_name.includes('Outside Catchment')) return;
          const n = (v) => Number(v) || 0;
          sums.male += n(r.male); sums.female += n(r.female);
          sums.ageLt15 += n(r.age_under_15); sums.ageGt15 += n(r.age_over_15);
          sums.cat1 += n(r.cat1);
          sums.cat2 += n(r.cat2_elig_pri) + n(r.cat2_elig_boost) + n(r.cat2_non_elig);
          sums.cat3 += n(r.cat3_elig_pri) + n(r.cat3_elig_boost) + n(r.cat3_non_elig);
          sums.dog += n(r.type_dog); sums.cat += n(r.type_cat); sums.others += n(r.type_others);
          sums.pet += n(r.status_pet); sums.stray += n(r.status_stray); sums.unk += n(r.status_unk);
      });
      return sums;
  }, [v2Data]);

  const demographicsSexData = useMemo(() => [{ name: 'Male', value: safeTotals.male }, { name: 'Female', value: safeTotals.female }], [safeTotals]);
  const demographicsAgeData = useMemo(() => [{ name: '< 15 Yrs', value: safeTotals.ageLt15 }, { name: '> 15 Yrs', value: safeTotals.ageGt15 }], [safeTotals]);
  const categoryData = useMemo(() => [
    { name: 'Cat I', value: safeTotals.cat1, fill: COLORS.cat1 },
    { name: 'Cat II', value: safeTotals.cat2, fill: COLORS.cat2 },
    { name: 'Cat III', value: safeTotals.cat3, fill: COLORS.cat3 }
  ], [safeTotals]);
  
  const animalData = useMemo(() => {
    const res = [];
    if (safeTotals.dog > 0) res.push({ name: 'Dog', value: safeTotals.dog, fill: COLORS.dog });
    if (safeTotals.cat > 0) res.push({ name: 'Cat', value: safeTotals.cat, fill: COLORS.cat });
    if (safeTotals.others > 0) res.push({ name: 'Others', value: safeTotals.others, fill: COLORS.other });
    return res.sort((a, b) => b.value - a.value);
  }, [safeTotals]);

  const statusData = useMemo(() => {
    const res = [];
    if (safeTotals.pet > 0) res.push({ name: 'Pet', value: safeTotals.pet, fill: COLORS.pet });
    if (safeTotals.stray > 0) res.push({ name: 'Stray', value: safeTotals.stray, fill: COLORS.stray });
    if (safeTotals.unk > 0) res.push({ name: 'Unknown', value: safeTotals.unk, fill: COLORS.unk });
    return res.sort((a, b) => b.value - a.value);
  }, [safeTotals]);

  const categoryTotal = useMemo(() => categoryData.reduce((sum, item) => sum + item.value, 0), [categoryData]);
  const sexTotal = useMemo(() => demographicsSexData.reduce((sum, item) => sum + item.value, 0), [demographicsSexData]);
  const ageTotal = useMemo(() => demographicsAgeData.reduce((sum, item) => sum + item.value, 0), [demographicsAgeData]);
  const animalTotal = useMemo(() => animalData.reduce((sum, item) => sum + item.value, 0), [animalData]);
  const statusTotal = useMemo(() => statusData.reduce((sum, item) => sum + item.value, 0), [statusData]);

  const handleDownload = async (id, name) => {
    const el = document.getElementById(id);
    if (!el) return;
    const url = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', filter: (node) => node.tagName !== 'BUTTON' });
    const link = document.createElement('a'); link.download = name; link.href = url; link.click();
  };

  const isDataApproved = isAdmin || (periodType === 'Monthly' ? reportStatus === 'Approved' : v2Data.length > 0);

  const renderDataCompletenessBanner = () => {
    if (v2Data.length === 0) return null; 
    const isComplete = isAdmin ? complianceRate === 100 : reportStatus === 'Approved';
    return (
      <div className={`mb-6 p-4 rounded-xl border flex items-start sm:items-center gap-3 shadow-sm ${isComplete ? 'bg-emerald-50/80 border-emerald-200/60' : 'bg-amber-50/80 border-amber-200/60'}`}>
        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 sm:mt-0 ${isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
             {isComplete ? <CheckCircle size={18} strokeWidth={2.5}/> : <ShieldAlert size={18} strokeWidth={2.5}/>}
        </div>
        <div className="flex flex-col">
          <h4 className={`text-sm font-bold ${isComplete ? 'text-emerald-900' : 'text-amber-900'}`}>{isComplete ? 'Complete Verified Data' : 'Incomplete Data Warning'}</h4>
          <p className={`text-xs font-medium mt-0.5 ${isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isAdmin 
              ? (isComplete ? 'All authorized facilities have submitted approved reports for this period.' : `Only ${complianceRate}% of facilities have submitted approved reports.`)
              : (isComplete ? 'Your facility report has been approved and verified for this period.' : 'Your facility report is still pending or in draft.')
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12 w-full px-2 sm:px-4">
      
      <div className="bg-slate-900 rounded-2xl p-6 mb-4 shadow-xl flex flex-col xl:flex-row xl:items-end justify-between gap-6 border border-slate-800 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
          <div className="flex items-start gap-4 relative z-10">
              <div className="bg-slate-800 p-4 rounded-2xl shadow-inner border border-slate-700 text-yellow-400">
                  <PieChartIcon size={28} strokeWidth={2.5}/>
              </div>
              <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{isAdmin ? "Provincial" : "Facility"} Analytics</h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">Review performance and forecast future volume</p>
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

              <div className="flex flex-wrap items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shadow-inner w-full xl:w-auto">
                  {activeSubTab === 'overview' && (
                      <>
                          <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="flex-1 xl:flex-none bg-slate-700 text-xs font-bold text-white py-2 px-3 outline-none cursor-pointer rounded-lg border border-slate-600">
                              <option value="Monthly" className="bg-slate-800 text-white">Monthly</option>
                              <option value="Quarterly" className="bg-slate-800 text-white">Quarterly</option>
                              <option value="Annual" className="bg-slate-800 text-white">Annual</option>
                          </select>
                          
                          {periodType === 'Monthly' && (
                              <>
                                  <div className="w-px h-5 bg-slate-600 mx-1 hidden sm:block"></div>
                                  <select value={month} onChange={(e) => setMonth(e.target.value)} className="flex-1 xl:flex-none bg-transparent text-xs font-bold text-slate-300 py-2 px-2 outline-none cursor-pointer hover:text-white">
                                      {availableMonths.map(m => <option key={m} value={m} className="bg-slate-800 text-white">{m}</option>)}
                                  </select>
                              </>
                          )}

                          {periodType === 'Quarterly' && (
                              <>
                                  <div className="w-px h-5 bg-slate-600 mx-1 hidden sm:block"></div>
                                  <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="flex-1 xl:flex-none bg-transparent text-xs font-bold text-slate-300 py-2 px-2 outline-none cursor-pointer hover:text-white">
                                      {availableQuarters.map(q => <option key={q} value={q} className="bg-slate-800 text-white">{q}</option>)}
                                  </select>
                              </>
                          )}
                          <div className="w-px h-5 bg-slate-600 mx-1 hidden sm:block"></div>
                      </>
                  )}
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={`${activeSubTab === 'predictive' ? 'bg-slate-700 rounded-lg px-4' : 'bg-transparent px-2'} flex-1 xl:flex-none text-xs font-bold text-white py-2 outline-none cursor-pointer hover:text-white`}>
                      {availableYears.map(y => <option key={y} value={y} className="bg-slate-800 text-white">{y}</option>)}
                  </select>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Activity size={12}/> Current Period Cases</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-slate-900">{currentTotal}</h3>
                      
                      <div className="flex flex-col items-end gap-1 min-w-[130px]">
                          <div className="flex items-center justify-end w-full">
                              {previousPeriodComparison.hasData ? (
                                  <>
                                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-black min-w-[40px] text-center flex items-center justify-center gap-1 ${previousPeriodComparison.diff > 0 ? 'bg-rose-50 text-rose-600' : (previousPeriodComparison.diff < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600')}`}>
                                          {previousPeriodComparison.diff > 0 ? <TrendingUp size={10} strokeWidth={3}/> : (previousPeriodComparison.diff < 0 ? <TrendingDown size={10} strokeWidth={3}/> : null)}
                                          {previousPeriodComparison.display}
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap min-w-[90px] ml-2">
                                          {previousPeriodComparison.label}
                                      </span>
                                  </>
                              ) : (
                                  <>
                                      <div className="px-2 py-0.5 rounded-md text-[10px] font-black min-w-[40px] text-center bg-slate-50 text-slate-400">—</div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap min-w-[90px] ml-2">
                                          {previousPeriodComparison.label}
                                      </span>
                                  </>
                              )}
                          </div>

                          {samePeriodLastYear && (
                              <div className="flex items-center justify-end w-full mt-1">
                                  {samePeriodLastYear.hasData ? (
                                      <>
                                          <div className={`px-2 py-0.5 rounded-md text-[10px] font-black min-w-[40px] text-center flex items-center justify-center gap-1 ${samePeriodLastYear.diff > 0 ? 'bg-rose-50 text-rose-600' : (samePeriodLastYear.diff < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600')}`}>
                                              {samePeriodLastYear.diff > 0 ? <TrendingUp size={10} strokeWidth={3}/> : (samePeriodLastYear.diff < 0 ? <TrendingDown size={10} strokeWidth={3}/> : null)}
                                              {samePeriodLastYear.display}
                                          </div>
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap min-w-[90px] ml-2">
                                              {samePeriodLastYear.label}
                                          </span>
                                      </>
                                  ) : (
                                      <>
                                          <div className="px-2 py-0.5 rounded-md text-[10px] font-black min-w-[40px] text-center bg-slate-50 text-slate-400">—</div>
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap min-w-[90px] ml-2">
                                              {samePeriodLastYear.label}
                                          </span>
                                      </>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={12}/> {periodType === 'Annual' ? 'YTD TOTAL' : 'YTD Total'}</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-slate-900">
                          {calculatedYTD}
                      </h3>
                      <div className="flex flex-col items-end">
                          <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                              Cumulative in {year}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User size={12}/> Average Completion</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-slate-900">{complianceRate}%</h3>
                      <div className="flex flex-col items-end">
                          <div className={`${complianceRate >= 80 ? 'bg-emerald-50 text-emerald-600' : complianceRate >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'} px-2 py-1 rounded-lg text-[10px] font-bold`}>
                              {complianceRate >= 80 ? 'OPTIMAL' : complianceRate >= 50 ? 'FAIR' : 'LOW'}
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">APPROVED REPORTS</span>
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