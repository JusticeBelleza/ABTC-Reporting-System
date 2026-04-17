import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar, Line } from 'recharts';
import { BrainCircuit, Download, Calculator, X, TrendingUp, AlertTriangle, CheckCircle2, ActivitySquare, Info, Target, Loader2 } from 'lucide-react';
import ModalPortal from '../modals/ModalPortal';

export default function PredictiveModel({
  year, full24MonthData, handleDownload, showMathModal, setShowMathModal,
  OUTBREAK_SENSITIVITY, TREND_SENSITIVITY, HIGH_RISK_SENSITIVITY = 1.25, TOOLTIP_STYLE,
  projectedNextMonth, riskLevel, currentTotal = 0,
  modelMetrics = { accuracy: 0, mae: 0, mape: 0, validMonths: 0 } 
}) {
  
  const chartDisplayData = full24MonthData.slice(-13);
  
  const validDataCount = full24MonthData.filter(d => d.raw !== null).length;
  const hasEnoughData = validDataCount >= 3 && projectedNextMonth !== null;
  
  const isCalibratingAccuracy = modelMetrics.validMonths < 3 || parseFloat(modelMetrics.accuracy) <= 0;

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group" id="chart-predictive">
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <BrainCircuit size={18} className="text-blue-600"/> 
                      24-Month Forecasting Model & Analytics
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-[10px] ml-1 flex items-center h-fit" title="Year-to-Date total cases">
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

          <div className="h-[400px] w-full">
              <ResponsiveContainer>
                  <ComposedChart data={chartDisplayData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#7398c9" />
                      
                      <XAxis dataKey="display" tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px', fontSize: '11px', fontWeight: 'bold', color: '#1E293B'}} />
                      
                      <Bar dataKey="raw" name="Total Actual Cases" fill="#3B82F6" radius={[4,4,0,0]} barSize={20} isAnimationActive={false} />
                      <Line type="monotone" dataKey="sma12" name="12M SMA (Seasonality)" stroke="#000000" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} connectNulls={true} />
                      <Line type="monotone" dataKey="sma6" name="6M SMA (Mid-Term)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="sma3" name="3M SMA (Short-Term)" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="wma3" name="3M WMA (Fast Signal)" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="forecast" name="Forecast vs Actual" stroke="#EF4444" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#EF4444' }} isAnimationActive={false} connectNulls={false} />
                  </ComposedChart>
              </ResponsiveContainer>
          </div>
          
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BrainCircuit size={14}/> Algorithmic Chart Interpretation</h4>
              
              {hasEnoughData ? (
                  <div className="text-sm font-medium text-slate-600 leading-relaxed">
                      <p className="mb-2">
                        Based on recent trajectory data, the mathematical model projects an estimated <strong className="text-slate-900">{projectedNextMonth !== null ? projectedNextMonth : '--'} cases</strong> for the upcoming reporting period. 
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 text-yellow-400 shadow-sm shrink-0">
                            <Calculator size={20} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Chart Guide & Mathematical Formulas</h3>
                            <p className="text-xs font-medium text-slate-500">Underlying computations for ABTC Predictive Analytics</p>
                        </div>
                    </div>
                    <button onClick={() => setShowMathModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 active:scale-90 rounded-full transition-all shrink-0">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="overflow-y-auto p-5 sm:p-6 space-y-8 custom-scrollbar bg-white">
                    
                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <Info size={16} className="text-blue-500"/> Chart Legend & Indicators
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-4 rounded-sm bg-blue-500 shrink-0 mt-0.5 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">Total Actual Cases</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">The confirmed, true number of animal bite patients recorded and approved in the system for that specific month.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-1 bg-emerald-500 shrink-0 mt-2 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">3M SMA (Short-Term)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">The average cases over the last 3 months. It smooths out sudden, daily jumps to show you the immediate, active trend.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-1.5 bg-purple-500 shrink-0 mt-1.5 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">3M WMA (Fast Signal)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">An "early warning radar." It averages the last 3 months but multiplies the most recent month by 3. Because it reacts to sudden spikes faster than the SMA, the system uses this line to trigger <strong>Rising Trend</strong> alerts.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-1 bg-amber-500 shrink-0 mt-2 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">6M SMA (Mid-Term)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">The average cases over the last half-year. This serves as your standard baseline. If current cases spike massively above this orange line, the system triggers an <strong>Outbreak Anomaly</strong> alert.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-0.5 border-t-2 border-dashed border-black shrink-0 mt-2"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">12M SMA (Seasonality)</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">The long-term average over the past full year. This line helps you see the "big picture" and accounts for annual seasonality (like cases always rising during summer).</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-0.5 border-t-[3px] border-dashed border-red-500 shrink-0 mt-2"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">Forecast vs Actual</h5>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">The system’s predictions. On historical months, it shows what the model <em>guessed</em> would happen so you can compare it against the true blue bar. On the furthest right, it projects the expected cases for the next month.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <ActivitySquare size={16} className="text-blue-500"/> Moving Averages (Formulas)
                        </h4>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">Simple Moving Average (SMA 3, 6, 12)</h5>
                                <p className="text-xs text-slate-600 mb-3">Calculates the unweighted mean of cases over the previous <em>n</em> months. Used to establish short-term smoothing, mid-term trends, and long-term seasonality baselines.</p>
                                <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 font-mono text-sm sm:text-base font-semibold text-slate-800 flex justify-center shadow-sm">
                                    SMA<sub>n</sub> = ( Case<sub>1</sub> + Case<sub>2</sub> + ... + Case<sub>n</sub> ) / n
                                </div>
                                <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 font-medium leading-relaxed shadow-sm">
                                    <strong className="block mb-1">Step-by-Step Example:</strong> 
                                    If your cases for the last 3 months were <strong>10</strong>, <strong>20</strong>, and <strong>15</strong>:<br/>
                                    SMA = (10 + 20 + 15) ÷ 3 months = <strong>15 average cases</strong>.
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">Weighted Moving Average (WMA 3)</h5>
                                <p className="text-xs text-slate-600 mb-3">A "Fast Signal" indicator that gives higher mathematical weight to more recent months to detect sudden changes faster than a standard SMA.</p>
                                <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 font-mono text-sm sm:text-base font-semibold text-slate-800 flex flex-col items-center shadow-sm gap-1.5">
                                    <span>WMA<sub>3</sub> = [ (Case<sub>m-2</sub> × 1) + (Case<sub>m-1</sub> × 2) + (Case<sub>m</sub> × 3) ] / 6</span>
                                    <span className="text-[10px] sm:text-xs font-normal text-slate-400 mt-1 italic">Where Case<sub>m</sub> is the most recent month.</span>
                                </div>
                                <div className="mt-3 p-4 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-900 font-medium leading-relaxed shadow-sm">
                                    <strong className="block mb-1">Step-by-Step Example:</strong> 
                                    Using those same cases (10, 20, 15), WMA multiplies the newest month by 3, the middle by 2, and the oldest by 1:<br/>
                                    Step 1: (10 × 1) + (20 × 2) + (15 × 3) = 10 + 40 + 45 = <strong>95 total weighted cases</strong>.<br/>
                                    Step 2: 95 ÷ 6 (the total weights added together) = 15.8 ≈ <strong>16 cases</strong>.<br/>
                                    <span className="text-[11px] italic opacity-80 mt-2 block">*Notice the WMA (16) is slightly higher than the SMA (15) because it mathematically paid more attention to the recent spikes.</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">High-Risk Rabies Indicator (Score)</h5>
                                <p className="text-xs text-slate-600 mb-3">Isolates the most severe exposure types (Category 3 and Stray Animals) to detect potential rabid animal incidents before total volume spikes.</p>
                                <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 font-mono text-sm sm:text-base font-semibold text-slate-800 flex flex-col items-center shadow-sm gap-1.5 text-center">
                                    <span>High-Risk Score = Category 3 Cases + Stray Animal Bites</span>
                                    <span className="text-[10px] sm:text-xs font-normal text-slate-400 mt-1 italic">Alert Threshold: Current Score &gt; (SMA<sub>6</sub> of Score × {HIGH_RISK_SENSITIVITY})</span>
                                </div>
                                <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-lg text-xs text-red-900 font-medium leading-relaxed shadow-sm">
                                    <strong className="block mb-1">Step-by-Step Example:</strong> 
                                    If the 6-month average (SMA) of high-risk cases is <strong>4</strong>, and your system's high-risk sensitivity is <strong>{((HIGH_RISK_SENSITIVITY - 1) * 100).toFixed(0)}% ({HIGH_RISK_SENSITIVITY})</strong>:<br/>
                                    Step 1: Calculate Threshold: 4 × {HIGH_RISK_SENSITIVITY} = <strong>{4 * HIGH_RISK_SENSITIVITY} allowed high-risk cases</strong>.<br/>
                                    Step 2: If the current month reports <strong>8</strong> high-risk cases (e.g. 5 Cat 3 + 3 Strays), the system triggers a <strong>CRITICAL ALERT</strong> because 8 is greater than the allowed threshold.<br/>
                                    <span className="text-[11px] italic opacity-80 mt-2 block">*Note: The system requires a minimum of 3 high-risk cases in a given month to trigger, preventing false alarms in low-volume clinics.</span>
                                </div>
                            </div>

                        </div>
                    </section>

                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500"/> Forecast Error & Confidence
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">Avg. Case Variance (MAE)</h5>
                                <p className="text-[11px] text-slate-600 mb-3 flex-1">Mean Absolute Error. Measures the average magnitude of errors in predictions without considering their direction. Represents the absolute number of cases the forecast is off by.</p>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm font-semibold text-slate-800 text-center shadow-sm flex items-center justify-center min-h-[44px]">
                                    MAE = ( Σ | Actual - Forecast | ) / n
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">Avg. Error Rate (sMAPE)</h5>
                                <p className="text-[11px] text-slate-600 mb-3 flex-1">Symmetric Mean Absolute Percentage Error. Expresses error as a percentage. Uses a "symmetric" formula to safely handle zero-case periods without breaking. System Confidence is derived from this (100% - sMAPE).</p>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs sm:text-[13px] font-semibold text-slate-800 text-center shadow-sm flex items-center justify-center min-h-[44px]">
                                    sMAPE = ( Σ [ 2 × |Act - For| / (|Act| + |For|) ] ) / n × 100
                                </div>
                            </div>
                            
                            <div className="mt-1 col-span-1 md:col-span-2 p-5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 font-medium leading-relaxed shadow-sm">
                                <strong className="block mb-3 text-sm text-emerald-950 flex items-center gap-2">How the Average is Calculated (2-Month Example):</strong>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="underline decoration-emerald-300 underline-offset-2 font-bold mb-1 block text-slate-800">Month 1:</span> 
                                        <span className="text-slate-600">Predicted 50, but Actual was 60.</span><br/>
                                        <span className="text-slate-600">• We missed by <strong>10 cases</strong>.</span><br/>
                                        <span className="text-slate-600">• % Error: (2×10) / (60+50) = <strong>18.1% error</strong></span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="underline decoration-emerald-300 underline-offset-2 font-bold mb-1 block text-slate-800">Month 2:</span> 
                                        <span className="text-slate-600">Predicted 40, but Actual was 30.</span><br/>
                                        <span className="text-slate-600">• We missed by <strong>10 cases</strong>.</span><br/>
                                        <span className="text-slate-600">• % Error: (2×10) / (30+40) = <strong>28.5% error</strong></span>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-emerald-200/60">
                                    <div className="flex flex-col gap-1.5">
                                        <span>• <strong>Avg. Case Variance (MAE):</strong> (10 + 10) ÷ 2 months = <strong>±10 cases off target overall</strong>.</span>
                                        <span>• <strong>Avg. Error Rate (sMAPE):</strong> (18.1% + 28.5%) ÷ 2 months = <strong>23.3% total margin of error</strong>.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <BrainCircuit size={16} className="text-purple-500"/> Smart Alert Engine Logic
                        </h4>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start bg-red-50 p-3.5 rounded-xl border border-red-100">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-red-900 mb-1">High-Risk Rabies Indicator (CRITICAL RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-red-200 px-2.5 py-1.5 rounded inline-block text-red-800 mb-1.5">
                                        Condition: (Cat 3 + Strays) &gt; (SMA<sub>6</sub> Cat 3 + Strays × {HIGH_RISK_SENSITIVITY})
                                    </div>
                                    <p className="text-[11px] text-red-700 leading-relaxed">A specialized alert that tracks the highest-risk exposure types. Triggers when the combined volume of Category 3 cases and stray animal bites suddenly spikes above its historical 6-month average, indicating a high probability of a rabid animal incident.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start bg-red-50 p-3.5 rounded-xl border border-red-100">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-red-900 mb-1">Volume Anomaly Detected (HIGH RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-red-200 px-2.5 py-1.5 rounded inline-block text-red-800 mb-1.5">
                                        Condition: Total Cases &gt; (SMA<sub>6</sub> × {OUTBREAK_SENSITIVITY})
                                    </div>
                                    <p className="text-[11px] text-red-700 leading-relaxed">Triggers when total current cases exceed the general mid-term 6-month baseline by the threshold defined in settings (currently {(OUTBREAK_SENSITIVITY - 1) * 100}%).</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 items-start bg-red-50 p-3.5 rounded-xl border border-red-100">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-red-900 mb-1">Sustained Risk Detected (HIGH RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-red-200 px-2.5 py-1.5 rounded inline-block text-red-800 mb-1.5">
                                        Condition: Rising Trend Active AND Current SMA<sub>6</sub> &gt; Previous SMA<sub>6</sub>
                                    </div>
                                    <p className="text-[11px] text-red-700 leading-relaxed">Indicates a compounding threat. Triggers when the fast-signal detects a short-term acceleration at the exact same time that the mid-term 6-month baseline is actively expanding.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start bg-amber-50 p-3.5 rounded-xl border border-amber-100">
                                <TrendingUp size={16} className="text-amber-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-amber-900 mb-1">Rising Trend Signal (MODERATE RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-amber-200 px-2.5 py-1.5 rounded inline-block text-amber-800 mb-1.5">
                                        Condition: [ (WMA<sub>3</sub> - SMA<sub>3</sub>) / SMA<sub>3</sub> ] × 100 &gt; {TREND_SENSITIVITY}%
                                    </div>
                                    <p className="text-[11px] text-amber-700 leading-relaxed">Triggers when the fast-signal WMA detects an acceleration in cases that exceeds the standard short-term average by the defined threshold (currently {TREND_SENSITIVITY}%).</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 items-start bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-emerald-900 mb-1">Decreasing or Stable Trend (LOW RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-emerald-200 px-2.5 py-1.5 rounded inline-block text-emerald-800 mb-1.5">
                                        Condition: [ (WMA<sub>3</sub> - SMA<sub>3</sub>) / SMA<sub>3</sub> ] × 100 &lt; {TREND_SENSITIVITY}%
                                    </div>
                                    <p className="text-[11px] text-emerald-700 leading-relaxed">Indicates that the current case volume is dropping or remaining stable within the normal expected variance. No immediate action is required.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-xl">
                        <h5 className="font-bold text-xs text-slate-700 mb-1 uppercase tracking-widest flex items-center gap-1">
                            <Info size={14}/> System Disclaimer
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            These projections are calculated using historical statistical probabilities, not clinical diagnoses. Forecasting models smooth out data to find mathematical trends, but sudden real-world events (such as local mass-vaccination drives, reporting delays, or sudden outbreaks) will cause actual cases to deviate from these projections. Always combine these insights with on-the-ground epidemiological judgment.
                        </p>
                    </div>

                </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}