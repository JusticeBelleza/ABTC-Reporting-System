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
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 shadow-xl rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><Settings size={20}/> Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>
        
        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-50">
          {isAdmin && <button onClick={() => setActiveTab('logo')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='logo'?'border-zinc-900 text-zinc-900':'border-transparent text-gray-500 hover:text-zinc-700'}`}>System Logo</button>}
          <button onClick={() => setActiveTab('signatories')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab==='signatories'?'border-zinc-900 text-zinc-900':'border-transparent text-gray-500 hover:text-zinc-700'}`}>Signatories & Logo</button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-auto">
           
           {activeTab === 'logo' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">System Header Logo</label>
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                 {logoForm.logo_base64 ? <img src={logoForm.logo_base64} alt="Logo" className="h-16 w-16 object-contain" /> : <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-300"><ImageIcon size={24}/></div>}
                 <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer" />
              </div>
            </div>
          )}

          {activeTab === 'signatories' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Facility Logo</label>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                  {userProfile?.facility_logo ? <img src={userProfile.facility_logo} alt="Facility Logo" className="h-16 w-16 object-contain" /> : <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-300"><ImageIcon size={24}/></div>}
                  <input type="file" accept="image/*" onChange={handleFacilityLogoChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm text-gray-900">Signatories</h3>
                    <button type="button" onClick={addSignatory} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1"><Plus size={12}/> Add</button>
                </div>
                
                <div className="space-y-4">
                  {signatories.map((sig, idx) => (
                    <div key={idx} className="flex gap-4 items-start p-4 border border-gray-200 rounded-xl bg-gray-50/30 group">
                      <div className="flex-1 space-y-4">
                        {/* Label Input with Box and Padding */}
                        <input 
                            type="text" 
                            placeholder="Label (e.g. Prepared By)" 
                            value={sig.label || ''} 
                            onChange={e=>updateSignatory(idx, 'label', e.target.value)} 
                            className="w-full text-xs font-bold text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-lg focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none placeholder:text-gray-400"
                        />
                        {/* Name and Title Inputs with Borders */}
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                              type="text" 
                              placeholder="Name" 
                              value={sig.name} 
                              onChange={e=>updateSignatory(idx, 'name', e.target.value)} 
                              className="w-full text-sm border border-gray-200 px-3 py-2 rounded-lg focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none placeholder:text-gray-400 bg-white"
                          />
                          <input 
                              type="text" 
                              placeholder="Title" 
                              value={sig.title} 
                              onChange={e=>updateSignatory(idx, 'title', e.target.value)} 
                              className="w-full text-sm border border-gray-200 px-3 py-2 rounded-lg focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none placeholder:text-gray-400 bg-white"
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeSignatory(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1 mt-6"><X size={18}/></button>
                    </div>
                  ))}
                  {signatories.length === 0 && <p className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">No signatories added.</p>}
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-50 flex justify-end">
              <button type="submit" disabled={loading} className="bg-zinc-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition shadow-sm flex items-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin"/>} Save Changes
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}