import React from 'react';
import { BrainCircuit, Zap, AlertTriangle, TrendingUp, TrendingDown, Info, ActivitySquare, Target, Loader2 } from 'lucide-react';

export default function SmartAlertsPanel({ riskLevel, smartAlerts, projectedNextMonth, modelMetrics }) {
  
  const getAlertStyle = (type) => {
      switch(type) {
          case 'critical': 
              return { wrapper: 'border-l-red-500 bg-white border-y-slate-200 border-r-slate-200', icon: <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18}/>, title: 'text-red-700' };
          case 'warning': 
              return { wrapper: 'border-l-amber-500 bg-white border-y-slate-200 border-r-slate-200', icon: <TrendingUp className="text-amber-500 mt-0.5 shrink-0" size={18}/>, title: 'text-amber-700' };
          case 'success': 
              return { wrapper: 'border-l-emerald-500 bg-white border-y-slate-200 border-r-slate-200', icon: <TrendingDown className="text-emerald-500 mt-0.5 shrink-0" size={18}/>, title: 'text-emerald-700' };
          default: 
              return { wrapper: 'border-l-blue-500 bg-white border-y-slate-200 border-r-slate-200', icon: <Info className="text-blue-500 mt-0.5 shrink-0" size={18}/>, title: 'text-slate-800' };
      }
  };

  // Safety net so if Accuracy is exactly 0.0, it falls back to Calibrating
  const isCalibratingAccuracy = modelMetrics.validMonths < 3 || Number(modelMetrics.accuracy) === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT COLUMN: ALERTS & INSIGHTS */}
        <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-[0.02] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <BrainCircuit size={240} className="text-slate-900"/>
            </div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                        <Zap size={16} className="text-blue-600"/> System Insights
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-1">Algorithmic trend analysis and anomaly detection</p>
                </div>
                <div className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest border shadow-sm ${
                    riskLevel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 
                    riskLevel === 'MODERATE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                    RISK LEVEL: {riskLevel || 'LOW'}
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                {smartAlerts.length > 0 ? smartAlerts.map((alert, i) => {
                    const style = getAlertStyle(alert.type);
                    return (
                        <div key={i} className={`p-4 rounded-xl flex items-start gap-3.5 border border-l-4 shadow-sm transition-all hover:shadow-md ${style.wrapper}`}>
                            {style.icon}
                            <div>
                                <h4 className={`font-bold text-sm mb-0.5 ${style.title}`}>{alert.title}</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{alert.desc}</p>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="p-5 bg-white border border-slate-200 border-dashed rounded-xl text-slate-500 text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
                        <Info className="text-slate-400" size={16}/> Analyzing data trends. Need more historical baseline data.
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: PROJECTION & METRICS */}
        <div className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Top Half: Projection */}
            <div className="p-6 flex-1 flex flex-col items-center justify-center relative">
                <div className="absolute top-5 left-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <ActivitySquare size={14} className="text-blue-500"/> Projection
                    </p>
                </div>
                
                <div className="text-center mt-6">
                    <h3 className="text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                        {projectedNextMonth !== null ? projectedNextMonth : '--'}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">Expected Cases Next Month</p>
                    <div className="inline-block mt-3 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                        Based on Active Trend
                    </div>
                </div>
            </div>
            
            {/* Bottom Half: KPIs (Dark Mode) */}
            <div className="bg-slate-900 p-5 text-white flex flex-col justify-center border-t border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Target size={14} className="text-blue-400"/> Model Confidence
                </p>
                {isCalibratingAccuracy ? (
                    <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-700 shadow-inner flex flex-col items-center justify-center h-[76px]">
                         <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-blue-400" /> Calibrating
                         </p>
                         <p className="text-[9px] text-slate-500 mt-1">Awaiting historical data</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700 shadow-inner" title="Historical prediction accuracy">
                            <div className="text-lg font-black text-white">{modelMetrics.accuracy}%</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accuracy</div>
                        </div>
                        <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700 shadow-inner" title="Mean Absolute Error (Average cases off target)">
                            <div className="text-lg font-black text-white">±{modelMetrics.mae}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">MAE</div>
                        </div>
                        <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-700 shadow-inner" title="Symmetric Mean Absolute Percentage Error">
                            <div className="text-lg font-black text-white">{modelMetrics.mape}%</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">sMAPE</div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    </div>
  );
}