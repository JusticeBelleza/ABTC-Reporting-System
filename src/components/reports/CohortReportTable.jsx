import React from 'react';
import { XCircle } from 'lucide-react';
import { PDF_STYLES, MUNICIPALITIES, INITIAL_COHORT_ROW } from '../../lib/constants';
import { hasCohortData } from '../../lib/utils';
import { useApp } from '../../context/AppContext';

export default function CohortReportTable({
  subTab, data, rowKeysCat2, rowKeysCat3, isConsolidated, 
  userRole, activeFacilityName, currentHostMunicipality,
  visibleCat2, setVisibleCat2, visibleCat3, setVisibleCat3,
  onChange, onDeleteRow, cohortTotals
}) {

  // --- NEW: Access facility details to determine the column header ---
  const { facilityDetails } = useApp();
  const facilityType = facilityDetails?.[activeFacilityName]?.type || 'RHU';
  const locationHeader = isConsolidated ? 'Municipality' : (facilityType === 'RHU' ? 'Barangay/Municipality' : 'Municipality');

  // Helper functions to generate modern input classes based on read-only state
  const getInputWebClasses = (isReadOnly) => isReadOnly
    ? "outline-none bg-transparent w-full h-full"
    : "outline-none transition-all hover:bg-gray-100 focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full h-full py-1 min-h-[28px]";

  const getTextWebClasses = (isReadOnly) => isReadOnly
    ? "outline-none bg-transparent w-full"
    : "outline-none transition-all hover:bg-gray-100 focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full py-1 px-1";

  const renderTable = (category) => {
    const isCat2 = category === 'cat2';
    const rowKeys = isCat2 ? rowKeysCat2 : rowKeysCat3;
    const visibleList = isCat2 ? visibleCat2 : visibleCat3;
    const setVisible = isCat2 ? setVisibleCat2 : setVisibleCat3;
    const suffix = isCat2 ? '_Category_II' : '_Category_III';

    return (
      <div className={`cohort-table-hidden ${subTab === category ? 'block' : 'hidden'} mb-8`}>
        {/* Table Title Bar */}
        <div style={{ backgroundColor: '#f9fafb', padding: '8px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #94A3B8', borderBottom: 'none', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', fontSize: '14px', color: '#4b5563', marginBottom: '0' }}>
            {isCat2 ? 'CATEGORY II - EXPOSURES' : 'CATEGORY III - EXPOSURES'}
        </div>
        
        {/* Scrollable Responsive Wrapper */}
        <div className="w-full overflow-auto max-h-[75vh] shadow-sm border border-[#94A3B8] rounded-b-lg bg-white relative">
          <table className="w-full border-collapse [&_th]:!border-[#94A3B8] [&_td]:!border-[#94A3B8]" style={{ borderColor: PDF_STYLES.border.borderColor }}>
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 shadow-sm bg-white">
              <tr style={PDF_STYLES.subHeader}>
                {/* DYNAMIC HEADER */}
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', textAlign:'center', width: '200px', minWidth: '200px'}}>
                  {locationHeader}
                </th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', width: '100px'}}>Registered Exposures</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', width: '100px'}}>Patients w/ RIG</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold'}}>Outcome: Complete</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold'}}>Outcome: Incomplete</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold'}}>Outcome: Booster</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold'}}>Outcome: None</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold'}}>Outcome: Died</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', width:'150px', minWidth: '150px'}}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rowKeys.map((key) => {
                const isEmpty = !hasCohortData(data[key], category);
                const hideClass = isEmpty ? 'pdf-hide-empty' : '';
                const row = data[key] || INITIAL_COHORT_ROW;
                const isRowReadOnly = userRole === 'admin' || key === currentHostMunicipality;
                
                const isOtherRow = currentHostMunicipality !== null && visibleList.includes(key);

                if (key === "Others:") {
                  const host = currentHostMunicipality;
                  const availableOptions = MUNICIPALITIES
                    .filter(m => m !== host && !visibleList.includes(m))
                    .sort((a, b) => {
                      if (a === 'Non-Abra') return 1;
                      if (b === 'Non-Abra') return -1;
                      return a.localeCompare(b);
                    });

                  const showAddControls = userRole !== 'admin' && !isConsolidated;
                  return (
                    <tr key={`cohort-others-sep-${category}`} className={hideClass} style={{ ...PDF_STYLES.rowEven, backgroundColor: '#E2E8F0' }}>
                      <td colSpan={9} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', backgroundColor: '#E2E8F0', padding:'8px'}}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Other Municipalities</span>
                          {showAddControls && (
                            <div className="flex items-center gap-2 no-print jspdf-ignore">
                              <select id={`cohort-other-select-${category}`} className="bg-white border border-gray-300 text-xs rounded shadow-sm p-1.5 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Select Municipality...</option>
                                {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              <button type="button" onClick={() => { const select = document.getElementById(`cohort-other-select-${category}`); const val = select.value; if(val) { setVisible(prev => [...prev, val]); select.value = ""; } }} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-blue-500 transition-colors focus:ring-2 focus:ring-blue-500 outline-none">+ Add Row</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                const prefix = isCat2 ? 'cat2' : 'cat3';
                
                return (
                  <tr key={key} className={`${hideClass} hover:bg-blue-50/50 transition-colors group`} style={PDF_STYLES.rowEven}>
                    {/* Municipality cell */}
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'left', color: '#1E293B', fontWeight: MUNICIPALITIES.includes(key) ? 'bold' : 'normal', paddingLeft: MUNICIPALITIES.includes(key) ? '0.75rem' : '1.5rem'}}>
                      <div className="flex justify-between items-center group/row">
                        <span>{key}</span>
                        {isOtherRow && !isRowReadOnly && (
                          <button onClick={() => onDeleteRow(key)} className="text-gray-400 hover:text-red-600 transition px-2 no-print"><XCircle size={14} /></button>
                        )}
                      </div>
                    </td>
                    {[`${prefix}_registered`, `${prefix}_rig`, `${prefix}_complete`, `${prefix}_incomplete`, `${prefix}_booster`, `${prefix}_none`, `${prefix}_died`].map(f => (
                      <td key={f} style={{...PDF_STYLES.border, padding:0}}>
                        <input 
                          disabled={isRowReadOnly} 
                          type="number" 
                          min="0" 
                          value={row[f]} 
                          onChange={e => onChange(key, f, e.target.value)} 
                          style={PDF_STYLES.input} 
                          className={getInputWebClasses(isRowReadOnly)}
                        />
                      </td>
                    ))}
                    <td style={{...PDF_STYLES.border, padding:0}}>
                      <input 
                        disabled={isRowReadOnly} 
                        type="text" 
                        value={row[`${prefix}_remarks`]} 
                        onChange={e => onChange(key, `${prefix}_remarks`, e.target.value)} 
                        style={PDF_STYLES.inputText} 
                        className={getTextWebClasses(isRowReadOnly)}
                      />
                    </td>
                  </tr>
                );
              })}
              {/* TOTAL ROW */}
              <tr style={{ backgroundColor: '#E2E8F0', fontWeight:'bold', fontSize:'11px', color: '#1E293B' }}>
                <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'left', paddingLeft:'0.75rem'}}>TOTAL</td>
                {[`${isCat2?'cat2':'cat3'}_registered`, `${isCat2?'cat2':'cat3'}_rig`, `${isCat2?'cat2':'cat3'}_complete`, `${isCat2?'cat2':'cat3'}_incomplete`, `${isCat2?'cat2':'cat3'}_booster`, `${isCat2?'cat2':'cat3'}_none`, `${isCat2?'cat2':'cat3'}_died`].map(k => (
                   <td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0'}}>{cohortTotals[k]}</td>
                ))}
                <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0'}}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderTable('cat2')}
      {renderTable('cat3')}
    </>
  );
}