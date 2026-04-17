import React, { useState } from 'react';
import { Settings, X, ImageIcon, Plus, Loader2, User, Briefcase, Bookmark, CheckCircle, BrainCircuit, Activity, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import ModalPortal from './ModalPortal';

// --- ULTRA-COMPACT 12PX FLOATING LABEL INPUT ---
const FloatingInput = ({ id, label, icon: Icon, type = "text", value, onChange, disabled = false, required, min, max }) => (
    <div className={`relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group ${
        disabled 
            ? 'bg-slate-50 border-slate-200' 
            : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 focus-within:shadow-md'
    }`}>
        {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon size={14} className={`transition-colors duration-300 ${disabled ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-slate-900 group-focus-within:scale-110'}`} />
            </div>
        )}
        <input
            type={type}
            id={id}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            className={`block w-full ${Icon ? 'pl-8' : 'pl-3'} pr-3 pt-4 pb-1.5 text-xs font-medium appearance-none focus:outline-none bg-transparent border-none ring-0 peer ${
                disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'
            }`}
            placeholder=" " 
            value={value || ''}
            onChange={onChange}
        />
        <label
            htmlFor={id}
            className={`absolute text-[9px] duration-300 transform -translate-y-1 top-2 z-10 origin-[0] ${Icon ? 'left-8' : 'left-3'} 
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-placeholder-shown:text-xs
                peer-focus:scale-100 peer-focus:-translate-y-1 pointer-events-none font-bold tracking-wide transition-all ${
                disabled ? 'text-slate-400' : 'text-slate-500 group-focus-within:text-slate-900'
            }`}
        >
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    </div>
);

export default function SettingsModal({ onClose, globalSettings, onSaveGlobal, userProfile, onSaveProfile, isAdmin }) {
  const [logoForm, setLogoForm] = useState({
      logo_base64: globalSettings?.logo_base64 || '',
      outbreak_threshold_percent: globalSettings?.outbreak_threshold_percent ?? 50,
      trend_alert_percent: globalSettings?.trend_alert_percent ?? 10,
      high_risk_threshold_percent: globalSettings?.high_risk_threshold_percent ?? 25 // NEW: High Risk Default
  });
  const [signatories, setSignatories] = useState(userProfile?.signatories || []);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState(isAdmin ? 'analytics' : 'signatories');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onloadend = () => setLogoForm({ ...logoForm, logo_base64: r.result }); r.readAsDataURL(file); }
  };

  const handleFacilityLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onloadend = () => { onSaveProfile({ ...userProfile, facility_logo: r.result }); }; r.readAsDataURL(file); }
  };

  const addSignatory = () => setSignatories([...signatories, { label: '', name: '', title: '' }]);
  const removeSignatory = (index) => setSignatories(signatories.filter((_, i) => i !== index));
  const updateSignatory = (index, field, value) => { const n = [...signatories]; n[index][field] = value; setSignatories(n); };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      if (isAdmin && (activeTab === 'logo' || activeTab === 'analytics')) {
        const { data: existing } = await supabase.from('settings').select('id').single();
        
        const payload = { 
            logo_base64: logoForm.logo_base64,
            outbreak_threshold_percent: Number(logoForm.outbreak_threshold_percent || 50),
            trend_alert_percent: Number(logoForm.trend_alert_percent || 10),
            high_risk_threshold_percent: Number(logoForm.high_risk_threshold_percent || 25) // NEW: Save to DB
        };

        if(existing) await supabase.from('settings').update(payload).eq('id', existing.id);
        else await supabase.from('settings').insert(payload);
        
        onSaveGlobal({ ...globalSettings, ...payload });
        toast.success("System settings saved successfully.");
      }
      
      if (activeTab === 'signatories') {
        const { error } = await supabase.from('profiles').update({ signatories: signatories, facility_logo: userProfile.facility_logo }).eq('id', userProfile.id);
        if(error) throw error;
        onSaveProfile({ ...userProfile, signatories });
        toast.success("Signatories saved successfully.");
      }
      onClose();
    } catch(err) { toast.error(err.message); }
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          
          <div className="bg-slate-900 px-6 sm:px-8 py-5 border-b border-slate-800 flex justify-between items-center relative overflow-hidden shrink-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-slate-800/80 rounded-xl text-yellow-400 shadow-inner border border-slate-700">
                    <Settings size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">System Settings</h2>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">Manage analytics, logos and PDF signatories</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-all active:scale-90 border border-slate-700 shadow-sm relative z-10">
              <X size={18} strokeWidth={2.5}/>
            </button>
          </div>
          
          {/* TABS HEADER */}
          <div className="flex px-6 sm:px-8 pt-4 border-b border-slate-100 gap-8 bg-slate-50 shrink-0 overflow-x-auto no-scrollbar">
            {isAdmin && (
              <>
                <button 
                    onClick={() => setActiveTab('analytics')} 
                    className={`pb-3.5 text-xs font-bold transition-all duration-200 border-b-[3px] whitespace-nowrap active:opacity-70 ${activeTab==='analytics' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Predictive Analytics
                </button>
                <button 
                    onClick={() => setActiveTab('logo')} 
                    className={`pb-3.5 text-xs font-bold transition-all duration-200 border-b-[3px] whitespace-nowrap active:opacity-70 ${activeTab==='logo' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Global Logo
                </button>
              </>
            )}
            <button 
                onClick={() => setActiveTab('signatories')} 
                className={`pb-3.5 text-xs font-bold transition-all duration-200 border-b-[3px] whitespace-nowrap active:opacity-70 ${activeTab==='signatories' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
            >
                Facility Logo & Signatories
            </button>
          </div>

          <form onSubmit={handlePreSubmit} className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar bg-white">
             
            {/* ANALYTICS SETTINGS TAB (Admin Only) */}
            {activeTab === 'analytics' && isAdmin && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl">
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5"><BrainCircuit size={12}/> Smart Alert Thresholds</h4>
                    <p className="text-xs text-slate-500 font-medium mb-4">Adjust the sensitivity of the AI predictive alerts displayed on the dashboard. Changing these values immediately affects how warnings are triggered.</p>
                    
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <label className="text-xs font-bold text-slate-800">Outbreak Anomaly Sensitivity (%)</label>
                            <p className="text-[10px] text-slate-500 mb-2">Triggers a HIGH RISK alert when current cases exceed the 6-month average by this percentage. (Default: 50%)</p>
                            <FloatingInput 
                                id="outbreak_threshold" 
                                type="number" 
                                min="1"
                                max="500"
                                label="Outbreak Threshold (%)" 
                                icon={Activity} 
                                value={logoForm.outbreak_threshold_percent} 
                                onChange={(e) => setLogoForm({...logoForm, outbreak_threshold_percent: e.target.value})} 
                            />
                        </div>

                        {/* --- NEW HIGH RISK THRESHOLD --- */}
                        <div className="flex flex-col gap-1 p-4 rounded-xl border border-red-100 bg-red-50/30">
                            <label className="text-xs font-bold text-red-900">High-Risk Sensitivity (%)</label>
                            <p className="text-[10px] text-red-700/80 mb-2">Triggers a CRITICAL alert when severe exposures (Category 3 + Stray Animals) exceed the 6-month average by this percentage. (Default: 25%)</p>
                            <FloatingInput 
                                id="high_risk_threshold" 
                                type="number" 
                                min="1"
                                max="500"
                                label="High-Risk Threshold (%)" 
                                icon={AlertTriangle} 
                                value={logoForm.high_risk_threshold_percent} 
                                onChange={(e) => setLogoForm({...logoForm, high_risk_threshold_percent: e.target.value})} 
                            />
                        </div>

                        <div className="flex flex-col gap-1 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <label className="text-xs font-bold text-slate-800">Rising Trend Sensitivity (%)</label>
                            <p className="text-[10px] text-slate-500 mb-2">Triggers a WARNING alert when the fast-signal projected cases (WMA) exceed the 3-month average (SMA) by this percentage. (Default: 10%)</p>
                            <FloatingInput 
                                id="trend_threshold" 
                                type="number" 
                                min="1"
                                max="100"
                                label="Rising Trend Threshold (%)" 
                                icon={Activity} 
                                value={logoForm.trend_alert_percent} 
                                onChange={(e) => setLogoForm({...logoForm, trend_alert_percent: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* GLOBAL LOGO TAB (Admin Only) */}
            {activeTab === 'logo' && isAdmin && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Provincial / Global Header Logo</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-sm">
                   <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                       {logoForm.logo_base64 ? <img src={logoForm.logo_base64} alt="Logo" className="h-16 w-16 object-contain rounded-md" /> : <div className="h-16 w-16 bg-slate-50 rounded-md flex items-center justify-center text-slate-300"><ImageIcon size={28}/></div>}
                   </div>
                   <div className="flex-1 space-y-2">
                       <p className="text-xs text-slate-500 font-medium">Upload a logo to display on all consolidated administrative reports.</p>
                       <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-900 file:text-yellow-400 hover:file:bg-slate-800 active:file:scale-95 file:transition-all cursor-pointer" />
                   </div>
                </div>
              </div>
            )}

            {/* SIGNATORIES TAB (All Users) */}
            {activeTab === 'signatories' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-4 max-w-xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Facility Header Logo</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-sm">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                        {userProfile?.facility_logo ? <img src={userProfile.facility_logo} alt="Facility Logo" className="h-16 w-16 object-contain rounded-md" /> : <div className="h-16 w-16 bg-slate-50 rounded-md flex items-center justify-center text-slate-300"><ImageIcon size={28}/></div>}
                    </div>
                    <div className="flex-1 space-y-2">
                       <p className="text-xs text-slate-500 font-medium">Upload your specific facility logo to appear on your PDF exports.</p>
                       <input type="file" accept="image/*" onChange={handleFacilityLogoChange} className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-900 file:text-yellow-400 hover:file:bg-slate-800 active:file:scale-95 file:transition-all cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Signatories</h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">These names will appear at the bottom of your exported PDF reports.</p>
                      </div>
                      <button 
                          type="button" 
                          onClick={addSignatory} 
                          className="text-xs bg-slate-900 text-yellow-400 px-3 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-300 flex items-center gap-1.5 shrink-0"
                      >
                          <Plus size={14} strokeWidth={2.5}/> <span className="hidden sm:inline">Add Signatory</span><span className="sm:hidden">Add</span>
                      </button>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    {signatories.map((sig, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start p-4 border border-slate-200 rounded-xl bg-slate-50/30 shadow-sm relative group">
                        
                        <div className="flex-1 w-full space-y-3">
                          <FloatingInput 
                              id={`label-${idx}`} 
                              label="Signatory Label (e.g. Prepared By, Approved By)" 
                              icon={Bookmark} 
                              value={sig.label} 
                              onChange={e=>updateSignatory(idx, 'label', e.target.value)} 
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FloatingInput 
                                id={`name-${idx}`} 
                                label="Full Name" 
                                icon={User} 
                                value={sig.name} 
                                onChange={e=>updateSignatory(idx, 'name', e.target.value)} 
                            />
                            <FloatingInput 
                                id={`title-${idx}`} 
                                label="Title / Position" 
                                icon={Briefcase} 
                                value={sig.title} 
                                onChange={e=>updateSignatory(idx, 'title', e.target.value)} 
                            />
                          </div>
                        </div>

                        <button 
                            type="button" 
                            onClick={() => removeSignatory(idx)} 
                            className="text-slate-400 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-sm transition-all duration-300 p-2 rounded-lg sm:mt-1 self-end sm:self-auto w-full sm:w-auto flex justify-center items-center gap-2"
                            title="Remove Signatory"
                        >
                            <X size={16} strokeWidth={2.5}/> <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider">Remove</span>
                        </button>
                      </div>
                    ))}
                    
                    {signatories.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                            <p className="text-xs font-bold text-slate-600 mb-1">No signatories added yet.</p>
                            <p className="text-[11px] text-slate-400 font-medium">Click "Add Signatory" to create signature lines for your PDF exports.</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end mt-2">
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:w-auto bg-slate-900 text-yellow-400 px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} 
                    {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-5 text-slate-800 shadow-inner">
                          <Settings size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Save Settings?</h3>
                      <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                          Are you sure you want to save these changes to your system settings?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <button 
                              type="button"
                              onClick={() => setShowConfirmModal(false)} 
                              disabled={loading}
                              className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1"
                          >
                              Cancel
                          </button>
                          <button 
                              type="button"
                              onClick={confirmSave} 
                              disabled={loading}
                              className="flex-1 py-2.5 px-4 bg-slate-900 text-yellow-400 rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2"
                          >
                              {loading && <Loader2 size={16} className="animate-spin"/>} Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}