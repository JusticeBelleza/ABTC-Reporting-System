import React from 'react';

// FIX: Changed to 'export default function' to match the import in AdminDashboard
export default function StatusBadge({ status }) { 
  const styles = { 
    // Report Statuses
    'Draft': { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }, 
    'Pending': { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }, 
    'Approved': { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }, 
    'Rejected': { backgroundColor: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' },
    
    // New Facility Statuses (Active/Disabled)
    'Active': { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }, // Green like Approved
    'Disabled': { backgroundColor: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' } // Grayed out
  }; 
  
  const style = styles[status] || styles['Draft'];
  
  return (
    <span style={{ 
      ...style, 
      padding: '2px 8px', 
      borderRadius: '4px', 
      fontSize: '11px', 
      fontWeight: '500',
      display: 'inline-block'
    }}>
      {status || 'Draft'}
    </span>
  );
};