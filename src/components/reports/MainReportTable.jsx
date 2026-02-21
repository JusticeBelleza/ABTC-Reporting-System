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
  
  const hasBarangays = facilityBarangays[activeFacilityName] && facilityBarangays[activeFacilityName].length > 0;

  return (
    // 1. ADDED WRAPPER: Responsive scrollable container
    <div className="w-full overflow-auto max-h-[75vh] shadow-sm border border-gray-200 rounded-lg bg-white relative">
      <table className="w-full border-collapse" style={{ borderColor: PDF_STYLES.border.borderColor }}>
        {/* 2. ADDED STICKY HEADER: Keeps the header visible when scrolling. Changed to light gray */}
        <thead className="sticky top-0 z-20 shadow-sm bg-gray-100">
          {/* --- ROW 1 --- */}
          <tr style={isConsolidated ? PDF_STYLES.header : PDF_STYLES.subHeader}>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', textAlign:'center', fontWeight:'bold', width: '200px', minWidth: '200px', color:'#374151'}}>
              {isConsolidated ? "Municipality" : (hasBarangays ? "Barangay / Municipality" : "Municipality")}
            </th>
            <th colSpan={17} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'600'}}>Human Cases</th>
            <th colSpan={4} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'600'}}>Biting Animals</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'600'}}>Total</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'600'}}>No. who washed</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'600'}}>Percentage</th>
            <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'600', width: '150px', minWidth: '150px'}}>
              Remarks <br/> <span style={{fontSize:'8px', fontWeight:'normal'}}>(Indicate # of CAT I given Prep, # of CAT III w/c is non bite, others)</span>
            </th>
          </tr>

          {/* --- ROW 2 --- */}
          <tr style={PDF_STYLES.subHeader}>
            <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Sex</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Total</th>
            <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Age</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Total</th>
            <th colSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>AB Category</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Total</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Total</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>AB</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>HR</th>
            <th colSpan={4} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Post-Exposure Prophylaxis</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Dog</th>
            <th rowSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Cat</th>
            <th colSpan={2} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Others (specify animal & Indicate number)</th>
          </tr>

          {/* --- ROW 3 --- */}
          <tr style={PDF_STYLES.subHeader}>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Male</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Female</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>&lt;15</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>&gt;15</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Cat I</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Cat II</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Cat III</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500', fontSize:'9px'}}>(CII+CIII)</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>No.</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>No.</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>PVRV</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>PCECV</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>HRIG</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>ERIG</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>No.</th>
            <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#CBDCEB', color:'#374151', fontWeight:'500'}}>Specify</th>
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
                <tr key="others-separator" className={hideClass} style={{ ...PDF_STYLES.rowEven, ...PDF_STYLES.bgGray }}>
                  {/* 3. MODERNIZED ADD ROW SECTION: Added jspdf-ignore to hide buttons from PDF */}
                  <td colSpan={26} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, textAlign:'left', ...PDF_STYLES.bgGray, padding:'8px'}}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Other Municipalities</span>
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
          <tr style={{ ...PDF_STYLES.bgDark, fontWeight:'bold', fontSize:'11px' }}>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46', textAlign:'left', paddingLeft:'0.75rem'}}>{isConsolidated ? "PROVINCIAL TOTAL" : "GRAND TOTAL"}</td>
            {['male','female'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.sexTotal}</td>
            {['ageLt15','ageGt15'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.ageTotal}</td>
            {['cat1','cat2','cat3'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.cat23}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.catTotal}</td>
            {['totalPatients','abCount','pvrv','pcecv','hrig','erig','dog','cat'].map(k=><td key={k} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals[k]}</td>)}
            
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals.othersCount}</td>

            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46', fontSize:'9px', whiteSpace: 'pre-wrap'}}>
              {grandTotals.othersSpec}
            </td>

            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.animalTotal}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgDark, borderColor:'#3f3f46'}}>{grandTotals.washed}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}>{grandTotals.percent}</td>
            <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#27272a', color:'#ffffff', borderColor:'#3f3f46'}}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}