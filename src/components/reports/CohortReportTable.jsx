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

  const { facilityDetails } = useApp();
  const facilityType = facilityDetails?.[activeFacilityName]?.type || 'RHU';
  const locationHeader = isConsolidated ? 'Municipality' : (facilityType === 'RHU' ? 'Barangay/Municipality' : 'Municipality');

  const getInputWebClasses = (isReadOnly, isTotalRow) => isReadOnly
    ? `outline-none bg-transparent w-full h-full text-center text-sm font-semibold ${isTotalRow ? 'text-slate-900' : 'text-slate-700'}`
    : "outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full h-full py-1.5 min-h-[32px] text-center text-[13px] font-bold text-blue-900";

  const getTextWebClasses = (isReadOnly, isTotalRow) => isReadOnly
    ? `outline-none bg-transparent w-full px-2 text-sm font-semibold ${isTotalRow ? 'text-slate-900' : 'text-slate-700'}`
    : "outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full py-1 px-2 text-sm font-medium text-blue-900";

  // --- IMPROVED GRID KEYBOARD NAVIGATION ---
  const handleGridKeyDown = (e) => {
    const { key } = e;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) return;

    const isTextElement = e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text');

    if (isTextElement && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        const { selectionStart, selectionEnd, value } = e.target;
        
        if (selectionStart !== selectionEnd) return;
        if (key === 'ArrowLeft' && selectionStart > 0) return;
        if (key === 'ArrowRight' && selectionEnd < value.length) return;
    }

    e.preventDefault();
    
    const currentInput = e.target;
    const currentTd = currentInput.closest('td');
    const currentRow = currentTd.closest('tr');
    const tbody = currentRow.closest('tbody');
    
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const rowIndex = allRows.indexOf(currentRow);
    const allCellsInRow = Array.from(currentRow.children);
    const cellIndex = allCellsInRow.indexOf(currentTd);

    const findEditableInput = (rIdx, cIdx, direction) => {
        if (rIdx < 0 || rIdx >= allRows.length) return null;
        const row = allRows[rIdx];
        const cells = Array.from(row.children);
        
        if (cIdx < 0) {
            if (direction === 'left' && rIdx > 0) return findEditableInput(rIdx - 1, allRows[rIdx - 1].children.length - 1, direction);
            return null;
        }
        if (cIdx >= cells.length) {
            if (direction === 'right' && rIdx < allRows.length - 1) return findEditableInput(rIdx + 1, 0, direction);
            return null;
        }

        const cell = cells[cIdx];
        const input = cell.querySelector('input:not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled])');
        
        if (input) return input;

        if (direction === 'right') return findEditableInput(rIdx, cIdx + 1, direction);
        if (direction === 'left') return findEditableInput(rIdx, cIdx - 1, direction);
        if (direction === 'up') return findEditableInput(rIdx - 1, cIdx, direction);
        if (direction === 'down') return findEditableInput(rIdx + 1, cIdx, direction);
        return null;
    };

    let targetInput = null;

    if (key === 'ArrowRight') targetInput = findEditableInput(rowIndex, cellIndex + 1, 'right');
    else if (key === 'ArrowLeft') targetInput = findEditableInput(rowIndex, cellIndex - 1, 'left');
    else if (key === 'ArrowDown' || key === 'Enter') targetInput = findEditableInput(rowIndex + 1, cellIndex, 'down');
    else if (key === 'ArrowUp') targetInput = findEditableInput(rowIndex - 1, cellIndex, 'up');

    if (targetInput) {
        targetInput.focus();
        if (targetInput.select) targetInput.select();
    }
  };

  const renderTable = (category) => {
    const isCat2 = category === 'cat2';
    const rowKeys = isCat2 ? rowKeysCat2 : rowKeysCat3;
    const visibleList = isCat2 ? visibleCat2 : visibleCat3;
    const setVisible = isCat2 ? setVisibleCat2 : setVisibleCat3;
    const suffix = isCat2 ? '_Category_II' : '_Category_III';

    return (
      <div className={`cohort-table-hidden ${subTab === category ? 'block' : 'hidden'} mb-8`}>
        {/* Removed borderTopLeftRadius and borderTopRightRadius from the header to keep it fully square */}
        <div style={{ backgroundColor: '#f9fafb', padding: '8px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #94A3B8', borderBottom: 'none', borderRadius: '0', fontSize: '14px', color: '#4b5563', marginBottom: '0' }}>
            {isCat2 ? 'CATEGORY II - EXPOSURES' : 'CATEGORY III - EXPOSURES'}
        </div>
        
        {/* Fixed rounded-n to rounded-none here! */}
        <div className="w-full overflow-auto max-h-[75vh] shadow-sm border border-[#94A3B8] rounded-none bg-white relative custom-scrollbar">
          <table className="w-full border-collapse tabular-nums [&_th]:!border-[#94A3B8] [&_td]:!border-[#94A3B8]" style={{ borderColor: PDF_STYLES.border.borderColor }}>
            <thead className="sticky top-0 z-20 shadow-sm bg-white">
              <tr style={PDF_STYLES.subHeader}>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', textAlign:'center', width: '200px', minWidth: '200px'}}>
                  {locationHeader}
                </th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', width: '100px', textAlign:'center'}}>Registered Exposures</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', width: '100px', textAlign:'center'}}>Patients w/ RIG</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', textAlign:'center'}}>Outcome: Complete</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', textAlign:'center'}}>Outcome: Incomplete</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', textAlign:'center'}}>Outcome: Booster</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', textAlign:'center'}}>Outcome: None</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', textAlign:'center'}}>Outcome: Died</th>
                <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: 'bold', width:'150px', minWidth: '150px', textAlign:'center'}}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rowKeys.map((key) => {
                const isEmpty = !hasCohortData(data[key], category);
                const hideClass = isEmpty ? 'pdf-hide-empty' : '';
                const row = data[key] || INITIAL_COHORT_ROW;
                const isHost = key === currentHostMunicipality;
                const isRowReadOnly = userRole === 'admin' || isHost;
                const isTotalRow = isHost && isRowReadOnly;
                
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
                const rowStyle = isTotalRow ? { ...PDF_STYLES.hostRow, backgroundColor: '#cbd5e1' } : (isHost ? PDF_STYLES.hostRow : PDF_STYLES.rowEven);
                
                return (
                  <tr key={key} className={`${hideClass} ${isTotalRow ? '' : 'hover:bg-blue-50/50'} transition-colors group`} style={rowStyle}>
                    <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', textAlign:'left', color: '#1E293B', fontWeight: MUNICIPALITIES.includes(key) ? 'bold' : 'normal', paddingLeft: MUNICIPALITIES.includes(key) ? '0.75rem' : '1.5rem'}}>
                      <div className="flex justify-between items-center group/row">
                        <span>{key} {isHost && <span style={{fontSize:'10px', color:'#1E293B', fontWeight:'normal'}}>(Total)</span>}</span>
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
                          onKeyDown={handleGridKeyDown}
                          style={PDF_STYLES.input} 
                          className={getInputWebClasses(isRowReadOnly, isTotalRow)}
                        />
                      </td>
                    ))}
                    <td style={{...PDF_STYLES.border, padding:0}}>
                      <input 
                        disabled={isRowReadOnly} 
                        type="text" 
                        value={row[`${prefix}_remarks`]} 
                        onChange={e => onChange(key, `${prefix}_remarks`, e.target.value)} 
                        onKeyDown={handleGridKeyDown}
                        style={PDF_STYLES.inputText} 
                        className={getTextWebClasses(isRowReadOnly, isTotalRow)}
                      />
                    </td>
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: '#E2E8F0', fontWeight:'bold', fontSize:'11px', color: '#1E293B' }}>
                <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'left', paddingLeft:'0.75rem'}}>TOTAL</td>
                {[`${isCat2?'cat2':'cat3'}_registered`, `${isCat2?'cat2':'cat3'}_rig`, `${isCat2?'cat2':'cat3'}_complete`, `${isCat2?'cat2':'cat3'}_incomplete`, `${isCat2?'cat2':'cat3'}_booster`, `${isCat2?'cat2':'cat3'}_none`, `${isCat2?'cat2':'cat3'}_died`].map(k => (
                   <td key={k} className="text-center font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0'}}>{cohortTotals[k]}</td>
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