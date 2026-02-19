import React, { useState } from 'react';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function UpdatePasswordForm({ onComplete }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated. Please log in with your new password.");
      await supabase.auth.signOut(); 
      onComplete(); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in fade-in zoom-in">
        <div className="flex justify-center mb-6 text-zinc-900"><Lock size={32} strokeWidth={1.5} /></div>
        <h2 className="text-lg font-semibold text-center mb-2 text-zinc-900">Set New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
             <div className="relative">
               <input 
                 type={showPassword ? "text" : "password"} 
                 required 
                 className="w-full border border-gray-200 p-2.5 pr-10 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none text-sm" 
                 minLength={6} 
                 value={password} 
                 onChange={e => setPassword(e.target.value)} 
               />
               <button 
                 type="button" 
                 onClick={() => setShowPassword(!showPassword)} 
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
               >
                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
           </div>
           <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-2.5 rounded-lg hover:bg-zinc-800 transition font-medium text-sm flex items-center justify-center gap-2">
             {loading && <Loader2 size={16} className="animate-spin"/>} Update
           </button>
        </form>
      </div>
    </div>
  );
}