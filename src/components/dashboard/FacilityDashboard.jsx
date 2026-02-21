import React, { useState } from 'react';
import { Save, AlertCircle, Loader2, FileDown, CheckCircle, XCircle, ArrowLeft, MessageSquare, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { MONTHS, QUARTERS, PDF_STYLES } from '../../lib/constants';
import { useReportData } from '../../hooks/useReportData';
import { useApp } from '../../context/AppContext';
import { downloadPDF, hasData, hasCohortData } from '../../lib/utils';
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
  const [showApproveModal, setShowApproveModal] = useState(false); 
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [deleteRowConfirmation, setDeleteRowConfirmation] = useState({ isOpen: false, rowKey: null }); 
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Submit Confirmation Modal States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isZeroSubmit, setIsZeroSubmit] = useState(false);

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

  // --- ZERO REPORT BANNER LOGIC ---
  const isZeroReportActiveTab = activeTab === 'main' 
    ? currentRows.length > 0 && currentRows.every(key => key === "Others:" || !hasData(data[key]))
    : Object.keys(cohortData).length > 0 && Object.keys(cohortData).every(key => key === "Others:" || (!hasCohortData(cohortData[key], 'cat2') && !hasCohortData(cohortData[key], 'cat3')));

  const showZeroBanner = isZeroReportActiveTab && reportStatus !== 'Draft' && !loading;

  // Handlers
  const onSaveClick = async (status) => {
    if (status === 'Rejected') { setRejectionReason(''); setShowRejectModal(true); return; }
    
    if (status === 'Approved') {
        setShowApproveModal(true);
        return;
    }
    
    if (status === 'Pending') {
        let isZero = false;
        if (activeTab === 'main') {
            isZero = currentRows.every(key => key === "Others:" || !hasData(data[key]));
        } else {
            isZero = Object.keys(cohortData).every(key => key === "Others:" || (!hasCohortData(cohortData[key], 'cat2') && !hasCohortData(cohortData[key], 'cat3')));
        }
        setIsZeroSubmit(isZero);
        setShowSubmitModal(true);
        return;
    }

    await handleSave(status); 
  };

  const confirmApprove = async () => {
    setShowApproveModal(false);
    await handleSave('Approved');
  };

  const confirmRejection = async () => { 
    if (!rejectionReason.trim()) { toast.error("Reason required"); return; } 
    setShowRejectModal(false); 
    await handleSave('Rejected', rejectionReason);
  };

  const confirmSubmit = async () => {
    setShowSubmitModal(false);
    await handleSave('Pending');
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

  // --- PERIOD TEXT HELPERS ---
  const getCurrentPeriodText = () => {
    if (periodType === 'Annual') return `Annual ${year}`;
    if (periodType === 'Quarterly') return `${quarter} ${year}`;
    return `${month} ${year}`;
  };

  const getPreviousPeriodText = () => {
    if (periodType === 'Annual') return `Annual ${year - 1}`;
    if (periodType === 'Quarterly') { const idx = QUARTERS.indexOf(quarter); if (idx === 0) return `4th Quarter ${year - 1}`; return `${QUARTERS[idx - 1]} ${year}`; }
    const idx = MONTHS.indexOf(month); if (idx === 0) return `December ${year - 1}`; return `${MONTHS[idx - 1]} ${year}`;
  };

  const handleDownloadClick = async () => {
    setIsDownloadingPdf(true);
    
    // Use the dynamic text helper for the PDF Export
    const currentPeriodText = getCurrentPeriodText();
    const periodText = activeTab === 'cohort' 
        ? `${getPreviousPeriodText()} (Current Period: ${currentPeriodText})` 
        : currentPeriodText;
        
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
    <div className="max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-300 pb-12">
        {/* Top Header & Actions Row */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 mt-2 no-print">
            
            {/* Title Area */}
            <div className="flex items-start gap-4">
                {user.role === 'admin' && (
                    <button 
                        onClick={onBack} 
                        className="mt-1 p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all duration-200"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20}/>
                    </button>
                )}
                
                <div className="max-w-2xl">
                    <h2 className={`font-extrabold tracking-tight text-zinc-900 flex flex-wrap items-center gap-3 leading-tight
                        ${isConsolidatedView ? 'text-3xl' : 
                          activeFacilityName?.length > 50 ? 'text-xl' : 
                          activeFacilityName?.length > 30 ? 'text-2xl' : 
                          'text-3xl'}`}
                    >
                        <span>{isConsolidatedView ? 'Consolidated Report' : activeFacilityName}</span>
                        {!isConsolidatedView && !isAggregationMode && periodType === 'Monthly' && (
                            <div className="mt-1 shrink-0">
                                <StatusBadge status={reportStatus} />
                            </div>
                        )}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 text-sm font-medium text-gray-500">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">{periodType}</span> 
                        <span>&bull;</span> 
                        <span>{getCurrentPeriodText()}</span>
                    </div>
                </div>
            </div>
            
            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-4">
                
                {/* Form Tabs (Pill Style) */}
                <div className="bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 flex items-center shadow-inner">
                    <button 
                        onClick={() => setActiveTab('main')} 
                        className={`px-5 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab==='main'?'bg-white text-blue-700 shadow-sm border border-gray-200/50':'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        Form 1
                    </button>
                    <button 
                        onClick={() => setActiveTab('cohort')} 
                        className={`px-5 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab==='cohort'?'bg-white text-blue-700 shadow-sm border border-gray-200/50':'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        Cohort
                    </button>
                </div>
                
                {/* Date Filters (Pill Style) */}
                <div className="bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 inline-flex flex-wrap items-center gap-1 shadow-inner">
                    <select value={periodType} onChange={e => setPeriodType(e.target.value)} className="bg-white text-sm font-semibold text-zinc-800 py-1.5 px-3 outline-none cursor-pointer rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                    </select>
                    
                    <div className="w-px h-5 bg-gray-300 mx-1"></div>
                    
                    {periodType === 'Monthly' && (
                        <select value={month} onChange={e => setMonth(e.target.value)} disabled={loading} className="bg-transparent text-sm font-medium text-gray-600 py-1.5 px-3 outline-none cursor-pointer hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50">
                            {availableMonths.map(m => <option key={m}>{m}</option>)}
                        </select>
                    )}
                    
                    {periodType === 'Quarterly' && (
                        <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={loading} className="bg-transparent text-sm font-medium text-gray-600 py-1.5 px-3 outline-none cursor-pointer hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50">
                            {QUARTERS.map(q => <option key={q}>{q}</option>)}
                        </select>
                    )}
                    
                    <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading} className="bg-transparent text-sm font-medium text-gray-600 py-1.5 px-3 outline-none cursor-pointer hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50">
                        {availableYears.map(y => <option key={y}>{y}</option>)}
                    </select>
                </div>

                {/* --- PDF Download --- */}
                <button 
                    disabled={isDownloadingPdf || (!isConsolidatedView && reportStatus !== 'Approved')} 
                    onClick={handleDownloadClick} 
                    title={!isConsolidatedView && reportStatus !== 'Approved' ? "Only Approved reports can be exported to PDF." : "Export PDF"}
                    className="bg-white border border-gray-200 text-zinc-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                >
                    {isDownloadingPdf ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>} 
                    <span>Export PDF</span>
                </button>

                {/* Action Buttons */}
                {!isConsolidatedView && !isAggregationMode && (
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                    {user.role === 'admin' ? (
                        <>
                        <button 
                            onClick={() => onSaveClick('Approved')} 
                            disabled={loading || isSaving || reportStatus === 'Approved' || reportStatus === 'Draft'} 
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm hover:shadow-emerald-600/20 flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Approve
                        </button>
                        
                        <button 
                            onClick={() => onSaveClick('Rejected')} 
                            disabled={loading || isSaving || reportStatus === 'Rejected' || reportStatus === 'Draft'} 
                            className="bg-white border border-gray-200 text-rose-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-50 hover:border-rose-200 shadow-sm flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} Reject
                        </button>
                        
                        <button 
                            onClick={() => setShowDeleteReportModal(true)} 
                            disabled={loading || isSaving || reportStatus === 'Draft'} 
                            className="bg-white border border-gray-200 text-red-600 p-2 rounded-xl text-sm font-semibold hover:bg-red-50 hover:border-red-200 shadow-sm flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ml-1"
                            title="Delete Report"
                        >
                            <Trash2 size={18} />
                        </button>
                        </>
                    ) : (
                        <>
                        <button 
                            onClick={() => onSaveClick('Draft')} 
                            disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} 
                            className="bg-white border border-gray-200 text-zinc-700 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Draft
                        </button>
                        
                        <button 
                            onClick={() => onSaveClick('Pending')} 
                            disabled={loading || isSaving || reportStatus === 'Pending' || reportStatus === 'Approved'} 
                            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow-blue-600/20 flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin"/> : null} Submit Report
                        </button>
                        </>
                    )}
                    </div>
                )}
            </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-2xl print:rounded-none print:shadow-none print:border-none relative" style={{...PDF_STYLES.container}}>
            
            {/* --- ZERO REPORT BANNER DISPLAY --- */}
            {showZeroBanner && (
                <div className="bg-red-50 text-red-700 font-bold py-3 flex items-center justify-center gap-2 border-b border-red-200 rounded-t-2xl no-print tracking-widest shadow-inner">
                    <AlertCircle size={20} strokeWidth={2.5} />
                    *** ZERO CASE REPORT ***
                </div>
            )}

            {activeTab === 'main' ? (
                <MainReportTable 
                    data={data} rowKeys={currentRows} isConsolidated={isConsolidatedView} isAggregationMode={isAggregationMode} reportStatus={reportStatus} userRole={user.role} activeFacilityName={activeFacilityName} currentHostMunicipality={currentHostMunicipality} 
                    visibleOtherMunicipalities={visibleOtherMunicipalities} setVisibleOtherMunicipalities={setVisibleOtherMunicipalities}
                    onChange={handleChange} 
                    onDeleteRow={(key) => setDeleteRowConfirmation({ isOpen: true, rowKey: key })} 
                    grandTotals={grandTotals} facilityBarangays={facilityBarangays}
                />
            ) : (
                <div className="p-1">
                    {/* --- UPDATED GUIDE TEXT BANNER --- */}
                    <div className="mb-6 mt-4 mx-4 p-4 bg-blue-50/80 text-blue-800 text-sm rounded-xl border border-blue-100 flex items-center gap-3 no-print shadow-sm">
                        <AlertCircle size={18} className="text-blue-600 shrink-0" />
                        <span><strong>Guide:</strong> Viewing Cohort Report. Reporting for <u>previous period</u>: <strong>{getPreviousPeriodText()}</strong> (Current Period: <strong>{getCurrentPeriodText()}</strong>).</span>
                    </div>
                    
                    <div className="flex gap-6 mb-6 border-b border-gray-200 no-print px-6">
                        <button 
                            onClick={() => setCohortSubTab('cat2')} 
                            className={`text-sm font-bold pb-3 border-b-2 transition-all duration-200 ${cohortSubTab==='cat2' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Category II Exposures
                        </button>
                        <button 
                            onClick={() => setCohortSubTab('cat3')} 
                            className={`text-sm font-bold pb-3 border-b-2 transition-all duration-200 ${cohortSubTab==='cat3' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Category III Exposures
                        </button>
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

        {/* --- APPROVE CONFIRMATION MODAL --- */}
        {showApproveModal && (
            <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-emerald-50 p-4 rounded-full mb-5 text-emerald-600 shadow-inner">
                            <CheckCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Approve Report?</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to approve this report? Once approved, it will be included in the consolidated reporting.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setShowApproveModal(false)} 
                                disabled={isSaving} 
                                className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmApprove} 
                                disabled={isSaving} 
                                className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 hover:shadow-emerald-600/20 shadow-sm transition-all flex justify-center items-center gap-2"
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin"/>} Approve
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- SUBMIT CONFIRMATION MODAL --- */}
        {showSubmitModal && (
            <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className={`p-4 rounded-full mb-5 shadow-inner ${isZeroSubmit ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            <AlertCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                            {isZeroSubmit ? "Submit Zero Case Report?" : "Are you sure to submit report?"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                            {isZeroSubmit 
                                ? "You are about to submit a completely blank form. Are you sure you want to submit a ZERO CASE report?" 
                                : "Please verify that all data entries are correct before confirming submission."}
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setShowSubmitModal(false)} 
                                disabled={isSaving} 
                                className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmSubmit} 
                                disabled={isSaving} 
                                className={`flex-1 py-2.5 px-4 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex justify-center items-center gap-2 ${isZeroSubmit ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/20' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/20'}`}
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin"/>} 
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- REJECT MODAL --- */}
        {showRejectModal && (
            <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-bold text-rose-600 flex items-center gap-2 tracking-tight">
                            <MessageSquare size={22} strokeWidth={2.5}/> Reject Report
                        </h2>
                        <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg transition-colors">
                            <X size={20}/>
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 font-medium">Please provide a reason for rejecting this report. This will be visible to the facility user.</p>
                    <textarea 
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all shadow-inner" 
                        rows={4} 
                        value={rejectionReason} 
                        onChange={(e) => setRejectionReason(e.target.value)} 
                        autoFocus 
                        placeholder="e.g. Incomplete data, please review the totals..."
                    ></textarea>
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            onClick={() => setShowRejectModal(false)} 
                            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors border border-transparent"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmRejection} 
                            disabled={isSaving} 
                            className="px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 hover:shadow-rose-600/20 shadow-sm rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                        >
                            {isSaving && <Loader2 size={16} className="animate-spin"/>} 
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- DELETE REPORT CONFIRMATION MODAL --- */}
        {showDeleteReportModal && (
            <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-red-50 p-4 rounded-full mb-5 text-red-600 shadow-inner">
                            <AlertCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Delete {activeTab === 'main' ? 'Form 1' : 'Cohort'} Report?</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to delete the <strong>{activeTab === 'main' ? 'Form 1' : 'Cohort'}</strong> report? This action cannot be undone and all data will be lost.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setShowDeleteReportModal(false)} 
                                disabled={isSaving} 
                                className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteReportClick} 
                                disabled={isSaving} 
                                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 hover:shadow-red-600/20 shadow-sm transition-all flex justify-center items-center gap-2"
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin"/>} Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- DELETE ROW CONFIRMATION MODAL --- */}
        {deleteRowConfirmation.isOpen && (
             <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-amber-50 p-4 rounded-full mb-5 text-amber-600 shadow-inner">
                            <AlertCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Remove Row?</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to remove <strong>{deleteRowConfirmation.rowKey}</strong>? Any data entered in this row will be lost immediately.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setDeleteRowConfirmation({ isOpen: false, rowKey: null })} 
                                className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteRow} 
                                className="flex-1 py-2.5 px-4 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 hover:shadow-amber-600/20 shadow-sm transition-all"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}