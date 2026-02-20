import React, { useState } from 'react';
import { Loader2, PlusCircle } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-5">
      
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Facility Type</label>
        <select 
            value={type} 
            onChange={handleTypeChange} 
            className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-semibold text-zinc-900 shadow-sm cursor-pointer"
        >
          <option value="RHU">RHU (Rural Health Unit)</option>
          <option value="Hospital">Hospital</option>
          <option value="Clinic">Clinic</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Logic: If RHU, show Municipality Dropdown. If Hospital/Clinic, show Ownership. */}
          {type === 'RHU' ? (
              <div>
                 <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Municipality</label>
                 <select 
                    value={selectedMunicipality} 
                    onChange={handleMunicipalityChange}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-semibold text-zinc-900 shadow-sm cursor-pointer"
                 >
                    <option value="">-- Select Municipality --</option>
                    {MUNICIPALITIES.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                 </select>
              </div>
          ) : (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Ownership</label>
                <select 
                    value={ownership} 
                    onChange={e => setOwnership(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-semibold text-zinc-900 shadow-sm cursor-pointer"
                >
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                </select>
              </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Facility Name</label>
            <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400 font-semibold text-zinc-900 shadow-sm" 
                placeholder={type === 'RHU' ? "e.g. Bangued RHU" : "e.g. Abra Provincial Hospital"} 
            />
          </div>
      </div>
      
      {/* Catchment Area: Always visible but auto-filled */}
      <div>
           <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Catchment Area (Auto-filled)</label>
           <textarea 
               value={barangays} 
               onChange={e => setBarangays(e.target.value)} 
               className={`w-full border px-4 py-3 rounded-xl text-sm outline-none transition-all shadow-sm ${type !== 'RHU' ? 'bg-gray-100/70 border-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-zinc-900'}`}
               rows={4} 
               readOnly={type !== 'RHU'} 
               placeholder="Select a municipality or choose Hospital/Clinic..."
           ></textarea>
           <p className="text-[10px] font-semibold text-gray-400 mt-1.5 ml-1">
              {(type === 'Hospital' || type === 'Clinic') 
                ? "* Automatically includes all 27 municipalities for Hospitals & Clinics." 
                : "* Catchment is based on the selected municipality."}
           </p>
      </div>

      <div className="pt-2">
          <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-zinc-900 text-white p-3.5 rounded-xl hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98] transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
            Register Facility
          </button>
      </div>
    </form>
  );
}