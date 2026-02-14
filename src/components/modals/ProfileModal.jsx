import React, { useState, useEffect } from 'react';
import { UserCog, X, Building, MessageSquare, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// Added 'export default'
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

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; 
  };

  const passwordStrength = getPasswordStrength(newPassword);
  
  const getStrengthColor = (score) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 shadow-xl rounded-xl w-full max-w-md animate-in fade-in zoom-in overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2"><UserCog size={20}/> {isSelf ? "Edit Profile" : "Edit User"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-zinc-900 transition"><X size={20}/></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2 font-medium text-zinc-900"><Building size={14}/> {profile.facility_name || 'N/A'}</div>
            <div className="flex items-center gap-2 mt-2 text-gray-500"><MessageSquare size={14}/> {profile.email}</div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name</label><input type="text" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={profile.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="e.g. Juan Dela Cruz" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1.5">Designation</label><input type="text" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={profile.designation || ''} onChange={e => setProfile({...profile, designation: e.target.value})} placeholder="e.g. Nurse II" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1.5">Contact Number</label><input type="text" className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" value={profile.contact_number || ''} onChange={e => setProfile({...profile, contact_number: e.target.value})} placeholder="e.g. 0917..." /></div>
          
          {isSelf && (
             <div className="pt-4 mt-4 border-t border-gray-100">
               <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2"><Lock size={14}/> Change Password</h3>
               <div className="space-y-3">
                 <div className="relative">
                   <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                   <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="Leave blank to keep current" 
                   />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-7 text-gray-400 hover:text-gray-600">
                     {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                   </button>
                 </div>
                 
                 {newPassword && (
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`} style={{ width: `${(passwordStrength / 5) * 100}%` }}></div>
                    </div>
                 )}

                 {newPassword && (
                   <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                     <input 
                        type="password" 
                        className={`w-full bg-white border p-2.5 rounded-lg text-sm focus:ring-2 outline-none transition ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-zinc-900'}`}
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="Retype new password" 
                     />
                   </div>
                 )}
               </div>
             </div>
          )}

          <button type="submit" disabled={saving} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition font-medium mt-4 flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin"/> : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}