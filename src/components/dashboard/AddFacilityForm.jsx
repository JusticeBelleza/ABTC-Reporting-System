import React, { useState } from 'react';
import { Loader2, PlusCircle } from 'lucide-react';
import { MUNICIPALITIES, MUNICIPALITIES_DATA } from '../../lib/constants';

export default function AddFacilityForm({ onAdd, loading }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('RHU');
  const [ownership, setOwnership] = useState('Government');
  const [barangays, setBarangays] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  
  // State for the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
          setSelectedMunicipality('');
          setName('');
          setBarangays(MUNICIPALITIES.join(', '));
          if (newType === 'Clinic') setOwnership('Private');
      } else {
          setOwnership('Government');
          setBarangays('');
          setName('');
      }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    onAdd(name, type, barangays, selectedMunicipality, ownership);
  };

  return (
    <>
      <form onSubmit={handlePreSubmit} className="space-y-5">
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
            {type === 'RHU' ? (
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Municipality</label>
                   <select 
                      value={selectedMunicipality} 
                      onChange={handleMunicipalityChange}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-semibold text-zinc-900 shadow-sm cursor-pointer"
                   >
                      <option value="">-- Select Municipality --</option>
                      {MUNICIPALITIES.filter(m => m !== 'Non-Abra').map(m => (
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
        </div>

        <div className="pt-2">
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-zinc-900 text-white p-3.5 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
              Register Facility
            </button>
        </div>
      </form>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-blue-50 p-4 rounded-full mb-5 text-blue-600 shadow-inner">
                          <PlusCircle size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">Register Facility?</h3>
                      {/* UPDATED MESSAGE TO MATCH YOUR REQUEST */}
                      <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                          Are you sure you want to register <strong>{name}</strong> as a new <strong>ABTC Facility</strong>?
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                              type="button"
                              onClick={() => setShowConfirmModal(false)} 
                              className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:-translate-y-0.5 transition-all duration-300"
                          >
                              Cancel
                          </button>
                          <button 
                              type="button"
                              onClick={confirmSubmit} 
                              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 shadow-sm transition-all duration-300 flex justify-center items-center gap-2"
                          >
                              Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}