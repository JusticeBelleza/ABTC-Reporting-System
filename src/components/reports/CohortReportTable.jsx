import React from 'react';
import { XCircle } from 'lucide-react';
import { PDF_STYLES, MUNICIPALITIES, INITIAL_COHORT_ROW } from '../../lib/constants';
import { hasCohortData } from '../../lib/utils';

// Ensure 'export default' is here:
export default function CohortReportTable({
  subTab, data, rowKeysCat2, rowKeysCat3, isConsolidated, 
  userRole, activeFacilityName, currentHostMunicipality,
  visibleCat2, setVisibleCat2, visibleCat3, setVisibleCat3,
  onChange, onDeleteRow, cohortTotals
}) {

  const renderTable = (category) => {
    const isCat2 = category === 'cat2';
    const rowKeys = isCat2 ? rowKeysCat2 : rowKeysCat3;
    const visibleList = isCat2 ? visibleCat2 : visibleCat3;
    const setVisible = isCat2 ? setVisibleCat2 : setVisibleCat3;
    const suffix = isCat2 ? '_Category_II' : '_Category_III';

    return (
      <div className={`cohort-table-hidden ${subTab === category ? 'block' : 'hidden'}`}>
        <div style={{ backgroundColor: '#f9fafb', padding: '8px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #e5e7eb', borderBottom: 'none', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', fontSize: '14px', color: '#4b5563', marginBottom: '0' }}>
            {isCat2 ? 'CATEGORY II - EXPOSURES' : 'CATEGORY III - EXPOSURES'}
        </div>
        <table className="w-full border-collapse mb-8" style={{ borderColor: PDF_STYLES.border.borderColor }}>
          <thead>
            <tr style={PDF_STYLES.subHeader}>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, textAlign:'left', width: '200px', minWidth: '200px'}}>Municipality</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, width: '100px'}}>Registered Exposures</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, width: '100px'}}>Patients w/ RIG</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Outcome: Complete</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Outcome: Incomplete</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Outcome: Booster</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Outcome: None</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell}}>Outcome: Died</th>
              <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, width:'150px', minWidth: '150px'}}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((key) => {
              const isEmpty = !hasCohortData(data[key], category);
              const hideClass = isEmpty ? 'pdf-hide-empty' : '';
              const row = data[key] || INITIAL_COHORT_ROW;
              const isRowReadOnly = userRole === 'admin' || key === currentHostMunicipality;
              const isOtherRow = visibleList.includes(key);

              if (key === "Others:") {
                const host = currentHostMunicipality;
                const availableOptions = MUNICIPALITIES.filter(m => m !== host && !visibleList.includes(m)).sort();
                const showAddControls = userRole !== 'admin' && !isConsolidated;
                return (
                  <tr key={`cohort-others-sep-${category}`} className={hideClass} style={{ ...PDF_STYLES.rowEven, ...PDF_STYLES.bgGray }}>
                    <td colSpan={9} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', ...PDF_STYLES.bgGray, padding:'8px'}}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500">Other Municipalities</span>
                        {showAddControls && (
                          <div className="flex items-center gap-2 no-print">
                            <select id={`cohort-other-select-${category}`} className="bg-white border border-gray-300 text-xs rounded p-1 outline-none">
                              <option value="">Select...</option>
                              {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <button type="button" onClick={() => { const select = document.getElementById(`cohort-other-select-${category}`); const val = select.value; if(val) { setVisible(prev => [...prev, val]); select.value = ""; } }} className="bg-zinc-900 text-white px-2 py-1 rounded text-xs hover:bg-zinc-800 transition">+ Add Row</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }

              const prefix = isCat2 ? 'cat2' : 'cat3';
              
              return (
                <tr key={key} className={hideClass} style={PDF_STYLES.rowEven}>
                  <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', fontWeight: MUNICIPALITIES.includes(key) ? 'bold' : 'normal'}}>
                    <div className="flex justify-between items-center group/row">
                      <span>{key}</span>
                      {isOtherRow && !isRowReadOnly && (
                        <button onClick={() => onDeleteRow(key)} className="text-gray-400 hover:text-red-600 transition px-2 no-print"><XCircle size={14} /></button>
                      )}
                    </div>
                  </td>
                  {[`${prefix}_registered`, `${prefix}_rig`, `${prefix}_complete`, `${prefix}_incomplete`, `${prefix}_booster`, `${prefix}_none`, `${prefix}_died`].map(f => (
                    <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e => onChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>
                  ))}
                  <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="text" value={row[`${prefix}_remarks`]} onChange={e => onChange(key, `${prefix}_remarks`, e.target.value)} style={PDF_STYLES.inputText} /></td>
                </tr>
              );
            })}
            <tr style={{ ...PDF_STYLES.bgDark, fontWeight:'bold', fontSize:'11px' }}>
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}>TOTAL</td>
              {[`${isCat2?'cat2':'cat3'}_registered`, `${isCat2?'cat2':'cat3'}_rig`, `${isCat2?'cat2':'cat3'}_complete`, `${isCat2?'cat2':'cat3'}_incomplete`, `${isCat2?'cat2':'cat3'}_booster`, `${isCat2?'cat2':'cat3'}_none`, `${isCat2?'cat2':'cat3'}_died`].map(k => (
                 <td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}>{cohortTotals[k]}</td>
              ))}
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark}}></td>
            </tr>
          </tbody>
        </table>
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