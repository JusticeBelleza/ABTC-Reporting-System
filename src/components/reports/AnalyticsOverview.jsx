import React, { useMemo, useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList,
  Line, ComposedChart 
} from 'recharts';
import { 
  Loader2, Download, ShieldAlert, PieChart as PieChartIcon, 
  TrendingUp, TrendingDown, Info, Calendar, User, Activity, BrainCircuit, AlertTriangle, CheckCircle2, Zap, ActivitySquare
} from 'lucide-react';
import { toPng } from 'html-to-image'; 
import { useApp } from '../../context/AppContext';
import { useReportData } from '../../hooks/useReportData';
import { supabase } from '../../lib/supabase';
import { QUARTERS, MONTHS, MUNICIPALITIES } from '../../lib/constants';

// --- STYLING CONSTANTS ---
const COLORS = {
  male: '#3B82F6', female: '#F43F5E',
  ageLt15: '#10B981', ageGt15: '#F59E0B',
  cat1: '#14B8A6', cat2: '#F59E0B', cat3: '#EF4444',
  dog: '#6366F1', cat: '#8B5CF6', other: '#64748B'
};

const TOOLTIP_STYLE = {
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  padding: '12px 16px',
  fontWeight: '700',
  color: '#0F172A',
  backgroundColor: 'rgba(255, 255, 255, 0.98)'
};

// --- HELPER COMPONENTS & FUNCTIONS ---
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

export default function AnalyticsOverview({ 
  periodType, setPeriodType, year, setYear, month, setMonth, 
  quarter, setQuarter, availableYears, availableMonths 
}) {
  const { user, facilities, facilityBarangays, facilityDetails } = useApp();
  const isAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';

  // --- DYNAMIC LOCATION TITLE ---
  const facilityType = facilityDetails?.[user?.facility]?.type || 'RHU';
  const locationTitleBase = isAdmin 
    ? "Cases by Municipality" 
    : (facilityType === 'Hospital' || facilityType === 'Clinic' ? "Cases by Municipality" : "Cases by Barangay");

  // --- TAB STATE ---
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // --- ANALYTICS STATE ---
  const [historicalData, setHistoricalData] = useState([]);
  const [full24MonthData, setFull24MonthData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState([]);
  const [complianceRate, setComplianceRate] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [projectedNextMonth, setProjectedNextMonth] = useState(null);

  const currentDate = useMemo(() => new Date(), []);
  const currentRealYear = currentDate.getFullYear();
  const currentQuarterIndex = Math.floor(currentDate.getMonth() / 3);
  
  const availableQuarters = useMemo(() => {
    if (year === currentRealYear) return QUARTERS.slice(0, currentQuarterIndex + 1);
    return QUARTERS;
  }, [year, currentRealYear, currentQuarterIndex]);

  const { data, grandTotals, loading, reportStatus } = useReportData({
    user, facilities, facilityBarangays, year, month, quarter, periodType,
    activeTab: 'main', cohortSubTab: 'cat2', 
    adminViewMode: isAdmin ? 'consolidated' : 'dashboard', 
    selectedFacility: null
  });

  const currentTotal = (grandTotals?.cat1 || 0) + (grandTotals?.cat2 || 0) + (grandTotals?.cat3 || 0);

  // ==========================================
  // EFFECT: FETCH COMPARATIVE, SMART DATA, & FORECAST
  // ==========================================
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const query = supabase.from('abtc_reports').select('*').eq('status', 'Approved');
        if (!isAdmin) query.eq('facility', user?.facility);
        const { data: reports, error } = await query;

        if (error) throw error;

        if (reports) {
          // --- 1. COMPLIANCE RATE CALCULATION ---
          const targetFacilitiesCount = isAdmin ? facilities.length : 1;
          let expectedReports = 0; let actualReports = 0;

          if (periodType === 'Monthly') {
              expectedReports = targetFacilitiesCount;
              actualReports = new Set(reports.filter(r => Number(r.year) === year && r.month === month).map(r => r.facility)).size;
          } else if (periodType === 'Quarterly') {
              const qIdx = QUARTERS.indexOf(quarter);
              const targetMonths = [MONTHS[qIdx*3], MONTHS[qIdx*3+1], MONTHS[qIdx*3+2]];
              const passedMonthsInQuarter = targetMonths.filter(m => (year < currentRealYear) || MONTHS.indexOf(m) <= currentDate.getMonth());
              expectedReports = targetFacilitiesCount * passedMonthsInQuarter.length;
              actualReports = reports.filter(r => Number(r.year) === year && passedMonthsInQuarter.includes(r.month)).length;
          } else {
              const passedMonths = year === currentRealYear ? currentDate.getMonth() + 1 : 12;
              expectedReports = targetFacilitiesCount * passedMonths;
              actualReports = reports.filter(r => Number(r.year) === year).length;
          }

          let calcRate = expectedReports > 0 ? Math.round((actualReports / expectedReports) * 100) : 0;
          setComplianceRate(Math.min(calcRate, 100));

          // --- 2. BUILD CONTINUOUS 24-MONTH ARRAY (100% SECURE MATH) ---
          const allMonthsRaw = [];
          [year - 1, year].forEach(y => {
             MONTHS.forEach((m) => {
                const periodReports = reports.filter(r => Number(r.year) === y && r.month === m);
                const hasData = periodReports.length > 0;
                let total = null; 
                
                if (hasData) {
                    // Prevent duplicate submission rows from artificially inflating the total
                    const uniqueReports = [];
                    periodReports.forEach(r => {
                        const existingIdx = uniqueReports.findIndex(ex => ex.facility === r.facility && ex.municipality === r.municipality);
                        if (existingIdx === -1) {
                            uniqueReports.push(r);
                        } else if (new Date(r.created_at) > new Date(uniqueReports[existingIdx].created_at)) {
                            uniqueReports[existingIdx] = r;
                        }
                    });

                    total = uniqueReports.reduce((sum, r) => {
                        const fName = String(r.facility || '').trim();
                        const muniStr = String(r.municipality || '').trim();
                        const type = facilityDetails?.[fName]?.type || 'RHU';
                        const isHospital = type === 'Hospital' || type === 'Clinic';
                        
                        // SKIP dummy separator and total rows
                        if (muniStr.toLowerCase().includes('total')) return sum;
                        
                        // MATHEMATICAL GUARDRAIL: Prevent double-counting for RHUs!
                        // The database saves BOTH the individual barangays AND the rolled-up host municipality.
                        // We strictly sum ONLY official Municipalities and 'Others:'. This mathematically skips all Barangays.
                        const isMuniOrOthers = muniStr === 'Others:' || MUNICIPALITIES.some(mun => mun.toLowerCase() === muniStr.toLowerCase());
                        if (!isHospital && !isMuniOrOthers) return sum;

                        let rTotal = (Number(r.cat1) || 0) + (Number(r.cat2) || 0) + (Number(r.cat3) || 0);
                        if (rTotal === 0) rTotal = Number(r.total_patients) || 0;
                        if (rTotal === 0) rTotal = (Number(r.male) || 0) + (Number(r.female) || 0);

                        return sum + rTotal;
                    }, 0);
                }
                allMonthsRaw.push({ year: y, month: m, raw: total, display: `${m.substring(0,3)} ${y}` });
             });
          });

          // --- 3. ADAPTIVE SMA AND WMA CALCULATIONS ---
          const processed24Months = allMonthsRaw.map((item, idx, arr) => {
              const getAdaptiveWindow = (size) => {
                  const startIdx = Math.max(0, idx - size + 1);
                  const window = arr.slice(startIdx, idx + 1).map(x => x.raw).filter(x => x !== null);
                  return window.length > 0 ? window : null;
              };

              const win3 = getAdaptiveWindow(3);
              const sma3 = win3 ? Math.round(win3.reduce((a, b) => a + b, 0) / win3.length) : null;
              
              const win6 = getAdaptiveWindow(6);
              const sma6 = win6 ? Math.round(win6.reduce((a, b) => a + b, 0) / win6.length) : null;

              const win12 = getAdaptiveWindow(12);
              const sma12 = win12 ? Math.round(win12.reduce((a, b) => a + b, 0) / win12.length) : null;

              let wma3 = null;
              if (win3) {
                  if (win3.length === 3) wma3 = Math.round(((win3[0] * 1) + (win3[1] * 2) + (win3[2] * 3)) / 6);
                  else if (win3.length === 2) wma3 = Math.round(((win3[0] * 1) + (win3[1] * 2)) / 3);
                  else if (win3.length === 1) wma3 = win3[0];
              }

              return { ...item, sma3, wma3, sma6, sma12, forecast: null }; 
          });

          // --- 4. TRUE FORECASTING LOGIC ---
          const lastValidIdx = processed24Months.findLastIndex(d => d.raw !== null);
          let predictedVal = null;
          
          if (lastValidIdx !== -1) {
              const lastValid = processed24Months[lastValidIdx];
              predictedVal = lastValid.wma3 || lastValid.sma3 || lastValid.raw;
              setProjectedNextMonth(predictedVal);

              processed24Months[lastValidIdx].forecast = lastValid.raw;

              if (lastValidIdx + 1 < processed24Months.length) {
                  processed24Months[lastValidIdx + 1].forecast = predictedVal;
              } else {
                  processed24Months.push({
                      year: year + 1, month: 'January', display: `Jan ${year + 1}`,
                      raw: null, forecast: predictedVal
                  });
              }
          }
          setFull24MonthData(processed24Months);

          // --- 5. FORMAT STRICTLY FOR OVERVIEW TAB ---
          const trendMatrix = MONTHS.map((m) => {
             const curIdx = processed24Months.findIndex(x => x.month === m && x.year === year);
             const curMonthData = processed24Months[curIdx];
             const prevMonthData = processed24Months[curIdx - 12];
             return { month: m.substring(0, 3), current: curMonthData?.raw, previous: prevMonthData?.raw };
          });
          setHistoricalData(trendMatrix);

          // --- 6. SMART ALERTS & ANOMALY DETECTION (%) ---
          const validData = processed24Months.filter(d => d.raw !== null);
          const latest = validData[validData.length - 1];
          const previous = validData[validData.length - 2];
          
          let alerts = [];
          let currentRisk = 'LOW';

          if (latest && latest.wma3 && latest.sma3) {
              let diffPercent = 0;
              if (latest.sma3 > 0) diffPercent = ((latest.wma3 - latest.sma3) / latest.sma3) * 100;

              if (latest.raw && latest.sma6 && latest.raw > (latest.sma6 * 1.5)) {
                  alerts.push({ type: 'critical', title: 'Outbreak Anomaly Detected', desc: `Current case volume is over 50% higher than the 6-month baseline. Immediate review recommended.` });
                  currentRisk = 'HIGH';
              }

              if (diffPercent > 10) {
                  alerts.push({ type: 'warning', title: 'Rising Trend Signal', desc: `Short-term projected cases are accelerating (${diffPercent.toFixed(1)}% above average).` });
                  if (currentRisk !== 'HIGH') currentRisk = 'MODERATE';
              } else if (diffPercent < -10) {
                  alerts.push({ type: 'success', title: 'Decreasing Trend', desc: `Cases are dropping (${Math.abs(diffPercent).toFixed(1)}% below average).` });
              } else {
                  alerts.push({ type: 'info', title: 'Stable Volume', desc: 'Short-term and mid-term averages are closely aligned (< 10% variance).' });
              }

              if (diffPercent > 0 && previous?.sma6 && latest.sma6 > previous.sma6 && currentRisk !== 'HIGH') {
                  alerts.push({ type: 'critical', title: 'Sustained Risk', desc: 'Both fast-signal (WMA) and mid-term (6M) trends are actively rising.' });
                  currentRisk = 'HIGH';
              }
          }
          setSmartAlerts(alerts);
          setRiskLevel(currentRisk);
        }
      } catch (err) { console.error("Analytics Error:", err); }
      finally { setLoadingHistory(false); }
    };
    fetchHistory();
  }, [year, month, quarter, periodType, facilities.length, user, isAdmin, currentDate, currentRealYear]);

  // --- ADAPTIVE DELTA (YoY fallback to MoM/QoQ) ---
  const comparisonData = useMemo(() => {
    let prevTotal = 0;
    let label = `vs Last ${periodType === 'Monthly' ? 'Month' : 'Year'}`;
    let isLimited = false;

    if (historicalData.length === 0) return { delta: 0, label, isLimited: true };

    if (periodType === 'Monthly') {
        const mIdx = MONTHS.indexOf(month);
        const currentData = historicalData[mIdx];
        if (currentData?.previous !== null && currentData?.previous > 0) {
            prevTotal = currentData.previous; label = `vs ${month} ${year - 1}`;
        } else if (mIdx > 0 && historicalData[mIdx - 1]?.current !== null) {
            prevTotal = historicalData[mIdx - 1].current; label = `vs Last Month`; isLimited = true;
        }
    } else if (periodType === 'Quarterly') {
        const qIdx = QUARTERS.indexOf(quarter);
        const targetMonths = [MONTHS[qIdx*3], MONTHS[qIdx*3+1], MONTHS[qIdx*3+2]].map(m => m.substring(0,3));
        const prevQTotal = historicalData.filter(d => targetMonths.includes(d.month)).reduce((sum, d) => sum + (d.previous || 0), 0);
        if (prevQTotal > 0) { prevTotal = prevQTotal; label = `vs ${quarter} ${year - 1}`; } 
        else { isLimited = true; label = "Insufficient History"; }
    } else {
        const prevYearTotal = historicalData.reduce((sum, d) => sum + (d.previous || 0), 0);
        if (prevYearTotal > 0) { prevTotal = prevYearTotal; label = `vs ${year - 1}`; } 
        else { isLimited = true; label = "Insufficient History"; }
    }

    let delta = 0;
    if (prevTotal > 0) delta = ((currentTotal - prevTotal) / prevTotal) * 100;
    else if (currentTotal > 0 && prevTotal === 0 && !isLimited) delta = 100;

    return { delta, label, isLimited };
  }, [historicalData, periodType, month, quarter, year, currentTotal]);

  // --- EXISTING CHART DATA PREP (Wrapped in useMemo) ---
  const demographicsSexData = useMemo(() => [{ name: 'Male', value: grandTotals?.male || 0 }, { name: 'Female', value: grandTotals?.female || 0 }], [grandTotals]);
  const demographicsAgeData = useMemo(() => [{ name: '< 15 Yrs', value: grandTotals?.ageLt15 || 0 }, { name: '> 15 Yrs', value: grandTotals?.ageGt15 || 0 }], [grandTotals]);
  const categoryData = useMemo(() => [
    { name: 'Cat I', value: grandTotals?.cat1 || 0, fill: COLORS.cat1 },
    { name: 'Cat II', value: grandTotals?.cat2 || 0, fill: COLORS.cat2 },
    { name: 'Cat III', value: grandTotals?.cat3 || 0, fill: COLORS.cat3 }
  ], [grandTotals]);

  // --- RHU BARANGAY NAME CLEANUP ---
  const isConsolidatedView = !isAdmin && facilityType !== 'Hospital' && facilityType !== 'Clinic' ? false : true;
  
  const locationData = useMemo(() => {
    if (!data) return [];
    
    const hostMuni = MUNICIPALITIES.find(m => user?.facility?.toLowerCase().includes(m.toLowerCase()));

    return Object.entries(data)
      .filter(([name, row]) => {
          const lower = name.toLowerCase().trim();
          // Filter out aggregate rows ONLY
          // IMPORTANT: We do NOT filter out 'others:', so they remain visible on the chart!
          if (lower === 'total' || lower.includes('grand total')) return false;
          
          // IF RHU: We MUST hide the Host Municipality's rolled-up row so the chart doesn't double count.
          if (!isConsolidatedView && hostMuni) {
              if (lower === hostMuni.toLowerCase()) return false;
          }
          
          return (Number(row.totalPatients) || ((Number(row.cat1)||0)+(Number(row.cat2)||0)+(Number(row.cat3)||0))) > 0;
      })
      .map(([name, row]) => {
          let cleanName = name.trim();
          let val = Number(row.totalPatients) || ((Number(row.cat1)||0)+(Number(row.cat2)||0)+(Number(row.cat3)||0));
          
          // SMART CLEANUP: Strip out the Host Municipality name from barangay labels for cleaner UI
          if (!isConsolidatedView && hostMuni) {
              const regex = new RegExp(`\\b${hostMuni}\\b`, 'ig');
              let stripped = cleanName.replace(regex, '').replace(/^[-\s,]+|[-\s,]+$/g, '').trim();
              
              if (stripped !== '') cleanName = stripped;
          }
          return { name: cleanName, value: val };
      })
      .reduce((acc, curr) => {
          const existing = acc.find(item => item.name === curr.name);
          if (existing) existing.value += curr.value;
          else acc.push(curr);
          return acc;
      }, [])
      .sort((a, b) => b.value - a.value);
  }, [data, isConsolidatedView, facilityType, user]);

  // --- CHART TOTALS FOR (N=X) TITLES ---
  const locationTotal = useMemo(() => locationData.reduce((sum, item) => sum + item.value, 0), [locationData]);
  const categoryTotal = useMemo(() => categoryData.reduce((sum, item) => sum + item.value, 0), [categoryData]);
  const sexTotal = useMemo(() => demographicsSexData.reduce((sum, item) => sum + item.value, 0), [demographicsSexData]);
  const ageTotal = useMemo(() => demographicsAgeData.reduce((sum, item) => sum + item.value, 0), [demographicsAgeData]);

  const handleDownload = async (id, name) => {
    const el = document.getElementById(id);
    if (!el) return;
    const url = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', filter: (node) => node.tagName !== 'BUTTON' });
    const link = document.createElement('a'); link.download = name; link.href = url; link.click();
  };

  const hasAnyData = full24MonthData.some(d => d.year === year && d.raw !== null);
  const isDataApproved = isAdmin || (periodType === 'Monthly' ? reportStatus === 'Approved' : hasAnyData);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12 w-full px-2 sm:px-4">
      
      {/* --- DASHBOARD HEADER --- */}
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
              {/* SUB-TABS */}
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-full xl:w-auto shrink-0">
                  <button onClick={() => setActiveSubTab('overview')} className={`flex-1 xl:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${activeSubTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                      Overview
                  </button>
                  <button onClick={() => setActiveSubTab('predictive')} className={`flex-1 xl:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'predictive' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                      <BrainCircuit size={14}/> Predictive
                  </button>
              </div>

              {/* DROPDOWNS */}
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
                  {/* YEAR DROPDOWN ALWAYS VISIBLE */}
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
        
        // ==========================================
        // TAB 1: CORE ANALYTICS OVERVIEW
        // ==========================================
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {comparisonData.isLimited && (
             <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm">
                <Info size={16} className="shrink-0"/>
                Comparison is based on limited historical data. Adapting to closest available previous period.
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Activity size={12}/> Current Period Cases</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-slate-900">{currentTotal}</h3>
                      <div className={`flex flex-col items-end`}>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${comparisonData.delta >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {comparisonData.delta >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                              {Math.abs(comparisonData.delta).toFixed(1)}%
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{comparisonData.label}</span>
                      </div>
                  </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={12}/> YTD Total</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-slate-900">
                          {historicalData.reduce((sum, d) => sum + (d.current || 0), 0)}
                      </h3>
                      <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold">CASES IN {year}</div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Location Volume */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow flex flex-col" id="chart-location">
                  <div className="flex justify-between items-start mb-6 shrink-0">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                         {locationTitleBase} <span className="text-blue-600 font-normal normal-case tracking-normal ml-1">(N={locationTotal})</span>
                     </h3>
                     <button onClick={() => handleDownload('chart-location', `Locations.png`)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Download size={16}/></button>
                  </div>
                  <div className="h-[280px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={locationData} margin={{ top: 10, right: 10, left: -20, bottom: 85 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey="name" angle={-90} textAnchor="end" dy={5} tick={{fontSize: 10, fill: '#475569', letterSpacing: '0.05em'}} interval={0} />
                              <YAxis tick={{fontSize: 10}} />
                              <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                  <LabelList dataKey="value" content={renderDynamicBarLabel} />
                              </Bar>
                          </RechartsBarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Exposure Category */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow" id="chart-cat">
                  <div className="flex justify-between items-start mb-6">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                         Exposure Category <span className="text-blue-600 font-normal normal-case tracking-normal ml-1">(N={categoryTotal})</span>
                     </h3>
                     <button onClick={() => handleDownload('chart-cat', `Categories.png`)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Download size={16}/></button>
                  </div>
                  <div className="h-[280px] mt-2">
                      <ResponsiveContainer>
                          <RechartsBarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 700}} />
                              <YAxis tick={{fontSize: 10}} />
                              <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={100}>
                                  {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                  <LabelList dataKey="value" content={renderDynamicBarLabel} />
                              </Bar>
                          </RechartsBarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              
              {/* Demographics Sex */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow" id="chart-sex">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                          Patient Sex <span className="text-blue-600 font-normal normal-case tracking-normal ml-1">(N={sexTotal})</span>
                      </h3>
                      <button onClick={() => handleDownload('chart-sex', `Patient_Sex.png`)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Download size={16}/></button>
                  </div>
                  <div className="h-56">
                      <ResponsiveContainer>
                          <PieChart>
                              <Pie data={demographicsSexData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={renderCustomizedLabel} labelLine={false} isAnimationActive={false}>
                                  <Cell fill={COLORS.male} /><Cell fill={COLORS.female} />
                              </Pie>
                              <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                              <Legend verticalAlign="bottom" />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              
              {/* Demographics Age */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow" id="chart-age">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                          Patient Age <span className="text-blue-600 font-normal normal-case tracking-normal ml-1">(N={ageTotal})</span>
                      </h3>
                      <button onClick={() => handleDownload('chart-age', `Patient_Age.png`)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Download size={16}/></button>
                  </div>
                  <div className="h-56">
                      <ResponsiveContainer>
                          <RechartsBarChart layout="vertical" data={demographicsAgeData} margin={{ left: 20, right: 40 }}>
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="name" tick={{fontSize: 11, fontWeight: 700}} axisLine={false} />
                              <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                                  <Cell fill={COLORS.ageLt15} /><Cell fill={COLORS.ageGt15} />
                                  <LabelList dataKey="value" position="right" style={{fontWeight: 'bold', fontSize: '12px'}} />
                              </Bar>
                          </RechartsBarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
        </div>
      ) : (

        // ==========================================
        // TAB 2: PREDICTIVE ANALYTICS
        // ==========================================
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">

            {/* THEMED SMART ALERTS PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        <BrainCircuit size={200} className="text-slate-900"/>
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> System Insights & Alerts</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border ${riskLevel === 'HIGH' ? 'bg-red-50 text-red-600 border-red-200' : riskLevel === 'MODERATE' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                            RISK LEVEL: {riskLevel}
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {smartAlerts.length > 0 ? smartAlerts.map((alert, i) => (
                            <div key={i} className={`p-4 rounded-xl flex items-start gap-3 border ${
                                alert.type === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                                alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                {alert.type === 'critical' ? <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18}/> :
                                 alert.type === 'warning' ? <TrendingUp className="text-amber-500 mt-0.5 shrink-0" size={18}/> :
                                 alert.type === 'success' ? <TrendingDown className="text-emerald-500 mt-0.5 shrink-0" size={18}/> :
                                 <CheckCircle2 className="text-blue-500 mt-0.5 shrink-0" size={18}/>}
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{alert.title}</h4>
                                    <p className="text-xs opacity-90 mt-1">{alert.desc}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
                                Analyzing data trends. Need at least 2 consecutive months of records to generate reliable insights.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center flex items-center justify-center gap-1"><ActivitySquare size={12}/> Projected Next Month</p>
                    <div className="text-center">
                        <h3 className="text-5xl font-black text-slate-900 mb-1">
                            {projectedNextMonth || '--'}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg inline-block mt-2">Based on Active Trend</p>
                    </div>
                </div>
            </div>

            {/* PREDICTIVE CHART */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group" id="chart-predictive">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={18} className="text-blue-600"/> 24-Month Forecasting Model</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Multi-layered moving averages (Adaptive) for short-term reaction and long-term seasonality.</p>
                    </div>
                    <button onClick={() => handleDownload('chart-predictive', `Predictive_${year}.png`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Download size={18}/></button>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer>
                        <ComposedChart data={full24MonthData.slice(-13)} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="display" tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                            <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px', fontSize: '11px', fontWeight: 'bold', color: '#1E293B'}} />
                            
                            {/* Actual Data */}
                            <Bar dataKey="raw" name="Actual Cases" fill="#3B82F6" radius={[4,4,0,0]} barSize={20} isAnimationActive={false} />
                            
                            {/* SMA 12 - Seasonality (Jet Black) */}
                            <Line type="monotone" dataKey="sma12" name="12M SMA (Seasonality)" stroke="#000000" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} connectNulls={true} />
                            
                            {/* SMA 6 - Trend */}
                            <Line type="monotone" dataKey="sma6" name="6M SMA (Mid-Term)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                            
                            {/* SMA 3 - Smoothing */}
                            <Line type="monotone" dataKey="sma3" name="3M SMA (Short-Term)" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                            
                            {/* WMA 3 - Fast Signal */}
                            <Line type="monotone" dataKey="wma3" name="3M WMA (Fast Signal)" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} isAnimationActive={false} connectNulls={false} />

                            {/* TRUE FORECAST LINE (Dotted Red) */}
                            <Line type="monotone" dataKey="forecast" name="Forecast Projection" stroke="#EF4444" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#EF4444' }} isAnimationActive={false} connectNulls={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}