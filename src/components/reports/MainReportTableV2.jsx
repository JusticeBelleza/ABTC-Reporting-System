import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react'; 

// ==========================================
// V2 ENTERPRISE COMPACT UI (EXACT FIT)
// ==========================================
const BORDER_COLOR = '#CBD5E1'; 
const HEADER_BG = '#F8FAFC';    
const TOTAL_BG = '#F1F5F9';     
const GRAND_TOTAL_BG = '#E2E8F0'; 
const TEXT_COLOR = '#334155';

const STYLES = {
  thMain: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: '#0F172A', fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', padding: '6px 2px', fontSize: '11px', letterSpacing: '0.02em' },
  thGroup: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: '#1E293B', fontWeight: '700', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '10px' },
  thLeaf: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: '#475569', fontWeight: '600', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '9.5px', lineHeight: '1.1' },
  thLocation: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: '#0F172A', fontWeight: '800', textAlign: 'left', verticalAlign: 'middle', minWidth: '120px', width: '15%', fontSize: '11px', padding: '6px 10px' },
  thPop: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: HEADER_BG, color: '#0F172A', fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', fontSize: '10px', width: '5%' },
  thTotal: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: TOTAL_BG, color: '#0F172A', fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '10px' },
  thGrandTotal: { border: `1px solid ${BORDER_COLOR}`, backgroundColor: GRAND_TOTAL_BG, color: '#0F172A', fontWeight: '800', textAlign: 'center', verticalAlign: 'middle', padding: '4px 2px', fontSize: '10px' },
  tdData: { border: `1px solid ${BORDER_COLOR}`, padding: 0, backgroundColor: '#ffffff', verticalAlign: 'middle' },
  tdTotal: { border: `1px solid ${BORDER_COLOR}`, padding: '4px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '10.5px', fontWeight: '700', backgroundColor: TOTAL_BG, color: '#0F172A' },
  tdGrandTotal: { border: `1px solid ${BORDER_COLOR}`, padding: '4px 2px', textAlign: 'center', verticalAlign: 'middle', fontSize: '11px', fontWeight: '800', backgroundColor: GRAND_TOTAL_BG, color: '#0F172A' }
};

const MainReportTableV2 = ({ data, baseRowKeys, otherRowKeys, populations, onChange, isRowReadOnly, onDeleteOtherRow }) => {
  const [activeTab, setActiveTab] = useState('tab1');
  
  const allRowKeys = [...baseRowKeys, ...otherRowKeys];

  const num = (location, name) => {
      if (!data[location]) return 0;
      return parseInt(data[location][name]) || 0;
  };

  const handleInputChange = (location, name, value) => {
    if (isRowReadOnly) return;
    
    // STRICT BLANK VS ZERO LOGIC
    // If the user leaves it blank, save it as an empty string
    if (value === '') {
        onChange(location, name, '');
        return;
    }
    
    // If they typed a number (including 0), parse it safely and save it as a stringified number
    const parsed = parseInt(value, 10);
    const finalVal = isNaN(parsed) ? '' : Math.max(0, parsed).toString();
    onChange(location, name, finalVal);
  };

  const handleKeyDown = (e, location, cIdx, rowIndex, totalRows) => {
    if (isRowReadOnly) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); 
    if (e.key === '-' || e.key === 'e' || e.key === 'E') { e.preventDefault(); return; }
    
    let nextR = rowIndex; let nextC = cIdx;
    if (e.key === 'ArrowUp') nextR -= 1;
    else if (e.key === 'ArrowDown') nextR += 1;
    else if (e.key === 'ArrowLeft') nextC -= 1;
    else if (e.key === 'ArrowRight') nextC += 1;
    else return;
    
    if (nextR >= 0 && nextR < totalRows) {
        const nextEl = document.getElementById(`input-${activeTab}-${nextR}-${nextC}`);
        if (nextEl) { nextEl.focus(); if (nextEl.select) nextEl.select(); }
    }
  };

  const calculateGrandTotal = (key) => {
      return allRowKeys.reduce((sum, loc) => sum + (parseInt(data[loc]?.[key]) || 0), 0);
  };

  // ==========================================
  // DATA VALIDATION LOGIC
  // ==========================================
  const gtSex = calculateGrandTotal('male') + calculateGrandTotal('female');
  const gtAge = calculateGrandTotal('ageUnder15') + calculateGrandTotal('ageOver15');
  const gtCases = calculateGrandTotal('cat1') + 
                  (calculateGrandTotal('cat2EligPri') + calculateGrandTotal('cat2EligBoost') + calculateGrandTotal('cat2NonElig')) + 
                  (calculateGrandTotal('cat3EligPri') + calculateGrandTotal('cat3EligBoost') + calculateGrandTotal('cat3NonElig'));
  const gtAnimals = calculateGrandTotal('typeDog') + calculateGrandTotal('typeCat') + calculateGrandTotal('typeOthers');

  const hasAnyData = gtSex > 0 || gtAge > 0 || gtCases > 0 || gtAnimals > 0;
  const isTotalsMatch = hasAnyData ? (gtSex === gtAge && gtSex === gtCases && gtCases === gtAnimals) : true;

  let pepExceedCount = 0;
  
  allRowKeys.forEach(loc => {
      const row = data[loc] || {};
      const n = (name) => parseInt(row[name]) || 0;

      const e2p = n('cat2EligPri'), c2p = n('compCat2Pri');
      const e2b = n('cat2EligBoost'), c2b = n('compCat2Boost');
      const e3p = n('cat3EligPri'), c3z = n('compCat3PriErig') + n('compCat3PriHrig');
      const e3b = n('cat3EligBoost'), c3b = n('compCat3Boost');
      
      const totElig = e2p + e2b + e3p + e3b;
      const totComp = c2p + c2b + c3z + c3b;

      if (e2p > 0 && c2p / e2p > 1) pepExceedCount++;
      if (e2b > 0 && c2b / e2b > 1) pepExceedCount++;
      if (e3p > 0 && c3z / e3p > 1) pepExceedCount++;
      if (e3b > 0 && c3b / e3b > 1) pepExceedCount++;
      if (totElig > 0 && totComp / totElig > 1) pepExceedCount++;
  });

  const gt_e2p = calculateGrandTotal('cat2EligPri'), gt_c2p = calculateGrandTotal('compCat2Pri');
  const gt_e2b = calculateGrandTotal('cat2EligBoost'), gt_c2b = calculateGrandTotal('compCat2Boost');
  const gt_e3p = calculateGrandTotal('cat3EligPri'), gt_c3z = calculateGrandTotal('compCat3PriErig') + calculateGrandTotal('compCat3PriHrig');
  const gt_e3b = calculateGrandTotal('cat3EligBoost'), gt_c3b = calculateGrandTotal('compCat3Boost');
  const gt_totElig = gt_e2p + gt_e2b + gt_e3p + gt_e3b;
  const gt_totComp = gt_c2p + gt_c2b + gt_c3z + gt_c3b;

  if (gt_e2p > 0 && gt_c2p / gt_e2p > 1) pepExceedCount++;
  if (gt_e2b > 0 && gt_c2b / gt_e2b > 1) pepExceedCount++;
  if (gt_e3p > 0 && gt_c3z / gt_e3p > 1) pepExceedCount++;
  if (gt_e3b > 0 && gt_c3b / gt_e3b > 1) pepExceedCount++;
  if (gt_totElig > 0 && gt_totComp / gt_totElig > 1) pepExceedCount++;

  const tabs = [
    { id: 'tab1', label: 'ANIMAL BITE CASES' },
    { id: 'pep', label: 'POST-EXPOSURE PROPHYLAXIS' },
    { id: 'tab3', label: 'BITING ANIMALS & CASES' }
  ];

  const renderRow = (location, globalRowIndex, isOtherRow) => {
      const rowData = data[location] || {};
      const population = populations?.[location] || 0;
      const isNonAbra = location === "Non-Abra";

      return (
        <tr key={`${activeTab}-${location}`} className="hover:bg-blue-50/40 transition-colors group/row">
            <td style={{...STYLES.tdData, padding: '0 10px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: isNonAbra ? '#C2410C' : TEXT_COLOR, backgroundColor: isNonAbra ? '#FFEDD5' : '#ffffff', borderRight: `2px solid ${BORDER_COLOR}`}} className="sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{location}</span>
                  {isOtherRow && !isRowReadOnly && (
                    <button
                      onClick={() => onDeleteOtherRow(location)}
                      className="opacity-0 group-hover/row:opacity-100 p-1 hover:bg-rose-100 text-rose-500 rounded transition-all active:scale-90"
                      title="Remove this location"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  )}
              </div>
            </td>
            <DataCells 
                isNonAbra={isNonAbra} globalRowIndex={globalRowIndex} location={location} activeTab={activeTab} 
                rowData={rowData} population={population} totalRows={allRowKeys.length}
                onChange={handleInputChange} onKeyDown={handleKeyDown} 
                readOnly={isRowReadOnly} num={(name) => num(location, name)}
            />
        </tr>
      );
  }

  return (
    <div className="flex flex-col w-full bg-white h-[600px] lg:h-[calc(100vh-260px)] 2xl:h-[calc(100vh-240px)]">
      <style>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .hide-scrollbar::-webkit-scrollbar { width: 6px; height: 0px; }
        .hide-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .hide-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* --- DATA VALIDATION BANNERS --- */}
      <div className="flex flex-col xl:flex-row gap-2 px-3 pt-3 pb-1 shrink-0 bg-slate-50 border-b border-slate-200">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md border text-[11px] sm:text-xs font-bold ${
              isTotalsMatch ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
              {isTotalsMatch ? <CheckCircle size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}
              <span>
                  {isTotalsMatch 
                      ? "✅ Totals of sex, age, animal bite cases, and biting animals match" 
                      : "❌ Totals of sex, age, animal bite cases, and biting animals DO NOT match. Please recheck the data."}
              </span>
          </div>

          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md border text-[11px] sm:text-xs font-bold ${
              pepExceedCount === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
              {pepExceedCount === 0 ? <CheckCircle size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}
              <span>
                  {pepExceedCount === 0 
                      ? "✅ PEP Coverage ≤100%" 
                      : `❌ PEP Coverage cannot exceed 100%. ${pepExceedCount} cell(s) exceed 100%. Please recheck the data.`}
              </span>
          </div>
      </div>

      <div className="flex items-center bg-slate-100 border-b border-slate-200 px-3 py-1.5 gap-1.5 flex-shrink-0">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-[10.5px] font-extrabold transition-all duration-200
              ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div id="v2-table-container" className="w-full overflow-auto hide-scrollbar flex-grow bg-white relative scroll-smooth">
        <table className="w-full border-collapse tabular-nums relative">
          <thead className="sticky top-0 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
            {activeTab === 'tab1' && <Tab1Headers />}
            {activeTab === 'pep' && <Tab2Headers />}
            {activeTab === 'tab3' && <Tab3Headers />}
          </thead>
          <tbody>
            
            {baseRowKeys.map((location, index) => renderRow(location, index, false))}
            
            {otherRowKeys.length > 0 && (
                <tr className="bg-slate-100">
                    <td colSpan={21} style={{...STYLES.tdData, padding: '6px 10px', textAlign: 'left', fontWeight: '800', fontSize: '11px', color: '#475569', backgroundColor: '#F1F5F9', borderTop: `2px solid ${BORDER_COLOR}`, borderBottom: `1px solid ${BORDER_COLOR}`}} className="sticky left-0 z-10">
                        OTHER MUNICIPALITIES / NON-ABRA
                    </td>
                </tr>
            )}

            {otherRowKeys.map((location, index) => {
                const globalIndex = baseRowKeys.length + index;
                return renderRow(location, globalIndex, true);
            })}

          </tbody>
          <tfoot className="sticky bottom-0 z-40 shadow-[0_-2px_4px_rgba(0,0,0,0.04)] border-t-[3px] border-slate-400">
             <tr>
               <td style={{...STYLES.tdGrandTotal, textAlign: 'left', padding: '8px 10px', backgroundColor: GRAND_TOTAL_BG, borderRight: `2px solid ${BORDER_COLOR}`}} className="sticky left-0 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">
                 <span className="font-black text-slate-800">GRAND TOTAL</span>
               </td>
               <GrandTotalCells activeTab={activeTab} calculate={calculateGrandTotal} populations={populations} />
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const DataCells = ({ isNonAbra, location, globalRowIndex, activeTab, rowData, population, totalRows, onChange, onKeyDown, readOnly, num }) => {
  const renderInput = (name, colIndex) => {
    // STRICT BLANK VS ZERO RENDER FIX:
    // This checks if the database specifically sent us the number 0 or string '0'
    // If they did, it shows it. Otherwise, it stays a beautifully clean blank ''.
    const cellValue = rowData[name];
    const displayValue = (cellValue !== undefined && cellValue !== null && cellValue !== '') ? cellValue : '';

    return (
      <input 
        id={`input-${activeTab}-${globalRowIndex}-${colIndex}`} 
        type="number" 
        value={displayValue} 
        onChange={(e) => onChange(location, name, e.target.value)} 
        onKeyDown={(e) => onKeyDown(e, location, colIndex, globalRowIndex, totalRows)} 
        onWheel={(e) => e.target.blur()} 
        readOnly={readOnly}
        className={`outline-none w-full h-full py-1.5 min-h-[28px] text-center text-[11px] font-bold bg-transparent transition-all box-border
          ${readOnly ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 hover:bg-slate-50 focus:bg-white focus:ring-[1.5px] focus:ring-inset focus:ring-blue-500'}`} 
      />
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
    
    const isMismatch = (sexTot > 0 || ageTot > 0 || casesTot > 0) && (sexTot !== ageTot || sexTot !== casesTot);
    const valStyle = (base) => ({ ...base, backgroundColor: isMismatch ? '#FEE2E2' : base.backgroundColor, color: isMismatch ? '#B91C1C' : base.color });
    
    return (
      <>
        <td style={STYLES.tdData}>
            {isNonAbra ? <div className="text-center text-slate-400 italic text-[10px] font-semibold py-1.5">N/A</div> : <div className="text-center text-slate-700 text-[10.5px] font-bold py-1.5">{population.toLocaleString()}</div>}
        </td>
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
        return <td style={{...STYLES.tdTotal, backgroundColor: err ? '#FEE2E2' : TOTAL_BG, color: err ? '#B91C1C' : '#0F172A'}}>{pct.toFixed(1)}%</td>;
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
      <td style={{...STYLES.tdGrandTotal, color: '#B91C1C', backgroundColor: '#FEE2E2'}}>{(population > 0 && !isNonAbra) ? ((num('rabiesCases') / population) * 1000000).toFixed(2) : '0.00'}</td>
    </>
  );
};

const GrandTotalCells = ({ activeTab, calculate, populations }) => {
    const fPct = (n, d) => d > 0 ? ((n/d)*100).toFixed(1)+'%' : '0.0%';
    const totalPop = Object.values(populations || {}).reduce((sum, val) => sum + val, 0);

    if (activeTab === 'tab1') {
        const sM = calculate('male'), sF = calculate('female'), sSex = sM + sF;
        const sU = calculate('ageUnder15'), sO = calculate('ageOver15'), sAge = sU + sO;
        const sC1 = calculate('cat1');
        const sC2 = calculate('cat2EligPri') + calculate('cat2EligBoost') + calculate('cat2NonElig');
        const sC3 = calculate('cat3EligPri') + calculate('cat3EligBoost') + calculate('cat3NonElig');
        return (
            <>
                <td style={STYLES.tdGrandTotal}>{totalPop.toLocaleString()}</td>
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
    
    const totalRabies = calculate('rabiesCases');
    const grandIncidence = totalPop > 0 ? ((totalRabies / totalPop) * 1000000).toFixed(2) : '0.00';
    
    return (
        <>
            <td style={STYLES.tdGrandTotal}>{calculate('typeDog')}</td><td style={STYLES.tdGrandTotal}>{calculate('typeCat')}</td><td style={STYLES.tdGrandTotal}>{calculate('typeOthers')}</td>
            <td style={STYLES.tdGrandTotal}>{calculate('statusPet')}</td><td style={STYLES.tdGrandTotal}>{calculate('statusStray')}</td><td style={STYLES.tdGrandTotal}>{calculate('statusUnk')}</td>
            <td style={STYLES.tdGrandTotal}>{calculate('typeDog')+calculate('typeCat')+calculate('typeOthers')}</td>
            <td style={{...STYLES.tdGrandTotal, color: '#B91C1C'}}>{totalRabies}</td>
            <td style={{...STYLES.tdGrandTotal, color: '#B91C1C', backgroundColor: '#FEE2E2'}}>{grandIncidence}</td>
        </>
    );
};

const Tab1Headers = () => (
  <>
    <tr>
      <th rowSpan={5} style={{...STYLES.thLocation, borderRight: `2px solid ${BORDER_COLOR}`}} className="sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">LOCATION<br/><span style={{fontSize:'8.5px', fontWeight:'600', color:'#64748B'}}>(Barangay / Municipality)</span></th>
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
      <th rowSpan={5} style={{...STYLES.thLocation, borderRight: `2px solid ${BORDER_COLOR}`}} className="sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">LOCATION<br/>
      <span style={{fontSize:'8.5px', fontWeight:'600', color:'#64748B'}}>(Barangay / Municipality)</span></th>
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
      <th rowSpan={5} style={{...STYLES.thLocation, borderRight: `2px solid ${BORDER_COLOR}`}} className="sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)]">LOCATION<br/><span style={{fontSize:'8.5px', fontWeight:'600', color:'#64748B'}}>(Barangay / Municipality)</span></th>
      <th colSpan={7} style={STYLES.thMain}>BITING ANIMALS (7)</th><th colSpan={2} style={STYLES.thMain}>HUMAN RABIES CASES</th>
    </tr>
    <tr><th colSpan={3} style={STYLES.thGroup}>Type</th><th colSpan={3} style={STYLES.thGroup}>Status</th><th rowSpan={4} style={STYLES.thGrandTotal}>Total</th><th rowSpan={4} style={{...STYLES.thLeaf, color:'#B91C1C'}}>Cases (PIDSR c/o RESU)</th><th rowSpan={4} style={{...STYLES.thLeaf, minWidth: '110px', backgroundColor:'#FEE2E2', color:'#991B1B'}}>Incidence Proportion (per 10⁶)</th></tr>
    <tr><th rowSpan={3} style={STYLES.thLeaf}>Dog (7a)</th><th rowSpan={3} style={STYLES.thLeaf}>Cat (7b)</th><th rowSpan={3} style={STYLES.thLeaf}>Others (7c)</th><th rowSpan={3} style={STYLES.thLeaf}>Pet/ Domestic</th><th rowSpan={3} style={STYLES.thLeaf}>Stray/ Free-roaming</th><th rowSpan={3} style={STYLES.thLeaf}>Unknown</th></tr>
    <tr></tr><tr></tr>
  </>
);

export default MainReportTableV2;