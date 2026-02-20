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
  
  const rowStyle = isHost ? PDF_STYLES.hostRow : PDF_STYLES.rowEven;
  
  // --- Ref for Auto-Resizing the "Specify" Box ---
  const specifyRef = useRef(null);

  // --- Auto-resize logic ---
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

  const getInputStyle = (isLocked = false) => ({
    ...PDF_STYLES.input,
    cursor: isLocked || isRowReadOnly ? 'default' : 'text',
  });

  // Modern Web Classes for Inputs (Ignored by jspdf-autotable)
  // Added py-1, min-h-[28px], and focus:ring-inset for better typing UI
  const inputWebClasses = isRowReadOnly 
    ? "outline-none bg-transparent w-full h-full" 
    : "outline-none transition-all hover:bg-gray-100 focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full h-full py-1 min-h-[28px]";

  const textareaWebClasses = isRowReadOnly
    ? "outline-none bg-transparent w-full"
    : "outline-none transition-all hover:bg-gray-100 focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-sm w-full py-1";

  return (
    <tr style={rowStyle} className={`${className || ''} hover:bg-blue-50/50 transition-colors group`}>
      {/* Municipality Name */}
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...rowStyle, textAlign:'left', whiteSpace:'nowrap', color: MUNICIPALITIES.includes(rowKey) ? '#111827' : '#4b5563', paddingLeft: MUNICIPALITIES.includes(rowKey) ? '0.75rem' : '1.5rem', fontWeight: MUNICIPALITIES.includes(rowKey) ? 'bold' : 'normal'}}>
        <div className="flex justify-between items-center group/row">
            <span>{rowKey} {isHost && <span style={{fontSize:'10px', color:'#9ca3af', fontWeight:'normal'}}>(Total)</span>}</span>
            {isOtherRow && !isRowReadOnly && (
              <button onClick={() => onDeleteRow(rowKey)} className="text-gray-400 hover:text-red-600 transition px-2 no-print" title="Remove row">
                <XCircle size={14} />
              </button>
            )}
        </div>
      </td>
      
      {/* Sex */}
      {['male','female'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.sexTotal}</td>
      
      {/* Age */}
      {['ageLt15','ageGt15'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold', color: c.sexMismatch ? '#ef4444' : 'inherit'}}>{c.ageTotal}</td>
      
      {/* Category */}
      {['cat1','cat2','cat3'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, color:'#6b7280'}}>{c.cat23}</td>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.catTotal}</td>
      
      {/* Status */}
      {['totalPatients','abCount'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      
      {/* PEP */}
      {['pvrv','pcecv','hrig','erig'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      
      {/* Animals */}
      {['dog','cat'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input 
            readOnly={isRowReadOnly} 
            type="number" 
            min="0" 
            value={row[f]} 
            onChange={e=>handleChange(f, e.target.value)} 
            style={getInputStyle()} 
            className={inputWebClasses}
          />
        </td>
      ))}
      
      {/* Others Count (Locked Style) */}
      <td style={{...PDF_STYLES.border, padding:0}}>
        <input 
          readOnly={true} 
          type="number" 
          value={row.othersCount} 
          tabIndex={-1} 
          style={{
            ...getInputStyle(true), 
            backgroundColor: '#f3f4f6', 
            color: '#6b7280',
            pointerEvents: 'none'
          }} 
          className="outline-none bg-transparent w-full h-full"
        />
      </td>

      {/* Others Specify (Auto-Resizing) */}
      <td style={{...PDF_STYLES.border, padding:0}}>
        <textarea 
          ref={specifyRef} 
          readOnly={isRowReadOnly} 
          value={row.othersSpec} 
          onChange={handleSpecifyChange} 
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
            cursor: isRowReadOnly ? 'default' : 'text'
          }} 
          rows={1}
          className={textareaWebClasses}
        />
      </td>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.animalTotal}</td>
      
      {/* Washed */}
      <td style={{...PDF_STYLES.border, padding:0}}>
        <input 
          readOnly={isRowReadOnly} 
          type="number" 
          min="0" 
          value={row.washed} 
          onChange={e=>handleChange('washed', e.target.value)} 
          style={getInputStyle()} 
          className={inputWebClasses}
        />
      </td>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontSize:'10px', color:'#6b7280'}}>{c.percent}</td>
      
      {/* Remarks */}
      <td style={{...PDF_STYLES.border, padding:0}}>
        <textarea 
          readOnly={isRowReadOnly} 
          value={row.remarks} 
          onChange={e=>handleChange('remarks', e.target.value)} 
          style={{
            ...PDF_STYLES.inputText, 
            height: 'auto', 
            minHeight: '30px', 
            resize: 'vertical', 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.2', 
            padding: '4px',
            cursor: isRowReadOnly ? 'default' : 'text'
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