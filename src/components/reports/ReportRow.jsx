import React, { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { XCircle } from 'lucide-react';
import { PDF_STYLES, MUNICIPALITIES } from '../../lib/constants';
import { parseAnimalCountFromText, autoCorrectAnimalSpelling } from '../../lib/utils'; 

const ReportRow = React.memo(({ 
  rowKey, 
  row, 
  computations: c, 
  isRowReadOnly, 
  onChange, 
  onDeleteRow, 
  isOtherRow,
  isHost,
  className 
}) => {
  
  const isTotalRow = isHost && isRowReadOnly;
  const rowStyle = isTotalRow 
    ? { ...PDF_STYLES.hostRow, backgroundColor: '#cbd5e1' } 
    : (isHost ? PDF_STYLES.hostRow : PDF_STYLES.rowEven);
  
  const specifyRef = useRef(null);

  useLayoutEffect(() => {
    if (specifyRef.current) {
      specifyRef.current.style.height = 'auto';
      specifyRef.current.style.height = `${specifyRef.current.scrollHeight}px`;
    }
  }, [row.othersSpec]);

  const handleChange = (field, value) => {
    onChange(rowKey, field, value);
  };

  // --- NEW: INSTANT SMARTPHONE-STYLE AUTOCORRECT ---
  const handleSpecifyChange = (e) => {
    let newText = e.target.value;
    
    // The moment they type a space, comma, or enter, auto-correct the previous word instantly!
    if (/[\s,;]$/.test(newText)) {
        newText = autoCorrectAnimalSpelling(newText);
    }
    
    onChange(rowKey, 'othersSpec', newText);
    
    if (!isRowReadOnly) {
       const autoCount = parseAnimalCountFromText(newText);
       onChange(rowKey, 'othersCount', autoCount === 0 ? '' : autoCount.toString());
    }
  };

  const handleSpecifyBlur = (e) => {
    const correctedText = autoCorrectAnimalSpelling(e.target.value);
    if (correctedText !== e.target.value && !isRowReadOnly) {
        onChange(rowKey, 'othersSpec', correctedText);
    }
  };

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

  const getInputStyle = (isLocked = false, hasError = false) => ({
    ...PDF_STYLES.input,
    cursor: isLocked || isRowReadOnly ? 'default' : 'text',
    backgroundColor: hasError ? '#fee2e2' : 'transparent',
    color: hasError ? '#dc2626' : (isRowReadOnly && isTotalRow ? '#0f172a' : '#1e3a8a')
  });

  const getCellWebClasses = (isInput, hasError = false) => {
      let baseClasses = isInput
          ? "outline-none transition-all rounded-sm w-full h-full py-1.5 min-h-[32px] text-center text-[13px] font-bold "
          : "outline-none transition-all rounded-sm w-full py-1 text-sm font-medium ";
          
      if (isRowReadOnly) {
          return `${baseClasses} bg-transparent ${isTotalRow ? 'text-slate-900' : 'text-slate-700'}`;
      }
      
      if (hasError) {
          return `${baseClasses} bg-red-50 text-red-600 focus:ring-2 focus:ring-inset focus:ring-red-500`;
      }
      
      return `${baseClasses} text-blue-900 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500`;
  };

  // --- VALIDATION LOGIC FOR STYLING ---
  const sexSum = c.sexTotal;
  const ageSum = c.ageTotal;
  const cat23Sum = c.cat23;
  const animalSum = c.animalTotal;
  const washedCount = Number(row.washed) || 0;

  const hasAnyData = sexSum > 0 || ageSum > 0 || c.catTotal > 0 || animalSum > 0;
  
  const isSexAgeMismatch = hasAnyData && (sexSum !== ageSum);
  const isAnimalMismatch = hasAnyData && (cat23Sum !== animalSum);
  const isWashedError = hasAnyData && (washedCount > animalSum);
  const isGoldenError = isSexAgeMismatch || isAnimalMismatch;
  
  const errorBgColor = '#fee2e2';
  const errorTextColor = '#dc2626';
  const defaultCellBg = isTotalRow ? '#cbd5e1' : '#E2E8F0';
  const defaultTextColor = '#1E293B';

  return (
    <tr style={rowStyle} className={`${className || ''} ${isTotalRow ? '' : 'hover:bg-blue-50/50'} transition-colors group`}>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: defaultCellBg, textAlign:'left', whiteSpace:'nowrap', color: '#1E293B', paddingLeft: MUNICIPALITIES.includes(rowKey) ? '0.75rem' : '1.5rem', fontWeight: MUNICIPALITIES.includes(rowKey) ? 'bold' : 'normal'}}>
        <div className="flex justify-between items-center group/row">
            <span>{rowKey} {isHost && <span style={{fontSize:'10px', color:'#1E293B', fontWeight:'normal'}}>(Total)</span>}</span>
            {isOtherRow && !isRowReadOnly && (
              <button onClick={() => onDeleteRow(rowKey)} className="text-gray-400 hover:text-red-600 transition px-2 no-print" title="Remove row">
                <XCircle size={14} />
              </button>
            )}
        </div>
      </td>
      
      {['male','female'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f] ?? ''} 
            onChange={e=>handleChange(f, e.target.value)}
            onKeyDown={handleGridKeyDown} 
            style={getInputStyle()} 
            className={getCellWebClasses(true)}
          />
        </td>
      ))}
      <td className="text-center text-sm font-bold transition-colors" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isGoldenError ? errorBgColor : defaultCellBg, color: isGoldenError ? errorTextColor : defaultTextColor}}>
          {c.sexTotal}
      </td>
      
      {['ageLt15','ageGt15'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f] ?? ''} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={getCellWebClasses(true)}
          />
        </td>
      ))}
      <td className="text-center text-sm font-bold transition-colors" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isGoldenError ? errorBgColor : defaultCellBg, color: isGoldenError ? errorTextColor : defaultTextColor}}>
          {c.ageTotal}
      </td>
      
      {['cat1','cat2','cat3'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f] ?? ''} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={getCellWebClasses(true)}
          />
        </td>
      ))}
      <td className="text-center text-sm font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: defaultCellBg, color: defaultTextColor}}>{c.cat23}</td>
      <td className="text-center text-sm font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: defaultCellBg, color: defaultTextColor}}>{c.catTotal}</td>
      
      {['totalPatients','abCount'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f] ?? ''} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={getCellWebClasses(true)}
          />
        </td>
      ))}
      
      {['pvrv','pcecv','hrig','erig'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f] ?? ''} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={getCellWebClasses(true)}
          />
        </td>
      ))}
      
      {['dog','cat'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f] ?? ''} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={getCellWebClasses(true)}
          />
        </td>
      ))}
      
      <td style={{...PDF_STYLES.border, padding:0, backgroundColor: defaultCellBg}}>
        <input 
          readOnly={true} 
          type="number" 
          value={row.othersCount ?? ''} 
          tabIndex={-1} 
          style={{
            ...getInputStyle(true), 
            backgroundColor: defaultCellBg, 
            color: defaultTextColor,
            fontWeight: 'normal',
            pointerEvents: 'none'
          }} 
          className="outline-none bg-transparent w-full h-full text-center text-sm font-semibold text-slate-800"
        />
      </td>

      <td style={{...PDF_STYLES.border, padding:0}}>
        <textarea 
          ref={specifyRef} 
          readOnly={isRowReadOnly} 
          value={row.othersSpec ?? ''} 
          onChange={handleSpecifyChange} 
          onBlur={handleSpecifyBlur} 
          onKeyDown={handleGridKeyDown}
          spellCheck={false} // <-- Removes the slow, native browser red line
          placeholder={isRowReadOnly ? "" : "e.g. 1 Monkey"}
          style={{
            ...PDF_STYLES.inputText, 
            height: 'auto', 
            minHeight: '30px', 
            overflow: 'hidden', 
            resize: 'none', 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.2', 
            padding: '4px',
            cursor: isRowReadOnly ? 'default' : 'text',
            fontWeight: 'normal',
            color: defaultTextColor
          }} 
          rows={1}
          className={getCellWebClasses(false)}
        />
      </td>
      
      <td className="text-center text-sm font-bold transition-colors" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isGoldenError ? errorBgColor : defaultCellBg, color: isGoldenError ? errorTextColor : defaultTextColor}}>
          {c.animalTotal}
      </td>
      
      <td style={{...PDF_STYLES.border, padding:0}}>
        <input 
          readOnly={isRowReadOnly} 
          type="number" 
          min="0" 
          value={row.washed ?? ''} 
          onChange={e=>handleChange('washed', e.target.value)} 
          onKeyDown={handleGridKeyDown}
          style={getInputStyle(false, isWashedError)} 
          className={getCellWebClasses(true, isWashedError)}
        />
      </td>
      
      <td className="text-center text-[11px] font-bold transition-colors" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isWashedError ? errorBgColor : defaultCellBg, color: isWashedError ? errorTextColor : defaultTextColor}}>
          {c.percent}
      </td>
      
      <td style={{...PDF_STYLES.border, padding:0}}>
        <textarea 
          readOnly={isRowReadOnly} 
          value={row.remarks ?? ''} 
          onChange={e=>handleChange('remarks', e.target.value)} 
          onKeyDown={handleGridKeyDown}
          style={{
            ...PDF_STYLES.inputText, 
            height: 'auto', 
            minHeight: '30px', 
            resize: 'vertical', 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.2', 
            padding: '4px',
            cursor: isRowReadOnly ? 'default' : 'text',
            fontWeight: 'normal',
            color: defaultTextColor
          }} 
          rows={2}
          className={getCellWebClasses(false)}
        />
      </td>
    </tr>
  );
}, (prev, next) => {
    return prev.row === next.row && prev.isRowReadOnly === next.isRowReadOnly && prev.computations === next.computations;
});

ReportRow.propTypes = {
  rowKey: PropTypes.string.isRequired,
  row: PropTypes.object.isRequired,
  computations: PropTypes.object.isRequired,
  isRowReadOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onDeleteRow: PropTypes.func,
  isOtherRow: PropTypes.bool,
  isHost: PropTypes.bool,
  className: PropTypes.string
};

export default ReportRow;