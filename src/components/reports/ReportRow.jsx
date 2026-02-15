import React from 'react';
import PropTypes from 'prop-types';
import { XCircle } from 'lucide-react';
import { PDF_STYLES, MUNICIPALITIES } from '../../lib/constants';

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
  
  // Helper to handle input changes
  const handleChange = (field, value) => {
    onChange(rowKey, field, value);
  };

  return (
    <tr style={rowStyle} className={className}>
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
          <input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(f, e.target.value)} style={PDF_STYLES.input} />
        </td>
      ))}
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.sexTotal}</td>
      
      {/* Age */}
      {['ageLt15','ageGt15'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(f, e.target.value)} style={PDF_STYLES.input} />
        </td>
      ))}
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold', color: c.sexMismatch ? '#ef4444' : 'inherit'}}>{c.ageTotal}</td>
      
      {/* Category */}
      {['cat1','cat2','cat3'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(f, e.target.value)} style={PDF_STYLES.input} />
        </td>
      ))}
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, color:'#6b7280'}}>{c.cat23}</td>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.catTotal}</td>
      
      {/* Status */}
      {['totalPatients','abCount'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(f, e.target.value)} style={PDF_STYLES.input} />
        </td>
      ))}
      
      {/* PEP */}
      {['pvrv','pcecv','hrig','erig'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(f, e.target.value)} style={PDF_STYLES.input} />
        </td>
      ))}
      
      {/* Animals */}
      {['dog','cat','othersCount'].map(f => (
        <td key={f} style={{...PDF_STYLES.border, padding:0}}>
          <input disabled={isRowReadOnly} type="number" min="0" value={row[f]} onChange={e=>handleChange(f, e.target.value)} style={PDF_STYLES.input} />
        </td>
      ))}
      <td style={{...PDF_STYLES.border, padding:0}}>
        {/* Changed to Textarea for wrapping */}
        <textarea 
          disabled={isRowReadOnly} 
          value={row.othersSpec} 
          onChange={e=>handleChange('othersSpec', e.target.value)} 
          style={{
            ...PDF_STYLES.inputText, 
            height: 'auto', 
            minHeight: '30px', 
            resize: 'vertical', 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.2', 
            padding: '4px'
          }} 
          rows={2}
        />
      </td>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontWeight:'bold'}}>{c.animalTotal}</td>
      
      {/* Washed */}
      <td style={{...PDF_STYLES.border, padding:0}}>
        <input disabled={isRowReadOnly} type="number" min="0" value={row.washed} onChange={e=>handleChange('washed', e.target.value)} style={PDF_STYLES.input} />
      </td>
      <td style={{...PDF_STYLES.border, ...PDF_STYLES.cell, ...PDF_STYLES.bgGray, fontSize:'10px', color:'#6b7280'}}>{c.percent}</td>
      
      {/* Remarks */}
      <td style={{...PDF_STYLES.border, padding:0}}>
        {/* Changed to Textarea for wrapping */}
        <textarea 
          disabled={isRowReadOnly} 
          value={row.remarks} 
          onChange={e=>handleChange('remarks', e.target.value)} 
          style={{
            ...PDF_STYLES.inputText, 
            height: 'auto', 
            minHeight: '30px', 
            resize: 'vertical', 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.2', 
            padding: '4px'
          }} 
          rows={2}
        />
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.row === nextProps.row &&
    prevProps.isRowReadOnly === nextProps.isRowReadOnly &&
    prevProps.isOtherRow === nextProps.isOtherRow &&
    prevProps.isHost === nextProps.isHost &&
    JSON.stringify(prevProps.computations) === JSON.stringify(nextProps.computations) &&
    prevProps.className === nextProps.className 
  );
});

ReportRow.propTypes = {
  rowKey: PropTypes.string.isRequired,
  row: PropTypes.object.isRequired,
  computations: PropTypes.shape({
    sexTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ageTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cat23: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    catTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    animalTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    percent: PropTypes.string,
    sexMismatch: PropTypes.bool
  }).isRequired,
  isRowReadOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onDeleteRow: PropTypes.func,
  isOtherRow: PropTypes.bool,
  isHost: PropTypes.bool,
  className: PropTypes.string
};

export default ReportRow;