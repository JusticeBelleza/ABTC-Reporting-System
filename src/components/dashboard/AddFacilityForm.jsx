import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { MUNICIPALITIES, MUNICIPALITIES_DATA } from '../../lib/constants';

export default function AddFacilityForm({ onAdd, loading }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('RHU');
  const [ownership, setOwnership] = useState('Government');
  const [barangays, setBarangays] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');

  // Handle Municipality Selection (RHU specific)
  const handleMunicipalityChange = (e) => {
    const muni = e.target.value;
    setSelectedMunicipality(muni);
    
    if (type === 'RHU') {
        if (muni) {
            setName(`${muni} RHU`);
            const catchments = MUNICIPALITIES_DATA[muni] || [];
            setBarangays(catchments.join(', '));
        } else {
            setBarangays('');
            setName('');
        }
    }
  };

  // Handle Type Change (Hospital/Clinic vs RHU)
  const handleTypeChange = (e) => {
      const newType = e.target.value;
      setType(newType);

      if (newType === 'Hospital' || newType === 'Clinic') {
          // Reset name and municipality selection
          setSelectedMunicipality('');
          setName('');
          // Auto-fill ALL municipalities for Hospital/Clinic
          setBarangays(MUNICIPALITIES.join(', '));
          // Default to Private for clinics
          if (newType === 'Clinic') setOwnership('Private');
      } else {
          // Reverting to RHU
          setOwnership('Government'); // Reset to default for RHU
          setBarangays('');
          setName('');
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass ALL data points up to the Dashboard
    onAdd(name, type, barangays, selectedMunicipality, ownership);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Facility Type</label>
        <select value={type} onChange={handleTypeChange} className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none">
          <option value="RHU">RHU (Rural Health Unit)</option>
          <option value="Hospital">Hospital</option>
          <option value="Clinic">Clinic</option>
        </select>
      </div>

      {/* Logic: If RHU, show Municipality Dropdown. If Hospital/Clinic, show Ownership. */}
      {type === 'RHU' ? (
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Municipality</label>
             <select 
                value={selectedMunicipality} 
                onChange={handleMunicipalityChange}
                className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
             >
                <option value="">-- Select Municipality --</option>
                {MUNICIPALITIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                ))}
             </select>
          </div>
      ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ownership</label>
            <select 
                value={ownership} 
                onChange={e => setOwnership(e.target.value)} 
                className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
            >
                <option value="Government">Government</option>
                <option value="Private">Private</option>
            </select>
          </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Facility Name</label>
        <input 
            type="text" 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" 
            placeholder={type === 'RHU' ? "e.g. Bangued RHU" : "e.g. Abra Provincial Hospital"} 
        />
      </div>
      
      {/* Catchment Area: Always visible but auto-filled */}
      <div>
           <label className="block text-xs font-medium text-gray-700 mb-1">Catchment Area (Auto-filled)</label>
           <textarea 
               value={barangays} 
               onChange={e => setBarangays(e.target.value)} 
               className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none bg-gray-50" 
               rows={4} 
               readOnly={type !== 'RHU'} // Make read-only for hospitals/clinics to enforce "All Municipalities"
               placeholder="Select a municipality or choose Hospital/Clinic..."
           ></textarea>
           <p className="text-[10px] text-gray-500 mt-1">
              {(type === 'Hospital' || type === 'Clinic') 
                ? "* Automatically includes all 27 municipalities for Hospitals & Clinics." 
                : "* Based on selected municipality."}
           </p>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition text-sm font-medium flex items-center justify-center gap-2">
        {loading && <Loader2 size={16} className="animate-spin" />}
        Add Facility
      </button>
    </form>
  );
}