import React, { useState, useEffect } from 'react';
import { UserCog, X, Building, MessageSquare, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// --- CUSTOM FLOATING LABEL INPUT COMPONENT ---
const FloatingInput = ({ id, label, type = "text", value, onChange, disabled = false, rightElement, hasError }) => (
    <div className={`relative w-full shadow-sm rounded-xl border transition-all duration-300 overflow-hidden group ${
        disabled 
            ? 'bg-gray-50 border-gray-200' 
            : hasError 
                ? 'bg-red-50/30 border-red-300 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400'
                : 'bg-white border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 focus-within:shadow-md'
    }`}>
        <input
            type={type}
            id={id}
            disabled={disabled}
            className={`block w-full px-4 pt-6 pb-2 text-sm font-medium appearance-none focus:outline-none bg-transparent border-none ring-0 peer ${
                disabled ? 'text-gray-500 cursor-not-allowed' : 'text-zinc-900'
            } ${rightElement ? 'pr-10' : ''}`}
            placeholder=" " // Required for peer-placeholder-shown CSS logic
            value={value || ''}
            onChange={onChange}
        />
        <label
            htmlFor={id}
            className={`absolute text-[11px] duration-300 transform -translate-y-1.5 top-3 z-10 origin-[0] left-4 
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1.5 peer-placeholder-shown:text-sm
                peer-focus:scale-95 peer-focus:-translate-y-1.5 pointer-events-none font-bold tracking-wide transition-all ${
                disabled ? 'text-gray-400' : hasError ? 'text-red-500' : 'text-gray-500 group-focus-within:text-blue-600'
            }`}
        >
            {label}
        </label>
        {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
                {rightElement}
            </div>
        )}
    </div>
);

export default function ProfileModal({ userId, onClose, isSelf = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const handlePreSubmit = (e) => {
    e.preventDefault();
    
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

              {/* Form Inputs utilizing the new FloatingInput */}
              <div className="space-y-4">
                  <FloatingInput 
                      id="fullNameInput" 
                      label="Full Name" 
                      value={profile.full_name || ''} 
                      onChange={e => setProfile({...profile, full_name: e.target.value})} 
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                      <FloatingInput 
                          id="designationInput" 
                          label="Designation" 
                          value={profile.designation || ''} 
                          onChange={e => setProfile({...profile, designation: e.target.value})} 
                      />
                      <FloatingInput 
                          id="contactInput" 
                          label="Contact No." 
                          type="tel"
                          value={profile.contact_number || ''} 
                          onChange={e => setProfile({...profile, contact_number: e.target.value})} 
                      />
                  </div>
              </div>
              
              {isSelf && (
                  <div className="pt-6 mt-6 border-t border-gray-100">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4 ml-1 flex items-center gap-2">Security Settings</h3>
                  <div className="space-y-4">
                      <FloatingInput 
                          id="newPasswordInput" 
                          label="New Password (Optional)" 
                          type={showPassword ? "text" : "password"}
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)} 
                          rightElement={
                              <button 
                                  type="button" 
                                  onClick={() => setShowPassword(!showPassword)} 
                                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                              >
                                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                          }
                      />
                      
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
                              <FloatingInput 
                                  id="confirmPasswordInput" 
                                  label="Confirm Password" 
                                  type={showPassword ? "text" : "password"}
                                  value={confirmPassword} 
                                  onChange={e => setConfirmPassword(e.target.value)} 
                                  hasError={confirmPassword && newPassword !== confirmPassword}
                              />
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