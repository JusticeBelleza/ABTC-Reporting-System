import React, { useMemo, useState } from 'react';
import { Loader2, ShieldAlert, PieChart as PieChartIcon, TrendingUp, TrendingDown, Info, Calendar, User, BrainCircuit, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useReportData } from '../../hooks/useReportData';
import { QUARTERS, MONTHS, MUNICIPALITIES } from '../../lib/constants';

import { useForecastingMetrics } from '../../hooks/useForecastingMetrics';
import DemographicCharts from './DemographicCharts';
import SmartAlertsPanel from './SmartAlertsPanel';
import PredictiveModel from './PredictiveModel';
import { toPng } from 'html-to-image'; 

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
  const { user, facilities, facilityBarangays, facilityDetails, globalSettings } = useApp();
  const isAdmin = user?.role === 'admin' || user?.role === 'SYSADMIN';

  const OUTBREAK_SENSITIVITY = 1 + ((globalSettings?.outbreak_threshold_percent ?? 50) / 100);
  const TREND_SENSITIVITY = globalSettings?.trend_alert_percent ?? 10; 

  const facilityType = facilityDetails?.[user?.facility]?.type || 'RHU';
  const locationTitleBase = isAdmin 
    ? "Cases by Municipality" 
    : (facilityType === 'Hospital' || facilityType === 'Clinic' ? "Cases by Municipality" : "Cases by Barangay");

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [showMathModal, setShowMathModal] = useState(false);

  const currentDate = useMemo(() => new Date(), []);
  const currentRealYear = currentDate.getFullYear();
  const currentQuarterIndex = Math.floor(currentDate.getMonth() / 3);
  
  const availableQuarters = useMemo(() => {
    if (year === currentRealYear) return QUARTERS.slice(0, currentQuarterIndex + 1);
    return QUARTERS;
  }, [year, currentRealYear, currentQuarterIndex]);

  const { data, loading, reportStatus } = useReportData({
    user, facilities, facilityBarangays, year, month, quarter, periodType,
    activeTab: 'main', cohortSubTab: 'cat2', 
    adminViewMode: isAdmin ? 'consolidated' : 'dashboard', 
    selectedFacility: null
  });

  const {
    historicalData, full24MonthData, loadingHistory, smartAlerts,
    complianceRate, riskLevel, projectedNextMonth, modelMetrics
  } = useForecastingMetrics({
    year, month, quarter, periodType, facilities, user, isAdmin,
    currentDate, currentRealYear, OUTBREAK_SENSITIVITY, TREND_SENSITIVITY,
    facilityDetails, globalSettings
  });

  // 1. HARDWIRE CURRENT TOTAL DIRECTLY TO THE BULLETPROOF CHART DATA
  const currentTotal = useMemo(() => {
      if (periodType === 'Monthly') {
          return full24MonthData.find(d => d.year === year && d.month === month)?.raw || 0;
      } else if (periodType === 'Quarterly') {
          const qIdx = QUARTERS.indexOf(quarter);
          const targetMonths = [MONTHS[qIdx*3], MONTHS[qIdx*3+1], MONTHS[qIdx*3+2]];
          return full24MonthData.filter(d => d.year === year && targetMonths.includes(d.month)).reduce((a, b) => a + (b.raw || 0), 0);
      } else {
          return full24MonthData.filter(d => d.year === year).reduce((a, b) => a + (b.raw || 0), 0);
      }
  }, [full24MonthData, periodType, year, month, quarter]);

  // 2. HARDWIRE YTD DIRECTLY TO THE BULLETPROOF CHART DATA
  const calculatedYTD = useMemo(() => {
      if (periodType === 'Annual') return currentTotal;
      let targetMonths = [];
      if (periodType === 'Monthly') {
          const idx = MONTHS.indexOf(month);
          targetMonths = MONTHS.slice(0, idx + 1);
      } else if (periodType === 'Quarterly') {
          const qIdx = QUARTERS.indexOf(quarter);
          targetMonths = MONTHS.slice(0, (qIdx * 3) + 3);
      }
      return full24MonthData.filter(d => d.year === year && targetMonths.includes(d.month)).reduce((sum, d) => sum + (d.raw || 0), 0);
  }, [periodType, currentTotal, full24MonthData, month, quarter, year]);

  // 3. SAFE COMPARISON WITH N/A FALLBACK
  const comparisonData = useMemo(() => {
      let prevTotal = 0;
      let label = `vs Last ${periodType === 'Monthly' ? 'Month' : periodType === 'Quarterly' ? 'Quarter' : 'Year'}`;
      let isValid = false;

      if (periodType === 'Monthly' && full24MonthData.length > 0) {
          const mIdx = MONTHS.indexOf(month);
          const prevMonth = mIdx === 0 ? MONTHS[11] : MONTHS[mIdx - 1];
          const prevYearTarget = mIdx === 0 ? year - 1 : year;
          
          const prevMonthData = full24MonthData.find(d => d.month === prevMonth && d.year === prevYearTarget);
          
          if (prevMonthData && prevMonthData.raw !== null && prevMonthData.raw > 0) {
              prevTotal = prevMonthData.raw;
              isValid = true;
          }
      }

      let delta = 0;
      if (isValid && prevTotal > 0) {
          delta = ((currentTotal - prevTotal) / prevTotal) * 100;
      }

      return { delta, label, isValid };
  }, [full24MonthData, periodType, month, year, currentTotal]);

  const isConsolidatedView = !isAdmin && facilityType !== 'Hospital' && facilityType !== 'Clinic' ? false : true;
  
  const locationInfo = useMemo(() => {
    if (!data) return { chartData: [], tableData: [], total: 0 };
    
    const hostMuni = MUNICIPALITIES.find(m => user?.facility?.toLowerCase().includes(m.toLowerCase()));
    const officialBarangays = facilityBarangays[user?.facility] || [];

    const chart = []; const table = []; let total = 0;

    Object.entries(data).forEach(([name, row]) => {
        const lower = name.toLowerCase().trim();
        if (lower === 'total' || lower.includes('grand total')) return;
        if (!isConsolidatedView && hostMuni && lower === hostMuni.toLowerCase()) return;
        
        const sex = (Number(row.male)||0) + (Number(row.female)||0);
        const tot = Number(row.totalPatients) || 0;
        const val = Math.max(sex, tot);

        if (val > 0) {
            let cleanName = name.trim();
            let isBarangay = true;

            if (!isConsolidatedView) {
                if (officialBarangays.includes(name)) {
                    isBarangay = true;
                    if (hostMuni) {
                        const regex = new RegExp(`\\b${hostMuni}\\b`, 'ig');
                        let stripped = cleanName.replace(regex, '').replace(/^[-\s,]+|[-\s,]+$/g, '').trim();
                        if (stripped !== '') cleanName = stripped;
                    }
                } else {
                    isBarangay = false; 
                }
            }

            total += val;

            if (isBarangay) {
                const existing = chart.find(item => item.name === cleanName);
                if (existing) existing.value += val;
                else chart.push({ name: cleanName, value: val });
            } else {
                const existing = table.find(item => item.name === cleanName);
                if (existing) existing.value += val;
                else table.push({ name: cleanName, value: val });
            }
        }
    });

    chart.sort((a, b) => a.name.localeCompare(b.name));
    table.sort((a, b) => b.value - a.value);

    return { chartData: chart, tableData: table, total };
  }, [data, isConsolidatedView, facilityType, user, facilityBarangays]); // Removed hostMuni

  const locationData = locationInfo.chartData;
  const tableData = locationInfo.tableData;
  const locationTotal = locationInfo.total;

  const safeTotals = useMemo(() => {
      let male = 0, female = 0, ageLt15 = 0, ageGt15 = 0, cat1 = 0, cat2 = 0, cat3 = 0, dog = 0, cat = 0;
      if (!data) return { male, female, ageLt15, ageGt15, cat1, cat2, cat3, dog, cat };
      
      const hostMuni = MUNICIPALITIES.find(m => user?.facility?.toLowerCase().includes(m.toLowerCase()));

      Object.entries(data).forEach(([name, row]) => {
          const lower = name.toLowerCase().trim();
          if (lower === 'total' || lower.includes('grand total')) return;
          if (!isConsolidatedView && hostMuni && lower === hostMuni.toLowerCase()) return;

          male += Number(row.male) || 0; female += Number(row.female) || 0;
          ageLt15 += Number(row.ageLt15) || 0; ageGt15 += Number(row.ageGt15) || 0;
          cat1 += Number(row.cat1) || 0; cat2 += Number(row.cat2) || 0; cat3 += Number(row.cat3) || 0;
          dog += Number(row.dog) || 0; cat += Number(row.cat) || 0;
      });

      return { male, female, ageLt15, ageGt15, cat1, cat2, cat3, dog, cat };
  }, [data, isConsolidatedView, user]); // Removed hostMuni

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

    const otherMap = {};
    const hostMuni = MUNICIPALITIES.find(m => user?.facility?.toLowerCase().includes(m.toLowerCase()));

    Object.entries(data || {}).forEach(([key, row]) => {
        const lower = key.toLowerCase().trim();
        if (lower === 'total' || lower.includes('grand total')) return;
        if (!isConsolidatedView && hostMuni && lower === hostMuni.toLowerCase()) return;

        if (key === 'Others:' || MUNICIPALITIES.includes(key) || facilityBarangays[user?.facility]?.includes(key)) {
            const specStr = row.othersSpec || '';
            const count = Number(row.othersCount) || 0;
            if (count > 0) {
                if (specStr.trim()) {
                    const parts = specStr.split(/[,;]/).map(s => s.trim()).filter(Boolean);
                    let parsedCountTotal = 0;
                    parts.forEach(part => {
                        let name = null; let val = 0;
                        const match1 = part.match(/^(\d+)\s*[-:]?\s*([a-zA-Z\s\(\)]+)$/);
                        if (match1) { val = parseInt(match1[1], 10); name = match1[2].trim(); } 
                        else {
                            const match2 = part.match(/^([a-zA-Z\s\(\)]+)\s*[-:]?\s*(\d+)$/);
                            if (match2) { name = match2[1].trim(); val = parseInt(match2[2], 10); }
                        }
                        if (name && val > 0) {
                            let cleanName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                            if (cleanName.endsWith('s') && cleanName.length > 3) cleanName = cleanName.slice(0, -1);
                            otherMap[cleanName] = (otherMap[cleanName] || 0) + val;
                            parsedCountTotal += val;
                        }
                    });
                    if (parts.length === 1 && parsedCountTotal === 0) {
                        let name = parts[0].replace(/[\d\s:-]+/g, '').trim(); 
                        if(name) {
                            let cleanName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                            if (cleanName.endsWith('s') && cleanName.length > 3) cleanName = cleanName.slice(0, -1);
                            otherMap[cleanName] = (otherMap[cleanName] || 0) + count;
                        } else { otherMap['Other (Unspecified)'] = (otherMap['Other (Unspecified)'] || 0) + count; }
                    } else if (parsedCountTotal < count) {
                        const remainder = count - parsedCountTotal;
                        otherMap['Other (Unspecified)'] = (otherMap['Other (Unspecified)'] || 0) + remainder;
                    }
                } else { otherMap['Other (Unspecified)'] = (otherMap['Other (Unspecified)'] || 0) + count; }
            }
        }
    });

    const extraColors = ['#14B8A6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#64748B'];
    let colorIdx = 0;
    Object.entries(otherMap).forEach(([name, value]) => {
        if (value > 0) { res.push({ name, value, fill: extraColors[colorIdx % extraColors.length] }); colorIdx++; }
    });

    return res.sort((a, b) => b.value - a.value);
  }, [data, safeTotals, facilityBarangays, user, isConsolidatedView]); // Removed hostMuni

  const categoryTotal = useMemo(() => categoryData.reduce((sum, item) => sum + item.value, 0), [categoryData]);
  const sexTotal = useMemo(() => demographicsSexData.reduce((sum, item) => sum + item.value, 0), [demographicsSexData]);
  const ageTotal = useMemo(() => demographicsAgeData.reduce((sum, item) => sum + item.value, 0), [demographicsAgeData]);
  const animalTotal = useMemo(() => animalData.reduce((sum, item) => sum + item.value, 0), [animalData]);

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Activity size={12}/> Current Period Cases</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-slate-900">{currentTotal}</h3>
                      <div className={`flex flex-col items-end`}>
                          {comparisonData.isValid ? (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${comparisonData.delta >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {comparisonData.delta >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                  {Math.abs(comparisonData.delta).toFixed(1)}%
                              </div>
                          ) : (
                              <div className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[10px] font-bold">N/A</div>
                          )}
                          <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{comparisonData.label}</span>
                      </div>
                  </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={12}/> {periodType === 'Annual' ? 'Total Cases' : 'YTD Total'}</p>
                  <div className="flex items-end justify-between">
                      <h3 className="text-3xl font-black text-slate-900">
                          {calculatedYTD}
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

          <DemographicCharts 
            locationTitleBase={locationTitleBase} locationTotal={locationTotal} locationData={locationData} tableData={tableData}
            categoryTotal={categoryTotal} categoryData={categoryData} animalTotal={animalTotal} animalData={animalData}
            sexTotal={sexTotal} demographicsSexData={demographicsSexData} ageTotal={ageTotal} demographicsAgeData={demographicsAgeData}
            handleDownload={handleDownload} renderDynamicBarLabel={renderDynamicBarLabel} renderCustomizedLabel={renderCustomizedLabel}
            COLORS={COLORS} TOOLTIP_STYLE={TOOLTIP_STYLE}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <SmartAlertsPanel riskLevel={riskLevel} smartAlerts={smartAlerts} projectedNextMonth={projectedNextMonth} modelMetrics={modelMetrics} />
            <PredictiveModel 
              year={year} full24MonthData={full24MonthData} handleDownload={handleDownload} showMathModal={showMathModal} setShowMathModal={setShowMathModal}
              OUTBREAK_SENSITIVITY={OUTBREAK_SENSITIVITY} TREND_SENSITIVITY={TREND_SENSITIVITY} TOOLTIP_STYLE={TOOLTIP_STYLE}
              projectedNextMonth={projectedNextMonth} riskLevel={riskLevel} modelMetrics={modelMetrics}
              currentTotal={calculatedYTD} 
            />
        </div>
      )}
    </div>
  );
}