import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar, Line, Cell } from 'recharts';
import { BrainCircuit, Download, Calculator, X, TrendingUp, AlertTriangle, CheckCircle2, ActivitySquare, Info, Target, Loader2 } from 'lucide-react';
import ModalPortal from '../modals/ModalPortal';

export default function PredictiveModel({
  year, full24MonthData, handleDownload, showMathModal, setShowMathModal,
  OUTBREAK_SENSITIVITY, TREND_SENSITIVITY, HIGH_RISK_SENSITIVITY = 1.25, TOOLTIP_STYLE,
  projectedNextMonth, riskLevel, currentTotal = 0,
  modelMetrics = { accuracy: 0, mae: 0, mape: 0, validMonths: 0 },
  inFlightMonth = null,
  lastFinalizedMonth = null
}) {
  
  const [mathModalTab, setMathModalTab] = useState('legend');
  const chartDisplayData = full24MonthData.slice(-13);
  
  const validDataCount = full24MonthData.filter(d => d.raw !== null).length;
  const hasEnoughData = validDataCount >= 3 && projectedNextMonth !== null;
  
  const isCalibratingAccuracy = modelMetrics.validMonths < 3 || parseFloat(modelMetrics.accuracy) <= 0;

  const CustomPredictiveTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0]?.payload;
    const isInFlight = dataPoint?.isInFlight;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs space-y-2 max-w-[280px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/70 pb-1.5 font-bold">
          <span className="text-sm text-slate-100">{label}</span>
          {isInFlight && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
              Reporting Active
            </span>
          )}
        </div>
        <div className="space-y-1">
          {payload.map((entry, idx) => {
            if (entry.value === null || entry.value === undefined) return null;
            const isActual = entry.dataKey === 'raw';
            return (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.stroke || entry.fill }} />
                  {entry.name}:
                </span>
                <span className="font-bold text-white">
                  {Math.round(entry.value)}
                  {isActual && isInFlight ? ' (in-flight)' : ''}
                </span>
              </div>
            );
          })}
        </div>
        {isInFlight && (
          <p className="text-[10px] text-amber-300/90 pt-1.5 border-t border-slate-800 leading-tight">
            * Submissions due 1st week of next month. Baseline trajectory stabilized.
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm group" id="chart-predictive">
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <BrainCircuit size={18} className="text-blue-600"/> 
                      24-Month Forecasting Model & Analytics
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-[10px] ml-1 flex items-center h-fit" title={`Total cases for ${year}`}>
                          N = {currentTotal}
                      </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Multi-layered moving averages (Adaptive) for short-term reaction and long-term seasonality.</p>
              </div>
              <div className="flex gap-2 self-start">
                  <button onClick={() => setShowMathModal(true)} className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 shadow-sm">
                      <Calculator size={16} className="shrink-0"/>
                      <span className="hidden sm:inline">View Math & Formulas</span>
                  </button>
                  <button onClick={() => handleDownload('chart-predictive', `Predictive_${year}.png`)} className="p-2 text-slate-400 bg-white border border-slate-200 hover:border-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                      <Download size={18}/>
                  </button>
              </div>
          </div>

          <div className="mb-6">
              {isCalibratingAccuracy ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm font-medium text-amber-700 shadow-sm w-fit">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Model Calibrating Historical Data...</span>
                  </div>
              ) : (
                  <div className="flex flex-col md:flex-row md:flex-wrap gap-y-3 gap-x-8">
                      <div className="flex items-center gap-2 text-sm">
                          <Target size={16} className="text-blue-500 shrink-0" />
                          <span className="text-slate-600 font-medium">Derived from historical accuracy</span>
                          <span className="font-bold text-slate-900">{modelMetrics.accuracy}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                          <ActivitySquare size={16} className="text-slate-500 shrink-0" />
                          <span className="text-slate-600 font-medium">Mean Absolute Error</span>
                          <span className="font-bold text-slate-900">±{modelMetrics.mae} cases</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                          <TrendingUp size={16} className="text-slate-500 shrink-0" />
                          <span className="text-slate-600 font-medium">Symmetric Mean Absolute Percentage Error</span>
                          <span className="font-bold text-slate-900">{modelMetrics.mape}%</span>
                      </div>
                  </div>
              )}
          </div>

          <div className="h-[240px] sm:h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                  <ComposedChart data={chartDisplayData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#7398c9" />
                      
                      <XAxis dataKey="display" tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomPredictiveTooltip />} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px', fontSize: '11px', fontWeight: 'bold', color: '#1E293B'}} />
                      
                      <Bar dataKey="raw" name="Total Actual Cases" fill="#3B82F6" radius={[4,4,0,0]} barSize={20} isAnimationActive={false}>
                        {chartDisplayData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isInFlight ? '#93C5FD' : '#3B82F6'}
                            stroke={entry.isInFlight ? '#2563EB' : 'none'}
                            strokeDasharray={entry.isInFlight ? '3 3' : 'none'}
                            strokeWidth={entry.isInFlight ? 1.5 : 0}
                          />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="sma12" name="12M SMA (Seasonality)" stroke="#000000" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} connectNulls={true} />
                      <Line type="monotone" dataKey="sma6" name="6M SMA (Mid-Term)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="sma3" name="3M SMA (Short-Term)" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="wma3" name="3M WMA (Fast Signal)" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="forecast" name="Forecast vs Actual" stroke="#EF4444" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#EF4444' }} isAnimationActive={false} connectNulls={false} />
                  </ComposedChart>
              </ResponsiveContainer>
          </div>
          
          <div className="mt-4 sm:mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BrainCircuit size={14}/> Algorithmic Chart Interpretation</h4>
              
              {hasEnoughData ? (
                  <div className="text-sm font-medium text-slate-600 leading-relaxed">
                      {inFlightMonth && (
                        <div className="mb-3.5 p-3 sm:p-3.5 bg-blue-50/90 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-950 shadow-sm">
                          <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-blue-900">
                              Active Reporting Window: {inFlightMonth.month} {inFlightMonth.year}
                            </p>
                            <p className="text-blue-800 leading-relaxed">
                              Facility submissions for {inFlightMonth.month} are due during the 1st week of the following month. Moving average baselines are anchored to <strong>{lastFinalizedMonth || 'the last closed month'}</strong> (projected at <strong>{projectedNextMonth} cases</strong>) to prevent incomplete reporting from distorting trends.
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="mb-2">
                        Based on recent trajectory data{lastFinalizedMonth ? ` through ${lastFinalizedMonth}` : ''}, the mathematical model projects an estimated <strong className="text-slate-900">{projectedNextMonth !== null ? projectedNextMonth : '--'} cases</strong> for the upcoming reporting period. 
                      </p>
                      <p>
                        Current case volume is classified as a <strong className={`px-1.5 py-0.5 rounded ${riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : riskLevel === 'MODERATE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{riskLevel || 'LOW'} RISK</strong> event. This indicates that the active reporting volume is {riskLevel === 'HIGH' ? 'significantly exceeding normal baselines or showing critical indicators, suggesting a potential outbreak anomaly' : riskLevel === 'MODERATE' ? 'accelerating faster than the short-term average, indicating a rising trend' : 'stable and tracking normally within established historical baselines'}.
                      </p>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        {isCalibratingAccuracy ? (
                             <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
                                <Info size={12} className="text-blue-400"/> System Note: Overall predictive validation metrics are currently calibrating as the engine accumulates historical reporting data.
                             </p>
                        ) : (
                             <p className="text-xs text-slate-700">
                                Validation: The forecasting engine has cross-referenced these projections against historical trends with an established confidence rate of <strong className="text-slate-900">{modelMetrics.accuracy}%</strong>.
                             </p>
                        )}
                      </div>
                  </div>
              ) : (
                  <p className="text-sm font-medium text-slate-500 italic leading-relaxed">
                      Gathering baseline data. The system requires at least 3 months of continuous approved reports to accurately calculate projections and establish trend baselines.
                  </p>
              )}
          </div>
      </div>

      {showMathModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[90vh] max-h-[820px] animate-in zoom-in-95 duration-200 border border-slate-200">
                
                {/* Header */}
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/90 text-yellow-400 shadow-inner border border-slate-700 shrink-0">
                            <Calculator size={20} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">Chart Guide & Mathematical Formulas</h3>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Epidemiological time series computations & anti-distortion cutoff rules</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowMathModal(false)} 
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 rounded-full transition-all shrink-0 border border-slate-700/60 relative z-10"
                        title="Close Guide"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-4 sm:px-6 border-b border-slate-200 bg-slate-50/90 gap-2 sm:gap-6 shrink-0 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'legend', label: 'Chart Legend', icon: Info },
                      { id: 'averages', label: 'Moving Averages & Cutoff', icon: ActivitySquare },
                      { id: 'metrics', label: 'Accuracy & Error Metrics', icon: TrendingUp },
                      { id: 'alerts', label: 'Alert Engine Logic', icon: BrainCircuit }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = mathModalTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setMathModalTab(tab.id)}
                          className={`pb-3 pt-3.5 px-1 sm:px-2 text-xs font-bold transition-all duration-200 border-b-[3px] flex items-center gap-1.5 whitespace-nowrap active:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                            isActive
                              ? 'border-slate-900 text-slate-900'
                              : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                </div>
                
                {/* Scrollable Tab Content */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 custom-scrollbar bg-white">
                    
                    {/* --- TAB 1: CHART LEGEND & INDICATORS --- */}
                    {mathModalTab === 'legend' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                <Info size={16} className="text-blue-500"/> Visual Indicators & Chart Elements
                            </h4>
                            <p className="text-xs text-slate-500 mb-4">
                                The predictive graph overlays confirmed monthly caseloads, active in-flight submissions, dynamic moving averages, and step-ahead forecasts.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* Confirmed Cases */}
                            <div className="flex gap-3.5 items-start bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="w-4 h-4 rounded bg-blue-500 shrink-0 mt-0.5 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-1 flex items-center gap-2">
                                        Total Actual Cases <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">Finalized</span>
                                    </h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        Confirmed and approved animal bite patients recorded for closed historical months. These data points form the verified foundation for epidemiological modeling.
                                    </p>
                                </div>
                            </div>

                            {/* In-Flight Cases */}
                            <div className="flex gap-3.5 items-start bg-blue-50/40 p-4 rounded-xl border border-blue-200 shadow-sm">
                                <div className="w-4 h-4 rounded bg-blue-200 border-2 border-dashed border-blue-600 shrink-0 mt-0.5 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-blue-950 mb-1 flex items-center gap-2">
                                        In-Flight Active Submissions <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-black uppercase">Open Window</span>
                                    </h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        The active reporting period currently open for facility submissions (due by the 1st week of the following month). Shows preliminary cases received to date without polluting trend baselines.
                                    </p>
                                </div>
                            </div>

                            {/* 3M SMA */}
                            <div className="flex gap-3.5 items-start bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="w-5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-1">3M SMA (Short-Term Average)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        The unweighted average across the 3 most recent finalized months. Smooths out temporary monthly volatility to establish the immediate rate of transmission.
                                    </p>
                                </div>
                            </div>

                            {/* 3M WMA */}
                            <div className="flex gap-3.5 items-start bg-purple-50/40 p-4 rounded-xl border border-purple-200 shadow-sm">
                                <div className="flex items-center gap-1 shrink-0 mt-1.5">
                                  <div className="w-4 h-1.5 bg-purple-500 rounded-full shadow-sm"></div>
                                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-xs text-purple-950 mb-1">3M WMA (Fast Signal Radar)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        Weighted Moving Average assigning a 3x weight to the latest closed month. Reacts significantly faster to emerging case spikes and triggers <strong>Rising Trend</strong> warnings.
                                    </p>
                                </div>
                            </div>

                            {/* 6M SMA */}
                            <div className="flex gap-3.5 items-start bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="w-5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-2 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-1">6M SMA (Mid-Term Baseline)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        The 6-month historical baseline. Serves as the official threshold reference for provincial surge detection. Spikes above this curve trigger <strong>Volume Outbreak</strong> alerts.
                                    </p>
                                </div>
                            </div>

                            {/* 12M SMA */}
                            <div className="flex gap-3.5 items-start bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="w-5 h-0.5 border-t-2 border-dashed border-slate-900 shrink-0 mt-2"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-1">12M SMA (Annual Seasonality)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        Full-year moving average. Accounts for cyclical yearly patterns (such as summer rabies transmission peaks or holiday seasonal surges).
                                    </p>
                                </div>
                            </div>

                            {/* Forecast vs Actual */}
                            <div className="flex gap-3.5 items-start bg-red-50/40 p-4 rounded-xl border border-red-200 shadow-sm md:col-span-2">
                                <div className="flex items-center gap-1 shrink-0 mt-1.5">
                                  <div className="w-5 h-0.5 border-t-2 border-dashed border-red-500"></div>
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-xs text-red-950 mb-1">Forecast vs. Actual Trajectory</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        The algorithmic projection curve. On historical months, it depicts the model's step-ahead estimate compared against confirmed totals (measuring error). Extends into open and future periods to forecast expected bite volume.
                                    </p>
                                </div>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* --- TAB 2: MOVING AVERAGES & CUTOFF ENGINE --- */}
                    {mathModalTab === 'averages' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        
                        {/* Cutoff & Grace Period Engine */}
                        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">New</span>
                                <h5>Reporting Grace Period & Anti-Distortion Cutoff</h5>
                            </div>
                            <p className="text-xs text-amber-900/80 leading-relaxed">
                                Animal bite cases for any month <em>M</em> are compiled after the month concludes and submitted during the <strong>first week of month M+1 (deadline ~8th)</strong>. Without an anti-distortion rule, checking mid-month data would treat incomplete submissions (e.g. 40 cases out of 650) as an artificial collapse.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-sm">
                                    <strong className="block text-xs text-slate-900 mb-1 font-bold">1. Finalization Criteria</strong>
                                    <span className="text-[11px] text-slate-600 leading-relaxed block">
                                        Month <em>M</em> is finalized once:
                                        <br/>• Calendar date &ge; 8th day of Month <em>M+1</em>, <strong>OR</strong>
                                        <br/>• Approved facility submissions reach &ge; 80%.
                                    </span>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-sm">
                                    <strong className="block text-xs text-slate-900 mb-1 font-bold">2. Baseline Anchoring</strong>
                                    <span className="text-[11px] text-slate-600 leading-relaxed block">
                                        While month <em>M</em> is in-flight, backward moving averages anchor to month <em>M-1</em>. The model projects stable volume forward across both the open and upcoming cycles.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SMA */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h5 className="font-bold text-sm text-slate-900">Simple Moving Average (SMA 3, 6, 12)</h5>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Computes the unweighted arithmetic mean over the previous <em>n</em> finalized months to establish trend baselines.
                            </p>
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-sm sm:text-base font-bold text-slate-800 text-center shadow-sm">
                                SMA<sub>n</sub> = ( Case<sub>1</sub> + Case<sub>2</sub> + ... + Case<sub>n</sub> ) / n
                            </div>
                            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-950 font-medium leading-relaxed">
                                <strong className="block mb-1 text-blue-900 font-bold">Worked 3-Month Example:</strong>
                                If confirmed cases for the last 3 closed months were <strong>10</strong>, <strong>20</strong>, and <strong>15</strong>:
                                <br/>SMA = (10 + 20 + 15) ÷ 3 months = <strong>15 average cases</strong>.
                            </div>
                        </div>

                        {/* WMA */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h5 className="font-bold text-sm text-slate-900">Weighted Moving Average (3M WMA - Fast Signal)</h5>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Gives linear mathematical priority to the latest month (Weight 3) over the preceding months (Weights 2 and 1) to spot surges early.
                            </p>
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-800 text-center shadow-sm">
                                WMA<sub>3</sub> = [ (Case<sub>m-2</sub> × 1) + (Case<sub>m-1</sub> × 2) + (Case<sub>m</sub> × 3) ] / 6
                            </div>
                            <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-950 font-medium leading-relaxed">
                                <strong className="block mb-1 text-purple-900 font-bold">Worked Calculation:</strong>
                                Using cases 10, 20, 15:
                                <br/>• Step 1: (10 × 1) + (20 × 2) + (15 × 3) = 10 + 40 + 45 = <strong>95 weighted cases</strong>.
                                <br/>• Step 2: 95 ÷ 6 = 15.83 ≈ <strong>16 cases</strong> (leads the SMA by 1 case).
                            </div>
                        </div>

                        {/* High Risk Rabies Indicator */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h5 className="font-bold text-sm text-slate-900">High-Risk Rabies Score</h5>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Isolates severe exposure vectors (Category 3 punctures + Stray Animals) to detect rabies risks before bulk caseload jumps.
                            </p>
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-800 text-center shadow-sm">
                                High-Risk Score = Category 3 Cases + Stray Animal Bites
                            </div>
                            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-950 font-medium leading-relaxed">
                                <strong className="block mb-1 text-red-900 font-bold">Outbreak Trigger Formula:</strong>
                                Current Score &gt; [ SMA<sub>6</sub>(High-Risk Score) × {HIGH_RISK_SENSITIVITY} ] with a minimum threshold of 3 cases.
                            </div>
                        </div>

                      </div>
                    )}

                    {/* --- TAB 3: ERROR METRICS & ACCURACY --- */}
                    {mathModalTab === 'metrics' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-500"/> Model Validation & Error Tracking
                            </h4>
                            <p className="text-xs text-slate-500 mb-4">
                                The system dynamically cross-validates its predictions on every finalized historical month using standardized epidemiological statistical formulas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* MAE */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h5 className="font-bold text-sm text-slate-900 mb-1">Mean Absolute Error (MAE)</h5>
                                    <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                        Measures the average magnitude of prediction errors in raw case units. Represents the typical number of patients the forecast is off by.
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-800 text-center shadow-sm">
                                    MAE = ( Σ | Actual - Forecast | ) / n
                                </div>
                            </div>

                            {/* sMAPE */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h5 className="font-bold text-sm text-slate-900 mb-1">Symmetric MAPE (sMAPE) & Confidence</h5>
                                    <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                        Percentage error bound between 0% and 200%. Safely handles low-volume clinics without division-by-zero errors. Overall Accuracy is defined as <strong>100% - sMAPE</strong>.
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-800 text-center shadow-sm">
                                    sMAPE = [ Σ ( 2 × |Act - For| / (|Act| + |For|) ) ] / n × 100%
                                </div>
                            </div>

                            {/* 2-Month Worked Example */}
                            <div className="md:col-span-2 p-5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 font-medium leading-relaxed shadow-sm space-y-3">
                                <strong className="block text-sm text-emerald-900 font-bold flex items-center gap-1.5">
                                    Step-by-Step 2-Month Error Derivation:
                                </strong>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                                        <strong className="block text-slate-900 mb-1">Month 1:</strong>
                                        <span className="text-slate-600">Predicted = <strong>50</strong>, Actual = <strong>60</strong></span><br/>
                                        <span className="text-slate-700">• Absolute Difference = |60 - 50| = <strong>10 cases</strong></span><br/>
                                        <span className="text-slate-700">• % Error = (2 × 10) / (60 + 50) = 20 / 110 = <strong>18.1%</strong></span>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                                        <strong className="block text-slate-900 mb-1">Month 2:</strong>
                                        <span className="text-slate-600">Predicted = <strong>40</strong>, Actual = <strong>30</strong></span><br/>
                                        <span className="text-slate-700">• Absolute Difference = |30 - 40| = <strong>10 cases</strong></span><br/>
                                        <span className="text-slate-700">• % Error = (2 × 10) / (30 + 40) = 20 / 70 = <strong>28.5%</strong></span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:justify-between gap-2 text-emerald-900 font-bold">
                                    <span>Average MAE: (10 + 10) ÷ 2 = ±10 cases</span>
                                    <span>Average sMAPE: (18.1% + 28.5%) ÷ 2 = 23.3% error (76.7% confidence)</span>
                                </div>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* --- TAB 4: ALERT ENGINE LOGIC --- */}
                    {mathModalTab === 'alerts' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                                <BrainCircuit size={16} className="text-purple-500"/> Automated Smart Alert Decision Tree
                            </h4>
                            <p className="text-xs text-slate-500 mb-4">
                                When new reports are approved, the alert engine scans the updated baseline against sensitivity thresholds configured in System Settings.
                            </p>
                        </div>

                        <div className="space-y-3.5">
                            {/* Critical Rabies */}
                            <div className="flex gap-3.5 items-start bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-sm">
                                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5"/>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-xs text-red-950">High-Risk Rabies Indicator</h5>
                                      <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Critical</span>
                                    </div>
                                    <div className="font-mono text-xs font-semibold bg-white/90 border border-red-200 px-2.5 py-1 rounded inline-block text-red-800">
                                        Condition: (Cat 3 + Strays) &gt; [ SMA<sub>6</sub>(Score) × {HIGH_RISK_SENSITIVITY} ]
                                    </div>
                                    <p className="text-[11px] text-red-700 leading-relaxed">
                                        Isolates deep punctures and unowned animal exposures. Triggers when severe cases suddenly spike above the 6-month baseline, signaling an active rabies exposure vector.
                                    </p>
                                </div>
                            </div>

                            {/* Volume Anomaly */}
                            <div className="flex gap-3.5 items-start bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-sm">
                                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5"/>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-xs text-red-950">Volume Outbreak Anomaly</h5>
                                      <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">High Risk</span>
                                    </div>
                                    <div className="font-mono text-xs font-semibold bg-white/90 border border-red-200 px-2.5 py-1 rounded inline-block text-red-800">
                                        Condition: Total Cases &gt; [ SMA<sub>6</sub> × {OUTBREAK_SENSITIVITY} ]
                                    </div>
                                    <p className="text-[11px] text-red-700 leading-relaxed">
                                        Triggers when total monthly bite victims exceed the 6-month moving baseline by the anomaly threshold (currently {Math.round((OUTBREAK_SENSITIVITY - 1) * 100)}%).
                                    </p>
                                </div>
                            </div>

                            {/* Rising Trend */}
                            <div className="flex gap-3.5 items-start bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm">
                                <TrendingUp size={18} className="text-amber-600 shrink-0 mt-0.5"/>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-xs text-amber-950">Rising Trend Signal</h5>
                                      <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Moderate</span>
                                    </div>
                                    <div className="font-mono text-xs font-semibold bg-white/90 border border-amber-200 px-2.5 py-1 rounded inline-block text-amber-800">
                                        Condition: [ (WMA<sub>3</sub> - SMA<sub>3</sub>) / SMA<sub>3</sub> ] × 100 &gt; {TREND_SENSITIVITY}%
                                    </div>
                                    <p className="text-[11px] text-amber-700 leading-relaxed">
                                        Triggers when the weighted fast-signal exceeds the unweighted average by more than {TREND_SENSITIVITY}%, indicating rapid case acceleration.
                                    </p>
                                </div>
                            </div>

                            {/* Stable */}
                            <div className="flex gap-3.5 items-start bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm">
                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5"/>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-xs text-emerald-950">Stable Baseline Volume</h5>
                                      <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Low Risk</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                                        Patient volume is within normal statistical thresholds. No epidemiological surge actions required.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
                            <h5 className="font-bold text-xs text-slate-700 mb-1 uppercase tracking-widest flex items-center gap-1.5">
                                <Info size={14}/> Epidemiological Context Disclaimer
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                Projections are mathematical probability models designed for supply planning and surge preparedness. Sudden clinical events (mass vaccination drives, delayed batch uploads, or local stray pack migration) will cause real-world deviations. Always combine automated projections with local epidemiological intelligence.
                            </p>
                        </div>
                      </div>
                    )}

                </div>

                {/* Pinned Modal Footer */}
                <div className="p-3.5 sm:px-6 sm:py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                      ABTC Statistical Forecasting Engine v2.0
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowMathModal(false)}
                        className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-yellow-400 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                        Close Guide
                    </button>
                </div>

            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}