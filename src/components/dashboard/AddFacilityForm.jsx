import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { MUNICIPALITY_DATA } from '../../lib/constants'; 

export default function AddFacilityForm({ onAdd, loading }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Rural Health Unit');
  const [ownership, setOwnership] = useState('Government');
  const [municipality, setMunicipality] = useState('');
  const [barangays, setBarangays] = useState('');

  // Handle Type changes
  useEffect(() => {
    if (type === 'Rural Health Unit') {
      setOwnership('Government');
      // Reset logic for RHU
      setMunicipality('');
      setBarangays('');
    } else {
      // Hospital or Clinic
      if (type === 'Clinic') setOwnership('Private');
      else setOwnership('Government');
      
      // Auto-set for Province-wide facilities
      setMunicipality('Province-wide');
      // Catchment = All Municipalities (keys of the data object)
      const allTowns = Object.keys(MUNICIPALITY_DATA).join(', ');
      setBarangays(allTowns);
    }
  }, [type]);

  const handleMunicipalityChange = (e) => {
    const selectedMuni = e.target.value;
    setMunicipality(selectedMuni);

    if (selectedMuni && MUNICIPALITY_DATA[selectedMuni]) {
      const list = MUNICIPALITY_DATA[selectedMuni].join(', ');
      setBarangays(list);
    } else {
      setBarangays('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ name, type, ownership, municipality, barangays });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Facility Name</label>
        <input 
          type="text" 
          required 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" 
          placeholder="e.g. Bangued RHU" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)} 
            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
          >
            <option value="Rural Health Unit">Rural Health Unit</option>
            <option value="Hospital">Hospital</option>
            <option value="Clinic">Clinic</option>
          </select>
        </div>

        {/* Ownership */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ownership</label>
          <select 
            value={ownership} 
            onChange={e => setOwnership(e.target.value)} 
            disabled={type !== 'Hospital'} 
            className={`w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none ${type !== 'Hospital' ? 'bg-gray-100 text-gray-500' : ''}`}
          >
            <option value="Government">Government</option>
            <option value="Private">Private</option>
          </select>
        </div>
      </div>

      {/* Municipality Dropdown - ONLY FOR RHU */}
      {type === 'Rural Health Unit' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Municipality</label>
          <select 
            required
            value={municipality} 
            onChange={handleMunicipalityChange} 
            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
          >
            <option value="" disabled>Select Municipality</option>
            {Object.keys(MUNICIPALITY_DATA).map(muni => (
              <option key={muni} value={muni}>{muni}</option>
            ))}
          </select>
        </div>
      )}

      {/* Catchment Area */}
      <div>
         <label className="block text-xs font-medium text-gray-700 mb-1">
            {type === 'Rural Health Unit' ? 'Catchment Barangays' : 'Covered Municipalities'}
         </label>
         <textarea 
            value={barangays} 
            onChange={e => setBarangays(e.target.value)} 
            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" 
            rows={4} 
            placeholder="Area list..."
          ></textarea>
         <p className="text-[10px] text-gray-400 mt-1">
           {type === 'Rural Health Unit' 
             ? "Auto-populated based on Municipality." 
             : "Hospitals & Clinics cover all municipalities by default."}
         </p>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition text-sm font-medium flex items-center justify-center gap-2">
        {loading && <Loader2 size={16} className="animate-spin" />}
        Add Facility
      </button>
    </form>
  );
}