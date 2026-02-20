import React, { useState } from 'react';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export default function UpdatePasswordForm({ onComplete }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password Strength Logic
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

  const strengthScore = calculateStrength(password);
  const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  const strengthLabels = ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully. Please log in with your new password.");
      await supabase.auth.signOut(); 
      onComplete(); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Floating Card container matching Login.jsx */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-8 sm:p-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Decorative Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400"></div>

        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-emerald-50/50 text-emerald-600 mb-5 shadow-inner border border-emerald-100/50 transition-transform hover:scale-105 duration-300">
            <Lock size={32} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Secure Your Account</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Create a strong new password to continue.</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
             <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">New Password</label>
             <div className="relative mb-2">
               <input 
                 type={showPassword ? "text" : "password"} 
                 required 
                 className="w-full bg-gray-50 border border-gray-200 p-3.5 pr-12 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 font-medium text-zinc-900 shadow-sm" 
                 placeholder="Enter at least 6 characters" 
                 minLength={6} 
                 value={password} 
                 onChange={e => setPassword(e.target.value)} 
               />
               <button 
                 type="button" 
                 onClick={() => setShowPassword(!showPassword)} 
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
               >
                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>

             {/* Password Strength Meter */}
             {password && (
                 <div className="animate-in fade-in slide-in-from-top-1 px-1">
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
           </div>

           <button 
               type="submit" 
               disabled={loading || (password && password.length < 6)} 
               className="w-full bg-zinc-900 text-white p-3.5 rounded-xl hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98] transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100 mt-2"
           >
             {loading && <Loader2 size={18} className="animate-spin"/>} Update Password
           </button>
        </form>
      </div>
    </div>
  );
}