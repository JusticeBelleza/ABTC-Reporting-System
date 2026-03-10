import React, { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { XCircle } from 'lucide-react';
import { PDF_STYLES, MUNICIPALITIES } from '../../lib/constants';
import { parseAnimalCountFromText } from '../../lib/utils';

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

  const handleSpecifyChange = (e) => {
    const newText = e.target.value;
    onChange(rowKey, 'othersSpec', newText);
    
    if (!isRowReadOnly) {
       const autoCount = parseAnimalCountFromText(newText);
       onChange(rowKey, 'othersCount', autoCount === 0 ? '' : autoCount.toString());
    }
  };

  // --- IMPROVED GRID KEYBOARD NAVIGATION ---
  const handleGridKeyDown = (e) => {
    const { key } = e;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) return;

    const isTextElement = e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text');

    if (isTextElement && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        const { selectionStart, selectionEnd, value } = e.target;
        
        // If text is highlighted, let default behavior happen
        if (selectionStart !== selectionEnd) return;
        
        // If pressing Left and not at the very beginning, just move cursor within text
        if (key === 'ArrowLeft' && selectionStart > 0) return;
        
        // If pressing Right and not at the very end, just move cursor within text
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

  const getInputStyle = (isLocked = false) => ({
    ...PDF_STYLES.input,
    cursor: isLocked || isRowReadOnly ? 'default' : 'text',
  });

  const inputWebClasses = isRowReadOnly 
    ? `outline-none bg-transparent w-full h-full text-center text-sm font-semibold ${isTotalRow ? 'text-slate-900' : 'text-slate-700'}` 
    : "outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full h-full py-1.5 min-h-[32px] text-center text-[13px] font-bold text-blue-900";

  const textareaWebClasses = isRowReadOnly
    ? `outline-none bg-transparent w-full text-sm font-semibold ${isTotalRow ? 'text-slate-900' : 'text-slate-700'}`
    : "outline-none transition-all hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full py-1 text-sm font-medium text-blue-900";

  return (
    <tr style={rowStyle} className={`${className || ''} ${isTotalRow ? '' : 'hover:bg-blue-50/50'} transition-colors group`}>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', textAlign:'left', whiteSpace:'nowrap', color: '#1E293B', paddingLeft: MUNICIPALITIES.includes(rowKey) ? '0.75rem' : '1.5rem', fontWeight: MUNICIPALITIES.includes(rowKey) ? 'bold' : 'normal'}}>
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
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)}
            onKeyDown={handleGridKeyDown} 
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      <td className="text-center text-sm font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', color: '#1E293B'}}>{c.sexTotal}</td>
      
      {['ageLt15','ageGt15'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      <td className="text-center text-sm font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', color: c.sexMismatch ? '#ef4444' : '#1E293B'}}>{c.ageTotal}</td>
      
      {['cat1','cat2','cat3'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      <td className="text-center text-sm font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', color:'#1E293B'}}>{c.cat23}</td>
      <td className="text-center text-sm font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', color:'#1E293B'}}>{c.catTotal}</td>
      
      {['totalPatients','abCount'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      
      {['pvrv','pcecv','hrig','erig'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      
      {['dog','cat'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            onKeyDown={handleGridKeyDown}
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      
      <td style={{...PDF_STYLES.border, padding:0, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0'}}>
        <input 
          readOnly={true} 
          type="number" 
          value={row.othersCount} 
          tabIndex={-1} 
          style={{
            ...getInputStyle(true), 
            backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', 
            color: '#1E293B',
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
          value={row.othersSpec} 
          onChange={handleSpecifyChange} 
          onKeyDown={handleGridKeyDown}
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
            color: '#1E293B'
          }} 
          rows={1}
          className={textareaWebClasses}
        />
      </td>
      <td className="text-center text-sm font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', color: '#1E293B'}}>{c.animalTotal}</td>
      
      <td style={{...PDF_STYLES.border, padding:0}}>
        <input 
          readOnly={isRowReadOnly} 
          type="number" 
          min="0" 
          value={row.washed} 
          onChange={e=>handleChange('washed', e.target.value)} 
          onKeyDown={handleGridKeyDown}
          style={getInputStyle()} 
          className={inputWebClasses}
        />
      </td>
      <td className="text-center text-[11px] font-bold" style={{...PDF_STYLES.border, ...PDF_STYLES.cell, backgroundColor: isTotalRow ? '#cbd5e1' : '#E2E8F0', color:'#1E293B'}}>{c.percent}</td>
      
      <td style={{...PDF_STYLES.border, padding:0}}>
        <textarea 
          readOnly={isRowReadOnly} 
          value={row.remarks} 
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
            color: '#1E293B'
          }} 
          rows={2}
          className={textareaWebClasses}
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