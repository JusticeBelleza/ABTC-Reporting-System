import React, { useState, useRef, useEffect } from 'react';
import { Loader2, PlusCircle, Building2, MapPin, Building, Activity, X } from 'lucide-react';
import { toast } from 'sonner';
import ModalPortal from '../modals/ModalPortal';
import CustomDropdown from '../common/CustomDropdown';
import { supabase } from '../../lib/supabase';

// --- FLOATING TEXT INPUT ---
const FloatingInput = ({ id, label, icon: Icon, type = "text", value, onChange, disabled = false, required, placeholder = " " }) => (
    <div className={`relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 focus-within:shadow-md`}>
        {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon size={14} className="text-slate-400 group-focus-within:text-slate-900 transition-colors duration-300 group-focus-within:scale-110" />
            </div>
        )}
        <input
            type={type}
            id={id}
            required={required}
            disabled={disabled}
            className={`block w-full ${Icon ? 'pl-8' : 'pl-3'} pr-3 pt-4 pb-1.5 text-xs font-medium appearance-none focus:outline-none bg-transparent border-none ring-0 peer text-slate-900`}
            placeholder={placeholder} 
            value={value || ''}
            onChange={onChange}
        />
        <label
            htmlFor={id}
            className={`absolute text-[9px] duration-300 transform -translate-y-1 top-2 z-10 origin-[0] ${Icon ? 'left-8' : 'left-3'} 
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-placeholder-shown:text-xs
                peer-focus:scale-100 peer-focus:-translate-y-1 pointer-events-none font-bold tracking-wide transition-all text-slate-500 group-focus-within:text-slate-900`}
        >
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    </div>
);

// --- AUTO-ADJUSTING FLOATING TEXTAREA ---
const FloatingTextarea = ({ id, label, icon: Icon, value, disabled = false }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; 
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; 
        }
    }, [value]);

    return (
        <div className="relative w-full shadow-sm rounded-lg border transition-all duration-300 group bg-slate-50/80 border-slate-200">
            {Icon && (
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                    <Icon size={14} className="text-slate-400" />
                </div>
            )}
            <textarea
                ref={textareaRef}
                id={id}
                readOnly
                disabled={disabled}
                rows={1}
                className={`block w-full ${Icon ? 'pl-8' : 'pl-3'} pr-3 pt-5 pb-2 text-xs font-medium appearance-none focus:outline-none bg-transparent border-none ring-0 resize-none overflow-hidden ${
                    disabled ? 'text-slate-400' : 'text-slate-700'
                }`}
                placeholder=" " 
                value={value || ''}
            />
            <label className={`absolute text-[9px] transform -translate-y-1 top-2 z-10 origin-[0] ${Icon ? 'left-8' : 'left-3'} pointer-events-none font-bold tracking-wide text-slate-400`}>
                {label}
            </label>
        </div>
    );
};

export default function AddFacilityForm({ onAdd, loading, facilities = [], onClose }) {
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [ownership, setOwnership] = useState('');
  const [barangays, setBarangays] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  
  const [dbMunicipalities, setDbMunicipalities] = useState([]);
  const [dbCatchments, setDbCatchments] = useState({});
  const [isFetchingLocations, setIsFetchingLocations] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('populations')
          .select('municipality, barangay_name')
          .not('municipality', 'is', null);

        if (error) throw error;

        const munis = new Set();
        const catchments = {};

        data.forEach(item => {
          if (item.municipality) {
            munis.add(item.municipality);
            if (item.barangay_name && item.barangay_name !== 'All') {
              if (!catchments[item.municipality]) catchments[item.municipality] = [];
              catchments[item.municipality].push(item.barangay_name);
            }
          }
        });

        // Ensure Non-Abra is always at the very bottom of the list
        const sortedMunis = Array.from(munis).filter(m => m !== 'Non-Abra').sort();
        sortedMunis.push('Non-Abra');
        
        Object.keys(catchments).forEach(m => catchments[m].sort());

        setDbMunicipalities(sortedMunis);
        setDbCatchments(catchments);
      } catch (err) {
        console.error('Error fetching locations:', err);
        toast.error('Failed to load municipalities from database.');
      } finally {
        setIsFetchingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const normalizedFacilities = facilities.map(f => typeof f === 'string' ? f.trim().toLowerCase() : '');
  
  const availableMunicipalities = dbMunicipalities.filter(m => {
      if (type !== 'RHU') return true; 
      const expectedRhuName = `${m} RHU`.toLowerCase();
      return !normalizedFacilities.includes(expectedRhuName);
  });

  const handleMunicipalityChange = (valOrEvent) => {
    const muni = typeof valOrEvent === 'string' ? valOrEvent : valOrEvent?.target?.value;
    setSelectedMunicipality(muni);
    
    if (type === 'RHU') {
        if (muni) {
            setName(`${muni} RHU`);
            const catchments = dbCatchments[muni] || [];
            setBarangays(catchments.join(', '));
        } else {
            setBarangays('');
            setName('');
        }
    }
  };

  const handleTypeChange = (valOrEvent) => {
      const newType = typeof valOrEvent === 'string' ? valOrEvent : valOrEvent?.target?.value;
      setType(newType);

      if (newType === 'Hospital' || newType === 'Clinic') {
          setSelectedMunicipality(''); 
          setName(''); 
          // FIX: Explicitly include Non-Abra in the catchment area text
          setBarangays('Province-wide Catchment Area, Non-Abra'); 
          if (newType === 'Clinic') setOwnership('Private');
          else setOwnership('Government'); 
      } else if (newType === 'RHU') {
          setOwnership('Government');
          if (selectedMunicipality) {
              setName(`${selectedMunicipality} RHU`);
              const catchments = dbCatchments[selectedMunicipality] || [];
              setBarangays(catchments.join(', '));
          } else {
              setName('');
              setBarangays('');
          }
      }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!type) { toast.error("Please select a Facility Type."); return; }
    if (type === 'RHU' && !selectedMunicipality) { toast.error("Please select the Municipality."); return; }
    if (!name.trim()) { toast.error("Please provide a Facility Name."); return; }
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    onAdd(name, type, barangays, type === 'RHU' ? selectedMunicipality : null, ownership);
  };

  // FIX: Wrap the main return in ModalPortal and increase z-index to z-[100]
  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          
        <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-slate-900 px-6 sm:px-8 py-5 border-b border-slate-800 flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
              <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2.5 bg-slate-800/80 rounded-xl text-yellow-400 shadow-inner border border-slate-700">
                      <Building2 size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">Register New Facility</h2>
                      <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">Add an RHU, Hospital, or Clinic to the system</p>
                  </div>
              </div>
              
              <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-all active:scale-90 border border-slate-700 shadow-sm relative z-10"
              >
                <X size={18} strokeWidth={2.5}/>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[75vh] custom-scrollbar">
                <form onSubmit={handlePreSubmit} className="p-6 sm:p-8 space-y-5">
                  
                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <Activity size={13} className="text-slate-400" />
                          Facility Type <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                          value={type}
                          onChange={handleTypeChange}
                          disabled={isFetchingLocations}
                          placeholder={isFetchingLocations ? "Loading Data..." : "Select Facility Type..."}
                          options={[
                              { value: 'RHU', label: 'RHU (Rural Health Unit)' },
                              { value: 'Hospital', label: 'Hospital' },
                              { value: 'Clinic', label: 'Clinic' }
                          ]}
                          className="w-full"
                          buttonClassName="!py-2.5 !px-3 font-semibold !bg-white border-slate-200"
                      />
                  </div>

                  <div className={`grid gap-4 ${type === 'RHU' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {type === 'RHU' && (
                          <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                  <MapPin size={13} className="text-slate-400" />
                                  Municipality <span className="text-red-500">*</span>
                              </label>
                              <CustomDropdown
                                  value={selectedMunicipality}
                                  onChange={handleMunicipalityChange}
                                  placeholder="Select Municipality..."
                                  options={availableMunicipalities.map(m => ({ value: m, label: m }))}
                                  className="w-full"
                                  buttonClassName="!py-2.5 !px-3 font-semibold !bg-white border-slate-200"
                              />
                          </div>
                      )}

                      <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <Building size={13} className="text-slate-400" />
                              Ownership
                          </label>
                          <CustomDropdown
                              value={ownership}
                              onChange={val => setOwnership(val)}
                              options={[
                                  { value: 'Government', label: 'Government' },
                                  { value: 'Private', label: 'Private' }
                              ]}
                              className="w-full"
                              buttonClassName="!py-2.5 !px-3 font-semibold !bg-white border-slate-200"
                          />
                      </div>
                  </div>

                  <FloatingInput 
                      id="facilityName" 
                      label="Facility Name" 
                      icon={Building2} 
                      required 
                      value={name} 
                      disabled={type === 'RHU'} 
                      onChange={e => setName(e.target.value)} 
                      placeholder=" "  
                  />
                  
                  <div>
                      <FloatingTextarea 
                          id="catchmentArea" 
                          label={type === 'RHU' ? "Catchment Area (Auto-filled by Municipality)" : "Catchment Area"} 
                          icon={MapPin} 
                          value={barangays} 
                          disabled={true} 
                      />
                  </div>

                  <div className="pt-2">
                      <button 
                          type="submit" 
                          disabled={loading || isFetchingLocations} 
                          className="w-full bg-slate-900 text-yellow-400 py-3 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {loading || isFetchingLocations ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                        {loading ? 'Registering...' : 'Register Facility'}
                      </button>
                  </div>
                </form>
            </div>
        </div>

        {/* --- CONFIRMATION MODAL --- */}
        {showConfirmModal && (
          <ModalPortal>
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-slate-100 p-4 rounded-full mb-5 text-slate-800 shadow-inner">
                            <PlusCircle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Register Facility?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                            Are you sure you want to register <strong className="text-slate-900">{name}</strong> as a new <strong>ABTC Facility</strong>{type === 'RHU' ? ` located in ${selectedMunicipality}` : ''}?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button 
                                type="button"
                                onClick={() => setShowConfirmModal(false)} 
                                className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={confirmSubmit} 
                                className="flex-1 py-2.5 px-4 bg-slate-900 text-yellow-400 rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </ModalPortal>
  );
}