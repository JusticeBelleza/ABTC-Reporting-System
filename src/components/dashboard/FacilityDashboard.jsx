import React, { useState } from 'react';
import { Save, AlertCircle, Loader2, FileDown, CheckCircle, XCircle, ArrowLeft, MessageSquare, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from './StatusBadge';
import { MONTHS, QUARTERS, PDF_STYLES } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';
import { downloadPDF } from '../../lib/utils';
import MainReportTable from '../reports/MainReportTable';
import CohortReportTable from '../reports/CohortReportTable';

export default function FacilityDashboard({
  periodType, setPeriodType,
  year, setYear,
  month, setMonth,
  quarter, setQuarter,
  availableYears, availableMonths,
  adminViewMode, selectedFacility, onBack,
  setReportToDelete
}) {
  const { user, facilities, facilityBarangays, globalSettings, userProfile } = useApp();
  const [activeTab, setActiveTab] = useState('main'); 
  const [cohortSubTab, setCohortSubTab] = useState('cat2'); 
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // --- MODAL STATES ---
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [deleteRowConfirmation, setDeleteRowConfirmation] = useState({ isOpen: false, rowKey: null }); 
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    data, cohortData, reportStatus, loading, isSaving, 
    currentRows, cohortRowsCat2, cohortRowsCat3, activeFacilityName, currentHostMunicipality,
    grandTotals, cohortTotals,
    visibleOtherMunicipalities, setVisibleOtherMunicipalities,
    visibleCat2, setVisibleCat2,
    visibleCat3, setVisibleCat3,
    handleChange, handleSave, confirmDeleteReport, handleDeleteRow
  } = useReportData({
    user, facilities, facilityBarangays, year, month, quarter, periodType, activeTab, cohortSubTab, adminViewMode, selectedFacility
  });

  const isConsolidatedView = adminViewMode === 'consolidated';
  const isAggregationMode = periodType !== 'Monthly';

  // Handlers
  const onSaveClick = async (status) => {
    if (status === 'Rejected') { setRejectionReason(''); setShowRejectModal(true); return; }
    await handleSave(status);
  };

  const confirmRejection = async () => { 
    if (!rejectionReason.trim()) { toast.error("Reason required"); return; } 
    setShowRejectModal(false); 
    await handleSave('Rejected', rejectionReason);
  };

  const handleDeleteReportClick = async () => {
    setShowDeleteReportModal(false);
    await confirmDeleteReport();
  };

  const confirmDeleteRow = () => {
    if (deleteRowConfirmation.rowKey) {
        handleDeleteRow(deleteRowConfirmation.rowKey);
        setDeleteRowConfirmation({ isOpen: false, rowKey: null });
        toast.success("Row cleared");
    }
  };

  const getPreviousPeriodText = () => {
    if (periodType === 'Annual') return `Annual ${year - 1}`;
    if (periodType === 'Quarterly') { const idx = QUARTERS.indexOf(quarter); if (idx === 0) return `4th Quarter ${year - 1}`; return `${QUARTERS[idx - 1]} ${year}`; }
    const idx = MONTHS.indexOf(month); if (idx === 0) return `December ${year - 1}`; return `${MONTHS[idx - 1]} ${year}`;
  };

  const handleDownloadClick = async () => {
    setIsDownloadingPdf(true);
    const periodText = activeTab === 'cohort' ? getPreviousPeriodText() : (periodType === 'Monthly' ? `${month} ${year}` : (periodType === 'Quarterly' ? `${quarter} ${year}` : `Annual ${year}`));
    const suffix = activeTab === 'cohort' ? (cohortSubTab === 'cat2' ? '_Category_II' : '_Category_III') : '';
    const filename = `Report_${activeFacilityName.replace(/\s+/g,'_')}_${year}${suffix}.pdf`;
    
    await downloadPDF({
        type: activeTab, cohortType: cohortSubTab, filename, data: activeTab === 'main' ? data : cohortData,
        rowKeys: activeTab === 'main' ? currentRows : (cohortSubTab === 'cat2' ? cohortRowsCat2 : cohortRowsCat3),
        grandTotals, cohortTotals, periodText, facilityName: activeFacilityName, userProfile, globalSettings,
        isConsolidated: isConsolidatedView
    });
    setIsDownloadingPdf(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
            <div className="flex items-center gap-4">
                {user.role === 'admin' && <button onClick={onBack} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"><ArrowLeft size={18}/></button>}
                <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    {isConsolidatedView ? 'Consolidated Report' : `${activeFacilityName}`}
                    {!isConsolidatedView && !isAggregationMode && periodType === 'Monthly' && <StatusBadge status={reportStatus} />}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>{periodType}</span> &bull; <span>{periodType === 'Monthly' ? month : (periodType === 'Quarterly' ? quarter : 'Annual')} {year}</span>
                </div>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm mr-4">
                    <button onClick={() => setActiveTab('main')} className={`px-4 py-1.5 text-sm font-medium rounded transition ${activeTab==='main'?'bg-zinc-900 text-white shadow':'text-gray-600 hover:bg-gray-50'}`}>Form 1</button>
                    <button onClick={() => setActiveTab('cohort')} className={`px-4 py-1.5 text-sm font-medium rounded transition ${activeTab==='cohort'?'bg-zinc-900 text-white shadow':'text-gray-600 hover:bg-gray-50'}`}>Cohort</button>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center shadow-sm">
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-900 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select>
                    <div className="w-px h-4 bg-gray-200"></div>
                    {periodType === 'Monthly' && <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{availableMonths.map(m => <option key={m}>{m}</option>)}</select>}
                    {periodType === 'Quarterly' && <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{QUARTERS.map(q => <option key={q}>{q}</option>)}</select>}
                    <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-transparent text-sm text-gray-600 p-1.5 px-3 outline-none cursor-pointer hover:bg-gray-50 rounded">{availableYears.map(y => <option key={y}>{y}</option>)}</select>
                </div>

                <button disabled={isDownloadingPdf} onClick={handleDownloadClick} className="bg-white border border-gray-200 text-zinc-900 px-3 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition disabled:opacity-70 hover:bg-red-50 hover:text-red-700">
                    {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} PDF
                </button>

                {!isConsolidatedView && !isAggregationMode && (
                    user.role === 'admin' ? (
                        <>
                        <button 
                            onClick={() => onSaveClick('Approved')} 
                            disabled={loading || isSaving || reportStatus === 'Approved' || reportStatus === 'Draft'} 
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve
                        </button>
                        
                        <button 
                            onClick={() => onSaveClick('Rejected')} 
                            disabled={loading || isSaving || reportStatus === 'Rejected' || reportStatus === 'Draft'} 
                            className="bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 shadow-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} Reject
                        </button>
                        
                        {/* UPDATED: Delete Button now disabled if reportStatus is Draft */}
                        <button 
                            onClick={() => setShowDeleteReportModal(true)} 
                            disabled={loading || isSaving || reportStatus === 'Draft'} 
                            className="bg-white border border-gray-200 text-red-600 p-2 rounded-lg text-sm font-medium hover:bg-red-50 shadow-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={18} />
                        </button>
                        </>
                    ) : (
                        <>
                        <button onClick={() => onSaveClick('Draft')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-white border border-gray-200 text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save</button>
                        <button onClick={() => onSaveClick('Pending')} disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 shadow-sm flex items-center gap-2 disabled:opacity-50 transition">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'Submit'}</button>
                        </>
                    )
                )}
            </div>
        </div>

        <div className="overflow-x-auto shadow-sm rounded-xl bg-white border border-gray-200 print:shadow-none print:border-none" style={{...PDF_STYLES.container, ...PDF_STYLES.border}}>
            {activeTab === 'main' ? (
                <MainReportTable 
                data={data} rowKeys={currentRows} isConsolidated={isConsolidatedView} isAggregationMode={isAggregationMode} reportStatus={reportStatus} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality} 
                visibleOtherMunicipalities={visibleOtherMunicipalities} setVisibleOtherMunicipalities={setVisibleOtherMunicipalities}
                onChange={handleChange} 
                onDeleteRow={(key) => setDeleteRowConfirmation({ isOpen: true, rowKey: key })} 
                grandTotals={grandTotals} facilityBarangays={facilityBarangays}
                />
            ) : (
                <div className="p-4">
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-xs italic rounded-lg border border-blue-100 flex items-center gap-2 no-print"><AlertCircle size={14} /><span><strong>Guide:</strong> Viewing Cohort Report. Reporting for <u>previous period</u>: <strong>{getPreviousPeriodText()}</strong>.</span></div>
                <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2 no-print">
                    <button onClick={() => setCohortSubTab('cat2')} className={`text-sm font-semibold pb-1 border-b-2 transition ${cohortSubTab==='cat2' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Category II</button>
                    <button onClick={() => setCohortSubTab('cat3')} className={`text-sm font-semibold pb-1 border-b-2 transition ${cohortSubTab==='cat3' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Category III</button>
                </div>
                <CohortReportTable 
                    subTab={cohortSubTab} data={cohortData} rowKeysCat2={cohortRowsCat2} rowKeysCat3={cohortRowsCat3} isConsolidated={isConsolidatedView} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality}
                    visibleCat2={visibleCat2} setVisibleCat2={setVisibleCat2} visibleCat3={visibleCat3} setVisibleCat3={setVisibleCat3}
                    onChange={handleChange} 
                    onDeleteRow={(key) => setDeleteRowConfirmation({ isOpen: true, rowKey: key })} 
                    cohortTotals={cohortTotals}
                />
                </div>
            )}
        </div>

        {/* --- REJECT MODAL --- */}
        {showRejectModal && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-rose-600 flex items-center gap-2"><MessageSquare size={20}/> Reject Report</h2><button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-zinc-900"><X size={20}/></button></div>
                    <p className="text-gray-600 text-sm mb-4">Please provide a reason for rejecting this report.</p>
                    <textarea className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition" rows={4} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} autoFocus placeholder="e.g. Incomplete data..."></textarea>
                    <div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition">Cancel</button><button onClick={confirmRejection} disabled={isSaving} className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-sm font-medium transition flex items-center gap-2">{isSaving && <Loader2 size={14} className="animate-spin"/>} Confirm Rejection</button></div>
                </div>
            </div>
        )}

        {/* --- DELETE REPORT CONFIRMATION MODAL --- */}
        {showDeleteReportModal && (
            <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col items-center text-center"><div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><AlertCircle size={24} /></div><h3 className="text-lg font-bold text-gray-900">Delete {activeTab === 'main' ? 'ABTC' : 'Cohort'} Report?</h3><p className="text-sm text-gray-500 mt-2 mb-6">Are you sure you want to delete the <strong>{activeTab === 'main' ? 'Main' : 'Cohort'}</strong> report? This action cannot be undone.</p><div className="flex gap-3 w-full"><button onClick={() => setShowDeleteReportModal(false)} disabled={isSaving} className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button><button onClick={handleDeleteReportClick} disabled={isSaving} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex justify-center items-center gap-2">{isSaving && <Loader2 size={14} className="animate-spin"/>} Delete</button></div></div>
                </div>
            </div>
        )}

        {/* --- DELETE ROW CONFIRMATION MODAL --- */}
        {deleteRowConfirmation.isOpen && (
             <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-red-50 p-3 rounded-full mb-4 text-red-600"><AlertCircle size={24} /></div>
                        <h3 className="text-lg font-bold text-gray-900">Remove Row?</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-6">Are you sure you want to remove <strong>{deleteRowConfirmation.rowKey}</strong>? Any data entered in this row will be lost.</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setDeleteRowConfirmation({ isOpen: false, rowKey: null })} className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={confirmDeleteRow} className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}