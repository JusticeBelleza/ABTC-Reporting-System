import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar, Line } from 'recharts';
import { BrainCircuit, Download, Calculator, X, TrendingUp, AlertTriangle, CheckCircle2, ActivitySquare, Info } from 'lucide-react';
import ModalPortal from '../modals/ModalPortal';

export default function PredictiveModel({
  year, full24MonthData, handleDownload, showMathModal, setShowMathModal,
  OUTBREAK_SENSITIVITY, TREND_SENSITIVITY, TOOLTIP_STYLE,
  projectedNextMonth, riskLevel, currentTotal = 0,
  modelMetrics = { accuracy: 0, mae: 0, mape: 0, validMonths: 0 } 
}) {
  
  // 1. Grab exactly the 13 months being displayed on the chart
  const chartDisplayData = full24MonthData.slice(-13);
  
  // 2. Mathematically sum up ONLY the blue bars visible on the screen
  const exactChartTotal = chartDisplayData
    .filter(d => d.year === year) 
    .reduce((sum, d) => sum + (d.raw || 0), 0);

  const validDataCount = full24MonthData.filter(d => d.raw !== null).length;
  const hasEnoughData = validDataCount >= 3 && projectedNextMonth !== null;

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group" id="chart-predictive">
          <div className="flex justify-between items-start mb-8">
              <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <BrainCircuit size={18} className="text-blue-600"/> 
                      24-Month Forecasting Model & Error Tracking
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-[10px] ml-1 flex items-center h-fit" title="Total actual cases currently displayed in this chart">
                          N = {exactChartTotal}
                      </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Multi-layered moving averages (Adaptive) for short-term reaction and long-term seasonality.</p>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setShowMathModal(true)} className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"><Calculator size={16} className="shrink-0"/><span className="hidden sm:inline">View Math & Formulas</span></button>
                  <button onClick={() => handleDownload('chart-predictive', `Predictive_${year}.png`)} className="p-2 text-slate-400 border border-transparent hover:border-slate-200 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Download size={18}/></button>
              </div>
          </div>

          <div className="h-[400px] w-full">
              <ResponsiveContainer>
                  <ComposedChart data={chartDisplayData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="display" tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px', fontSize: '11px', fontWeight: 'bold', color: '#1E293B'}} />
                      
                      <Bar dataKey="raw" name="Actual Cases" fill="#3B82F6" radius={[4,4,0,0]} barSize={20} isAnimationActive={false} />
                      <Line type="monotone" dataKey="sma12" name="12M SMA (Seasonality)" stroke="#000000" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} connectNulls={true} />
                      <Line type="monotone" dataKey="sma6" name="6M SMA (Mid-Term)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="sma3" name="3M SMA (Short-Term)" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="wma3" name="3M WMA (Fast Signal)" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} isAnimationActive={false} connectNulls={false} />
                      <Line type="monotone" dataKey="forecast" name="Forecast vs Actual" stroke="#EF4444" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#EF4444' }} isAnimationActive={false} connectNulls={false} />
                  </ComposedChart>
              </ResponsiveContainer>
          </div>
          
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><BrainCircuit size={14}/> Algorithmic Chart Interpretation</h4>
              
              {hasEnoughData ? (
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      Based on historical trends, the model projects <strong className="text-slate-900">{projectedNextMonth !== null ? projectedNextMonth : '--'} cases</strong> for the next reporting period. 
                      Current case volume is classified as <strong className={`${riskLevel === 'HIGH' ? 'text-red-600' : riskLevel === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'}`}>{riskLevel || 'LOW'} RISK</strong>, 
                      indicating that volume is {riskLevel === 'HIGH' ? 'significantly exceeding normal baselines (Outbreak Anomaly)' : riskLevel === 'MODERATE' ? 'accelerating faster than the short-term average (Rising Trend)' : 'stable and tracking within expected historical baselines'}. 
                      Historically, this forecasting model has operated with an accuracy of <strong className="text-slate-900">{modelMetrics.accuracy}%</strong>.
                  </p>
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
                
                <div className="overflow-y-auto p-5 sm:p-6 space-y-8 custom-scrollbar">
                    
                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <Info size={16} className="text-blue-500"/> Chart Legend & Indicators
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-4 rounded-sm bg-blue-500 shrink-0 mt-0.5 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">Actual Cases</h5>
                                    <p className="text-[11px] text-slate-600">The confirmed, true number of animal bite patients recorded and approved in the system for that specific month.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-1 bg-emerald-500 shrink-0 mt-2 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">3M SMA (Short-Term)</h5>
                                    <p className="text-[11px] text-slate-600">The average cases over the last 3 months. It smooths out sudden, daily jumps to show you the immediate, active trend.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-1.5 bg-purple-500 shrink-0 mt-1.5 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">3M WMA (Fast Signal)</h5>
                                    <p className="text-[11px] text-slate-600">An "early warning radar." It averages the last 3 months but multiplies the most recent month by 3. Because it reacts to sudden spikes faster than the SMA, the system uses this line to trigger <strong>Rising Trend</strong> alerts.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-1 bg-amber-500 shrink-0 mt-2 shadow-sm"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">6M SMA (Mid-Term)</h5>
                                    <p className="text-[11px] text-slate-600">The average cases over the last half-year. This serves as your standard baseline. If current cases spike massively above this orange line, the system triggers an <strong>Outbreak Anomaly</strong> alert.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-0.5 border-t-2 border-dashed border-black shrink-0 mt-2"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">12M SMA (Seasonality)</h5>
                                    <p className="text-[11px] text-slate-600">The long-term average over the past full year. This line helps you see the "big picture" and accounts for annual seasonality (like cases always rising during summer).</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                <div className="w-4 h-0.5 border-t-[3px] border-dashed border-red-500 shrink-0 mt-2"></div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 mb-0.5">Forecast vs Actual</h5>
                                    <p className="text-[11px] text-slate-600">The system’s predictions. On historical months, it shows what the model <em>guessed</em> would happen so you can compare it against the true blue bar. On the furthest right, it projects the expected cases for the next month.</p>
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
                                <div className="mt-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 font-medium">
                                    <strong>Example:</strong> If cases for Jan, Feb, and Mar are 10, 20, and 15:<br/>
                                    SMA 3 for March = (10 + 20 + 15) / 3 = <strong>15 cases</strong>.
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">Weighted Moving Average (WMA 3)</h5>
                                <p className="text-xs text-slate-600 mb-3">A "Fast Signal" indicator that gives higher mathematical weight to more recent months to detect sudden changes faster than a standard SMA.</p>
                                <div className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 font-mono text-sm sm:text-base font-semibold text-slate-800 flex flex-col items-center shadow-sm gap-1.5">
                                    <span>WMA<sub>3</sub> = [ (Case<sub>m-2</sub> × 1) + (Case<sub>m-1</sub> × 2) + (Case<sub>m</sub> × 3) ] / 6</span>
                                    <span className="text-[10px] sm:text-xs font-normal text-slate-400 mt-1 italic">Where Case<sub>m</sub> is the most recent month.</span>
                                </div>
                                <div className="mt-3 p-2.5 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-800 font-medium">
                                    <strong>Example:</strong> Using Jan=10, Feb=20, Mar=15, the WMA gives most weight to the newest month (Mar × 3).<br/>
                                    WMA 3 = [(10 × 1) + (20 × 2) + (15 × 3)] / 6 = [10 + 40 + 45] / 6 = 15.8 ≈ <strong>16 cases</strong>.<br/>
                                    <span className="text-[11px] italic opacity-80 mt-1 inline-block">*Notice how WMA is higher than SMA because it reacted to the recent spike. The system always rounds to the nearest whole patient.</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500"/> Forecast Error & Accuracy
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">Mean Absolute Error (MAE)</h5>
                                <p className="text-[11px] text-slate-600 mb-3 flex-1">Measures the average magnitude of errors in predictions without considering their direction. Represents the absolute number of cases the forecast is off by.</p>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm font-semibold text-slate-800 text-center shadow-sm flex items-center justify-center min-h-[44px]">
                                    MAE = ( Σ | Actual - Forecast | ) / n
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full">
                                <h5 className="font-bold text-sm text-slate-900 mb-1">Mean Absolute Percentage Error (MAPE)</h5>
                                <p className="text-[11px] text-slate-600 mb-3 flex-1">Expresses forecast error as a percentage relative to actual cases. Overall System Accuracy is derived mathematically from this value (100% - MAPE).</p>
                                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs sm:text-sm font-semibold text-slate-800 text-center shadow-sm flex items-center justify-center min-h-[44px]">
                                    MAPE = ( Σ | Actual - Forecast | / Actual ) / n × 100
                                </div>
                            </div>
                            <div className="mt-1 col-span-1 md:col-span-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] sm:text-xs text-emerald-800 font-medium">
                                <strong>Example:</strong> If the model forecasted 15 cases, but actual cases were 20:<br/>
                                • <strong>MAE (Count Error):</strong> | 20 - 15 | = <strong>5 cases off target</strong>.<br/>
                                • <strong>MAPE (Percentage Error):</strong> (5 / 20) × 100 = <strong>25% margin of error</strong>.
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
                                    <h5 className="font-bold text-xs text-red-900 mb-1">Outbreak Anomaly Detected (HIGH RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-red-200 px-2.5 py-1.5 rounded inline-block text-red-800 mb-1.5">
                                        Condition: Actual Cases &gt; (SMA<sub>6</sub> × {OUTBREAK_SENSITIVITY})
                                    </div>
                                    <p className="text-[11px] text-red-700">Triggers when current cases exceed the mid-term 6-month baseline by the threshold defined in settings (currently {(OUTBREAK_SENSITIVITY - 1) * 100}%).</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 items-start bg-red-50 p-3.5 rounded-xl border border-red-100">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-red-900 mb-1">Sustained Risk Detected (HIGH RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-red-200 px-2.5 py-1.5 rounded inline-block text-red-800 mb-1.5">
                                        Condition: Rising Trend Active AND Current SMA<sub>6</sub> &gt; Previous SMA<sub>6</sub>
                                    </div>
                                    <p className="text-[11px] text-red-700">Indicates a compounding threat. Triggers when the fast-signal detects a short-term acceleration at the exact same time that the mid-term 6-month baseline is actively expanding.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start bg-amber-50 p-3.5 rounded-xl border border-amber-100">
                                <TrendingUp size={16} className="text-amber-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-amber-900 mb-1">Rising Trend Signal (MODERATE RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-amber-200 px-2.5 py-1.5 rounded inline-block text-amber-800 mb-1.5">
                                        Condition: [ (WMA<sub>3</sub> - SMA<sub>3</sub>) / SMA<sub>3</sub> ] × 100 &gt; {TREND_SENSITIVITY}%
                                    </div>
                                    <p className="text-[11px] text-amber-700">Triggers when the fast-signal WMA detects an acceleration in cases that exceeds the standard short-term average by the defined threshold (currently {TREND_SENSITIVITY}%).</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5"/>
                                <div>
                                    <h5 className="font-bold text-xs text-emerald-900 mb-1">Decreasing or Stable Trend (LOW RISK)</h5>
                                    <div className="font-mono text-xs sm:text-sm font-semibold bg-white border border-emerald-200 px-2.5 py-1.5 rounded inline-block text-emerald-800 mb-1.5">
                                        Condition: [ (WMA<sub>3</sub> - SMA<sub>3</sub>) / SMA<sub>3</sub> ] × 100 &lt; {TREND_SENSITIVITY}%
                                    </div>
                                    <p className="text-[11px] text-emerald-700">Indicates that the current case volume is dropping or remaining stable within the normal expected variance. No immediate action is required.</p>
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