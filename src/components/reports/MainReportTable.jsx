import React from 'react';
import { XCircle } from 'lucide-react';
import { PDF_STYLES, MUNICIPALITIES, INITIAL_ROW_STATE } from '../../lib/constants';
import { getComputations, hasData } from '../../lib/utils';

// Added 'export default' here:
export default function MainReportTable({ 
  data, rowKeys, isConsolidated, isAggregationMode, reportStatus, 
  userRole, activeFacilityName, currentHostMunicipality, 
  visibleOtherMunicipalities, setVisibleOtherMunicipalities,
  onChange, onDeleteRow, grandTotals, facilityBarangays 
}) {
  
  return (
    <table className="w-full border-collapse" style={{ borderColor: PDF_STYLES.border.borderColor }}>
      <thead>
        <tr style={isConsolidated ? PDF_STYLES.header : PDF_STYLES.subHeader}>
          <th rowSpan={3} style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, textAlign:'left', fontWeight:'bold', width: '200px', minWidth: '200px'}}>{isConsolidated ? "Municipality" : (facilityBarangays[activeFacilityName] ? "Barangay / Municipality" : "Municipality")}</th>
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
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Tot</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>AB</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>PVRV</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>PCECV</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>HRIG</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>ERIG</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Dog</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Cat</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Oth</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>Spec</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>Total</th>
          <th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor:'#ffffff', color:'#52525b'}}>No.</th><th style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, color:'#52525b'}}>%</th>
        </tr>
      </thead>
      <tbody>
        {rowKeys.map((key, idx) => {
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
                          <button type="button" onClick={() => { const select = document.getElementById('other-mun-select'); const val = select.value; if(val) { setVisibleOtherMunicipalities(prev => [...prev, val]); select.value = ""; } }} className="bg-zinc-900 text-white px-2 py-1 rounded text-xs hover:bg-zinc-800 transition">+ Add Row</button>
                        </div>
                      )}
                    </div>
                </td>
              </tr>
            );
          }
          
          const row = data[key] || INITIAL_ROW_STATE;
          const c = getComputations(row);
          const isRowReadOnly = userRole === 'admin' || key === currentHostMunicipality || isConsolidated || isAggregationMode || (reportStatus !== 'Draft' && reportStatus !== 'Rejected'); 
          const rowStyle = key === currentHostMunicipality ? PDF_STYLES.hostRow : PDF_STYLES.rowEven;
          const isOtherRow = visibleOtherMunicipalities.includes(key);

          return (
            <tr key={key} className={hideClass} style={rowStyle}>
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...rowStyle, textAlign:'left', whiteSpace:'nowrap', color: MUNICIPALITIES.includes(key) ? '#111827' : '#4b5563', paddingLeft: MUNICIPALITIES.includes(key) ? '0.75rem' : '1.5rem', fontWeight: MUNICIPALITIES.includes(key) ? 'bold' : 'normal'}}>
                <div className="flex justify-between items-center group/row">
                    <span>{key} {key === currentHostMunicipality && <span style={{fontSize:'10px', color:'#9ca3af', fontWeight:'normal'}}>(Total)</span>}</span>
                    {isOtherRow && !isRowReadOnly && (
                      <button onClick={() => onDeleteRow(key)} className="text-gray-400 hover:text-red-600 transition px-2 no-print" title="Remove row">
                        <XCircle size={14} />
                      </button>
                    )}
                </div>
              </td>
              {['male','female'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>onChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.sexTotal}</td>
              {['ageLt15','ageGt15'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>onChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold', color: c.sexMismatch ? '#ef4444' : 'inherit'}}>{c.ageTotal}</td>
              {['cat1','cat2','cat3'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>onChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, color:'#6b7280'}}>{c.cat23}</td>
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.catTotal}</td>
              {['totalPatients','abCount'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>onChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
              {['pvrv','pcecv','hrig','erig'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>onChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
              {['dog','cat','othersCount'].map(f => <td key={f} style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>onChange(key, f, e.target.value)} style={PDF_STYLES.input} /></td>)}
              <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="text" value={row.othersSpec} onChange={e=>onChange(key, 'othersSpec', e.target.value)} style={PDF_STYLES.inputText} /></td>
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.animalTotal}</td>
              <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="number" min="0" value={row.washed} onChange={e=>onChange(key, 'washed', e.target.value)} style={PDF_STYLES.input} /></td>
              <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontSize:'10px', color:'#6b7280'}}>{c.percent}</td>
              <td style={{...PDF_STYLES.border, padding:0}}><input disabled={isRowReadOnly} type="text" value={row.remarks} onChange={e=>onChange(key, 'remarks', e.target.value)} style={{...PDF_STYLES.inputText, paddingLeft:'4px'}} /></td>
            </tr>
          );
        })}
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