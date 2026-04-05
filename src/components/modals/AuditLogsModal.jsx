import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Loader2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ModalPortal from './ModalPortal';

export default function AuditLogsModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Server-Side Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // 1. Calculate the exact database range we need to fetch
        const fromIndex = (currentPage - 1) * logsPerPage;
        const toIndex = fromIndex + logsPerPage - 1;

        // 2. Fetch data WITH count: 'exact', and use .range() instead of .limit()
        const { data, count, error } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact' }) // This gets the total database rows safely
          .order('created_at', { ascending: false })
          .range(fromIndex, toIndex);      // This only downloads the rows for this page

        if (error) throw error;
        
        setLogs(data || []);
        if (count !== null) setTotalLogsCount(count);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage, logsPerPage]); // Re-fetch whenever the user changes the page or the limit

  const getActionBadge = (action) => {
    switch (action) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'SUBMITTED': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'DELETED': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getActorFallback = (action) => {
    if (action === 'APPROVED' || action === 'REJECTED') return 'PHO Admin';
    return 'Facility User';
  };

  // --- Calculate total pages safely based on Server Count ---
  const totalPages = Math.ceil(totalLogsCount / logsPerPage) || 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative border border-slate-200 animate-in zoom-in-95 duration-200">

          {/* Dark Header - Compact Version */}
          <div className="bg-slate-900 p-4 sm:p-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2 rounded-lg text-yellow-400 shadow-inner border border-slate-700">
                <ShieldCheck size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">System Audit Logs</h2>
                <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest leading-none">
                  PROVINCIAL SECURITY TRAIL & ACTIVITY RECORD
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-90 active:bg-slate-600 rounded-full transition-all duration-200"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Table Body - Mobile Scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3 text-blue-500" />
                <p className="text-xs font-semibold">Loading secure logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed mx-2 sm:mx-0">
                <ClipboardList size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-semibold text-slate-500">No audit logs recorded yet.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 shadow-sm bg-white w-full overflow-hidden flex flex-col">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-[10px] sm:text-[11px] min-w-[800px]">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 w-1/5">Facility</th>
                        <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 text-center w-24">Status</th>
                        <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 w-1/6">Type of Report</th>
                        <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 w-1/6">Period</th>
                        <th className="py-2.5 px-3 sm:px-4 border-r border-slate-200 w-1/6">Timestamp</th>
                        <th className="py-2.5 px-3 sm:px-4 text-indigo-700 w-1/5">Action By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Notice we are mapping through 'logs' now, not 'currentLogs', because 'logs' ONLY contains the 10 rows for this page! */}
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                          <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-800 border-r border-slate-100">{log.facility_name}</td>
                          <td className="py-2.5 px-3 sm:px-4 border-r border-slate-100 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${getActionBadge(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-600 border-r border-slate-100">{log.report_type}</td>
                          <td className="py-2.5 px-3 sm:px-4 font-black text-slate-700 border-r border-slate-100 tracking-tight">{log.period_info}</td>
                          <td className="py-2.5 px-3 sm:px-4 text-slate-500 font-medium whitespace-nowrap border-r border-slate-100">
                            {new Date(log.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 font-bold text-indigo-600">{log.actor_name || getActorFallback(log.action)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-3 border-t border-slate-200 bg-white shrink-0 gap-4">
              
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-slate-500">
                <span>Show</span>
                <select 
                  value={logsPerPage} 
                  onChange={(e) => { setLogsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                  className="bg-slate-50 border border-slate-200 rounded p-1 outline-none focus:ring-2 focus:ring-slate-900/20 font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>logs per page</span>
              </div>

              <div className="flex items-center gap-4 text-[10px] sm:text-xs font-medium text-slate-500">
                <span>Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong> (Total Records: <strong className="text-slate-900">{totalLogsCount}</strong>)</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              
            </div>
          )}

        </div>
      </div>
    </ModalPortal>
  );
}