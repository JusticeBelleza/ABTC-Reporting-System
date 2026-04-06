import React, { useState } from 'react';

// ==========================================
// V1 CLASSIC UI & COLOR SYSTEM
// ==========================================
const BORDER_COLOR = '#94A3B8';
const HEADER_BG = '#E2E8F0';    
const TOTAL_BG = '#E2E8F0';     
const GRAND_TOTAL_BG = '#E2E8F0';
const TEXT_COLOR = '#1E293B';
const DASHBOARD_NAVY = '#0F172A';
const DASHBOARD_YELLOW = '#EAB308'; 

const STYLES = {
  thMain: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: TEXT_COLOR, fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', padding: '8px 4px', fontSize: '11px', letterSpacing: '0.05em' },
  thGroup: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: TEXT_COLOR, fontWeight: '700', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '11px' },
  thLeaf: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: TEXT_COLOR, fontWeight: '600', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '10px', lineHeight: '1.2' },
  thLocation: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: TEXT_COLOR, fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', minWidth: '180px', fontSize: '11px', padding: '8px 12px' },
  thPop: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: TEXT_COLOR, fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', minWidth: '75px', fontSize: '10px' },
  thTotal: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: TOTAL_BG, color: '#0F172A', fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '10px', minWidth: '70px', width: '70px' },
  thGrandTotal: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: GRAND_TOTAL_BG, color: '#0F172A', fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '10px', minWidth: '90px', width: '90px' },
  tdData: { border: `1px solid ${BORDER_COLOR}`, padding: 0, backgroundColor: '#ffffff', verticalAlign: 'middle' },
  tdTotal: { border: `1px solid ${BORDER_COLOR}`, padding: '4px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', fontWeight: '700', backgroundColor: TOTAL_BG, color: '#0F172A' },
  tdGrandTotal: { border: `1px solid ${BORDER_COLOR}`, padding: '4px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', fontWeight: '800', backgroundColor: GRAND_TOTAL_BG, color: '#0F172A' }
};

const MainReportTableV2 = ({ facilityName, barangays = ["Poblacion", "San Jose", "San Juan"] }) => {
  const [activeTab, setActiveTab] = useState('tab1');
  const tableRows = [...barangays, "Outside Catchment / Non-Abra"];

  const [tableData, setTableData] = useState(() => {
    const initialState = {};
    tableRows.forEach((_, idx) => {
      initialState[idx] = {
        pop: '', male: '', female: '', ageUnder15: '', ageOver15: '', cat1: '',
        cat2EligPri: '', cat2EligBoost: '', cat2NonElig: '',
        cat3EligPri: '', cat3EligBoost: '', cat3NonElig: '',
        compCat2Pri: '', compCat2Boost: '', compCat3PriErig: '', compCat3PriHrig: '', compCat3Boost: '',
        typeDog: '', typeCat: '', typeOthers: '', statusPet: '', statusStray: '', statusUnk: '', rabiesCases: ''
      };
    });
    return initialState;
  });

  const handleInputChange = (rowIndex, name, value) => {
    let val = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    setTableData(prev => ({ ...prev, [rowIndex]: { ...prev[rowIndex], [name]: val.toString() } }));
  };

  const handleKeyDown = (e, rIdx, cIdx) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); 
    if (e.key === '-' || e.key === 'e' || e.key === 'E') { e.preventDefault(); return; }
    let nextR = rIdx; let nextC = cIdx;
    if (e.key === 'ArrowUp') nextR -= 1;
    else if (e.key === 'ArrowDown') nextR += 1;
    else if (e.key === 'ArrowLeft') nextC -= 1;
    else if (e.key === 'ArrowRight') nextC += 1;
    else return;
    const nextEl = document.getElementById(`input-${activeTab}-${nextR}-${nextC}`);
    if (nextEl) { nextEl.focus(); if (nextEl.select) nextEl.select(); }
  };

  const calculateGrandTotal = (key) => Object.values(tableData).reduce((sum, row) => sum + (parseInt(row[key]) || 0), 0);

  const tabs = [
    { id: 'tab1', label: 'ANIMAL BITE CASES' },
    { id: 'pep', label: 'POST-EXPOSURE PROPHYLAXIS (PEP)' },
    { id: 'tab3', label: 'BITING ANIMALS & HUMAN RABIES CASES' }
  ];

  return (
    <div className="mt-4 mb-12 mx-auto max-w-[1280px] px-4">
      <div className="inline-block min-w-full bg-white shadow-lg border border-slate-300 flex flex-col h-[75vh]">
        <style>{`
          input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
          .hide-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .hide-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .hide-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; }
        `}</style>

        <div className="flex items-center bg-slate-50 border-b border-slate-200 px-4 py-1 gap-2 flex-shrink-0">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 text-[11px] font-bold transition-all duration-300 relative group
                ${activeTab === tab.id ? 'bg-[#0F172A] text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}>
              {tab.label}
              <span className={`absolute bottom-0 left-0 h-1 bg-[#EAB308] transition-all duration-300 ${activeTab === tab.id ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
            </button>
          ))}
        </div>

        <div className="w-full overflow-auto hide-scrollbar flex-grow">
          <table className="w-full border-collapse tabular-nums relative">
            <thead className="sticky top-0 z-30 shadow-sm bg-[#E2E8F0]">
              {activeTab === 'tab1' && <Tab1Headers />}
              {activeTab === 'pep' && <Tab2Headers />}
              {activeTab === 'tab3' && <Tab3Headers />}
            </thead>
            <tbody>
              {tableRows.map((barangay, index) => (
                <tr key={`${activeTab}-${index}`} className="hover:bg-blue-50/30">
                  <td style={{...STYLES.tdData, padding: '0 12px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: barangay.includes("Outside") ? '#C2410C' : TEXT_COLOR, backgroundColor: barangay.includes("Outside") ? '#FFEDD5' : '#F8FAFC', borderRight: `1px solid ${BORDER_COLOR}`}} className="sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {barangay}
                  </td>
                  <DataCells barangay={barangay} rowIndex={index} activeTab={activeTab} data={tableData[index]} onChange={handleInputChange} onKeyDown={handleKeyDown} />
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-40 border-t-2 border-slate-400">
               <tr className="bg-[#E2E8F0]">
                 <td style={{...STYLES.tdGrandTotal, textAlign: 'left', padding: '10px 12px', backgroundColor: '#E2E8F0', borderRight: `1px solid ${BORDER_COLOR}`}} className="sticky left-0 z-50">
                   <strong>TOTAL</strong>
                 </td>
                 <GrandTotalCells activeTab={activeTab} calculate={calculateGrandTotal} />
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

const DataCells = ({ barangay, rowIndex, activeTab, data, onChange, onKeyDown }) => {
  const isNonAbra = barangay.includes("Outside");
  const num = (name) => parseInt(data[name]) || 0;
  const renderInput = (name, colIndex) => {
    if (name === 'pop' && isNonAbra) return <div className="text-center text-slate-400 italic text-[10px] font-semibold py-1">N/A</div>;
    return (
      <input id={`input-${activeTab}-${rowIndex}-${colIndex}`} type="number" value={data[name] || ''} onChange={(e) => onChange(rowIndex, name, e.target.value)} onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)} onWheel={(e) => e.target.blur()} className="outline-none w-full h-full py-1 min-h-[26px] min-w-[42px] text-center text-[12px] font-bold bg-transparent text-[#1E293B] hover:bg-white/50 focus:bg-white focus:ring-1 focus:ring-inset focus:ring-blue-500" />
    );
  };

  if (activeTab === 'tab1') {
    const l16 = num('cat2EligPri') + num('cat2EligBoost');
    const n16 = l16 + num('cat2NonElig');
    const q16 = num('cat3EligPri') + num('cat3EligBoost');
    const s16 = q16 + num('cat3NonElig');
    const sexTot = num('male') + num('female');
    const ageTot = num('ageUnder15') + num('ageOver15');
    const casesTot = num('cat1') + n16 + s16;
    const isMismatch = (sexTot > 0 || ageTot > 0) && (sexTot !== ageTot || sexTot !== casesTot);
    const valStyle = (base) => ({ ...base, backgroundColor: isMismatch ? '#FEE2E2' : base.backgroundColor, color: isMismatch ? '#B91C1C' : base.color });
    return (
      <>
        <td style={STYLES.tdData}>{renderInput('pop', 0)}</td>
        <td style={STYLES.tdData}>{renderInput('male', 1)}</td>
        <td style={STYLES.tdData}>{renderInput('female', 2)}</td>
        <td style={valStyle(STYLES.tdTotal)}>{sexTot}</td>
        <td style={STYLES.tdData}>{renderInput('ageUnder15', 3)}</td>
        <td style={STYLES.tdData}>{renderInput('ageOver15', 4)}</td>
        <td style={valStyle(STYLES.tdTotal)}>{ageTot}</td>
        <td style={STYLES.tdData}>{renderInput('cat1', 5)}</td>
        <td style={STYLES.tdData}>{renderInput('cat2EligPri', 6)}</td>
        <td style={STYLES.tdData}>{renderInput('cat2EligBoost', 7)}</td>
        <td style={STYLES.tdTotal}>{l16}</td>
        <td style={STYLES.tdData}>{renderInput('cat2NonElig', 8)}</td>
        <td style={STYLES.tdTotal}>{n16}</td>
        <td style={STYLES.tdData}>{renderInput('cat3EligPri', 9)}</td>
        <td style={STYLES.tdData}>{renderInput('cat3EligBoost', 10)}</td>
        <td style={STYLES.tdTotal}>{q16}</td>
        <td style={STYLES.tdData}>{renderInput('cat3NonElig', 11)}</td>
        <td style={STYLES.tdTotal}>{s16}</td>
        <td style={STYLES.tdGrandTotal}>{l16 + q16}</td>
        <td style={valStyle(STYLES.tdGrandTotal)}>{casesTot}</td>
      </>
    );
  }
  if (activeTab === 'pep') {
    const z16 = num('compCat3PriErig') + num('compCat3PriHrig');
    const totalComp = num('compCat2Pri') + num('compCat2Boost') + z16 + num('compCat3Boost');
    const totalElig = (num('cat2EligPri') + num('cat2EligBoost')) + (num('cat3EligPri') + num('cat3EligBoost'));
    const formatCovCell = (n, d) => {
        const pct = d > 0 ? (n/d)*100 : 0;
        const err = pct > 100;
        return <td style={{...STYLES.tdTotal, backgroundColor: err ? '#FEE2E2' : TOTAL_BG, color: err ? '#B91C1C' : '#0F172A'}}>{pct.toFixed(2)}%</td>;
    };
    return (
      <>
        <td style={STYLES.tdData}>{renderInput('compCat2Pri', 0)}</td>
        <td style={STYLES.tdData}>{renderInput('compCat2Boost', 1)}</td>
        <td style={STYLES.tdData}>{renderInput('compCat3PriErig', 2)}</td>
        <td style={STYLES.tdData}>{renderInput('compCat3PriHrig', 3)}</td>
        <td style={STYLES.tdTotal}>{z16}</td>
        <td style={STYLES.tdData}>{renderInput('compCat3Boost', 4)}</td>
        {formatCovCell(num('compCat2Pri'), num('cat2EligPri'))}
        {formatCovCell(num('compCat2Boost'), num('cat2EligBoost'))}
        {formatCovCell(z16, num('cat3EligPri'))}
        {formatCovCell(num('compCat3Boost'), num('cat3EligBoost'))}
        {formatCovCell(totalComp, totalElig)}
      </>
    );
  }
  return (
    <>
      <td style={STYLES.tdData}>{renderInput('typeDog', 0)}</td>
      <td style={STYLES.tdData}>{renderInput('typeCat', 1)}</td>
      <td style={STYLES.tdData}>{renderInput('typeOthers', 2)}</td>
      <td style={STYLES.tdData}>{renderInput('statusPet', 3)}</td>
      <td style={STYLES.tdData}>{renderInput('statusStray', 4)}</td>
      <td style={STYLES.tdData}>{renderInput('statusUnk', 5)}</td>
      <td style={STYLES.tdGrandTotal}>{num('typeDog') + num('typeCat') + num('typeOthers')}</td>
      <td style={STYLES.tdData}>{renderInput('rabiesCases', 6)}</td>
      <td style={{...STYLES.tdGrandTotal}}>{(num('pop') > 0 && !isNonAbra) ? ((num('rabiesCases') / num('pop')) * 1000000).toFixed(2) : '0.00'}</td>
    </>
  );
};

const GrandTotalCells = ({ activeTab, calculate }) => {
    const fPct = (n, d) => d > 0 ? ((n/d)*100).toFixed(2)+'%' : '0.00%';
    if (activeTab === 'tab1') {
        const sM = calculate('male'), sF = calculate('female'), sSex = sM + sF;
        const sU = calculate('ageUnder15'), sO = calculate('ageOver15'), sAge = sU + sO;
        const sC1 = calculate('cat1');
        const sC2 = calculate('cat2EligPri') + calculate('cat2EligBoost') + calculate('cat2NonElig');
        const sC3 = calculate('cat3EligPri') + calculate('cat3EligBoost') + calculate('cat3NonElig');
        return (
            <>
                <td style={STYLES.tdGrandTotal}>{calculate('pop')}</td>
                <td style={STYLES.tdGrandTotal}>{sM}</td><td style={STYLES.tdGrandTotal}>{sF}</td><td style={STYLES.tdGrandTotal}>{sSex}</td>
                <td style={STYLES.tdGrandTotal}>{sU}</td><td style={STYLES.tdGrandTotal}>{sO}</td><td style={STYLES.tdGrandTotal}>{sAge}</td>
                <td style={STYLES.tdGrandTotal}>{sC1}</td>
                <td style={STYLES.tdGrandTotal}>{calculate('cat2EligPri')}</td><td style={STYLES.tdGrandTotal}>{calculate('cat2EligBoost')}</td><td style={STYLES.tdGrandTotal}>{calculate('cat2EligPri')+calculate('cat2EligBoost')}</td>
                <td style={STYLES.tdGrandTotal}>{calculate('cat2NonElig')}</td><td style={STYLES.tdGrandTotal}>{sC2}</td>
                <td style={STYLES.tdGrandTotal}>{calculate('cat3EligPri')}</td><td style={STYLES.tdGrandTotal}>{calculate('cat3EligBoost')}</td><td style={STYLES.tdGrandTotal}>{calculate('cat3EligPri')+calculate('cat3EligBoost')}</td>
                <td style={STYLES.tdGrandTotal}>{calculate('cat3NonElig')}</td><td style={STYLES.tdGrandTotal}>{sC3}</td>
                <td style={STYLES.tdGrandTotal}>{(calculate('cat2EligPri')+calculate('cat2EligBoost')) + (calculate('cat3EligPri')+calculate('cat3EligBoost'))}</td>
                <td style={STYLES.tdGrandTotal}>{sC1+sC2+sC3}</td>
            </>
        );
    }
    if (activeTab === 'pep') {
        const c2p = calculate('compCat2Pri'), e2p = calculate('cat2EligPri'), c2b = calculate('compCat2Boost'), e2b = calculate('cat2EligBoost');
        const c3z = calculate('compCat3PriErig') + calculate('compCat3PriHrig'), e3p = calculate('cat3EligPri'), c3b = calculate('compCat3Boost'), e3b = calculate('cat3EligBoost');
        return (
            <>
                <td style={STYLES.tdGrandTotal}>{c2p}</td><td style={STYLES.tdGrandTotal}>{c2b}</td>
                <td style={STYLES.tdGrandTotal}>{calculate('compCat3PriErig')}</td><td style={STYLES.tdGrandTotal}>{calculate('compCat3PriHrig')}</td><td style={STYLES.tdGrandTotal}>{c3z}</td>
                <td style={STYLES.tdGrandTotal}>{c3b}</td>
                <td style={STYLES.tdGrandTotal}>{fPct(c2p, e2p)}</td><td style={STYLES.tdGrandTotal}>{fPct(c2b, e2b)}</td>
                <td style={STYLES.tdGrandTotal}>{fPct(c3z, e3p)}</td><td style={STYLES.tdGrandTotal}>{fPct(c3b, e3b)}</td>
                <td style={STYLES.tdGrandTotal}>{fPct(c2p+c2b+c3z+c3b, e2p+e2b+e3p+e3b)}</td>
            </>
        );
    }
    // Formula for Grand Total Incidence Proportion
    const totalPop = calculate('pop');
    const totalRabies = calculate('rabiesCases');
    const grandIncidence = totalPop > 0 ? ((totalRabies / totalPop) * 1000000).toFixed(2) : '0.00';
    
    return (
        <>
            <td style={STYLES.tdGrandTotal}>{calculate('typeDog')}</td><td style={STYLES.tdGrandTotal}>{calculate('typeCat')}</td><td style={STYLES.tdGrandTotal}>{calculate('typeOthers')}</td>
            <td style={STYLES.tdGrandTotal}>{calculate('statusPet')}</td><td style={STYLES.tdGrandTotal}>{calculate('statusStray')}</td><td style={STYLES.tdGrandTotal}>{calculate('statusUnk')}</td>
            <td style={STYLES.tdGrandTotal}>{calculate('typeDog')+calculate('typeCat')+calculate('typeOthers')}</td>
            <td style={STYLES.tdGrandTotal}>{totalRabies}</td>
            <td style={STYLES.tdGrandTotal}>{grandIncidence}</td>
        </>
    );
};

const Tab1Headers = () => (
  <>
    <tr>
      <th rowSpan={5} style={STYLES.thLocation} className="sticky left-0 z-30 border-r border-r-[#94A3B8]">LOCATION<br/><span style={{fontSize:'8.5px', fontWeight:'700', color:'#475569'}}>(Barangay)</span><br/><span style={{fontSize:'8.5px', fontWeight:'700', color:'#475569'}}>(Municipality/City)</span></th>
      <th rowSpan={5} style={STYLES.thPop}>TOTAL POPULATION</th>
      <th colSpan={19} style={STYLES.thMain}>ANIMAL BITE CASES</th>
    </tr>
    <tr>
      <th colSpan={3} style={STYLES.thGroup}>Sex</th><th colSpan={3} style={STYLES.thGroup}>Age</th><th colSpan={11} style={STYLES.thGroup}>Category</th>
      <th rowSpan={4} style={STYLES.thGrandTotal}>Total PEP eligible</th><th rowSpan={4} style={STYLES.thGrandTotal}>Total (Cat I+II+III)</th>
    </tr>
    <tr>
      <th rowSpan={3} style={STYLES.thLeaf}>Male</th><th rowSpan={3} style={STYLES.thLeaf}>Female</th><th rowSpan={3} style={STYLES.thTotal}>Total</th>
      <th rowSpan={3} style={STYLES.thLeaf}>&lt;15</th><th rowSpan={3} style={STYLES.thLeaf}>&gt;15</th><th rowSpan={3} style={STYLES.thTotal}>Total</th>
      <th rowSpan={3} style={STYLES.thLeaf}>Category I (1)</th><th colSpan={5} style={STYLES.thGroup}>Category II</th><th colSpan={5} style={STYLES.thGroup}>Category III</th>
    </tr>
    <tr>
      <th colSpan={3} style={STYLES.thLeaf}>PEP eligible</th><th rowSpan={2} style={STYLES.thLeaf}>PEP non-eligible*</th><th rowSpan={2} style={STYLES.thTotal}>Total (2)</th>
      <th colSpan={3} style={STYLES.thLeaf}>PEP eligible</th><th rowSpan={2} style={STYLES.thLeaf}>PEP non-eligible*</th><th rowSpan={2} style={STYLES.thTotal}>Total (5)</th>
    </tr>
    <tr>
      <th style={STYLES.thLeaf}>Primary (CCEEV)</th><th style={STYLES.thLeaf}>Booster (CCEEV)</th><th style={STYLES.thTotal}>Total (3)</th>
      <th style={STYLES.thLeaf}>Primary (CCEEV+RIG)</th><th style={STYLES.thLeaf}>Booster (CCEEV only)</th><th style={STYLES.thTotal}>Total</th>
    </tr>
  </>
);

const Tab2Headers = () => (
  <>
    <tr>
      <th rowSpan={5} style={STYLES.thLocation} className="sticky left-0 z-30 border-r border-r-[#94A3B8]">LOCATION<br/>
      <span style={{fontSize:'8.5px', fontWeight:'700', color:'#475569'}}>(Barangay)</span><br/><span style={{fontSize:'8.5px', fontWeight:'700', color:'#475569'}}>(Municipality/City)</span></th>
      <th colSpan={11} style={STYLES.thMain}>POST-EXPOSURE PROPHYLAXIS (PEP)</th>
    </tr>
    <tr><th colSpan={6} style={STYLES.thGroup}>PEP Completed**</th><th colSpan={5} style={STYLES.thGroup}>PEP Coverage</th></tr>
    <tr><th colSpan={2} style={STYLES.thGroup}>Category II</th><th colSpan={4} style={STYLES.thGroup}>Category III</th><th colSpan={2} style={STYLES.thGroup}>Category II (4)</th><th colSpan={2} style={STYLES.thGroup}>Category III (6)</th><th rowSpan={3} style={STYLES.thGrandTotal}>Total CCEEV Coverage</th></tr>
    <tr>
      <th rowSpan={2} style={STYLES.thLeaf}>Primary (CCEEV)</th><th rowSpan={2} style={STYLES.thLeaf}>Booster (CCEEV)</th>
      <th colSpan={3} style={STYLES.thGroup}>Primary (CCEEV+RIG)</th>
      <th rowSpan={2} style={STYLES.thLeaf}>Booster (CCEEV only)</th>
      <th rowSpan={2} style={STYLES.thTotal}>Primary (CCEEV)</th><th rowSpan={2} style={STYLES.thTotal}>Booster (CCEEV)</th>
      <th rowSpan={2} style={STYLES.thTotal}>Primary (CCEEV+RIG) (6a)</th><th rowSpan={2} style={STYLES.thTotal}>Booster (CCEEV only) (6b)</th>
    </tr>
    <tr><th style={STYLES.thLeaf}>ERIG</th><th style={STYLES.thLeaf}>HRIG</th><th style={STYLES.thTotal}>Total</th></tr>
  </>
);

const Tab3Headers = () => (
  <>
    <tr>
      <th rowSpan={5} style={STYLES.thLocation} className="sticky left-0 z-30 border-r border-r-[#94A3B8]">LOCATION<br/><span style={{fontSize:'8.5px', fontWeight:'700', color:'#475569'}}>(Barangay)</span><br/><span style={{fontSize:'8.5px', fontWeight:'700', color:'#475569'}}>(Municipality/City)</span></th>
      <th colSpan={7} style={STYLES.thMain}>BITING ANIMALS (7)</th><th colSpan={2} style={STYLES.thMain}>HUMAN RABIES CASES</th>
    </tr>
    <tr><th colSpan={3} style={STYLES.thGroup}>Type</th><th colSpan={3} style={STYLES.thGroup}>Status</th><th rowSpan={4} style={STYLES.thGrandTotal}>Total</th><th rowSpan={4} style={STYLES.thLeaf}>Cases (PIDSR c/o RESU)</th><th rowSpan={4} style={{...STYLES.thLeaf, minWidth: '100px', backgroundColor:'#FEE2E2', color:'#991B1B'}}>Incidence Proportion (per 10⁶)</th></tr>
    <tr><th rowSpan={3} style={STYLES.thLeaf}>Dog (7a)</th><th rowSpan={3} style={STYLES.thLeaf}>Cat (7b)</th><th rowSpan={3} style={STYLES.thLeaf}>Others (7c)</th><th rowSpan={3} style={STYLES.thLeaf}>Pet/ Domestic</th><th rowSpan={3} style={STYLES.thLeaf}>Stray/ Free-roaming</th><th rowSpan={3} style={STYLES.thLeaf}>Unknown</th></tr>
    <tr></tr><tr></tr>
  </>
);

export default MainReportTableV2;