import React, { useState, useEffect } from 'react';
import { UserCog, X, Building, MessageSquare, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function ProfileModal({ userId, onClose, isSelf = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  // Unified Password Strength Logic
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 7) score += 1; // Length
    if (/[A-Z]/.test(pass)) score += 1; // Uppercase
    if (/[a-z]/.test(pass)) score += 1; // Lowercase
    if (/[0-9]/.test(pass)) score += 1; // Number
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Special Character
    return score;
  };

  const strengthScore = calculateStrength(newPassword);
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
  const strengthLabels = ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        designation: profile.designation,
        contact_number: profile.contact_number
      }).eq('id', userId);

      if (profileError) throw profileError;

      if (isSelf && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("Passwords do not match");
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
           toast.error("Password must be at least 6 characters");
           setSaving(false);
           return;
        }

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
    <div className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Minimalist Header */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
             {isSelf ? "Profile Settings" : "Edit User"}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-zinc-900 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
          >
             <X size={16} strokeWidth={2}/>
          </button>
        </div>

        <div className="overflow-y-auto px-8 pb-8 custom-scrollbar">
            <form onSubmit={handleSave} className="space-y-6">
            
            {/* Clean Read-Only Info */}
            <div className="flex flex-col gap-3 mb-2">
                <div className="flex items-center gap-3 text-zinc-800 text-sm font-medium">
                <div className="bg-gray-50 p-2 rounded-lg text-gray-500"><Building size={16} strokeWidth={1.5}/></div>
                {profile.facility_name || 'N/A'}
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                <div className="bg-gray-50 p-2 rounded-lg text-gray-400"><MessageSquare size={16} strokeWidth={1.5}/></div>
                {profile.email}
                </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="fullNameInput" className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5 cursor-pointer">Full Name</label>
                    <input 
                        id="fullNameInput"
                        type="text" 
                        className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-sm focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 outline-none transition-all text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                        value={profile.full_name || ''} 
                        onChange={e => setProfile({...profile, full_name: e.target.value})} 
                        placeholder="e.g. Juan Dela Cruz" 
                    />
                </div>
                <div>
                    <label htmlFor="designationInput" className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5 cursor-pointer">Designation</label>
                    <input 
                        id="designationInput"
                        type="text" 
                        className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-sm focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 outline-none transition-all text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                        value={profile.designation || ''} 
                        onChange={e => setProfile({...profile, designation: e.target.value})} 
                        placeholder="e.g. Nurse II" 
                    />
                </div>
                <div>
                    <label htmlFor="contactInput" className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5 cursor-pointer">Contact Number</label>
                    <input 
                        id="contactInput"
                        type="text" 
                        className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-sm focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 outline-none transition-all text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                        value={profile.contact_number || ''} 
                        onChange={e => setProfile({...profile, contact_number: e.target.value})} 
                        placeholder="e.g. 0917..." 
                    />
                </div>
            </div>
            
            {isSelf && (
                <div className="pt-6 mt-6 border-t border-gray-100">
                <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">Security</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="newPasswordInput" className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5 cursor-pointer">New Password</label>
                        <div className="relative">
                            <input 
                                id="newPasswordInput"
                                type={showPassword ? "text" : "password"} 
                                className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-sm focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20 outline-none transition-all pr-10 text-zinc-900 placeholder:text-gray-400 shadow-sm" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                placeholder="Leave blank to keep current" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        </div>
                    </div>
                    
                    {/* Unified Password Strength Meter */}
                    {newPassword && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                            <div className="flex gap-1 h-1 mb-1.5">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div key={level} className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-gray-100'}`} />
                            ))}
                            </div>
                            <p className={`text-[10px] font-medium text-right ${strengthScore < 3 ? 'text-red-500' : 'text-green-600'}`}>
                            {strengthLabels[strengthScore]}
                            </p>
                        </div>
                    )}

                    {newPassword && (
                    <div className="animate-in fade-in slide-in-from-top-1">
                        <label htmlFor="confirmPasswordInput" className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5 cursor-pointer">Confirm Password</label>
                        <div className="relative">
                        <input 
                            id="confirmPasswordInput"
                            type={showPassword ? "text" : "password"} 
                            className={`w-full bg-white border px-4 py-3 rounded-xl text-sm outline-none transition-all pr-10 shadow-sm text-zinc-900 placeholder:text-gray-400 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/30' : 'border-gray-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20'}`}
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="Retype new password" 
                        />
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-[10px] text-red-500 mt-1.5 font-medium">Passwords do not match</p>
                        )}
                    </div>
                    )}
                </div>
                </div>
            )}

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={saving} 
                    className="w-full bg-zinc-900 text-white p-3.5 rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                {saving ? <Loader2 size={16} className="animate-spin"/> : 'Save Changes'}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
}