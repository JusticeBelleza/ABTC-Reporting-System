import React, { useState, useEffect } from 'react';
import { UserCog, X, Building2, Mail, Eye, EyeOff, Loader2, User, Briefcase, Phone, KeyRound, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// --- ULTRA-COMPACT 12PX FLOATING LABEL INPUT ---
const FloatingInput = ({ id, label, icon: Icon, type = "text", value, onChange, disabled = false, rightElement, hasError, required }) => (
    <div className={`relative w-full shadow-sm rounded-lg border transition-all duration-300 overflow-hidden group ${
        disabled 
            ? 'bg-slate-50 border-slate-200' 
            : hasError 
                ? 'bg-red-50/30 border-red-300 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400'
                : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 focus-within:shadow-md'
    }`}>
        {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon size={14} className={`transition-colors duration-300 ${disabled ? 'text-slate-400' : hasError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-slate-900 group-focus-within:scale-110'}`} />
            </div>
        )}
        <input
            type={type}
            id={id}
            required={required}
            disabled={disabled}
            className={`block w-full ${Icon ? 'pl-8' : 'pl-3'} pr-3 pt-4 pb-1.5 text-xs font-medium appearance-none focus:outline-none bg-transparent border-none ring-0 peer ${
                disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-900'
            } ${rightElement ? 'pr-10' : ''}`}
            placeholder=" " 
            value={value || ''}
            onChange={onChange}
        />
        <label
            htmlFor={id}
            className={`absolute text-[9px] duration-300 transform -translate-y-1 top-2 z-10 origin-[0] ${Icon ? 'left-8' : 'left-3'} 
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0.5 peer-placeholder-shown:text-xs
                peer-focus:scale-100 peer-focus:-translate-y-1 pointer-events-none font-bold tracking-wide transition-all ${
                disabled ? 'text-slate-400' : hasError ? 'text-red-500' : 'text-slate-500 group-focus-within:text-slate-900'
            }`}
        >
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
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
  const strengthColors = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500', 'bg-emerald-600'];
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
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white shadow-2xl rounded-2xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Header - Deep Slate Design */}
          <div className="bg-slate-900 px-6 sm:px-8 py-5 border-b border-slate-800 flex justify-between items-center relative overflow-hidden shrink-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-slate-800/80 rounded-xl text-yellow-400 shadow-inner border border-slate-700">
                    <UserCog size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                        {isSelf ? "Profile Settings" : "Edit User"}
                    </h2>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">Update personal details and security</p>
                </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-all active:scale-90 border border-slate-700 shadow-sm relative z-10"
            >
               <X size={18} strokeWidth={2.5}/>
            </button>
          </div>

          <div className="overflow-y-auto px-6 sm:px-8 py-6 sm:py-8 custom-scrollbar">
              <form onSubmit={handlePreSubmit} className="space-y-6">
              
              {/* Read-Only Info */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50/80 border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 text-slate-800 text-sm font-bold">
                    <div className="bg-white p-2 rounded-lg text-slate-400 shadow-sm border border-slate-200"><Building2 size={16} strokeWidth={2.5}/></div>
                    {profile.facility_name || 'System Admin Access'}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                    <div className="bg-white p-2 rounded-lg text-slate-400 shadow-sm border border-slate-200"><Mail size={16} strokeWidth={2.5}/></div>
                    {profile.email}
                  </div>
              </div>

              {/* Form Inputs utilizing the new FloatingInput */}
              <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Personal Details</h4>
                  
                  <FloatingInput 
                      id="fullNameInput" 
                      label="Full Name" 
                      icon={User}
                      value={profile.full_name || ''} 
                      onChange={e => setProfile({...profile, full_name: e.target.value})} 
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                      <FloatingInput 
                          id="designationInput" 
                          label="Designation" 
                          icon={Briefcase}
                          value={profile.designation || ''} 
                          onChange={e => setProfile({...profile, designation: e.target.value})} 
                      />
                      <FloatingInput 
                          id="contactInput" 
                          label="Contact No." 
                          type="tel"
                          icon={Phone}
                          value={profile.contact_number || ''} 
                          onChange={e => setProfile({...profile, contact_number: e.target.value})} 
                      />
                  </div>
              </div>
              
              {isSelf && (
                  <div className="space-y-4 pt-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Security Settings</h4>
                      
                      <div className="space-y-1.5">
                          <FloatingInput 
                              id="newPasswordInput" 
                              label="New Password (Optional)" 
                              icon={KeyRound}
                              type={showPassword ? "text" : "password"}
                              value={newPassword} 
                              onChange={e => setNewPassword(e.target.value)} 
                              rightElement={
                                  <button 
                                      type="button" 
                                      onClick={() => setShowPassword(!showPassword)} 
                                      className="text-slate-400 hover:text-slate-600 transition-colors p-1 active:scale-90"
                                  >
                                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                  </button>
                              }
                          />
                          
                          {newPassword && (
                              <div className="animate-in fade-in slide-in-from-top-1 px-1">
                                  <div className="flex gap-1 h-1.5 mb-1.5">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                      <div key={level} className={`h-full flex-1 rounded-full transition-colors duration-300 ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-slate-100'}`} />
                                  ))}
                                  </div>
                                  <p className={`text-[9px] font-bold tracking-wide uppercase text-right ${strengthScore < 3 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                    {strengthLabels[strengthScore]}
                                  </p>
                              </div>
                          )}
                      </div>

                      {newPassword && (
                          <div className="animate-in fade-in slide-in-from-top-1">
                              <FloatingInput 
                                  id="confirmPasswordInput" 
                                  label="Confirm Password" 
                                  icon={KeyRound}
                                  type={showPassword ? "text" : "password"}
                                  value={confirmPassword} 
                                  onChange={e => setConfirmPassword(e.target.value)} 
                                  hasError={confirmPassword && newPassword !== confirmPassword}
                              />
                              {confirmPassword && newPassword !== confirmPassword && (
                                  <p className="text-[10px] text-rose-500 mt-1 font-medium ml-2">Passwords do not match</p>
                              )}
                          </div>
                      )}
                  </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                  <button 
                      type="submit" 
                      disabled={saving} 
                      className="w-full bg-slate-900 text-yellow-400 py-3 rounded-lg shadow-md hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] transition-all duration-300 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                  {saving ? 'Saving...' : 'Save Changes'}
                  </button>
              </div>
              </form>
          </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-5 text-slate-800 shadow-inner">
                          <UserCog size={28} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Save Changes?</h3>
                      <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                          Are you sure you want to save these updates to {isSelf ? "your profile" : "this user's profile"}?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <button 
                              type="button"
                              onClick={() => setShowConfirmModal(false)} 
                              disabled={saving}
                              className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 order-2 sm:order-1"
                          >
                              Cancel
                          </button>
                          <button 
                              type="button"
                              onClick={confirmSave} 
                              disabled={saving}
                              className="flex-1 py-2.5 px-4 bg-slate-900 text-yellow-400 rounded-lg text-sm font-bold hover:bg-slate-800 shadow-sm active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 order-1 sm:order-2"
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