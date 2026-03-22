import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { Loader2, Download, ShieldAlert, PieChart as PieChartIcon, Archive } from 'lucide-react';
import { toPng } from 'html-to-image'; 
import { useApp } from '../../context/AppContext';
import { useReportData } from '../../hooks/useReportData';
import { QUARTERS, MUNICIPALITIES } from '../../lib/constants';

const COLORS = {
  male: '#3B82F6', female: '#F43F5E', 
  ageLt15: '#10B981', ageGt15: '#F59E0B', 
  cat1: '#14B8A6', cat2: '#F59E0B', cat3: '#EF4444', 
  dog: '#6366F1', cat: '#8B5CF6', other: '#64748B' 
};

const DYNAMIC_COLORS = ['#14B8A6', '#F43F5E', '#F97316', '#06B6D4', '#8B5CF6', '#EAB308'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (value === 0) return null; 
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

const TOOLTIP_STYLE = {
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  padding: '12px 16px',
  fontWeight: '700',
  color: '#0F172A',
  backgroundColor: 'rgba(255, 255, 255, 0.98)'
};

export default function AnalyticsOverview({ 
  periodType, setPeriodType, year, setYear, month, setMonth, 
  quarter, setQuarter, availableYears, availableMonths 
}) {
  const { user, facilities, facilityBarangays, facilityDetails } = useApp();
  const isAdmin = user?.role === 'admin';

  const { data, grandTotals, loading, reportStatus } = useReportData({
    user, facilities, facilityBarangays, year, month, quarter, periodType,
    activeTab: 'main', cohortSubTab: 'cat2', 
    adminViewMode: isAdmin ? 'consolidated' : 'dashboard', 
    selectedFacility: null
  });

  const dynamicDateText = useMemo(() => {
    if (periodType === 'Monthly') return `for ${month} ${year}`;
    if (periodType === 'Quarterly') return `for the ${quarter} ${year}`;
    return `for the Year ${year}`;
  }, [periodType, month, quarter, year]);

  const facilityType = facilityDetails?.[user?.facility]?.type || 'RHU';
  
  const title = isAdmin ? "Provincial Analytics" : "Facility Analytics";
  
  const locationTitle = isAdmin 
    ? `Top Municipalities by Case Volume` 
    : (facilityType === 'Hospital' || facilityType === 'Clinic' ? `Top Municipalities by Case Volume` : `Top Barangays by Case Volume`);

  const isDataApproved = useMemo(() => {
    if (isAdmin) return true;
    if (periodType === 'Monthly') return reportStatus === 'Approved';
    return true; 
  }, [isAdmin, periodType, reportStatus]);

  const currentDate = useMemo(() => new Date(), []);
  const currentRealYear = currentDate.getFullYear();
  const currentQuarterIndex = Math.floor(currentDate.getMonth() / 3);

  const availableQuarters = useMemo(() => {
    if (year === currentRealYear) {
      return QUARTERS.slice(0, currentQuarterIndex + 1);
    }
    return QUARTERS;
  }, [year, currentRealYear, currentQuarterIndex]);

  const handleDownload = async (chartId, fileName) => {
    const element = document.getElementById(chartId);
    if (!element) return;
    try {
      const filter = (node) => node.tagName !== 'BUTTON';
      const dataUrl = await toPng(element, { pixelRatio: 2, backgroundColor: '#ffffff', filter: filter });
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating chart image:", error);
    }
  };

  const demographicsSexData = [
    { name: 'Male', value: grandTotals?.male || 0 },
    { name: 'Female', value: grandTotals?.female || 0 }
  ];

  const demographicsAgeData = [
    { name: '< 15 Yrs', value: grandTotals?.ageLt15 || 0 },
    { name: '> 15 Yrs', value: grandTotals?.ageGt15 || 0 }
  ];

  const categoryData = [
    { name: 'Category I', value: grandTotals?.cat1 || 0, fill: COLORS.cat1 },
    { name: 'Category II', value: grandTotals?.cat2 || 0, fill: COLORS.cat2 },
    { name: 'Category III', value: grandTotals?.cat3 || 0, fill: COLORS.cat3 }
  ];

  const animalData = useMemo(() => {
    if (!grandTotals || !data || !isDataApproved) return [];
    
    const chartData = [
      { name: 'Dog', value: grandTotals.dog || 0, fill: COLORS.dog },
      { name: 'Cat', value: grandTotals.cat || 0, fill: COLORS.cat }
    ];

    const extraAnimals = {};
    let unspecifiedOthers = 0;

    Object.entries(data).forEach(([key, row]) => {
      if (key === "Others:") return;
      if (row.othersCount > 0) {
        const specText = row.othersSpec?.trim();
        if (specText) {
          const parts = specText.split(/[,/]+|\sand\s/i);
          let parsedList = [];
          let explicitSum = 0;

          parts.forEach(part => {
            const numMatch = part.match(/\d+/);
            const count = numMatch ? parseInt(numMatch[0], 10) : 0;
            const textOnly = part.replace(/[^a-zA-Z\s]/g, '').trim();

            if (textOnly) {
              let cleanName = textOnly.charAt(0).toUpperCase() + textOnly.slice(1).toLowerCase();
              if (cleanName.endsWith('s') && cleanName !== 'Walrus') {
                  cleanName = cleanName.slice(0, -1);
              }
              parsedList.push({ name: cleanName, count });
              explicitSum += count;
            }
          });

          if (parsedList.length > 0) {
            if (explicitSum > 0) {
              parsedList.forEach(item => {
                let assign = item.count;
                if (assign === 0) { assign = 1; explicitSum += 1; }
                extraAnimals[item.name] = (extraAnimals[item.name] || 0) + assign;
              });
              if (row.othersCount > explicitSum) { unspecifiedOthers += (row.othersCount - explicitSum); }
            } else {
              const baseCount = Math.floor(row.othersCount / parsedList.length);
              let remainder = row.othersCount % parsedList.length;
              parsedList.forEach(item => {
                let assign = baseCount;
                if (remainder > 0) { assign += 1; remainder -= 1; }
                if (assign > 0) { extraAnimals[item.name] = (extraAnimals[item.name] || 0) + assign; }
              });
            }
          } else { unspecifiedOthers += row.othersCount; }
        } else { unspecifiedOthers += row.othersCount; }
      }
    });

    let colorIndex = 0;
    Object.entries(extraAnimals).forEach(([name, value]) => {
      chartData.push({ name, value, fill: DYNAMIC_COLORS[colorIndex % DYNAMIC_COLORS.length] });
      colorIndex++;
    });

    if (unspecifiedOthers > 0) chartData.push({ name: 'Unspecified', value: unspecifiedOthers, fill: COLORS.other });
    return chartData.filter(item => item.value > 0);
  }, [data, grandTotals, isDataApproved]);

  const locationData = useMemo(() => {
    if (!data || !isDataApproved) return [];
    
    const currentBarangays = facilityBarangays[user?.facility] || [];
    const isHospital = MUNICIPALITIES.every(m => currentBarangays.includes(m));
    const hostMunicipality = !isHospital && user?.facility !== "AMDC" && user?.facility !== "APH"
        ? MUNICIPALITIES.find(m => user?.facility?.includes(m)) : null;

    return Object.entries(data)
      .filter(([locationName, row]) => {
          if (locationName === 'Others:') return false;
          if (!isAdmin && hostMunicipality && locationName === hostMunicipality && currentBarangays.length > 0) return false; 
          const tp = Number(row.totalPatients) || 0;
          const catSum = (Number(row.cat1) || 0) + (Number(row.cat2) || 0) + (Number(row.cat3) || 0);
          const sexSum = (Number(row.male) || 0) + (Number(row.female) || 0);
          return Math.max(tp, catSum, sexSum) > 0;
      })
      .map(([locationName, row]) => {
          const tp = Number(row.totalPatients) || 0;
          const catSum = (Number(row.cat1) || 0) + (Number(row.cat2) || 0) + (Number(row.cat3) || 0);
          const sexSum = (Number(row.male) || 0) + (Number(row.female) || 0);
          return { name: locationName, value: Math.max(tp, catSum, sexSum) };
      })
      .sort((a, b) => b.value - a.value); 
  }, [data, isDataApproved, facilityBarangays, user, isAdmin]);

  const locationTotal = useMemo(() => locationData.reduce((sum, item) => sum + item.value, 0), [locationData]);
  const animalTotal = useMemo(() => animalData.reduce((sum, item) => sum + item.value, 0), [animalData]);
  const categoryTotal = useMemo(() => categoryData.reduce((sum, item) => sum + item.value, 0), [categoryData]);
  const sexTotal = useMemo(() => demographicsSexData.reduce((sum, item) => sum + item.value, 0), [demographicsSexData]);
  const ageTotal = useMemo(() => demographicsAgeData.reduce((sum, item) => sum + item.value, 0), [demographicsAgeData]);

  return (
    <div className="max-w-7xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500 relative pb-24 sm:pb-12 w-full px-2 sm:px-4">
      
      {/* --- HEADER --- */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 md:p-8 mb-6 mt-2 shadow-xl flex flex-col xl:flex-row xl:items-end justify-between gap-5 sm:gap-6 border border-slate-800 relative overflow-hidden no-print">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
          
          <div className="flex items-start gap-3 sm:gap-4 relative z-10 w-full xl:w-auto">
              <div className="hidden sm:flex bg-slate-800 p-3 sm:p-4 rounded-2xl shadow-inner border border-slate-700 items-center justify-center shrink-0">
                  <PieChartIcon size={28} className="text-yellow-400" strokeWidth={2.5}/>
              </div>
              <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-2 sm:gap-3 leading-tight break-words">
                      <span>{title}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-slate-400">
                      <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 border border-slate-700">{periodType}</span> 
                      <span className="hidden sm:inline">&bull;</span> 
                      <span>Visualizing approved data {dynamicDateText}</span>
                  </div>
              </div>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 relative z-10 w-full xl:w-auto">
              <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between sm:justify-start gap-1 shadow-inner w-full sm:w-auto">
                  <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="flex-1 sm:flex-none bg-slate-700 text-xs sm:text-sm font-semibold text-white py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer rounded-lg border border-slate-600 shadow-sm focus:ring-2 focus:ring-yellow-400/20 transition-all">
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                  </select>
                  <div className="w-px h-5 bg-slate-600 mx-1 hidden sm:block"></div>
                  
                  {periodType === 'Monthly' && (
                      <select value={month} onChange={(e) => setMonth(e.target.value)} disabled={loading} className="flex-1 sm:flex-none bg-transparent text-xs sm:text-sm font-medium text-slate-300 py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer hover:bg-slate-700 hover:text-white rounded-lg transition-all disabled:opacity-50">
                          {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                  )}
                  
                  {periodType === 'Quarterly' && (
                      <select value={quarter} onChange={(e) => setQuarter(e.target.value)} disabled={loading} className="flex-1 sm:flex-none bg-transparent text-xs sm:text-sm font-medium text-slate-300 py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer hover:bg-slate-700 hover:text-white rounded-lg transition-all disabled:opacity-50">
                          {availableQuarters.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                  )}
                  
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} disabled={loading} className="flex-1 sm:flex-none bg-transparent text-xs sm:text-sm font-medium text-slate-300 py-3 sm:py-1.5 px-2 sm:px-3 outline-none cursor-pointer hover:bg-slate-700 hover:text-white rounded-lg transition-all disabled:opacity-50">
                      {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
              </div>
          </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : !isDataApproved ? (
        <div className="h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm text-center p-6 animate-in fade-in duration-300">
           <div className="bg-amber-50 p-5 rounded-full shadow-inner border border-amber-100 mb-5">
               <ShieldAlert className="text-amber-500" size={40} strokeWidth={2.5} />
           </div>
           <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Data Pending Approval</h3>
           <p className="text-sm font-medium text-slate-500 mt-2 max-w-md leading-relaxed">
               Analytics <strong className="text-slate-800">{dynamicDateText}</strong> will remain locked until the Provincial Health Office approves your submitted report.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-6">
          
          {/* Geographical Chart */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 relative group hover:shadow-md transition-shadow duration-300" id="chart-location">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] sm:text-base font-black text-slate-800 uppercase tracking-widest">{locationTitle}</h3>
                 <div className="inline-block bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mt-2">
                    <p className="text-[11px] sm:text-xs font-bold text-blue-600 tracking-widest">TOTAL CASES: {locationTotal}</p>
                 </div>
               </div>
               <button onClick={() => handleDownload('chart-location', `Locations_${periodType}_${year}.png`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100 border border-transparent hover:border-blue-200" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>

            {locationData.length > 0 ? (
                <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={locationData} margin={{ top: 20, right: 20, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 11, fontWeight: 700}} axisLine={{stroke: '#CBD5E1'}} tickLine={false} angle={-45} textAnchor="end" />
                    <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={TOOLTIP_STYLE}/>
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50} fill="#3B82F6" name="Total Patients" isAnimationActive={false}>
                        {locationData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#1E40AF' : '#60A5FA'} />)}
                        <LabelList dataKey="value" content={renderDynamicBarLabel} />
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 font-medium text-sm">
                    <Archive size={24} className="mb-2 opacity-50" />
                    No data available {dynamicDateText}
                </div>
            )}
          </div>

          {/* Smart Biting Animal Breakdown */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group hover:shadow-md transition-shadow duration-300" id="chart-animal">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] sm:text-base font-black text-slate-800 uppercase tracking-widest">Biting Animal Breakdown</h3>
                 <div className="inline-block bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mt-2">
                    <p className="text-[11px] sm:text-xs font-bold text-indigo-600 tracking-widest">TOTAL CASES: {animalTotal}</p>
                 </div>
               </div>
               <button onClick={() => handleDownload('chart-animal', `Animals_${periodType}_${year}.png`)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100 border border-transparent hover:border-indigo-200" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={animalData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 11, fontWeight: 700}} axisLine={{stroke: '#CBD5E1'}} tickLine={false} />
                  <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={TOOLTIP_STYLE}/>
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} name="Cases" isAnimationActive={false}>
                    {animalData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    <LabelList dataKey="value" content={renderDynamicBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exposure Category Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group hover:shadow-md transition-shadow duration-300" id="chart-category">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] sm:text-base font-black text-slate-800 uppercase tracking-widest">Exposure Category</h3>
                 <div className="inline-block bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mt-2">
                    <p className="text-[11px] sm:text-xs font-bold text-emerald-600 tracking-widest">TOTAL CASES: {categoryTotal}</p>
                 </div>
               </div>
               <button onClick={() => handleDownload('chart-category', `Categories_${periodType}_${year}.png`)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100 border border-transparent hover:border-emerald-200" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={categoryData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 11, fontWeight: 700}} axisLine={{stroke: '#CBD5E1'}} tickLine={false} />
                  <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={TOOLTIP_STYLE}/>
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} name="Cases" isAnimationActive={false}>
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    <LabelList dataKey="value" content={renderDynamicBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patient Sex Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group hover:shadow-md transition-shadow duration-300" id="chart-sex">
            <div className="flex justify-between items-start mb-2 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] sm:text-base font-black text-slate-800 uppercase tracking-widest">Demographics (Sex)</h3>
                 <div className="inline-block bg-rose-50 border border-rose-100 px-3 py-1 rounded-full mt-2">
                    <p className="text-[11px] sm:text-xs font-bold text-rose-600 tracking-widest">TOTAL CASES: {sexTotal}</p>
                 </div>
               </div>
               <button onClick={() => handleDownload('chart-sex', `Sex_${periodType}_${year}.png`)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-200" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={demographicsSexData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel} isAnimationActive={false}>
                    {demographicsSexData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.male : COLORS.female} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ fontWeight: 700 }} />
                  <Legend iconType="circle" verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patient Age Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group hover:shadow-md transition-shadow duration-300" id="chart-age">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] sm:text-base font-black text-slate-800 uppercase tracking-widest">Demographics (Age)</h3>
                 <div className="inline-block bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mt-2">
                    <p className="text-[11px] sm:text-xs font-bold text-amber-600 tracking-widest">TOTAL CASES: {ageTotal}</p>
                 </div>
               </div>
               <button onClick={() => handleDownload('chart-age', `Age_${periodType}_${year}.png`)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100 border border-transparent hover:border-amber-200" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={demographicsAgeData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 11, fontWeight: 700}} axisLine={{stroke: '#CBD5E1'}} tickLine={false} />
                  <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={TOOLTIP_STYLE}/>
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} name="Patients" isAnimationActive={false}>
                    {demographicsAgeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.ageLt15 : COLORS.ageGt15} />
                    ))}
                    <LabelList dataKey="value" content={renderDynamicBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}