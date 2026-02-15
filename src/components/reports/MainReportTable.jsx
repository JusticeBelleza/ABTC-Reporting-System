import React from 'react';
import { PDF_STYLES, MUNICIPALITIES, INITIAL_ROW_STATE } from '../../lib/constants';
import { getComputations, hasData } from '../../lib/utils';
import ReportRow from './ReportRow';

export default function MainReportTable({ 
  data, rowKeys, isConsolidated, isAggregationMode, reportStatus, 
  userRole, activeFacilityName, currentHostMunicipality, 
  visibleOtherMunicipalities, setVisibleOtherMunicipalities,
  onChange, onDeleteRow, grandTotals, facilityBarangays 
}) {
  
  // Determine if the active facility has any barangays (e.g. RHUs have them, Hospitals might not)
  const hasBarangays = facilityBarangays[activeFacilityName] && facilityBarangays[activeFacilityName].length > 0;

  return (
    <table className="w-full border-collapse" style={{ borderColor: PDF_STYLES.border.borderColor }}>
      <thead>
        <tr style={isConsolidated ? PDF_STYLES.header : PDF_STYLES.subHeader}>
          <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, textAlign:'left', fontWeight:'bold', width: '200px', minWidth: '200px'}}>
            {isConsolidated ? "Municipality" : (hasBarangays ? "Barangay / Municipality" : "Municipality")}
          </th>
          <th colSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Human Cases (Sex)</th>
          <th colSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Human Cases (Age)</th>
          <th colSpan={5} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Category</th>
          <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Status</th>
          <th colSpan={4} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>PEP</th>
          <th colSpan={5} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>Biting Animals</th>
          <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500'}}>No. Who Washed</th>
          <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b', fontWeight:'500', width: '150px', minWidth: '150px'}}>Remarks</th>
        </tr>
        <tr style={PDF_STYLES.subHeader}>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>M</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>F</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>&lt;15</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>&gt;15</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>I</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>II</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>III</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>II+III</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Total</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>AB</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>PVRV</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>PCECV</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>HRIG</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>ERIG</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Dog</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Cat</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Others</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Specify</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>No.</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>%</th>
        </tr>
      </thead>
      <tbody>
        {rowKeys.map((key) => {
          const isEmpty = !hasData(data[key]);
          const hideClass = isEmpty ? 'pdf-hide-empty' : '';

          if (key === "Others:") {
            const host = currentHostMunicipality;
            const availableOptions = MUNICIPALITIES.filter(m => m !== host && !visibleOtherMunicipalities.includes(m)).sort();
            const showAddControls = userRole !== 'admin' && !isConsolidated && !isAggregationMode && (reportStatus === 'Draft' || reportStatus === 'Rejected');
            return (
              <tr key="others-separator" className={hideClass} style={{ ...PDF_STYLES.rowEven, ...PDF_STYLES.bgGray }}>
                <td colSpan={26} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', ...PDF_STYLES.bgGray, padding:'8px'}}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-500">Other Municipalities</span>
                      {showAddControls && (
                        <div className="flex items-center gap-2 no-print">
                          <select id="other-mun-select" className="bg-white border border-gray-300 text-xs rounded p-1 outline-none">
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
                          }} className="bg-zinc-900 text-white px-2 py-1 rounded text-xs hover:bg-zinc-800 transition">+ Add Row</button>
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
            (isHost && hasBarangays) || 
            isConsolidated || 
            isAggregationMode || 
            (reportStatus !== 'Draft' && reportStatus !== 'Rejected');

          const isOtherRow = visibleOtherMunicipalities.includes(key);

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
        <tr style={{ ...PDF_STYLES.bgDark, fontWeight:'bold', fontSize:'11px' }}>
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46', textAlign:'left', paddingLeft:'0.75rem'}}>{isConsolidated ? "PROVINCIAL TOTAL" : "GRAND TOTAL"}</td>
          {['male','female'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.sexTotal}</td>
          {['ageLt15','ageGt15'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.ageTotal}</td>
          {['cat1','cat2','cat3'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.cat23}</td>
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.catTotal}</td>
          {['totalPatients','abCount','pvrv','pcecv','hrig','erig','dog','cat','othersCount'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}></td>
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.animalTotal}</td>
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals.washed}</td>
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.percent}</td>
          <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}></td>
        </tr>
      </tbody>
    </table>
  );
}