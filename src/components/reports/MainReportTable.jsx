import React from 'react';
import { PDF_STYLES, MUNICIPALITIES, INITIAL_ROW_STATE } from '../../lib/constants';
import { getComputations, hasData } from '../../lib/utils';
import ReportRow from './ReportRow';
import { useApp } from '../../context/AppContext';

export default function MainReportTable({ 
  data, rowKeys, isConsolidated, isAggregationMode, reportStatus, 
  userRole, activeFacilityName, currentHostMunicipality, 
  visibleOtherMunicipalities, setVisibleOtherMunicipalities,
  onChange, onDeleteRow, grandTotals, facilityBarangays 
}) {
  
  const hasBarangays = facilityBarangays[activeFacilityName] && facilityBarangays[activeFacilityName].length > 0;

  const { facilityDetails } = useApp();
  const facilityType = facilityDetails?.[activeFacilityName]?.type || 'RHU';
  const locationHeader = isConsolidated ? 'Municipality' : (facilityType === 'RHU' ? 'Barangay/Municipality' : 'Municipality');

  // Validation Checks for Grand Totals
  const isGrandSexAgeMismatch = grandTotals.sexTotal !== grandTotals.ageTotal;
  const isGrandWashedError = Number(grandTotals.washed || 0) > grandTotals.animalTotal;

  // Styles for Errors
  const errorStyle = { backgroundColor: '#fee2e2', color: '#dc2626' }; // Red background, Red text
  const normalStyle = { backgroundColor: '#E2E8F0', color: '#1E293B' };

  return (
    <div className="w-full overflow-auto max-h-[75vh] shadow-sm border border-[#94A3B8] rounded-none bg-white relative custom-scrollbar">
      <table className="w-full border-collapse tabular-nums [&_th]:!border-[#94A3B8] [&_td]:!border-[#94A3B8]" style={{ borderColor: PDF_STYLES.border.borderColor }}>
        <thead className="sticky top-0 z-20 shadow-sm bg-gray-100">
          {/* --- ROW 1 --- */}
          <tr style={isConsolidated ? PDF_STYLES.header : PDF_STYLES.subHeader}>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', textAlign:'center', fontWeight:'bold', width: '200px', minWidth: '200px', color:'#1E293B'}}>
              {locationHeader}
            </th>
            <th colSpan={17} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Human Cases</th>
            <th colSpan={4} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Biting Animals</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Total</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>No. who washed</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Percentage</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', width: '150px', minWidth: '150px', textAlign:'center'}}>
              Remarks <br/> <span style={{fontSize:'8px', fontWeight:'normal'}}>(Indicate # of CAT I given Prep, # of CAT III w/c is non bite, others)</span>
            </th>
          </tr>

          {/* --- ROW 2 --- */}
          <tr style={PDF_STYLES.subHeader}>
            <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Sex</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Total</th>
            <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Age</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Total</th>
            <th colSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>AB Category</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Total</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Total</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>AB</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>HR</th>
            <th colSpan={4} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Post-Exposure Prophylaxis</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Dog</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Cat</th>
            <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Others (specify animal & Indicate number)</th>
          </tr>

          {/* --- ROW 3 --- */}
          <tr style={PDF_STYLES.subHeader}>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Male</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Female</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>&lt;15</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>&gt;15</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Cat I</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Cat II</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Cat III</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', fontSize:'9px', textAlign:'center'}}>(CII+CIII)</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>No.</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>No.</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>PVRV</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>PCECV</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>HRIG</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>ERIG</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>No.</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#E2E8F0', color:'#1E293B', fontWeight:'bold', textAlign:'center'}}>Specify</th>
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((key) => {
            const isEmpty = !hasData(data[key]);
            const hideClass = isEmpty ? 'pdf-hide-empty' : '';

            if (key === "Others:") {
              const host = currentHostMunicipality;
              const availableOptions = MUNICIPALITIES
                  .filter(m => m !== host && !visibleOtherMunicipalities.includes(m))
                  .sort((a, b) => {
                      if (a === 'Non-Abra') return 1;
                      if (b === 'Non-Abra') return -1;
                      return a.localeCompare(b);
                  });

              const showAddControls = userRole !== 'admin' && !isConsolidated && !isAggregationMode && (reportStatus === 'Draft' || reportStatus === 'Rejected');
              return (
                <tr key="others-separator" className={hideClass} style={{ ...PDF_STYLES.rowEven, backgroundColor: '#E2E8F0' }}>
                  <td colSpan={26} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', backgroundColor: '#E2E8F0', padding:'8px'}}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">Other Municipalities</span>
                        {showAddControls && (
                          <div className="flex items-center gap-2 no-print jspdf-ignore">
                            <select id="other-mun-select" className="bg-white border border-gray-300 text-xs rounded shadow-sm p-1.5 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                              <option value="">Select Municipality...</option>
                              {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <button type="button" onClick={(e) => { 
                              e.preventDefault();
                              const select = document.getElementById('other-mun-select'); 
                              const val = select.value; 
                              if(val) { 
                                  setVisibleOtherMunicipalities(prev => [...prev, val]); 
                                  select.value = ""; 
                              } 
                            }} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-blue-500 transition-colors focus:ring-2 focus:ring-blue-500 outline-none">+ Add Row</button>
                          </div>
                        )}
                      </div>
                  </td>
                </tr>
              );
            }
            
            const row = data[key] || INITIAL_ROW_STATE;
            const c = getComputations(row);
            
            const isHost = key === currentHostMunicipality;
            const isRowReadOnly = 
              userRole === 'admin' || 
              userRole === 'SYSADMIN' || 
              (isHost && hasBarangays) || 
              isConsolidated || 
              isAggregationMode || 
              (reportStatus !== 'Draft' && reportStatus !== 'Rejected');

            const isOtherRow = currentHostMunicipality !== null && visibleOtherMunicipalities.includes(key);

            return (
              <ReportRow 
                key={key}
                rowKey={key}
                row={row}
                computations={c}
                isRowReadOnly={isRowReadOnly}
                onChange={onChange}
                onDeleteRow={onDeleteRow}
                isOtherRow={isOtherRow}
                isHost={isHost}
                className={hideClass} 
              />
            );
          })}
          
          {/* Grand Total Row */}
          <tr style={{ backgroundColor: '#E2E8F0', fontWeight:'bold', fontSize:'11px', color: '#1E293B' }}>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'left', paddingLeft:'0.75rem'}}>{isConsolidated ? "PROVINCIAL TOTAL" : "GRAND TOTAL"}</td>
            {['male','female'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals[k]}</td>)}
            
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'center', ...(isGrandSexAgeMismatch ? errorStyle : normalStyle)}}>{grandTotals.sexTotal}</td>
            
            {['ageLt15','ageGt15'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals[k]}</td>)}
            
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'center', ...(isGrandSexAgeMismatch ? errorStyle : normalStyle)}}>{grandTotals.ageTotal}</td>
            
            {['cat1','cat2','cat3'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals[k]}</td>)}
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals.cat23}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals.catTotal}</td>
            {['totalPatients','abCount','pvrv','pcecv','hrig','erig','dog','cat'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals[k]}</td>)}
            
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals.othersCount}</td>

            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', fontSize:'9px', whiteSpace: 'pre-wrap', textAlign:'left'}}>
              {grandTotals.othersSpec}
            </td>

            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0', textAlign:'center'}}>{grandTotals.animalTotal}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'center', ...(isGrandWashedError ? errorStyle : normalStyle)}}>{grandTotals.washed}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'center', ...(isGrandWashedError ? errorStyle : normalStyle)}}>{grandTotals.percent}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: '#E2E8F0'}}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}