import React from 'react';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LabelList, PieChart, Pie, Cell } from 'recharts';
import { Download, Building2 } from 'lucide-react';

export default function DemographicCharts({
  locationTitleBase, locationTotal, locationData, tableData,
  categoryTotal, categoryData,
  animalTotal, animalData,
  sexTotal, demographicsSexData,
  ageTotal, demographicsAgeData,
  handleDownload, renderDynamicBarLabel, renderCustomizedLabel,
  COLORS, TOOLTIP_STYLE
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* ROW 1: Location Volume (FULL WIDTH) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow flex flex-col h-full lg:col-span-6" id="chart-location">
            <div className="flex justify-between items-start mb-6 shrink-0">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                   {locationTitleBase} <span className="text-blue-600 font-normal normal-case tracking-normal ml-1">(N={locationTotal})</span>
               </h3>
               <button onClick={() => handleDownload('chart-location', `Locations.png`)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Download size={16}/></button>
            </div>
            
            {/* MAIN BAR CHART */}
            <div className="h-[280px] w-full shrink-0">
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

            {/* --- FIX: OTHER MUNICIPALITIES / NON-ABRA RENDERED AS TEXT CHIPS --- */}
            {tableData.length > 0 && (
                <div className="mt-8 border-t border-slate-100 pt-4 shrink-0">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                       <Building2 size={12} /> External Catchment Cases
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {tableData.map(row => (
                            <div key={row.name} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                                <span className="font-medium text-slate-600">{row.name}:</span>
                                <span className="font-black text-slate-900">{row.value} {row.value === 1 ? 'case' : 'cases'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* ROW 2: Exposure Category | Biting Animal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow lg:col-span-3" id="chart-cat">
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
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow lg:col-span-3" id="chart-animal">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Biting Animal <span className="text-blue-600 font-normal normal-case tracking-normal ml-1">(N={animalTotal})</span>
                </h3>
                <button onClick={() => handleDownload('chart-animal', `Biting_Animal.png`)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Download size={16}/></button>
            </div>
            <div className="h-[280px] mt-2">
                <ResponsiveContainer>
                    <RechartsBarChart data={animalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 700}} />
                        <YAxis tick={{fontSize: 10}} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={100}>
                            {animalData.map((e, i) => <Cell key={`cell-${i}`} fill={e.fill} />)}
                            <LabelList dataKey="value" content={renderDynamicBarLabel} />
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* ROW 3: Demographics Sex | Demographics Age */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow lg:col-span-3" id="chart-sex">
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
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-shadow lg:col-span-3" id="chart-age">
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
  );
}