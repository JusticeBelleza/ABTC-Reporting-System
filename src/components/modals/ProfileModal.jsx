import React, { useState, useEffect } from 'react';
import { UserCog, X, Building, MessageSquare, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function ProfileModal({ userId, onClose, isSelf = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // NEW STATE FOR MODAL
  const [profile, setProfile] = useState({ full_name: '', designation: '', contact_number: '', email: '', facility_name: '' });
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 7) score += 1; 
    if (/[A-Z]/.test(pass)) score += 1; 
    if (/[a-z]/.test(pass)) score += 1; 
    if (/[0-9]/.test(pass)) score += 1; 
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; 
    return score;
  };

  const strengthScore = calculateStrength(newPassword);
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  const strengthLabels = ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  // Handle Initial Submit (Validation + Open Modal)
  const handlePreSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords before opening the modal
    if (isSelf && newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
         toast.error("Password must be at least 6 characters");
         return;
      }
    }

    setShowConfirmModal(true);
  };

  // Handle Final Submit after Confirmation
  const confirmSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    
    try {
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        designation: profile.designation,
        contact_number: profile.contact_number
      }).eq('id', userId);

      if (profileError) throw profileError;

      if (isSelf && newPassword) {
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) throw authError;
        
        toast.success("Profile and password updated");
      } else {
        toast.success("Profile updated");
      }
      onClose();

    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 w-full max-w-md animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex justify-between items-center px-8 pt-8 pb-5">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
               <UserCog className="text-blue-600" size={24} />
               {isSelf ? "Profile Settings" : "Edit User"}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-700 transition-colors hover:bg-gray-100 p-2 rounded-xl"
            >
               <X size={20} strokeWidth={2}/>
            </button>
          </div>

          <div className="overflow-y-auto px-8 pb-8 custom-scrollbar">
              <form onSubmit={handlePreSubmit} className="space-y-6">
              
              {/* Read-Only Info */}
              <div className="flex flex-col gap-3 p-4 bg-gray-50/80 border border-gray-100 rounded-xl mb-2">
                  <div className="flex items-center gap-3 text-zinc-800 text-sm font-semibold">
                    <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm border border-gray-100"><Building size={16} strokeWidth={2}/></div>
                    {profile.facility_name || 'Unassigned Facility'}
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                    <div className="bg-white p-2 rounded-lg text-gray-400 shadow-sm border border-gray-100"><MessageSquare size={16} strokeWidth={2}/></div>
                    {profile.email}
                  </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                  <div>
                      <label htmlFor="fullNameInput" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                      <input 
                          id="fullNameInput"
                          type="text" 
                          className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                          value={profile.full_name || ''} 
                          onChange={e => setProfile({...profile, full_name: e.target.value})} 
                          placeholder="e.g. Juan Dela Cruz" 
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="designationInput" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Designation</label>
                        <input 
                            id="designationInput"
                            type="text" 
                            className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                            value={profile.designation || ''} 
                            onChange={e => setProfile({...profile, designation: e.target.value})} 
                            placeholder="e.g. Nurse II" 
                        />
                    </div>
                    <div>
                        <label htmlFor="contactInput" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Contact No.</label>
                        <input 
                            id="contactInput"
                            type="text" 
                            className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                            value={profile.contact_number || ''} 
                            onChange={e => setProfile({...profile, contact_number: e.target.value})} 
                            placeholder="0917..." 
                        />
                    </div>
                  </div>
              </div>
              
              {isSelf && (
                  <div className="pt-6 mt-6 border-t border-gray-100">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 ml-1 flex items-center gap-2">Security Settings</h3>
                  <div className="space-y-4">
                      <div>
                          <label htmlFor="newPasswordInput" className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">New Password</label>
                          <div className="relative">
                              <input 
                                  id="newPasswordInput"
                                  type={showPassword ? "text" : "password"} 
                                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pr-10 text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                                  value={newPassword} 
                                  onChange={e => setNewPassword(e.target.value)} 
                                  placeholder="Leave blank to keep current" 
                              />
                              <button 
                                  type="button" 
                                  onClick={() => setShowPassword(!showPassword)} 
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                              >
                                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                          </div>
                      </div>
                      
                      {newPassword && (
                          <div className="animate-in fade-in slide-in-from-top-1">
                              <div className="flex gap-1.5 h-1.5 mb-2">
                              {[1, 2, 3, 4, 5].map((level) => (
                                  <div key={level} className={`h-full flex-1 rounded-full transition-colors duration-300 ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-gray-100'}`} />
                              ))}
                              </div>
                              <p className={`text-[11px] font-bold tracking-wide uppercase text-right ${strengthScore < 3 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {strengthLabels[strengthScore]}
                              </p>
                          </div>
                      )}

                      {newPassword && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                          <label htmlFor="confirmPasswordInput" className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Confirm Password</label>
                          <div className="relative">
                          <input 
                              id="confirmPasswordInput"
                              type={showPassword ? "text" : "password"} 
                              className={`w-full bg-gray-50 border px-4 py-3 rounded-xl text-sm outline-none transition-all pr-10 shadow-sm text-zinc-900 placeholder:text-gray-400 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/30' : 'border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'}`}
                              value={confirmPassword} 
                              onChange={e => setConfirmPassword(e.target.value)} 
                              placeholder="Retype new password" 
                          />
                          </div>
                          {confirmPassword && newPassword !== confirmPassword && (
                              <p className="text-[11px] text-red-500 mt-2 font-medium ml-1">Passwords do not match</p>
                          )}
                      </div>
                      )}
                  </div>
                  </div>
              )}

              <div className="pt-4">
                  <button 
                      type="submit" 
                      disabled={saving} 
                      className="w-full bg-zinc-900 text-white py-3.5 rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-zinc-900 disabled:hover:shadow-none"
                  >
                  {saving ? <Loader2 size={18} className="animate-spin"/> : 'Save Changes'}
                  </button>
              </div>
              </form>
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-blue-50 p-4 rounded-full mb-5 text-blue-600 shadow-inner">
                          <UserCog size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">Save Changes?</h3>
                      <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed">
                          Are you sure you want to save these updates to {isSelf ? "your profile" : "this user's profile"}?
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                              type="button"
                              onClick={() => setShowConfirmModal(false)} 
                              disabled={saving}
                              className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="button"
                              onClick={confirmSave} 
                              disabled={saving}
                              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-blue-600/20 shadow-sm transition-all flex justify-center items-center gap-2"
                          >
                              {saving && <Loader2 size={16} className="animate-spin"/>} Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}