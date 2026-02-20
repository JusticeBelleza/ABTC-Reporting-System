import React, { useState } from 'react';
import { Settings, X, ImageIcon, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function SettingsModal({ onClose, globalSettings, onSaveGlobal, userProfile, onSaveProfile, isAdmin }) {
  const [logoForm, setLogoForm] = useState(globalSettings || { logo_base64: '' });
  const [signatories, setSignatories] = useState(userProfile?.signatories || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'logo' : 'signatories');

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

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isAdmin && activeTab === 'logo') {
        const { data: existing } = await supabase.from('settings').select('id').single();
        if(existing) await supabase.from('settings').update({ logo_base64: logoForm.logo_base64 }).eq('id', existing.id);
        else await supabase.from('settings').insert({ logo_base64: logoForm.logo_base64 });
        onSaveGlobal(logoForm);
        toast.success("Saved");
      }
      if (activeTab === 'signatories') {
        const { error } = await supabase.from('profiles').update({ signatories: signatories, facility_logo: userProfile.facility_logo }).eq('id', userProfile.id);
        if(error) throw error;
        onSaveProfile({ ...userProfile, signatories });
        toast.success("Saved");
      }
      onClose();
    } catch(err) { toast.error(err.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3 tracking-tight">
            <Settings className="text-zinc-700" size={24}/> System Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-colors">
            <X size={20} strokeWidth={2}/>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex px-6 pt-2 border-b border-gray-100 gap-6">
          {isAdmin && (
            <button 
                onClick={() => setActiveTab('logo')} 
                className={`pb-3 text-sm font-bold transition-all duration-200 border-b-2 ${activeTab==='logo' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Global Logo
            </button>
          )}
          <button 
              onClick={() => setActiveTab('signatories')} 
              className={`pb-3 text-sm font-bold transition-all duration-200 border-b-2 ${activeTab==='signatories' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Facility Logo & Signatories
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
           
           {activeTab === 'logo' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <label className="block text-sm font-semibold text-gray-700">Provincial / Global Header Logo</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 border border-gray-200 rounded-2xl bg-gray-50/50 shadow-sm">
                 <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                     {logoForm.logo_base64 ? <img src={logoForm.logo_base64} alt="Logo" className="h-20 w-20 object-contain rounded-lg" /> : <div className="h-20 w-20 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300"><ImageIcon size={32}/></div>}
                 </div>
                 <div className="flex-1 space-y-2">
                     <p className="text-sm text-gray-500">Upload a logo to display on all consolidated reports.</p>
                     <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer" />
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'signatories' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Facility Logo</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 border border-gray-200 rounded-2xl bg-gray-50/50 shadow-sm">
                  <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                      {userProfile?.facility_logo ? <img src={userProfile.facility_logo} alt="Facility Logo" className="h-20 w-20 object-contain rounded-lg" /> : <div className="h-20 w-20 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300"><ImageIcon size={32}/></div>}
                  </div>
                  <div className="flex-1 space-y-2">
                     <p className="text-sm text-gray-500">Upload your specific facility logo for your reports.</p>
                     <input type="file" accept="image/*" onChange={handleFacilityLogoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-900 tracking-tight">Report Signatories</h3>
                    <button type="button" onClick={addSignatory} className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm flex items-center gap-1"><Plus size={14}/> Add Signatory</button>
                </div>
                
                <div className="space-y-4 pt-2">
                  {signatories.map((sig, idx) => (
                    <div key={idx} className="flex gap-4 items-start p-5 border border-gray-200 rounded-2xl bg-white shadow-sm hover:border-gray-300 transition-colors group relative">
                      <div className="flex-1 space-y-4">
                        <input 
                            type="text" 
                            placeholder="Label (e.g. Prepared By)" 
                            value={sig.label || ''} 
                            onChange={e=>updateSignatory(idx, 'label', e.target.value)} 
                            className="w-full text-xs font-bold uppercase tracking-wider text-gray-900 bg-gray-50 border border-transparent px-4 py-2.5 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-gray-400 transition-all"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input 
                              type="text" 
                              placeholder="Full Name" 
                              value={sig.name} 
                              onChange={e=>updateSignatory(idx, 'name', e.target.value)} 
                              className="w-full text-sm border border-gray-200 px-4 py-2.5 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-gray-400 bg-white shadow-sm transition-all"
                          />
                          <input 
                              type="text" 
                              placeholder="Title / Position" 
                              value={sig.title} 
                              onChange={e=>updateSignatory(idx, 'title', e.target.value)} 
                              className="w-full text-sm border border-gray-200 px-4 py-2.5 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-gray-400 bg-white shadow-sm transition-all"
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeSignatory(idx)} className="text-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors p-2 rounded-xl mt-6"><X size={18} strokeWidth={2}/></button>
                    </div>
                  ))}
                  {signatories.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                          <p className="text-sm font-medium text-gray-500">No signatories added yet.</p>
                          <p className="text-xs text-gray-400 mt-1">Add signatories to have them appear at the bottom of exported PDFs.</p>
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button type="submit" disabled={loading} className="bg-zinc-900 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 transition-all flex items-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin"/>} Save Settings
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}