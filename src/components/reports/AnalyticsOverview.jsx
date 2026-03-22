import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { Loader2, Download, ShieldAlert } from 'lucide-react';
import { toPng } from 'html-to-image'; 
import { useApp } from '../../context/AppContext';
import { useReportData } from '../../hooks/useReportData';
import { QUARTERS, MUNICIPALITIES } from '../../lib/constants';

const COLORS = {
  male: '#2563EB', female: '#E11D48', 
  ageLt15: '#0D9488', ageGt15: '#D97706', 
  cat1: '#10B981', cat2: '#F59E0B', cat3: '#EF4444', 
  dog: '#4F46E5', cat: '#8B5CF6', other: '#64748B'
};

const DYNAMIC_COLORS = ['#14B8A6', '#F43F5E', '#F97316', '#06B6D4', '#8B5CF6', '#EAB308'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (value === 0) return null; 
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
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
    <text x={x + width / 2} y={textY} fill={textColor} textAnchor="middle" fontSize={11} fontWeight="bold">
      {value}
    </text>
  );
};

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  padding: '12px',
  fontWeight: '600',
  color: '#0F172A',
  backgroundColor: 'rgba(255, 255, 255, 0.95)'
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
  
  const title = isAdmin ? "Provincial Analytics Overview" : "Facility Analytics Overview";
  const subtitle = isAdmin 
    ? `Visualizing approved data ${dynamicDateText}` 
    : `Visualizing data for ${user?.facility || 'your facility'}`;
  
  const locationTitle = isAdmin 
    ? `Top Municipalities by Case Volume ${dynamicDateText}` 
    : (facilityType === 'Hospital' || facilityType === 'Clinic' ? `Top Municipalities by Case Volume ${dynamicDateText}` : `Top Barangays by Case Volume ${dynamicDateText}`);

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
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
            </select>
            
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            {periodType === 'Monthly' && (
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                    {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            )}

            {periodType === 'Quarterly' && (
                <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="bg-slate-50 border border-slate-200 text-sm rounded-xl px-3 py-2 font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                    {availableQuarters.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
            )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : !isDataApproved ? (
        <div className="h-80 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 shadow-sm text-center p-6 animate-in fade-in duration-300">
           <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
               <ShieldAlert className="text-amber-500" size={32} strokeWidth={2} />
           </div>
           <h3 className="text-xl font-black text-slate-800 tracking-tight">Data Pending Approval</h3>
           <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
               Analytics <span className="text-slate-700 font-semibold">{dynamicDateText}</span> will be locked until the Provincial Health Office approves your submitted report.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          
          {/* Geographical Chart */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 relative group" id="chart-location">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide">{locationTitle}</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">TOTAL CASES: <span className="text-blue-600">{locationTotal}</span></p>
               </div>
               <button onClick={() => handleDownload('chart-location', `Locations_${periodType}_${year}.png`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>

            {locationData.length > 0 ? (
                <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData} margin={{ top: 20, right: 20, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                    <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 11, fontWeight: 500}} axisLine={{stroke: '#E2E8F0'}} tickLine={false} angle={-45} textAnchor="end" />
                    <YAxis tick={{fill: '#94A3B8', fontSize: 11}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#F8FAFC'}} contentStyle={TOOLTIP_STYLE}/>
                    {/* ADDED isAnimationActive={false} TO FIX BLINKING */}
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50} fill="#3B82F6" name="Total Patients" isAnimationActive={false}>
                        {locationData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : '#93C5FD'} />)}
                        <LabelList dataKey="value" content={renderDynamicBarLabel} />
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-40 flex items-center justify-center text-slate-400 font-medium text-sm">No data available {dynamicDateText}.</div>
            )}
          </div>

          {/* Smart Biting Animal Breakdown */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group" id="chart-animal">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide">Biting Animal Breakdown</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">TOTAL CASES: <span className="text-blue-600">{animalTotal}</span></p>
               </div>
               <button onClick={() => handleDownload('chart-animal', `Animals_${periodType}_${year}.png`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={animalData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                  <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} axisLine={{stroke: '#E2E8F0'}} tickLine={false} />
                  <YAxis tick={{fill: '#94A3B8', fontSize: 11}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#F8FAFC'}} contentStyle={TOOLTIP_STYLE}/>
                  {/* ADDED isAnimationActive={false} TO FIX BLINKING */}
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} name="Cases" isAnimationActive={false}>
                    {animalData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    <LabelList dataKey="value" content={renderDynamicBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exposure Category Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group" id="chart-category">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide">Exposure Category</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">TOTAL CASES: <span className="text-blue-600">{categoryTotal}</span></p>
               </div>
               <button onClick={() => handleDownload('chart-category', `Categories_${periodType}_${year}.png`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                  <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} axisLine={{stroke: '#E2E8F0'}} tickLine={false} />
                  <YAxis tick={{fill: '#94A3B8', fontSize: 11}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#F8FAFC'}} contentStyle={TOOLTIP_STYLE}/>
                  {/* ADDED isAnimationActive={false} TO FIX BLINKING */}
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} name="Cases" isAnimationActive={false}>
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    <LabelList dataKey="value" content={renderDynamicBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patient Sex Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group" id="chart-sex">
            <div className="flex justify-between items-start mb-2 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide">Patient Demographics (Sex)</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">TOTAL CASES: <span className="text-blue-600">{sexTotal}</span></p>
               </div>
               <button onClick={() => handleDownload('chart-sex', `Sex_${periodType}_${year}.png`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* ADDED isAnimationActive={false} TO FIX BLINKING */}
                  <Pie data={demographicsSexData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none" labelLine={false} label={renderCustomizedLabel} isAnimationActive={false}>
                    {demographicsSexData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.male : COLORS.female} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ fontWeight: 600 }} />
                  <Legend iconType="circle" verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patient Age Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 relative group" id="chart-age">
            <div className="flex justify-between items-start mb-6 relative">
               <div className="flex-1 text-center">
                 <h3 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide">Patient Demographics (Age)</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">TOTAL CASES: <span className="text-blue-600">{ageTotal}</span></p>
               </div>
               <button onClick={() => handleDownload('chart-age', `Age_${periodType}_${year}.png`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all absolute right-0 top-0 opacity-0 group-hover:opacity-100" title="Download Image">
                 <Download size={18} strokeWidth={2.5}/>
               </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicsAgeData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                  <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 11, fontWeight: 600}} axisLine={{stroke: '#E2E8F0'}} tickLine={false} />
                  <YAxis tick={{fill: '#94A3B8', fontSize: 11}} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#F8FAFC'}} contentStyle={TOOLTIP_STYLE}/>
                  {/* ADDED isAnimationActive={false} TO FIX BLINKING */}
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} name="Patients" isAnimationActive={false}>
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